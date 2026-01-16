-- Enable Row Level Security on all tables
alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.outcomes enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.bets enable row level security;
alter table public.withdrawals enable row level security;

-- Helper predicate to identify admins
create or replace function public.is_admin_user(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (select 1 from public.users where id = uid and is_admin = true);
$$;

-- Users policies
drop policy if exists users_select_own on public.users;
create policy users_select_own
  on public.users
  for select
  using (auth.uid() = id);

drop policy if exists users_update_own on public.users;
create policy users_update_own
  on public.users
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_admin = (select is_admin from public.users where id = auth.uid())
    and paper_balance = (select paper_balance from public.users where id = auth.uid())
    and live_balance = (select live_balance from public.users where id = auth.uid())
  );

drop policy if exists users_admin_all on public.users;
create policy users_admin_all
  on public.users
  for all
  using (public.is_admin_user(auth.uid()));

-- Events policies
drop policy if exists events_select_all on public.events;
create policy events_select_all
  on public.events
  for select
  using (auth.role() = 'authenticated');

drop policy if exists events_insert_admin on public.events;
create policy events_insert_admin
  on public.events
  for insert
  with check (public.is_admin_user(auth.uid()));

drop policy if exists events_update_admin on public.events;
create policy events_update_admin
  on public.events
  for update
  using (public.is_admin_user(auth.uid()))
  with check (public.is_admin_user(auth.uid()));

-- Outcomes policies
drop policy if exists outcomes_select_all on public.outcomes;
create policy outcomes_select_all
  on public.outcomes
  for select
  using (auth.role() = 'authenticated');

drop policy if exists outcomes_insert_admin on public.outcomes;
create policy outcomes_insert_admin
  on public.outcomes
  for insert
  with check (public.is_admin_user(auth.uid()));

drop policy if exists outcomes_update_admin on public.outcomes;
create policy outcomes_update_admin
  on public.outcomes
  for update
  using (public.is_admin_user(auth.uid()))
  with check (public.is_admin_user(auth.uid()));

-- Ledger policies
drop policy if exists ledger_select_own on public.ledger_entries;
create policy ledger_select_own
  on public.ledger_entries
  for select
  using (auth.uid() = user_id);

drop policy if exists ledger_insert_system on public.ledger_entries;
create policy ledger_insert_system
  on public.ledger_entries
  for insert
  with check (auth.role() = 'service_role');

-- Bets policies
drop policy if exists bets_select_own on public.bets;
create policy bets_select_own
  on public.bets
  for select
  using (auth.uid() = user_id);

drop policy if exists bets_insert_own on public.bets;
create policy bets_insert_own
  on public.bets
  for insert
  with check (auth.uid() = user_id);

drop policy if exists bets_update_own on public.bets;
create policy bets_update_own
  on public.bets
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Withdrawals policies
drop policy if exists withdrawals_select_own on public.withdrawals;
create policy withdrawals_select_own
  on public.withdrawals
  for select
  using (auth.uid() = user_id);

drop policy if exists withdrawals_insert_own on public.withdrawals;
create policy withdrawals_insert_own
  on public.withdrawals
  for insert
  with check (auth.uid() = user_id);

drop policy if exists withdrawals_update_admin on public.withdrawals;
create policy withdrawals_update_admin
  on public.withdrawals
  for update
  using (
    auth.role() = 'service_role'
    or public.is_admin_user(auth.uid())
  )
  with check (
    auth.role() = 'service_role'
    or public.is_admin_user(auth.uid())
  );
