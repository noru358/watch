// Scripted players for balance checks. Not part of the game.
import { SeededRNG } from '../src/core/SeededRNG';
import { WEAPONS } from '../src/data/weapons.data';
import { answerPayphone, dist, inTelegraph, isFloor, NO_INPUT, stepFloor, type Enemy, type Floor, type Pos, type RiftInput } from '../src/systems/rift';
import { enterFloor, leaveFloor, offerCards, pickCard, startRun, type RunOutcome } from '../src/systems/run';

const W = WEAPONS.newspaper_sword;
const DT = 1 / 60;

function nearest(f: Floor): Enemy | null {
  let best: Enemy | null = null;
  for (const e of f.enemies) if (e.hp > 0 && e.state !== 'idle' && (!best || dist(e, f.player) < dist(best, f.player))) best = e;
  return best;
}

// Direction to the next tile on a shortest path to `to`.
function pathDir(f: Floor, to: Pos): Pos {
  const p = f.player;
  const start = Math.floor(p.y) * f.cols + Math.floor(p.x);
  const goal = Math.floor(to.y) * f.cols + Math.floor(to.x);
  const prev = new Map<number, number>([[start, -1]]);
  const q = [start];
  for (let h = 0; h < q.length && !prev.has(goal); h++) {
    const i = q[h]!;
    const x = i % f.cols;
    const y = (i - x) / f.cols;
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]] as const) {
      const j = ny * f.cols + nx;
      if (!prev.has(j) && isFloor(f, nx, ny)) {
        prev.set(j, i);
        q.push(j);
      }
    }
  }
  let c = goal;
  if (!prev.has(c)) return { x: 0, y: 0 };
  while (prev.get(c) !== start && prev.get(c) !== -1) c = prev.get(c)!;
  const tx = c === start ? to.x : (c % f.cols) + 0.5;
  const ty = c === start ? to.y : Math.floor(c / f.cols) + 0.5;
  const len = Math.hypot(tx - p.x, ty - p.y) || 1;
  return { x: (tx - p.x) / len, y: (ty - p.y) / len };
}

// Stands its ground and swings at whatever is closest; walks to the exit when nothing is near.
export function naive(f: Floor): RiftInput {
  const p = f.player;
  const e = nearest(f);
  if (e && dist(e, p) < 7) {
    const aim = Math.atan2(e.y - p.y, e.x - p.x);
    const close = dist(e, p) - e.r <= W.reach * 0.8;
    return { ...NO_INPUT, aim, attack: true, moveX: close ? 0 : Math.cos(aim), moveY: close ? 0 : Math.sin(aim) };
  }
  const goal = f.stairs ?? f.enemies[0] ?? p;
  const d = pathDir(f, goal);
  return { ...NO_INPUT, aim: Math.atan2(d.y, d.x), attack: true, moveX: d.x, moveY: d.y };
}

// Reads telegraphs: counters melee in the parry window, steps or dashes out of everything else.
export function skilled(f: Floor): RiftInput {
  const p = f.player;
  const base = naive(f);
  for (const e of f.enemies) {
    for (const t of e.teles) {
      if (!inTelegraph(t, p, p.r + 0.25)) continue;
      const canCounter = t.parriable && dist(e, p) - e.r <= W.drawReach;
      if (canCounter && t.t <= W.parryWindow * 0.7) return { ...base, attack: false, draw: true, aim: Math.atan2(e.y - p.y, e.x - p.x) };
      if (canCounter) return { ...base, attack: false, moveX: 0, moveY: 0 };
      let ax: number;
      let ay: number;
      if (t.shape === 'band') {
        ax = t.axis === 'col' ? Math.sign(p.x - t.x) || 1 : 0;
        ay = t.axis === 'row' ? Math.sign(p.y - t.y) || 1 : 0;
      } else if (t.shape === 'line') {
        ax = -Math.sin(t.angle);
        ay = Math.cos(t.angle);
      } else {
        ax = p.x - t.x;
        ay = p.y - t.y;
      }
      return { ...base, attack: false, moveX: ax, moveY: ay, dash: t.t < 0.3 };
    }
  }
  const e = nearest(f);
  if (e && p.focus >= f.stats.focusMax && dist(e, p) - e.r <= W.burstReach) return { ...base, draw: true };
  return base;
}

export function playNight(seed: number, bot: (f: Floor) => RiftInput): { outcome: RunOutcome; floor: number; seconds: number } {
  const rng = new SeededRNG(seed);
  const run = startRun({ contractId: 'euljiro_printer', level: 1, weapon: 'newspaper_sword' });
  let seconds = 0;
  for (;;) {
    const f = enterFloor(run, rng);
    let t = 0;
    while (f.status === 'playing' || f.status === 'payphone') {
      if (f.status === 'payphone') answerPayphone(f, false);
      stepFloor(f, bot(f), DT, rng);
      f.events = [];
      t += DT;
      if (t > 240) f.status = 'dead'; // stuck counts as a loss
    }
    seconds += t;
    const out = leaveFloor(run, f);
    if (out) return { outcome: out, floor: run.floorIndex, seconds: Math.round(seconds) };
    pickCard(run, offerCards(run, rng)[0]!);
  }
}
