import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createInitialState, applyCommand } from '../app/domain.js';
import { readBindings, saveBindings } from '../app/house-map.js';

test('vínculo explícito preserva identidade, separa contas e rejeita duplicidade/quota', () => {
  const entries = new Map();
  const storage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
  const makeState = key => applyCommand(createInitialState(), { type: 'room.create', payload: { name: 'Escritório' }, idempotencyKey: key });
  const state = makeState('original'), before = JSON.stringify(state);
  saveBindings({ 'vis-q3': state.rooms[0].id }, state, 'owner-a', storage);
  assert.deepEqual(readBindings(state, 'owner-a', storage), { 'vis-q3': state.rooms[0].id });
  assert.deepEqual(readBindings(state, 'owner-b', storage), {});
  assert.deepEqual(readBindings(makeState('outra-origem'), 'owner-a', storage), {});
  assert.throws(() => saveBindings({ 'vis-q1': state.rooms[0].id, 'vis-q2': state.rooms[0].id }, state, 'owner-a', storage));
  assert.throws(() => saveBindings({ 'vis-q1': 'inexistente' }, state, 'owner-a', storage));
  assert.throws(() => saveBindings({}, state, 'owner-a', { setItem() { throw new Error('quota'); } }));
  assert.deepEqual(readBindings(state, 'owner-a', storage), { 'vis-q3': state.rooms[0].id });
  assert.equal(JSON.stringify(state), before);
});

test('Casa integrada: mapa, vínculos, teclado, offline e fallback sem alterar dados', async t => {
  const root = fileURLToPath(new URL('../app/', import.meta.url));
  const server = createServer(async (req, res) => {
    const filename = path.resolve(root, new URL(req.url, 'http://localhost').pathname.replace(/^\/+/, '') || 'index.html');
    if (!filename.startsWith(root)) { res.writeHead(403).end(); return; }
    try {
      const content = await readFile(filename);
      res.writeHead(200, { 'Content-Type': { '.js': 'text/javascript', '.html': 'text/html', '.svg': 'image/svg+xml', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.png': 'image/png' }[path.extname(filename)] ?? 'application/octet-stream' }); res.end(content);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const require = createRequire(import.meta.url);
  const { chromium } = require(process.env.CASA_PLAYWRIGHT_MODULE || 'C:/Users/hugov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CASA_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
    const origin = `http://127.0.0.1:${server.address().port}`;
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const house = async () => { await page.locator('#mobile-nav [data-nav="casa"]').click(); };
    const snapshot = () => page.evaluate(async () => JSON.stringify(await (await import('./storage.js')).loadLocal()));
    await page.goto(origin);
    await page.locator('h1').first().waitFor();
    await house();
    await page.locator('.apartment-map-image').waitFor();
    assert.equal(await page.locator('.map-room-choice').count(), 8);
    assert.equal(await page.evaluate(async () => (await (await import('./storage.js')).loadLocal()).state.rooms.length), 0);
    await page.locator('.map-room-choice[data-map-region="vis-q3"]').click();
    assert.match(await page.locator('.room-panel').innerText(), /ainda não está vinculado/);
    await page.evaluate(async () => {
      const storage = await import('./storage.js'), domain = await import('./domain.js');
      const write = async (type, payload, idempotencyKey) => {
        const local = await storage.loadLocal();
        const state = domain.applyCommand(local.state, { type, payload, idempotencyKey });
        await storage.saveState(state, local.state.revision, local.generation);
        return state;
      };
      const state = await write('room.create', { name: 'Escritório' }, 'map-office');
      const roomId = state.rooms[0].id;
      await write('room.create', { name: 'Dormitório' }, 'map-bedroom');
      await write('item.create', { name: 'Mesa de trabalho', roomId, estimateCents: 50000 }, 'map-table');
    });
    await page.reload(); await house();
    const before = await snapshot();
    await page.locator('[data-action="map-bindings"]').first().click();
    await page.locator('[name="vis-q3"]').selectOption({ label: 'Escritório' });
    await page.locator('[name="vis-q1"]').selectOption({ label: 'Dormitório' });
    await page.locator('form[data-form="map-bindings"] [type="submit"]').click();
    await page.locator('form[data-form="map-bindings"]').waitFor({ state: 'detached' });
    assert.equal(await snapshot(), before, 'binding must not alter domain, generation, financial state or outbox');
    const region = page.locator('polygon[data-map-region="vis-q3"]');
    await region.focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('.room-panel h2').first().innerText(), 'Escritório');
    assert.match(await page.locator('.room-panel').innerText(), /Mesa de trabalho/);
    assert.equal(await page.locator('polygon[data-map-region="vis-q3"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.mapRegion), 'vis-q3');
    await page.locator('[data-action="map-bindings"]').first().click();
    await page.locator('[name="vis-q2"]').selectOption({ label: 'Escritório' });
    await page.locator('form[data-form="map-bindings"] [type="submit"]').click();
    await page.locator('.toast.error').waitFor();
    assert.match(await page.locator('.toast.error').innerText(), /cômodo diferente/);
    await page.keyboard.press('Escape');
    await page.locator('[data-house-mode="lista"]').click();
    await page.locator('.room-list-card').filter({ hasText: 'Dormitório' }).click();
    assert.equal(await page.locator('.room-panel h2').first().innerText(), 'Dormitório');
    await page.locator('[data-house-mode="mapa"]').click();
    assert.equal(await page.locator('polygon[data-map-region="vis-q1"]').getAttribute('aria-pressed'), 'true');
    await page.locator('[data-map-zoom]').click();
    await page.locator('.toast.error').waitFor({ state: 'detached' });
    assert.equal(await page.locator('.apartment-map-canvas').evaluate(node => node.style.width), '200%');
    await page.locator('[data-map-zoom]').click();
    const evidence = fileURLToPath(new URL('../docs/validacao/evidencias/reformulacao-0.3.2/mapa/', import.meta.url));
    await mkdir(evidence, { recursive: true });
    for (const width of [320, 360, 390, 412, 1200]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `overflow at ${width}`);
      assert.equal(await page.locator('.map-room-choice').evaluateAll(nodes => nodes.every(node => node.getBoundingClientRect().height >= 44)), true);
      await page.evaluate(() => { document.activeElement.blur(); window.scrollTo(0, 0); });
      await page.screenshot({ path: path.join(evidence, `casa-${width}.png`) });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); await house();
    await context.setOffline(true);
    await page.reload(); await house();
    await page.locator('.map-room-choice[data-map-region="vis-q3"]').click();
    assert.equal(await page.locator('.room-panel h2').first().innerText(), 'Escritório');
    assert.equal(await page.locator('.apartment-map-image').evaluate(node => node.complete && node.naturalWidth > 0), true);
    assert.equal(await snapshot(), before);
    await context.setOffline(false);
    for (const section of ['inicio', 'compras', 'financas', 'projetos']) {
      await page.locator(`#mobile-nav [data-nav="${section}"]`).click();
      assert.equal(await page.locator('.apartment-map-image, [data-map-region]').count(), 0);
    }
    await page.locator('[data-action="menu"]').first().click();
    await page.locator('.drawer [data-nav="mercado"]').click();
    assert.equal(await page.locator('[data-map-region]').count(), 0);
    assert.deepEqual(errors, []);
    await context.close();

    await t.test('arquivo de mapa indisponível conserva ações da lista', async () => {
      const fallback = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
      const p = await fallback.newPage();
      await p.route('**/assets/apartamento-real/casa-isometrica.svg', route => route.fulfill({ status: 404, body: '' }));
      await p.goto(origin); await p.locator('h1').first().waitFor();
      await p.locator('#mobile-nav [data-nav="casa"]').click();
      await p.getByText('O mapa está indisponível. Continue pela lista de cômodos.').waitFor();
      await p.locator('[data-action="new-room"]').first().click();
      await p.locator('form[data-form="room-create"] [name="name"]').fill('Sala');
      await p.locator('form[data-form="room-create"] [type="submit"]').click();
      await p.locator('.room-panel h2').filter({ hasText: 'Sala' }).waitFor();
      assert.equal(await p.locator('.room-list-card').count(), 1);
      await fallback.close();
    });
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
});
