import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { applyCommand, migrateState, validateState } from '../app/domain.js';

test('alimentação no PostgreSQL: upgrade preserva recibos 1/2, unicidade, saldo, RLS e bloqueio de downgrade', async t => {
  const db = new PGlite(), owner = '00000000-0000-4000-8000-000000000001';
  const legacy = JSON.parse(await readFile(new URL('./fixtures/balance-v1.json', import.meta.url))).state;
  const send = (state, type, payload) => applyCommand(state, { type, payload, idempotencyKey: `sql-${state.revision}`, occurredAt: '2026-10-15T16:00:00.000Z' });
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to authenticated, anon; insert into auth.users values ('${owner}');`);
    const migrate = async name => { await db.exec('reset role'); await db.exec(await readFile(new URL(`../supabase/migrations/${name}.sql`, import.meta.url), 'utf8')); };
    const user = async id => { await db.exec('reset role; set role authenticated'); await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]); };
    const commit = async (state, base, key = randomUUID()) => (await db.query('select public.casa_commit_snapshot($1::uuid,$2::bigint,$3::jsonb) as receipt', [key, base, JSON.stringify(state)])).rows[0].receipt;
    await migrate('202610110001_continuity'); await user(owner);
    const key1 = randomUUID(), receipt1 = await commit(legacy, 0, key1);
    await migrate('202610150001_retroactive'); await user(owner);
    const v2 = migrateState(legacy); v2.schemaVersion = 2; v2.accounts.forEach(a => delete a.kind);
    const key2 = randomUUID(), receipt2 = await commit(v2, 1, key2);
    await migrate('202610150002_benefit'); await user(owner);
    await t.test('instalação não reescreve snapshot/recibos; ACKs antigos continuam válidos', async () => {
      assert.deepEqual((await db.query('select state from public.casa_snapshots')).rows[0].state, v2);
      assert.deepEqual(await commit(legacy, 0, key1), receipt1); assert.deepEqual(await commit(v2, 1, key2), receipt2);
    });
    let s = send(v2, 'account.create', { name: 'Carteira sintética', kind: 'benefit', openingBalanceCents: 123, openingDate: '2026-10-01' });
    const accountId = s.accounts.at(-1).id;
    s = send(s, 'benefit.confirm', { accountId, benefitPeriod: '2026-10', amountCents: 69000, date: '2026-10-29', description: 'Crédito sintético' });
    s = send(s, 'expense.record', { description: 'Misto sintético', date: '2026-10-30', amountCents: 70000, payments: [{ accountId, amountCents: 35000 }, { accountId: s.accounts[0].id, amountCents: 35000 }] });
    const key3 = randomUUID(); let receipt3;
    await t.test('crédito e duas partes da mesma compra validados; retry e ACKs perdidos não duplicam', async () => {
      receipt3 = await commit(s, 2, key3); assert.equal(receipt3.revision, 3);
      assert.deepEqual(await commit(s, 2, key3), receipt3);
      assert.deepEqual(await commit(legacy, 0, key1), receipt1); assert.deepEqual(await commit(v2, 1, key2), receipt2);
    });
    await t.test('novas escritas antigas não sobrescrevem domínio 3', async () => {
      for (const old of [legacy, v2]) await assert.rejects(commit(old, 3), e => e.code === 'CS426');
    });
    await t.test('servidor e cliente rejeitam carteira, competência, saldo e transferência corrompidos', async () => {
      const corruptions = [
        s => { delete s.accounts.at(-1).kind; }, s => { s.accounts.at(-1).creditDay = 31; }, s => { s.accounts.at(-1).kind = 'bank'; },
        s => { s.incomes.at(-1).benefitPeriod = null; }, s => { s.incomes.at(-1).benefitPeriod = '2026-13'; }, s => { s.incomes.at(-1).benefitPeriod = '0000-01'; },
        s => { s.incomes.at(-1).amountCents = 1; },
        s => { s.transfers[0].fromAccountId = accountId; },
        s => { s.schemaVersion = 2; },
        s => { const income = structuredClone(s.incomes.at(-1)); income.id = `income_${s.nextId++}`; s.incomes.push(income); },
      ];
      for (const mutate of corruptions) { const bad = structuredClone(s); mutate(bad); assert.throws(() => validateState(bad)); await assert.rejects(commit(bad, 3), e => e.code === 'CS400'); }
      assert.deepEqual((await db.query('select state from public.casa_snapshots')).rows[0].state, s);
      assert.equal((await db.query('select count(*)::int as n from public.casa_receipts')).rows[0].n, 3);
    });
    await t.test('sem sessão/anon recusados; outra identidade não lê; validador privado não exposto', async () => {
      await user(''); await assert.rejects(commit(s, 3), e => e.code === '42501');
      await db.exec('reset role; set role anon'); await assert.rejects(commit(s, 3), e => e.code === '42501');
      await user('00000000-0000-4000-8000-000000000002');
      assert.equal((await db.query('select * from public.casa_snapshots')).rows.length, 0);
      assert.equal((await db.query('select * from public.casa_receipts')).rows.length, 0);
      await assert.rejects(db.query('select casa_private.validate_snapshot($1::jsonb)', [JSON.stringify(s)]), e => e.code === '42501');
    });
  } finally { await db.close(); }
});
