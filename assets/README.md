# assets

| 폴더 | 내용 |
|------|------|
| `source/` | 원본. AI(제미나이 등)나 외주에서 받은 그대로의 그림. 지우지 않고 보관한다(다시 정리할 때 출발점). 파일 이름에 대상·버전, 쓰지 않기로 한 건 `-rejected`. |
| `sprites/` | 게임이 실제로 쓰는 그림. `tools/spritekit/clean_sheet.py`로 원본을 정리한 결과(투명 배경, 정확한 픽셀 격자, 공용 팔레트). 폴더 하나 = 원본 한 장. |

지금 들어 있는 것:
- `source/gemini/director-sheet-v1.png` — 주인공 1차(사용 중, 디자인 기준)
- `source/gemini/director-sheet-v2-rejected.png` — 주인공 2차(톤이 달라 폐기, 기록용)
- `source/gemini/director-sheet-v3-extra.png` — 주인공 추가 프레임(빈손 서 있기·걷기·베기·발도·피격, 사용 중)
- `sprites/director-gemini-v1/` — 1차를 정리한 프레임 22장 + `palette.txt`(지금은 쓰러짐 21번만 사용)
- `sprites/director-gemini-v3/` — 추가 프레임 정리본 17장 + 얼굴 손보기(`tools/spritekit/face_edit.py`, 눈 뜨게·피격 찡그림) 적용됨. 동작별 번호는 `src/data/sprites.data.ts`

- `master/director-master.png` — 주인공 마스터 한 장(`v3:0`을 32×36 캔버스에 발 맞춰 옮김, `@8x`는 확대본). 동작 프레임은 이걸 고쳐서 만든다 → [그림 작업 절차](../docs/design/5-business/art-pipeline.md)
- `palette/master.gpl` — 프로젝트 고정 팔레트(지금 26색, 32색까지). 에디터에서 Indexed 모드로 불러와 쓴다.

새 그림을 받으면: 원본을 `source/<도구>/`에 넣고 → `python3 tools/spritekit/clean_sheet.py 원본 결과폴더` → 결과를 `sprites/<이름>/`에 → `src/data/sprites.data.ts`(또는 해당 그림 파일)에 연결.
