"""Pixel edits on a cleaned frame using its palette letters.

Helpers to load a frame as a letter grid (palette.txt order -> '0123456789abcdefghijklmn'),
patch rows/cells, and save it back. Used for hand fixes after clean_sheet.py.
"""
import numpy as np
from PIL import Image

CHARS = '0123456789abcdefghijklmn'


def load(path, palette_path):
    pal = [l.strip() for l in open(palette_path) if l.strip()]
    rgb = {tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)): CHARS[n] for n, h in enumerate(pal)}
    a = np.asarray(Image.open(path))
    grid = [[('.' if p[3] == 0 else rgb[tuple(p[:3])]) for p in row] for row in a]
    return grid, pal


def save(grid, pal, path):
    h, w = len(grid), len(grid[0])
    out = np.zeros((h, w, 4), 'uint8')
    for y in range(h):
        for x in range(w):
            ch = grid[y][x]
            if ch != '.':
                c = pal[CHARS.index(ch)]
                out[y, x] = [int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16), 255]
    Image.fromarray(out, 'RGBA').save(path)


def put(grid, y, x0, s):
    for i, ch in enumerate(s):
        grid[y][x0 + i] = ch
