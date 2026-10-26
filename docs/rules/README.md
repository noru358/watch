# 🧮 숨은 규칙 장부

화면에는 결과만 보이고 계산은 뒤에서 도는 규칙을 모듈별로 모은 곳이다. 숫자 하나를 바꾸고 싶으면 여기서 그 규칙을 찾고, 적힌 파일의 적힌 이름만 고치면 된다. 기획 의도와 이유는 `docs/design/`에, "지금 코드가 실제로 어떻게 계산하나"는 여기에 둔다.

규칙을 바꾸는 코드 수정이 있으면 같은 커밋에서 이 장부도 고친다. 장부와 코드가 다르면 코드가 맞고 장부가 틀린 것이다.

| 장부 | 다루는 것 | 숫자 파일 | 계산 코드 |
|------|----------|----------|----------|
| [낮 · 사무소](office.md) | 날짜, 월세·빚, 의뢰판 생성(메인 스토리 / 일반 의뢰 = 목표·사연·동네·길이·변형·표적의 조합), 수임료·마감, 의뢰서 지표(목표·난이도·길이), 놓친 표적, 오염과 확산, 정보 안개, 묶기 | `src/data/office.data.ts`, `nodes.data.ts`, `requests.data.ts`, `contracts.data.ts` | `src/systems/office/` |
| [밤 · 한 층](floor.md) | 방 역할, 강적 배치, 층 목표 6종과 계단, 목표 층 귀환, 계속 보상, 현장 변형(정전·괴이 소굴·물결 폭증), 도깨비불 물결, 공중전화, 영력·심연 파편 줍기 | `src/data/dungeon.data.ts`, `ghosts.data.ts`, `objectives.data.ts`, `modifiers.data.ts`, `contracts.data.ts` | `src/systems/rift/` |
| [밤 · 한 판](night.md) | 층 순서, 강화 카드 뽑기, 능력치 계산, 성공·귀환·쓰러짐 정산, 트라우마 | `src/data/cards.data.ts`, `penalties.data.ts`, `protagonist.data.ts`, `weapons.data.ts` | `src/systems/run/`, `src/registry/cardEffects.ts` |
| [성장](growth.md) | 트레이닝 15줄과 값, 기술(패시브 3×3, 액티브 L), 심연 파편, 트라우마 효과와 회복, 시설 3종, 보급품 | `src/data/training.data.ts`, `skills.data.ts`, `facilities.data.ts`, `penalties.data.ts` | `src/systems/growth/`, `src/registry/perkEffects.ts` |
| [사무소 허브](hub.md) | 누가 언제 나타나나(해금), 이야기 장면 순서, 경리 잡담 | `src/data/lobby.data.ts`, `story.data.ts` | `src/systems/hub/`, `src/systems/story/` |

## 고치는 법 (AI에게 말할 때)
"`office.data.ts`의 `rent`를 450에서 600으로" 처럼 파일과 이름을 같이 말하면 가장 빠르다. 공식 자체를 바꾸는 건(예: 층수를 위험이 아니라 날짜로) 계산 코드 수정이라 테스트도 같이 바뀐다.
