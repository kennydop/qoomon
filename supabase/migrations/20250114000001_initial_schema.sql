-- Enable extensions for UUID generation
create extension if not exists "pgcrypto";

-- Users table extending Supabase Auth
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text not null unique,
  full_name text,
  is_admin boolean not null default false,
  paper_balance numeric(10, 2) not null default 1000.00,
  live_balance numeric(10, 2) not null default 0.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Events table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  image_url text,
  pricing_model text not null default 'lmsr',
  liquidity_parameter numeric(10, 2) not null default 100.00,
  status text not null default 'open',
  close_time timestamptz not null,
  settled_at timestamptz,
  winning_outcome_id uuid,
  created_by uuid references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_pricing_model_check
    check (pricing_model in ('lmsr', 'parimutuel')),
  constraint events_status_check
    check (status in ('open', 'closed', 'settled'))
);

-- Outcomes table
create table if not exists public.outcomes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  label text not null,
  initial_probability numeric(5, 4) default 0.5,
  shares_outstanding numeric(15, 6) not null default 0,
  total_staked numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  constraint outcomes_unique_event_label unique (event_id, label)
);

alter table public.events
  add constraint events_winning_outcome_fkey
  foreign key (winning_outcome_id) references public.outcomes (id);

-- Ledger entries table
create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id),
  mode text not null,
  transaction_type text not null,
  amount numeric(10, 2) not null,
  balance_after numeric(10, 2) not null,
  reference_id uuid,
  reference_type text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  constraint ledger_mode_check check (mode in ('paper', 'live')),
  constraint ledger_tx_type_check check (
    transaction_type in (
      'deposit',
      'withdrawal',
      'bet_placed',
      'bet_won',
      'bet_lost',
      'cashout',
      'signup_bonus'
    )
  )
);

-- Bets table
create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id),
  outcome_id uuid not null references public.outcomes (id),
  mode text not null,
  stake numeric(10, 2) not null,
  shares numeric(15, 6) not null,
  entry_price numeric(5, 4) not null,
  potential_payout numeric(10, 2),
  status text not null default 'open',
  settled_at timestamptz,
  payout_amount numeric(10, 2),
  created_at timestamptz not null default now(),
  constraint bets_mode_check check (mode in ('paper', 'live')),
  constraint bets_status_check check (status in ('open', 'cashed_out', 'won', 'lost'))
);

-- Withdrawals table
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id),
  amount numeric(10, 2) not null,
  phone_number text not null,
  provider text not null,
  status text not null default 'pending',
  external_reference text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint withdrawals_provider_check check (provider in ('mtn', 'airteltigo', 'telecel')),
  constraint withdrawals_status_check check (status in ('pending', 'processing', 'completed', 'failed'))
);

-- Indexes
create index if not exists idx_events_status_close_time on public.events (status, close_time);
create index if not exists idx_bets_user_status on public.bets (user_id, status);
create index if not exists idx_bets_outcome_status on public.bets (outcome_id, status);
create index if not exists idx_ledger_user_mode on public.ledger_entries (user_id, mode, created_at);

-- Trigger to maintain updated_at columns
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_users_updated_at on public.users;
create trigger update_users_updated_at
before update on public.users
for each row
execute procedure public.update_updated_at_column();

drop trigger if exists update_events_updated_at on public.events;
create trigger update_events_updated_at
before update on public.events
for each row
execute procedure public.update_updated_at_column();

drop trigger if exists update_withdrawals_updated_at on public.withdrawals;
create trigger update_withdrawals_updated_at
before update on public.withdrawals
for each row
execute procedure public.update_updated_at_column();
