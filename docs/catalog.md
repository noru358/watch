# 나이트워치 총괄 장부 (자동 생성)

`npm run catalog`가 코드에서 뽑은 것 (2026-10-29). 손으로 고치지 말 것 — 표의 원본을 고치고 다시 뽑는다. 글자는 전부 `src/i18n/ko.ts`.

## 의뢰 목표
고치는 곳: `src/data/objectives.data.ts`

| 목표 | id | 등급 | 가중치 | 길이 | 끝나는 층 | 보수× | 파편 | 오염− | 난이도+ | 보수 예(3층, 오염0→3) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 섬멸 | clear | 0 | 3 | 2~4 | last | 1 | 0 | 2 | 0 | 150→180 |
| 구조 | rescue | 0 | 2 | 2~4 | 1 | 1.1 | 0 | 2 | 2 | 200→200 |
| 현상수배 | bounty | 1 | 2 | 2~4 | random | 1.5 | 1 | 3 | 8 | 270→320 |
| 추격 | chase | 2 | 1.5 | 3~4 | any | 1.4 | 1 | 2 | 8 | 250→290 |
| 결계 | ward | 0 | 1.5 | 2~3 | random | 0.8 | 0 | 4 | 4 | 140→170 |
| 첫차까지 | firsttrain | 1 | 1.5 | 1~2 | last | 1.2 | 0 | 2 | 6 | 220→220 |
| 속전속결 | timeattack | 0 | 2 | 1~3 | random | 1.2 | 0 | 3 | 5 | 220→250 |

- 구조: hp 6 · radius 0.3 · hurtIframes 0.7 · findRange 1.4 · fearPerSecond 0.013333333333333334 · fearNearMult 2.5 · nearRange 4.5 · fearRelief 0.04 · cryEvery 5 · followSpeed 5.6 · followGap 0.9 · carryMoveMult 0.85
- 현상수배: hpMult 4 · hpPerLevel 1 · damageAdd 1 · speedMult 1.1 · windupMult 0.85 · maxLevel 3
- 추격: hpMult 5 · damageAdd 1 · speedMult 1.15 · windupMult 0.9 · regenPerSecond 0.02 · wakeRange 3
- 결계: sites 3 · minApart 9 · radius 1.6 · fillTime 9 · drainPerSecond 0.06 · swarmFaster 2
- 첫차까지: time 75 · timePerRisk 6 · spawnEvery 11 · capGrowthEvery 15 · startEnemies 3
- 속전속결: startBase 14 · startPerStrong 2.5 · perKill 3 · spiritPerSecond 2 · spiritCap 60 · bonusPieces 6

## 현장 변형
고치는 곳: `src/data/modifiers.data.ts`

| 변형 | id | 종류 | 등급 | 가중치 | 보수+ | 난이도+ | 하는 일 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 정전 | blackout | warning | 0 | 1 | 25% | 3 | 층 전체가 어둡다. 몇 칸 앞만 보인다. |
| 괴이 소굴 | lair | warning | 0 | 1 | 20% | 3 | 방 하나에 무리가 잠들어 있다. 들어가면 문이 닫히고, 비우면 영력 더미. |
| 물결 폭증 | surge | warning | 0 | 1 | 25% | 3 | 도깨비불이 훨씬 자주, 많이 몰려온다. |
| 사무치는 원한 | regen | warning | 1 | 1 | 15% | 2 | 3초 동안 안 맞은 괴이는 초당 체력 5%씩 회복한다. |
| 독한 원한 | lethal | warning | 2 | 1 | 25% | 4 | 모든 괴이의 공격이 1 더 아프다. |
| 성급한 귀신 | haste | warning | 2 | 1 | 25% | 4 | 괴이가 20% 빠르고 예고가 짧다. |
| 질긴 놈들 | tough | warning | 1 | 1 | 20% | 3 | 강적 체력 +40%. |
| 탁한 공기 | lesshealing | warning | 1 | 0.8 | 15% | 2 | 회복이 절반만 된다. |
| 망령 행렬 | subwayline | warning | 1 | 0.8 | 20% | 3 | 강적이 거의 지하철 망령. 받아칠 수 없으니 피해야 한다. |
| 영력 풍년 | windfall | boon | 0 | 0.8 |  | 0 | 바닥 영력 +50%, 도깨비불도 영력을 떨어뜨린다. |
| 맑은 밤 | clearnight | boon | 0 | 0.6 |  | 0 | 소장이 15% 빠르게 움직인다. |
| 약점 노출 | weakspot | boon | 0 | 0.6 |  | 0 | 발도 피해 +30%. |

## 의뢰 사연 (의뢰인)
고치는 곳: `src/data/requests.data.ts + ko.ts request.<id>.client/.text`

| id | 의뢰인 | 목표 | 동네 | 괴이 | 사연 |
| --- | --- | --- | --- | --- | --- |
| flicker | 호프집 사장님 | 섬멸 | 어디든 | 동네 따라 | 간판 불이 밤마다 혼자 깜빡여요. 손님이 무섭다고 안 와요. |
| smoke | 옥탑방 세입자 | 섬멸 | 옥탑 달동네, 폐모텔, 노포 골목 | 동네 따라 | 빨래를 널면 누가 자꾸 걷어 가요. CCTV엔 아무도 없고요. |
| karaoke | 노래방 사장님 | 섬멸 | 을지로 지하상가, 인쇄소 골목, 을지로3가역 | 동네 따라 | 빈 방에서 자꾸 노래 예약이 들어와요. 들어가 보면 마이크만 따뜻해요. |
| crying | 편의점 야간 알바 | 구조 | 어디든 | 처녀귀신 | 새벽 세 시만 되면 뒷골목에서 우는 소리가 나요. 같이 일하던 언니가 그쪽으로 간 뒤로 연락이 안 돼요. |
| missing | PC방 사장님 | 구조 | 을지로 지하상가, 을지로3가역, 폐모텔 | 동네 따라 | 알바생이 지하 창고에 라면 박스 가지러 내려간 뒤로 안 올라와요. 전화는 받는데 울기만 해요. |
| faceless | 배달 기사 | 현상수배 | 노포 골목, 을지로 지하상가, 옥탑 달동네 | 달걀귀신, 처녀귀신 | 골목에서 길을 물어본 사람이… 얼굴이 없었어요. 그놈 좀 잡아 주세요. |
| poster | 상인회장 | 현상수배 | 어디든 | 동네 따라 | 골목마다 붙은 수배 전단 보셨죠? 상인회에서 돈 모았습니다. 그놈만 잡아 주세요. |
| footsteps | 야간 경비원 | 추격 | 인쇄소 골목, 폐모텔, 옥탑 달동네 | 동네 따라 | 아무도 없는 위층에서 슬리퍼 끄는 소리가 나요. 쫓아가면 계단 아래로 달아나요. |
| snatcher | 고물상 할아버지 | 추격 | 노포 골목, 인쇄소 골목, 을지로 지하상가 | 동네 따라 | 리어카에 실어 둔 놋그릇을 뭔가 들고 달아났어. 지하로, 지하로 내려가더라고. |
| cold_spot | 인쇄소 막내 | 결계 | 노포 골목, 인쇄소 골목, 폐모텔 | 달걀귀신 | 지하 창고 한구석만 한겨울이에요. 거기 서면 얼굴이 기억이 안 나요. 부적이라도 붙여 주세요. |
| shrine | 점집 할머니 | 결계 | 노포 골목, 옥탑 달동네, 폐모텔 | 동네 따라 | 골목 성황당 금줄이 끊겼어. 다시 매 놓지 않으면 동네가 다 시끄러워질 게야. |
| last_train | 역무원 | 첫차까지 | 을지로3가역, 을지로 지하상가 | 지하철 망령, 처녀귀신 | 막차가 끊긴 뒤에도 승강장에 열차 불빛이 들어와요. 첫차 올 때까지만 승강장 좀 지켜 주세요. |
| taxi | 택시 기사 | 첫차까지 | 을지로3가역, 인쇄소 골목, 옥탑 달동네 | 동네 따라 | 새벽 정류장에 손님이 줄을 섰는데 다 그림자예요. 첫차 올 때까지만 버티면 흩어진대요. |
| closing | 지하상가 상인회장 | 속전속결 | 을지로 지하상가, 노포 골목 | 동네 따라 | 셔터 내리기 전에 다 치워 주셔야 해요. 문 닫고 나면 그것들이 가게 안으로 들어와요. |
| checkout | 모텔 야간 카운터 | 속전속결 | 폐모텔 | 동네 따라 | 퇴실 시간 전에 복도를 비워 주세요. 손님들이 나오다 마주치면 큰일 나요. |
| deadline | 마감 앞둔 인쇄소 사장 | 속전속결 | 인쇄소 골목, 옥탑 달동네, 을지로3가역 | 동네 따라 | 새벽 다섯 시에 판을 돌려야 해요. 그 전에 기계 앞에 선 것들 좀 치워 주세요. 빨리요. |

## 현상수배 · 추격 표적 이름
고치는 곳: `ko.ts wanted.pre.N (앞말) · wanted.suf.N (뒷말) — 줄만 더하면 됨`

앞말: 붉은, 젖은, 웃는, 굽은, 긴, 쉰 목소리, 창백한, 목 없는, 거꾸로 선, 불 꺼진, 금 간, 눈먼, 타는, 늙은, 어린, 굶주린, 잠 못 드는, 비 맞은, 흐느끼는, 뒤틀린, 얼어붙은, 썩은, 검은, 하얀, 세 번째, 이름 없는

뒷말: 댕기, 손톱, 그림자, 맨발, 눈, 혀, 머리카락, 손, 우산, 신부, 아이, 할멈, 승객, 손님, 우체부, 등불, 거울, 목소리, 발자국, 이빨, 웃음, 비녀, 상여꾼, 문지기, 검침원, 막차

## 판 · 보수 · 오염
고치는 곳: `src/data/office.data.ts`

- rentEvery 7 · rent 450 · boardSize 4
- general: enemiesBase 5 · feeBase 60 · feePerDifficulty 30 · feePerFloor 20 · feePerTargetLevel 0.15 · payphoneFrom 3
- difficulty steps 20/30/42/55 · boss 20 · per level 4
- contamination: max 5 · expireRise 1 · failRise 1 · overflow: at 5 · days 2 · feeMult 1.5 · repMult 1.5 · rise 1 · rep 10
- swarm: every 6.5 · everyPerRisk -0.4 · group 4 · cap 12 · capPerRisk 2 · joint: max 3 · extraFloors 1

## 동네
고치는 곳: `src/data/nodes.data.ts`

| 동네 | id | 등급 | 시작 오염 | 괴이 | 층 모습 | 이웃 |
| --- | --- | --- | --- | --- | --- | --- |
| 노포 골목 | alley | 0 | 2 | 처녀귀신, 달걀귀신 | alley, basement | 인쇄소 골목, 을지로 지하상가 |
| 인쇄소 골목 | printshop | 0 | 1 | 달걀귀신, 처녀귀신 | alley, basement | 노포 골목, 을지로3가역, 폐모텔, 옥탑 달동네 |
| 을지로 지하상가 | arcade | 0 | 1 | 처녀귀신, 지하철 망령 | arcade, basement | 노포 골목, 을지로3가역 |
| 을지로3가역 | station | 0 | 0 | 지하철 망령, 달걀귀신 | arcade, basement | 을지로 지하상가, 인쇄소 골목, 폐모텔 |
| 폐모텔 | motel | 1 | 0 | 처녀귀신, 달걀귀신, 지하철 망령 | basement, alley | 인쇄소 골목, 을지로3가역, 옥탑 달동네 |
| 옥탑 달동네 | rooftop | 2 | 0 | 달걀귀신, 처녀귀신 | rooftop, alley | 인쇄소 골목, 폐모텔 |

## 괴이
고치는 곳: `src/data/ghosts.data.ts`

| 괴이 | id | 체력 | 피해 | 속도 | 공격 | 예고 | 영력 | 그 밖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 처녀귀신 | cheonyeo | 9 | 2 | 2.4 | cone | 0.6 | 3 | 순간이동 6초 |
| 달걀귀신 | dalgyal | 18 | 2 | 1.3 | circle | 0.9 | 5 | 어둠 4초 |
| 지하철 망령 | subway | 11 | 3 | 1.8 | line | 0.7 | 4 |  |
| enemy.dokkaebibul | dokkaebibul | 2 | 닿으면 1 | 3.1 | none | 0 | 1 | 무리 |

- 보스 구미호: hp 120 · damage 3 · speed 1.1 · radius 0.9 · drop 40 · slamRange 1.9 · slamTrigger 1.3 · slamWindup 0.8 · sweepEvery 4.5 · sweepWindup 1 · sweepWidth 1.3 · sweepDamage 3 · summonEvery 8 · summon dokkaebibul · summonCount 3 · summonSpread 2 · recover 0.9 · phase2Ratio 0.5 · phase2Mult 0.7

## 메인 스토리 장
고치는 곳: `src/data/chapters.data.ts · contracts.data.ts`

| 장 | id | 앞 장 | 열림(일 / 오염) | 단서 | 단서 동네 | 본 의뢰 | 보수 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1장 | ch1 |  | 3 / 0 | 0 | 노포 골목 | 메인 의뢰 1 5층 | 300 |
| 2장 | ch2 | ch1 | 4 / 4 | 3 | 을지로3가역, 을지로 지하상가 | 메인 의뢰 2 4층 | 450 |

## 장면 대사
고치는 곳: `src/data/story.data.ts (순서) · ko.ts scene.*`

- **intro**: 소장 "…또 월세 고지서네." / 소장 "낮엔 회사, 밤엔 퇴마. 투잡 인생 만세다." / 소장 "현관문 앞 의뢰판부터 보자. 오늘 밤 갈 데를 골라야 월세를 막지."
- **bookkeeper**: 경리 "소장님! 의뢰 하나 끝냈다면서요? 장부는 제가 볼게요." / 소장 "…누구세요?" / 경리 "옥탑방에 얹혀사는 취준생이요. 월세 같이 막아야죠. 제 책상 앞에서 E 누르시면 장부 보여 드릴게요."
- **lights_out_done**: (장 인물) "(대사 미정)" / 소장 "(대사 미정)" / 소장 "(대사 미정)"
- **ch2_start**: 경리 "(대사 미정)" / 소장 "(대사 미정)" / 경리 "(대사 미정)" / 소장 "(대사 미정)"
- **ch2_ready**: 경리 "(대사 미정)" / 소장 "(대사 미정)" / 경리 "(대사 미정)"
- **ch2_done**: 소장 "(대사 미정)" / 경리 "(대사 미정)" / 소장 "(대사 미정)"

## 트레이닝 (돈)
고치는 곳: `src/data/training.data.ts`

전부 사면 ₩96010 · 201단계 · 값 = 첫 값 × (그 줄 단계+1) × (1 + 0.005 × 산 횟수)

| 갈래 | 줄 | id | 능력치 | 방식 | 단계당 | 최대 | 첫 값 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 완력 | 베기 피해 | slash | slash | mult | 0.02 | 10 | 60 |
| 완력 | 발도 피해 | draw | drawSlash+draw | mult | 0.02 | 10 | 60 |
| 완력 | 베기 리치 | reach | reach | add | 0.025 | 6 | 100 |
| 완력 | 3타 막타 피해 | finisher | comboBonus | mult | 0.05 | 6 | 50 |
| 완력 | 강적 피해 | strong | strongDamage | add | 0.02 | 5 | 80 |
| 완력 | 도깨비불 피해 | fodder | fodderDamage | add | 0.05 | 4 | 40 |
| 완력 | 보스·표적 피해 | boss | bossDamage | add | 0.02 | 5 | 90 |
| 손놀림 | 휘두르기 간격 | swing | swingTime | mult | -0.015 | 10 | 70 |
| 손놀림 | 발도 재사용 | drawcd | drawCooldown | mult | -0.025 | 8 | 70 |
| 손놀림 | 3타 뒤 숨 고르기 | recover | finisherRecovery | mult | -0.025 | 6 | 60 |
| 손놀림 | 공격 중 이동 | attackMove | attackMove | add | 0.03 | 5 | 60 |
| 몸놀림 | 이동 속도 | move | moveSpeed | mult | 0.01 | 10 | 60 |
| 몸놀림 | 돌진 재사용 | dashcd | dashCooldown | mult | -0.02 | 10 | 70 |
| 몸놀림 | 돌진 거리 | dashlen | dashSpeed | mult | 0.025 | 4 | 70 |
| 몸놀림 | 돌진 무적 | dashguard | dashIframes | add | 0.01 | 4 | 80 |
| 담력 | 최대 체력 | hp | maxHp | add | 1 | 4 | 140 |
| 담력 | 받아치기 여유 | parry | parryWindow | add | 0.005 | 6 | 120 |
| 담력 | 맞은 뒤 무적 | iframes | hurtIframes | add | 0.025 | 4 | 100 |
| 담력 | 받는 피해 감소 | guard | damageTaken | add | -0.02 | 5 | 100 |
| 담력 | 어둠 저항 | dark | darkResist | add | 0.08 | 4 | 90 |
| 담력 | 회복량 | heal | healMult | add | 0.05 | 4 | 60 |
| 진심 | 진심 게이지 칸 수 | gauge | focusMax | add | -1 | 1 | 490 |
| 진심 | 검신 노출 시간 | bare | bareTime | add | 0.25 | 4 | 70 |
| 진심 | 진심 차는 양 | focusGain | focusGain | add | 0.05 | 4 | 80 |
| 눈썰미 | 치명 확률 | crit | critChance | add | 0.01 | 10 | 60 |
| 눈썰미 | 치명 피해 | critDmg | critDamage | add | 0.05 | 6 | 70 |
| 수완 | 영력 끌어오기 범위 | magnet | magnet | mult | 0.05 | 6 | 40 |
| 수완 | 영력 획득 | spirit | spiritGain | add | 0.02 | 10 | 60 |
| 수완 | 파편 확률 | shard | shardChance | add | 0.02 | 5 | 130 |
| 수완 | 수임료 | fee | feeBonus | add | 0.01 | 10 | 80 |
| 전문 | 결계 채우기 | ward | wardSpeed | add | 0.04 | 5 | 50 |
| 전문 | 구조 의뢰인 체력 | survivor | survivorHp | add | 0.06 | 5 | 50 |
| 전문 | 첫차까지 시간 | train | trainTime | add | -0.02 | 5 | 50 |

## 기술 (심연 파편)
고치는 곳: `src/data/skills.data.ts`

| 칸 | 파편 | 고르는 것 |
| --- | --- | --- |
| blade1 | 1 | 돌진 베기: 돌진이 끝날 때 앞을 한 번 벤다. / 3타 파문: 3타 막타가 주변 한 바퀴도 절반 피해로 벤다. |
| blade2 | 2 | 받아친 기세: 받아치기에 성공하면 진심 게이지 2칸. / 칼집 소리: 그냥 발도에 맞은 괴이가 잠깐 굳는다. |
| blade3 | 3 | 남은 진심: 일섬을 쓰고 나서 진심 게이지가 2칸 남는다. / 벗겨진 신문: 검신 노출 중 맞힐 때마다 노출이 조금 늘어난다. |
| blade4 | 4 | 뒤따르는 칼: 휘두를 때 25% 확률로 앞을 60% 위력으로 한 번 더. / 기세: 베기로 맞힐 때마다 기세 +1(최대 5), 기세당 베기 피해 +3%. 3초 안 때리면 사라짐. / 부정 타기: 베기에 맞은 괴이에 부정 1스택(초당 1, 최대 3스택, 4초). |
| step1 | 1 | 소금 자국: 돌진한 자리에 소금이 남아 도깨비불이 닿으면 사라진다. / 되받아 빠지기: 받아치기에 성공하면 돌진이 바로 다시 찬다. |
| step2 | 2 | 두 번 돌진: 돌진을 두 번까지 모아 둔다. / 그림자 걸음: 돌진하는 내내 맞지 않는다. |
| step3 | 3 | 스치기: 돌진으로 공격을 흘리면 진심 게이지 2칸. / 질주: 공격하지 않고 1초 넘게 달리면 다음 공격 전까지 15% 빨라진다. |
| step4 | 4 | 서리 소금: 발도에 맞은 괴이가 2초 동안 30% 느려진다. / 날 선 돌진: 돌진이 닿는 괴이를 베기 30%로 벤다(0.2초마다). / 버티기: 받는 피해 −20%, 대신 이동 −5%. |
| eye1 | 1 | 귀신 눈: 화면 밖 강적이 가장자리에 표시된다. / 영력 눈: 영력을 두 배 멀리서 끌어온다. |
| eye2 | 2 | 숨 고르기: 한 번도 안 맞고 층을 넘기면 체력 2 회복. / 원한 먹기: 강적을 쓰러뜨리면 체력 1 회복. |
| eye3 | 3 | 마지막 숨: 하룻밤에 한 번, 쓰러질 공격을 체력 1로 버틴다. / 욕심: 강적이 영력을 3 더 떨어뜨린다. |
| eye4 | 4 | 벼랑 끝: 체력이 1/4 아래면 주는 피해 ×1.3. / 복수: 맞으면 3초 동안 베기 피해 ×1.2. / 원혼 폭발: 강적을 쓰러뜨리면 근처 셋까지 베기 ×1로 터진다. / 영력 털기: 강적을 맞힐 때 10% 확률로 영력 1이 튄다. |
| craft1 | 1 | 문턱 자석: 층을 넘길 때 바닥에 남은 영력을 다 주워 간다. / 지름길 냄새: 모든 층에서 계단 쪽 화살표가 보인다. |
| craft2 | 2 | 결계 솜씨: 결계 의뢰의 원이 15% 빨리 찬다. / 보살핌: 구조 의뢰인 체력 +30%. / 새벽 손님: 첫차까지 기다릴 시간 −15%. |

| 듀오 | 조건 | 효과 |
| --- | --- | --- |
| 서리 자국 | 소금 자국 + 서리 소금 | 소금 자국 + 서리 소금: 돌진 길의 괴이가 느려진다. |
| 기세의 그림자 | 기세 + 뒤따르는 칼 | 기세 + 뒤따르는 칼: 기세 5면 맞힐 때 30% 위력으로 한 번 더. |
| 부정 터짐 | 부정 타기 + 원혼 폭발 | 부정 타기 + 원혼 폭발: 쓰러뜨린 자리 주변에 부정이 옮는다. |

| 액티브 | id | 파편 | 재사용 | 효과 | 개조 |
| --- | --- | --- | --- | --- | --- |
| 부적 던지기 | talisman | 2 | 6 | 조준한 쪽으로 부적을 날린다. 처음 맞은 괴이에 피해 4, 1.5초 기절. 재사용 6초. | 부적: 관통, 부적: 세 갈래, 부적: 빠른 손 |
| 결계 펴기 | barrier | 2 | 14 | 2초 동안 아무것도 소장을 다치게 못 하고, 원 안 도깨비불이 탄다. 재사용 14초. | 결계: 넓게, 결계: 쉼터, 결계: 터뜨리기 |
| 소금 뿌리기 | salt_burst | 2 | 10 | 주변 도깨비불이 전부 사라지고 강적이 움찔한다. 재사용 10초. | 소금: 얼음 소금, 소금: 한 줌 더, 소금: 정신 차리기 |
| 그림자 분신 | shadow_double | 4 | 30 | 12초 동안 모든 타격이 60% 위력으로 한 번 더. 재사용 30초. |  |
| 영력 터뜨리기 | spirit_burst | 3 | 8 | 4칸 안 바닥 영력을 전부 터뜨려 주변을 친다. 그 영력은 사라진다. 재사용 8초. |  |
| 축지법 | shrink_step | 3 | 7 | 조준 방향으로 5칸 순간이동, 도착한 자리 주변을 벤다. 재사용 7초. |  |
| 연쇄 부적 | chain_charm | 3 | 9 | 부적이 맞은 괴이에서 셋까지 번개처럼 튄다. 재사용 9초. |  |
| 연막 | smoke | 3 | 18 | 3초 동안 반지름 2.5칸 안에서 맞지 않는다. 재사용 18초. |  |
| 기세 해방 | momentum_release | 3 | 6 | 모은 기세를 한 번에: 기세당 베기 ×0.8로 주변을 벤다. 재사용 6초. |  |
| 원혼 사슬 | grudge_chain | 3 | 12 | 주변 괴이에 표식, 표식 괴이를 다음에 때리면 베기 ×3. 재사용 12초. |  |

## 장신구
고치는 곳: `src/data/gear.data.ts`

- 경제: maxLevel 10 · enhanceBase 60 · enhancePow 1.4 · rerollMax 3 · dismantleBase 40 · bag 8
- 흔함: 부옵션 0, 특수 없음, 끝까지 강화 ₩7050
- 드묾: 부옵션 1, 특수 없음, 끝까지 강화 ₩10580
- 귀함: 부옵션 2, 특수 없음, 끝까지 강화 ₩15510
- 전설: 부옵션 3, 특수 있음, 끝까지 강화 ₩21140
- 염주 팔찌 (공격): 베기 피해 0.04+0.008/단계, 발도 피해 0.04+0.008/단계, 치명 확률 0.03+0.004/단계
- 호부 목걸이 (버티기): 최대 체력 1+0.2/단계, 받는 피해 -0.03+-0.006/단계, 회복량 0.08+0.016/단계
- 방울 키링 (몸놀림·살림): 이동 속도 0.02+0.004/단계, 돌진 재사용 -0.03+-0.006/단계, 영력 획득 0.05+0.01/단계
- 부옵션: 베기 피해 0.01~0.03, 발도 피해 0.01~0.03, 치명 확률 0.01~0.03, 치명 피해 0.03~0.08, 강적 피해 0.02~0.05, 도깨비불 피해 0.05~0.12, 보스·표적 피해 0.02~0.05, 최대 체력 1~1, 받는 피해 -0.03~-0.01, 어둠 저항 0.04~0.1, 회복량 0.04~0.1, 이동 속도 0.01~0.03, 돌진 재사용 -0.05~-0.02, 진심 차는 양 0.03~0.08, 영력 획득 0.03~0.08, 파편 확률 0.01~0.03, 결계 채우기 0.04~0.1, 구조 의뢰인 체력 0.05~0.12, 첫차까지 시간 -0.05~-0.02
- 전설 특수: 원혼 폭발(강적을 쓰러뜨리면 근처 셋까지 터진다.) / 뒤따르는 칼(휘두를 때 20% 확률로 앞을 50% 위력으로 한 번 더.) / 서리 방울(맞힌 괴이가 1.5초 25% 느려진다(1초마다).) / 벼랑 끝(체력 1/4 아래면 주는 피해 ×1.25.) / 영력 털기(강적을 맞힐 때 8% 확률로 영력 1.) / 복수(맞으면 3초 동안 베기 피해 ×1.15.) / 부정 구슬(베기에 맞은 괴이에 부정(초당 1, 3초, 최대 2스택).)
- 떨어지는 곳: 현상수배 표적 100%, 괴이 소굴 보물 35%, 깊은 층 보물 방 50%, 메인 스토리 보스 100% epic+

## 시설 · 보급품 · 트라우마
고치는 곳: `src/data/facilities.data.ts · penalties.data.ts`

- 경리 책상: 600/1200/2000 (등급 0/1/2) — 의뢰판 +1장 / 안 가 본 동네 괴이도 보임 / 일반 의뢰 마감 +1일
- 부적 작업대: 500/1000/1800 (등급 0/1/2) — 설치 · 보급: 소금 한 봉 / 보급 +박카스 / 보급 +지도 사본
- 낡은 소파: 800/1500 (등급 0/1) — 휴식하기 트라우마 −1 더 / 휴식하기 트라우마 −1 더
- 보급품 소금 한 봉 ₩60 (작업대 1): 첫 층에서 공격 두 번을 막아 준다.
- 보급품 박카스 ₩100 (작업대 2): 체력이 처음 절반 아래로 떨어질 때 6 회복.
- 보급품 지도 사본 ₩120 (작업대 3): 첫 층 계단 쪽을 화살표로 알려 준다.
- 트라우마: cards 3 · fewerCardsAt 2 · fewerCards 2 · weakAt 4 · weakHp 2 · groundedAt 6 · rest 2 · capitalCost 1000 · capitalAmount 2

## 평판
고치는 곳: `src/data/reputation.data.ts (+ 각 줄의 rank)`

- 0 무명 사무소: 0점, 트레이닝 한도 40%
- 1 골목 소문: 100점, 트레이닝 한도 60%
- 2 을지로 단골: 300점, 트레이닝 한도 80%
- 3 구청이 연락하는: 650점, 트레이닝 한도 100%
- 4 서울 밤의 명함: 1200점, 트레이닝 한도 100%
- perDifficulty 10 · hotAt 4 · hotBonus 5 · main 60 · died 15 · failed 10 · expired 5

## 강화 카드 · 무기 · 주인공
고치는 곳: `src/data/cards.data.ts · weapons.data.ts · protagonist.data.ts`

- 을지로 맷집 (base): 최대 체력 +{hp}, 체력 {heal} 회복 — maxHp 4 · heal 4
- 편의점 쌍화탕 (base): 체력 {heal} 회복 — heal 8
- 소금 한 줌 (base): 층에 들어갈 때마다 피해를 {amount}번 막는 보호막 — amount 1
- 원한 흡수 (base): 괴이 처치 시 {chance}% 확률로 체력 {amount} 회복 — chance 0.35 · amount 1
- 영력 냄새 (base): 괴이 처치 시 영력 +{amount} — amount 2
- 신문지 두 겹 (newspaper_sword): 베기 피해 +{slash} — slash 1
- 푸른 벼락 (newspaper_sword): 발도 피해 +{draw} — draw 4
- 귀찮지만 진심 (newspaper_sword): 진심 게이지가 {focus}칸 빨리 참 — focusMax -1
- 찢어진 신문지 (newspaper_sword): 받아치기 후 검신이 {bare}초 더 드러남 — bareTime 2
- 세 번째는 진심 (newspaper_sword): 연속 3타째 피해 +{combo} — comboBonus 2
- 무기 신문지 사인검: slash 3 · reach 1.6 · arc 2 · swingTime 0.28 · comboWindow 0.45 · comboEvery 3 · comboBonus 1 · finisherRecovery 0.42 · knockback 0.35 · drawSlash 7 · draw 12 · drawArc 2.6 · drawReach 2.6 · burstReach 3.4 · drawStartup 0.12 · drawCooldown 1 · parryWindow 0.22 · drawStun 0.9 · focusMax 5 · bareTime 3 · bareSlashBonus 1
- 주인공 director: maxHp 12 · radius 0.32 · moveSpeed 5 · swingMoveMult 0.7 · swingSlowTime 0.1 · cornerNudge 0.4 · dashSpeed 15 · dashTime 0.18 · dashIframes 0.14 · dashCooldown 0.45 · hurtIframes 0.7 · darknessVision 3

## 효과 부품 · 훅
고치는 곳: `src/registry/effects/parts/ · src/registry/hookPoints.ts`

- blink: 축지법: step along the aim up to `range` tiles, stopping before a wall.
- buff: 잠깐 능력치: changes the floor's stats for `sec`; the same source refreshes instead of stacking.
- burst: 영력 터뜨리기: every spirit orb within `radius` bursts (the money is gone) and hurts what stands by it.
- cleanse: 정화: every swarm wisp within the radius is gone.
- collect: 문턱 자석: every spirit orb still on the floor is picked up (shards stay where they are).
- echo: 그림자 분신: for `sec`, every hit the director lands repeats at `mult` (runEffects does the repeat).
- gain: 자원: focus, HP, spirit (dropped where the enemy was), dash charges, salt shield, bare-blade time.
- hit: 추가타: front / around / the hit enemy / a chain to nearby ones.
- save: 마지막 숨: an onLethal row keeps the director standing.
- scale: Multiplies a number the hook passes along: damage about to land (onBeforeAttack), damage taken
- shot: 투사체: talismans along the aim (fanned out when count > 1); flown by rift/skills.ts updateShots.
- stack: 스택: count something up (기세 on hits …), optionally +per × stacks on a stat, lost after `decay`
- status: 상태이상 on the hit enemy (or everything within `radius`): stun / slow / curse (damage over
- zone: 장판 at the director's feet (salt, barrier); `spacing` keeps a trail from stacking up.

- onRunStart
- onRoomEnter: a new floor begins
- onTakeDamage
- onRunEnd
- onAfterHurt: damage landed and HP went down
- onLethal: HP is about to hit 0; set prevent to stay at 1
- onDashTick: every tick of a dash
- onDashEnd
- onCounter: a 받아치기 was judged
- onFocusStrike: an 일섬 was judged
- onDodge: a hit passed through the dash
- onFloorEnd: the director takes the stairs
