// npm run feel → docs/feel-coverage.md: every game event (src/types/events.ts) against the feedback it
// gets in src/scenes/shared/vfx.ts — hit-stop, shake, flash, ring, text, sound. Read straight from the
// code, so the table cannot drift. Judgement (gaps, excess) is written by hand in docs/design/2-night/combat.md.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const events = readFileSync(resolve(root, 'src/types/events.ts'), 'utf8');
const vfx = readFileSync(resolve(root, 'src/scenes/shared/vfx.ts'), 'utf8');

// Event names and their one-line comments, in file order.
const names: { name: string; note: string }[] = [];
for (const m of events.matchAll(/^\s{2}(\w+): \{[^}]*\};?\s*(?:\/\/\s*(.*))?$/gm)) names.push({ name: m[1]!, note: (m[2] ?? '').trim() });

// Each listener's body: from its bus.on('x' to the next bus.on( or the end of the list.
const blocks = new Map<string, string>();
const starts = [...vfx.matchAll(/bus\.on\('(\w+)'/g)];
starts.forEach((m, i) => blocks.set(m[1]!, vfx.slice(m.index!, starts[i + 1]?.index ?? vfx.indexOf('];', m.index!))));

const CHANNELS: [string, RegExp][] = [
  ['멈칫', /hooks\.freeze\(/],
  ['흔들림', /cam\.shake\(/],
  ['번쩍', /view\.flash\(|hurtTint/],
  ['고리', /ring\(/],
  ['글자', /popup\(/],
  ['소리', /playSfx\(/],
];
const sounds = (b: string) => [...b.matchAll(/playSfx\('(\w+)'\)/g)].map((m) => m[1]).join(', ');

const rows = names.map(({ name, note }) => {
  const b = blocks.get(name);
  const cells = CHANNELS.map(([, re]) => (b && re.test(b) ? '●' : ''));
  const count = cells.filter(Boolean).length;
  return `| \`${name}\` | ${cells.join(' | ')} | ${b ? sounds(b) : ''} | ${count === 0 ? '**없음**' : count} | ${note.replace(/\|/g, '/')} |`;
});
const used = new Map<string, number>();
for (const b of blocks.values()) for (const m of b.matchAll(/playSfx\('(\w+)'\)/g)) used.set(m[1]!, (used.get(m[1]!) ?? 0) + 1);

const md = `# 연출 표 (자동 생성 — 손으로 고치지 말 것)

\`npm run feel\`이 \`src/types/events.ts\`의 사건마다 \`src/scenes/shared/vfx.ts\`가 붙인 연출을 센다. 판단(빈칸·과한 곳)은 [전투 문서](design/2-night/combat.md) "연출 점검".

| 사건 | ${CHANNELS.map(([n]) => n).join(' | ')} | 소리 이름 | 채널 수 | 설명 |
|------|${CHANNELS.map(() => '---').join('|')}|------|------|------|
${rows.join('\n')}

소리 재사용: ${[...used.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ×${n}`).join(' · ')}
`;
writeFileSync(resolve(root, 'docs/feel-coverage.md'), md);
console.log(`docs/feel-coverage.md: ${names.length} events, ${names.filter((n) => !blocks.has(n.name)).length} without feedback`);
