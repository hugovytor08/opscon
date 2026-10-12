-- Casa Serena protocol v1. Apply as project administrator, never from the PWA.
begin;
create schema if not exists casa_private;
revoke all on schema casa_private from public, anon, authenticated;
create table casa_private.schema_versions (
  version text primary key,
  applied_at timestamptz not null default clock_timestamp(),
  protocol integer not null
);
insert into casa_private.schema_versions(version, protocol) values ('202610110001', 1);

create table public.casa_snapshots (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  remote_revision bigint not null check (remote_revision between 1 and 9007199254740991),
  state jsonb not null,
  updated_at timestamptz not null default clock_timestamp()
);
create table public.casa_receipts (
  owner_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  base_revision bigint not null,
  remote_revision bigint not null,
  payload_hash bytea not null,
  confirmed_at timestamptz not null,
  primary key (owner_id, operation_id)
);
alter table public.casa_snapshots enable row level security;
alter table public.casa_receipts enable row level security;
create policy own_snapshot on public.casa_snapshots for select to authenticated using ((select auth.uid()) = owner_id);
create policy own_receipt on public.casa_receipts for select to authenticated using ((select auth.uid()) = owner_id);
revoke all on public.casa_snapshots, public.casa_receipts from public, anon, authenticated;
grant select on public.casa_snapshots, public.casa_receipts to authenticated;

create function casa_private.integer_value(v jsonb, minimum_value numeric default 0) returns numeric
language plpgsql immutable set search_path = '' as $$
declare n numeric;
begin
  if jsonb_typeof(v) is distinct from 'number' or v::text !~ '^-?[0-9]+$' then raise exception 'invalid integer'; end if;
  n := v::text::numeric;
  if n < minimum_value or abs(n) > 9007199254740991 then raise exception 'unsafe integer'; end if;
  return n;
end $$;

create function casa_private.valid_text(v jsonb, max_length integer) returns void
language plpgsql immutable set search_path = '' as $$
begin
  if jsonb_typeof(v) is distinct from 'string' or length(btrim(v #>> '{}')) not between 1 and max_length then raise exception 'invalid text'; end if;
end $$;
create function casa_private.valid_date(v jsonb) returns date
language plpgsql immutable set search_path = '' as $$
declare d date;
begin
  if jsonb_typeof(v) is distinct from 'string' or v #>> '{}' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'invalid date'; end if;
  d := (v #>> '{}')::date;
  if to_char(d, 'YYYY-MM-DD') <> v #>> '{}' then raise exception 'invalid date'; end if;
  return d;
end $$;

-- Server validates cross-record money invariants too; RLS alone is not validation.
create function casa_private.validate_snapshot(s jsonb) returns void
language plpgsql set search_path = '' as $$
#variable_conflict use_column
declare collection text; r jsonb; p jsonb; a jsonb; total numeric; paid numeric; ids text[] := '{}'; rid text;
begin
  if jsonb_typeof(s) is distinct from 'object' or s->>'schemaVersion' is distinct from '1'
    or octet_length(s::text) > 2097152 then raise exception 'invalid snapshot version or size'; end if;
  perform casa_private.integer_value(s->'revision');
  perform casa_private.integer_value(s->'nextId', 1);
  if jsonb_typeof(s->'operations') is distinct from 'object' then raise exception 'invalid operations'; end if;
  foreach collection in array array['accounts','rooms','items','purchases','obligations','payments','markets','projects','tasks','incomes','transfers','audit'] loop
    if jsonb_typeof(s->collection) is distinct from 'array' then raise exception 'missing collection'; end if;
    for r in select value from jsonb_array_elements(s->collection) loop
      if jsonb_typeof(r) is distinct from 'object' then raise exception 'invalid record'; end if;
      rid := r->>'id';
      if rid is null or rid !~ '^[A-Za-z]+_[0-9]+$' or rid = any(ids) then raise exception 'invalid id'; end if;
      ids := array_append(ids, rid);
    end loop;
  end loop;
  for r in select value from jsonb_array_elements(s->'accounts') loop
    perform casa_private.valid_text(r->'name', 80);
    perform casa_private.integer_value(r->'openingBalanceCents', -9007199254740991);
    if r->>'openingDate' is null or r->>'openingDate' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'invalid opening date'; end if;
    perform casa_private.valid_date(r->'openingDate');
  end loop;
  for r in select value from jsonb_array_elements(s->'rooms') loop
    perform casa_private.valid_text(r->'name', 80);
  end loop;
  for r in select value from jsonb_array_elements(s->'projects') loop
    perform casa_private.valid_text(r->'name', 120);
    if r->>'estimateCents' is not null then perform casa_private.integer_value(r->'estimateCents'); end if;
  end loop;
  for r in select value from jsonb_array_elements(s->'tasks') loop
    perform casa_private.valid_text(r->'title', 160);
    if jsonb_typeof(r->'done') is distinct from 'boolean' then raise exception 'invalid task state'; end if;
    if r->>'projectId' is not null and not exists (select 1 from jsonb_array_elements(s->'projects') x where x->>'id' = r->>'projectId') then raise exception 'missing task project'; end if;
  end loop;
  for p in select value from jsonb_array_elements(s->'purchases') loop
    total := casa_private.integer_value(p->'totalCents', 1);
    if jsonb_typeof(p->'lines') is distinct from 'array' or jsonb_array_length(p->'lines') = 0
      or jsonb_typeof(p->'obligationIds') is distinct from 'array' then raise exception 'missing purchase lines'; end if;
    if (select coalesce(sum(casa_private.integer_value(value->'amountCents', 1)), 0) from jsonb_array_elements(p->'lines')) <> total then raise exception 'purchase lines mismatch'; end if;
    for r in select value from jsonb_array_elements(p->'lines') loop
      perform casa_private.valid_text(r->'description', 160);
      rid := r->>'id';
      if rid is null or rid !~ '^[A-Za-z]+_[0-9]+$' or rid = any(ids) then raise exception 'invalid line id'; end if;
      ids := array_append(ids, rid);
      if r->>'itemId' is not null and not exists (select 1 from jsonb_array_elements(s->'items') i where i->>'id' = r->>'itemId') then raise exception 'missing item'; end if;
    end loop;
    if (select coalesce(sum(casa_private.integer_value(value->'amountCents', 1)), 0) from jsonb_array_elements(s->'obligations') where value->>'purchaseId' = p->>'id') <> total then raise exception 'obligations mismatch'; end if;
    if (select count(*) from jsonb_array_elements(s->'obligations') where value->>'purchaseId' = p->>'id') <> jsonb_array_length(p->'obligationIds')
      or (select count(distinct value) from jsonb_array_elements(p->'obligationIds')) <> jsonb_array_length(p->'obligationIds') then raise exception 'duplicate obligations'; end if;
    for r in select value from jsonb_array_elements(p->'obligationIds') loop
      if not exists (select 1 from jsonb_array_elements(s->'obligations') o where o->'id' = r and o->>'purchaseId' = p->>'id') then raise exception 'missing obligation'; end if;
    end loop;
    if p->>'source' not in ('purchase','expense','market') or p->>'source' is null then raise exception 'invalid source'; end if;
    if p->>'source' = 'market' and not exists (select 1 from jsonb_array_elements(s->'markets') m where m->>'id' = p->>'sourceId' and m->>'purchaseId' = p->>'id' and m->>'status' = 'closed') then raise exception 'missing market'; end if;
    perform casa_private.valid_date(p->'date');
  end loop;
  for r in select value from jsonb_array_elements(s->'obligations') loop
    total := casa_private.integer_value(r->'amountCents', 1);
    perform casa_private.integer_value(r->'sequence', 1);
    if not exists (select 1 from jsonb_array_elements(s->'purchases') p where p->>'id' = r->>'purchaseId') then raise exception 'missing purchase'; end if;
    perform casa_private.valid_date(r->'dueDate');
    select coalesce(sum(casa_private.integer_value(a->'amountCents', 1)), 0) into paid
      from jsonb_array_elements(s->'payments') p cross join lateral jsonb_array_elements(p->'allocations') a where a->>'obligationId' = r->>'id';
    if paid > total then raise exception 'overpayment'; end if;
  end loop;
  for p in select value from jsonb_array_elements(s->'payments') loop
    perform casa_private.valid_date(p->'date');
    total := casa_private.integer_value(p->'amountCents', 1);
    if jsonb_typeof(p->'allocations') is distinct from 'array' or jsonb_array_length(p->'allocations') = 0 then raise exception 'missing allocation'; end if;
    if (select coalesce(sum(casa_private.integer_value(value->'amountCents', 1)), 0) from jsonb_array_elements(p->'allocations')) <> total then raise exception 'allocation mismatch'; end if;
    if not exists (select 1 from jsonb_array_elements(s->'accounts') a where a->>'id' = p->>'accountId' and (a->>'openingDate')::date <= (p->>'date')::date) then raise exception 'missing account or early payment'; end if;
    if (select count(distinct value->>'obligationId') from jsonb_array_elements(p->'allocations')) <> jsonb_array_length(p->'allocations') then raise exception 'duplicate allocation'; end if;
    for a in select value from jsonb_array_elements(p->'allocations') loop
      if not exists (select 1 from jsonb_array_elements(s->'obligations') o where o->>'id' = a->>'obligationId') then raise exception 'missing allocated obligation'; end if;
    end loop;
  end loop;
  for r in select value from jsonb_array_elements(s->'incomes') loop
    perform casa_private.valid_date(r->'date');
    perform casa_private.valid_text(r->'description', 160);
    perform casa_private.integer_value(r->'amountCents', 1);
    if not exists (select 1 from jsonb_array_elements(s->'accounts') a where a->>'id' = r->>'accountId' and (a->>'openingDate')::date <= (r->>'date')::date) then raise exception 'invalid income account'; end if;
  end loop;
  for r in select value from jsonb_array_elements(s->'transfers') loop
    perform casa_private.valid_date(r->'date');
    perform casa_private.integer_value(r->'amountCents', 1);
    if r->>'fromAccountId' = r->>'toAccountId' or
      (select count(*) from jsonb_array_elements(s->'accounts') a where a->>'id' in (r->>'fromAccountId', r->>'toAccountId') and (a->>'openingDate')::date <= (r->>'date')::date) <> 2 then raise exception 'invalid transfer'; end if;
  end loop;
  for r in select value from jsonb_array_elements(s->'items') loop
    perform casa_private.valid_text(r->'name', 120);
    if jsonb_typeof(r->'received') is distinct from 'boolean' or jsonb_typeof(r->'installed') is distinct from 'boolean'
      or (r->>'installed' = 'true' and r->>'received' <> 'true') then raise exception 'invalid item state'; end if;
    if r->>'roomId' is not null and not exists (select 1 from jsonb_array_elements(s->'rooms') x where x->>'id' = r->>'roomId') then raise exception 'missing room'; end if;
    if r->>'projectId' is not null and not exists (select 1 from jsonb_array_elements(s->'projects') x where x->>'id' = r->>'projectId') then raise exception 'missing project'; end if;
    if r->>'estimateCents' is not null then perform casa_private.integer_value(r->'estimateCents'); end if;
  end loop;
  for r in select value from jsonb_array_elements(s->'markets') loop
    perform casa_private.valid_text(r->'name', 100);
    if r->>'copiedFromId' is not null and not exists (select 1 from jsonb_array_elements(s->'markets') x where x->>'id' = r->>'copiedFromId') then raise exception 'missing copied market'; end if;
    if jsonb_typeof(r->'entries') is distinct from 'array' or r->>'status' is null or r->>'status' not in ('open','closed') then raise exception 'invalid market'; end if;
    if r->>'status' = 'closed' and not exists (select 1 from jsonb_array_elements(s->'purchases') p where p->>'id' = r->>'purchaseId' and p->>'sourceId' = r->>'id' and p->>'source' = 'market') then raise exception 'missing market purchase'; end if;
    if r->>'status' = 'open' and r->>'purchaseId' is not null then raise exception 'open market purchase'; end if;
    for a in select value from jsonb_array_elements(r->'entries') loop
      perform casa_private.valid_text(a->'name', 100);
      if jsonb_typeof(a->'inCart') is distinct from 'boolean' then raise exception 'invalid cart state'; end if;
      rid := a->>'id';
      if rid is null or rid !~ '^[A-Za-z]+_[0-9]+$' or rid = any(ids) then raise exception 'invalid market id'; end if;
      ids := array_append(ids, rid);
      perform casa_private.integer_value(a->'quantity', 1);
      if a->>'estimateCents' is not null then perform casa_private.integer_value(a->'estimateCents'); end if;
    end loop;
  end loop;
  if exists (select 1 from unnest(ids) x where split_part(x, '_', 2)::numeric >= (s->>'nextId')::numeric) then raise exception 'invalid next id'; end if;
  if jsonb_array_length(s->'audit') <> (s->>'revision')::numeric or exists
    (select 1 from jsonb_array_elements(s->'audit') with ordinality e(value, n) where e.value->>'revision' is distinct from n::text) then raise exception 'audit mismatch'; end if;
  for r in select value from jsonb_array_elements(s->'audit') loop
    if jsonb_typeof(r->'type') is distinct from 'string' then raise exception 'invalid event'; end if;
  end loop;
  for collection, r in select key, value from jsonb_each(s->'operations') loop
    if collection !~ '^[A-Za-z0-9][A-Za-z0-9._:-]*$' or length(collection) > 160 or collection in ('__proto__','constructor','prototype')
      or jsonb_typeof(r->'signature') is distinct from 'string' then raise exception 'invalid operation'; end if;
    if casa_private.integer_value(r->'revision', 1) > (s->>'revision')::numeric or not exists
      (select 1 from jsonb_array_elements(s->'audit') e where e->'revision' = r->'revision' and e->>'idempotencyKey' = collection) then raise exception 'operation audit mismatch'; end if;
  end loop;
  foreach collection in array array['purchases','payments','incomes','items'] loop
    select coalesce(sum((value->>case when collection = 'purchases' then 'totalCents' when collection = 'items' then 'estimateCents' else 'amountCents' end)::numeric), 0)
      into total from jsonb_array_elements(s->collection);
    perform casa_private.integer_value(to_jsonb(total));
  end loop;
  total := 0;
  for r in select value from jsonb_array_elements(s->'accounts') loop
    select (r->>'openingBalanceCents')::numeric
      + coalesce((select sum((i->>'amountCents')::numeric) from jsonb_array_elements(s->'incomes') i where i->>'accountId' = r->>'id'), 0)
      - coalesce((select sum((p->>'amountCents')::numeric) from jsonb_array_elements(s->'payments') p where p->>'accountId' = r->>'id'), 0)
      + coalesce((select sum((x->>'amountCents')::numeric) from jsonb_array_elements(s->'transfers') x where x->>'toAccountId' = r->>'id'), 0)
      - coalesce((select sum((x->>'amountCents')::numeric) from jsonb_array_elements(s->'transfers') x where x->>'fromAccountId' = r->>'id'), 0) into paid;
    perform casa_private.integer_value(to_jsonb(paid), -9007199254740991);
    total := total + paid;
  end loop;
  perform casa_private.integer_value(to_jsonb(total), -9007199254740991);
exception when others then
  raise exception using errcode = 'CS400', message = 'Snapshot failed validation';
end $$;

create function public.casa_commit_snapshot(p_operation_id uuid, p_base_revision bigint, p_state jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare owner uuid := auth.uid(); fingerprint bytea; receipt public.casa_receipts%rowtype;
  current_revision bigint; next_revision bigint; confirmed timestamptz;
begin
  if owner is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  if p_operation_id is null or p_base_revision is null or p_base_revision < 0 or p_base_revision >= 9007199254740991 then raise exception using errcode = 'CS400', message = 'Invalid operation'; end if;
  perform casa_private.validate_snapshot(p_state);
  fingerprint := sha256(convert_to(jsonb_build_object('base', p_base_revision, 'state', p_state)::text, 'UTF8'));
  -- Also serialize concurrent first inserts, where no row yet exists to lock.
  perform pg_advisory_xact_lock(hashtextextended(owner::text, 0));
  select * into receipt from public.casa_receipts where owner_id = owner and operation_id = p_operation_id;
  if found then
    if receipt.payload_hash <> fingerprint then raise exception using errcode = 'CS422', message = 'Operation payload conflict'; end if;
    return jsonb_build_object('operationId', p_operation_id, 'revision', receipt.remote_revision, 'state', p_state, 'updatedAt', receipt.confirmed_at);
  end if;
  select remote_revision into current_revision from public.casa_snapshots where owner_id = owner for update;
  if coalesce(current_revision, 0) <> p_base_revision then raise exception using errcode = 'CS409', message = 'Remote revision conflict'; end if;
  next_revision := p_base_revision + 1; confirmed := clock_timestamp();
  insert into public.casa_snapshots(owner_id, remote_revision, state, updated_at) values (owner, next_revision, p_state, confirmed)
    on conflict (owner_id) do update set remote_revision = excluded.remote_revision, state = excluded.state, updated_at = excluded.updated_at;
  insert into public.casa_receipts values (owner, p_operation_id, p_base_revision, next_revision, fingerprint, confirmed);
  return jsonb_build_object('operationId', p_operation_id, 'revision', next_revision, 'state', p_state, 'updatedAt', confirmed);
end $$;
revoke all on function public.casa_commit_snapshot(uuid, bigint, jsonb) from public, anon, authenticated;
grant execute on function public.casa_commit_snapshot(uuid, bigint, jsonb) to authenticated;
revoke all on all functions in schema casa_private from public, anon, authenticated;
commit;
