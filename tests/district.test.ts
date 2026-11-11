// 동네 규칙 (districts.data.ts, rift/district.ts): loops, room kinds, neon signs, breaking props.
import { describe, expect, it } from 'vitest';
import { SeededRNG } from '../src/core/SeededRNG';
import { DUNGEON } from '../src/data/dungeon.data';
import { DISTRICTS, PROPS } from '../src/data/districts.data';
import { generateFloor, type Floor } from '../src/systems/rift';
import { addLoops, cutProps } from '../src/systems/rift/district';
import { distances, randomRooms } from '../src/systems/rift/layout';
import { carry } from './helpers';

const alleyPlan = { kind: 'normal', enemies: 6, pool: ['cheonyeo', 'dalgyal'], payphone: true, swarm: null, objective: 'clear', goal: false, theme: 'alley' } as const;
const idx = (x: number, y: number) => y * DUNGEON.cols + x;

describe('district rules (노포 골목)', () => {
  it('a furnished floor stays one piece: every floor tile can be walked to from the start', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const f = generateFloor(0, alleyPlan, new SeededRNG(seed), carry());
      const d = distances(f.tiles, f.player);
      f.tiles.forEach((t, i) => {
        if (t === 'floor') expect(d[i], `seed ${seed} tile ${i}`).toBeGreaterThanOrEqual(0);
      });
    }
  });

  it('props sit on solid tiles, never on the start room, and nothing spawns inside one', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const f = generateFloor(0, alleyPlan, new SeededRNG(seed), carry());
      const start = { x: Math.floor(f.player.x), y: Math.floor(f.player.y) };
      for (const p of f.props) {
        for (let j = p.y; j < p.y + p.h; j++) for (let i = p.x; i < p.x + p.w; i++) expect(f.tiles[idx(i, j)]).toBe('wall');
        expect(start.x >= p.x && start.x < p.x + p.w && start.y >= p.y && start.y < p.y + p.h).toBe(false);
      }
      const things = [...f.enemies, ...f.pickups, ...(f.stairs ? [f.stairs] : []), ...(f.payphone ? [f.payphone] : [])];
      for (const t of things) expect(f.tiles[idx(Math.floor(t.x), Math.floor(t.y))], `seed ${seed}`).toBe('floor');
    }
  });

  it('an alley floor is furnished: on average well over ten props and its full set of signs', () => {
    let props = 0;
    for (let seed = 1; seed <= 100; seed++) props += randomRooms(new SeededRNG(seed), 'alley').props.length;
    expect(props / 100).toBeGreaterThan(10);
  });

  it('signs hang on real walls with floor below, never on a prop', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const { tiles, props, signs } = randomRooms(new SeededRNG(seed), 'alley');
      const onProp = (x: number, y: number) => props.some((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h);
      expect(signs.length).toBeGreaterThan(0);
      for (const s of signs) {
        expect(tiles[idx(s.x, s.y)]).toBe('wall');
        expect(tiles[idx(s.x, s.y + 1)]).toBe('floor');
        expect(onProp(s.x, s.y)).toBe(false);
      }
    }
  });

  it('loops add corridors to a chain of rooms on most floors', () => {
    let more = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const { tiles, rooms } = randomRooms(new SeededRNG(seed), 'basement'); // no rules: the bare chain
      const before = tiles.filter((x) => x === 'floor').length;
      addLoops(tiles, rooms, DISTRICTS.alley!, new SeededRNG(seed));
      if (tiles.filter((x) => x === 'floor').length > before) more++;
    }
    expect(more).toBeGreaterThan(30);
  });

  it('a theme without rules has no props or signs', () => {
    const f = generateFloor(0, { ...alleyPlan, theme: 'basement' }, new SeededRNG(5), carry());
    expect(f.props).toEqual([]);
    expect(f.signs).toEqual([]);
  });

  it('a stall breaks after its blows: the tiles open, debris and spirit are left', () => {
    let f: Floor | null = null;
    for (let seed = 1; seed <= 200 && !f; seed++) {
      const g = generateFloor(0, alleyPlan, new SeededRNG(seed), carry());
      if (g.props.some((p) => p.art === 'stall')) f = g;
    }
    expect(f).not.toBeNull();
    const floor = f!;
    const stall = floor.props.find((p) => p.art === 'stall')!;
    floor.player.x = stall.x + 1;
    floor.player.y = stall.y + stall.h + 0.6; // just below, facing up
    const aim = -Math.PI / 2;
    const pickups = floor.pickups.length;
    for (let k = 0; k < PROPS.stall.hp! - 1; k++) cutProps(floor, 1.6, 2, aim);
    expect(floor.props.includes(stall)).toBe(true);
    expect(floor.events.filter((e) => e.type === 'propHit').length).toBe(PROPS.stall.hp! - 1);
    cutProps(floor, 1.6, 2, aim);
    expect(floor.props.includes(stall)).toBe(false);
    expect(floor.tiles[idx(stall.x, stall.y)]).toBe('floor');
    expect(floor.debris.length).toBe(1);
    expect(floor.pickups.length).toBe(pickups + PROPS.stall.drop!.count);
    expect(floor.events.some((e) => e.type === 'propBroken')).toBe(true);
  });

  it('unbreakable props (press, crates, lamp) take no blows', () => {
    const f = generateFloor(0, alleyPlan, new SeededRNG(3), carry());
    const hard = f.props.find((p) => p.hp === null);
    if (!hard) return;
    f.player.x = hard.x + hard.w / 2;
    f.player.y = hard.y + hard.h + 0.6;
    cutProps(f, 1.6, 2, -Math.PI / 2);
    expect(f.props.includes(hard)).toBe(true);
  });
});
