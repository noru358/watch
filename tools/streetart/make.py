"""노포 골목 소품·간판 도트 (src/scenes/rift/draw/art/streetArt.ts 를 만든다).

그림 1픽셀 = 게임 1픽셀(바닥 한 칸 24px). 모양은 사각형·선 몇 개로 만들고, 바깥 외곽선은
마지막에 한 번에 두른다(따뜻한 검정 O). 색은 그림마다 12색 안(artSpec.data.ts 'prop').

다시 뽑기 (저장소 폴더에서):
    python3 tools/streetart/make.py
미리보기는 tools/streetart/preview.png (8배, 어두운 바닥 위).
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT_TS = os.path.join(ROOT, 'src', 'scenes', 'rift', 'draw', 'art', 'streetArt.ts')
OUT_PNG = os.path.join(HERE, 'preview.png')

O = 0x2B1E2F  # warm dark outline (same as the payphone)


class Pic:
    def __init__(self, w: int, h: int):
        self.w, self.h = w, h
        self.px: list[list[int | None]] = [[None] * w for _ in range(h)]

    def put(self, x: int, y: int, c: int | None) -> None:
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[y][x] = c

    def rect(self, x: int, y: int, w: int, h: int, c: int | None) -> 'Pic':
        for j in range(y, y + h):
            for i in range(x, x + w):
                self.put(i, j, c)
        return self

    def hline(self, x: int, y: int, w: int, c: int) -> 'Pic':
        return self.rect(x, y, w, 1, c)

    def vline(self, x: int, y: int, h: int, c: int) -> 'Pic':
        return self.rect(x, y, 1, h, c)

    def disc(self, cx: float, cy: float, r: float, c: int) -> 'Pic':
        for j in range(self.h):
            for i in range(self.w):
                if (i + 0.5 - cx) ** 2 + (j + 0.5 - cy) ** 2 <= r * r:
                    self.put(i, j, c)
        return self

    def outline(self, c: int = O) -> 'Pic':
        """1px outline around every opaque pixel that touches transparency (outside only)."""
        add = []
        for j in range(self.h):
            for i in range(self.w):
                if self.px[j][i] is not None:
                    continue
                for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    a, b = i + di, j + dj
                    if 0 <= a < self.w and 0 <= b < self.h and self.px[b][a] is not None and self.px[b][a] != c:
                        add.append((i, j))
                        break
        for i, j in add:
            self.px[j][i] = c
        return self

    def colours(self) -> list[int]:
        seen: list[int] = []
        for row in self.px:
            for c in row:
                if c is not None and c not in seen:
                    seen.append(c)
        return seen


# ---------------------------------------------------------------- props

def stall() -> Pic:
    """포장마차: 주황 천막 지붕 + 앞 가림막 주름, 전구 둘, 스테인리스 조리대, 빨간 플라스틱 의자."""
    R, r, rr = 0xE8752E, 0xB8521F, 0x8A3A1A  # tarp light / stripe / shadow
    Y = 0xFFE08A  # bulb
    k = 0x3A2A3A  # dark inside
    M, m, mm = 0xC9CDD8, 0x8D92A3, 0x5E6274  # steel
    X, x = 0xD0473F, 0x9C2F33  # stool
    W = 0xF4F1E6  # menu card
    p = Pic(48, 36)
    # roof: a flat top band and a sloped front
    p.rect(3, 1, 42, 3, r)
    p.rect(1, 4, 46, 7, R)
    for i in range(1, 47, 6):  # vertical stripes on the tarp
        p.rect(i, 4, 3, 7, r)
    p.hline(1, 10, 46, rr)
    # scalloped valance
    for i in range(1, 47):
        if (i // 4) % 2 == 0:
            p.put(i, 11, R)
    # inside darkness under the roof
    p.rect(3, 11, 42, 12, k)
    # hanging bulbs
    for bx in (12, 35):
        p.vline(bx, 11, 3, mm)
        p.rect(bx - 1, 14, 3, 3, Y)
        p.put(bx, 17, mm)
    # a menu card hung inside
    p.rect(20, 13, 8, 6, W)
    p.hline(21, 15, 6, m)
    p.hline(21, 17, 4, m)
    # counter
    p.rect(2, 22, 44, 3, M)
    p.hline(2, 22, 44, W)
    p.rect(3, 25, 42, 7, m)
    for i in range(6, 44, 7):
        p.vline(i, 25, 7, mm)
    p.hline(3, 31, 42, mm)
    # legs
    p.rect(4, 32, 2, 3, mm)
    p.rect(42, 32, 2, 3, mm)
    # two plastic stools in front
    for sx in (13, 30):
        p.rect(sx, 30, 6, 2, X)
        p.rect(sx + 1, 32, 1, 3, x)
        p.rect(sx + 4, 32, 1, 3, x)
    return p.outline()


def press() -> Pic:
    """인쇄기: 무쇠 몸통, 롤러, 옆 바퀴, 위에 걸린 종이."""
    I, i_, ii = 0x4A5068, 0x353A4F, 0x6A7290  # iron
    G, g = 0x8D92A3, 0x5E6274  # roller steel
    Wh = 0xF4F1E6
    w2 = 0xC8C2B4
    rd = 0xB8423A  # red paint warning stripe
    p = Pic(48, 30)
    p.rect(2, 8, 44, 18, I)
    p.hline(2, 8, 44, ii)
    p.rect(2, 22, 44, 4, i_)
    # rollers across the top
    p.rect(6, 4, 30, 5, G)
    p.hline(6, 4, 30, 0xC9CDD8)
    p.hline(6, 8, 30, g)
    # sheet of paper feeding in
    p.rect(9, 1, 22, 4, Wh)
    p.hline(9, 4, 22, w2)
    # flywheel on the right side
    p.disc(40, 12, 6, g)
    p.disc(40, 12, 4, I)
    p.disc(40, 12, 1.5, G)
    for (a, b) in ((40, 7), (40, 17), (35, 12), (45, 12)):
        p.put(a, b, G)
    # warning stripe and a gauge
    p.rect(4, 18, 30, 2, rd)
    for k in range(4, 34, 4):
        p.rect(k, 18, 2, 2, 0x2B1E2F)
    p.rect(8, 11, 5, 4, 0xC9CDD8)
    p.put(10, 12, rd)
    # feet
    p.rect(3, 26, 4, 3, i_)
    p.rect(41, 26, 4, 3, i_)
    return p.outline()


def paper() -> Pic:
    """전단지 뭉치 둘: 노끈으로 묶인 종이 더미."""
    W, w, ww = 0xF4F1E6, 0xC8C2B4, 0x9C968A
    tw = 0xC4975A  # twine
    pk = 0xF08AB0  # pink flyer edge
    p = Pic(24, 18)
    for (x0, y0, h) in ((2, 6, 10), (12, 3, 13)):
        p.rect(x0, y0, 10, h, W)
        for j in range(y0 + 2, y0 + h, 2):
            p.hline(x0, j, 10, w)
        p.hline(x0, y0 + h - 1, 10, ww)
        p.vline(x0 + 9, y0, h, w)
        p.vline(x0 + 5, y0, h, tw)
        p.hline(x0, y0 + h // 2, 10, tw)
    p.rect(13, 3, 8, 1, pk)
    return p.outline()


def bags() -> Pic:
    """쓰레기 봉투 더미: 검은 봉투 셋, 묶은 매듭, 빛 받은 면."""
    B, b, hi = 0x2E2A3A, 0x1E1A28, 0x55506A
    kn = 0x3E3A4E
    p = Pic(24, 18)
    p.disc(7, 11, 6, B)
    p.disc(16, 11.5, 6.5, b)
    p.disc(12, 7, 5, B)
    for (cx, cy) in ((12, 2), (7, 5), (17, 5)):
        p.rect(cx - 1, cy, 2, 2, kn)
    p.hline(4, 9, 3, hi)
    p.hline(10, 5, 3, hi)
    p.hline(14, 10, 3, hi)
    p.put(15, 11, hi)
    return p.outline()


def lamp() -> Pic:
    """가로등: 콘크리트 받침, 기둥, 휜 팔, 노란 등."""
    P, p_, ph = 0x6C6878, 0x4A4658, 0x8D8C98
    L, l = 0xFFF0C0, 0xFFD27A
    C = 0x8A7F88
    p = Pic(16, 58)
    p.rect(4, 52, 8, 5, C)
    p.hline(4, 52, 8, 0xA59AA4)
    p.rect(7, 12, 3, 40, P)
    p.vline(7, 12, 40, ph)
    p.vline(9, 12, 40, p_)
    p.rect(7, 9, 7, 2, P)
    p.rect(8, 6, 2, 4, P)
    # the head hanging off the arm
    p.rect(9, 11, 6, 3, p_)
    p.rect(10, 14, 4, 2, L)
    p.hline(10, 15, 4, l)
    return p.outline()


def crates() -> Pic:
    """맥주 상자 더미: 초록·노랑 플라스틱 상자 둘, 칸살."""
    Gn, gn, gd = 0x3F9A5C, 0x2F7A47, 0x24603A
    Yl, yl = 0xE6C04A, 0xB89530
    p = Pic(24, 26)
    def crate(x0: int, y0: int, a: int, b: int, c: int) -> None:
        p.rect(x0, y0, 18, 11, a)
        p.hline(x0, y0, 18, b)
        for k in range(x0 + 2, x0 + 18, 4):
            p.rect(k, y0 + 2, 2, 5, c)
        p.hline(x0, y0 + 10, 18, c)
        p.rect(x0 + 6, y0 + 8, 6, 2, b)
    crate(3, 14, Gn, 0x56B873, gd)
    crate(4, 3, Yl, 0xF5D878, yl)
    p.hline(5, 14, 16, gn)
    return p.outline()


# ---------------------------------------------------------------- signs (neon on a wall face)
# Drawn as tubes: a bright core, the tube colour around it; the face behind stays the wall.

def sign(shape: list[str], tube: int) -> Pic:
    core = 0xFFFFFF
    h = len(shape)
    w = len(shape[0])
    p = Pic(w, h)
    for j, row in enumerate(shape):
        for i, ch in enumerate(row):
            if ch == '#':
                p.put(i, j, tube)
            elif ch == '*':
                p.put(i, j, core)
    return p


SIGN_SHAPES = {
    'cup': (0x4FE0D0, [
        '..#..#....',
        '.#..#.....',
        '..........',
        '#######...',
        '#*****####',
        '#*****#..#',
        '#*****####',
        '.#***#....',
        '..###.....',
    ]),
    'heart': (0xFF5FA8, [
        '.###.###.',
        '#***#***#',
        '#*******#',
        '.#*****#.',
        '..#***#..',
        '...#*#...',
        '....#....',
    ]),
    'open24': (0xFF6A4A, [
        '#####.#..#',
        '#**##.#**#',
        '...*#.#**#',
        '.##*..####',
        '#*....**.#',
        '#####....#',
    ]),
    'arrow': (0x7FB4FF, [
        '.......#...',
        '.......##..',
        '#######**#.',
        '#*******.*#',
        '#######**#.',
        '.......##..',
        '.......#...',
    ]),
}


# ---------------------------------------------------------------- output

def letters(p: Pic) -> tuple[list[str], dict[str, int]]:
    alphabet = 'OABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    pal: dict[int, str] = {}
    for c in p.colours():
        if c == O:
            pal[c] = 'O'
        else:
            pal[c] = alphabet[len([k for k in pal if k != O]) + 1]
    rows = [''.join('.' if c is None else pal[c] for c in row) for row in p.px]
    return rows, {v: k for k, v in pal.items()}


PROP_ART = {'stall': stall, 'press': press, 'paper': paper, 'bags': bags, 'lamp': lamp, 'crates': crates}


def ts_block(name: str, p: Pic) -> str:
    rows, pal = letters(p)
    pal_s = ', '.join(f"{k}: 0x{v:06x}" for k, v in pal.items())
    body = '\n'.join(f"    '{r}'," for r in rows)
    return f"  {name}: {{\n    scale: 1,\n    pal: {{ {pal_s} }},\n    rows: [\n{body}\n    ],\n  }},"


def main() -> None:
    props = {k: f() for k, f in PROP_ART.items()}
    signs = {k: sign(shape, tube) for k, (tube, shape) in SIGN_SHAPES.items()}
    for k, p in {**props, **signs}.items():
        n = len(p.colours())
        if n > 12:
            sys.exit(f'{k}: {n} colours (prop limit 12)')
    out = [
        '// 노포 골목 소품·간판 도트. tools/streetart/make.py 가 만든 파일 — 손으로 고치지 말고 스크립트를 고쳐 다시 뽑는다.',
        '// One letter = one pixel at 1:1 (a floor tile is 24px). A prop sprite stands on the bottom edge of its tiles.',
        "import type { GridArt } from './ghostArt';",
        "import type { PropArtId, SignArtId } from '../../../../data/districts.data';",
        '',
        'export const PROP_ART: Readonly<Record<PropArtId, GridArt>> = {',
        *[ts_block(k, p) for k, p in props.items()],
        '};',
        '',
        'export const SIGN_ART: Readonly<Record<SignArtId, GridArt>> = {',
        *[ts_block(k, p) for k, p in signs.items()],
        '};',
        '',
    ]
    with open(OUT_TS, 'w') as fh:
        fh.write('\n'.join(out))
    try:
        from PIL import Image
    except ImportError:
        return
    pics = list(props.values()) + list(signs.values())
    pad = 6
    W = sum(p.w for p in pics) + pad * (len(pics) + 1)
    H = max(p.h for p in pics) + pad * 2
    im = Image.new('RGB', (W, H), (0x45, 0x40, 0x4F))
    x = pad
    for p in pics:
        y0 = H - pad - p.h
        for j in range(p.h):
            for i in range(p.w):
                c = p.px[j][i]
                if c is not None:
                    im.putpixel((x + i, y0 + j), ((c >> 16) & 255, (c >> 8) & 255, c & 255))
        x += p.w + pad
    im.resize((W * 6, H * 6), Image.NEAREST).save(OUT_PNG)


if __name__ == '__main__':
    main()
