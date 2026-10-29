# 🎨 그림 프롬프트 모음 (Gemini·외주용)

← [아트 모듈](art.md) · 절차(누가·어떤 순서로)는 [그림 작업 절차](art-pipeline.md), 이 문서는 넣을 문장만 모은다. 2026-10-26 정리: 옛 「Gate 1 그림 명세」와 「주인공 스프라이트 명세」를 합쳤고, 그 두 문서의 결정 기록은 [아트 모듈](art.md) "지난 경위"로 줄였다.

## 쓰는 법
- 새 대화를 열고 **주인공 1차 시트**(`assets/source/gemini/director-sheet-v1.png`, 그림체 기준)와 **게임 스크린샷 한 장**(주인공·귀신·바닥이 같이 보이는 화면)을 파일로 첨부한다. 첫 시도(지하철 망령·처녀귀신·칼)가 비율(8등신)·픽셀 굵기(더 잘음)·색(밝은 스티커 톤)이 따로 놀아서, 이 셋을 아래 공통 규칙에 박아 두었다.
- 공통 규칙을 한 번 붙여 넣고, 그다음 그림 하나당 메시지 하나. 3~4번 뽑아 실루엣·비율이 제일 나은 것을 고른다.
- 받은 원본은 `assets/source/gemini/<대상>-v<번호>.png`(안 쓰는 건 `-rejected`), 정리는 `tools/spritekit/clean_sheet.py`(→ `assets/README.md`). 배경은 단색 분홍이어야 깨끗하게 지워진다.

## 공통 규칙 (먼저 한 번)
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

## 주인공
동작 프레임은 Gemini로 새로 뽑지 않고 마스터 한 장(`assets/master/director-master.png`)을 고쳐서 만든다([그림 작업 절차](art-pipeline.md)). Gemini에는 아래 두 가지만 맡긴다.

마스터를 다시 뽑아야 할 때(얼굴·비율이 마음에 안 들 때). 팔을 몸에서 떼고 다리를 벌리게 하는 이유는 부품으로 나눌 때 가려진 부분을 줄이려는 것:
```
Use the attached sheet as the master design. Draw ONE frame only: the character standing still, right-facing 3/4 view, empty hands, arms relaxed at the sides so the torso is fully visible, legs slightly apart with both feet flat on the same row. Art size 32x36, feet on the 3rd row from the bottom. Same face, hair, outfit, colours, outline and 2-head proportions as the sheet. Eyes calm and a little open (blue iris 2 px tall). No weapon, no effects.
```

자세 참고용 동작 시트(1차 + 3차 시트 첨부, 결과는 직접 쓰지 않고 마스터를 고칠 때 자세 참고로만):
```
Use the attached sheets as the master design. Keep face, hair, outfit, colors, outline and proportions exactly the same, with two face changes: the eyes are a little MORE OPEN (calm and cool, not sleepy: show the blue iris 2 pixels tall under the lash line), and when hurt she only FROWNS (squinted eyes, pressed lips, no tears, no open crying mouth).
Right-facing view only, empty hands (the game draws the sword), no effects. Art size 32x32 per frame, one row per animation:
Row 1 - combo hit 1 (forehand), 2 frames: (a) arm raised high behind the head, (b) arm swung down and forward across the body.
Row 2 - combo hit 2 (backhand), 2 frames: (a) arm low across the body on the far side, (b) arm swung up and out to the front, body turned.
Row 3 - combo hit 3 (finisher thrust), 3 frames: (a) crouch and pull the arm back at the hip, (b) deep lunge with the arm fully extended forward, (c) recovery, standing up.
Row 4 - back view (seen from behind, facing up-right), 3 frames: (a) standing, (b) arm swung forward/up, (c) walking.
Row 5 - hurt, 1 frame: flinching backward with a frown (see above).
```
몸 스프라이트에서는 크로스백·노리개·부적을 빼고(대화창 초상화에서 살림), 칼은 그리지 않는다(게임이 따로 그려 조준 방향으로 돌림).

## 보스: 구미호 (64×64)
지금은 몹 굵기 도트 한 장을 직접 그려 넣었다(`tools/artlab/gumiho_grid.py`). 패턴별 자세가 필요해지면:
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

## 지하철 망령 (32×32)
```
Enemy sprite, art size 32x32 per frame.
Character: the ghost of the last subway train, a small floating head-and-shoulders shape like the front of an old Seoul subway car (rounded front, two round headlights as eyes, a dark window as a mouth), trailing a faint ghostly body. Colors: subway silver-blue (#7fb7ff, #4a6fa8), headlights warm yellow (#fff3b0), outline dark.
Rows:
1. idle float, 2 frames.
2. dash windup, 1 frame: crouched low, headlights blazing bright.
3. dashing, 1 frame: stretched horizontally with speed blur drawn as 2-3 solid pixel streaks behind it.
4. hurt, 1 frame.
```

## 처녀귀신 (32×32)
```
Enemy sprite, art size 32x32 per frame.
Character: Korean maiden ghost (cheonyeo-gwisin): white hanbok-like burial dress, very long straight black hair hanging over the face so only a pale chin shows, floating with no visible feet. Colors: white dress (#f2f2ff, shadow #b9bde4), black hair (#1a1424), pale skin (#e9e6f5).
Rows:
1. float, 2 frames.
2. attack windup, 1 frame: hair lifts and spreads like a fan.
3. attack, 1 frame: lunges forward, hair whipping ahead.
4. hurt, 1 frame.
```

## 달걀귀신 (32×32)
```
Enemy sprite, art size 32x32 per frame.
Character: Korean egg ghost (dalgyal-gwisin): a faceless round egg-shaped head with a small ghostly body under it, no eyes, no mouth, a little unsettling but cute. Colors: egg white (#f4f0d8, shadow #c9c2a2), faint gray body.
Rows:
1. float, 2 frames.
2. slam windup, 1 frame: rises up, stretched tall.
3. slam, 1 frame: squashed flat on the ground.
4. hurt, 1 frame.
```

## 도깨비불 (16×16)
```
Small enemy sprite, art size 16x16 per frame.
Character: a will-o'-the-wisp (dokkaebi fire): a blue flame with two tiny dark dot eyes, cute. Colors: deep blue edge (#1b3b80), blue (#3a9cf0), light cyan (#9fe6ff), white core.
Row 1: flicker, 3 frames.
```

## 신문지 사인검 (8×24)
```
Weapon sprite, art size 8x24 per frame, pointing straight UP (the game rotates it).
Rows:
1. wrapped: a Korean sword fully wrapped in old newspaper and tape, wooden handle at the bottom. Colors: newspaper (#e2d9b8, #b0a684), print lines (#7b7262), handle (#5a3a2a).
2. bare: the same sword unwrapped, a glowing pale cyan blade (#9ff3e6, white core) with torn newspaper strips still hanging near the handle.
```

## 바닥·벽 타일 (24×24)
```
Tileset, each tile 24x24 art pixels, top-down 3/4 view, location: an old underground shopping arcade in a fantasy Seoul at night, half the lights dead. Tiles must repeat seamlessly.
Row 1: worn floor tiles, 3 variants (plain, cracked, with a puddle).
Row 2: floor with litter (flyers, a crushed can), 2 variants.
Row 3: wall top (dark), 1 tile; wall front face, 2 variants (one with a closed metal shutter, one with a peeling poster).
Colors: muted purple-gray floor (#575070, #4f4866), shutter blue-gray, a little green paint (#3f7a5c).
```

## 소품 (크기는 각각)
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
