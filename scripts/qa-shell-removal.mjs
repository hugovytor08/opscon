import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile, access, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve('app');
const out = path.resolve('docs/validacao/evidencias/incremento-0.3.3');
const productionWorker = await readFile('app/sw.js', 'utf8');
const oldWorker = productionWorker.replaceAll('shell-v11', 'shell-v10').replace("'./manifest.webmanifest'", "'./assets/ref-inicio.png', './manifest.webmanifest'");
const archivedImage = await readFile('docs/design/referencias-historicas/ref-inicio.png');
const version = JSON.parse(await readFile('app/version.json', 'utf8'));
assert.equal(version.serviceWorkerCache, 'meu-espaco-shell-v11');
assert.equal(productionWorker.includes('ref-inicio.png'), false);
await assert.rejects(access('app/assets/ref-inicio.png'));
const shell = [...productionWorker.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
for (const asset of shell) await access(path.join(root, asset === './' ? 'index.html' : asset));
let phase = 'old', removedImageRequests = 0;
const types = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/sw.js') { res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' }); res.end(phase === 'old' ? oldWorker : productionWorker); return; }
  if (pathname === '/assets/ref-inicio.png') {
    if (phase === 'old') { res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' }); res.end(archivedImage); }
    else { removedImageRequests++; res.writeHead(404).end(); }
    return;
  }
  const filename = path.resolve(root, pathname.replace(/^\/+/, '') || 'index.html');
  if (!filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try { const bytes = await readFile(filename); res.writeHead(200, { 'Content-Type': types[path.extname(filename)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(bytes); }
  catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.CASA_PLAYWRIGHT_MODULE || 'C:/Users/hugov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CASA_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.route('https://**', route => route.abort());
  let page = await context.newPage();
  const origin = `http://127.0.0.1:${server.address().port}/`;
  await page.goto(origin); await page.locator('h1').waitFor();
  await page.evaluate(() => navigator.serviceWorker.ready);
  if (!await page.evaluate(() => !!navigator.serviceWorker.controller)) await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  assert.equal(await page.evaluate(() => caches.has('meu-espaco-shell-v10')), true);
  assert.equal(await page.evaluate(async () => !!await (await caches.open('meu-espaco-shell-v10')).match('./assets/ref-inicio.png')), true);
  const before = await page.evaluate(async () => {
    const storage = await import('./storage.js'), domain = await import('./domain.js');
    const local = await storage.loadLocal();
    const next = domain.applyCommand(local.state, { type: 'item.create', payload: { name: 'Ideia sintética preservada na atualização' }, idempotencyKey: 'synthetic-shell-update' });
    await storage.saveState(next, local.state.revision, local.generation);
    const saved = await storage.loadLocal(); return JSON.stringify({ state: saved.state, queue: saved.queue, generation: saved.generation });
  });
  phase = 'new';
  await page.evaluate(async () => { window.testRegistration = await navigator.serviceWorker.getRegistration(); await window.testRegistration.update(); });
  await page.waitForFunction(() => window.testRegistration.waiting?.state === 'installed');
  assert.equal(await page.evaluate(() => caches.has('meu-espaco-shell-v10')), true, 'old tab keeps coherent shell until closed');
  assert.equal(removedImageRequests, 0, 'new install must not request removed image');
  await page.close(); page = await context.newPage();
  await page.goto(origin); await page.locator('h1').waitFor();
  await page.evaluate(async () => { window.testRegistration = await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => !window.testRegistration.waiting && window.testRegistration.active === navigator.serviceWorker.controller && navigator.serviceWorker.controller?.state === 'activated');
  assert.equal(await page.evaluate(() => caches.has('meu-espaco-shell-v10')), false);
  assert.equal(await page.evaluate(() => caches.has('meu-espaco-shell-v11')), true);
  const snapshot = () => page.evaluate(async () => { const local = await (await import('./storage.js')).loadLocal(); return JSON.stringify({ state: local.state, queue: local.queue, generation: local.generation }); });
  assert.equal(await snapshot(), before);
  assert.equal(await page.locator('#view img').count(), 0);
  assert.equal(removedImageRequests, 0);
  const removedProbe = await page.evaluate(async () => {
    const response = await fetch('./assets/ref-inicio.png', { cache: 'reload' });
    return { status: response.status, caches: await Promise.all((await caches.keys()).map(async key => ({ key, image: !!await (await caches.open(key)).match('./assets/ref-inicio.png') }))) };
  });
  assert.equal(removedProbe.status, 404);
  assert.deepEqual(removedProbe.caches, [{ key: 'meu-espaco-shell-v11', image: false }]);
  await context.setOffline(true); await page.reload(); await page.locator('.overview-grid').waitFor();
  assert.equal(await page.locator('#view img').count(), 0);
  assert.equal(await snapshot(), before);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  await mkdir(out, { recursive: true });
  await page.screenshot({ path: path.join(out, 'inicio-390.png'), fullPage: true, animations: 'disabled' });
  const result = { release: version.version, shell: version.serviceWorkerCache, shellFilesPresent: shell.length, oldTabPreservedUntilClosed: true, oldCacheRemoved: true, removedImageReturns404: true, homeImages: 0, offlineReload: true, stateQueueGenerationPreserved: true, syntheticOnly: true, physicalS23: false, historicalImageSha256: createHash('sha256').update(archivedImage).digest('hex') };
  await writeFile(path.join(out, 'qa.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
