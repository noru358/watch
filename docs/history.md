# 작업 기록 (history)

Long-form log moved out of HANDOFF.md on 2026-10-28 so a new session reads less. Newest status first; read only when you need the story behind something.

## Status log (to 2026-10-28)
- **2026-10-29 (user "투잡도 우선 빼자"):** the two-job premise (office worker by day) removed from docs and the intro line; the director works the night, two-job vs full-time is open.
- **2026-10-29 (user "현 1,2장 스토리 관련 문서에서 다 삭제해"):** ch.1 「불 꺼지는 동네」 (월하) and ch.2 「막차가 끊기지 않는 역」 (막차 기관사) stories dropped from the design docs and rules; only the chapter frames remain in code. Big story will be rewritten from ch.1.
- **Gate 1** (night combat): feature-complete, waits on the user's playtest. Main story contract 「불 꺼지는 동네」 = 4 floors (alley → basement → arcade ☎ → rooftop) + gumiho (3 심연 파편).
- **Gate 2** (office & growth): day loop, screens (board A, night HUD, dialogue + chatter, title + volume) from 2026-10-26. **2026-10-27 (user: "ㅇㅋ 구현해"):**
  - Money sinks: 트레이닝 (15 lines in 6 groups, small % steps, price inflates per line and overall), 기술 (passives 3 branches × 3 slots with A/B sides, paid in 심연 파편; actives on L: 부적 던지기 / 결계 펴기 / 소금 뿌리기), trauma effects (2: 2 cards, 4: start −2 HP, 6: grounded) and recovery at the sofa (휴식하기, 자본 치료 1,000 → −2, 진정제 slot disabled until the item exists), facilities (경리 책상, 부적 작업대, 소파) ordered from the ledger, supplies (salt pack, bacchus, map copy). Save v4.
  - Contracts: 메인 스토리 vs 일반 의뢰. Each 일반 의뢰 rolls one objective (clear, rescue, bounty, chase, ward, first train) + a frame + node + length + 0–2 modifiers (blackout, lair, surge); fee from difficulty × objective × modifiers; named targets (bounty, chase) level up when they get away; deep floors past the goal (more ghosts, richer, a shard on the last). Arena removed (its role → the lair modifier).
  - Later the same night (user feedback on screenshots): board navigation by district (A/D districts left→right, W/S offers by deadline), inactive districts dimmed, fixed-size offer sheet (site line removed, modifiers + ghosts cells, bundle inside the fee cell), "▲ 내일 번져 올 수 있음" instead of blinking spread links; desk upgrade posts its extra offer at once; 돌진 베기 fixed (cut toward the dash, visible swing) and every passive / active / supply covered by `tests/perks.test.ts`; nine more modifiers (6 warnings, 3 boons) from DRG warnings/anomalies and Hades pacts.
  - **Later (user, 2026-10-27 02:52):** ward sites are at least 9 tiles apart (`minApart`); rent presentation (wall calendar D-n / "내일!", bookkeeper reminder the day before, landlady phone text on rent morning — `src/app/toast.ts`, `ui/PhoneToast.tsx`, `RENT_TALK`); **main story chapters** (`chapters.data.ts`, `systems/office/chapters.ts`, rules `docs/rules/story.md`): a chapter starts N days after the previous ends (or earlier when a clue district is hot), gathers clues from general successes in its districts, then posts its main contract. Ch.2 「막차가 끊기지 않는 역」 (`last_line`, named target 「막차 기관사」) added. Save v5 (`chapters`).
  - **Midday (user "합동출동으로 가자 … 나머진 ㅇㅋ"):** bundling replaced by **joint sortie** (`office/contracts.ts` `planNight`, `canJoin`; store `joined`, `toggleJoin`, `tonightOffers`; board key F): same-district general offers in one night, lead = longest, objectives on their goal floors (clash → pushed down, +1 floor max), lead's modifiers everywhere, others' on their floor; return/continue at every goal floor; fees per finished objective, none if the director falls; run tracks `goals` / `completed` / `reached`. **Reputation** (`src/systems/reputation/`, `reputation.data.ts`, rules `docs/rules/reputation.md`): XP, never spent, never below the rank reached; 5 ranks open objectives, modifiers, districts (locked ones freeze), facility levels, training caps; rank-up morning text. Chapter `rank` field exists but is 0 (user: keep pacing for now). Bookkeeper unlock unchanged (user: will tie to story). Save v6.
  - **Evening (user questions + "찾아봐"):** joint-sortie bugs fixed — the sortie now follows the sheet on top (a main story / chase / unmarked sheet goes alone; before, a marked set in the same district went out instead), a target caught before the director fell no longer levels up, resting clears the marked set. Fuzz of 400 boards × same-district pairs with the skilled bot: no plan invariant broken (objective on its floor, no clash). UI drafts for marking several offers on the canvas https://claude.ai/artifact/SZksbAdYMtCzoup7wyBzEE (A: plan panel under the map, B: clipboard tabs + combined floor bar, C: Tab flips to a plan sheet) — waiting for the user's pick. Proposals in `docs/design/3-growth/content-proposal.md` (effect vocabulary for skills / gear / cards, skill list from Maple / Hades / Hollow Knight / RoR2 / Dead Cells, ~30 training lines, gear yes-or-no, spread rework, visible rank rewards) — waiting.
  - **Night (user "번짐: 우선 ㅇㅋ"):** random rise and spread removed. Contamination rises only from expired offers (`expireRise`) and nights lost on a district's objective floor (`failRise`). A district at 5 posts one 긴급 의뢰 (`overflow`: 2 nights, fee and 평판 ×1.5, outside the board size); missing it spills +1 into open neighbours (`overflowTargets`) and costs 10 평판. Map: dashed pink arrows + "+1" chips, "긴급 · 마감 D-n" box, legend "층마다 괴이 +n". `ContractOffer.urgent` is optional (no save bump). Tests `tests/overflow.test.ts`. Canvas second row: A2 (clipboard stack + 담음 stamp + 노선도 strip), overflow map, main story envelope — waiting for the user. Reference `docs/reference/quest-board-ui.md` (14 games).
  - **2026-10-28 (user "효과부품, 기술, 트레이닝, 장신구 : ㅇㅋ 붙여"):** all four adopted. Effect parts (`src/registry/effects/`, 15 parts one file each, conditions, `runEffects` / `castActive` / `tickEffects`, no-loop depth guard) now run every skill, duo, active, upgrade, gear special and supply (`rift/hooks.ts` `runHooks` = cards then rows; `perkEffects.ts` deleted). Skills v2 (`skills.data.ts`: 33 passives in 14 slots over 4 branches incl. 솜씨, sides are numbers, 3 duos, 10 actives, 9 upgrades of the 3 basic actives). Training v2 (`training.data.ts`: 33 lines in 8 groups, 16 new `Stats` fields each read in one place). Gear (`gear.data.ts`, `systems/gear/`, `growth/gear.ts`: 3 slots, drops from bounty / lair / deep / main boss rolled at settlement, bag 8, money enhance, shard reroll, melt; desk tab 3 `GearTab.tsx`). Save v7 (sides a/b → 0/1, training v1 → v2 ranks). Bug found on the way: 질주 never counted its run timer (`calmT`), fixed. Panels scroll to the keyboard cursor (`data-cursor`). Rules `docs/rules/growth.md` rewritten from the tables.
  - **2026-10-28 later:** board round 3 built (A3 sheet: equal cells, round 담음 stamp, difficulty word, contamination share in heat colour via `offerHeat`; 출동 전표 `SortieSlip.tsx` under the map with `nightDifficulty`; M2 사건 파일 card + red string on the map). New objective 속전속결 `timeattack` (clock from strong ghosts, +3 s per strong kill, time left → spirit, out of time = no fee, stairs open). Canvas row 5: stamp system, four fonts, neon × paper before/after, old printed map — waiting for the user. **총괄 장부** `tools/catalog/` → https://claude.ai/artifact/YFeE4XiaLTBUWSPg1Hrm8X (all tables from code, per-row memos in its db collection `notes`; "장부 메모 반영해" = read, apply, mark done; republish after data changes).
  - **2026-10-28 13:09 (user):** fonts = Black Han Sans (display, stamps) + IBM Plex Sans KR (UI and numbers, tabular) + a 명조 (Nanum Myeongjo: 사연, dialogue, chapter subtitles) — no pen script, no pixel digits. Tone proposal 3 (neon only on what is lit, information on paper) liked; map style undecided between today's neon map and the old printed map (canvas row 6 `MapHybrid` = printed map as one more paper on the night desk). No failure stamp. Currency: money + 심연 파편 only, 영력 = money picked up at night (HUD now "영력 n = ₩n"). Name tables: `wanted.pre/suf` counts and `RequestId` now come from the tables themselves. Morning report mockup (canvas `MorningReport`) — the game today only has one bookkeeper line in the ledger.
  - Not built: weapon honing, reputation rank, payphone-line facility, sedative item, escort / retrieval / challenge contracts. Companions wait on user decisions; the companion call has no slot now (L = active skill, user decision).
- **Screens:** built as picked on the canvas (https://claude.ai/artifact/FVdNQucCLJbcmNqo3DKhzf). The title went ahead as the merged candidate; the user may still ask to change it.
- **Art:** paused at the current level (user). The user does not draw pixels, only judges. Procedure `docs/design/5-business/art-pipeline.md`, prompts `art-prompts.md`. Open: the protagonist spec (mid-length layered hair, gender undecided) does not match the in-game sprite (long hair, reads female) — user decides which to follow. Dialogue portraits: director uses the master @8x; bookkeeper and Wolha are silhouettes.

## Known issues
- Headless Chromium runs the game slow, so screenshot scripts must wait longer than game-time numbers suggest (chatter first bubble took ~9 s real time).
- No human playtest: parry window, stance, speeds, run length, objective numbers, training prices, fees are bot-tuned or guessed.
- Chase has no footprint trail (an edge arrow points at the quarry); ward does not pull strong ghosts to the circle. Squad operations not built. The sedative item does not exist yet (its sofa row is disabled).
- Lair doors seal by turning doorway tiles into walls and redrawing the whole map (fine at this size).
- Bookkeeper / Wolha portraits are silhouettes; the chatter bubble has no tail. Unlocks still use "solved ≥ N".
- Hub art is shapes; subway ghost, sword, stairs, survivor are shapes; gumiho one static frame; walls not y-sorted with bodies; black jacket can sink into dark floors; floor themes are colour swaps only. Hero outline has purple fringe (`#22011e`, `#40043a`) from magenta keying.

## Verified (2026-10-27)
- Midday: 180 tests. `tests/joint.test.ts` (who can join, floor plan and clash push, one offer = old plan, go home after the first objective pays it and leaves the other on the board, falling pays nothing, store set, bot plays rescue + ward), `tests/reputation.test.ts` (ranks and floor, gains / losses, expiry, rank-0 board, locked district frozen, training cap, facility rank, morning rank-up, save v5→v6). Playwright: F marks two offers, sortie button "합동 출동 2건 · 4층 · ₩350", goal prompt "₩120 받고 … 남은 의뢰 1건", end panel "평판 +10", ledger rank line with next unlocks, training dashed capped pips, rooftop "평판 2등급부터".
- Late: 162 tests. `tests/chapters.test.ts` (ch1 open on day 1, ch2 by days / by heat / never before ch1, clues only from own-district general successes, posting and finishing, save v4→v5, ch2 contract bots: skilled 6/8, naive 0/8), story order with chapters, ward spacing over 40 seeds. Playwright: ch2_start scene plays, map shows "단서 1 / 3" under the station and arcade, calendar "내일!" fits at 18 px.
- `npm run check`: tsc clean, 154 tests pass (after the late-night fixes: perks 17, modifiers 4, desk 1). New: `growth.test.ts` (training prices / caps / damage order at max / tree total, skills, perks in the night, trauma, facilities and supplies, save v3→v4), objectives for bounty / chase / ward / first train / lair / blackout / deep / plain-floor determinism, office generation (every objective and modifier appears, desk bonus, wanted comeback, named targets not bundled, fee rises with level), bots finish each new objective, fully trained balance.
- Bots (story contract, 8 seeds): untrained naive 0/8, skilled 8/8 avg 184 s; fully trained naive 0/8, skilled 8/8 avg 172 s.
- Playwright smoke (headless): training and skills tabs, sofa, bench (pack/unpack), ledger facilities, board sheets (bounty name + shards, ward, rescue + lair stamp); nights for bounty (ring, HP bar, talisman on L), chase (flee ticks on the bar), ward (circle filling), first train (timer), lair + blackout (sealed doors, fog). No page errors.
- Not verified: human play of any of it; economy pacing with the new fees; supplies and most passives only by unit test.

## History (short)
Action prototype (auto-aim) lost to a stand-still bot → turn-based grid → user disliked it → Core Keeper–style real-time on a tile grid (old code: `d170e4b`, `0278d77`). 2026-10-25: swarm fodder, 발도 tiers, design docs in 5 groups, save, art lab, Gemini pipeline, 24px tiles, gumiho boss, director poses, walkable office hub, feel pass. 2026-10-26: design review; Gate 2-A day loop + board + map + save v2; floor roles, seal, arena, themes; hero master + palette; art roles. Afternoon: rule ledger, objective and progression designs, reference research, 12 screen mockups. Evening: mockups picked, docs cleanup. Night: objectives + rescue, board A, HUD, dialogue, title, save v3. 2026-10-27: growth (training, skills, trauma, facilities, supplies, save v4) and general-contract rework (six objectives, modifiers, deep floors, main story split); later main-story chapters + Ch.2, rent presentation, save v5; then joint sortie (bundling removed) and reputation ranks, save v6.

## 화면 결정 기록 (2026-10-29 ui.md에서 옮김)

**2026-10-27 의뢰판 손질(사용자):** 의뢰가 없는 동네는 흐리게(누를 수 없음), 의뢰가 있는 동네만 밝게. 이동은 동네 단위: A/D가 의뢰 있는 동네를 지도 왼쪽부터 오가고, 한 동네에 의뢰가 둘 이상이면 마감이 가까운 순으로 W/S(의뢰서 위에 "1/2 (W·S)"), 동네를 다시 눌러도 다음 의뢰. 의뢰서는 늘 같은 크기: 현장 줄을 빼고 변형·괴이를 아래 칸으로 키웠고, "같은 동네 일반 의뢰 n건 같이 끝남"은 보수 칸 안에, 보급품은 위 줄, 출동 불가는 출동 버튼 글자로. "번지는 중" 점선은 없애고, 내일 이웃에서 오염이 옮겨 올 수 있는 동네 이름 밑에 "▲ 내일 번져 올 수 있음"을 쓴다.

**2026-10-27 저녁:** 번짐 표시 개편 — "▲ 내일 번져 올 수 있음" 삭제, 긴급 의뢰 동네에서 이웃으로 분홍 점선 화살표 + "+1", 범례는 "층마다 괴이 +n". 의뢰서 마감 도장에 "긴급". 담기 화면·메인 스토리 봉투는 시안 단계(캔버스 https://claude.ai/artifact/SZksbAdYMtCzoup7wyBzEE, A2·번짐·메인 스토리).

**2026-10-27 낮 추가:** 평판 — 지도에서 잠긴 동네 아래 "평판 n등급부터", 장부에 평판 줄과 다음 등급에 열리는 것, 트레이닝 막힌 칸 점선 + "평판 n등급에 더", 시설 "평판 n등급 필요", 정산 "평판 +n", 등급 오른 아침 문자. 합동 출동 귀환 카드는 받을 보수와 남는 의뢰 수, 다음 목표 층을 말한다. 밤 HUD 층 막대는 남은 목표 층마다 테두리.

**2026-10-27 밤 추가:** 작전 지도에 지금 장의 단서 동네 아래 "단서 n / 3"(청록). 경리 장부에 "이야기" 줄(어느 장, 단서 몇 개 / 의뢰판에 올라옴 / 다음 이야기 기다리는 중). 정산 화면에 "단서 +1". 화면 위 문자 알림(`ui/PhoneToast.tsx`, 집주인 문자), 사무소 벽 달력 D-n.

**2026-10-27 추가:** 소장 책상(트레이닝·기술 탭), 소파(휴식하기·자본 치료·진정제), 부적 작업대(보급품) 창은 `src/ui/features/training|sofa|bench/`, 목록 키 처리는 `features/useNav.ts`. 경리 장부에 "시설 공사" 칸. 의뢰서에 표적 이름·변형 도장·심연 파편 줄, 메인 스토리 도장. 밤 HUD 목표 패널은 목표 6종 문구·게이지(현상수배·추격 표적 체력, 결계 진행, 첫차 시간)와 가장자리 화살표(표적, 결계 자리, 열린 계단, 귀신 눈, 지도 사본).

**2026-10-28 의뢰판 3차(사용자: A3 + 출동 전표 + M2 사건 파일):** 의뢰서 칸 6개를 같은 크기 2×3으로, 사연 두 줄 복원, 마감·메인 도장 높이 맞춤, 합동 출동에 담으면 둥근 "담음" 도장(잉크만, 바탕 없음 — 시안에서 '달걀귀신'이 흐려 보인 건 도장의 반투명 바탕이 글자를 덮어서였다). 난이도 점 옆에 말(가벼움 ~ 목숨 걸기), 오염이 보탠 몫은 동네 색(규칙 `docs/rules/office.md`). 지도 아래 출동 전표(`SortieSlip.tsx`). 지금 장은 지도 위 사진 카드(사건 파일)와 단서 동네로 이어진 붉은 실, 단서 동네 의뢰서에 "사건 파일과 연결됨". 출동 버튼에 "F 담기 / F 빼기".

**2026-10-28 가안 (사용자 "절충안 ㅇㅋ, 아침 보고 ㅇㅋ", 디자인은 추후 수정):** 작전 지도를 옛 인쇄 지도 종이로(`look.ts` `MAP_PRINT`: 남색 인쇄 블록, 오염 = 붉은 빗금 촘촘함, 고른 동네만 청록 형광 원, 긴급은 분홍 압정·점선). 의뢰서 칸은 채운 상자 대신 점선, 출동 버튼은 네온 테두리. 아침 보고(`features/morning/MorningPanel.tsx`): 밤 다음 아침 사무소에 들어오면 한 번 저절로 열림(이야기 장면은 닫은 뒤), 어젯밤 의뢰마다 줄, 끝낸 것엔 "해결" 도장, 받은 것, 오늘 할 일, 잔고. Enter = 의뢰판으로, 장부에서 다시 보기. 저장은 안 됨(껐다 켜면 그날 보고는 사라짐). 글꼴 셋과 톤 3 전체 적용은 아직.

**2026-10-29 (사용자 피드백):** 지도의 빗금 → 블록 색(종이색 → 짙은 빨강, Plague Inc식) + 이름 아래 큐브 5칸(팬데믹 질병 큐브·XCOM 2 패닉 칸). 지도 위 "긴급 · 마감" 상자 삭제(동네를 가림) — 의뢰서 도장이 "긴급 D-n"으로 말한다. 책상 탭(1/2/3)을 바꾸면 멈춰 있는 마우스 밑 줄로 커서가 튀던 버그: 마우스가 실제로 움직일 때만 커서를 옮기고, 탭을 바꾸면 맨 위부터.

## 다른 AI의 제안 기록 (direction.md에서 옮김) (다른 AI, 2026-10-26, 채택 여부 미정)
분대 자동 작전을 핵심 축으로 삼되 직접 출동과 서로 돕게(주인공의 단서가 작전을 돕고, 작전 정보가 탐색·보스전을 돕기), 을지로 작전 노드 5~8개, 액션 맵의 작은 단서 줍기, 영입 = 에피소드, 이야기 4막과 은혼식 운용(일상 의뢰는 그 자체로 재미있게). 그쪽은 실시간 전투·발도·투잡 설정·게이트 구조를 모르는 상태였고, 한 판 강화 카드가 빠져 있으며 "서울에 종속시키지 않는다"는 점이 지금 기준과 부딪힌다. 노드 지도와 이야기 틀은 이미 받아들였다([의뢰판·작전 지도](../4-day/contracts-map-ops.md), [이야기](story.md)).

## 기술·스탯·장비·번짐·평판 연출 제안 원문 (2026-10-27, 대부분 2026-10-28 채택)

## 🧰 기술·스탯·장비·번짐·평판 연출 제안 (2026-10-27 저녁, 📝 사용자 결정 전)

← [3 성장](README.md) · 지금 숫자: [성장 규칙](../../rules/growth.md), [평판](../../rules/reputation.md)

사용자 요청(2026-10-27 18:15): "기술 다양화(액티브·패시브·강화형 패시브·유틸), 스탯 더 쪼개고 촘촘하게, 장비 신규(도입 필요성부터), 번짐 재검토, 등급 업이 가시적으로 뭐가 좋아지는지, 하드코딩 금지 — 모듈화." 이 문서는 제안이며 결정되면 [로드맵](../roadmap.md)으로 옮긴다.

### 0. 모든 제안이 기대는 구조: 효과 어휘 + 데이터 줄

지금 기술 18개는 `perkEffects.ts`에 효과가 하나씩 손으로 쓰여 있다(훅 자리는 공용이지만 효과 본문은 기술마다 따로). 기술을 50개, 100개로 늘리면 이 방식은 하드코딩이 된다. 그래서 먼저 **효과를 작은 부품 어휘로 쪼개고, 기술·장비 옵션·카드·평판 특전은 전부 그 부품의 조합을 적은 데이터 줄**로 바꾼다. Risk of Rain 2 아이템, 하데스 축복, 메이플 스킬이 결국 "언제(트리거) + 조건 + 무엇을(효과) + 숫자"의 조합인 것과 같다.

```
EffectRow = {
  when:  훅 이름       // onHit, onKill, onSwing, onCounter, onDashEnd, onTakeDamage, onFloorEnd, onCast(액티브) …
  if?:   조건 목록     // chance 0.2 / hpBelow 0.3 / targetStrong / comboStep 3 / bareBlade / stacks ≥ n …
  do:    효과 이름     // 아래 부품 중 하나
  with:  숫자          // 효과마다 정해진 인자
  cd?:   재사용 초     // 같은 효과가 너무 자주 안 터지게
}
효과 부품(registry/effects/ 하나 = 파일 하나):
  extraHit(area, mult)            추가타: 앞/주변/연쇄
  status(kind, sec | stacks)      상태: 기절·둔화·표식·부정(지속 피해)·빙결 스택
  projectile(speed, range, pierce, split)
  zone(radius, sec, effect)       장판: 소금·연막·불
  summon(kind, sec, copy%)        분신·식신
  resource(kind, amount)          진심·체력·영력·돌진 충전·보호막
  buff(stat, mult | add, sec)     잠깐 능력치
  cleanse(radius, target)         도깨비불 지우기
  mark(onConsume)                 표식 → 다음 타격에 터짐
```
기술 하나 = `{ id, slot, side, rows: EffectRow[], descKey }`. 효과 부품 하나 추가 = 파일 하나 + 등록 한 줄; 기술 추가 = 데이터 한 줄. 테스트는 부품별로 한 번, 기술은 "행이 맞는 부품을 부르나"만 본다. 카드(`cards.data.ts`)·장비 옵션·평판 특전도 같은 `rows`를 쓴다.

### 1. 기술 다양화

#### 레퍼런스에서 가져올 것 (구조를 재현할 수 있게)
- **메이플스토리 4차 직업 스킬의 역할 분류:** 주력기(쿨 없는 기본 공격), 쿨기(큰 한 방, 재사용 대기), 버프(시간제 능력치), 소환(일정 시간 대신 공격), 이동기, 생존기. 대표 구조: 섀도어 *섀도우 파트너*(분신이 내 공격을 일정 % 위력으로 따라 침, 지속 버프), *메소 익스플로전*(바닥에 떨어진 돈을 터뜨려 피해 = 재화가 공격 자원), *스모크 쉘*(장판 안 아군 피격 무효), *다크 사이트*(은신), 히어로 *콤보 어택*(타격마다 구슬 스택, 스택을 소모하는 마무리기), *파이널 어택*(확률 추가타), 비숍 *홀리 심볼*(구역 버프), 썬콜 *체인 라이트닝*(연쇄). 그리고 **하이퍼 스킬 강화형 패시브**: 기존 스킬에 "리인포스(피해+)", "엑스트라 타겟(대상+)", "쿨타임 리듀스", "보스 킬러" 같은 개조를 붙이는 방식.
- **하데스 축복:** 같은 동작(공격·특수·시전·돌진)에 신마다 다른 성질을 붙인다. 아테나(받아치기·반사), 아르테미스(치명), 데메테르(둔화 스택 → 빙결), 디오니소스(지속 피해 스택), 아레스(지연 대형 피해 "파멸"), 제우스(연쇄 번개), 포세이돈(넉백·벽꿍 피해), 헤르메스(속도·회피 확률). 두 신 축복이 있으면 열리는 **듀오 축복**(조합 시너지).
- **할로우 나이트 부적:** 칸 수 제한 안에서 고르는 패시브. *샤프 섀도*(대시가 피해를 줌), *대시마스터*(대시 쿨 감소), *퀵 슬래시*(공속), *자존의 증표*(리치), *분노한 자의 분노*(체력 1이면 강해짐), *포자 버섯*(회복할 때 독 구름) 같은 "평소 동작에 성질 붙이기".
- **Risk of Rain 2 아이템:** 처치 시 폭발(윌오위스프), 처치 시 불 장판(가솔린), 확률 연쇄(우쿨렐레), 확률 막기(터퍼 타임즈). 수치가 겹쳐 쌓이는 구조.
- **데드 셀 변이:** 처치 후 몇 초 강화(콤보), 피격 직후 강화(복수), 처치 시 회복(강령술).

#### 우리 게임으로 옮긴 후보 (부품 조합으로 적음)
액티브(L, 하나만 담) — 지금 3종 + 후보:
| 이름 | 원형 | 조합 |
|------|------|------|
| 그림자 분신 | 섀도우 파트너 | onCast → summon(분신, 15초, 내 공격 50%) |
| 영력 터뜨리기 | 메소 익스플로전 | onCast → 반경 4칸 바닥 영력 구슬마다 extraHit, 대신 그 영력은 사라짐(돈↔화력 선택) |
| 축지법 | 텔레포트 | onCast → 조준 방향 5칸 순간이동, 도착점 extraHit 주변 |
| 연쇄 부적 | 체인 라이트닝 | projectile → 맞으면 3마리까지 연쇄 |
| 연막 | 스모크 쉘 | zone(2칸, 3초, 피격 무효) |
| 기세 해방 | 콤보 어택 마무리 | 기세 스택 소모 → 스택당 extraHit 강타 |
| 원혼 사슬 | 아레스 파멸 | 표식 → 2초 뒤 큰 피해 |

패시브(검·발·눈 3×3 A/B는 유지, 칸을 4단까지 늘리고 쪽을 A/B/C로) 후보:
| 이름 | 원형 | 조합 |
|------|------|------|
| 뒤따르는 칼 | 파이널 어택 | onSwing, chance 0.25 → extraHit 앞 60% |
| 기세 | 콤보 어택 | onHit → stacks +1(최대 5), 스택당 피해 +3%, 3초 안 때리면 초기화 |
| 부정 타기 | 디오니소스 | onHit → status 부정 1스택(초당 1, 최대 3스택) |
| 서리 소금 | 데메테르 | onHit → 둔화 스택, 5스택이면 1초 굳음 |
| 벽꿍 | 포세이돈 | 발도 넉백, 벽에 부딪히면 extraHit |
| 날 선 돌진 | 샤프 섀도 | onDashTick → 닿은 괴이에 extraHit 30% |
| 벼랑 끝 | 분노한 자의 분노 | if hpBelow 0.25 → buff 피해 ×1.3 |
| 복수 | 데드 셀 복수 | onAfterHurt → buff 피해 ×1.2, 3초 |
| 원혼 폭발 | 윌오위스프 | onKill 강적 → extraHit 주변 |
| 영력 털기 | 픽파킷 | onHit, chance 0.1 → 영력 구슬 떨어짐 |

강화형 패시브(액티브 개조, 하이퍼 스킬식): 액티브마다 3칸, 하나 고르기. 예: 부적 던지기 → 관통 / 세 갈래 / 재사용 −30%. 결계 펴기 → 원 반지름 +1 / 원 안 회복 / 끝날 때 폭발. 데이터상 `modifies: activeId` + 숫자 덮어쓰기 행.

유틸 패시브: 문 앞 영력 자석, 계단 위치 화살표(지도 사본 상시판), 공중전화 보너스, 보급품 2개, 정산 영력 +10%, 구조 의뢰인 이동 속도 +20%, 결계 채우기 +15% — 의뢰 목표별 특화가 생겨 "오늘은 결계 의뢰니까 이 세팅"이 된다.

듀오 칸(하데스 듀오): 특정 두 기술이 켜져 있으면 열리는 4번째 줄. 데이터 `requires: [a, b]`.

### 2. 스탯 더 쪼개고 촘촘하게

지금 15줄, 줄당 1~5단계. 방향: **줄 수는 30줄 안팎으로, 한 단계 폭은 절반으로, 단계 수는 두 배**(전체 강해지는 폭은 그대로: 다 찍어도 피해 +20% 근처). 그래야 자주 사고 오래 걸린다.

추가할 줄(새 수치는 `Stats`에 필드 하나 + 적용 한 곳, 변형과 같은 규칙):
- 공격: 강적에게 주는 피해, 도깨비불(잡몹)에게 주는 피해, 보스·표적에게 주는 피해, 3타 막타 피해, 일섬 피해, 검신 노출 중 피해, **치명 확률·치명 피해**(새 계산 한 곳: `onBeforeAttack`)
- 방어: 받는 피해 감소(%), 경직 저항(맞아도 휘두르기 안 끊김 확률), 회복량 배율, 진심 게이지 유지 시간
- 기동: 공격 중 이동 속도, 돌진 무적 시간, 받아치기 뒤 무적
- 수완: 영력 획득 %, 파편 확률, 보급품 효과 %, 공중전화 보상 %, 정산 수임료 %
- 의뢰 특화: 결계 채우는 속도, 구조 의뢰인 체력, 첫차까지 시간 단축, 표적 추적(화살표 거리)

화면은 갈래 6개 탭 + 줄마다 칸이 더 촘촘한 막대. 데이터는 지금 `TRAINING` 표 그대로 줄만 늘어난다.

### 3. 장비 — 넣을지부터

**필요한가:** 지금 강해지는 길은 트레이닝(영구 숫자), 기술(동작에 성질), 카드(그 밤만). 셋 다 "사는 것"이라 **밤에 무언가를 주워 오는 두근거림**이 없다. 밤 보상은 돈과 파편뿐이다. 장비가 이 빈칸을 채운다면 넣을 가치가 있고, 숫자만 더하는 장비라면 트레이닝과 겹쳐서 빼는 게 낫다.

**차별점(제안):** 장비 = **무작위 옵션이 붙은 채로 떨어지는 물건**, 교체하는 짐. 트레이닝은 고정·영구, 기술은 고르는 성질, 장비는 운 + 의뢰별 갈아끼우기.
- 칸 3개: 부적(공격 쪽 옵션), 염주(방어·회복), 신발(기동·유틸). 무기(신문지 칼)는 따로 "손질"(별 강화, 파괴 없음 — 이미 제안됨).
- 떨어지는 곳: 현상수배 표적, 괴이 소굴 보물, 깊은 층 보물 방, 메인 스토리 보스. 등급(흔함·드묾·귀함·전설)은 의뢰 난이도로 확률이 오름.
- 옵션: 위 효과 어휘의 행 1~3줄(예: "강적 피해 +6%", "처치 시 15% 확률 원혼 폭발", "결계 채우기 +10%"). 옵션 범위·가중치는 표 한 장.
- 강화: 돈으로 단계 +1(옵션 수치가 오름, 파괴 없음, 단계마다 값 상승). 파편으로 옵션 하나 다시 굴리기(메이플 큐브의 축소판). 같은 장비 녹여서 재료(디아블로 분해).
- 보관함 칸 제한(경리 책상 단계로 늘어남) → 버리고 고르는 판단.
- 레퍼런스: 메이플(스타포스=단계 강화, 잠재능력+큐브=옵션 재굴림), 디아블로(옵션 접두/접미, 분해), 하데스 기념품(칸 하나, 쓰면 성장).

결정할 것: (a) 넣는다 / 미룬다, (b) 칸 수, (c) 강화 재화(돈 vs 파편 분담).

### 4. 번짐 (오염 확산) — 제3자 의견

**지금 계산:** 매일 아침 동네마다 25% 확률로 +1, 오염 3 이상인 동네는 40% 확률로 이웃 하나를 +1, 마감 넘긴 의뢰가 있던 동네 +1. 평판 등급으로 잠긴 동네는 멈춤.
**오염이 실제로 바꾸는 것:** 그 동네 의뢰의 강적 수(층마다 +오염)와 도깨비불 물결 속도·양 → 난이도·보수가 오름, 그 동네에 의뢰가 더 잘 올라옴, 메인 스토리 장을 앞당김(시작 조건), 평판 +5(4 이상에서 해결 시).
**문제:** 플레이어 입장에서는 확률 두 번(오를지, 어디로 번질지)이라 예측도 대응도 안 되고, 결과(의뢰가 좀 더 어려워짐)가 눈에 안 보인다. "번져 올 수 있음" 표시는 원인도 결과도 안 알려 주는 경고라 피로만 준다.

**제안:** 무작위 번짐을 없애고, 오염은 남기되 결과가 보이게 바꾼다.
1. 매일 무작위 상승 + 무작위 번짐 → 삭제. 오염이 오르는 원인을 플레이어 행동에 묶는다: 마감 넘긴 의뢰 +1(지금 있음), 실패한 의뢰 +1.
2. 오염 5(들끓음)가 된 동네는 다음 아침 **긴급 의뢰** 한 장을 올린다(마감 1일, 보수·평판 ×1.5). 이것도 놓치면 그때 이웃 동네들이 +1 — 확정 규칙이고 지도에 "내일 넘침" 한 줄로 미리 보인다.
3. 지도 범례에 오염 단계별로 "괴이 +n, 물결 빨라짐, 보수 +n%"를 그대로 적는다.
4. 데이터: `office.data.ts` `contamination`에 `riseChance`/`spreadChance` 대신 `onExpire`, `onFail`, `overflowAt`, `emergency: {deadline, feeMult, repMult}`.
그러면 번짐은 "랜덤 벌"이 아니라 "놓친 일의 대가"가 되고, 동네를 돌보는 이유가 생긴다.

### 5. 평판 등급이 오르면 눈에 보이게

지금은 문자 한 통 + 보이지 않는 해금이라 체감이 약하다. 등급 줄(`RANKS`)에 `rewards` 목록을 달고, 보상도 어휘로 만든다:
- `prop`: 사무소 소품이 바뀐다(1등급 현관 명패, 2등급 새 간판·명함 꽂이, 3등급 구청 감사장 액자, 4등급 신문 스크랩). 허브에 바로 보인다.
- `scene`: 승급 대화 한 장면(경리·의뢰인).
- `perkChoice`: 사무소 특전 2개 중 하나 고르기(의뢰판 +1 / 월세 −10% / 매일 소금 한 봉 / 수임료 +5% …) — 하데스 거울이나 다키스트 던전 마을 건물 업그레이드처럼 "등급업 = 고르는 순간".
- `unlockReveal`: 승급한 날 의뢰판·트레이닝·시설에 "NEW" 표시, 장부에 "이번에 열린 것" 목록.
- `clients`: 지명 의뢰인(그 등급부터 가끔 고정 의뢰인이 높은 보수로 직접 의뢰) — 퍼스나 5 메멘토스 의뢰처럼 사람이 붙는 의뢰.


## 효과 부품·기술 v2·트레이닝 v2·장신구 초안 기록 (2026-10-28, 같은 날 채택)

## 🧪 효과 부품 · 기술 v2 · 트레이닝 v2 · 장신구 — 초안 기록 (2026-10-28, ✅ 같은 날 게임에 적용)

← [3 성장](README.md) · 제안 배경: [기술·스탯·장비 제안](content-proposal.md) · 검토 화면: https://claude.ai/artifact/TzfU1cK7GkCAyMKfHPx2cV

사용자(2026-10-28 01:17): "효과 부품 정리 → 스탯 확장 → 장비 ㅇㅋ. 짜되 바로 적용은 하지 말고 결과물 보고 판단하게." 검토 화면을 보고 사용자(03:13) "효과부품, 기술, 트레이닝, 장신구 : ㅇㅋ 붙여" → 같은 날 적용. 지금 규칙은 [성장 규칙](../../rules/growth.md)이 기준이고, 이 문서는 초안 당시 기록이다. 초안 파일(`src/data/draft/`)은 지웠고 표는 `skills.data.ts`·`training.data.ts`·`gear.data.ts`로 옮겼다. `perkEffects.ts`는 없어졌다.

### 어디에 무엇이 있나
| 것 | 코드 | 테스트 |
|----|------|--------|
| 효과 부품 14개(추가타·상태이상·투사체·장판·자원·잠깐 능력치·배율·정화·스택·스택 쓰기·분신·순간이동·영력 터뜨리기·버티기), 조건 13종, 줄 실행기(`runEffects`, `castActive`, `tickEffects`) | `src/registry/effects/` (부품 하나 = `parts/` 파일 하나) | `tests/effects.test.ts` |
| 기술 v2 57개(지금 기술 21개를 부품 줄로 다시 씀 + 새 액티브 7, 새 패시브 10, 강화형 9, 유틸 5, 듀오 3) | `src/data/draft/skills.v2.data.ts` | 같은 곳 |
| 트레이닝 v2 33줄 201단계(지금 15줄 52단계), 새 능력치 16개와 적용 자리 | `src/data/draft/training.v2.data.ts` | `tests/gear.test.ts` |
| 장신구 3칸(염주 팔찌·호부 목걸이·방울 키링), 등급 4, 부옵션 19, 전설 특수 7, 떨어지는 곳 4, 강화·다시 굴리기·녹이기 | `src/data/draft/gear.data.ts`, `src/systems/gear/` | `tests/gear.test.ts` |

### 규칙 요약
- 한 줄 = 언제(훅) + 조건 → 부품 하나(숫자) [+ 재사용 초]. 부품이 부른 타격·처치는 다시 줄을 부르지 않는다(무한 연쇄 방지, RoR2의 proc 규칙).
- 스택은 이름으로 공유(듀오·액티브가 같은 스택을 읽고 씀). 표식은 건 기술만 터뜨린다.
- 트레이닝 v2 물가 0.02 → 0.005(단계가 네 배라). 전부 사는 값: 지금 46,440 → v2 96,010(두 배, 다 찍었을 때 힘은 지금과 같음: 베기 +20%, 체력 +4, 이동 +10%).
- 장신구: 주옵션은 칸마다 정해진 셋 중 하나, 단계(+0~+10, 돈, 실패 없음)로 오른다. 부옵션은 등급만큼(흔함 0 ~ 전설 3) 무작위, 파편으로 하나씩 다시 굴린다(1 → 2 → 3개). 전설은 특수 옵션 한 줄(효과 부품). 끝까지 강화: 흔함 7,050 ~ 전설 21,140. 보스는 귀함 이상 확정.

### 붙인 순서 (2026-10-28 완료)
1. `runHooks`가 기술·장신구 줄도 부르게(`runEffects`), `tickEffects`를 한 틱에 한 번. 상태는 `Floor`로 옮김.
2. `PASSIVES`/`PERK_HOOKS`를 기술 v2로 교체(지금 21개는 동작이 같아야 함 — 테스트로 고정), 기술 화면 4단·강화형·듀오 칸.
3. 새 능력치 16개를 `Stats`에 넣고 적용 자리 한 곳씩, 트레이닝 v2 표로 교체(저장: 옛 단계 → 새 줄 환산).
4. 장신구: 저장 칸·떨어뜨리기(현상수배·소굴·깊은 층·보스)·장신구 화면(소장 책상 탭)·강화·다시 굴리기·녹이기.

