import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { canonical } from '../app/storage.js';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.CASA_PLAYWRIGHT_MODULE || 'C:/Users/hugov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
test('IndexedDB real + protocolo simulado: migração, perda de resposta, offline e browser limpo', async t => {
  const appRoot = fileURLToPath(new URL('../app/', import.meta.url));
  const server = createServer(async (req, res) => {
    const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '') || 'index.html';
    const filename = path.resolve(appRoot, relative);
    if (!filename.startsWith(appRoot)) { res.writeHead(403).end(); return; }
    try {
      const type = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' }[path.extname(filename)] ?? 'application/octet-stream';
      const content = await readFile(filename);
      res.writeHead(200, { 'Content-Type': type }); res.end(content);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: process.env.CASA_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const snapshots = new Map(), receipts = new Map(); let loseNextResponse = false;
  const contexts = [];
  const commitRemote = async (owner, entry) => {
    const key = `${owner}:${entry.key}`, signature = canonical({ state: entry.state, base: entry.baseRevision });
    if (receipts.has(key)) {
      if (receipts.get(key).signature !== signature) return { error: 'IDEMPOTENCY_CONFLICT' };
      return receipts.get(key).receipt;
    }
    if ((snapshots.get(owner)?.revision ?? 0) !== entry.baseRevision) return { error: 'REMOTE_CONFLICT' };
    const receipt = { operationId: entry.key, state: entry.state, revision: entry.baseRevision + 1, updatedAt: new Date().toISOString() };
    snapshots.set(owner, receipt); receipts.set(key, { signature, receipt });
    if (loseNextResponse) { loseNextResponse = false; return { error: 'NETWORK' }; }
    return receipt;
  };
  const makePage = async () => {
    const context = await browser.newContext(); contexts.push(context);
    const page = await context.newPage();
    await page.exposeFunction('remoteRead', async owner => snapshots.get(owner) ?? null);
    await page.exposeFunction('remoteCommit', commitRemote);
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.locator('h1').first().waitFor();
    await page.evaluate(async () => {
      window.store = await import('./storage.js'); window.domain = await import('./domain.js'); window.sync = await import('./sync.js');
      window.transport = { session: async () => ({ user: { id: 'owner-a' } }), read: async () => remoteRead('owner-a'), commit: async (_session, entry) => {
        const reply = await remoteCommit('owner-a', entry);
        if (reply.error) throw new domain.DomainError(reply.error, reply.error);
        return reply;
      }};
      window.engine = new sync.SyncEngine(transport);
      window.write = async (type, payload, key) => {
        const before = await store.loadLocal();
        const state = domain.applyCommand(before.state, { type, payload, idempotencyKey: key });
        if (state !== before.state) await store.saveState(state, before.state.revision, before.generation);
        return state;
      };
    });
    return { page, context };
  };
  try {
    const a = await makePage(); let original, backup;
    await t.test('link expirado mostra recuperação persistente, limpa query/hash e preserva dados', async () => {
      const probe = await makePage();
      await probe.page.evaluate(() => write('item.create', { name: 'Preservar após erro de acesso' }));
      await probe.page.goto(`${origin}/?error=access_denied&error_code=otp_expired#error=access_denied&error_code=otp_expired&sb=`);
      await probe.page.getByRole('heading', { name: 'Não foi possível entrar' }).waitFor();
      assert.equal(new URL(probe.page.url()).search, '');
      assert.equal(new URL(probe.page.url()).hash, '');
      const preserved = await probe.page.evaluate(async () => (await import('./storage.js')).loadState());
      assert.equal(preserved.items[0].name, 'Preservar após erro de acesso');
      await probe.page.getByRole('button', { name: 'Solicitar novo acesso' }).click();
      await probe.page.getByRole('heading', { name: 'Dados e backup' }).waitFor();
      await probe.page.evaluate(() => navigator.serviceWorker.ready);
      await probe.page.waitForFunction(() => !!navigator.serviceWorker.controller);
      await probe.context.setOffline(true);
      await probe.page.goto(`${origin}/?error=access_denied&error_code=otp_expired#error=access_denied`);
      await probe.page.getByRole('heading', { name: 'Não foi possível entrar' }).waitFor();
      await probe.context.setOffline(false);
    });
    await t.test('registros locais + fila atômica; cópia anterior ao vínculo preservada', async () => {
      original = await a.page.evaluate(async () => {
        await write('room.create', { name: 'Sala de teste' });
        await write('item.create', { name: 'Sofá de teste', roomId: (await store.loadState()).rooms[0].id, estimateCents: 300000 });
        await write('account.create', { name: 'Conta de teste', openingBalanceCents: 500000, openingDate: '2026-10-01' });
        let state = await store.loadState();
        await write('purchase.record', { date: '2026-10-11', totalCents: 270000, lines: [{ itemId: state.items[0].id, amountCents: 270000 }], dueDates: ['2026-10-11','2026-11-11','2026-12-11'] }, 'sofa-1');
        state = await store.loadState();
        await write('payment.record', { accountId: state.accounts[0].id, date: '2026-10-11', allocations: [{ obligationId: state.obligations[0].id, amountCents: 90000 }] }, 'payment-1');
        const local = await store.loadLocal();
        return { state: local.state, pending: local.queue.length, summary: domain.getSummary(local.state) };
      });
      assert.equal(original.pending, 5); assert.equal(original.summary.paidCents, 90000); assert.equal(original.summary.openCents, 180000);
      await a.page.evaluate(() => engine.connect());
      const local = await a.page.evaluate(() => store.loadLocal());
      assert.equal(local.queue.length, 0); assert.equal(local.sync.remoteRevision, 1);
      assert.deepEqual(snapshots.get('owner-a').state, original.state);
    });
    const b = await makePage();
    await t.test('browser limpo recebe mesmos IDs, vínculos e totais sem arquivo', async () => {
      await b.page.evaluate(() => engine.connect());
      const recovered = await b.page.evaluate(async () => { const s = await store.loadState(); return { state: s, summary: domain.getSummary(s) }; });
      assert.deepEqual(recovered.state, original.state); assert.deepEqual(recovered.summary, original.summary);
      backup = await a.page.evaluate(async () => store.exportBackup(await store.loadState()));
    });
    await t.test('offline mantém fila após recarga; reconexão confirma no servidor', async () => {
      await a.page.evaluate(async () => { await navigator.serviceWorker.ready; });
      await a.context.setOffline(true);
      await a.page.evaluate(async () => { await write('item.create', { name: 'Registro offline de teste' }); await engine.run(); });
      assert.equal((await a.page.evaluate(() => store.loadLocal())).queue.length, 1);
      await a.page.reload({ waitUntil: 'domcontentloaded' }); await a.page.locator('h1').first().waitFor();
      assert.match(await a.page.locator('#sync-status').innerText(), /1 alterações (locais|pendentes)/);
      const pending = await a.page.evaluate(async () => (await import('./storage.js')).loadLocal());
      assert.equal(pending.queue.length, 1);
      await a.context.setOffline(false);
      // Reload recreated app globals; recover test transport functions only.
      await a.page.evaluate(async () => {
        window.store = await import('./storage.js'); window.domain = await import('./domain.js'); window.sync = await import('./sync.js');
        window.engine = new sync.SyncEngine({ session: async () => ({ user: { id: 'owner-a' } }), read: () => remoteRead('owner-a'), commit: async (_, e) => { const r = await remoteCommit('owner-a', e); if (r.error) throw new domain.DomainError(r.error, r.error); return r; } });
        await engine.run();
      });
      await b.page.evaluate(() => engine.run());
      assert.equal((await b.page.evaluate(() => store.loadState())).items.length, 2);
    });
    await t.test('resposta perdida deixa UUID/base intactos; reenvio não duplica', async () => {
      await b.page.evaluate(() => write('income.record', { accountId: 'account_000005', description: 'Teste de reenvio', date: '2026-10-11', amountCents: 1000 }, 'income-retry'));
      loseNextResponse = true;
      await b.page.evaluate(() => engine.run());
      const pending = await b.page.evaluate(() => store.loadLocal());
      assert.equal(pending.queue.length, 1); assert.notEqual(pending.queue[0].baseRevision, null);
      const remoteRevision = snapshots.get('owner-a').revision;
      await b.page.evaluate(() => engine.run());
      assert.equal(snapshots.get('owner-a').revision, remoteRevision);
      assert.equal((await b.page.evaluate(() => store.loadLocal())).queue.length, 0);
      assert.equal(snapshots.get('owner-a').state.incomes.length, 1);
    });
    await t.test('gravação durante envio permanece na fila após confirmação', async () => {
      await b.page.evaluate(async () => {
        await write('room.create', { name: 'Durante envio 1' });
        const entry = await store.prepareTransmission('owner-a');
        const receipt = await remoteCommit('owner-a', entry);
        await write('room.create', { name: 'Durante envio 2' });
        await store.acknowledge('owner-a', entry, receipt);
      });
      const local = await b.page.evaluate(() => store.loadLocal());
      assert.equal(local.queue.length, 1); assert.equal(local.state.rooms.length, 3);
      await b.page.evaluate(() => engine.run());
    });
    await t.test('dois aparelhos divergentes preservam cópias e impedem sobrescrita', async () => {
      await a.page.evaluate(async () => {
        const before = await store.loadLocal(); const next = domain.applyCommand(before.state, { type: 'room.create', payload: { name: 'Conflito em A' } });
        await store.saveState(next, before.state.revision, before.generation); await engine.run();
      });
      const conflicted = await a.page.evaluate(() => store.loadLocal());
      assert(conflicted.sync.conflict); assert.equal(conflicted.queue.length, 1);
      assert(!snapshots.get('owner-a').state.rooms.some(r => r.name === 'Conflito em A'));
      await assert.rejects(a.page.evaluate(async () => { const before = await store.loadLocal(); await store.saveState(domain.applyCommand(before.state, { type: 'room.create', payload: { name: 'Bloqueado' } }), before.state.revision, before.generation); }), /Revise o conflito/);
      await a.page.evaluate(() => engine.acceptRemote());
      assert.deepEqual((await a.page.evaluate(() => store.loadState())), snapshots.get('owner-a').state);
    });
    await t.test('outra conta não vincula nem envia dados locais já pertencentes a A', async () => {
      await assert.rejects(b.page.evaluate(async () => store.bindOwner('owner-b', null, (await store.loadLocal()).generation)), /outra conta/);
    });
    const c = await makePage();
    await t.test('backup independente restaura em browser limpo; inválido não altera base', async () => {
      await c.page.evaluate(async json => { const before = await store.loadLocal(); await store.restoreBackup(json, before.state.revision, before.generation); }, backup);
      assert.deepEqual(await c.page.evaluate(() => store.loadState()), original.state);
      const bad = JSON.parse(backup); bad.state.obligations[0].amountCents--;
      await assert.rejects(c.page.evaluate(async json => { const l = await store.loadLocal(); await store.restoreBackup(json, l.state.revision, l.generation); }, JSON.stringify(bad)), /divergem/);
      assert.deepEqual(await c.page.evaluate(() => store.loadState()), original.state);
    });
    await t.test('quota na fila aborta também snapshot; aba antiga não salva após restauração', async () => {
      const outcome = await c.page.evaluate(async json => {
        const before = await store.loadLocal(), originalPut = IDBObjectStore.prototype.put;
        try {
          IDBObjectStore.prototype.put = function(value) { if (this.name === 'outbox') throw new DOMException('Quota', 'QuotaExceededError'); return originalPut.call(this, value); };
          await write('room.create', { name: 'Não pode persistir pela metade' });
        } catch (e) { if (e.code !== 'STORAGE_QUOTA') throw e; }
        finally { IDBObjectStore.prototype.put = originalPut; }
        const after = await store.loadLocal();
        await store.restoreBackup(json, after.state.revision, after.generation);
        let stale;
        try { await store.saveState(domain.applyCommand(before.state, { type: 'room.create', payload: { name: 'Aba antiga' } }), before.state.revision, before.generation); } catch(e) { stale = e.code; }
        return { before: before.state, after: after.state, stale };
      }, backup);
      assert.deepEqual(outcome.before, outcome.after); assert.equal(outcome.stale, 'STORAGE_CONFLICT');
    });
    await t.test('upgrade IndexedDB v1 para v2 conserva snapshot anterior', async () => {
      const context = await browser.newContext(); contexts.push(context); const page = await context.newPage();
      await page.goto(`${origin}/icon.svg`);
      await page.evaluate(async state => {
        await new Promise((resolve, reject) => {
          const req = indexedDB.open('casa-serena', 1);
          req.onupgradeneeded = () => req.result.createObjectStore('snapshots', { keyPath: 'key' });
          req.onerror = () => reject(req.error);
          req.onsuccess = () => { const db = req.result, tx = db.transaction('snapshots', 'readwrite'); tx.objectStore('snapshots').put({ key: 'current', state }); tx.oncomplete = () => { db.close(); resolve(); }; };
        });
      }, original.state);
      await page.goto(origin); await page.locator('h1').first().waitFor();
      const upgraded = await page.evaluate(async () => (await import('./storage.js')).loadLocal());
      assert.deepEqual(upgraded.state, original.state); assert.equal(upgraded.queue.length, 0);
      assert.equal(upgraded.generation, null);
      await page.evaluate(async () => {
        const storage = await import('./storage.js'), domain = await import('./domain.js'), before = await storage.loadLocal();
        await storage.saveState(domain.applyCommand(before.state, { type: 'room.create', payload: { name: 'Após upgrade' } }), before.state.revision, before.generation);
      });
      await assert.rejects(page.evaluate(async () => (await import('./storage.js')).bindOwner('owner-a', null, null)), /dados mudaram/);
    });
    await t.test('interface: código de acesso, recuperação, pendência e sincronização automática', async () => {
      // Routing mock Auth/API responses requires blocking SW in this one UI test.
      // The separate offline/reload case exercises the real SW.
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' }); contexts.push(context);
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.route('**/config.js', route => route.fulfill({ contentType: 'text/javascript', body: "export const remoteConfig = {url:'https://test.supabase.co',publishableKey:'sb_publishable_test'};" }));
      await page.route('https://test.supabase.co/**', async route => {
        const req = route.request(), path = new URL(req.url()).pathname;
        let result = {}, status = 200;
        if (req.method() === 'OPTIONS') result = {};
        else if (path.endsWith('/verify')) result = { access_token: 'test-access', refresh_token: 'test-refresh', expires_in: 3600, user: { id: 'owner-a', email: 'test@example.invalid' } };
        else if (path.endsWith('/user')) result = { id: 'owner-a' };
        else if (path === '/rest/v1/casa_snapshots') {
          const remote = snapshots.get('owner-a');
          result = remote ? [{ remote_revision: remote.revision, state: remote.state, updated_at: remote.updatedAt }] : [];
        } else if (path.endsWith('/casa_commit_snapshot')) {
          const body = req.postDataJSON();
          result = await commitRemote('owner-a', { key: body.p_operation_id, baseRevision: body.p_base_revision, state: body.p_state });
          if (result.error) { status = 400; result = { code: result.error === 'REMOTE_CONFLICT' ? 'CS409' : 'CS422' }; }
        }
        await route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'apikey,authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' }, body: JSON.stringify(result) });
      });
      await page.goto(origin); await page.locator('#sync-status').click();
      await page.locator('[data-form="auth-code"] [name="email"]').fill('test@example.invalid');
      await page.locator('[data-form="auth-code"] button[type="submit"]').click();
      await page.locator('[data-form="auth-verify"] [name="code"]').fill('123456');
      await page.locator('[data-form="auth-verify"] button[type="submit"]').click();
      await page.locator('[data-action="bind-cloud"]').click();
      await page.waitForFunction(() => document.querySelector('#sync-status').textContent.startsWith('Sincronizado'));
      await page.locator('[data-action="close-overlay"]').last().click();
      await context.setOffline(true);
      await page.locator('#mobile-nav [data-nav="compras"]').click();
      await page.locator('[data-action="new-item"]').first().click();
      await page.locator('[data-form="item-create"] [name="name"]').fill('Teste pela interface offline');
      await page.locator('[data-form="item-create"] button[type="submit"]').click();
      await page.waitForFunction(() => document.querySelector('#sync-status').textContent.includes('1 alterações pendentes'));
      await context.setOffline(false);
      await page.waitForFunction(() => document.querySelector('#sync-status').textContent.startsWith('Sincronizado'));
      assert(snapshots.get('owner-a').state.items.some(i => i.name === 'Teste pela interface offline'));
      assert.deepEqual(errors, []);
      await mkdir('tmp/app_qa', { recursive: true });
      await page.screenshot({ path: 'tmp/app_qa/sync-status.png', fullPage: true });
    });
    await t.test('interface Free: link PKCE retorna sessão e limpa código da URL', async () => {
      const context = await browser.newContext({ serviceWorkers: 'block' }); contexts.push(context);
      const page = await context.newPage(); let challenge, verifier;
      await page.route('**/config.js', route => route.fulfill({ contentType: 'text/javascript', body: "export const remoteConfig = {url:'https://test.supabase.co',publishableKey:'sb_publishable_test',authMode:'magic-link'};" }));
      await page.route('https://test.supabase.co/**', async route => {
        const req = route.request(), url = new URL(req.url()); let result = {};
        if (req.method() !== 'OPTIONS') {
          if (url.pathname.endsWith('/otp')) challenge = req.postDataJSON().code_challenge;
          if (url.pathname.endsWith('/token')) {
            verifier = req.postDataJSON().code_verifier;
            result = { access_token: 'synthetic-access', refresh_token: 'synthetic-refresh', expires_in: 3600, user: { id: 'owner-a' } };
          }
          if (url.pathname.endsWith('/user')) result = { id: 'owner-a' };
          if (url.pathname.endsWith('/casa_snapshots')) {
            const snapshot = snapshots.get('owner-a'); result = [{ remote_revision: snapshot.revision, state: snapshot.state, updated_at: snapshot.updatedAt }];
          }
        }
        await route.fulfill({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'apikey,authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' }, body: JSON.stringify(result) });
      });
      await page.goto(origin); await page.locator('#sync-status').click();
      await page.locator('[data-form="auth-code"] [name="email"]').fill('test@example.invalid');
      await page.getByRole('button', { name: 'Receber link de acesso' }).click();
      await page.getByRole('heading', { name: 'Confira seu e-mail' }).waitFor();
      assert.match(challenge, /^[A-Za-z0-9_-]{43}$/);
      await page.goto(`${origin}/?code=synthetic-one-time-code`);
      await page.locator('[data-action="bind-cloud"]').waitFor();
      assert.equal(new URL(page.url()).searchParams.has('code'), false);
      assert.match(verifier, /^[A-Za-z0-9_-]{43}$/);
      await page.locator('[data-action="bind-cloud"]').click();
      await page.waitForFunction(() => document.querySelector('#sync-status').textContent.startsWith('Sincronizado'));
      const recovered = await page.evaluate(async () => (await import('./storage.js')).loadState());
      assert.deepEqual(recovered, snapshots.get('owner-a').state);
    });
  } finally { await Promise.all(contexts.map(c => c.close())); await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
