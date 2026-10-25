# 🧩 기획 모듈 지도

> 기획을 **기능(모듈) 단위**로 쪼개 둔 곳. 한 파일 = 한 모듈 = 코드의 한 구역.
> 새 아이디어는 맞는 모듈 파일에 넣고, 어디에도 안 맞으면 새 모듈 파일을 만들고 이 표에 한 줄 추가.
> 문서 안 표시: ✅ 결정(바뀔 수 있음) · 🤔 논의 중

## 한 줄 요약
허름한 을지로 옥탑방 사무소의 귀차니스트 천재 해결사가 **의뢰를 받고 → 밤에 퇴마하고 → 월세를 막는** 게임. (은혼 해결사 + 혈계전선 같은 마경 서울)

## 핵심 루프
```
☎️ 수임 → 🧰 준비 → 🌙 출동(퇴마) → 💰 정산 → 🏢 경영(월세·평판·성장) → 다시 수임
contract   party·protagonist   combat·contract   run-result·recruit   economy·hub
```

## 모듈 목록
상태: 🟢 코드 있음 · 🧪 임시·일부만 · 📝 기획만

| 묶음 | 모듈 | 문서 | 담당 코드 | 상태 | 처음 만드는 Gate |
|------|------|------|----------|------|----------------|
| 기준 | 세계관·톤 | [world.md](world.md) | — (모든 모듈이 따름) | 📝 | — |
| 기준 | 플레이 흐름 (종합) | [playflow.md](playflow.md) | — (여러 모듈을 엮은 설명) | 📝 | — |
| 기준 | 플랫폼·입력 | [platform.md](platform.md) | `core/InputManager.ts`, `core/platform.ts`(예정) | 🟢 키보드만 | 1 |
| 밤 | **전투 방식** | [combat.md](combat.md) | `systems/rift/`, `systems/run/`, `scenes/rift/` | 🟢 칸 턴제로 결정 | 1 |
| 밤 | 주인공·무기 | [protagonist.md](protagonist.md) | `data/protagonist.data.ts`, `data/weapons.data.ts`, `systems/run/stats.ts` | 🟢 무기 A | 1 |
| 밤 | 의뢰·현장 | [contract.md](contract.md) | `data/contracts.data.ts`, `data/dungeon.data.ts`, `systems/rift/mapgen.ts` | 🟢 을지로 1건 | 1 |
| 밤 | 실패·정산 | [run-result.md](run-result.md) | `data/penalties.data.ts`, `systems/run/` | 🟢 | 1 |
| 성장 | 조 편성·강화 카드 | [party.md](party.md) | `data/cards.data.ts`, `registry/cardEffects.ts`, `systems/run/run.ts` | 🟢 카드 덱 / 📝 편성 | 1 (카드) / 2 (편성) |
| 성장 | 괴이 영입 | [recruit.md](recruit.md) | `systems/recruit/`(예정) | 📝 | 2 |
| 낮 | 허브(옥탑방) | [hub.md](hub.md) | 지금 `ui/OfficeApp.tsx`(임시) → `scenes/hub/`(예정) | 🧪 임시 화면 | 1 (임시) / 2 |
| 낮 | 경제·경영 | [economy.md](economy.md) | `store/gameStore.ts`, `systems/economy/`(예정) | 🟢 돈·트라우마만 | 2 |
| 사업 | 과금 | [monetization.md](monetization.md) | `systems/shop/`(예정) | 📝 | Steam 출시 이후 |
| 제작 | 아트·에셋 | [art.md](art.md) | `scenes/shared/`(연출), `assets/`(예정) | 🧪 도형·합성음 | 1 |

## 참고 게임 역설계 → [`../reference/`](../reference/)
- [포켓몬 불가사의 던전](../reference/pokemon-mystery-dungeon.md) — 의뢰판 → 던전 → 영입, 칸 턴제
- [소녀전선](../reference/girls-frontline.md) — 편성 칸 버프, 군수 파견, 숙소

## 모듈끼리 규칙
- 모듈은 **서로의 내부 파일을 직접 import 하지 않음.** 각 `systems/<모듈>/index.ts`가 내놓은 함수만 사용.
- 모듈 사이의 데이터는 `GameStore`(금고)를 거치고, ID 타입은 `src/types/ids.ts`를 공유.
- 화면(scenes/ui)은 모듈의 계산 결과를 **보여주기만** 함.
