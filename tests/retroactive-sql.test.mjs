import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { applyCommand, validateState } from '../app/domain.js';

const asV2 = state => { const next = structuredClone(state); next.schemaVersion = 2; next.accounts.forEach(a => delete a.kind); return next; };

test('migração retroativa: v1/recibo antigo preservados, v2 validada e downgrade recusado com RLS', async t => {
  const db = new PGlite(), owner = '00000000-0000-4000-8000-000000000001';
  const legacy = JSON.parse(await readFile(new URL('./fixtures/balance-v1.json', import.meta.url))).state;
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to authenticated, anon;
      insert into auth.users values ('${owner}');`);
    await db.exec(await readFile(new URL('../supabase/migrations/202610110001_continuity.sql', import.meta.url), 'utf8'));
    const user = async id => { await db.exec('reset role; set role authenticated'); await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]); };
    const commit = async (state, base, key = randomUUID()) => (await db.query('select public.casa_commit_snapshot($1::uuid,$2::bigint,$3::jsonb) as receipt', [key, base, JSON.stringify(state)])).rows[0].receipt;
    await user(owner);
    const oldKey = randomUUID(), oldReceipt = await commit(legacy, 0, oldKey);
    await db.exec('reset role');
    await db.exec(await readFile(new URL('../supabase/migrations/202610150001_retroactive.sql', import.meta.url), 'utf8'));
    await user(owner);
    await t.test('instalar não altera snapshot/recibo e aceita ACK perdido da operação v1', async () => {
      assert.deepEqual((await db.query('select state from public.casa_snapshots')).rows[0].state, legacy);
      assert.deepEqual(await commit(legacy, 0, oldKey), oldReceipt);
    });
    let state = applyCommand(legacy, { type: 'income.record', payload: { accountId: legacy.accounts[0].id, date: '2026-09-30', description: 'Receita sintética', amountCents: 50000, balanceEffect: 'apply' }, idempotencyKey: 'retro-income', occurredAt: '2026-10-15T12:00:00.000Z' });
    state = applyCommand(state, { type: 'expense.record', payload: { accountId: legacy.accounts[0].id, date: '2026-09-25', description: 'Gasto incluído', amountCents: 10000, balanceEffect: 'included' }, idempotencyKey: 'retro-payment' });
    state = applyCommand(state, { type: 'transfer.record', payload: { fromAccountId: legacy.accounts[0].id, toAccountId: legacy.accounts[1].id, date: '2026-09-26', amountCents: 20000, fromBalanceEffect: 'included', toBalanceEffect: 'apply' }, idempotencyKey: 'retro-transfer' });
    state = asV2(state);
    const key = randomUUID(); let receipt;
    await t.test('v2 retroativa confirma uma vez e conserva recibo antigo após avanço', async () => {
      receipt = await commit(state, 1, key);
      assert.equal(receipt.revision, 2);
      assert.deepEqual(await commit(state, 1, key), receipt);
      assert.deepEqual(await commit(legacy, 0, oldKey), oldReceipt);
      assert.equal((await db.query('select count(*)::int as n from public.casa_receipts')).rows[0].n, 2);
    });
    await t.test('cliente antigo não sobrescreve snapshot v2 mesmo conhecendo revisão atual', async () => {
      await assert.rejects(commit(legacy, 2), error => error.code === 'CS426');
      assert.deepEqual((await db.query('select state from public.casa_snapshots')).rows[0].state, state);
    });
    await t.test('cliente e servidor recusam efeitos ausentes/impossíveis, timestamp falso e downgrade disfarçado', async () => {
      for (const corrupt of [s => { delete s.incomes.at(-1).balanceEffect; }, s => { s.payments.at(-1).balanceEffect = null; }, s => { s.transfers[0].fromBalanceEffect = 'included'; }, s => { s.incomes.at(-1).recordedAt = '2026-02-30T00:00:00.000Z'; }, s => { s.schemaVersion = 1; }]) {
        const bad = structuredClone(state); corrupt(bad);
        assert.throws(() => validateState(bad));
        await assert.rejects(commit(bad, 2), error => error.code === 'CS400');
      }
      assert.equal((await db.query('select count(*)::int as n from public.casa_receipts')).rows[0].n, 2);
    });
    await t.test('reclassificação auditável passa no mesmo validador', async () => {
      const revised = applyCommand(state, { type: 'balance-effect.update', payload: { collection: 'incomes', recordId: state.incomes.at(-1).id, balanceEffect: 'included', reason: 'Correção sintética' }, idempotencyKey: 'revise' });
      assert.equal((await commit(asV2(revised), 2)).revision, 3);
    });
    await t.test('anon/sem sessão não gravam; outra identidade não lê dados ou recibos', async () => {
      await user(''); await assert.rejects(commit(state, 3), error => error.code === '42501');
      await db.exec('reset role; set role anon'); await assert.rejects(commit(state, 3), error => error.code === '42501');
      await user('00000000-0000-4000-8000-000000000002');
      assert.equal((await db.query('select * from public.casa_snapshots')).rows.length, 0);
      assert.equal((await db.query('select * from public.casa_receipts')).rows.length, 0);
    });
  } finally { await db.close(); }
});
