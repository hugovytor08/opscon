// Creates a self-reverting SQL assurance test. No personal data or credentials.
import { createInitialState, applyCommand } from '../app/domain.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
let state = createInitialState();
const send = (type, payload, key) => { state = applyCommand(state, { type, payload, idempotencyKey: key }); };
send('room.create', { name: 'Sala QA' });
send('item.create', { name: 'Sofá QA', roomId: state.rooms[0].id, estimateCents: 300000 });
send('account.create', { name: 'Conta QA', openingDate: '2026-10-01', openingBalanceCents: 500000 });
send('purchase.record', { date: '2026-10-11', totalCents: 270000, lines: [{ itemId: state.items[0].id, amountCents: 270000 }], dueDates: ['2026-10-11','2026-11-11','2026-12-11'] }, 'qa-sofa');
send('payment.record', { date: '2026-10-11', accountId: state.accounts[0].id, allocations: [{ obligationId: state.obligations[0].id, amountCents: 90000 }] }, 'qa-pay');
const quote = value => `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
const ownerA = randomUUID(), ownerB = randomUUID(), operationId = randomUUID();
const changed = structuredClone(state); changed.items[0].name = 'UUID diferente QA';
const invalid = structuredClone(state); invalid.purchases[0].lines[0].amountCents--;
const sql = `-- Assurance only: all synthetic users/snapshots/receipts roll back.
begin;
insert into auth.users(id) values ('${ownerA}'), ('${ownerB}');
set local role authenticated;
select set_config('request.jwt.claim.sub','${ownerA}',true);
select public.casa_commit_snapshot('${operationId}',0,${quote(state)});
do $$ begin
  if (select count(*) from public.casa_snapshots) <> 1 then raise exception 'Owner cannot see snapshot'; end if;
  if (select remote_revision from public.casa_snapshots) <> 1 then raise exception 'Wrong remote revision'; end if;
  if (select state->>'revision' from public.casa_snapshots) <> '5' then raise exception 'Wrong domain state'; end if;
  if (select (state->'payments'->0->>'amountCents')::bigint from public.casa_snapshots) <> 90000 then raise exception 'Payment mismatch'; end if;
  perform public.casa_commit_snapshot('${operationId}',0,${quote(state)});
  if (select count(*) from public.casa_receipts) <> 1 then raise exception 'Replay duplicated receipt'; end if;
  begin
    perform public.casa_commit_snapshot('${operationId}',0,${quote(changed)});
    raise exception 'Different payload accepted';
  exception when sqlstate 'CS422' then null; end;
  begin
    perform public.casa_commit_snapshot('${randomUUID()}',0,${quote(state)});
    raise exception 'Stale revision accepted';
  exception when sqlstate 'CS409' then null; end;
  begin
    perform public.casa_commit_snapshot('${randomUUID()}',1,${quote(invalid)});
    raise exception 'Invalid cents accepted';
  exception when sqlstate 'CS400' then null; end;
end $$;
select set_config('request.jwt.claim.sub','${ownerB}',true);
do $$ begin
  if (select count(*) from public.casa_snapshots) <> 0 then raise exception 'RLS exposed another owner'; end if;
  if (select count(*) from public.casa_receipts) <> 0 then raise exception 'RLS exposed another receipt'; end if;
end $$;
select public.casa_commit_snapshot('${randomUUID()}',0,${quote(createInitialState())});
select set_config('request.jwt.claim.sub','',true);
do $$ begin
  begin
    perform public.casa_commit_snapshot('${randomUUID()}',0,${quote(state)});
    raise exception 'Unauthenticated commit accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS' as resultado, 'sofa 2700 / pago 900 / aberto 1800; recibo unico; conflito; validacao; RLS; sem sessao' as verificacoes;
rollback;
`;
await mkdir(new URL('../tmp/', import.meta.url), { recursive: true });
await writeFile(new URL('../tmp/supabase-assurance.sql', import.meta.url), sql);
console.log('SQL assurance prepared; all writes roll back.');
