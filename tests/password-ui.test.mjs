import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { applyCommand, createInitialState } from '../app/domain.js';
import { withApp } from './browser-harness.mjs';

const config = { url: 'https://password-test.supabase.invalid', publishableKey: 'sb_publishable_test', authMode: 'password' };
const evidence = process.env.CASA_EVIDENCE_DIR ? path.join(process.env.CASA_EVIDENCE_DIR, 'acesso') : fileURLToPath(new URL('../docs/validacao/evidencias/incremento-0.3.5/', import.meta.url));
const password = 'Senha sintética 123!';
const snapshot = page => page.evaluate(async () => {
  const local = await (await import('./storage.js')).loadLocal();
  return JSON.stringify({ state: local.state, queue: local.queue, generation: local.generation });
});

async function provider(page) {
  const state = applyCommand(createInitialState(), { type: 'item.create', payload: { name: 'Item sintético recuperado' } });
  const mock = { offline: false, snapshot: { revision: 1, state, updatedAt: '2026-10-15T12:00:00Z' }, commits: 0, otp: 0, puts: 0 };
  await page.route(`${config.url}/**`, async route => {
    if (mock.offline) { await route.abort('internetdisconnected'); return; }
    const req = route.request(), url = new URL(req.url());
    const body = req.postData() ? req.postDataJSON() : null;
    let result = {}, status = 200;
    if (req.method() !== 'OPTIONS') {
      if (url.pathname.endsWith('/token')) {
        if (url.searchParams.get('grant_type') === 'password' && body.password !== password) { status = 400; result = { message: 'internal account detail' }; }
        else {
          const owner = body.email === 'other@example.invalid' ? 'b' : 'a';
          result = { access_token: `synthetic-${owner}`, refresh_token: `synthetic-refresh-${owner}`, expires_in: 3600, user: { id: `owner-${owner}`, email: owner === 'a' ? 'test@example.invalid' : 'other@example.invalid' } };
          mock.verifier = body.code_verifier;
        }
      } else if (url.pathname.endsWith('/recover')) mock.challenge = body.code_challenge;
      else if (url.pathname.endsWith('/otp')) mock.otp++;
      else if (url.pathname.endsWith('/user')) {
        result = { id: 'owner-a', email: 'test@example.invalid' };
        if (req.method() === 'PUT') { mock.puts++; mock.changedPassword = body.password; }
      } else if (url.pathname.endsWith('/casa_snapshots')) result = [{ remote_revision: mock.snapshot.revision, state: mock.snapshot.state, updated_at: mock.snapshot.updatedAt }];
      else if (url.pathname.endsWith('/casa_commit_snapshot')) {
        mock.commits++;
        mock.snapshot = { operationId: body.p_operation_id, revision: body.p_base_revision + 1, state: body.p_state, updatedAt: '2026-10-15T12:01:00Z' };
        result = mock.snapshot;
      }
    }
    await route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'apikey,authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS' }, body: JSON.stringify(result) });
  });
  return mock;
}

async function login(page, email, secret) {
  const form = page.locator('[data-form="auth-password"]');
  await form.locator('[name="email"]').fill(email);
  await form.locator('[name="password"]').fill(secret);
  await form.locator('[type="submit"]').click();
}

test('e-mail/senha: erro genérico, recuperação da mesma conta, saída offline e fila preservada', { timeout: 120000 }, async () => withApp(async ({ page, context, url }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const mock = await provider(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mkdir(evidence, { recursive: true });
  await page.goto(url); await page.locator('h1').waitFor();
  await page.locator('#sync-status').click();
  await page.locator('[data-form="auth-password"]').waitFor();
  assert.equal(await page.locator('[name="password"]').getAttribute('type'), 'password');
  assert.equal(await page.locator('[data-form="auth-code"]').count(), 0);
  const before = await snapshot(page);
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.screenshot({ path: path.join(evidence, `acesso-${width}.png`), fullPage: true, animations: 'disabled' });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'test@example.invalid', 'senha incorreta');
  await page.locator('[data-auth-error]').filter({ hasText: 'Confira o e-mail e a senha' }).waitFor();
  assert.equal(await page.locator('[name="password"]').inputValue(), '');
  assert.equal(await snapshot(page), before);
  assert.equal(await page.locator('[data-auth-error]').innerText(), 'Não foi possível entrar. Confira o e-mail e a senha.');
  await login(page, 'test@example.invalid', password);
  await page.locator('[data-action="bind-cloud"]').waitFor();
  await page.locator('[data-action="bind-cloud"]').click();
  await page.waitForFunction(() => document.querySelector('#sync-status').textContent.startsWith('Sincronizado'));
  const recovered = JSON.parse(await snapshot(page));
  assert.deepEqual(recovered.state, mock.snapshot.state);
  await page.locator('[data-action="close-overlay"]').last().click();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); await page.locator('h1').waitFor();
  mock.offline = true; await context.setOffline(true);
  await page.locator('#mobile-nav [data-nav="compras"]').click();
  await page.locator('[data-action="new-item"]').first().click();
  await page.locator('[data-form="item-create"] [name="name"]').fill('Item sintético offline');
  await page.locator('[data-form="item-create"] [type="submit"]').click();
  await page.waitForFunction(() => document.querySelector('#sync-status').textContent.includes('1 alterações pendentes'));
  const pending = await snapshot(page);
  await page.reload(); await page.locator('h1').waitFor();
  assert.equal(await snapshot(page), pending);
  await page.locator('#sync-status').click();
  await page.locator('[data-action="sign-out"]').click();
  await page.locator('[data-form="auth-password"]').waitFor();
  assert.equal(await snapshot(page), pending);
  assert.equal(await page.evaluate(() => localStorage.getItem('casa-serena-auth:https://password-test.supabase.invalid')), null);
  mock.offline = false; await context.setOffline(false);
  await login(page, 'other@example.invalid', password);
  await page.locator('[data-auth-error]').filter({ hasText: 'mesma conta' }).waitFor();
  assert.equal(await snapshot(page), pending);
  await login(page, 'test@example.invalid', password);
  try { await page.waitForFunction(() => document.querySelector('#sync-status').textContent.startsWith('Sincronizado'), null, { timeout: 10000 }); }
  catch { throw new Error(JSON.stringify({ status: await page.locator('#sync-status').textContent(), commits: mock.commits, pending: JSON.parse(await snapshot(page)).queue.length })); }
  const saved = JSON.parse(await snapshot(page));
  assert.equal(saved.queue.length, 0);
  assert.deepEqual(saved.state.items.map(item => item.id), JSON.parse(pending).state.items.map(item => item.id));
  assert.equal(mock.commits, 1); assert.equal(mock.otp, 0);
  const backup = await page.evaluate(async () => (await import('./storage.js')).exportBackup((await (await import('./storage.js')).loadLocal()).state));
  for (const secret of [password, 'synthetic-a', 'synthetic-refresh-a']) assert.equal(backup.includes(secret), false);
  assert.deepEqual(errors, []);
  await writeFile(path.join(evidence, 'qa-login.json'), JSON.stringify({ release: '0.3.5', engine: 'Chromium', syntheticOnly: true, physicalS23: false, emailPassword: true, genericFailure: true, otherOwnerRejected: true, recoveredSameIds: true, offlineReload: true, offlineLogoutPreservesQueue: true, reconnectCommits: mock.commits, otpRequests: mock.otp, secretsExcludedFromBackup: true, errors }, null, 2) + '\n');
}, { config }));

test('recuperação de senha: PKCE, URL limpa, recarga, confirmação e segredo fora do armazenamento', { timeout: 120000 }, async () => withApp(async ({ page, url }) => {
  const mock = await provider(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url); await page.locator('h1').waitFor();
  await page.locator('#sync-status').click();
  await page.locator('[data-action="auth-recover"]').click();
  await page.locator('[data-form="auth-recover"] [name="email"]').fill('test@example.invalid');
  await page.locator('[data-form="auth-recover"] [type="submit"]').click();
  await page.getByRole('heading', { name: 'Confira seu e-mail', exact: true }).waitFor();
  assert.match(mock.challenge, /^[A-Za-z0-9_-]{43}$/);
  await page.goto(`${url}?code=synthetic-recovery-code`);
  await page.locator('[data-form="auth-reset"]').waitFor();
  assert.equal(new URL(page.url()).search, '');
  assert.match(mock.verifier, /^[A-Za-z0-9_-]{43}$/);
  await page.reload(); await page.locator('[data-form="auth-reset"]').waitFor();
  const form = page.locator('[data-form="auth-reset"]');
  await form.locator('[name="password"]').fill('Nova senha sintética 123!');
  await form.locator('[name="confirmation"]').fill('Outra senha sintética 456!');
  await form.locator('[type="submit"]').click();
  await page.locator('[data-auth-error]').filter({ hasText: 'precisam ser iguais' }).waitFor();
  assert.equal(mock.puts, 0);
  await form.locator('[name="password"]').fill('Nova senha sintética 123!');
  await form.locator('[name="confirmation"]').fill('Nova senha sintética 123!');
  await form.locator('[type="submit"]').click();
  await form.waitFor({ state: 'detached' });
  assert.equal(mock.puts, 1);
  assert.equal(mock.changedPassword, 'Nova senha sintética 123!');
  const stored = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)]))));
  assert.equal(stored.includes('Nova senha sintética'), false);
  assert.equal(stored.includes('synthetic-recovery-code'), false);
  assert.equal(stored.includes(':pkce'), false);
  assert.equal(stored.includes(':recovery'), false);
  await mkdir(evidence, { recursive: true });
  await writeFile(path.join(evidence, 'qa-recuperacao.json'), JSON.stringify({ syntheticOnly: true, pkce: true, cleanCallbackUrl: true, survivesReload: true, mismatchedConfirmationRejected: true, nativePasswordUpdates: mock.puts, passwordStored: false }, null, 2) + '\n');
}, { config }));
