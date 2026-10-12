import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCommand, createInitialState, getAccountBalance, getObligationBalance,
  getPeriodSummary, getSummary, validateState,
} from '../app/domain.js';
import { exportBackup, importBackup, loadState } from '../app/storage.js';

const send = (state, type, payload, idempotencyKey) =>
  applyCommand(state, { type, payload, ...(idempotencyKey ? { idempotencyKey } : {}) });
const result = state => state.audit.at(-1).recordIds;

test('estado inicial não inventa contas, compras ou saldo', () => {
  const state = createInitialState();
  assert.equal(validateState(state), state);
  assert.deepEqual(getSummary(state), {
    acquiredCents: 0, paidCents: 0, openCents: 0, incomeCents: 0,
    balanceCents: null, plannedCents: 0, plannedHasUnknown: false,
    accounts: [], activeMarkets: 0, openTasks: 0,
  });
});

test('item, compra parcelada e pagamentos preservam aquisição, obrigação e caixa separados', () => {
  let state = createInitialState();
  state = send(state, 'account.create', { name: 'Conta principal', openingBalanceCents: 500000, openingDate: '2026-09-01' });
  const accountId = result(state).accountId;
  state = send(state, 'room.create', { name: 'Sala' });
  const roomId = result(state).roomId;
  state = send(state, 'item.create', { name: 'Sofá', roomId, estimateCents: 300000 });
  const itemId = result(state).itemId;
  state = send(state, 'item.create', { name: 'Luminária', roomId });
  assert.equal(getSummary(state).plannedCents, 300000);
  assert.equal(getSummary(state).plannedHasUnknown, true);

  const purchase = {
    date: '2026-09-29', totalCents: 10001,
    lines: [{ itemId, amountCents: 10001 }],
    dueDates: ['2026-10-10', '2026-11-10', '2026-12-10'],
  };
  const before = state;
  state = send(state, 'purchase.record', purchase, 'buy-sofa-1');
  assert.equal(before.purchases.length, 0, 'comando não altera o estado anterior');
  assert.deepEqual(state.obligations.map(value => value.amountCents), [3334, 3334, 3333]);
  assert.equal(state.purchases[0].lines[0].itemId, itemId);
  assert.equal(getSummary(state).acquiredCents, 10001);
  assert.equal(getSummary(state).paidCents, 0);
  assert.equal(getSummary(state).openCents, 10001);
  assert.equal(getSummary(state).plannedCents, 0);

  const afterPurchase = state;
  assert.strictEqual(send(state, 'purchase.record', purchase, 'buy-sofa-1'), afterPurchase, 'reenvio idêntico retorna sem gravar');
  assert.throws(() => send(state, 'purchase.record', { ...purchase, totalCents: 10002 }, 'buy-sofa-1'),
    error => error.code === 'IDEMPOTENCY_CONFLICT');

  const obligationId = state.obligations[0].id;
  const payment = { date: '2026-10-10', accountId, allocations: [{ obligationId, amountCents: 1500 }] };
  state = send(state, 'payment.record', payment, 'pay-sofa-1');
  assert.deepEqual(getObligationBalance(state, obligationId), { amountCents: 3334, paidCents: 1500, openCents: 1834 });
  assert.equal(getAccountBalance(state, accountId), 498500);
  assert.equal(getSummary(state).openCents, 8501);
  assert.deepEqual(getPeriodSummary(state, '2026-10'), {
    period: '2026-10', acquiredCents: 0, paidCents: 1500,
    dueCents: 3334, openDueCents: 1834, incomeCents: 0,
  });
  assert.throws(() => send(state, 'payment.record', { ...payment, allocations: [{ obligationId, amountCents: 1835 }] }, 'pay-sofa-2'),
    error => error.code === 'VALIDATION');
  assert.equal(state.payments.length, 1);
});

test('Mercado fecha uma vez, compra à vista e reutiliza sem alterar o histórico', () => {
  let state = createInitialState();
  state = send(state, 'account.create', { name: 'Conta', openingBalanceCents: 10000, openingDate: '2026-09-01' });
  const accountId = result(state).accountId;
  state = send(state, 'market.create', { name: 'Compras da semana' });
  const marketId = result(state).marketId;
  state = send(state, 'market.addItem', { marketId, name: 'Arroz', estimateCents: 700 });
  const entryId = result(state).entryId;
  state = send(state, 'market.toggle', { marketId, entryId, inCart: true });
  state = send(state, 'market.close', { marketId, date: '2026-09-29', totalCents: 4890, accountId }, 'market-close-1');
  const closed = state.markets[0];
  assert.equal(closed.status, 'closed');
  assert.equal(state.purchases.length, 1);
  assert.equal(state.payments.length, 1);
  assert.equal(getSummary(state).acquiredCents, 4890);
  assert.equal(getSummary(state).paidCents, 4890);
  assert.equal(getSummary(state).balanceCents, 5110);
  const revision = state.revision;
  assert.strictEqual(send(state, 'market.close', { marketId, date: '2026-09-29', totalCents: 4890, accountId }, 'market-close-1'), state);
  assert.equal(state.revision, revision);

  state = send(state, 'market.reuse', { marketId });
  const reused = state.markets[1];
  assert.equal(reused.copiedFromId, marketId);
  assert.notEqual(reused.entries[0].id, entryId);
  assert.equal(reused.entries[0].inCart, false);
  assert.equal(state.markets[0].entries[0].inCart, true);
  assert.equal(state.purchases.length, 1);
  assert.throws(() => send(state, 'market.addItem', { marketId, name: 'Leite' }), error => error.code === 'STATE');
});

test('receita e transferência alteram saldos sem criar despesa', () => {
  let state = createInitialState();
  state = send(state, 'account.create', { name: 'Conta A', openingBalanceCents: 10000, openingDate: '2026-09-01' });
  const fromAccountId = result(state).accountId;
  state = send(state, 'account.create', { name: 'Conta B', openingBalanceCents: 0, openingDate: '2026-09-01' });
  const toAccountId = result(state).accountId;
  state = send(state, 'income.record', { accountId: fromAccountId, date: '2026-09-29', description: 'Reembolso recebido', amountCents: 3000 }, 'income-1');
  state = send(state, 'transfer.record', { fromAccountId, toAccountId, date: '2026-09-29', amountCents: 5000 }, 'transfer-1');
  assert.equal(getAccountBalance(state, fromAccountId), 8000);
  assert.equal(getAccountBalance(state, toAccountId), 5000);
  assert.equal(getSummary(state).balanceCents, 13000);
  assert.equal(getSummary(state).acquiredCents, 0);
  assert.equal(getSummary(state).paidCents, 0);
  assert.throws(() => send(state, 'transfer.record', { fromAccountId, toAccountId: fromAccountId, date: '2026-09-29', amountCents: 1 }, 'transfer-invalid'),
    error => error.code === 'VALIDATION');
});

test('despesa rápida pendente, projeto e tarefa mantêm semânticas independentes', () => {
  let state = createInitialState();
  state = send(state, 'project.create', { name: 'Viagem', estimateCents: 800000 });
  const projectId = result(state).projectId;
  state = send(state, 'task.create', { projectId, title: 'Pesquisar hospedagem' });
  const taskId = result(state).taskId;
  assert.equal(getSummary(state).openCents, 0, 'estimativa de projeto não cria dívida');
  state = send(state, 'task.toggle', { taskId, done: true });
  assert.equal(getSummary(state).openTasks, 0);
  state = send(state, 'expense.record', { date: '2026-09-29', description: 'Táxi', amountCents: 2750 }, 'expense-1');
  assert.equal(state.purchases[0].source, 'expense');
  assert.equal(getSummary(state).acquiredCents, 2750);
  assert.equal(getSummary(state).paidCents, 0);
  assert.equal(getSummary(state).openCents, 2750);
});

test('backup restaura relações e rejeita violação de centavos, referências ou pagamentos', () => {
  let state = createInitialState();
  state = send(state, 'account.create', { name: 'Conta', openingBalanceCents: 0, openingDate: '2026-09-01' });
  const accountId = result(state).accountId;
  state = send(state, 'expense.record', { date: '2026-09-29', description: 'Farmácia', amountCents: 2999, accountId }, 'pharmacy-1');
  const backup = exportBackup(state);
  assert.deepEqual(importBackup(backup), state);
  assert.throws(() => importBackup('not json'), error => error.code === 'BACKUP_INVALID');
  const altered = JSON.parse(backup);
  altered.state.obligations[0].amountCents = 2998;
  assert.throws(() => importBackup(JSON.stringify(altered)), error => error.code === 'SCHEMA');
  const brokenLink = JSON.parse(backup);
  brokenLink.state.payments[0].allocations[0].obligationId = 'due_999999';
  assert.throws(() => importBackup(JSON.stringify(brokenLink)), error => error.code === 'SCHEMA');
  const badMoney = JSON.parse(backup);
  badMoney.state.purchases[0].totalCents = 29.99;
  assert.throws(() => importBackup(JSON.stringify(badMoney)), error => error.code === 'VALIDATION');
});

test('comandos financeiros exigem chave de reenvio e IndexedDB indisponível falha explicitamente no Node', async () => {
  assert.throws(() => send(createInitialState(), 'expense.record', { date: '2026-09-29', description: 'Teste', amountCents: 100 }),
    error => error.code === 'IDEMPOTENCY_REQUIRED');
  await assert.rejects(loadState(), error => error.code === 'STORAGE_UNAVAILABLE');
});

test('valores individuais seguros não permitem total de contas ou aquisições acima do limite', () => {
  const large = Number.MAX_SAFE_INTEGER;
  let state = send(createInitialState(), 'account.create', { name: 'A', openingBalanceCents: large, openingDate: '2026-10-01' });
  assert.throws(() => send(state, 'account.create', { name: 'B', openingBalanceCents: 1, openingDate: '2026-10-01' }), e => e.code === 'VALIDATION');
  state = send(createInitialState(), 'expense.record', { description: 'Limite', date: '2026-10-11', amountCents: large }, 'limit-1');
  assert.throws(() => send(state, 'expense.record', { description: 'Excesso', date: '2026-10-11', amountCents: 1 }, 'limit-2'), e => e.code === 'VALIDATION');
  assert.equal(state.purchases.length, 1);
});
