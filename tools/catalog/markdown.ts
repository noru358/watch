// The same catalog as plain Markdown (docs/catalog.md) for agents and text readers: every table in
// one file, names resolved to Korean, numbers as they are in code. Generated — never edit by hand.
import type { exportCatalog } from './export';

type Catalog = ReturnType<typeof exportCatalog>;

const pct = (v: number) => `${Math.round(v * 1000) / 10}%`;
const row = (cells: unknown[]) => `| ${cells.map((c) => String(c ?? '').replace(/\|/g, '/').replace(/\n/g, ' ')).join(' | ')} |`;
function table(head: string[], rows: unknown[][]): string {
  return [row(head), row(head.map(() => '---')), ...rows.map(row)].join('\n');
}
const kv = (o: object) => Object.entries(o).filter(([, v]) => typeof v !== 'object').map(([k, v]) => `${k} ${v}`).join(' · ');

export function catalogMarkdown(c: Catalog): string {
  const T = (k?: string | null) => (k && (c.t as Record<string, string>)[k]) || k || '';
  const ghost = (g: string) => T(`enemy.${g}`);
  const node = (n: string) => T((c.nodes as Record<string, { nameKey: string }>)[n]?.nameKey);
  const obj = (o: string) => T(`board.goal.${o}`);
  const out: string[] = [];
  const h = (s: string, where: string) => out.push('', `## ${s}`, `고치는 곳: \`${where}\``, '');

  out.push('# 나이트워치 총괄 장부 (자동 생성)', '', `\`npm run catalog\`가 코드에서 뽑은 것 (${c.at.slice(0, 10)}). 손으로 고치지 말 것 — 표의 원본을 고치고 다시 뽑는다. 글자는 전부 \`src/i18n/ko.ts\`.`);

  h('의뢰 목표', 'src/data/objectives.data.ts');
  const fee = Object.fromEntries(c.objectives.fees.map((f) => [f.objective, f]));
  out.push(table(['목표', 'id', '등급', '가중치', '길이', '끝나는 층', '보수×', '파편', '오염−', '난이도+', '보수 예(3층, 오염0→3)'],
    Object.entries(c.objectives.general).map(([id, r]) => [obj(id), id, r.rank, r.weight, `${r.floors[0]}~${r.floors[1]}`, r.goal, r.feeMult, r.shards, r.cleanse, r.difficulty, `${fee[id]?.calm}→${fee[id]?.hot}`])));
  out.push('', ...Object.entries(c.objectives.rules).map(([id, v]) => `- ${obj(id)}: ${kv(v)}`));

  h('현장 변형', 'src/data/modifiers.data.ts');
  out.push(table(['변형', 'id', '종류', '등급', '가중치', '보수+', '난이도+', '하는 일'],
    Object.entries(c.modifiers.rows).map(([id, m]) => [T(m.nameKey), id, m.kind, m.rank, m.weight, m.feeBonus ? pct(m.feeBonus) : '', m.difficulty, T(m.descKey)])));

  h('의뢰 사연 (의뢰인)', 'src/data/requests.data.ts + ko.ts request.<id>.client/.text');
  out.push(table(['id', '의뢰인', '목표', '동네', '괴이', '사연'],
    Object.entries(c.requests).map(([id, r]) => [id, T(r.clientKey), obj(r.objective), r.nodes ? r.nodes.map(node).join(', ') : '어디든', r.pool ? r.pool.map(ghost).join(', ') : '동네 따라', T(r.textKey)])));

  h('현상수배 · 추격 표적 이름', 'ko.ts wanted.pre.N (앞말) · wanted.suf.N (뒷말) — 줄만 더하면 됨');
  const keys = Object.keys(c.t);
  out.push(`앞말: ${keys.filter((k) => k.startsWith('wanted.pre.')).map(T).join(', ')}`, '', `뒷말: ${keys.filter((k) => k.startsWith('wanted.suf.')).map(T).join(', ')}`);

  h('판 · 보수 · 오염', 'src/data/office.data.ts');
  out.push(`- ${kv(c.office)}`, `- general: ${kv(c.office.general)}`, `- difficulty steps ${c.office.difficulty.steps.join('/')} · boss ${c.office.difficulty.bossWeight} · per level ${c.office.difficulty.bountyPerLevel}`,
    `- contamination: ${kv(c.office.contamination)} · overflow: ${kv(c.office.contamination.overflow)}`, `- swarm: ${kv(c.office.swarm)} · joint: ${kv(c.office.joint)}`);

  h('동네', 'src/data/nodes.data.ts');
  out.push(table(['동네', 'id', '등급', '시작 오염', '괴이', '층 모습', '이웃'],
    Object.entries(c.nodes).map(([id, n]) => [T(n.nameKey), id, n.rank, n.startContamination, n.pool.map(ghost).join(', '), n.themes.join(', '), n.links.map(node).join(', ')])));

  h('괴이', 'src/data/ghosts.data.ts');
  out.push(table(['괴이', 'id', '체력', '피해', '속도', '공격', '예고', '영력', '그 밖'],
    Object.entries(c.ghosts).map(([id, g]) => [ghost(id), id, g.hp, g.fodder ? `닿으면 ${g.contactDamage}` : g.damage, g.speed, g.attack, g.windup, g.drop, [g.teleportEvery ? `순간이동 ${g.teleportEvery}초` : '', g.darkness ? `어둠 ${g.darkness}초` : '', g.fodder ? '무리' : ''].filter(Boolean).join(' · ')])));
  out.push('', ...Object.entries(c.bosses).map(([id, b]) => `- 보스 ${ghost(id)}: ${kv(b)}`));

  h('메인 스토리 장', 'src/data/chapters.data.ts · contracts.data.ts');
  out.push(table(['장', 'id', '앞 장', '열림(일 / 오염)', '단서', '단서 동네', '본 의뢰', '보수'],
    Object.entries(c.chapters).map(([id, ch]) => { const k = c.contracts[ch.contract as keyof typeof c.contracts]; return [T(ch.nameKey), id, ch.after ?? '', `${ch.startAfterDays} / ${ch.startHeat}`, ch.clues, ch.clueNodes.map(node).join(', '), `${T(k.nameKey)} ${k.floors.length}층`, k.fee]; })));

  h('장면 대사', 'src/data/story.data.ts (순서) · ko.ts scene.*');
  for (const [id, lines] of Object.entries(c.story.scenes)) out.push(`- **${id}**: ${lines.map((l) => `${T(c.story.speakers[l.speaker].nameKey)} "${T(l.key)}"`).join(' / ')}`);

  h('트레이닝 (돈)', 'src/data/training.data.ts');
  out.push(`전부 사면 ₩${c.training.tree.total} · ${c.training.tree.ranks}단계 · 값 = 첫 값 × (그 줄 단계+1) × (1 + ${c.training.price.inflation} × 산 횟수)`, '');
  out.push(table(['갈래', '줄', 'id', '능력치', '방식', '단계당', '최대', '첫 값'],
    Object.entries(c.training.lines).map(([id, l]) => [T(`training.group.${l.group}`), T(l.nameKey), id, l.stats.join('+'), l.op, l.per, l.max, l.cost])));

  h('기술 (심연 파편)', 'src/data/skills.data.ts');
  out.push(table(['칸', '파편', '고르는 것'], Object.entries(c.skills.slots).map(([id, s]) => [id, s.cost, s.sides.map((p) => `${T(c.skills.passives[p].nameKey)}: ${T(c.skills.passives[p].descKey)}`).join(' / ')])));
  out.push('', table(['듀오', '조건', '효과'], Object.values(c.skills.duos).map((d) => [T(d.nameKey), d.requires.map((p) => T(c.skills.passives[p].nameKey)).join(' + '), T(d.descKey)])));
  out.push('', table(['액티브', 'id', '파편', '재사용', '효과', '개조'], Object.entries(c.skills.actives).map(([id, a]) => [T(a.nameKey), id, a.cost, a.cooldown, T(a.descKey), Object.values(c.skills.upgrades).filter((u) => u.of === id).map((u) => T(u.nameKey)).join(', ')])));

  h('장신구', 'src/data/gear.data.ts');
  out.push(`- 경제: ${kv(c.gear.economy)}`, ...Object.entries(c.gear.grades).map(([g, d]) => `- ${T(d.nameKey)}: 부옵션 ${d.subs}, 특수 ${d.special ? '있음' : '없음'}, 끝까지 강화 ₩${c.gear.full[g]}`));
  out.push(...Object.values(c.gear.slots).map((s) => `- ${T(s.nameKey)} (${T(s.roleKey)}): ${s.mains.map((m) => `${T(`stat.${m.stat}`)} ${m.base}+${m.perLevel}/단계`).join(', ')}`));
  out.push(`- 부옵션: ${c.gear.subs.map((s) => `${T(`stat.${s.stat}`)} ${s.min}~${s.max}`).join(', ')}`);
  out.push(`- 전설 특수: ${Object.values(c.gear.specials).map((s) => `${T(s.nameKey)}(${T(s.descKey)})`).join(' / ')}`);
  out.push(`- 떨어지는 곳: ${Object.values(c.gear.drops).map((d) => `${T(d.nameKey)} ${pct(d.chance)}${d.minGrade ? ` ${d.minGrade}+` : ''}`).join(', ')}`);

  h('시설 · 보급품 · 트라우마', 'src/data/facilities.data.ts · penalties.data.ts');
  out.push(...Object.values(c.facilities.rows).map((f) => `- ${T(f.nameKey)}: ${f.costs.join('/')} (등급 ${f.ranks.join('/')}) — ${f.levelKeys.map(T).join(' / ')}`));
  out.push(...Object.values(c.facilities.supplies).map((s) => `- 보급품 ${T(s.nameKey)} ₩${s.cost} (작업대 ${s.benchLevel}): ${T(s.descKey)}`));
  out.push(`- 트라우마: ${kv(c.trauma)}`);

  h('평판', 'src/data/reputation.data.ts (+ 각 줄의 rank)');
  out.push(...c.reputation.ranks.map((r, i) => `- ${i} ${T(r.nameKey)}: ${r.at}점, 트레이닝 한도 ${pct(c.reputation.rules.trainingCap[i] ?? 1)}`), `- ${kv(c.reputation.rules)}`);

  h('강화 카드 · 무기 · 주인공', 'src/data/cards.data.ts · weapons.data.ts · protagonist.data.ts');
  out.push(...Object.entries(c.cards.rows).map(([id, k]) => `- ${T(`card.${id}.name`)} (${k.source}): ${T(`card.${id}.desc`)} — ${Object.entries(k).filter(([, v]) => typeof v === 'number' && v !== 0).map(([a, v]) => `${a} ${v}`).join(' · ')}`));
  out.push(...Object.entries(c.weapons).map(([id, w]) => `- 무기 ${T(`weapon.${id}`)}: ${kv(w)}`));
  out.push(...Object.entries(c.exorcists).map(([id, e]) => `- 주인공 ${id}: ${kv(e)}`));

  h('효과 부품 · 훅', 'src/registry/effects/parts/ · src/registry/hookPoints.ts');
  out.push(...c.effects.parts.map((p) => `- ${p.id}: ${p.what}`), '', ...c.effects.hooks.map((k) => `- ${k.id}${k.what ? `: ${k.what}` : ''}`));
  return out.join('\n') + '\n';
}
