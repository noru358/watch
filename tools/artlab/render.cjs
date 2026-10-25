// Renders lab.html to PNGs: node tools/artlab/render.cjs <outDir>
// Needs a static server on tools/artlab (module imports don't work from file://).
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2] || '.';
  const port = process.env.PORT || 8765;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1800, height: 900 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  // [who, scale]: scale 5 = close-up, scale 3 ≈ the in-game size (the game zooms 2.5×)
  for (const [who, scale] of [['none', 5], ['none', 3]]) {
    await p.goto(`http://localhost:${port}/lab.html?who=${who}&scale=${scale}`);
    await p.waitForSelector('body[data-ready="1"]', { timeout: 10000 });
    await (await p.$('#scene')).screenshot({ path: `${out}/artlab-scene-${who}${scale === 5 ? '' : '-x' + scale}.png` });
  }
  await (await p.$('#sheet')).screenshot({ path: `${out}/artlab-sheet.png` });
  console.log(errs.join('\n') || 'ok');
  await b.close();
})();
