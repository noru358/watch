"""Face fixes on cleaned director frames (user feedback 2026-10-25: eyes too sleepy, hurt face cries).

  python3 tools/spritekit/face_edit.py assets/sprites/director-gemini-v3

Run once on a freshly cleaned folder (clean_sheet.py output). Writes the frames in place and drops a
`face_edit.done` marker so a second run does nothing (the eye lift is not idempotent).

- open_eyes: wherever an iris pixel sits right under the dark lash line, the lash moves up one pixel
  and the iris grows into its old place (2 rows instead of 1), in the sheet's blue (#2d3f7a / #5b8ad6).
- HURT_EDITS: the crying '><' face becomes a squint with a closed, pressed mouth.
"""
import os
import sys

from PIL import Image


def hexc(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)


LASH, IRIS_DARK, IRIS_LIGHT = hexc('#1e212f'), hexc('#2d3f7a'), hexc('#5b8ad6')
SKIN, INK = hexc('#f3c3ae'), hexc('#0a0308')

EYE_FRAMES = [0, 7, 8, 9, 10, 11, 12]  # side-view frames with a visible face (walk reuses frame 0's head)
HURT_FRAME = 16
HURT_EDITS = {
    # remove the upper / lower strokes of '><' and the tear marks → two squint lines
    (11, 12): SKIN, (17, 12): SKIN, (12, 13): SKIN, (10, 14): SKIN, (16, 13): SKIN, (19, 13): SKIN, (19, 14): SKIN,
    # open crying mouth → pressed lips
    (13, 15): SKIN, (14, 15): SKIN, (15, 15): SKIN, (12, 16): SKIN, (13, 16): INK, (14, 16): INK, (15, 16): INK,
}


def is_iris(c):
    return c[3] >= 128 and c[2] > c[0] + 15 and c[2] >= c[1] + 5 and 60 < c[2] < 200


def is_lash(c):
    return c[3] >= 128 and max(c[:3]) < 60 and c[2] >= c[0]


def open_eyes(im):
    src = im.load()
    out = im.copy()
    dst = out.load()
    w, _ = im.size
    for y in range(8, 19):
        for x in range(w):
            if not is_iris(src[x, y]) or y < 2 or not is_lash(src[x, y - 1]):
                continue
            dst[x, y], dst[x, y - 1], dst[x, y - 2] = IRIS_LIGHT, IRIS_DARK, LASH
            for dx in (-1, 1):  # neighbouring lash pixels lift too, so the lid stays one line
                if 0 <= x + dx < w and is_lash(src[x + dx, y - 1]) and not is_iris(src[x + dx, y]):
                    dst[x + dx, y - 2] = LASH
    return out


def main(folder):
    marker = os.path.join(folder, 'face_edit.done')
    if os.path.exists(marker):
        print('already applied:', marker)
        return
    path = lambda n: os.path.join(folder, f'frame_{n:02d}.png')
    for n in EYE_FRAMES:
        open_eyes(Image.open(path(n)).convert('RGBA')).save(path(n))
    hurt = Image.open(path(HURT_FRAME)).convert('RGBA')
    px = hurt.load()
    for (x, y), c in HURT_EDITS.items():
        px[x, y] = c
    hurt.save(path(HURT_FRAME))
    open(marker, 'w').write('eyes: %s, hurt: %d\n' % (EYE_FRAMES, HURT_FRAME))
    print('done')


if __name__ == '__main__':
    main(sys.argv[1])
