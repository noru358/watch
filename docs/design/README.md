# 🧩 기획 모듈 지도

> 기획을 **기능(모듈) 단위**로 쪼개 둔 곳. 한 파일 = 한 모듈 = 코드의 한 구역.
> 새 아이디어는 맞는 모듈 파일에 넣고, 어디에도 안 맞으면 새 모듈 파일을 만들고 이 표에 한 줄 추가.
> "✅" = 결정(바뀔 수 있음), "🤔" = 논의 중.

## 한 줄 요약
허름한 을지로 사무소의 귀차니스트 천재 해결사가 **의뢰를 받고 → 밤에 퇴마하고 → 월세를 막는** 게임. (은혼 해결사 사무소 느낌)

## 핵심 루프
```
☎️ 수임 → 🧰 준비 → 🌙 출동(퇴마) → 💰 정산 → 🏢 경영(월세·회복·성장) → 다시 수임
 contract   tools·roster   combat·contract   run·recruit   economy·hub
```

## 모듈 목록

| 모듈 | 기획 문서 | 담당 코드 (예정) | 처음 만드는 Gate |
|------|----------|----------------|----------------|
| 플랫폼·입력 | [platform.md](platform.md) | `src/core/InputManager.ts`, `src/core/platform.ts` | 1 (PC만), 모바일은 Steam 이후 |
| 주인공·퇴마 도구 | [protagonist.md](protagonist.md) | `data/tools.data.ts`, `registry/toolEffects.ts`, `systems/combat/` | 1 (도구 1종) |
| 의뢰·밤 한 판 | [contract.md](contract.md) | `data/contracts.data.ts`, `systems/contract/`, `maps/` | 1 (을지로 의뢰 1건) |
| 실패·정산 | [run-result.md](run-result.md) | `data/penalties.data.ts`, `systems/run/` | 1 (귀환·정산만), 페널티 2 |
| 귀신 영입 | [recruit.md](recruit.md) | `data/recruit.data.ts`, `systems/recruit/` | 2 |
| 경제·월세 | [economy.md](economy.md) | `data/economy.data.ts`, `systems/economy/` | 2 |
| 허브(사무소) | [hub.md](hub.md) | `data/lobby.data.ts`, `scenes/hub/`, `ui/features/` | 1 (출동 버튼만), 본격 2 |
| 과금 | [monetization.md](monetization.md) | `data/shop.data.ts`, `systems/shop/` | Steam 출시 이후 |
| 아트·에셋 | [art.md](art.md) | `scenes/vfx/`, `scenes/postfx/`, `assets/` | 1 (임시 그림) |

## 모듈끼리 규칙
- 모듈은 **서로의 내부 파일을 직접 import 하지 않음.** 각 `systems/<모듈>/index.ts`가 내놓은 함수만 사용.
- 모듈 사이의 데이터는 `GameStore`(금고)를 거치고, ID 타입은 `src/types/ids.ts`를 공유.
- 화면(scenes/ui)은 모듈의 계산 결과를 **보여주기만** 함.
