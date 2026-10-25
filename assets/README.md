# assets

| 폴더 | 내용 |
|------|------|
| `source/` | 원본. AI(제미나이 등)나 외주에서 받은 그대로의 그림. 지우지 않고 보관한다(다시 정리할 때 출발점). 파일 이름에 대상·버전, 쓰지 않기로 한 건 `-rejected`. |
| `sprites/` | 게임이 실제로 쓰는 그림. `tools/spritekit/clean_sheet.py`로 원본을 정리한 결과(투명 배경, 정확한 픽셀 격자, 공용 팔레트). 폴더 하나 = 원본 한 장. |

지금 들어 있는 것:
- `source/gemini/director-sheet-v1.png` — 주인공 1차(사용 중, 디자인 기준)
- `source/gemini/director-sheet-v2-rejected.png` — 주인공 2차(톤이 달라 폐기, 기록용)
- `sprites/director-gemini-v1/` — 1차를 정리한 프레임 22장 + `palette.txt`. 동작별 번호는 `src/data/sprites.data.ts`

새 그림을 받으면: 원본을 `source/<도구>/`에 넣고 → `python3 tools/spritekit/clean_sheet.py 원본 결과폴더` → 결과를 `sprites/<이름>/`에 → `src/data/sprites.data.ts`(또는 해당 그림 파일)에 연결.
