import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyCommand, createInitialState, getAccountBalance, getObligationBalance, getPeriodSummary, migrateState, validateState } from '../app/domain.js';
import { exportBackup, importBackup } from '../app/storage.js';

const legacy = JSON.parse(await readFile(new URL('./fixtures/balance-v1.json', import.meta.url)));
const at = '2026-10-15T15:00:00.000Z';
function setup() {
  let state = createInitialState();
  for (const [name, openingDate] of [['A', '2026-10-01'], ['B', '2026-09-01']]) state = applyCommand(state, { type: 'account.create', payload: { name, openingDate, openingBalanceCents: 100000 } });
  return state;
}
const send = (state, type, payload, key = `test-${state.revision}`) => applyCommand(state, { type, payload, idempotencyKey: key, occurredAt: at });

test('migração v1 conserva IDs, saldos, operações, auditoria e a entrada original imutável', () => {
  const original = JSON.stringify(legacy.state), upgraded = migrateState(legacy.state);
  assert.equal(upgraded.schemaVersion, 3);
  for (const [id, balance] of Object.entries(legacy.balances)) assert.equal(getAccountBalance(upgraded, id), balance);
  assert.deepEqual(upgraded.operations, legacy.state.operations);
  assert.deepEqual(upgraded.audit, legacy.state.audit);
  assert.deepEqual(upgraded.accounts, legacy.state.accounts.map(account => ({ ...account, kind: 'bank' })));
  assert.equal(upgraded.incomes[0].recordedAt, null);
  assert.equal(upgraded.payments[0].balanceEffect, 'apply');
  assert.equal(upgraded.transfers[0].fromBalanceEffect, 'apply');
  assert.equal(JSON.stringify(legacy.state), original);
  assert.deepEqual(importBackup(exportBackup(legacy.state)), legacy.state);
  assert.deepEqual(importBackup(exportBackup(upgraded)), upgraded);
  const old = JSON.parse(legacy.state.operations['legacy-income'].signature);
  assert.equal(applyCommand(legacy.state, { ...old, idempotencyKey: 'legacy-income' }), legacy.state);
});

test('salário anterior ainda não incluído acrescenta saldo, preserva referência e competência', () => {
  const before = setup(), accountId = before.accounts[0].id;
  const payload = { accountId, date: '2026-09-30', description: 'Receita sintética', amountCents: 50000, balanceEffect: 'apply' };
  const state = send(before, 'income.record', payload, 'salary');
  assert.equal(getAccountBalance(state, accountId), 150000);
  assert.deepEqual(state.accounts, before.accounts);
  assert.equal(state.incomes[0].recordedAt, at);
  assert.equal(state.incomes[0].date, '2026-09-30');
  assert.equal(getPeriodSummary(state, '2026-09').incomeCents, 50000);
  assert.equal(getPeriodSummary(state, '2026-10').incomeCents, 0);
  assert.equal(send(state, 'income.record', payload, 'salary'), state);
});

test('receita já incluída entra no histórico sem alterar saldo e requer escolha para data anterior', () => {
  const before = setup(), accountId = before.accounts[0].id;
  const payload = { accountId, date: '2026-09-30', description: 'Receita sintética', amountCents: 50000 };
  assert.throws(() => send(before, 'income.record', payload), error => error.field === 'balanceEffect');
  const state = send(before, 'income.record', { ...payload, balanceEffect: 'included' });
  assert.equal(getAccountBalance(state, accountId), 100000);
  assert.equal(getPeriodSummary(state, '2026-09').incomeCents, 50000);
});

test('gasto antigo incluído quita obrigação sem debitar saldo novamente; pendente não inventa pagamento', () => {
  const before = setup(), accountId = before.accounts[0].id;
  const state = send(before, 'expense.record', { accountId, date: '2026-09-30', description: 'Gasto sintético', amountCents: 10000, balanceEffect: 'included' });
  assert.equal(getAccountBalance(state, accountId), 100000);
  assert.equal(getObligationBalance(state, state.obligations[0].id).openCents, 0);
  assert.equal(getPeriodSummary(state, '2026-09').paidCents, 10000);
  const pending = send(state, 'expense.record', { date: '2026-08-20', description: 'Pendente sintética', amountCents: 3000 });
  assert.equal(pending.payments.length, 1);
  assert.equal(getObligationBalance(pending, pending.obligations[1].id).openCents, 3000);
  assert.equal(getAccountBalance(pending, accountId), 100000);
});

test('pagamento retroativo parcial/quitação e Mercado usam a mesma regra', () => {
  let state = setup(); const accountId = state.accounts[0].id;
  state = send(state, 'expense.record', { date: '2026-09-20', description: 'Pendente', amountCents: 10000 });
  const obligationId = state.obligations[0].id;
  state = send(state, 'payment.record', { accountId, date: '2026-09-21', balanceEffect: 'included', allocations: [{ obligationId, amountCents: 4000 }] });
  assert.equal(getObligationBalance(state, obligationId).openCents, 6000);
  state = send(state, 'payment.record', { accountId, date: '2026-09-22', balanceEffect: 'apply', allocations: [{ obligationId, amountCents: 6000 }] });
  assert.equal(getObligationBalance(state, obligationId).openCents, 0);
  assert.equal(getAccountBalance(state, accountId), 94000);
  state = send(state, 'market.create', { name: 'Lista sintética' });
  const marketId = state.markets[0].id;
  state = send(state, 'market.addItem', { marketId, name: 'Arroz sintético' });
  state = send(state, 'market.close', { marketId, accountId, date: '2026-09-25', totalCents: 5000, balanceEffect: 'included' });
  assert.equal(getAccountBalance(state, accountId), 94000);
  assert.equal(state.payments[2].balanceEffect, 'included');
});

test('transferência trata cada referência independentemente e não cria receita/despesa', () => {
  const before = setup(), [a, b] = before.accounts;
  const state = send(before, 'transfer.record', { fromAccountId: a.id, toAccountId: b.id, date: '2026-09-30', amountCents: 20000, fromBalanceEffect: 'included', toBalanceEffect: 'apply' });
  assert.equal(getAccountBalance(state, a.id), 100000);
  assert.equal(getAccountBalance(state, b.id), 120000);
  assert.equal(state.incomes.length, 0); assert.equal(state.payments.length, 0);
  assert.throws(() => send(before, 'transfer.record', { fromAccountId: a.id, toAccountId: b.id, date: '2026-09-30', amountCents: 20000, fromBalanceEffect: 'included', toBalanceEffect: 'included' }));
});

test('revisão de classificação conserva movimento e vínculos, corrige saldo e deixa antes/depois auditáveis', () => {
  let state = setup(); const accountId = state.accounts[0].id;
  state = send(state, 'income.record', { accountId, date: '2026-09-30', description: 'Sintética', amountCents: 50000, balanceEffect: 'apply' });
  const original = state.incomes[0];
  const payload = { collection: 'incomes', recordId: original.id, balanceEffect: 'included', reason: 'Já incluído na referência' };
  const corrected = send(state, 'balance-effect.update', payload, 'correct');
  assert.equal(getAccountBalance(corrected, accountId), 100000);
  assert.deepEqual(corrected.incomes[0], { ...original, balanceEffect: 'included' });
  assert.deepEqual(corrected.audit.at(-1).recordIds.before, { balanceEffect: 'apply' });
  assert.deepEqual(corrected.audit.at(-1).recordIds.after, { balanceEffect: 'included' });
  assert.equal(corrected.audit.at(-1).occurredAt, at);
  assert.equal(send(corrected, 'balance-effect.update', payload, 'correct'), corrected);
  assert.throws(() => send(state, 'balance-effect.update', { ...payload, reason: '' }));
});

test('validação recusa campos ausentes, classificação impossível, data falsa e retroativo disfarçado de v1', () => {
  let state = setup();
  state = send(state, 'income.record', { accountId: state.accounts[0].id, date: '2026-10-02', description: 'Sintética', amountCents: 1000 });
  for (const corrupt of [s => { delete s.incomes[0].balanceEffect; }, s => { s.incomes[0].balanceEffect = 'included'; }, s => { delete s.incomes[0].recordedAt; }, s => { s.incomes[0].recordedAt = '2026-02-30T00:00:00.000Z'; }, s => { s.schemaVersion = 1; }]) {
    const bad = structuredClone(state); corrupt(bad); assert.throws(() => validateState(bad));
  }
  assert.throws(() => send(state, 'income.record', { accountId: state.accounts[0].id, date: '2026-02-30', description: 'Sintética', amountCents: 1000, balanceEffect: 'apply' }));
});
