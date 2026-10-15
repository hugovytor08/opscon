import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrateState } from '../app/domain.js';
import { withApp } from './browser-harness.mjs';
const out = fileURLToPath(new URL('../docs/validacao/evidencias/incremento-0.3.7/', import.meta.url));
const local = page => page.evaluate(async () => (await import('./storage.js')).loadLocal());
const snapshot = async page => { const s = await local(page); return JSON.stringify({ state: s.state, queue: s.queue, generation: s.generation }); };
const action = (page, name) => page.locator(`#view [data-action="${name}"]`).first().click();
async function fill(page, kind, values, save = true) {
  const form = page.locator(`[data-form="${kind}"]`);
  for (const [key, value] of Object.entries(values)) {
    const input = form.locator(`[name="${key}"]`);
    if (await input.evaluate(el => el.tagName === 'SELECT')) await input.selectOption(value); else await input.fill(value);
  }
  if (save) { await form.locator('[type="submit"]').click(); await form.waitFor({ state: 'detached' }); }
  return form;
}
const balances = page => page.evaluate(async () => {
  const s = (await (await import('./storage.js')).loadLocal()).state, d = await import('./domain.js');
  return { bank: d.getSummary(s).balanceCents, benefit: d.getSummary(s).benefitBalanceCents };
});

test('alimentação na UI: previsão, confirmação editável, Mercado só benefício/misto, insuficiência e offline', { timeout: 120000 }, async () => withApp(async ({ page, context, url }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.clock.install({ time: new Date('2026-10-15T15:00:00Z') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url); await page.locator('h1').waitFor();
  await page.locator('#mobile-nav [data-nav="financas"]').click();
  await action(page, 'new-account');
  await fill(page, 'account-create', { name: 'Banco sintético', openingBalance: '1000,00', openingDate: '2026-10-01' });
  await action(page, 'new-benefit');
  await fill(page, 'account-create', { name: 'Alimentação sintética', openingBalance: '50,00', openingDate: '2026-10-01' });
  const [bank, benefit] = (await local(page)).state.accounts;
  assert.deepEqual(await balances(page), { bank: 100000, benefit: 5000 });
  assert.match(await page.locator('[data-benefit-wallet]').textContent(), /690,00/);
  const beforeForecast = await snapshot(page);
  await page.locator('[data-month="1"]').click(); await page.locator('[data-month="-1"]').click();
  assert.equal(await snapshot(page), beforeForecast);
  await action(page, 'confirm-benefit');
  const credit = page.locator('[data-form="benefit-confirm"]');
  assert.equal(await credit.locator('[name="amount"]').inputValue(), '690,00');
  assert.equal(await credit.locator('[name="date"]').inputValue(), '2026-10-30');
  await fill(page, 'benefit-confirm', { amount: '700,00', date: '2026-10-29' }, false);
  assert.match(await credit.locator('[data-balance-result]').textContent(), /50,00.*750,00/);
  assert.equal(await snapshot(page), beforeForecast);
  await credit.locator('[type="submit"]').click(); await credit.waitFor({ state: 'detached' });
  assert.deepEqual(await balances(page), { bank: 100000, benefit: 75000 });
  assert.equal(await page.locator('[data-action="confirm-benefit"]').count(), 0);
  await page.locator('[data-month="1"]').click();
  assert.match(await page.locator('[data-benefit-wallet]').textContent(), /690,00/);
  assert.deepEqual(await balances(page), { bank: 100000, benefit: 75000 });
  await page.locator('[data-month="-1"]').click();
  await page.locator('#toast-root .toast').waitFor({ state: 'hidden' });
  await mkdir(out, { recursive: true });
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.screenshot({ path: path.join(out, `carteira-${width}.png`), fullPage: true, animations: 'disabled' });
    await page.locator('.benefit-wallets').screenshot({ path: path.join(out, `carteira-card-${width}.png`), animations: 'disabled' });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await action(page, 'new-finance'); await page.locator('#overlay-root [data-action="new-income"]').click();
  assert.equal(await page.locator('[data-form="income-create"] option').filter({ hasText: 'Alimentação' }).count(), 0);
  await page.locator('#overlay-root [data-action="close-overlay"]').first().click();
  await page.locator('#mobile-nav [data-nav="inicio"]').click();
  assert.match(await page.locator('.money-card').textContent(), /1\.000,00/);
  assert.match(await page.locator('.benefit-card').textContent(), /750,00/);
  await page.locator('#view [data-nav="mercado"]').click();
  await action(page, 'new-market'); await fill(page, 'market-create', { name: 'Lista sintética' });
  await fill(page, 'market-add', { name: 'Produto sintético' }, false);
  await page.locator('[data-form="market-add"] [type="submit"]').click(); await page.locator('[data-market-toggle]').waitFor();
  await action(page, 'close-market');
  await fill(page, 'market-close', { total: '350,00', date: '2026-10-30', accountId: benefit.id });
  assert.deepEqual(await balances(page), { bank: 100000, benefit: 40000 });
  await action(page, 'reuse-market');
  await action(page, 'close-market');
  const mixed = await fill(page, 'market-close', { total: '450,01', date: '2026-10-30', accountId: benefit.id }, false);
  const beforeRejected = await snapshot(page);
  assert.match(await mixed.locator('[data-balance-result]').textContent(), /insuficiente/);
  await mixed.locator('[type="submit"]').click();
  await page.getByText('Saldo alimentação insuficiente. Divida o pagamento ou confira o saldo e os recebimentos.', { exact: true }).waitFor();
  assert.equal(await snapshot(page), beforeRejected);
  await mixed.locator('[name="accountId"]').selectOption('split');
  await fill(page, 'market-close', { benefitAmount: '400,00', benefitAccountId: benefit.id, bankAccountId: bank.id }, false);
  assert.match(await mixed.locator('[data-split-remainder]').textContent(), /400,00.*50,01.*450,01/);
  assert.match(await mixed.locator('[data-balance-result="benefitBalanceEffect"]').textContent(), /400,00.*0,00/);
  assert.match(await mixed.locator('[data-balance-result="bankBalanceEffect"]').textContent(), /1\.000,00.*949,99/);
  const beforeMixed = await snapshot(page);
  await page.locator('#toast-root .toast').waitFor({ state: 'hidden' });
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.screenshot({ path: path.join(out, `pagamento-misto-${width}.png`), fullPage: false, animations: 'disabled' });
    await mixed.locator('[data-balance-review]').screenshot({ path: path.join(out, `pagamento-misto-resumo-${width}.png`), animations: 'disabled' });
  }
  assert.equal(await snapshot(page), beforeMixed);
  await page.setViewportSize({ width: 390, height: 844 });
  await mixed.locator('[type="submit"]').click(); await mixed.waitFor({ state: 'detached' });
  assert.deepEqual(await balances(page), { bank: 94999, benefit: 0 });
  const saved = await local(page);
  assert.equal(saved.state.incomes.length, 1); assert.equal(saved.state.purchases.length, 2); assert.equal(saved.state.payments.length, 3);
  const backup = await page.evaluate(async () => (await import('./storage.js')).exportBackup((await (await import('./storage.js')).loadLocal()).state));
  assert.deepEqual(JSON.parse(backup).state, saved.state);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const beforeOffline = await snapshot(page);
  await context.setOffline(true); await page.reload(); await page.locator('h1').waitFor();
  assert.equal(await snapshot(page), beforeOffline); assert.deepEqual(await balances(page), { bank: 94999, benefit: 0 });
  await page.locator('#mobile-nav [data-nav="financas"]').click();
  assert.equal(await page.locator('[data-action="confirm-benefit"]').count(), 0);
  assert.deepEqual(errors, []);
  await writeFile(path.join(out, 'qa-alimentacao.json'), JSON.stringify({ syntheticOnly: true, previewDoesNotWrite: true, editableActualCredit: true, noAutomaticCredit: true, singleCreditPerCompetence: true, separateHomeAndFinanceBalances: true, groceryOnlyBenefit: true, mixedExactCents: true, insufficientAtomic: true, backupsPreserved: true, offlineIdenticalStateQueueGeneration: true, viewports: [390,1280], finalBalances: await balances(page), pageErrors: errors }, null, 2) + '\n');
}));

test('continuidade alimentação: fila v2 em voo intacta, ACKs 2/3, recuperação em contexto limpo e backup antigo', { timeout: 120000 }, async () => withApp(async ({ page, context, url }) => {
  await page.goto(url); await page.locator('h1').waitFor();
  const v1 = JSON.parse(await readFile(new URL('./fixtures/balance-v1.json', import.meta.url))).state;
  const v2 = migrateState(v1); v2.schemaVersion = 2; v2.accounts.forEach(a => delete a.kind);
  const seeded = await page.evaluate(async state => {
    const entry = { key: crypto.randomUUID(), sequence: 1, state, kind: 'command', baseRevision: 0 };
    await new Promise((resolve, reject) => {
      const open = indexedDB.open('casa-serena', 2);
      open.onsuccess = () => {
        const db = open.result, tx = db.transaction(['snapshots','outbox'], 'readwrite');
        tx.objectStore('snapshots').put({ key: 'current', state, generation: crypto.randomUUID() });
        tx.objectStore('snapshots').put({ key: 'sync', value: { ownerId: 'synthetic-owner', remoteRevision: 0, lastSyncedAt: null, conflict: null } });
        tx.objectStore('outbox').put(entry); tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error);
      };
    }); return entry;
  }, v2);
  await page.reload(); await page.locator('h1').waitFor();
  await page.locator('#mobile-nav [data-nav="financas"]').click(); await action(page, 'new-benefit');
  await fill(page, 'account-create', { name: 'Carteira sintética', openingBalance: '20,00', openingDate: '2026-10-01' });
  const upgraded = await local(page); assert.equal(upgraded.state.schemaVersion, 3); assert.deepEqual(upgraded.queue[0], seeded);
  assert.equal(upgraded.queue[1].state.accounts.at(-1).kind, 'benefit');
  await page.evaluate(async () => {
    const storage = await import('./storage.js'), old = (await storage.loadLocal()).queue[0];
    await storage.acknowledge('synthetic-owner', old, { operationId: old.key, revision: 1, state: old.state, updatedAt: '2026-10-15T15:00:00Z' });
  });
  assert.deepEqual((await local(page)).state, upgraded.state);
  const remote = await page.evaluate(async () => {
    const storage = await import('./storage.js'), next = await storage.prepareTransmission('synthetic-owner');
    const receipt = { operationId: next.key, revision: 2, state: next.state, updatedAt: '2026-10-15T15:01:00Z' };
    await storage.acknowledge('synthetic-owner', next, receipt); return receipt;
  });
  assert.equal((await local(page)).queue.length, 0);
  const cleanContext = await context.browser().newContext({ viewport: { width: 390, height: 844 } });
  try {
    await cleanContext.route('https://**', route => route.abort());
    const clean = await cleanContext.newPage(); await clean.goto(url); await clean.locator('h1').waitFor();
    await clean.evaluate(async remote => {
      const s = await import('./storage.js'), current = await s.loadLocal();
      await s.bindOwner('synthetic-owner', remote, current.generation);
    }, remote);
    await clean.reload(); await clean.locator('h1').waitFor();
    assert.deepEqual((await local(clean)).state, upgraded.state);
    assert.equal((await local(clean)).sync.remoteRevision, 2);
    assert.equal((await local(clean)).queue.length, 0);
    await clean.evaluate(async state => { const s = await import('./storage.js'), current = await s.loadLocal(); await s.restoreBackup(s.exportBackup(state), current.state.revision, current.generation); }, v2);
    const restored = await local(clean); assert.equal(restored.state.schemaVersion, 3); assert.equal(restored.sync.remoteRevision, 2);
    assert.deepEqual(restored.state.accounts, v2.accounts.map(a => ({ ...a, kind: 'bank' })));
    assert.equal(restored.queue.length, 1); assert.equal(restored.queue[0].kind, 'restore');
  } finally { await cleanContext.close(); }
  await mkdir(out, { recursive: true });
  await writeFile(path.join(out, 'qa-continuidade.json'), JSON.stringify({ syntheticOnly: true, v2InFlightPayloadUuidBasePreserved: true, oldAckDoesNotReplaceV3: true, ackVersions: [2,3], recoveredSameSnapshotInCleanBrowser: true, legacyBackupRestoreUpgradesWithoutProtocolRegression: true, realSupabaseVerified: false }, null, 2) + '\n');
}));
