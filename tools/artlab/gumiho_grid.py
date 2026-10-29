"""Gumiho pixel grid generator (2026-10-25). Builds the letter grid used in
src/scenes/rift/draw/art/ghostArt.ts (GUMIHO_ROWS): a fan of nine tails with fox fire, then a chibi
white fox in front, each layer outlined separately so the head reads against the tails.

  python3 tools/artlab/gumiho_grid.py <out dir>   → <out dir>/fox.png (12x preview + 2x) and rows.txt
"""
import math, sys
from PIL import Image
W,H=32,28
canvas=[['.']*W for _ in range(H)]
def layer(): return [['.']*W for _ in range(H)]
def put(L,x,y,c):
    x,y=int(round(x)),int(round(y))
    if 0<=x<W and 0<=y<H: L[y][x]=c
def outline(L):
    out=[r[:] for r in L]
    for y in range(H):
        for x in range(W):
            if L[y][x]=='.' and any(0<=x+dx<W and 0<=y+dy<H and L[y+dy][x+dx] not in '.fF' for dx,dy in ((1,0),(-1,0),(0,1),(0,-1))):
                out[y][x]='O'
    return out
def comp(L):
    for y in range(H):
        for x in range(W):
            if L[y][x]!='.': canvas[y][x]=L[y][x]
def disk(L,cx,cy,rx,ry,c):
    for y in range(H):
        for x in range(W):
            if ((x+0.5-cx)/rx)**2+((y+0.5-cy)/ry)**2<=1: L[y][x]=c
# --- tail fan: 9 rounded tails on an arc behind the fox
T=layer(); cx,cy=13.5,17
R=10.5
tips=[]
for i in range(9):
    a=math.radians(180+i*22.5)
    tips.append((cx+math.cos(a)*R, cy+math.sin(a)*R*0.95, a))
for y in range(H):
    for x in range(W):
        dx,dy=x+0.5-cx,(y+0.5-cy)/0.95
        if dy<=1 and dx*dx+dy*dy<=(R-1.2)**2: T[y][x]='W'
for tx,ty,a in tips: disk(T,tx,ty,2.3,2.3,'W')
# dividers between tails (shade lines from the centre outwards)
for i in range(8):
    a=math.radians(180+i*22.5+11.25)
    for k in range(30):
        r=4+k*0.25
        if r>R-0.5: break
        put(T,cx-0.5+math.cos(a)*r, cy-0.5+math.sin(a)*r*0.95,'w')
comp(outline(T))
# flames on the tail tips (no outline)
for tx,ty,a in tips:
    fx,fy=tx+math.cos(a)*2.2-0.5, ty+math.sin(a)*2.2-0.5
    for dx,dy in [(0,0),(0,-1)]: put(canvas,fx+dx,fy+dy,'F')
    for dx,dy in [(-1,0),(1,0),(0,1),(-1,-1),(1,-1),(0,-2)]:
        xx,yy=int(round(fx+dx)),int(round(fy+dy))
        if 0<=xx<W and 0<=yy<H and canvas[yy][xx] in '.O': canvas[yy][xx]='f'
# --- the fox: chibi, big head turned right, small sitting body
F=layer()
disk(F,14,22,5,4.5,'W')                       # body
for y in range(22,27):                          # shade under the belly / back leg
    for x in range(W):
        if F[y][x]=='W' and y>=24: F[y][x]='w'
for px_ in (12,16):                              # front paws
    for y in (25,26):
        put(F,px_,y,'W'); put(F,px_+1,y,'W')
disk(F,17,14,6,5,'W')                          # head
for y in range(H):
    for x in range(W):
        if F[y][x]=='W' and 16<=y<=18 and x<=14: F[y][x]='w'
for k in range(4):                              # ears
    w=3-k
    for dx in range(w): put(F,12+dx+k*0.3,9-k,'W'); put(F,19+dx+k*0.3,9-k,'W')
put(F,13,8,'p'); put(F,20,8,'p'); put(F,13,9,'p'); put(F,20,9,'p')
for x in range(21,26): put(F,x,15,'W'); put(F,x,16,'W' if x<24 else 'w')   # snout
put(F,25,14,'k'); put(F,25,15,'k')
put(F,16,13,'E'); put(F,17,13,'E'); put(F,20,13,'E'); put(F,21,13,'E')   # narrow glowing eyes
put(F,15,12,'k'); put(F,22,12,'k')
put(F,16,15,'r'); put(F,21,16,'r')                    # red markings
comp(outline(F))
rows=[''.join(r) for r in canvas]
while set(rows[0])=={'.'}: rows.pop(0)
while set(rows[-1])=={'.'}: rows.pop()
l=min(len(r)-len(r.lstrip('.')) for r in rows); rr=max(len(r.rstrip('.')) for r in rows)
rows=[r[l:rr] for r in rows]
print(len(rows[0]),len(rows))
pal={'O':0x2b1e2f,'W':0xf4f1ff,'w':0xc4c0dc,'p':0xe8a0b8,'E':0x6fe3ff,'F':0xe8fbff,'f':0x6fe3ff,'k':0x1a1424,'r':0xd8506a}
im=Image.new('RGBA',(len(rows[0]),len(rows)))
for y,r in enumerate(rows):
    for x,c in enumerate(r):
        if c in pal: v=pal[c]; im.putpixel((x,y),((v>>16)&255,(v>>8)&255,v&255,255))
bg=Image.new('RGBA',(im.width*12+40+im.width*2+20,im.height*12+40),(79,72,102,255))
bg.alpha_composite(im.resize((im.width*12,im.height*12),Image.NEAREST),(20,20))
bg.alpha_composite(im.resize((im.width*2,im.height*2),Image.NEAREST),(im.width*12+40,20))
bg.save(sys.argv[1]+'/fox.png')
open(sys.argv[1]+'/rows.txt','w').write('\n'.join(rows))
