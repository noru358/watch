# 🎨 Gate 1 그림 명세 (제미나이용)

← [아트 모듈](art.md) · 2026-10-25. 주인공 명세는 [director-sprite-spec.md](director-sprite-spec.md).

## 쓰는 법
- 대화를 시작할 때 **주인공 1차 시트**(`img/gemini/sheet-v1.webp`)를 그림체 기준으로 같이 첨부한다. 모든 그림이 그 시트와 같은 픽셀 굵기·외곽선·색감이어야 한다.
- 아래 "공통 규칙"을 한 번 붙여 넣고, 그다음 그림마다 프롬프트를 하나씩 보낸다(한 번에 하나).
- 받은 그림은 `tools/spritekit/clean_sheet.py`로 정리해서 넣는다. 배경이 단색 분홍이어야 깨끗하게 지워진다.

## 우선순위
1. 활자귀 「미발송」(보스): 지금 도형이라 가장 티가 남
2. 지하철 망령: 지금 도형
3. 처녀귀신·달걀귀신·도깨비불: 지금 제 견본(픽셀이 주인공보다 굵음)을 같은 굵기로
4. 신문지 사인검(감싼 칼·드러난 칼)
5. 바닥·벽 타일과 소품

## 공통 규칙 (먼저 한 번 붙여 넣기)

```
We are making pixel-art sprites for a top-down action game set in a fantasy version of Seoul at night (urban folklore ghosts, comedic tone). The attached sprite sheet is the STYLE MASTER: match its pixel size, outline thickness, shading and color mood exactly.
Rules for every image I ask for:
- Background: one flat solid color #FF00FF everywhere. No checkerboard, no gradient, no shadow on the background.
- Pixel grid: draw at the stated art size, then upscale by exactly 8x with nearest neighbor (each art pixel = one 8x8 block). No anti-aliasing, no blur, no noise.
- 1px near-black outline around every shape. 2-3 shades per material. Light from the top-left.
- No text, no UI, no effects unless I ask for them.
- Frames are laid out left to right in one row per animation, each frame in its own equal-size cell.
- Characters face RIGHT (3/4 view, the same angle as the attached sheet). The game mirrors them for left.
```

## 1. 보스: 활자귀 「미발송」 (64×64)

```
Boss sprite, art size 64x64 per frame.
Character: "Hwalja-gwi", a hunched giant ghost made of stacked paper sheets and old lead printing type (small metal letter blocks). A large printing-press roller is embedded in its chest and turns. Its face is a newspaper front page whose headline letters keep changing (draw it as blocky unreadable black lettering on cream paper). Ink drips from its arms. Colors: cream and yellowed paper (#efe6cc, #cbb98f), lead gray (#6b6878, #4a4658), black ink (#141018), a few red ink stamps (#c94a5a).
Rows:
1. idle, 2 frames: slow breathing, paper edges fluttering.
2. roller windup, 1 frame: leans forward, chest roller glowing faintly.
3. press slam, 2 frames: windup with both arms raised as a printing plate, then slammed down.
4. summon, 1 frame: holds up an unsent wedding invitation that glows.
5. phase 2 idle, 2 frames: same pose as idle but the paper is tinted neon pink (#ff3cac) and the headline is a big red "EXTRA" mark.
6. defeated, 1 frame: collapsed into a pile of paper with letters scattering.
```

## 2. 지하철 망령 (32×32)

```
Enemy sprite, art size 32x32 per frame.
Character: the ghost of the last subway train, a small floating head-and-shoulders shape like the front of an old Seoul subway car (rounded front, two round headlights as eyes, a dark window as a mouth), trailing a faint ghostly body. Colors: subway silver-blue (#7fb7ff, #4a6fa8), headlights warm yellow (#fff3b0), outline dark.
Rows:
1. idle float, 2 frames.
2. dash windup, 1 frame: crouched low, headlights blazing bright.
3. dashing, 1 frame: stretched horizontally with speed blur drawn as 2-3 solid pixel streaks behind it.
4. hurt, 1 frame.
```

## 3. 처녀귀신 (32×32)

```
Enemy sprite, art size 32x32 per frame.
Character: Korean maiden ghost (cheonyeo-gwisin): white hanbok-like burial dress, very long straight black hair hanging over the face so only a pale chin shows, floating with no visible feet. Colors: white dress (#f2f2ff, shadow #b9bde4), black hair (#1a1424), pale skin (#e9e6f5).
Rows:
1. float, 2 frames.
2. attack windup, 1 frame: hair lifts and spreads like a fan.
3. attack, 1 frame: lunges forward, hair whipping ahead.
4. hurt, 1 frame.
```

## 4. 달걀귀신 (32×32)

```
Enemy sprite, art size 32x32 per frame.
Character: Korean egg ghost (dalgyal-gwisin): a faceless round egg-shaped head with a small ghostly body under it, no eyes, no mouth, a little unsettling but cute. Colors: egg white (#f4f0d8, shadow #c9c2a2), faint gray body.
Rows:
1. float, 2 frames.
2. slam windup, 1 frame: rises up, stretched tall.
3. slam, 1 frame: squashed flat on the ground.
4. hurt, 1 frame.
```

## 5. 도깨비불 (16×16)

```
Small enemy sprite, art size 16x16 per frame.
Character: a will-o'-the-wisp (dokkaebi fire): a blue flame with two tiny dark dot eyes, cute. Colors: deep blue edge (#1b3b80), blue (#3a9cf0), light cyan (#9fe6ff), white core.
Row 1: flicker, 3 frames.
```

## 6. 신문지 사인검 (8×24)

```
Weapon sprite, art size 8x24 per frame, pointing straight UP (the game rotates it).
Rows:
1. wrapped: a Korean sword fully wrapped in old newspaper and tape, wooden handle at the bottom. Colors: newspaper (#e2d9b8, #b0a684), print lines (#7b7262), handle (#5a3a2a).
2. bare: the same sword unwrapped, a glowing pale cyan blade (#9ff3e6, white core) with torn newspaper strips still hanging near the handle.
```

## 7. 바닥·벽 타일 (24×24)

```
Tileset, each tile 24x24 art pixels, top-down 3/4 view, location: the basement of an old printing shop in Euljiro, Seoul, at night. Tiles must repeat seamlessly.
Row 1: concrete floor, 3 variants (plain, with a crack, with an oil stain).
Row 2: floor with scattered printed paper sheets, 2 variants.
Row 3: wall top (dark), 1 tile; wall front face, 2 variants (gray plaster upper part, green waterproof paint lower part; one with an exposed pipe, one with a taped flyer).
Colors: floor purple-gray concrete (#575070, #4f4866), wall paint green (#3f7a5c), plaster (#8f8aa0).
```

## 8. 소품 (크기는 각각)

```
Prop sprites for the same printing-shop basement, one per cell:
1. old letterpress printing machine, 48x48.
2. stack of paper bundles tied with string, 24x24.
3. shelf of lead type cases (small wooden drawers full of metal letters), 48x32.
4. red plastic stool (Korean street-food style), 16x16.
5. outdoor air-conditioner unit, 24x24.
6. Korean public payphone (blue booth), 24x32.
7. metal stairs going down (floor exit), 24x24.
```
