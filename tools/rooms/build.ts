// npm run rooms → dist-rooms/index.html: every hand-made room (src/data/rooms.data.ts) drawn as cells,
// numbered, for the owner to pass or fail by number. Published as a Claude artifact (README in this folder).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOMS, type RoomId } from '../../src/data/rooms.data';

const here = import.meta.dirname;
const out = resolve(here, '../../dist-rooms');
const rooms = (Object.keys(ROOMS) as RoomId[]).map((id, i) => ({ n: i + 1, id, themes: ROOMS[id].themes, mirror: ROOMS[id].mirror, weight: ROOMS[id].weight, rows: ROOMS[id].rows }));
const data = JSON.stringify(rooms).replace(/</g, '\\u003c');
const page = readFileSync(resolve(here, 'template.html'), 'utf8').replace('/*__DATA__*/null', data);
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'index.html'), page);
console.log(`dist-rooms/index.html ${rooms.length} rooms`);
