// npm run catalog → docs/catalog.md (text, committed) and dist-catalog/index.html (the 총괄 장부 page).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { exportCatalog } from './export';
import { catalogMarkdown } from './markdown';

const here = import.meta.dirname;
const out = resolve(here, '../../dist-catalog');
const catalog = exportCatalog();
const data = JSON.stringify(catalog).replace(/</g, '\\u003c');
writeFileSync(resolve(here, '../../docs/catalog.md'), catalogMarkdown(catalog));
const page = readFileSync(resolve(here, 'template.html'), 'utf8').replace('/*__DATA__*/null', data);
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'index.html'), page);
console.log(`dist-catalog/index.html ${Math.round(page.length / 1024)} KB`);
