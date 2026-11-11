# 연출 표 (자동 생성 — 손으로 고치지 말 것)

`npm run feel`이 `src/types/events.ts`의 사건마다 `src/scenes/shared/vfx.ts`가 붙인 연출을 센다. 판단(빈칸·과한 곳)은 [전투 문서](design/2-night/combat.md) "연출 점검".

| 사건 | 멈칫 | 흔들림 | 번쩍 | 고리 | 글자 | 소리 | 소리 이름 | 채널 수 | 설명 |
|------|---|---|---|---|---|---|------|------|------|
| `enemyHit` | ● |  | ● | ● | ● | ● | hit | 5 |  |
| `enemyKilled` | ● | ● |  | ● |  | ● | kill | 4 |  |
| `enemyTeleport` |  |  |  | ● |  |  |  | 1 |  |
| `enemyBlocked` |  |  |  | ● |  | ● | block | 2 | a ghost trait turned the blow away (도깨비 guard) |
| `enemyBurst` |  |  |  | ● |  | ● | hurt | 2 | a burster's blast |
| `playerGrabbed` |  |  |  | ● |  |  |  | 1 | grab trait: rooted |
| `shotCut` |  |  |  | ● |  | ● | block | 2 | a swing cut a ghost's bullet |
| `ghostRally` |  |  |  | ● |  |  |  | 1 | rally trait: the call went out |
| `skillStolen` |  |  |  |  | ● |  |  | 1 |  |
| `skillRecovered` |  |  |  | ● |  | ● | clear | 2 |  |
| `thiefEscaped` |  |  |  | ● |  |  |  | 1 |  |
| `playerHurt` | ● | ● | ● |  | ● | ● | hurt | 5 |  |
| `playerHealed` |  |  |  |  | ● |  |  | 1 |  |
| `shieldBlocked` |  |  |  | ● |  | ● | block | 2 |  |
| `pickupCollected` |  |  |  |  |  | ● | pickup | 1 |  |
| `slash` |  |  |  |  |  | ● | slash | 1 |  |
| `dash` |  |  |  | ● |  | ● | dash | 2 |  |
| `parry` | ● | ● |  | ● |  | ● | parry | 4 | 발도 counter / focus strike lands |
| `drawStance` |  |  |  |  |  | ● | stance | 1 | 발도 pressed: stance before the cut |
| `drawCut` | ● | ● |  |  |  | ● | cut | 3 | plain 발도 lands |
| `bossPhase` |  | ● |  |  |  | ● | phase | 2 |  |
| `survivorCry` |  |  |  |  |  |  |  | **없음** | rescue: the hidden person cries (HUD points the way) |
| `survivorFound` |  |  |  |  |  |  |  | **없음** |  |
| `survivorHurt` |  |  |  |  |  |  |  | **없음** |  |
| `objectiveDone` |  |  |  |  |  | ● | clear | 1 |  |
| `lastBreath` |  |  |  | ● |  | ● | parry | 2 | 마지막 숨 kept the director at 1 HP |
| `quarryFled` |  |  |  | ● |  | ● | dash | 2 | 추격: the quarry bolted to the next floor |
| `wardSealed` |  |  |  | ● |  | ● | clear | 2 | 결계: one site finished |
| `clockAdded` |  |  |  |  | ● |  |  | 1 | 속전속결: a strong kill put time back on the clock |
| `clockOut` |  |  |  | ● |  | ● | hurt | 2 | 속전속결: time ran out |
| `lairLocked` |  | ● |  |  |  | ● | phase | 2 | 괴이 소굴: the doors sealed (the map redraws) |
| `lairOpened` |  |  |  |  |  |  |  | **없음** |  |
| `shardCollected` |  |  |  | ● |  | ● | clear | 2 |  |
| `skillUsed` |  |  |  | ● |  | ● |  | 2 |  |
| `shotHit` |  |  |  | ● |  | ● | hit | 2 |  |
| `roomCleared` |  |  |  |  |  | ● | clear | 1 |  |
| `darkness` |  |  |  |  |  |  |  | **없음** |  |
| `phaseChanged` |  |  |  |  |  |  |  | **없음** |  |

소리 재사용: clear ×5 · hurt ×3 · block ×3 · hit ×2 · parry ×2 · dash ×2 · phase ×2 · kill ×1 · pickup ×1 · slash ×1 · stance ×1 · cut ×1
