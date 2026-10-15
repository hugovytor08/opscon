import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyCommand, createInitialState, migrateState, getBenefitPlan, getAccountBalance, getSummary, getObligationBalance, getPeriodSummary, validateState } from '../app/domain.js';
import { exportBackup, importBackup } from '../app/storage.js';
const send = (s, type, payload, key = `benefit-${s.revision}`) => applyCommand(s, { type, payload, idempotencyKey: key, occurredAt: '2026-10-15T16:00:00.000Z' });
function setup(opening = 0) {
  let s = createInitialState();
  s = send(s, 'account.create', { name: 'Banco sintético', openingBalanceCents: 100000, openingDate: '2026-10-01' });
  s = send(s, 'account.create', { name: 'Alimentação sintética', kind: 'benefit', openingBalanceCents: opening, openingDate: '2026-10-01' });
  return s;
}
const credit = (s, competence = '2026-10', overrides = {}) => send(s, 'benefit.confirm', { accountId: s.accounts[1].id, benefitPeriod: competence, amountCents: 69000, date: '2026-10-30', description: 'Crédito sintético', ...overrides });
function list(s) { s = send(s, 'market.create', { name: 'Lista sintética' }); return send(s, 'market.addItem', { marketId: s.markets.at(-1).id, name: 'Produto' }); }

test('previsão não grava nem credita; fevereiro 28/29, meses 30/31 e sobras sem reinício', () => {
  const s = setup(12345), before = JSON.stringify(s), accountId = s.accounts[1].id;
  for (const [month, day] of [['2026-02','28'],['2028-02','29'],['2026-04','30'],['2026-10','30']]) {
    const plan = getBenefitPlan(s, accountId, month);
    assert.equal(plan.expectedDate, `${month}-${day}`); assert.equal(plan.expectedCents, 69000); assert.equal(plan.income, null);
  }
  assert.equal(JSON.stringify(s), before); assert.equal(getAccountBalance(s, accountId), 12345);
  assert.equal(s.incomes.length, 0); assert.throws(() => getBenefitPlan(s, accountId, '0000-01'));
});

test('recebimento editável, identidade carteira+competência e retry não duplicam; benefício não vira salário', () => {
  let s = setup(10000); const accountId = s.accounts[1].id;
  s = credit(s, '2026-10', { amountCents: 70000, date: '2026-10-29' });
  assert.equal(getAccountBalance(s, accountId), 80000);
  assert.equal(getBenefitPlan(s, accountId, '2026-10').income.id, s.incomes[0].id);
  const event = s.audit.at(-1), cmd = JSON.parse(s.operations[event.idempotencyKey].signature);
  assert.equal(send(s, cmd.type, cmd.payload, event.idempotencyKey), s);
  assert.throws(() => credit(s), e => e.code === 'ALREADY_CONFIRMED');
  assert.throws(() => send(s, 'income.record', { accountId, date: '2026-10-30', amountCents: 69000, description: 'Duplicação' }));
  assert.throws(() => send(s, 'benefit.confirm', { ...cmd.payload, accountId: s.accounts[0].id }));
  assert.equal(getSummary(s).balanceCents, 100000); assert.equal(getSummary(s).benefitBalanceCents, 80000);
  assert.equal(getSummary(s).incomeCents, 0); assert.equal(getPeriodSummary(s, '2026-10').incomeCents, 0);
  const next = credit(s, '2026-11', { date: '2026-11-28' });
  assert.equal(getAccountBalance(next, accountId), 149000);
  assert.equal(getBenefitPlan(next, accountId, '2026-12').income, null);
  assert.deepEqual(importBackup(exportBackup(next)), next);
});

test('Mercado 350 debita só alimentação, sem duplicar fechamento ou compra', () => {
  let s = list(credit(setup())); const before = s;
  const payload = { marketId: s.markets[0].id, totalCents: 35000, date: '2026-10-30', accountId: s.accounts[1].id };
  s = send(s, 'market.close', payload, 'close');
  assert.equal(getAccountBalance(s, s.accounts[0].id), 100000); assert.equal(getAccountBalance(s, s.accounts[1].id), 34000);
  assert.equal(s.purchases.length, 1); assert.equal(s.payments.length, 1); assert.equal(getObligationBalance(s, s.obligations[0].id).openCents, 0);
  assert.equal(send(s, 'market.close', payload, 'close'), s);
  assert.throws(() => send(s, 'market.close', payload)); assert.equal(before.markets[0].status, 'open');
  const reused = send(s, 'market.reuse', { marketId: s.markets[0].id });
  assert.equal(reused.payments.length, 1); assert.equal(reused.markets[1].purchaseId, null);
});

test('pagamento misto atômico em centavos; partes inválidas e saldo insuficiente não alteram entrada', () => {
  let s = list(credit(setup())); const [bank, benefit] = s.accounts;
  const payload = { marketId: s.markets[0].id, date: '2026-10-30', totalCents: 70001, payments: [{ accountId: benefit.id, amountCents: 69000 }, { accountId: bank.id, amountCents: 1001 }] };
  const original = JSON.stringify(s);
  for (const payments of [[{ accountId: benefit.id, amountCents: 69001 }, { accountId: bank.id, amountCents: 1000 }], [{ accountId: benefit.id, amountCents: 69000 }, { accountId: bank.id, amountCents: 1000 }], [{ accountId: bank.id, amountCents: 69000 }, { accountId: bank.id, amountCents: 1001 }]]) assert.throws(() => send(s, 'market.close', { ...payload, payments }));
  assert.equal(JSON.stringify(s), original);
  s = send(s, 'market.close', payload, 'mixed');
  assert.equal(getAccountBalance(s, benefit.id), 0); assert.equal(getAccountBalance(s, bank.id), 98999);
  assert.equal(s.purchases.length, 1); assert.equal(s.payments.length, 2);
  assert.ok(s.payments.every(p => p.recordedAt === '2026-10-15T16:00:00.000Z'));
  assert.equal(getObligationBalance(s, s.obligations[0].id).openCents, 0);
  assert.throws(() => send(s, 'expense.record', { accountId: benefit.id, amountCents: 1, date: '2026-10-31', description: 'Sem saldo' }), e => e.code === 'INSUFFICIENT_BENEFIT');
});

test('retroativo incluído não debita carteira; correção não pode produzir saldo negativo', () => {
  let s = setup(); const benefit = s.accounts[1];
  s = send(s, 'expense.record', { accountId: benefit.id, amountCents: 35000, date: '2026-09-30', balanceEffect: 'included', description: 'Passado' });
  assert.equal(getAccountBalance(s, benefit.id), 0);
  assert.throws(() => send(s, 'balance-effect.update', { collection: 'payments', recordId: s.payments[0].id, balanceEffect: 'apply', reason: 'Revisão' }), e => e.code === 'INSUFFICIENT_BENEFIT');
  assert.throws(() => send(s, 'transfer.record', { fromAccountId: benefit.id, toAccountId: s.accounts[0].id, amountCents: 1, date: '2026-10-31' }));
});

test('v1 e v2 preservados em leitura/replay; migração mantém contas/IDs e rejeita downgrade disfarçado', async () => {
  const v1 = JSON.parse(await readFile(new URL('./fixtures/balance-v1.json', import.meta.url))).state;
  const v2 = migrateState(v1); v2.schemaVersion = 2; v2.accounts.forEach(a => delete a.kind);
  for (const old of [v1, v2]) {
    const raw = JSON.stringify(old), next = migrateState(old);
    assert.equal(next.schemaVersion, 3); assert.equal(JSON.stringify(old), raw);
    assert.deepEqual(next.accounts, old.accounts.map(a => ({ ...a, kind: 'bank' })));
    for (const list of ['audit','operations','rooms','items','markets']) assert.deepEqual(next[list], old[list]);
    assert.equal(getSummary(next).balanceCents, getSummary(old).balanceCents);
    const command = JSON.parse(old.operations['legacy-income'].signature);
    assert.equal(send(old, command.type, command.payload, 'legacy-income'), old);
  }
  const s = credit(setup());
  for (const mutate of [s => { s.schemaVersion = 2; }, s => { s.accounts[1].kind = 'bank'; }, s => { s.incomes[0].benefitPeriod = null; }, s => { s.incomes[0].benefitPeriod = '2026-13'; }, s => { s.accounts[1].creditDay = 31; }, s => { s.accounts[1].openingBalanceCents = -1; }]) { const bad = structuredClone(s); mutate(bad); assert.throws(() => validateState(bad)); }
});
