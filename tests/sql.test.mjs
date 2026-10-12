import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { createInitialState, applyCommand } from '../app/domain.js';

test('migração PostgreSQL: RLS, recibos, conflito e integridade atômica', async t => {
  const db = new PGlite();
  try {
    const ownerA = '00000000-0000-4000-8000-000000000001', ownerB = '00000000-0000-4000-8000-000000000002';
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to authenticated, anon;
      insert into auth.users values ('${ownerA}'), ('${ownerB}');`);
    await db.exec(await readFile(new URL('../supabase/migrations/202610110001_continuity.sql', import.meta.url), 'utf8'));
    const user = async (id, role = 'authenticated') => {
      await db.exec(`reset role; set role ${role}`);
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
    };
    const commit = async (state, base, operationId = randomUUID()) => (await db.query('select public.casa_commit_snapshot($1::uuid, $2::bigint, $3::jsonb) as receipt', [operationId, base, JSON.stringify(state)])).rows[0].receipt;
    const query = sql => db.query(sql);
    let state = applyCommand(createInitialState(), { type: 'account.create', payload: { name: 'Teste', openingBalanceCents: 500000, openingDate: '2026-10-01' } });
    state = applyCommand(state, { type: 'expense.record', payload: { description: 'Caso de teste', date: '2026-10-11', amountCents: 270000 }, idempotencyKey: 'expense-test' });
    await t.test('sem sessão e anon não executam escrita', async () => {
      await user('', 'authenticated');
      await assert.rejects(commit(state, 0), e => e.code === '42501');
      await user('', 'anon');
      await assert.rejects(commit(state, 0), e => e.code === '42501');
    });
    const op = randomUUID(); let receipt;
    await t.test('mesmo UUID e conteúdo devolvem recibo, sem duplicar revisão', async () => {
      await user(ownerA);
      receipt = await commit(state, 0, op);
      assert.equal(receipt.revision, 1);
      assert.deepEqual(await commit(state, 0, op), receipt);
      assert.equal((await query('select count(*)::int as n from casa_receipts')).rows[0].n, 1);
    });
    await t.test('UUID divergente ou base antiga não sobrescrevem snapshot', async () => {
      const changed = applyCommand(state, { type: 'room.create', payload: { name: 'Outro teste' } });
      await assert.rejects(commit(changed, 0, op), e => e.code === 'CS422');
      await assert.rejects(commit(changed, 0), e => e.code === 'CS409');
      assert.deepEqual((await query('select state from casa_snapshots')).rows[0].state, state);
    });
    await t.test('linhas, pagamentos e transferências corrompidos falham sem recibo', async () => {
      const bad = structuredClone(state); bad.purchases[0].lines[0].amountCents--;
      await assert.rejects(commit(bad, 1), e => e.code === 'CS400');
      const paid = applyCommand(state, { type: 'payment.record', payload: { accountId: state.accounts[0].id, date: '2026-10-11', allocations: [{ obligationId: state.obligations[0].id, amountCents: 90000 }] }, idempotencyKey: 'paid-test' });
      paid.payments[0].amountCents = 280000; paid.payments[0].allocations[0].amountCents = 280000;
      await assert.rejects(commit(paid, 1), e => e.code === 'CS400');
      assert.equal((await query('select count(*)::int as n from casa_receipts')).rows[0].n, 1);
    });
    await t.test('conta B não lê A nem grava diretamente ou escolhe owner', async () => {
      await user(ownerB);
      assert.equal((await query('select * from casa_snapshots')).rows.length, 0);
      assert.equal((await query('select * from casa_receipts')).rows.length, 0);
      await assert.rejects(query('delete from casa_snapshots'), e => e.code === '42501');
      await assert.rejects(query(`update casa_snapshots set owner_id='${ownerB}'`), e => e.code === '42501');
      await commit(createInitialState(), 0);
      const rows = (await query('select owner_id from casa_snapshots')).rows;
      assert.deepEqual(rows.map(r => r.owner_id), [ownerB]);
      await user(ownerA); assert.deepEqual((await query('select state from casa_snapshots')).rows[0].state, state);
    });
    await t.test('restaurar revisão de domínio anterior não regride revisão do protocolo', async () => {
      const restored = await commit(createInitialState(), 1);
      assert.equal(restored.revision, 2); assert.equal(restored.state.revision, 0);
    });
  } finally { await db.close(); }
});
