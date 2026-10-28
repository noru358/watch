# 🧩 기획 모듈 지도

한 줄 요약: 낮엔 중소기업 직장인, 밤엔 허름한 을지로 옥탑방 퇴마 사무소장인 귀차니스트 천재가 의뢰를 받고, 밤에 퇴마하고, 월세를 막는 게임.

```
☎️ 수임 → 🧰 준비 → 🌙 출동(퇴마) → 💰 정산 → 🏢 경영(월세·성장) → 다시 수임
   4-day    3-growth     2-night        2-night        4-day
```

## 문서는 세 갈래
- **기획(`docs/design/`, 이 폴더):** 무엇을 왜 만드나. 상위 묶음 5개, 그 아래 문서 하나 = 기능 하나.
- **규칙 장부([`docs/rules/`](../rules/README.md)):** 지금 코드가 실제로 계산하는 공식과 숫자 위치. 숫자는 여기에만 적고, 기획 문서는 링크한다.
- **역설계([`docs/reference/`](../reference/README.md)):** 다른 게임 조사. 기획의 근거.

무엇이 확정이고 열려 있는지는 [기획 방향](1-foundation/direction.md), 할 일 순서는 [로드맵](roadmap.md). 한 내용은 한 문서에만 쓰고 나머지는 링크한다. 새 아이디어는 맞는 문서에 넣고, 어디에도 안 맞으면 그 묶음 폴더에 새 문서를 만들어 묶음 README와 이 표에 한 줄 추가한다.

상태 표시: 🟢 코드 있음 · 🧪 임시·일부 · 📝 기획만

| 묶음 | 문서 | 상태 | 주 코드 위치 |
|------|------|------|-------------|
| [1 기준](1-foundation/README.md) | [기획 방향](1-foundation/direction.md) · [이야기 바이블](1-foundation/bible.md) · [화면·UI](1-foundation/ui.md) · [플랫폼·입력](1-foundation/platform.md) · [저장](1-foundation/save.md) | 🟢 입력·저장 / 📝 화면 개편·이야기 | `core/`, `data/input.data.ts`, `ui/`, `scenes/rift/RiftHud.ts` |
| [2 밤](2-night/README.md) | [전투](2-night/combat.md) · [주인공·무기](2-night/protagonist.md) · [괴이 도감](2-night/enemies.md) · [이야기 의뢰와 층 구조](2-night/contract.md) · [의뢰 목표](2-night/objectives.md) · [실패·정산](2-night/run-result.md) | 🟢 Gate 1 본체 / 📝 의뢰 목표 | `systems/rift/`, `systems/run/`, `scenes/rift/` |
| [3 성장](3-growth/README.md) | [강화 카드·조 편성](3-growth/party.md) · [괴이 영입](3-growth/recruit.md) · [성장·시설·트라우마](3-growth/progression.md) | 🟢 카드 / 📝 나머지 | `data/cards.data.ts`, `registry/cardEffects.ts` |
| [4 낮](4-day/README.md) | [허브](4-day/hub.md) · [의뢰판·작전 지도·분대 작전](4-day/contracts-map-ops.md) · [경제·경영](4-day/economy.md) | 🧪 허브·의뢰판·지도·월세 / 📝 분대 작전 | `scenes/hub/`, `systems/hub/`, `systems/office/`, `ui/features/`, `store/gameStore.ts` |
| [5 사업·제작](5-business/README.md) | [과금](5-business/monetization.md) · [아트·에셋](5-business/art.md) · [그림 작업 절차](5-business/art-pipeline.md) · [그림 프롬프트](5-business/art-prompts.md) | 📝 과금 / 🧪 그림 | `scenes/rift/draw/`, `scenes/shared/draw/`, `data/sprites.data.ts`, `assets/`, `tools/` |

코드 모듈끼리 규칙: 서로의 내부 파일을 직접 가져다 쓰지 않고 각 `systems/<모듈>/index.ts`가 내놓은 함수만 쓴다. 모듈 사이 데이터는 `GameStore`(금고)를 거치고 ID 타입은 `src/types/ids.ts`를 공유한다. 화면(scenes/ui)은 계산 결과를 보여주기만 한다. 정식 규칙은 `ARCHITECTURE.md`.
