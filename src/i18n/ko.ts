// Source of all i18n keys. en.ts must have the exact same key set.
export const ko = {
  'game.title': '서울 나이트워치',
  'game.subtitle': '을지로 퇴마 사무소',

  'day.office': '을지로 퇴마 사무소',
  'day.money': '잔고',
  'day.trauma': '트라우마',
  'day.runs': '해결한 의뢰',
  'day.contractTitle': '오늘 밤 의뢰',
  'day.contractName': '을지로3가 인쇄소 지하, 밤마다 윤전기가 혼자 돈다',
  'day.contractFee': '수임료',
  'day.sortie': '출동',
  'day.sortieHint': 'Enter 또는 클릭',
  'day.lastResult': '지난 밤 결과',
  'day.controls': '조작',
  'day.controlsBody': '이동 WASD · 공격 J · 구르기 K/Space · 부적 결계 L · 대원 호출 ;',
  'day.placeholder': 'Gate 1 임시 사무소 화면입니다. 걸어다니는 사무소는 Gate 2에서.',

  'result.success': '의뢰 해결',
  'result.extracted': '공중전화로 귀환',
  'result.died': '쓰러짐',
  'result.loot': '전리품',
  'result.fee': '수임료',
  'result.trauma': '트라우마',
  'result.total': '획득',

  'hud.room': '방 {current}/{total}',
  'hud.loot': '영력 {value}',
  'hud.tool': '결계',
  'hud.ready': '준비',
  'hud.boss': '윤전기 귀신',
  'hud.shield': '소금 {value}',

  'room.cleared': '정화 완료 — 위쪽 문으로',
  'room.payphone': '공중전화: J 로 귀환 (전리품 유지, 수임료 없음) · 문으로 계속',
  'room.bossIntro': '원인 귀신 출현',

  'trait.pick': '강화 카드 선택 — 1 / 2 / 3',

  'end.success': '의뢰 해결!',
  'end.extracted': '귀환했다. 오늘은 여기까지.',
  'end.died': '쓰러졌다…',
  'end.continue': 'J / Enter: 사무소로',

  'companion.grandma_shaman': '무당 할머니',
  'companion.ex_detective': '전직 형사',
  'companion.streamer': '유튜버 대학생',

  'enemy.cheonyeo': '처녀귀신',
  'enemy.dalgyal': '달걀귀신',
  'enemy.subway': '지하철 망령',
  'enemy.printer': '윤전기 귀신',

  'trait.ricochet.name': '튕기는 부적',
  'trait.ricochet.desc': '부적이 맞으면 {chance}% 확률로 다른 귀신에게 튕긴다',
  'trait.roll_empower.name': '구르고 한 방',
  'trait.roll_empower.desc': '구른 뒤 다음 부적 피해 {amount}배',
  'trait.vampiric.name': '원한 흡수',
  'trait.vampiric.desc': '귀신 처치 시 {chance}% 확률로 체력 {amount} 회복',
  'trait.thick_skin.name': '을지로 맷집',
  'trait.thick_skin.desc': '최대 체력 +{hp}',
  'trait.swift.name': '막차 달리기',
  'trait.swift.desc': '이동 속도 +{speed}%',
  'trait.sharp_talisman.name': '날 선 부적',
  'trait.sharp_talisman.desc': '부적 피해 +{damage}%',
  'trait.salt_ward.name': '소금 한 줌',
  'trait.salt_ward.desc': '방에 들어갈 때마다 피해 {amount}회 막는 보호막',
} as const;

export type TKey = keyof typeof ko;
