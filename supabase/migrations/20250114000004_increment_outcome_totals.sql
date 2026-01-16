-- Increment outcome shares and total staked atomically
create or replace function public.increment_outcome_totals(
  p_outcome_id uuid,
  p_delta_shares numeric,
  p_delta_stake numeric
)
returns integer
language plpgsql
security definer
as $$
declare
  updated_count integer := 0;
begin
  update public.outcomes
    set shares_outstanding = shares_outstanding + p_delta_shares,
        total_staked = total_staked + p_delta_stake
    where id = p_outcome_id;

  get diagnostics updated_count = row_count;

  return updated_count;
end;
$$;
