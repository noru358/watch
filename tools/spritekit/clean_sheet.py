"""Clean an AI-generated pixel-art sheet into real game pixels.

python3 tools/spritekit/clean_sheet.py <sheet image> <out dir> [--colors 24] [--min-size 300]

1. Finds the art's pixel size and grid offset (the AI upscales unevenly, e.g. 4.9-5.2 px).
2. Resamples every block to one pixel (median colour), so blur and compression noise vanish.
3. Removes the painted background by flood fill from the image border (stops at the outline).
4. Finds each character as a connected blob (so frames that cross cell borders stay whole).
5. Builds one shared palette with k-means (farthest-point start keeps small hues like a blue
   lanyard) and maps every frame to it.
Writes frame_XX.png (tight crops, transparent), palette.txt and contact.png (6x preview).
Needs numpy and Pillow.
"""
import sys
from collections import deque
import numpy as np
from PIL import Image


def find_grid(img, box):
    x0, y0, x1, y1 = box
    best = None
    for step in np.arange(4.0, 8.01, 0.05):
        for ox in np.arange(0, step, 0.5):
            for oy in np.arange(0, step, 0.5):
                tot, n, y = 0.0, 0, y0 + oy
                while y + step < y1:
                    x = x0 + ox
                    while x + step < x1:
                        b = img[int(y) + 1:int(y + step) - 1, int(x) + 1:int(x + step) - 1]
                        if b.size:
                            tot += b.std(axis=(0, 1)).sum()
                            n += 1
                        x += step
                    y += step
                if n and (best is None or tot / n < best[0]):
                    best = (tot / n, step)
    return best[1]


def resample(img, step):
    h, w, _ = img.shape
    N, M = int(round(h / step)), int(round(w / step))
    sy, sx = h / N, w / M
    out = np.zeros((N, M, 3), int)
    for j in range(N):
        for i in range(M):
            b = img[int(j * sy) + 1:max(int(j * sy) + 2, int((j + 1) * sy) - 1),
                    int(i * sx) + 1:max(int(i * sx) + 2, int((i + 1) * sx) - 1)].reshape(-1, 3)
            out[j, i] = np.median(b, axis=0)
    return out


def is_key_magenta(p):
    # #FF00FF background and the pink fringe it leaves on anti-aliased edges
    r, g, b = int(p[0]), int(p[1]), int(p[2])
    return r - g > 70 and b - g > 70


def background(sm, tol=20):
    H, W, _ = sm.shape
    border = [sm[y, x] for y in (0, H - 1) for x in range(0, W, 7)] + [sm[y, x] for x in (0, W - 1) for y in range(0, H, 7)]
    tones = np.unique(np.array(border), axis=0)
    seen = np.zeros((H, W), bool)
    q = deque([(y, x) for y in range(H) for x in (0, W - 1)] + [(y, x) for x in range(W) for y in (0, H - 1)])
    while q:
        y, x = q.popleft()
        if seen[y, x] or np.abs(tones - sm[y, x]).sum(1).min() >= tol or sm[y, x].sum() < 60:
            continue
        seen[y, x] = True
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and not seen[ny, nx]:
                q.append((ny, nx))
    return seen


def blobs(fg, min_size):
    H, W = fg.shape
    lab = np.zeros((H, W), int)
    found, n = [], 0
    for y in range(H):
        for x in range(W):
            if fg[y, x] and not lab[y, x]:
                n += 1
                q, pts = deque([(y, x)]), []
                lab[y, x] = n
                while q:
                    cy, cx = q.popleft()
                    pts.append((cy, cx))
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < H and 0 <= nx < W and fg[ny, nx] and not lab[ny, nx]:
                            lab[ny, nx] = n
                            q.append((ny, nx))
                if len(pts) >= min_size:
                    ys, xs = zip(*pts)
                    found.append((n, min(ys), min(xs), max(ys), max(xs)))
    rowh = max(b[3] - b[1] for b in found) + 1
    found.sort(key=lambda b: (round(b[1] / rowh), b[2]))
    return lab, found


def kmeans(px, K, iters=25):
    rng = np.random.default_rng(1)
    cent = [px[rng.integers(len(px))]]
    for _ in range(K - 1):
        d = np.min([((px - c) ** 2).sum(1) for c in cent], axis=0)
        cent.append(px[d.argmax()])
    cent = np.array(cent, float)
    for _ in range(iters):
        a = np.argmin(((px[:, None, :] - cent[None]) ** 2).sum(2), 1)
        for k in range(K):
            if (a == k).any():
                cent[k] = px[a == k].mean(0)
    return cent.round().astype(int)


def main():
    src, out = sys.argv[1], sys.argv[2]
    K = int(sys.argv[sys.argv.index('--colors') + 1]) if '--colors' in sys.argv else 24
    min_size = int(sys.argv[sys.argv.index('--min-size') + 1]) if '--min-size' in sys.argv else 300
    img = np.asarray(Image.open(src).convert('RGB')).astype(int)
    h, w, _ = img.shape
    step = find_grid(img, (w // 3, h // 3, w // 3 + 160, h // 3 + 160))
    print('pixel size', round(step, 3))
    sm = resample(img, step)
    fg = ~background(sm)
    # a magenta key background also leaves pink fringe pixels on the outline: drop them all
    magenta = np.array([[is_key_magenta(p) for p in row] for row in sm])
    fg &= ~magenta
    lab, found = blobs(fg, min_size)
    px = np.concatenate([sm[lab == b[0]] for b in found]).astype(float)
    pal = kmeans(px, K)
    frames = []
    for i, (n, y0, x0, y1, x1) in enumerate(found):
        m = lab[y0:y1 + 1, x0:x1 + 1] == n
        a = sm[y0:y1 + 1, x0:x1 + 1]
        rgb = pal[np.argmin(((a[..., None, :] - pal[None, None]) ** 2).sum(3), 2)]
        im = Image.fromarray(np.dstack([rgb, np.where(m, 255, 0)]).astype('uint8'), 'RGBA')
        im.save(f'{out}/frame_{i:02d}.png')
        frames.append(im)
    with open(f'{out}/palette.txt', 'w') as f:
        f.write('\n'.join('#%02x%02x%02x' % tuple(c) for c in sorted(pal.tolist(), key=sum)))
    S, cw = 6, max(max(f.width, f.height) for f in frames)
    cols = 5
    rows = (len(frames) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * (cw * S + 10) + 10, rows * (cw * S + 10) + 10), (58, 52, 80, 255))
    for i, f in enumerate(frames):
        big = f.resize((f.width * S, f.height * S), Image.NEAREST)
        cx, cy = 10 + (i % cols) * (cw * S + 10), 10 + (i // cols) * (cw * S + 10)
        sheet.alpha_composite(big, (cx + (cw * S - big.width) // 2, cy + cw * S - big.height))
    sheet.save(f'{out}/contact.png')
    print(len(frames), 'frames')


if __name__ == '__main__':
    main()
