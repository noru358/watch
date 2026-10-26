# 🧮 사무소 허브 규칙

← [장부 목록](README.md) · 기획 이유: [허브](../design/4-day/hub.md)
계산 코드: `src/systems/hub/hub.ts`(걷기·E 범위·해금), `src/systems/story/`(이야기 장면 순서). 숫자: `src/data/lobby.data.ts`, 대사·잡담 `src/data/story.data.ts`. 테스트: `tests/hub.test.ts`, `story.test.ts`.

## 누가 언제 나타나나
사무소에서 E로 쓸 수 있는 자리는 해결한 의뢰 수(성공만 셈)가 정해진 값 이상이고, 시설이 필요한 자리는 그 시설을 지었을 때 나타난다(`unlockedSpots`).

| 자리 | 열리는 패널 | 나타나는 조건 | 위치 |
|------|-----------|-------------|------|
| 현관문 | 의뢰판·작전 지도 | 처음부터 | `HUB_SPOTS.door` |
| 소장 책상 | 트레이닝·기술 | 처음부터 | `HUB_SPOTS.directorDesk` |
| 낡은 소파 | 휴식하기·자본 치료·진정제 | 처음부터 | `HUB_SPOTS.sofa` |
| 경리 책상 | 장부·아침 보고·시설 공사 | 의뢰 1건 해결 | `HUB_SPOTS.bookkeeper` |
| 부적 작업대 | 보급품 | 시설 공사로 설치한 뒤(가구도 그때 생긴다) | `HUB_SPOTS.bench`, `HUB_PROP_NEEDS` |

E는 주인공 발에서 1.6칸 안의 가장 가까운 열린 자리에 쓰인다(`reach`). 걷는 속도는 초당 4.5칸(`speed`).

이 "해결 n건이면 열림"은 임시다. 평판 등급이나 이야기 장으로 바꾸는 안은 [성장·시설](../design/3-growth/progression.md).

## 이야기 장면 (대화창)
사무소에 들어와 0.4초 뒤(`hubLook.data.ts` `sceneDelay`), 아직 안 본 장면 중 조건이 맞는 첫 장면 하나가 아래 대화창으로 나온다(`systems/story` `nextScene`). 한 번 본(또는 Esc로 건너뛴) 장면은 저장의 `seen`에 남아 다시 안 나온다.

| 장면 | 조건 | 대사 |
|------|------|------|
| `intro` | 처음 | 소장 혼잣말 3줄 |
| `bookkeeper` | 의뢰 1건 해결(경리 등장) | 경리 첫인사 3줄 |
| `lights_out_done` | 1장 끝 | 3줄 |
| `ch2_start` | 2장 시작(단서 모으기) | 4줄 |
| `ch2_ready` | 2장 단서 다 모임 | 3줄 |
| `ch2_done` | 2장 끝 | 3줄 |

장 장면(시작·준비·끝)은 `chapters.data.ts`의 `scenes`에서 자동으로 규칙이 된다([메인 스토리 장](story.md)). 같은 날 여러 장면이 걸리면 위 순서대로 하나씩, 사무소에 들어올 때마다 하나.

장면 추가 = `story.data.ts` `SCENES`에 줄 목록 + `ids.ts` `SceneId` + (장 장면이 아니면) `systems/story` 규칙 한 줄 + ko/en 대사.

## 월세 연출 (2026-10-27)
뒷벽 달력에 월세까지 남은 날("D-3", 전날은 빨간 "내일!"). 월세 전날 경리의 첫 잡담은 월세 귀띔(`RENT_TALK.reminder`). 월세 날 아침 사무소에 들어오면 0.9초 뒤 화면 위에 1층 집주인 할머니 문자가 6초(`src/app/toast.ts` `showPhoneText`, `ui/PhoneToast.tsx`): 냈으면 "잘 받았어" 3종 중 하나, 빚을 갚았으면 따로, 모자라면 2종 중 하나. 하루 한 번.

## 경리 잡담 (말풍선)
경리가 있고 대화창·패널이 닫혀 있으면, 들어온 지 4초 뒤 첫 말풍선, 그 뒤 14초마다 한 줄씩 3.5초 동안 경리 머리 위에 뜬다(`story.data.ts` `CHATTER.firstAfter/every/show`). 대사 5줄을 차례로 돌려서 같은 줄이 연달아 나오지 않는다. 걷기를 막지 않는다.
