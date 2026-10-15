import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withApp } from './browser-harness.mjs';

const out = process.env.CASA_EVIDENCE_DIR ? path.join(process.env.CASA_EVIDENCE_DIR, 'retroativos') : fileURLToPath(new URL('../docs/validacao/evidencias/incremento-0.3.6/', import.meta.url));
const legacy = JSON.parse(await readFile(new URL('./fixtures/balance-v1.json', import.meta.url)));
const local = page => page.evaluate(async () => (await import('./storage.js')).loadLocal());
const snapshot = async page => { const data = await local(page); return JSON.stringify({ state: data.state, queue: data.queue, generation: data.generation }); };
async function fill(page, type, values, save = true) {
  const form = page.locator(`[data-form="${type}"]`);
  for (const [key, value] of Object.entries(values)) {
    const input = form.locator(`[name="${key}"]`);
    if (await input.evaluate(node => node.tagName === 'SELECT')) await input.selectOption(value);
    else await input.fill(value);
  }
  if (save) { await form.locator('[type="submit"]').click(); await form.waitFor({ state: 'detached' }); }
  return form;
}
async function movement(page, action) {
  await page.locator('#view [data-action="new-finance"]').click();
  await page.locator(`#overlay-root [data-action="${action}"]`).click();
}
const balances = page => page.evaluate(async () => {
  const state = (await (await import('./storage.js')).loadLocal()).state;
  const domain = await import('./domain.js');
  return state.accounts.map(account => domain.getAccountBalance(state, account.id));
});

test('retroativos na UI: prévia sem escrita, salário, gasto incluído, transferência, revisão e offline', { timeout: 120000 }, async () => withApp(async ({ page, context, url }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mkdir(out, { recursive: true });
  await page.goto(url); await page.locator('h1').waitFor();
  await page.locator('#mobile-nav [data-nav="financas"]').click();
  for (const [name, openingDate] of [['Conta A sintética', '2026-10-01'], ['Conta B sintética', '2026-09-01']]) {
    await page.locator('#view').getByRole('button', { name: 'Nova conta', exact: true }).click();
    await fill(page, 'account-create', { name, openingBalance: '1000,00', openingDate });
  }
  let saved = await local(page); const [a, b] = saved.state.accounts;
  const before = await snapshot(page);
  await movement(page, 'new-income');
  const form = await fill(page, 'income-create', { description: 'Salário sintético', amount: '500,00', accountId: a.id, date: '2026-09-30' }, false);
  assert.equal(await form.locator('[name="balanceEffect"]').inputValue(), '');
  await form.locator('[name="balanceEffect"]').selectOption('apply');
  await form.locator('[name="amount"]').fill('90071992547409,91');
  assert.match(await form.locator('[data-balance-result]').textContent(), /excede o limite/);
  await form.locator('[name="amount"]').fill('500,00');
  assert.match(await form.locator('[data-balance-result]').textContent(), /1\.000,00.*1\.500,00/);
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.screenshot({ path: path.join(out, `receita-retroativa-${width}.png`), fullPage: false, animations: 'disabled' });
  }
  assert.equal(await snapshot(page), before);
  await page.setViewportSize({ width: 390, height: 844 });
  await form.locator('[type="submit"]').click(); await form.waitFor({ state: 'detached' });
  assert.deepEqual(await balances(page), [150000, 100000]);
  assert.equal(await page.locator('.movement-record').count(), 1);
  const income = (await local(page)).state.incomes[0];
  assert.equal(income.date, '2026-09-30'); assert.ok(income.recordedAt);
  await movement(page, 'new-expense');
  await fill(page, 'expense-create', { description: 'Gasto sintético incluído', amount: '100,00', date: '2026-09-20', accountId: a.id, balanceEffect: 'included' });
  assert.deepEqual(await balances(page), [150000, 100000]);
  await movement(page, 'new-transfer');
  await fill(page, 'transfer-create', { fromAccountId: a.id, toAccountId: a.id, amount: '200,00', date: '2026-09-30' }, false);
  assert.match(await page.locator('[data-balance-review]').textContent(), /contas diferentes/);
  const transfer = await fill(page, 'transfer-create', { fromAccountId: a.id, toAccountId: b.id, amount: '200,00', date: '2026-09-30', fromBalanceEffect: 'included' }, false);
  assert.equal(await transfer.locator('[name="toBalanceEffect"]').inputValue(), 'apply');
  assert.match(await transfer.locator('[data-balance-result="toBalanceEffect"]').textContent(), /1\.000,00.*1\.200,00/);
  await transfer.locator('[type="submit"]').click(); await transfer.waitFor({ state: 'detached' });
  assert.deepEqual(await balances(page), [150000, 120000]);
  await page.locator(`[data-review-effect="${income.id}"]`).click();
  const review = await fill(page, 'effect-review', { reason: 'Revisão sintética do saldo', balanceEffect: 'included' }, false);
  assert.match(await review.locator('[data-balance-result]').textContent(), /1\.500,00.*1\.000,00/);
  await review.locator('[type="submit"]').click(); await review.waitFor({ state: 'detached' });
  saved = await local(page);
  assert.deepEqual(saved.state.incomes[0], { ...income, balanceEffect: 'included' });
  assert.equal(saved.state.audit.at(-1).type, 'balance-effect.update');
  assert.deepEqual(await balances(page), [100000, 120000]);
  await movement(page, 'new-expense');
  await fill(page, 'expense-create', { description: 'Pendente sintética', amount: '75,00', date: '2026-08-31' });
  assert.equal((await local(page)).state.payments.length, 1);
  await page.locator('#view [data-pay]').click();
  await fill(page, 'payment-create', { accountId: a.id, date: '2026-09-05', balanceEffect: 'apply' });
  assert.deepEqual(await balances(page), [92500, 120000]);
  saved = await local(page);
  assert.deepEqual(saved.state.accounts, [a, b]);
  const beforeOffline = await snapshot(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); await page.locator('h1').waitFor();
  await context.setOffline(true); await page.reload(); await page.locator('h1').waitFor();
  assert.equal(await snapshot(page), beforeOffline);
  assert.deepEqual(errors, []);
  await writeFile(path.join(out, 'qa-ui.json'), JSON.stringify({ release: '0.3.6', engine: 'Chromium', syntheticOnly: true, physicalS23: false, previewNoWrite: true, salaryAddsCents: 50000, includedExpenseDebitsCents: 0, transferIndependentReferences: true, correctionAudited: true, finalBalances: [92500, 120000], referenceAccountsUnchanged: true, offlineStateQueueGenerationPreserved: true, errors }, null, 2) + '\n');
}));

test('fila v1 em voo não é reescrita; novo comando no domínio atual, ACK perdido e restauração antiga conservam integridade', { timeout: 120000 }, async () => withApp(async ({ page, url }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url); await page.locator('h1').waitFor();
  const seeded = await page.evaluate(async state => {
    const key = crypto.randomUUID(), generation = crypto.randomUUID();
    const queueEntry = { key, sequence: 1, state, kind: 'command', baseRevision: 0 };
    await new Promise((resolve, reject) => {
      const open = indexedDB.open('casa-serena', 2);
      open.onsuccess = () => {
        const db = open.result, tx = db.transaction(['snapshots', 'outbox'], 'readwrite');
        tx.objectStore('snapshots').put({ key: 'current', state, generation });
        tx.objectStore('snapshots').put({ key: 'sync', value: { ownerId: 'owner-a', remoteRevision: 0, lastSyncedAt: null, conflict: null } });
        tx.objectStore('outbox').put(queueEntry);
        tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error);
      };
    });
    return queueEntry;
  }, legacy.state);
  await page.reload(); await page.locator('h1').waitFor();
  await page.locator('#mobile-nav [data-nav="financas"]').click();
  await movement(page, 'new-income');
  await fill(page, 'income-create', { description: 'Receita sintética após upgrade', amount: '10,00', accountId: legacy.state.accounts[0].id, date: '2026-09-30', balanceEffect: 'apply' });
  const upgraded = await local(page);
  assert.equal(upgraded.state.schemaVersion, 3); assert.equal(upgraded.queue.length, 2);
  assert.deepEqual(upgraded.queue[0], seeded);
  await page.evaluate(async () => {
    const storage = await import('./storage.js'), old = (await storage.loadLocal()).queue[0];
    await storage.acknowledge('owner-a', old, { operationId: old.key, revision: 1, state: old.state, updatedAt: '2026-10-15T12:00:00Z' });
    const next = await storage.prepareTransmission('owner-a');
    await storage.acknowledge('owner-a', next, { operationId: next.key, revision: 2, state: next.state, updatedAt: '2026-10-15T12:01:00Z' });
  });
  const acknowledged = await local(page);
  assert.equal(acknowledged.queue.length, 0); assert.deepEqual(acknowledged.state, upgraded.state);
  await page.evaluate(async legacyState => {
    const storage = await import('./storage.js'), current = await storage.loadLocal();
    await storage.restoreBackup(storage.exportBackup(legacyState), current.state.revision, current.generation);
  }, legacy.state);
  const restored = await local(page);
  assert.equal(restored.state.schemaVersion, 3); assert.equal(restored.sync.remoteRevision, 2);
  assert.equal(restored.queue.length, 1); assert.equal(restored.queue[0].kind, 'restore');
  assert.deepEqual(await balances(page), Object.values(legacy.balances));
  await mkdir(out, { recursive: true });
  await writeFile(path.join(out, 'qa-compatibilidade.json'), JSON.stringify({ syntheticOnly: true, v1PayloadAndUuidAndBaseUnchanged: true, mixedQueueVersions: [1, 3], lostOldAckAccepted: true, currentStatePreservedAfterAck: true, legacyRestoreUpgradedToCurrent: true, protocolRevisionAfterRestore: 2 }, null, 2) + '\n');
}));
