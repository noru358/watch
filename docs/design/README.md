# 🧩 기획 모듈 지도

기획은 상위 모듈 5개로 묶고, 그 아래에 세부 모듈(문서 하나 = 기능 하나)을 둔다. 새 아이디어는 맞는 세부 모듈에 넣고, 어디에도 안 맞으면 해당 상위 폴더에 새 문서를 만들고 그 폴더 README와 이 표에 한 줄 추가한다. 문서 안 표시: ✅ 결정(바뀔 수 있음) · 🤔 논의 중.

한 줄 요약: 낮엔 중소기업 직장인, 밤엔 허름한 을지로 옥탑방 퇴마 사무소장인 귀차니스트 천재가 의뢰를 받고, 밤에 퇴마하고, 월세를 막는 게임.

```
☎️ 수임 → 🧰 준비 → 🌙 출동(퇴마) → 💰 정산 → 🏢 경영(월세·평판·성장) → 다시 수임
   4-day    3-growth     2-night        2-night        4-day
```

상태 표시: 🟢 코드 있음 · 🧪 임시·일부 · 📝 기획만

| 상위 모듈 | 세부 모듈 | 상태 | 주 코드 위치 |
|-----------|----------|------|-------------|
| [1 기준](1-foundation/README.md) — 모든 모듈이 따르는 약속 | [세계관·톤](1-foundation/world.md) · [플랫폼·입력](1-foundation/platform.md) · [플레이 흐름](1-foundation/playflow.md) · [저장](1-foundation/save.md) | 🟢 입력·저장 / 📝 나머지 | `core/InputManager.ts`, `core/SaveManager.ts`, `data/input.data.ts` |
| [2 밤 — 퇴마 현장](2-night/README.md) | [전투 방식](2-night/combat.md) · [주인공·무기](2-night/protagonist.md) · [괴이 도감](2-night/enemies.md) · [의뢰·현장](2-night/contract.md)(첫 의뢰 「불 꺼지는 동네」, 보스 구미호) · [실패·정산](2-night/run-result.md) | 🟢 (Gate 1 본체, 일시정지 포함) | `systems/rift/`, `systems/run/`, `scenes/rift/` |
| [3 성장](3-growth/README.md) | [강화 카드·조 편성](3-growth/party.md) · [괴이 영입](3-growth/recruit.md) | 🟢 카드 / 📝 편성·영입 | `data/cards.data.ts`, `registry/cardEffects.ts` |
| [4 낮 — 옥탑방 사무소](4-day/README.md) | [허브](4-day/hub.md) · [경제·경영](4-day/economy.md) | 🧪 임시 화면 | `ui/OfficeApp.tsx`, `store/gameStore.ts` |
| [5 사업·제작](5-business/README.md) | [과금](5-business/monetization.md) · [아트·에셋](5-business/art.md) · [주인공 그림 명세](5-business/director-sprite-spec.md) · [Gate 1 그림 명세](5-business/gemini-asset-specs.md) | 📝 과금 / 🧪 그림 일부(주인공 🟢) | `scenes/rift/draw/`, `data/sprites.data.ts`, `assets/`, `tools/spritekit/` |

참고 게임 역설계는 [`../reference/`](../reference/)에 있다: [탑다운 실시간 액션](../reference/topdown-action.md)(Core Keeper, Death's Door, Ghostlore, Gungeon, Moonlighter, japda), [포켓몬 불가사의 던전](../reference/pokemon-mystery-dungeon.md), [소녀전선](../reference/girls-frontline.md).

모듈끼리 규칙: 코드 모듈은 서로의 내부 파일을 직접 가져다 쓰지 않고 각 `systems/<모듈>/index.ts`가 내놓은 함수만 쓴다. 모듈 사이 데이터는 `GameStore`(금고)를 거치고 ID 타입은 `src/types/ids.ts`를 공유한다. 화면(scenes/ui)은 계산 결과를 보여주기만 한다.
