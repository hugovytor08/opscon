import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Keep the installed migration immutable. Carry its full integrity/RLS rules
// forward, changing only versioned balance semantics and the downgrade guard.
const sourceBytes = await readFile(new URL('../supabase/migrations/202610110001_continuity.sql', import.meta.url));
const source = sourceBytes.toString('utf8').replace(/\r\n/g, '\n');
let validator = source.slice(source.indexOf('create function casa_private.validate_snapshot('), source.indexOf('\ncreate function public.casa_commit_snapshot('));
function replace(text, from, to) {
  if (!text.includes(from)) throw new Error(`Migration source changed: ${from.slice(0, 80)}`);
  return text.replace(from, () => to);
}
validator = replace(validator, 'create function casa_private.validate_snapshot', 'create or replace function casa_private.validate_snapshot');
validator = replace(validator, "begin\n  if jsonb_typeof(s)", `begin
  if s->'schemaVersion' = '1'::jsonb then
    foreach collection in array array['purchases','payments','incomes','transfers'] loop
      for r in select value from jsonb_array_elements(s->collection) loop
        if r ?| array['balanceEffect','fromBalanceEffect','toBalanceEffect'] then raise exception 'v2 field in v1 snapshot'; end if;
      end loop;
    end loop;
    perform casa_private.validate_snapshot_v1(s);
    return;
  end if;
  if jsonb_typeof(s)`);
validator = replace(validator, "s->>'schemaVersion' is distinct from '1'", "s->'schemaVersion' is distinct from '2'::jsonb");
validator = replace(validator, " and (a->>'openingDate')::date <= (p->>'date')::date", '');
validator = replace(validator, " and (a->>'openingDate')::date <= (r->>'date')::date", '');
validator = replace(validator, " and (a->>'openingDate')::date <= (r->>'date')::date", '');
const checks = `
  foreach collection in array array['purchases','payments','incomes','transfers'] loop
    for r in select value from jsonb_array_elements(s->collection) loop
      if not (r ? 'recordedAt') or jsonb_typeof(r->'recordedAt') not in ('null','string') then raise exception 'invalid registration time'; end if;
      if r->>'recordedAt' is not null then
        if r->>'recordedAt' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[.][0-9]{3}Z$'
          or r->>'recordedAt' <> to_char((r->>'recordedAt')::timestamptz at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') then raise exception 'invalid registration time'; end if;
      end if;
      if collection in ('payments','incomes') then
        if r->>'balanceEffect' is null or r->>'balanceEffect' not in ('apply','included') then raise exception 'invalid balance effect'; end if;
        if r->>'balanceEffect' = 'included' and not exists
          (select 1 from jsonb_array_elements(s->'accounts') a where a->>'id' = r->>'accountId' and (r->>'date')::date <= (a->>'openingDate')::date) then raise exception 'included after balance reference'; end if;
      end if;
      if collection = 'transfers' then
        if r->>'fromBalanceEffect' is null or r->>'fromBalanceEffect' not in ('apply','included')
          or r->>'toBalanceEffect' is null or r->>'toBalanceEffect' not in ('apply','included') then raise exception 'invalid transfer balance effect'; end if;
        if r->>'fromBalanceEffect' = 'included' and not exists
          (select 1 from jsonb_array_elements(s->'accounts') a where a->>'id' = r->>'fromAccountId' and (r->>'date')::date <= (a->>'openingDate')::date) then raise exception 'included transfer after source balance'; end if;
        if r->>'toBalanceEffect' = 'included' and not exists
          (select 1 from jsonb_array_elements(s->'accounts') a where a->>'id' = r->>'toAccountId' and (r->>'date')::date <= (a->>'openingDate')::date) then raise exception 'included transfer after destination balance'; end if;
      end if;
    end loop;
  end loop;
`;
validator = replace(validator, "  foreach collection in array array['purchases','payments','incomes','items'] loop", checks + "  foreach collection in array array['purchases','payments','incomes','items'] loop");
for (const [alias, field, accountField] of [['i', 'balanceEffect', 'accountId'], ['p', 'balanceEffect', 'accountId'], ['x', 'toBalanceEffect', 'toAccountId'], ['x', 'fromBalanceEffect', 'fromAccountId']]) {
  validator = replace(validator, `${alias}->>'${accountField}' = r->>'id'`, `${alias}->>'${accountField}' = r->>'id' and ${alias}->>'${field}' = 'apply'`);
}
let rpc = source.slice(source.indexOf('create function public.casa_commit_snapshot('), source.lastIndexOf('commit;'));
rpc = replace(rpc, 'create function public.casa_commit_snapshot', 'create or replace function public.casa_commit_snapshot');
rpc = replace(rpc, 'current_revision bigint;', 'current_revision bigint; stored_schema text;');
rpc = replace(rpc, 'select remote_revision into current_revision', "select remote_revision, state->>'schemaVersion' into current_revision, stored_schema");
rpc = replace(rpc, '  next_revision := p_base_revision + 1;', `  if stored_schema = '2' and p_state->>'schemaVersion' <> '2' then
    raise exception using errcode = 'CS426', message = 'Update client before changing version 2 data';
  end if;
  next_revision := p_base_revision + 1;`);
const header = `-- Casa Serena: domain 2, protocol 1. Apply once after 202610110001.
-- Generated by scripts/prepare-retroactive-migration.mjs.
-- Installed migration SHA-256: ${createHash('sha256').update(sourceBytes).digest('hex')}
begin;
alter function casa_private.validate_snapshot(jsonb) rename to validate_snapshot_v1;
`;
await writeFile(new URL('../supabase/migrations/202610150001_retroactive.sql', import.meta.url), header + validator + '\n' + rpc + "insert into casa_private.schema_versions(version, protocol) values ('202610150001', 1);\ncommit;\n");
console.log('Migração aditiva gerada; SQL instalado preservado.');
