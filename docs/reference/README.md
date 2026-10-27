# 🔍 참고 게임 역설계

다른 게임이 무엇을 어떻게 만들었는지, 말만 듣고 재현할 수 있을 만큼 적은 곳. 우리 게임의 결정은 `docs/design/`에 있고, 여기는 그 근거다. 새 조사는 주제별 문서에 붙이고, 어디에도 안 맞으면 새 문서를 만들어 이 표에 한 줄 추가한다.

| 문서 | 다루는 게임 | 쓰인 곳 |
|------|-----------|--------|
| [탑다운 실시간 액션](topdown-action.md) | japda(《봉인 너머》), Core Keeper, Death's Door, Ghostlore, Enter the Gungeon, Moonlighter, Hades | [전투](../design/2-night/combat.md) |
| [포켓몬 불가사의 던전](pokemon-mystery-dungeon.md) | 파랑/빨강 구조대, 시간·어둠·하늘의 탐험대 (던전·마을·의뢰판·영입) | [의뢰판](../design/4-day/contracts-map-ops.md), [영입](../design/3-growth/recruit.md) |
| [미션 구조 비교](mission-structures.md) | 다키스트 던전, 딥 락 갤럭틱, 몬스터 헌터 월드, 헬다이버즈 2, XCOM 2 | [의뢰 목표](../design/2-night/objectives.md) |
| [소녀전선](girls-frontline.md) | 소녀전선 (편성·군수·숙소) | [조 편성](../design/3-growth/party.md), [경제](../design/4-day/economy.md) |
| [파견 게임 비교](dispatch-games.md) | 소녀전선, MGSV, XCOM 2 WotC, 어쌔신 크리드 브라더후드, 드래곤 에이지 인퀴지션 | [분대 작전](../design/4-day/contracts-map-ops.md) |
| [돈으로 강해지는 구조](progression-systems.md) | 데스 도어, 데드 셀, 로그 레거시 2, 하데스, 다키스트 던전, 문라이터 | [성장·시설·트라우마](../design/3-growth/progression.md) |
| [의뢰 수락·담기·번짐 화면](quest-board-ui.md) | 포켓몬 불가사의 던전, 몬스터 헌터 월드, 위쳐 3, 페르소나 5, 데스티니 2, 다키스트 던전, 딥 락 갤럭틱, 페이데이 2, 인투 더 브리치, XCOM 2, 배틀 브라더스, 팬데믹, 헬다이버즈 2, 플레이그 Inc. | [화면·UI](../design/1-foundation/ui.md), [의뢰판](../design/4-day/contracts-map-ops.md) |
| [인디 게임 화면](indie-ui.md) | 산나비, 하데스, 카타나 제로, 나이트 인 더 우즈, 페이퍼스 플리즈, 인투 더 브리치 등 | [화면·UI](../design/1-foundation/ui.md) |

그 밖에 톤·구조로 참고하는 게임(따로 문서는 없음): 데이브 더 다이버(낮·밤 두 가지 일, 만담 캐릭터), 레세티아(빚·월세 마감이 돈 벌 이유), 세키로(발도 받아치기만), 하이퍼 라이트 드리프터·카타나 제로(탑다운 근접, 일섬의 쾌감), 은혼·혈계전선(톤과 세계관), 소울나이트(그림체·2방향 + 회전하는 무기).
