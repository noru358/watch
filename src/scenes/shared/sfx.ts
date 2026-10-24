import { SFX, type SfxId } from '../../data/sfx.data';

let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

function audio(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function noise(ac: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  noiseBuffer = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  // Presentation-only noise; never affects gameplay, so Math.random is fine here.
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

export function playSfx(id: SfxId): void {
  const ac = audio();
  if (!ac) return;
  const s = SFX[id];
  const now = ac.currentTime;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(s.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + s.duration);
  gain.connect(ac.destination);

  const osc = ac.createOscillator();
  osc.type = s.wave;
  osc.frequency.setValueAtTime(s.from, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, s.to), now + s.duration);
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + s.duration);

  if (s.noise) {
    const src = ac.createBufferSource();
    src.buffer = noise(ac);
    const ng = ac.createGain();
    ng.gain.setValueAtTime(s.volume * 0.6, now);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + s.duration);
    src.connect(ng);
    ng.connect(ac.destination);
    src.start(now);
    src.stop(now + s.duration);
  }
}
