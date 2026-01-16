-- Get a user's balance for a mode
create or replace function public.get_user_balance(p_user_id uuid, p_mode text)
returns numeric
language plpgsql
security definer
as $$
declare
  balance numeric(10, 2);
begin
  if p_mode = 'paper' then
    select paper_balance into balance from public.users where id = p_user_id;
  else
    select live_balance into balance from public.users where id = p_user_id;
  end if;

  return coalesce(balance, 0);
end;
$$;

-- Update user balance and write a ledger entry
create or replace function public.update_user_balance(
  p_user_id uuid,
  p_mode text,
  p_amount numeric,
  p_transaction_type text default null,
  p_reference_id uuid default null,
  p_reference_type text default null,
  p_metadata jsonb default null
)
returns numeric
language plpgsql
security definer
as $$
declare
  current_balance numeric(10, 2);
  new_balance numeric(10, 2);
  tx_type text;
  metadata jsonb;
begin
  current_balance := public.get_user_balance(p_user_id, p_mode);
  new_balance := coalesce(current_balance, 0) + p_amount;

  if p_mode = 'paper' then
    update public.users
      set paper_balance = new_balance,
          updated_at = now()
      where id = p_user_id;
  else
    update public.users
      set live_balance = new_balance,
          updated_at = now()
      where id = p_user_id;
  end if;

  tx_type := coalesce(
    p_transaction_type,
    case
      when p_amount >= 0 then 'deposit'
      else 'withdrawal'
    end
  );

  metadata := coalesce(
    p_metadata,
    jsonb_build_object('source', 'update_user_balance')
  );

  insert into public.ledger_entries (
    user_id,
    mode,
    transaction_type,
    amount,
    balance_after,
    reference_id,
    reference_type,
    metadata
  )
  values (
    p_user_id,
    p_mode,
    tx_type,
    p_amount,
    new_balance,
    p_reference_id,
    p_reference_type,
    metadata
  );

  return new_balance;
end;
$$;

-- Get an event with its outcomes as JSON
create or replace function public.get_event_with_outcomes(p_event_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'event', to_jsonb(e.*),
    'outcomes', coalesce(jsonb_agg(to_jsonb(o.*) order by o.created_at), '[]'::jsonb)
  )
  into result
  from public.events e
  left join public.outcomes o on o.event_id = e.id
  where e.id = p_event_id
  group by e.id;

  return coalesce(result, '{}'::jsonb);
end;
$$;

-- Settle an event and pay winning bets
create or replace function public.settle_event(
  p_event_id uuid,
  p_winning_outcome_id uuid
)
returns integer
language plpgsql
security definer
as $$
declare
  bet_record record;
  payout numeric(10, 2);
  settled_count integer := 0;
begin
  update public.events
    set status = 'settled',
        winning_outcome_id = p_winning_outcome_id,
        settled_at = now(),
        updated_at = now()
    where id = p_event_id;

  -- Pay winning bets
  for bet_record in
    select *
    from public.bets
    where outcome_id = p_winning_outcome_id
      and status = 'open'
  loop
    payout := coalesce(bet_record.payout_amount, bet_record.potential_payout, bet_record.stake);

    update public.bets
      set status = 'won',
          payout_amount = payout,
          settled_at = now()
      where id = bet_record.id;

    perform public.update_user_balance(
      bet_record.user_id,
      bet_record.mode,
      payout,
      'bet_won',
      bet_record.id,
      'bet',
      jsonb_build_object(
        'event_id', p_event_id,
        'outcome_id', p_winning_outcome_id,
        'bet_id', bet_record.id
      )
    );
    settled_count := settled_count + 1;
  end loop;

  -- Mark losing bets
  for bet_record in
    select *
    from public.bets
    where outcome_id in (
      select id from public.outcomes where event_id = p_event_id and id <> p_winning_outcome_id
    )
      and status = 'open'
  loop
    update public.bets
      set status = 'lost',
          payout_amount = 0,
          settled_at = now()
      where id = bet_record.id;

    perform public.update_user_balance(
      bet_record.user_id,
      bet_record.mode,
      0,
      'bet_lost',
      bet_record.id,
      'bet',
      jsonb_build_object(
        'event_id', p_event_id,
        'outcome_id', bet_record.outcome_id,
        'bet_id', bet_record.id
      )
    );
  end loop;

  return settled_count;
end;
$$;
