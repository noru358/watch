// npm run catalog → dist-catalog/index.html: the 총괄 관리 page with today's data baked in.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { exportCatalog } from './export';

const here = import.meta.dirname;
const out = resolve(here, '../../dist-catalog');
const data = JSON.stringify(exportCatalog()).replace(/</g, '\\u003c');
const page = readFileSync(resolve(here, 'template.html'), 'utf8').replace('/*__DATA__*/null', data);
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'index.html'), page);
console.log(`dist-catalog/index.html ${Math.round(page.length / 1024)} KB`);
