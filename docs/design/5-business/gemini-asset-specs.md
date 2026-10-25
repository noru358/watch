# 🎨 Gate 1 그림 명세 (제미나이용)

← [아트 모듈](art.md) · 2026-10-25. 주인공 명세는 [director-sprite-spec.md](director-sprite-spec.md).

## 쓰는 법
- 대화를 시작할 때 **주인공 1차 시트**(`assets/source/gemini/director-sheet-v1.png`)와 **게임 스크린샷 한 장**(주인공·귀신·바닥이 같이 보이는 화면)을 그림체 기준으로 같이 첨부한다. 첫 시도(지하철 망령·처녀귀신·칼)는 비율(8등신), 픽셀 굵기(더 잘음), 색(밝은 스티커 톤)이 따로 놀아서 이 세 조건을 공통 규칙에 넣었다. 모든 그림이 그 시트와 같은 픽셀 굵기·외곽선·색감이어야 한다.
- 아래 "공통 규칙"을 한 번 붙여 넣고, 그다음 그림마다 프롬프트를 하나씩 보낸다(한 번에 하나).
- 받은 원본은 `assets/source/gemini/`에 보관하고, `tools/spritekit/clean_sheet.py`로 정리해서 `assets/sprites/`에 넣는다(→ `assets/README.md`). 배경이 단색 분홍이어야 깨끗하게 지워진다.

## 우선순위
0. 주인공 추가 프레임(아래 0번): 공격·발도 자세가 없어서 휘두를 때 몸이 안 움직임
1. 구미호 「월하」(보스): 지금 임시 도형이라 가장 티가 남
2. 지하철 망령: 지금 도형
3. 처녀귀신·달걀귀신·도깨비불: 지금 제 견본(픽셀이 주인공보다 굵음)을 같은 굵기로
4. 신문지 사인검(감싼 칼·드러난 칼)
5. 바닥·벽 타일과 소품

## 공통 규칙 (먼저 한 번 붙여 넣기)

```
We are making pixel-art sprites for a top-down action game set in a fantasy version of Seoul at night (urban folklore ghosts, comedic tone). Two images are attached: (1) the main character's sprite sheet, the STYLE MASTER, and (2) a screenshot of the game.
Everything you draw must look like it was made by the same artist as (1) and belongs in (2):
- the same chibi proportions as the main character (big head, about 2 heads tall), never realistic tall proportions;
- the same pixel size (one art pixel as big as the main character's pixels), not finer;
- muted, slightly desaturated colors that fit the dark purple night of the screenshot, not bright sticker-like colors or smooth gradients.
Rules for every image I ask for:
- Background: one flat solid color #FF00FF everywhere. No checkerboard, no gradient, no shadow on the background.
- Pixel grid: draw at the stated art size, then upscale by exactly 8x with nearest neighbor (each art pixel = one 8x8 block). No anti-aliasing, no blur, no noise.
- 1px near-black outline around every shape. 2-3 shades per material. Light from the top-left.
- No text, no UI, no effects unless I ask for them.
- Frames are laid out left to right in one row per animation, each frame in its own equal-size cell.
- Characters face RIGHT (3/4 view, the same angle as the attached sheet). The game mirrors them for left.
```

## 0. 주인공 추가 프레임 (32×32, 1차 시트 기준)
1차 시트(`assets/source/gemini/director-sheet-v1.png`)를 반드시 첨부. 디자인은 1차 그대로 두고, 빠진 프레임만 받는다. 오른쪽을 보는 그림만(왼쪽은 게임이 뒤집음). 자세한 배경은 [주인공 명세](director-sprite-spec.md) 15번.

```
Use the attached sprite sheet as the master design for this character. Keep the face, hair, outfit, colors, outline and proportions exactly the same. Draw only the right-facing view (the same angle as the attached front frames). No weapon in her hands (the game draws the sword separately), no effects.
Art size 32x32 per frame, laid out one row per animation:
Row 1 - idle, 2 frames: standing with EMPTY hands, 1px breathing difference, hair tips swaying slightly.
Row 2 - walk, 4 frames: legs alternating, hair swinging with the steps.
Row 3 - attack, 2 frames: (a) right arm pulled back at shoulder height, (b) right arm swung forward and extended, body leaning into the swing.
Row 4 - draw stance (iaido), 2 frames: (a) crouched low, left hand at the hip as if holding a sheath, right hand near the hip, eyes sharp; (b) explosive forward lunge, right arm extended far forward, hair and jacket blown back.
Row 5 - hurt, 1 frame: flinching backward.
```

## 1. 보스: 구미호 「월하」 (64×64)

```
Boss sprite, art size 64x64 per frame.
Character: "Wolha", a nine-tailed fox spirit (gumiho). A slender white fox with nine long tails fanned out behind it like a peacock fan, each tail tip burning with a small blue fox-fire. Elegant and a little sleepy-looking (half-lidded red eyes), but clearly dangerous. The fanned tails must make a strong, readable silhouette even when small. Colors: white fur (#f4f1ff, shadow #b9bde4), fox-fire cyan (#6fe3ff, white core), eyes red (#e04a5a), outline dark.
Rows:
1. idle, 2 frames: tails sway slightly, fire tips flicker.
2. tail sweep windup, 1 frame: all nine tails pulled to one side, fire tips flaring.
3. tail sweep, 1 frame: tails swung across in a wide arc.
4. pounce, 2 frames: crouch low, then leap forward with front paws extended.
5. summon, 1 frame: tails raised, scattering small blue flames.
6. phase 2 idle, 2 frames: same as idle but the fire tips are neon pink (#ff3cac) and the fur glows faintly pink.
7. defeated, 1 frame: curled up asleep, tails wrapped around itself, fires out.
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
Tileset, each tile 24x24 art pixels, top-down 3/4 view, location: an old underground shopping arcade in a fantasy Seoul at night, half the lights dead. Tiles must repeat seamlessly.
Row 1: worn floor tiles, 3 variants (plain, cracked, with a puddle).
Row 2: floor with litter (flyers, a crushed can), 2 variants.
Row 3: wall top (dark), 1 tile; wall front face, 2 variants (one with a closed metal shutter, one with a peeling poster).
Colors: muted purple-gray floor (#575070, #4f4866), shutter blue-gray, a little green paint (#3f7a5c).
```

## 8. 소품 (크기는 각각)

```
Prop sprites for the same night setting, one per cell:
1. dead streetlight (bent lamp post), 16x48.
2. glowing street sign box with a blank face (we add text in game), 32x16.
3. stack of cardboard boxes, 24x24.
4. red plastic stool (Korean street-food style), 16x16.
5. outdoor air-conditioner unit, 24x24.
6. Korean public payphone (blue booth), 24x32.
7. metal stairs going down (floor exit), 24x24.
```
