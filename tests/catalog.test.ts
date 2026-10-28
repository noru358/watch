import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { exportCatalog } from '../tools/catalog/export';
import { catalogMarkdown } from '../tools/catalog/markdown';

// docs/catalog.md is what agents read instead of the data files, so it must match the code.
describe('총괄 장부', () => {
  it('docs/catalog.md is up to date (run npm run catalog after changing data or text)', () => {
    const want = catalogMarkdown(exportCatalog());
    const have = readFileSync(new URL('../docs/catalog.md', import.meta.url), 'utf8');
    expect(have === want, 'docs/catalog.md is stale: run npm run catalog').toBe(true);
  });
});
