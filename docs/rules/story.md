# 📖 메인 스토리 장(章) 규칙

← [장부 목록](README.md) · 기획: [이야기](../design/1-foundation/story.md) · 장면 순서: [사무소 허브](hub.md#이야기-장면-대화창)
계산 코드: `src/systems/office/chapters.ts`(`chapterStatus`, `startChapters`, `chapterAfterNight`, `mainContractsDue`), 장면 순서는 `src/systems/story/index.ts`. 숫자: `src/data/chapters.data.ts` `CHAPTERS`, 의뢰 층 구성은 `contracts.data.ts`. 테스트: `tests/chapters.test.ts`, `tests/story.test.ts`.

메인 스토리는 장 단위로 흐른다. 한 장 = 손으로 쓴 메인 의뢰 하나 + 그 장을 여는·준비되는·끝나는 장면 셋. 장은 순서대로만 열린다(앞 장이 끝나야 다음 장).

## 장의 상태
| 상태 | 뜻 | 화면 |
|------|----|------|
| 잠김(`locked`) | 아직 차례가 아님 | — |
| 단서 모으는 중(`gathering`) | 시작됨, 단서가 모자람 | 지도 해당 동네 아래 "단서 n / 3", 장부 "이야기" 줄, 시작 장면 |
| 준비됨(`ready`) | 단서가 다 모임 | 메인 의뢰가 의뢰판에 올라옴(마감 없음), 준비 장면 |
| 끝남(`done`) | 메인 의뢰 성공 | 끝 장면, 다음 장 시계가 돎 |

## 장이 시작되는 때 (`startChapters`, 매일 아침과 새 게임)
평판 등급이 장의 `rank`보다 낮으면 기다린다(지금은 전부 0).
앞 장이 끝난 날로부터 `startAfterDays`일이 지나면 **무조건** 시작한다. 그 전이라도 이 장의 단서 동네 중 하나의 오염이 `startHeat` 이상이면 바로 시작한다. 그러니 오염이 안 올라도 이야기는 멈추지 않는다 — 오염은 "앞당기는" 조건일 뿐이다.

## 단서 (`chapterAfterNight`, 밤 정산 때)
모으는 중인 장의 단서 동네(`clueNodes`)에서 받은 **일반 의뢰를 성공**하면 단서 +1. 실패·포기·다른 동네는 안 센다. 합동 출동이면 끝낸 의뢰마다 하나씩. 정산 화면에 "단서 +1 (n / 3)". 단서가 다 차면 다음 의뢰판 채우기 때 메인 의뢰가 올라온다.

## 지금 있는 장
| 장 | 메인 의뢰 | 시작 | 단서 | 의뢰 구성 |
|----|---------|------|------|---------|
| 1장 불 꺼지는 동네 | `lights_out` (노포 골목, 300) | 0장 뒤: 4일째, 또는 평판 30 (가안, 사용자 2026-10-29 "0장은 둬야 함, 날짜냐 조건이냐는 같이 고민") | 0 (열리면 바로 판에) | 4층 섬멸 + 구미호 보스(파편 3) |
| 2장 막차가 끊기지 않는 역 | `last_line` (을지로3가역, 450) | 1장 끝 + 4일, 또는 역·지하상가 오염 4 | 역·지하상가 일반 의뢰 성공 3 | 지하상가 섬멸 → 지하(정전, ☎) 섬멸 → 지하상가(성급한 귀신) 섬멸 → 「막차 기관사」 현상수배(지하철 망령 2단계 표적, 파편 3) |

2장 봇 기준(8씨앗): 읽는 봇 6/8, 서투른 봇 0/8(1장은 읽는 봇 8/8). 1장보다 한 단계 어렵게.

## 장 추가하는 법
`ids.ts`에 `ChapterId`·`ContractId`·장면 3개 `SceneId` → `contracts.data.ts`에 의뢰(층 표, 표적이 있으면 `targetNameKey`) → `chapters.data.ts`에 한 줄(`after`, `startAfterDays`, `startHeat`, `clues`, `clueNodes`, `scenes`) → `story.data.ts` `SCENES`에 대사 → ko/en. 장면 순서 규칙은 표에서 자동으로 만들어진다.
