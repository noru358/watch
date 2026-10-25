# 🔍 레퍼런스 역설계: 탑다운 실시간 액션 (코어키퍼 방향)

> 2026-10-25, 전투를 "그리드 위 실시간"(코어키퍼식)으로 정하면서 정리. 목표는 "말만 듣고 재현할 수 있는 수준". 수치는 출처마다 다를 수 있어 출처를 같이 적는다.

## 0. 우리 기준점: japda (《봉인 너머》, 사용자의 이전 프로젝트)
같은 뷰를 이미 한 번 구현해 본 코드라서 렌더링 규칙은 여기서 그대로 가져온다.
- 타일 16px, 화면 배율 약 2.5배, 카메라가 주인공을 따라감. 맵은 타일 격자(절차 생성).
- 3/4 탑뷰(스타듀 각도): 벽 타일은 윗면을 한 칸 위로 올려 그리고, 아래 칸이 바닥이면 그 사이에 높이 WH만큼 앞면을 그린다. 그래서 벽이 "서 있는" 것처럼 보인다.
- 나무·구조물·적·주인공은 발밑 y좌표로 정렬해서 그린다(아래쪽에 있는 게 앞에 보임). 모든 몸 밑에 납작한 검은 타원 그림자.
- 캐릭터는 그림 파일 없이 캔버스 도형으로 그린다. 몸통 + 머리 + 다리 2개(걸을 때 sin으로 번갈아 올라감), 무기는 조준 각도에 따라 몸 앞(아래를 볼 때) 또는 뒤(위를 볼 때)에 그린다. → "몸통과 무기 분리"를 이미 실현.
- 적은 종류별로 도형 조합 + `bob = |sin(t)|` 들썩임, 피격 시 흰색으로 칠하기(flash), 공격할 때 앞으로 쏠리기(lunge).
- 보스 예고: 돌진 = 진행 방향 직사각형, 내려찍기 = 타원(원근 0.6배), 브레스 = 부채꼴. 예고 동안 채우기 투명도가 0.12 → 0.37로 차오르고 테두리는 고정. 체력 절반 이하면 예고 시간이 짧아짐(×0.8).
- 조작: WASD 이동, 마우스 조준, 좌클릭 공격, Space 돌진, Q 무기 스킬.

## 1. Core Keeper (Pugstorm, 2022~)
뷰·조작의 기본 틀.
- 조작: PC 좌클릭 = 공격, 우클릭 = 사용. 조준은 마우스(패드는 오른쪽 스틱). 맵 전체가 정사각형 타일, 캐릭터만 타일 사이를 자유 이동. 출처: [Core Keeper Wiki: Controls](https://core-keeper.fandom.com/wiki/Controls)
- 첫 보스 글럼(Glurch): 플레이어가 **서 있는 지점**으로 점프해서 내려찍는다. 공략은 "점프 뜨면 옆으로 피하고 → 착지 후 경직 동안 3~4대 → 빠지기". 직선으로 도망치면 따라잡히고 곡선으로 움직여야 함. 벽을 부수고 따라옴. 출처: [Fandom: Defeating Glurch](https://core-keeper.fandom.com/wiki/Defeating_Glurch), [PC Gamer 보스 가이드](https://www.pcgamer.com/core-keeper-bosses-guide/)
- 교훈: 보스 패턴의 기본 리듬 = **예고 → 회피 → 경직(때릴 틈)**. 첫 보스는 "이동 규율"만 가르친다.

## 2. Death's Door (Acid Nerve, 2021) — 가장 닮은 게임
"사무소에 다니는 저승사자 까마귀가 영혼 수거 업무를 받아 나간다" = 우리 "사무소장이 의뢰를 받아 나간다"와 구조가 같다.
- 동사: 공격(콤보), 구르기, 강공격(차지), 원거리 마법(활). 엑스박스 기준 X 공격 / A 구르기 / R 강공격 / L1+B 원거리. 출처: [RPGFan 리뷰](https://www.rpgfan.com/review/deaths-door/), [Lords of Gaming](https://lordsofgaming.net/2021/07/review-deaths-door/)
- **자원 순환: 마법 충전은 근접 공격을 맞힐 때만 찬다**(환경 오브젝트를 쳐도 참). 시작 4칸. 그래서 "붙어서 때리고 → 굴러서 빠지고 → 원거리로 마무리" 리듬이 생긴다. 출처: [Fandom: Weapons](https://deaths-door-game.fandom.com/wiki/Weapons), [GameSpew 리뷰](https://www.gamespew.com/?p=114733)
- 무기 능력치는 "한 대 피해 / 연속 휘두르기 횟수"로 단순. 대검은 횟수 1 적은 대신 사거리·피해 큼. 출처: [Fandom: Weapons](https://deaths-door-game.fandom.com/wiki/Weapons), [TechRaptor](https://Techraptor.net/gaming/guides/deaths-door-weapon-upgrade-guide)
- 성장: 영혼(돈)으로 기본 능력치, 체력·마법 칸은 숨은 사당에서만. 죽거나 허브로 돌아가면 적 재생성(소울라이크). 회복은 씨앗을 화분에 심어서. 출처: [GameSpew](https://www.gamespew.com/?p=114733), [Quickplay](https://quickplay.substack.com/p/deaths-door)
- 비판: 아레나 전투에서 적이 너무 많고 체력이 높고 느리다. 출처: [GameSpot](https://www.gamespot.com/reviews/deaths-door-review-a-murder-of-crows/1900-6417699/)
- **가져올 것**: 우리 "진심 게이지"가 Death's Door 마법 충전과 같은 구조(근접 명중으로 충전 → 큰 기술). 이미 맞게 설계되어 있음. 아레나 웨이브는 적 수를 적게, 체력을 낮게.

## 3. Ghostlore (Andrew Teo, 2023) — 민속 괴이 + 퇴마사
동남아 민속 괴이를 잡는 아이소메트릭 ARPG. 우리와 테마가 가장 가깝다.
- 허브 마을 **Seaport는 90년대 싱가포르** 모티프(요트·자동차·상점). 비판: 마을은 현대인데 필드는 시대 불명 늪·숲이라 이질적. 출처: [TheGamer](https://www.thegamer.com/ghostlore-is-a-decent-diablo-arpg-with-southeast-asian-influences/)
- 클래스 중 **Exorcist(퇴마사)**: 여러 문화의 퇴마를 모티프로 한 기술 4개(혈술·부적). 출처: [Steam](https://store.steampowered.com/app/1783280/Ghostlore/), [PC Gamer](https://www.pcgamer.com/ghostlore-is-diablo-but-with-chinese-hopping-vampires-and-indonesian-boar-demons/)
- **민속 규칙을 게임 규칙으로**: 바나나 나무에 사는 퐁티아낙은 무적이라 쫓아오기만 하고, 씐 나무를 부숴야 죽는다. 출처: [GameRant 인터뷰](https://gamerant.com/ghostlore-eastpunk-arpg-southeast-asian-mythology-influences/)
- 기술 배치: 7×7 격자에 기술과 강화를 같은 행·열로 맞춰 연결. 출처: [Twinfinite](https://twinfinite.net/features/ghostlore-hands-on-preview-a-distinctly-flavorful-southeast-asian-affair/)
- **가져올 것**: ① "괴담의 규칙 = 공략법"(예: 달걀귀신은 얼굴이 없어 정면이 없다 → 아무 방향에서나 공격하지만 등 뒤 개념이 없음, 처녀귀신은 머리카락을 자르면 약해짐 등). ② 허브와 필드의 시대감을 맞출 것: 우리는 필드도 서울(인쇄소 지하, 지하철, 노포)이라 이 비판을 피함.

## 4. Enter the Gungeon (Dodge Roll, 2016) — 구르기 수치
- 구르기 전체 약 0.7초, **앞 절반만 무적**(첫 한두 프레임 제외). 뒤 절반은 관성만 있고 맞는다. 그래서 아무 때나 구르면 손해, 타이밍이 중요. 리드 디자이너가 "이 게임의 가장 큰 매력은 구르기"라고 함. 출처: [Gungeon Wiki: Dodge Roll](https://enterthegungeon.wiki.gg/wiki/Dodge_Roll_(Move)), [Automaton](https://automaton-media.com/articles/iotw/indie-pick-153-enter-the-gungeon/)
- **가져올 것**: 우리 돌진도 "짧은 무적 + 긴 후딜". 무적 구간 0.14초 / 전체 0.18초 이동 + 0.45초 재사용으로 시작.

## 5. Moonlighter (Digital Sun, 2018) — 낮 경영 / 밤 던전
- 낮엔 가게, 밤엔 던전. 던전 전리품을 다음 날 가게에서 판다. 던전 안에서 **거울로 즉석 판매 가능(대신 크게 깎인 값)** = 우리 공중전화와 같은 "지금 빠질까" 장치. 출처: [Wikipedia](https://en.wikipedia.org/wiki/Moonlighter_(video_game)), [Cubed3](https://www.cubed3.com/games/reviews/nintendo-switch/moonlighter)
- 가격표가 없고 손님 표정 아이콘으로 적정가를 추리. 마을 게시판으로 상인을 들여 마을이 커짐. 가게 확장 비용이 단계마다 가파르게 오름(8,000 → 250,000골드). 출처: [Moonlighter Wiki](https://moonlighter.fandom.com/wiki/The_Moonlighter), [TheGamer](https://www.thegamer.com/moonlighter-shop-upgrades/)
- 비판: 가게 운영이 단순하다 / 일처럼 느껴진다로 갈림. 출처: [RPGamer](https://rpgamer.com/review/moonlighter-review/), [Third Coast Review](https://thirdcoastreview.com/games-tech/2018/07/05/game-review-moonlighter)
- **가져올 것**: 경영은 가볍게 유지한다는 우리 결정이 맞음. 허브가 의뢰 진행에 따라 사람이 늘며 커지는 구조(경리 → 뚱냥이 → …).

## 6. Hades (Supergiant, 2020)
방 단위 진행 + 방 클리어 보상 3택(축복). 개발 자료는 대부분 대사·서사 쪽이라 전투 수치 출처는 못 찾음. 전투 디자이너 인터뷰에서 "직접 그린 방에 장애물을 무작위로 둘지"를 고민했다고 함. 출처: [DigiPen](https://www.digipen.edu/showcase/news/eduardo-gorinstein-delivers-challenge-and-fun-hades)
- **가져올 것**: 이미 반영(강화 카드 덱 = 축복).

## 7. 종합: 우리 실시간 전투의 기준값 (첫 시험판)
| 항목 | 값 | 근거 |
|------|----|------|
| 타일 / 배율 | 16px / 2.5배, 카메라 추적 | japda |
| 이동 | 초당 5칸 | 코어키퍼 체감 |
| 베기 | 반경 1.6칸, 부채꼴 약 115°, 0.28초마다, 3타째 강타 | Death's Door 콤보 |
| 돌진 | 0.18초 이동, 앞 0.14초 무적, 재사용 0.45초 | Gungeon 앞 절반 무적 |
| 발도 | 근접 예고가 맞기 직전 0.22초 안에 누르면 반격 + 경직. 헛치면 0.45초 빈틈 | Sekiro식 패리, 우리 턴제판 규칙 |
| 진심 게이지 | 명중 1회 +1, 5칸이면 아무 때나 원형 일섬 | Death's Door 마법 충전 |
| 적 공격 | 전부 바닥 예고(부채꼴/원/직선/띠). 근접만 발도 가능, 돌진·띠는 회피 | japda 보스 예고, 글럼 리듬 |
| 보스 | 예고 → 회피 → 경직 리듬, 절반 체력에서 예고 짧아짐 | 글럼, japda |
| 합격 기준 | 가만히 서서 공격만 하는 봇은 거의 못 깨고, 예고 보고 피하는 봇은 깸 | 지난 액션판 실패(6/8) 교훈 |
