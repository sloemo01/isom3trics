import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await mkdir('qa/captures', { recursive: true });
await page.goto(process.env.QA_URL || 'http://localhost:5198', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__isom3trics?.getStats().finite);
const contract = await page.evaluate(() => ({
  elementCount: document.body.querySelectorAll('*:not(script)').length,
  text: document.body.innerText.trim(),
  canvas: { width: document.querySelector('canvas').clientWidth, height: document.querySelector('canvas').clientHeight },
  stats: window.__isom3trics.getStats(),
}));
assert.equal(contract.elementCount, 1, 'Only the canvas is in the page');
assert.equal(contract.text, '', 'No text is rendered');
assert.equal(contract.canvas.width, 1440);
assert.equal(contract.canvas.height, 1000);
assert.equal(contract.stats.finite, true);
assert.equal(contract.stats.mode, 'component');
await page.screenshot({ path: 'qa/captures/component-desktop.png' });
const before = await page.evaluate(() => window.__isom3trics.getStats().camera);
await page.mouse.move(720, 500); await page.mouse.down(); await page.mouse.move(940, 540, { steps: 10 }); await page.mouse.up();
const after = await page.evaluate(() => window.__isom3trics.getStats().camera);
assert.notDeepEqual(after, before, 'Drag changes the view');
await page.screenshot({ path: 'qa/captures/component-orbit.png' });
await page.locator('canvas').focus(); await page.keyboard.press('r');
const restored = await page.evaluate(() => window.__isom3trics.getStats().camera);
assert.ok(restored.every((value, index) => Math.abs(value - before[index]) < 1e-9), 'R restores the hero view within floating-point tolerance');
await page.mouse.wheel(0, -350);
await page.waitForFunction(() => window.__isom3trics.camera.zoom > 1);
await page.screenshot({ path: 'qa/captures/component-zoom.png' });
await page.evaluate(() => { window.__isom3trics.camera.zoom = 0.65; window.__isom3trics.camera.updateProjectionMatrix(); window.__isom3trics.orbit.controls.update(); window.__isom3trics.render(); });
await page.screenshot({ path: 'qa/captures/component-zoom-out.png' });
assert.equal(await page.evaluate(() => window.__isom3trics.look.strokePx), 1.25, 'Zoom-out never changes the stroke pixel contract');
await page.evaluate(() => { window.__isom3trics.reset(); window.__isom3trics.setView(-145, 22); });
await page.screenshot({ path: 'qa/captures/component-rear.png' });
await page.evaluate(() => { window.__isom3trics.reset(); window.__isom3trics.setView(34, 65); });
await page.screenshot({ path: 'qa/captures/component-high.png' });
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForFunction(() => document.querySelector('canvas').width === 390);
await page.evaluate(() => window.__isom3trics.reset());
await page.screenshot({ path: 'qa/captures/component-phone.png' });
assert.equal(await page.evaluate(() => document.body.innerText.trim()), '');
assert.deepEqual(errors, [], 'No browser or WebGL errors');
const report = { passed: true, contract, orbitChanged: true, resetRestored: true, zoomChanged: true, errors, captures: ['component-desktop.png', 'component-orbit.png', 'component-zoom.png', 'component-zoom-out.png', 'component-rear.png', 'component-high.png', 'component-phone.png'] };
await writeFile('qa/report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
await browser.close();
