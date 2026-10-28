# 📖 쉬운 지도 (GUIDE)

> 코드를 다 읽을 필요 없습니다. **"어디에 무엇이 있는지"만 알면** AI에게 정확히 지시할 수 있습니다.
> 사람용 지도입니다. AI용 정식 규칙은 `ARCHITECTURE.md`이고, 둘이 다르면 `ARCHITECTURE.md`가 이깁니다.
>
> **마지막 업데이트: 2026-10-29 (문서 정리)** · 작업은 전부 `main` 브랜치.

**님이 읽을 문서는 셋입니다.** 이 문서(지금 상태·실행법·어디에 무엇이), [기획 방향](docs/design/1-foundation/direction.md)(무엇이 정해졌고 무엇을 같이 정해야 하나), [로드맵](docs/design/roadmap.md)(할 일 순서). 게임의 숫자·글 전체는 [총괄 장부](https://claude.ai/artifact/YFeE4XiaLTBUWSPg1Hrm8X)(글 버전 `docs/catalog.md`), 계산 규칙은 [규칙 장부](docs/rules/README.md), 이야기는 [이야기 바이블](docs/design/1-foundation/bible.md).

---

## 📍 지금 어디까지 왔나

Gate 1(밤 전투)과 Gate 2(사무소·성장)의 기능은 들어가 있고, 사람이 해 본 적은 아직 없습니다. 숫자는 전부 봇으로 맞춘 가안입니다. 그림은 지금 수준으로 두고 나중에(님 결정). Gate 3~5는 아직.

**지금 게임에 들어 있는 것:** 타이틀 → 걸어다니는 사무소(현관문 의뢰판, 소장 책상 트레이닝·기술·장신구, 소파, 경리 장부, 부적 작업대) → 밤 출동 → 정산 → 다음 날 아침 보고. 의뢰는 메인 스토리(0장 뒤 1장, 2장)와 일반 의뢰(목표 7종 + 현장 변형 + 합동 출동 + 긴급). 동네 오염·평판 등급·트라우마·월세가 다음 선택을 바꿉니다. 자세한 건 [기획 방향](docs/design/1-foundation/direction.md)의 "정해진 것" 링크들.

---

## ⏭️ 다음에 할 일

님: 직접 해 보고 "너무 빠르다/느리다"만 말하기, 총괄 장부에 메모 남기기, 같이 정할 것(큰 이야기, 영입 방식, 첫 동료, 주인공 외형, 0장 → 1장 조건) → [기획 방향](docs/design/1-foundation/direction.md) "열려 있음".

AI: `HANDOFF.md`의 "Next tasks" 순서대로(글꼴·톤 적용, 남은 목표, 3장과 두 번째 지역 등).

---

## ▶️ 실행하기 (맥 터미널)

> 명령어는 **한 줄씩** 붙여 넣고 엔터. 설명 문구(`#` 뒤)를 같이 붙이면 zsh에서 오류가 납니다.

**처음 한 번만 (코드 받기 + 설치)**
```
cd ~
git clone https://github.com/noru358/watch.git
cd watch
npm install
```
- `git clone`에서 비밀번호를 물으면 GitHub 비밀번호 대신 **Personal Access Token**이 필요합니다. 어려우면 **GitHub Desktop** 앱으로 `noru358/watch`를 받은 뒤 그 폴더로 `cd`.
- `npm: command not found`면 https://nodejs.org 에서 LTS 버전 설치.

**게임 켤 때마다**
```
cd ~/watch
git pull
npm run dev
```
→ 브라우저에서 **http://localhost:5173**. 끌 때는 터미널에서 `Ctrl + C`. `package.json`이 바뀌었다는 안내가 있으면 `npm install` 한 번 더. 게임이 안 바뀌어 보이면 `git checkout main` 후 `git pull`.

**조작:** 사무소는 WASD로 걷고 E로 말 걸기. 밤에는 WASD 이동, 마우스 조준, 베기 J·좌클릭(누르고 있으면 연속), 돌진 Space, 발도 K·우클릭(노란 예고가 하얗게 번쩍일 때 누르면 받아치기, 진심 게이지가 꽉 차면 원형 일섬), Esc 일시정지, 1/2/3 카드·공중전화 선택. 노란 예고는 받아칠 수 있고 빨간 예고는 피해야 합니다.

---

## 🌗 게임 구조 그림

```
 ☀️ 낮 (걸어다니는 사무소 + 창)                 🌙 밤 (Phaser 게임 화면)
 ┌──────────────────────────┐    출동     ┌──────────────────────────┐
 │ 옥탑방 사무소              │ ─────────▶ │ 의뢰 현장 탐험 + 전투      │
 │ 의뢰판·지도 · 월세 · 장부   │ ◀───────── │ 보스 처치 / 공중전화 귀환   │
 └──────────────────────────┘    귀환     └──────────────────────────┘
              ▲                                       │
              └──────── 🗄️ 금고 (gameStore) ◀──────────┘
                  잔고 · 날짜 · 의뢰판 · 오염 · 결과 저장
```

---

## 🗂️ 폴더 지도 — 실제로 있는 것

```
src/
├── app/          🔌 연결부: 공용 물건(입력·금고) 만들기, 타이틀↔낮↔밤 전환 연결, 지금 열린 창(features.ts), 대화창 진행(dialogue.ts), 음량 설정(settings.ts)
├── core/         🧱 기반: 키 입력 담당, 확성기(EventBus), 고정 랜덤, 낮/밤 스위치, 저장(SaveManager)
├── data/         🔢 숫자·설정표 (밸런스는 전부 여기)
├── i18n/         🔤 화면 글자 (ko.ts 한국어, en.ts 영어)
├── registry/     🧩 부품 상자: 강화 카드 효과(cardEffects.ts), 효과 부품(effects/ — 기술·장신구 특수·보급품이 전부 이 부품을 조합한 데이터 줄), 끼우는 타이밍 목록(hookPoints.ts)
├── systems/      🧮 계산기 (화면 코드 없음, 테스트 있음)
│   ├── rift/         한 층: 방 배치·방 역할(layout) · 괴이·계단 놓기(mapgen) · 층 목표(objectives/: 목표 하나 = 파일 하나) · 괴이 소굴(lair) · 액티브 기술(skills) · 벽 충돌 · 주인공(베기·발도·돌진) · 괴이 · 보스 · 잡몹 물결 · 예고
│   ├── run/          한 밤: 층 진행 · 강화 카드 · 능력치 계산(기본 → 트레이닝 → 기술 → 카드) · 정산
│   ├── growth/       성장: 트레이닝 값·사기, 기술 칸 열기·바꾸기, 시설 공사, 보급품, 트라우마 효과·회복
│   ├── office/       하루: 날짜 넘기기 · 월세·빚 · 의뢰 자동 생성(목표·사연·동네·길이·변형·표적) · 합동 출동 · 놓친 현상수배 · 동네 오염·확산 · 평판 등급별로 열리는 것
│   ├── reputation/   평판: 점수 → 등급, 등급별 트레이닝 한도
│   ├── gear/         장신구 초안: 뽑기·강화·다시 굴리기·녹이기 (아직 게임에 안 붙음)
│   ├── hub/          사무소: 걷기·충돌, 누구 앞에 서 있나, 무엇이 해금됐나
│   └── story/        이야기: 사무소에 들어왔을 때 다음에 볼 장면
├── store/        🗄️ 금고 (gameStore.ts)
├── scenes/       🎬 Phaser 화면
│   ├── rift/         밤 화면 (RiftScene 진행 · RiftView 그리는 순서 · RiftHud 목표·체력·층수)
│   │   └── draw/         밤에 그리는 대상별 파일: 바닥·벽, 사무소장 몸(director), 칼·휘두름 잔상·발도 효과(sword), 괴이(art/ = 귀신·구미호 도트), 소품, 바닥 예고
│   ├── hub/          낮 화면: 걸어다니는 사무소 실내 (HubScene 진행·경리 말풍선 · HubView 그리기)
│   ├── title/        타이틀: 네온 간판 + 이어하기·새로 시작·설정(음량)
│   └── shared/       공용: 카드 선택·결과 창, 타격 연출, 효과음
│       └── draw/         밤·사무소 공용 그리기: 도트 찍기(pixelSprite), 주인공 프레임 불러오기·조합(directorFrames), 도우미(common)
├── ui/           🖥️ React 창: FeatureHost(열린 창 하나 띄우기) · DialogueBox(이야기 대화창) · features/<이름>/ (board 의뢰판: 지도 OpsMap·의뢰서 OfferSheet, ledger 장부)
└── main.ts       ▶️ 시작점
tests/            ✅ 자동 테스트
tools/artlab/     🎨 그림체 견본 작업대 (게임 밖, 그림을 글자 격자로 적어서 뽑음; 구미호 생성기 gumiho_grid.py)
tools/spritekit/  🧹 AI가 만든 픽셀 시트를 진짜 픽셀로 정리하는 도구 (+ 얼굴 손보기 face_edit.py)
tools/catalog/    📒 총괄 장부: 게임의 모든 숫자·글을 코드에서 뽑아 웹 페이지 하나로 (npm run catalog). 줄마다 메모 → "장부 메모 반영해". 글 버전은 docs/catalog.md (AI가 읽는 용)
assets/source/    🗃️ 받은 그림 원본 보관 (제미나이 시트 등, 지우지 않음)
assets/sprites/   🖼️ 원본을 정리한 게임용 그림 (지금: 주인공 제미나이 1차·3차) → assets/README.md
docs/design/      📐 기획(무엇을 왜): 1-foundation 기준 · 2-night 밤 · 3-growth 성장 · 4-day 낮 · 5-business 사업·제작
docs/reference/   🔍 참고 게임 역설계
docs/rules/       🧮 규칙 장부(지금 코드가 계산하는 공식과 숫자 위치): 낮 office · 한 층 floor · 한 판 night · 허브 hub
```

---

## 🧭 "이걸 하고 싶어요" → 여기를 보세요

### "이 숫자 어떻게 계산돼요?" 👉 [`docs/rules/`](docs/rules/README.md) (숨은 규칙 장부)
- 수임료 공식, 층수, 오염이 오르고 번지는 확률, 사연 종류와 목표, 의뢰서 난이도 계산, 층 목표(섬멸·구조) 조건, 정산, 해금·이야기 장면 조건이 모듈별로 정리돼 있고, 각 숫자가 어느 파일의 어느 이름인지 적혀 있습니다. "`office.data.ts`의 `rent`를 600으로"처럼 말하면 가장 빠릅니다.

### 숫자 바꾸기 (가장 자주 쓸 것) 👉 `src/data/`
| 바꾸고 싶은 것 | 파일 |
|---------------|------|
| 사무소장 체력·이동 속도·돌진·휘두를 때 감속·벽 모서리 미끄러짐 | `protagonist.data.ts` |
| **사인검** 베기 범위·속도·피해, 3타 콤보 마무리 쉼, 발도 자세 시간·피해·**받아치기 시간**, 진심 게이지, 검신 노출 | `weapons.data.ts` |
| 강적 3종·잡몹(도깨비불)·보스 체력·피해·속도·예고 시간·패턴 주기 | `ghosts.data.ts` |
| 강화 카드 10장 (기본 덱 5 + 사인검 덱 5) | `cards.data.ts` |
| 메인 스토리 의뢰의 층 구성·수임료 | `contracts.data.ts` |
| 평판 점수·등급 문턱·트레이닝 한도, 등급 오른 날 문자 | `reputation.data.ts` (규칙 [평판](docs/rules/reputation.md)) |
| 무엇이 몇 등급에 열리나 | 각 표의 `rank`: `objectives.data.ts`, `modifiers.data.ts`, `nodes.data.ts`, `facilities.data.ts` `ranks`, `chapters.data.ts` |
| 합동 출동 최대 건수, 늘릴 수 있는 층 | `office.data.ts` `joint` |
| 오염이 오르는 이유, 넘침(긴급 의뢰 기간·보수·벌) | `office.data.ts` `contamination` (`expireRise`, `failRise`, `overflow`) |
| 메인 스토리 장이 언제 열리나, 단서 몇 개, 어느 동네 | `chapters.data.ts` (규칙 [메인 스토리 장](docs/rules/story.md)) |
| 이야기 장면 대사, 집주인 문자 | `story.data.ts` `SCENES`, `RENT_TALK` + `src/i18n/ko.ts` |
| 일반 의뢰: 월세·판 장수·마감·강적 수·물결·수임료 공식·난이도 단계 | `office.data.ts` |
| 일반 의뢰: 목표별 뽑힐 확률·길이·끝나는 층·보수 배율·심연 파편·정화량, 목표 안의 숫자(현상수배 강함, 추격 도주 기준, 결계 시간, 첫차 시간) | `objectives.data.ts` |
| 현장 변형 12종(무엇을 바꾸나, 보수 가산, 난이도 가점, 나올 확률) | `modifiers.data.ts` |
| 사연(의뢰인·본문은 글자 파일, 목표·동네·괴이는 여기) | `requests.data.ts` |
| 트레이닝 15줄(단계당 효과·최대 단계·값) | `training.data.ts` |
| 기술(패시브 18개, 칸 값, 액티브 3개) | `skills.data.ts` |
| 시설 단계 값·효과, 보급품 | `facilities.data.ts` |
| 맵 크기·방 개수·복도 폭·영력 줍기 | `dungeon.data.ts` |
| 실패 페널티, 트라우마 효과·회복 | `penalties.data.ts` |
| 타격감·화면 (멈칫 길이와 쿨다운·흔들림·확대 배율·카메라·키보드 조준·글자 선명도·색) | `feel.data.ts` |
| 효과음 | `sfx.data.ts` |
| 키·마우스 설정 | `input.data.ts` |
| 저장 위치 이름 | `save.data.ts` |
| 주인공 그림의 동작별 프레임 번호·속도·칼 잡는 손 위치, 3타 콤보 자세·잔상 방향, 위쪽 공격 뒷모습 | `sprites.data.ts` |
| 사무소 배치(크기·가구·문·경리 자리·해금 조건)·걷기 속도 | `lobby.data.ts` |
| 사무소 색 | `hubLook.data.ts` |
| 이야기 장면 대사 순서·경리 잡담 간격 | `story.data.ts` (글자는 `i18n/ko.ts`) |
| 타이틀 화면 색·배치 | `titleLook.data.ts` |
| 음량 단계 | `settings.data.ts` |
| 칸 크기·화면 배율·데미지 숫자 크기 | `feel.data.ts` (`tile`, `zoom`, `popupSize`) |

지시 예: *"ghosts.data.ts에서 달걀귀신 체력 14 → 10으로"*

### 새 강화 카드 추가 👉 `cards.data.ts` (숫자) + `src/registry/cardEffects.ts` (특수 효과)
- **부품 상자**입니다. 효과가 ID별 레고 블록으로 모여 있어서, 카드 50장을 추가해도 전투 코드는 안 건드립니다.
- 블록이 끼워지는 "타이밍"은 정해져 있습니다(`registry/hookPoints.ts`): 출발 / 방 입장 / 공격 직전 / 맞혔을 때 / 맞았을 때 / 처치 / 귀환, 그리고 기술용으로 늘린 돌진 끝·받아치기·일섬·스치기·쓰러질 때·층 끝 등. 기술·장신구 특수·보급품은 한 단계 더 쪼갠 "효과 부품"(`registry/effects/`)을 데이터 한 줄로 조합합니다: "언제 + 조건 → 부품 + 숫자". 그래서 새 기술은 보통 표에 한 줄 쓰면 끝입니다. 새 타이밍이 필요하면 **큰 공사**라서 AI가 먼저 말합니다.

### 타격감 (흔들림·데미지 글씨·소리) 👉 `src/scenes/shared/vfx.ts` + `feel.data.ts`
- 계산기는 데미지만 깎고 **확성기**(EventBus)로 "45 맞았다!"라고 외치기만 합니다. 연출 담당이 그걸 듣고 흔들림·글씨·소리를 냅니다.
- 그래서 연출을 아무리 고쳐도 **데미지 계산이 꼬이지 않습니다.**

### 그림 바꾸기 👉 `assets/` + `src/scenes/rift/draw/` (+ 공용 `src/scenes/shared/draw/`)
- 순서: 제미나이 원본을 `assets/source/`에 → `tools/spritekit/clean_sheet.py`로 정리해 `assets/sprites/`에 → 주인공은 `src/data/sprites.data.ts`에서 동작별 프레임 번호만 바꾸면 됨. 귀신·소품은 `draw/` 안 해당 파일에 연결.
- 그리는 대상마다 파일이 하나라서, 예컨대 처녀귀신 그림을 바꿔도 다른 화면 코드와 게임 규칙은 안 건드립니다.
- 그림체 규칙·지금 상태·남은 그림: [아트](docs/design/5-business/art.md). 제미나이 프롬프트: [그림 프롬프트 모음](docs/design/5-business/art-prompts.md).

### 저장 👉 `src/core/SaveManager.ts`
- 사무소 상태(잔고·빚·날짜·의뢰판·동네 오염·트라우마 등)를 바뀔 때마다 자동 저장. 밤 중간 상태는 저장 안 함. 저장 모양을 바꾸면 버전을 올리고 옛 저장을 옮기는 코드를 같이 넣습니다 → [저장 모듈](docs/design/1-foundation/save.md).

### 게임 규칙 (데미지 공식, 괴이 행동, 잡몹 물결) 👉 `src/systems/`
- 한 층 규칙(베기·발도·돌진은 `player.ts`, 괴이는 `enemies.ts`, 보스는 `boss.ts`)은 `rift/`, 한 밤 진행(층, 카드, 정산)은 `run/`. 여기를 바꾸면 `tests/` 테스트도 같이 바뀌어야 합니다 (규칙상 AI가 알아서 같이 함).

### 화면 글자·번역 👉 `src/i18n/ko.ts` (+ `en.ts`)
- 한쪽에만 글자를 추가하면 빨간 줄이 떠서 번역 누락이 불가능합니다.

### 낮↔밤 데이터 공유 👉 `src/store/gameStore.ts` (금고)
- 낮 화면도 밤 화면도 금고를 **읽기만** 하고, 바꿀 땐 정해진 창구(store 함수)로만 바꿉니다.

### "창 닫았더니 키가 안 먹어요" 👉 `src/core/InputManager.ts`
- 키 입력은 이 파일 하나만 받습니다. 창이 열리면 "창 모드", 닫히면 원래 모드로 돌아가는 **입력 계단** 구조라 이런 버그를 막습니다.

### 기획 바꾸기 👉 `docs/design/<묶음>/<모듈>.md`
- 지시 예: *"실패 페널티에 경험치 손실 추가하자"* → AI가 `2-night/objectives.md`(끝나는 길과 벌칙), `docs/rules/night.md`, `systems/run/`을 같이 고칩니다.

---
## 📚 문서 안내

| 파일 | 누가 읽나 | 내용 |
|------|----------|------|
| **`GUIDE.md` (이 파일)** | 사람 | 쉬운 지도 · 현재 상태 · 실행법 |
| [`docs/design/1-foundation/direction.md`](docs/design/1-foundation/direction.md) | 사람 + AI | **기획 방향** — 무엇이 확정이고 무엇이 열려 있나 (먼저 읽기) |
| [`docs/design/roadmap.md`](docs/design/roadmap.md) | 사람 + AI | 게이트별 할 일 순서·통과 기준·빠진 것 |
| [`docs/design/README.md`](docs/design/README.md) | 사람 + AI | **기획 모듈 지도** — 묶음별 문서·담당 코드·진행 상태 |
| `docs/design/<묶음>/` | 사람 + AI | 1 기준(방향·세계관·이야기·화면·플랫폼·저장) · 2 밤(전투·주인공·괴이·이야기 의뢰·의뢰 목표·정산) · 3 성장(카드·편성·영입·돈 쓸 곳) · 4 낮(허브·의뢰판·경제) · 5 사업·제작(과금·아트·그림 절차·프롬프트). 묶음마다 README 한 장 |
| [`docs/rules/`](docs/rules/README.md) | 사람 + AI | 🧮 규칙 장부 — 지금 코드가 계산하는 공식과 숫자 위치 |
| [`docs/reference/`](docs/reference/README.md) | 사람 + AI | 🔍 참고 게임 역설계 (목록은 README) |
| `ARCHITECTURE.md` | AI | 정식 코드 규칙 (영어) |
| `HANDOFF.md` | AI + 사람 | 지금 상태와 다음 할 일만 짧게 (지난 기록은 `docs/history.md`) |
| `AGENTS.md` (+ `CLAUDE.md`) | AI | 세션 시작 안내문. 내용은 AGENTS.md 한 곳에만 쓰고, CLAUDE.md는 그걸 불러오기만 함 (코덱스·Claude 공용) |
| `docs/catalog.md` | AI | 게임 숫자·글 전부를 글로 뽑은 것. 데이터 파일 여러 개 대신 이것 하나만 읽게 |
| `assets/README.md`, `tools/*/README.md` | AI + 사람 | 그림 파일 폴더와 그림 도구 쓰는 법 |

---

## 🛑 AI가 꼭 지키는 규칙 (쉬운 버전)

| # | 규칙 | 왜? |
|---|------|-----|
| 1 | 숫자·글자는 `data`/`i18n`에만 | 밸런스 조정할 때 코드 뒤질 필요 없게 |
| 2 | 카드·스킬 효과는 `registry` 블록으로 | 카드 수십 장 늘어나도 전투 코드가 안 꼬이게 |
| 3 | 값 변경은 계산기·금고에서만, 연출은 확성기로 | 연출 고치다 게임 로직 망가지는 일 방지 |
| 4 | 입력은 InputManager 한 곳에서만 | "창 닫으면 키 안 먹힘" 버그 방지 |
| 5 | 파일 하나 400줄 이하, 모듈끼리는 입구(index.ts)로만 | AI가 파일 통째로 날리거나 모듈이 엉키는 일 방지 |
| 6 | 랜덤은 시드 고정 랜덤만 | 버그 재현 가능 + 세이브 안전 |
| 7 | 최종 능력치는 저장 안 하고 매번 계산 | 나중에 대여 시장(온라인)에서 조작 방지 |
| 8 | 커밋 전 `npm run check` 통과 + `HANDOFF.md` 갱신 | 다음 세션 AI가 상황을 정확히 알게 |

---
## 💬 AI에게 지시할 때 팁

- **위치를 같이 말하기:** *"ghosts.data.ts에서 지하철 망령 돌진 거리 6 → 4로"* ← 엉뚱한 곳을 안 건드립니다.
- **기획은 모듈 이름으로:** *"hub.md에 집주인 할머니 넣자"*
- **용어:** 층마다 고르는 강화 = **강화 카드** (코드에서도 `card`). "기질"은 나중에 동료의 영구 성격·트라우마에만 씁니다.
- **현재 단계 확인:** 지금은 Gate 2이고 Gate 1 그림·손맛 마무리를 같이 합니다. Seoul 지도·파견(Gate 3)이나 대여(Gate 4)를 만들자고 하면 AI가 "범위 밖인데 진행할까요?" 하고 묻는 게 정상입니다.
- **그림 파일은 첨부로:** 대화창에 붙인 이미지는 AI가 볼 수만 있고 파일로 쓸 수 없습니다. 정리·게임 연결이 필요한 그림은 파일로 첨부하세요.
- **새 세션 시작할 때 (Claude든 코덱스든):** *"HANDOFF.md 읽고 다음 할 일 이어서 하자"* 한 마디면 됩니다. 처음 읽는 양이 HANDOFF + ARCHITECTURE(구조만, 짧게) 정도라 가볍습니다. 이야기 작업이면 이야기 바이블(docs/design/1-foundation/bible.md)부터.
- **세션 끝낼 때:** *"HANDOFF 업데이트하고 커밋해 줘"*
