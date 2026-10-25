# Sprite kit

AI(제미나이 등)가 만든 픽셀아트 시트를 게임에 쓸 수 있는 진짜 픽셀로 정리하는 도구.

```
pip3 install numpy pillow
python3 tools/spritekit/clean_sheet.py 시트.png 결과폴더
```

하는 일: 들쭉날쭉한 픽셀 크기를 찾아 한 칸 = 한 픽셀로 되돌림 → 흐림·압축 잡티 제거 → 칠해진 배경을 외곽선 바깥에서부터 지움 → 캐릭터를 덩어리 단위로 잘라냄(칸 경계에 걸쳐도 안 잘림) → 모든 프레임이 같은 24색 팔레트를 쓰게 정리. 결과: `frame_XX.png`(투명 배경), `palette.txt`, `contact.png`(확대 미리보기). 1024px 시트 기준 1~2분.

배경은 단색(예: #FF00FF)으로 받으면 가장 깨끗하다. 캐릭터 옷 색과 비슷한 어두운 배경은 몸까지 지워질 수 있다.

## 얼굴 손보기 (`face_edit.py`)

```
python3 tools/spritekit/face_edit.py assets/sprites/director-gemini-v3
```

주인공 v3 프레임의 졸린 눈을 1px 뜨게(속눈썹 줄을 한 칸 올리고 홍채를 2줄로) 하고, 피격 프레임의 우는 얼굴(><, 벌린 입)을 찡그린 얼굴로 바꾼다(2026-10-25 피드백). 정리 직후의 폴더에 한 번만 돌린다. 두 번 돌려도 `face_edit.done` 표시 파일이 있으면 아무것도 안 한다.
