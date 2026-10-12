// Casa Serena domain model. All amounts are integer BRL cents; commands are pure.
export const SCHEMA_VERSION = 1;

const FINANCIAL_COMMANDS = new Set([
  'purchase.record', 'payment.record', 'market.close', 'expense.record',
  'income.record', 'transfer.record',
]);
const LISTS = [
  'accounts', 'rooms', 'items', 'purchases', 'obligations', 'payments',
  'markets', 'projects', 'tasks', 'incomes', 'transfers', 'audit',
];

export class DomainError extends Error {
  constructor(code, message, field) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.field = field;
  }
}

const fail = (code, message, field) => { throw new DomainError(code, message, field); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const assertObject = (value, field) => {
  if (!object(value)) fail('VALIDATION', `${field} deve ser um objeto.`, field);
  return value;
};
const text = (value, field, max = 120) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    fail('VALIDATION', `${field} deve ter entre 1 e ${max} caracteres.`, field);
  return value.trim();
};
const optionalText = (value, field, max = 120) =>
  value === undefined || value === null || value === '' ? null : text(value, field, max);
const cents = (value, field, allowZero = false, allowNegative = false) => {
  if (!Number.isSafeInteger(value) || (!allowNegative && value < (allowZero ? 0 : 1)))
    fail('VALIDATION', `${field} deve ser informado em centavos inteiros.`, field);
  return value;
};
const date = (value, field) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    fail('VALIDATION', `${field} deve usar AAAA-MM-DD.`, field);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value)
    fail('VALIDATION', `${field} contém data inválida.`, field);
  return value;
};
const optionalDate = (value, field) => value == null || value === '' ? null : date(value, field);
const safeSum = (values, field) => {
  const sum = values.reduce((n, v) => n + v, 0);
  if (!Number.isSafeInteger(sum)) fail('VALIDATION', `${field} excede o limite seguro.`, field);
  return sum;
};
const find = (state, list, id, field = 'id') => {
  if (typeof id !== 'string') fail('VALIDATION', `${field} inválido.`, field);
  const record = state[list].find(entry => entry.id === id);
  if (!record) fail('NOT_FOUND', `${field} não encontrado.`, field);
  return record;
};
const id = (state, prefix) => `${prefix}_${String(state.nextId++).padStart(6, '0')}`;
const copy = value => structuredClone(value);

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (object(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

export function createInitialState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    revision: 0,
    nextId: 1,
    accounts: [], rooms: [], items: [], purchases: [], obligations: [],
    payments: [], markets: [], projects: [], tasks: [], incomes: [], transfers: [],
    audit: [], operations: {},
  };
}

export const createEmptyState = createInitialState;

function installmentPlan(totalCents, purchaseDate, payload) {
  if (payload.installments !== undefined) {
    if (!Array.isArray(payload.installments) || payload.installments.length === 0)
      fail('VALIDATION', 'installments deve conter ao menos uma obrigação.', 'installments');
    const installments = payload.installments.map((entry, index) => {
      assertObject(entry, `installments[${index}]`);
      return {
        amountCents: cents(entry.amountCents, `installments[${index}].amountCents`),
        dueDate: date(entry.dueDate, `installments[${index}].dueDate`),
      };
    });
    if (safeSum(installments.map(entry => entry.amountCents), 'installments') !== totalCents)
      fail('VALIDATION', 'A soma das obrigações deve igualar o total da compra.', 'installments');
    return installments;
  }
  if (payload.dueDates !== undefined) {
    if (!Array.isArray(payload.dueDates) || payload.dueDates.length === 0 || payload.dueDates.length > totalCents)
      fail('VALIDATION', 'dueDates deve conter uma data por parcela com valor positivo.', 'dueDates');
    const dates = payload.dueDates.map((value, index) => date(value, `dueDates[${index}]`));
    const base = Math.floor(totalCents / dates.length);
    const remainder = totalCents % dates.length;
    return dates.map((dueDate, index) => ({
      dueDate, amountCents: base + (index < remainder ? 1 : 0),
    }));
  }
  return [{ amountCents: totalCents, dueDate: purchaseDate }];
}

function recordPurchase(state, payload, source, sourceId = null) {
  const purchaseDate = date(payload.date, 'date');
  const totalCents = cents(payload.totalCents, 'totalCents');
  if (!Array.isArray(payload.lines) || payload.lines.length === 0)
    fail('VALIDATION', 'A compra precisa de ao menos uma linha.', 'lines');
  const lines = payload.lines.map((line, index) => {
    assertObject(line, `lines[${index}]`);
    const itemId = line.itemId == null ? null : find(state, 'items', line.itemId, `lines[${index}].itemId`).id;
    return {
      id: id(state, 'line'),
      itemId,
      description: optionalText(line.description, `lines[${index}].description`, 160) ??
        (itemId ? find(state, 'items', itemId).name : fail('VALIDATION', 'Linha sem descrição ou item.', `lines[${index}]`)),
      amountCents: cents(line.amountCents, `lines[${index}].amountCents`),
    };
  });
  if (safeSum(lines.map(line => line.amountCents), 'lines') !== totalCents)
    fail('VALIDATION', 'A soma das linhas deve igualar o total da compra.', 'lines');
  const installments = installmentPlan(totalCents, purchaseDate, payload);
  const purchaseId = id(state, 'buy');
  const obligationIds = installments.map((entry, index) => {
    const obligationId = id(state, 'due');
    state.obligations.push({
      id: obligationId, purchaseId, amountCents: entry.amountCents,
      dueDate: entry.dueDate, sequence: index + 1,
    });
    return obligationId;
  });
  state.purchases.push({
    id: purchaseId, date: purchaseDate, totalCents, source, sourceId,
    description: optionalText(payload.description, 'description', 160),
    lines, obligationIds,
  });
  return { purchaseId, obligationIds };
}

function paidOnObligation(state, obligationId) {
  return safeSum(state.payments.flatMap(payment => payment.allocations)
    .filter(allocation => allocation.obligationId === obligationId)
    .map(allocation => allocation.amountCents), 'payments');
}

function recordPayment(state, payload) {
  const paymentDate = date(payload.date, 'date');
  const account = find(state, 'accounts', payload.accountId, 'accountId');
  if (paymentDate < account.openingDate)
    fail('VALIDATION', 'Pagamento anterior ao saldo inicial da conta.', 'date');
  if (!Array.isArray(payload.allocations) || payload.allocations.length === 0)
    fail('VALIDATION', 'Pagamento precisa de alocação.', 'allocations');
  const seen = new Set();
  const allocations = payload.allocations.map((allocation, index) => {
    assertObject(allocation, `allocations[${index}]`);
    const obligation = find(state, 'obligations', allocation.obligationId, `allocations[${index}].obligationId`);
    if (seen.has(obligation.id)) fail('VALIDATION', 'Obrigação repetida no mesmo pagamento.', 'allocations');
    seen.add(obligation.id);
    const amountCents = cents(allocation.amountCents, `allocations[${index}].amountCents`);
    if (amountCents > obligation.amountCents - paidOnObligation(state, obligation.id))
      fail('VALIDATION', 'Pagamento excede o saldo aberto da obrigação.', 'allocations');
    return { obligationId: obligation.id, amountCents };
  });
  const amountCents = safeSum(allocations.map(entry => entry.amountCents), 'allocations');
  const paymentId = id(state, 'pay');
  state.payments.push({
    id: paymentId, date: paymentDate, accountId: account.id, amountCents,
    allocations, description: optionalText(payload.description, 'description', 160),
  });
  return paymentId;
}

function selectedMarket(state, marketId, requireOpen = false) {
  const market = find(state, 'markets', marketId, 'marketId');
  if (requireOpen && market.status !== 'open') fail('STATE', 'Esta lista do Mercado já foi fechada.', 'marketId');
  return market;
}

function run(state, type, payload) {
  switch (type) {
    case 'account.create': {
      const account = {
        id: id(state, 'account'), name: text(payload.name, 'name', 80),
        openingBalanceCents: cents(payload.openingBalanceCents, 'openingBalanceCents', true, true),
        openingDate: date(payload.openingDate, 'openingDate'),
      };
      state.accounts.push(account);
      return { accountId: account.id };
    }
    case 'room.create': {
      const room = { id: id(state, 'room'), name: text(payload.name, 'name', 80) };
      state.rooms.push(room);
      return { roomId: room.id };
    }
    case 'item.create': {
      const item = {
        id: id(state, 'item'), name: text(payload.name, 'name', 120),
        roomId: payload.roomId == null ? null : find(state, 'rooms', payload.roomId, 'roomId').id,
        projectId: payload.projectId == null ? null : find(state, 'projects', payload.projectId, 'projectId').id,
        estimateCents: payload.estimateCents == null ? null : cents(payload.estimateCents, 'estimateCents', true),
        received: false, installed: false,
      };
      state.items.push(item);
      return { itemId: item.id };
    }
    case 'item.update': {
      const item = find(state, 'items', payload.itemId, 'itemId');
      const changes = assertObject(payload.changes, 'changes');
      const allowed = new Set(['name', 'roomId', 'projectId', 'estimateCents', 'received', 'installed']);
      if (!Object.keys(changes).length || Object.keys(changes).some(key => !allowed.has(key)))
        fail('VALIDATION', 'Alterações inválidas para o item.', 'changes');
      if ('name' in changes) item.name = text(changes.name, 'name', 120);
      if ('roomId' in changes) item.roomId = changes.roomId == null ? null : find(state, 'rooms', changes.roomId, 'roomId').id;
      if ('projectId' in changes) item.projectId = changes.projectId == null ? null : find(state, 'projects', changes.projectId, 'projectId').id;
      if ('estimateCents' in changes) item.estimateCents = changes.estimateCents == null ? null : cents(changes.estimateCents, 'estimateCents', true);
      if ('received' in changes) {
        if (typeof changes.received !== 'boolean') fail('VALIDATION', 'received deve ser booleano.', 'received');
        item.received = changes.received;
        if (!item.received) item.installed = false;
      }
      if ('installed' in changes) {
        if (typeof changes.installed !== 'boolean' || (changes.installed && !item.received))
          fail('VALIDATION', 'Instalação exige item recebido.', 'installed');
        item.installed = changes.installed;
      }
      return { itemId: item.id };
    }
    case 'purchase.record': return recordPurchase(state, payload, 'purchase');
    case 'payment.record': return { paymentId: recordPayment(state, payload) };
    case 'market.create': {
      const market = {
        id: id(state, 'market'), name: optionalText(payload.name, 'name', 100) ?? 'Lista de Mercado',
        status: 'open', entries: [], purchaseId: null, copiedFromId: null,
      };
      state.markets.push(market);
      return { marketId: market.id };
    }
    case 'market.addItem': {
      const market = selectedMarket(state, payload.marketId, true);
      const entry = {
        id: id(state, 'marketItem'), name: text(payload.name, 'name', 100),
        quantity: payload.quantity == null ? 1 : cents(payload.quantity, 'quantity'),
        estimateCents: payload.estimateCents == null ? null : cents(payload.estimateCents, 'estimateCents', true),
        inCart: false,
      };
      market.entries.push(entry);
      return { marketId: market.id, entryId: entry.id };
    }
    case 'market.toggle': {
      const market = selectedMarket(state, payload.marketId, true);
      const entry = market.entries.find(value => value.id === payload.entryId);
      if (!entry) fail('NOT_FOUND', 'Produto não encontrado nesta lista.', 'entryId');
      if (typeof payload.inCart !== 'boolean') fail('VALIDATION', 'inCart deve ser booleano.', 'inCart');
      entry.inCart = payload.inCart;
      return { marketId: market.id, entryId: entry.id };
    }
    case 'market.close': {
      const market = selectedMarket(state, payload.marketId, true);
      if (!market.entries.length) fail('STATE', 'Lista vazia não pode ser fechada.', 'marketId');
      const totalCents = cents(payload.totalCents, 'totalCents');
      const outcome = recordPurchase(state, {
        date: payload.date, totalCents, description: `Mercado · ${market.name}`,
        lines: [{ description: `Mercado · ${market.name}`, amountCents: totalCents }],
      }, 'market', market.id);
      market.status = 'closed';
      market.purchaseId = outcome.purchaseId;
      let paymentId = null;
      if (payload.accountId != null) {
        paymentId = recordPayment(state, {
          date: payload.date, accountId: payload.accountId,
          allocations: [{ obligationId: outcome.obligationIds[0], amountCents: totalCents }],
          description: `Mercado · ${market.name}`,
        });
      }
      return { marketId: market.id, ...outcome, paymentId };
    }
    case 'market.reuse': {
      const previous = selectedMarket(state, payload.marketId);
      if (previous.status !== 'closed') fail('STATE', 'Só uma lista concluída pode ser reutilizada.', 'marketId');
      const market = {
        id: id(state, 'market'), name: previous.name, status: 'open',
        entries: previous.entries.map(entry => ({ ...entry, id: id(state, 'marketItem'), inCart: false })),
        purchaseId: null, copiedFromId: previous.id,
      };
      state.markets.push(market);
      return { marketId: market.id };
    }
    case 'project.create': {
      const project = {
        id: id(state, 'project'), name: text(payload.name, 'name', 120),
        outcome: optionalText(payload.outcome, 'outcome', 240),
        estimateCents: payload.estimateCents == null ? null : cents(payload.estimateCents, 'estimateCents', true),
      };
      state.projects.push(project);
      return { projectId: project.id };
    }
    case 'task.create': {
      const task = {
        id: id(state, 'task'), title: text(payload.title, 'title', 160),
        projectId: payload.projectId == null ? null : find(state, 'projects', payload.projectId, 'projectId').id,
        done: false,
      };
      state.tasks.push(task);
      return { taskId: task.id };
    }
    case 'task.toggle': {
      const task = find(state, 'tasks', payload.taskId, 'taskId');
      if (typeof payload.done !== 'boolean') fail('VALIDATION', 'done deve ser booleano.', 'done');
      task.done = payload.done;
      return { taskId: task.id };
    }
    case 'expense.record': {
      const amountCents = cents(payload.amountCents, 'amountCents');
      const description = text(payload.description, 'description', 160);
      const outcome = recordPurchase(state, {
        date: payload.date, totalCents: amountCents, description,
        lines: [{ description, amountCents }],
      }, 'expense');
      const paymentId = payload.accountId == null ? null : recordPayment(state, {
        date: payload.date, accountId: payload.accountId,
        allocations: [{ obligationId: outcome.obligationIds[0], amountCents }],
        description,
      });
      return { ...outcome, paymentId };
    }
    case 'income.record': {
      const account = find(state, 'accounts', payload.accountId, 'accountId');
      const incomeDate = date(payload.date, 'date');
      if (incomeDate < account.openingDate)
        fail('VALIDATION', 'Receita anterior ao saldo inicial da conta.', 'date');
      const income = {
        id: id(state, 'income'), date: incomeDate,
        description: text(payload.description, 'description', 160),
        amountCents: cents(payload.amountCents, 'amountCents'),
        accountId: account.id,
      };
      state.incomes.push(income);
      return { incomeId: income.id };
    }
    case 'transfer.record': {
      const from = find(state, 'accounts', payload.fromAccountId, 'fromAccountId');
      const to = find(state, 'accounts', payload.toAccountId, 'toAccountId');
      if (from.id === to.id) fail('VALIDATION', 'Transferência exige contas diferentes.', 'toAccountId');
      const transferDate = date(payload.date, 'date');
      if (transferDate < from.openingDate || transferDate < to.openingDate)
        fail('VALIDATION', 'Transferência anterior ao saldo inicial de uma das contas.', 'date');
      const transfer = {
        id: id(state, 'transfer'), date: transferDate,
        fromAccountId: from.id, toAccountId: to.id,
        amountCents: cents(payload.amountCents, 'amountCents'),
      };
      state.transfers.push(transfer);
      return { transferId: transfer.id };
    }
    default: fail('UNKNOWN_COMMAND', `Comando não suportado: ${type}.`, 'type');
  }
}

export function applyCommand(state, command) {
  validateState(state);
  assertObject(command, 'command');
  const type = text(command.type, 'type', 80);
  const payload = assertObject(command.payload ?? {}, 'payload');
  const key = command.idempotencyKey == null ? null : text(command.idempotencyKey, 'idempotencyKey', 160);
  if (key && (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(key) || ['__proto__', 'constructor', 'prototype'].includes(key)))
    fail('VALIDATION', 'idempotencyKey contém caracteres inválidos.', 'idempotencyKey');
  if (FINANCIAL_COMMANDS.has(type) && !key)
    fail('IDEMPOTENCY_REQUIRED', 'Comando financeiro exige idempotencyKey estável no reenvio.', 'idempotencyKey');
  const signature = canonical({ type, payload });
  if (key && Object.hasOwn(state.operations, key)) {
    if (state.operations[key].signature !== signature)
      fail('IDEMPOTENCY_CONFLICT', 'Esta chave já foi usada com dados diferentes.', 'idempotencyKey');
    return state;
  }
  const next = copy(state);
  const result = run(next, type, payload);
  next.revision += 1;
  const auditId = id(next, 'event');
  next.audit.push({
    id: auditId, revision: next.revision, type, recordIds: result,
    idempotencyKey: key, actor: 'owner', origin: 'ui',
    occurredAt: command.occurredAt ?? null,
  });
  if (key) next.operations[key] = { signature, revision: next.revision, result };
  validateState(next);
  return next;
}

export function getAccountBalance(state, accountId) {
  const account = find(state, 'accounts', accountId, 'accountId');
  const income = safeSum(state.incomes.filter(value => value.accountId === accountId).map(value => value.amountCents), 'income');
  const outgoing = safeSum(state.payments.filter(value => value.accountId === accountId).map(value => value.amountCents), 'payments');
  const incomingTransfers = safeSum(state.transfers.filter(value => value.toAccountId === accountId).map(value => value.amountCents), 'transfers');
  const outgoingTransfers = safeSum(state.transfers.filter(value => value.fromAccountId === accountId).map(value => value.amountCents), 'transfers');
  return safeSum([account.openingBalanceCents, income, incomingTransfers, -outgoing, -outgoingTransfers], 'balance');
}

export function getObligationBalance(state, obligationId) {
  const obligation = find(state, 'obligations', obligationId, 'obligationId');
  const paidCents = paidOnObligation(state, obligationId);
  return { amountCents: obligation.amountCents, paidCents, openCents: obligation.amountCents - paidCents };
}

export function getSummary(state) {
  validateState(state);
  const acquiredCents = safeSum(state.purchases.map(value => value.totalCents), 'purchases');
  const paidCents = safeSum(state.payments.map(value => value.amountCents), 'payments');
  const incomeCents = safeSum(state.incomes.map(value => value.amountCents), 'incomes');
  const balances = state.accounts.map(account => ({ ...account, balanceCents: getAccountBalance(state, account.id) }));
  const unboughtItems = state.items.filter(item => !state.purchases.some(purchase => purchase.lines.some(line => line.itemId === item.id)));
  const plannedCents = safeSum(unboughtItems.filter(item => item.estimateCents !== null).map(item => item.estimateCents), 'items.estimateCents');
  return {
    acquiredCents, paidCents, openCents: acquiredCents - paidCents,
    incomeCents, balanceCents: balances.length ? safeSum(balances.map(account => account.balanceCents), 'balances') : null,
    plannedCents, plannedHasUnknown: unboughtItems.some(item => item.estimateCents === null),
    accounts: balances,
    activeMarkets: state.markets.filter(market => market.status === 'open').length,
    openTasks: state.tasks.filter(task => !task.done).length,
  };
}

export function getPeriodSummary(state, period) {
  validateState(state);
  if (typeof period !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period))
    fail('VALIDATION', 'Período deve usar AAAA-MM.', 'period');
  const inPeriod = value => value.slice(0, 7) === period;
  const due = state.obligations.filter(obligation => inPeriod(obligation.dueDate));
  return {
    period,
    acquiredCents: safeSum(state.purchases.filter(purchase => inPeriod(purchase.date)).map(purchase => purchase.totalCents), 'purchases'),
    paidCents: safeSum(state.payments.filter(payment => inPeriod(payment.date)).map(payment => payment.amountCents), 'payments'),
    dueCents: safeSum(due.map(obligation => obligation.amountCents), 'obligations'),
    openDueCents: safeSum(due.map(obligation => getObligationBalance(state, obligation.id).openCents), 'obligations'),
    incomeCents: safeSum(state.incomes.filter(income => inPeriod(income.date)).map(income => income.amountCents), 'incomes'),
  };
}

// Validate imported snapshots as well as command outcomes. Corrupt backups must fail closed.
export function validateState(state) {
  assertObject(state, 'state');
  if (state.schemaVersion !== SCHEMA_VERSION) fail('SCHEMA', 'Versão de dados incompatível.', 'schemaVersion');
  if (!Number.isSafeInteger(state.revision) || state.revision < 0) fail('SCHEMA', 'revision inválida.', 'revision');
  if (!Number.isSafeInteger(state.nextId) || state.nextId < 1) fail('SCHEMA', 'nextId inválido.', 'nextId');
  for (const list of LISTS) if (!Array.isArray(state[list])) fail('SCHEMA', `${list} deve ser uma lista.`, list);
  if (!object(state.operations)) fail('SCHEMA', 'operations inválidas.', 'operations');
  const ids = new Set();
  let maxNumericId = 0;
  const register = (record, label) => {
    assertObject(record, label);
    if (typeof record.id !== 'string' || !/^[A-Za-z]+_[0-9]+$/.test(record.id) || ids.has(record.id))
      fail('SCHEMA', `ID inválido ou repetido em ${label}.`, label);
    ids.add(record.id);
    maxNumericId = Math.max(maxNumericId, Number(record.id.split('_')[1]));
  };
  for (const list of LISTS) {
    for (const record of state[list]) register(record, list);
  }
  for (const market of state.markets) {
    if (!Array.isArray(market.entries)) fail('SCHEMA', 'Entradas do Mercado inválidas.', 'markets');
    for (const entry of market.entries) register(entry, 'market.entries');
  }
  for (const purchase of state.purchases) {
    if (!Array.isArray(purchase.lines)) fail('SCHEMA', 'Linhas da compra inválidas.', 'purchases');
    for (const line of purchase.lines) register(line, 'purchases.lines');
  }
  if (state.nextId <= maxNumericId) fail('SCHEMA', 'nextId pode repetir um ID existente.', 'nextId');
  const has = (list, idValue) => state[list].some(record => record.id === idValue);
  for (const account of state.accounts) {
    text(account.name, 'accounts.name', 80); cents(account.openingBalanceCents, 'accounts.openingBalanceCents', true, true);
    date(account.openingDate, 'accounts.openingDate');
  }
  for (const room of state.rooms) text(room.name, 'rooms.name', 80);
  for (const project of state.projects) {
    text(project.name, 'projects.name', 120);
    if (project.estimateCents != null) cents(project.estimateCents, 'projects.estimateCents', true);
  }
  for (const item of state.items) {
    text(item.name, 'items.name', 120);
    if (item.roomId != null && !has('rooms', item.roomId)) fail('SCHEMA', 'Cômodo ausente.', 'items.roomId');
    if (item.projectId != null && !has('projects', item.projectId)) fail('SCHEMA', 'Projeto ausente.', 'items.projectId');
    if (item.estimateCents != null) cents(item.estimateCents, 'items.estimateCents', true);
    if (typeof item.received !== 'boolean' || typeof item.installed !== 'boolean' || (item.installed && !item.received))
      fail('SCHEMA', 'Estado físico do item inválido.', 'items');
  }
  for (const task of state.tasks) {
    text(task.title, 'tasks.title', 160);
    if (task.projectId != null && !has('projects', task.projectId)) fail('SCHEMA', 'Projeto da tarefa ausente.', 'tasks.projectId');
    if (typeof task.done !== 'boolean') fail('SCHEMA', 'Estado da tarefa inválido.', 'tasks.done');
  }
  for (const purchase of state.purchases) {
    date(purchase.date, 'purchases.date'); cents(purchase.totalCents, 'purchases.totalCents');
    if (!['purchase', 'market', 'expense'].includes(purchase.source))
      fail('SCHEMA', 'Origem da compra inválida.', 'purchases.source');
    if (!purchase.lines.length || safeSum(purchase.lines.map(line => cents(line.amountCents, 'lines.amountCents')), 'lines') !== purchase.totalCents)
      fail('SCHEMA', 'Linhas e total da compra divergem.', 'purchases');
    if (!Array.isArray(purchase.obligationIds) || !purchase.obligationIds.length)
      fail('SCHEMA', 'Compra sem obrigações.', 'purchases.obligationIds');
    for (const line of purchase.lines) {
      text(line.description, 'lines.description', 160);
      if (line.itemId != null && !has('items', line.itemId)) fail('SCHEMA', 'Item da compra ausente.', 'lines.itemId');
    }
    const obligations = state.obligations.filter(obligation => obligation.purchaseId === purchase.id);
    if (obligations.length !== purchase.obligationIds.length ||
        new Set(purchase.obligationIds).size !== obligations.length ||
        purchase.obligationIds.some(obligationId => !obligations.some(obligation => obligation.id === obligationId)) ||
        safeSum(obligations.map(obligation => obligation.amountCents), 'obligations') !== purchase.totalCents)
      fail('SCHEMA', 'Obrigações e total da compra divergem.', 'purchases.obligationIds');
    if (purchase.source === 'market' && !state.markets.some(market => market.id === purchase.sourceId && market.purchaseId === purchase.id))
      fail('SCHEMA', 'Vínculo com Mercado inválido.', 'purchases.sourceId');
  }
  for (const obligation of state.obligations) {
    if (!has('purchases', obligation.purchaseId)) fail('SCHEMA', 'Compra da obrigação ausente.', 'obligations.purchaseId');
    cents(obligation.amountCents, 'obligations.amountCents'); date(obligation.dueDate, 'obligations.dueDate');
    if (!Number.isSafeInteger(obligation.sequence) || obligation.sequence < 1)
      fail('SCHEMA', 'Número da parcela inválido.', 'obligations.sequence');
  }
  for (const payment of state.payments) {
    if (!has('accounts', payment.accountId)) fail('SCHEMA', 'Conta do pagamento ausente.', 'payments.accountId');
    date(payment.date, 'payments.date'); cents(payment.amountCents, 'payments.amountCents');
    if (payment.date < find(state, 'accounts', payment.accountId).openingDate)
      fail('SCHEMA', 'Pagamento anterior ao saldo inicial.', 'payments.date');
    if (!Array.isArray(payment.allocations) || !payment.allocations.length ||
        safeSum(payment.allocations.map(allocation => cents(allocation.amountCents, 'allocations.amountCents')), 'allocations') !== payment.amountCents)
      fail('SCHEMA', 'Alocações e pagamento divergem.', 'payments.allocations');
    const seen = new Set();
    for (const allocation of payment.allocations) {
      if (!has('obligations', allocation.obligationId) || seen.has(allocation.obligationId))
        fail('SCHEMA', 'Alocação inválida.', 'payments.allocations');
      seen.add(allocation.obligationId);
    }
  }
  for (const obligation of state.obligations) {
    if (paidOnObligation(state, obligation.id) > obligation.amountCents)
      fail('SCHEMA', 'Obrigação recebeu pagamento em excesso.', 'payments');
  }
  for (const market of state.markets) {
    text(market.name, 'markets.name', 100);
    if (!['open', 'closed'].includes(market.status)) fail('SCHEMA', 'Estado de lista inválido.', 'markets.status');
    if (market.status === 'closed' && !state.purchases.some(purchase =>
      purchase.id === market.purchaseId && purchase.source === 'market' && purchase.sourceId === market.id))
      fail('SCHEMA', 'Lista concluída sem compra correspondente.', 'markets.purchaseId');
    if (market.status === 'open' && market.purchaseId != null)
      fail('SCHEMA', 'Lista aberta já vinculada a compra.', 'markets.purchaseId');
    if (market.copiedFromId != null && !has('markets', market.copiedFromId))
      fail('SCHEMA', 'Lista de origem ausente.', 'markets.copiedFromId');
    for (const entry of market.entries) {
      text(entry.name, 'markets.entries.name', 100); cents(entry.quantity, 'markets.entries.quantity');
      if (entry.estimateCents != null) cents(entry.estimateCents, 'markets.entries.estimateCents', true);
      if (typeof entry.inCart !== 'boolean') fail('SCHEMA', 'Estado de carrinho inválido.', 'markets.entries.inCart');
    }
  }
  for (const income of state.incomes) {
    if (!has('accounts', income.accountId)) fail('SCHEMA', 'Conta da receita ausente.', 'incomes.accountId');
    date(income.date, 'incomes.date'); text(income.description, 'incomes.description', 160); cents(income.amountCents, 'incomes.amountCents');
    if (income.date < find(state, 'accounts', income.accountId).openingDate)
      fail('SCHEMA', 'Receita anterior ao saldo inicial.', 'incomes.date');
  }
  for (const transfer of state.transfers) {
    if (!has('accounts', transfer.fromAccountId) || !has('accounts', transfer.toAccountId) || transfer.fromAccountId === transfer.toAccountId)
      fail('SCHEMA', 'Contas da transferência inválidas.', 'transfers');
    date(transfer.date, 'transfers.date'); cents(transfer.amountCents, 'transfers.amountCents');
    if (transfer.date < find(state, 'accounts', transfer.fromAccountId).openingDate || transfer.date < find(state, 'accounts', transfer.toAccountId).openingDate)
      fail('SCHEMA', 'Transferência anterior ao saldo inicial.', 'transfers.date');
  }
  for (const [key, operation] of Object.entries(state.operations)) {
    text(key, 'operations.key', 160); assertObject(operation, 'operations.value');
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(key) || ['__proto__', 'constructor', 'prototype'].includes(key))
      fail('SCHEMA', 'Chave de idempotência inválida.', 'operations');
    if (typeof operation.signature !== 'string' || !Number.isSafeInteger(operation.revision) || operation.revision < 1 || operation.revision > state.revision)
      fail('SCHEMA', 'Registro de idempotência inválido.', 'operations');
    if (!state.audit.some(event => event.revision === operation.revision && event.idempotencyKey === key))
      fail('SCHEMA', 'Operação sem evento de auditoria.', 'operations');
  }
  if (state.audit.length !== state.revision) fail('SCHEMA', 'Auditoria e revisão divergem.', 'audit');
  for (let index = 0; index < state.audit.length; index++) {
    const event = state.audit[index];
    if (event.revision !== index + 1 || typeof event.type !== 'string')
      fail('SCHEMA', 'Sequência de auditoria inválida.', 'audit');
  }
  // Reject an otherwise valid collection whose totals would overflow JS cents.
  safeSum(state.purchases.map(record => record.totalCents), 'purchases.total');
  safeSum(state.payments.map(record => record.amountCents), 'payments.total');
  safeSum(state.incomes.map(record => record.amountCents), 'incomes.total');
  safeSum(state.items.filter(record => record.estimateCents != null).map(record => record.estimateCents), 'items.total');
  safeSum(state.accounts.map(account => getAccountBalance(state, account.id)), 'accounts.total');
  return state;
}
