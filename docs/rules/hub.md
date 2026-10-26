# 🧮 사무소 허브 규칙

← [장부 목록](README.md) · 기획 이유: [허브](../design/4-day/hub.md)
계산 코드: `src/systems/hub/hub.ts`(걷기·E 범위·해금). 숫자: `src/data/lobby.data.ts`. 테스트: `tests/hub.test.ts`.

## 누가 언제 나타나나
사무소에서 E로 쓸 수 있는 자리는 해결한 의뢰 수(성공만 셈)가 정해진 값 이상일 때 나타난다(`unlockedSpots`).

| 자리 | 열리는 패널 | 나타나는 조건 | 위치 |
|------|-----------|-------------|------|
| 현관문 | 의뢰판·작전 지도 | 처음부터 | `HUB_SPOTS.door` |
| 경리 책상 | 장부·아침 보고 | 의뢰 1건 해결 | `HUB_SPOTS.bookkeeper` |

E는 주인공 발에서 1.6칸 안의 가장 가까운 열린 자리에 쓰인다(`reach`). 걷는 속도는 초당 4.5칸(`speed`).

이 "해결 n건이면 열림"은 임시다. 평판 등급이나 이야기 장으로 바꾸는 안은 [성장·시설](../design/3-growth/progression.md).
