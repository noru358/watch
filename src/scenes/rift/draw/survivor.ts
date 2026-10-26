import { PALETTE } from '../../../data/feel.data';
import type { Survivor } from '../../../systems/rift';
import { lerp, shadow, T, type G } from '../../shared/draw/common';

// The missing person (rescue objective). Shapes until the art lands: a small 2-head figure,
// crouched and shaking while hidden, walking with a little bob once they follow the director.
export function drawSurvivor(g: G, s: Survivor, alpha: number, clock: number): void {
  const x = lerp(s.prevX, s.x, alpha) * T;
  const y = lerp(s.prevY, s.y, alpha) * T;
  const hidden = s.state === 'hidden';
  const shake = hidden ? Math.sin(clock * 40) * 0.6 : 0;
  const bob = hidden ? 0 : Math.abs(Math.sin(clock * 9)) * 1.5;
  const crouch = hidden ? 5 : 0;
  const hurt = s.iframes > 0 && Math.floor(clock * 20) % 2 === 0;
  shadow(g, x, y, 6);
  const top = y - 22 + crouch - bob;
  g.fillStyle(hurt ? 0xffffff : PALETTE.survivorCoat, 1).fillRoundedRect(x - 5 + shake, top + 10, 10, 12 - crouch, 3);
  g.fillStyle(hurt ? 0xffffff : PALETTE.skin, 1).fillCircle(x + shake, top + 6, 6);
  g.fillStyle(PALETTE.hair, 1).fillRect(x - 6 + shake, top, 12, 4);
  // The phone screen they hold (the warm light the director follows).
  g.fillStyle(PALETTE.survivor, 0.9).fillRect(x + 3 + shake, top + 12, 3, 4);
  if (s.hp < s.maxHp) {
    g.fillStyle(PALETTE.hpBarBack).fillRect(x - 6, y + 3, 12, 2);
    g.fillStyle(PALETTE.survivor).fillRect(x - 6, y + 3, (12 * Math.max(0, s.hp)) / s.maxHp, 2);
  }
}
