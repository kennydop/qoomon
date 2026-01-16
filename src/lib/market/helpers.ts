import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/types';

import { MIN_STAKE, SHARE_PRECISION } from './constants';
import { calculatePayout, calculateShares, formatNumeric } from './lmsr';
import {
  calculateAllPrices,
  fetchMarketState,
  getEventPricingConfig,
  updateOutcomeShares,
} from './state';
import type { BetCalculation, CashoutCalculation, OutcomePrices } from './types';

export interface BetResult {
  betId: string;
  calculation: BetCalculation;
}

export interface CashoutResult {
  betId: string;
  calculation: CashoutCalculation;
}

export interface MarketSummary {
  eventId: string;
  totalVolume: number;
  betsCount: number;
  prices: OutcomePrices[];
  priceHistory: Array<{ timestamp: string; prices: OutcomePrices[] }>;
}

export async function placeBet(
  userId: string,
  outcomeId: string,
  stake: number,
  mode: 'paper' | 'live',
  supabase: SupabaseClient<Database>
): Promise<BetResult> {
  if (!Number.isFinite(stake) || stake < MIN_STAKE) {
    throw new Error('Stake amount is too low.');
  }

  const { data: outcome, error: outcomeError } = await supabase
    .from('outcomes')
    .select('id,event_id')
    .eq('id', outcomeId)
    .single();

  if (outcomeError) {
    throw new Error(outcomeError.message);
  }

  if (!outcome) {
    throw new Error('Outcome not found.');
  }

  const pricingConfig = await getEventPricingConfig(outcome.event_id, supabase);
  const marketState = await fetchMarketState(outcome.event_id, supabase);
  const quantities = marketState.outcomes.map((entry) => entry.shares);
  const outcomeIndex = marketState.outcomes.findIndex((entry) => entry.id === outcomeId);

  if (outcomeIndex === -1) {
    throw new Error('Outcome not found in market state.');
  }

  const shares = calculateShares(quantities, outcomeIndex, stake, pricingConfig.liquidityParameter);
  const updatedQuantities = [...quantities];
  updatedQuantities[outcomeIndex] += shares;

  const entryPrice = shares > 0 ? stake / shares : 0;
  const potentialPayout = shares;

  await updateOutcomeShares(outcomeId, shares, stake, supabase);

  const { data: balance, error: balanceError } = await supabase.rpc(
    'update_user_balance',
    {
      p_amount: formatNumeric(-stake),
      p_mode: mode,
      p_user_id: userId,
    }
  );

  if (balanceError) {
    throw new Error(balanceError.message);
  }

  const { data: bet, error: betError } = await supabase
    .from('bets')
    .insert({
      user_id: userId,
      outcome_id: outcomeId,
      stake: formatNumeric(stake),
      shares: formatNumeric(shares, SHARE_PRECISION),
      entry_price: formatNumeric(entryPrice, SHARE_PRECISION),
      potential_payout: formatNumeric(potentialPayout, SHARE_PRECISION),
      mode,
    })
    .select('id')
    .single();

  if (betError) {
    throw new Error(betError.message);
  }

  const { error: ledgerError } = await supabase.from('ledger_entries').insert({
    user_id: userId,
    mode,
    transaction_type: 'bet_placed',
    amount: formatNumeric(-stake),
    balance_after: formatNumeric(Number.parseFloat(balance ?? '0')),
    reference_id: bet.id,
    reference_type: 'bet',
    metadata: {
      outcome_id: outcomeId,
      shares: formatNumeric(shares, SHARE_PRECISION),
    },
  });

  if (ledgerError) {
    throw new Error(ledgerError.message);
  }

  return {
    betId: bet.id,
    calculation: {
      shares,
      entryPrice,
      potentialPayout,
      newQuantities: updatedQuantities,
    },
  };
}

export async function cashOutBet(
  betId: string,
  supabase: SupabaseClient<Database>
): Promise<CashoutResult> {
  const { data: bet, error: betError } = await supabase
    .from('bets')
    .select('id,outcome_id,shares,entry_price,mode,status,user_id')
    .eq('id', betId)
    .single();

  if (betError) {
    throw new Error(betError.message);
  }

  if (!bet) {
    throw new Error('Bet not found.');
  }

  if (bet.status !== 'open') {
    throw new Error('Bet is not open for cashout.');
  }

  const { data: outcome, error: outcomeError } = await supabase
    .from('outcomes')
    .select('event_id')
    .eq('id', bet.outcome_id)
    .single();

  if (outcomeError) {
    throw new Error(outcomeError.message);
  }

  if (!outcome) {
    throw new Error('Outcome not found for bet.');
  }

  const pricingConfig = await getEventPricingConfig(outcome.event_id, supabase);
  const marketState = await fetchMarketState(outcome.event_id, supabase);
  const quantities = marketState.outcomes.map((entry) => entry.shares);
  const outcomeIndex = marketState.outcomes.findIndex(
    (entry) => entry.id === bet.outcome_id
  );

  if (outcomeIndex === -1) {
    throw new Error('Outcome not found in market state.');
  }

  const shares = Number.parseFloat(bet.shares);
  const payout = calculatePayout(
    shares,
    quantities,
    outcomeIndex,
    pricingConfig.liquidityParameter
  );
  const exitPrice = shares > 0 ? payout / shares : 0;
  const entryPrice = Number.parseFloat(bet.entry_price);
  const priceChange = exitPrice - entryPrice;

  await updateOutcomeShares(bet.outcome_id, -shares, -payout, supabase);

  const { data: balance, error: balanceError } = await supabase.rpc(
    'update_user_balance',
    {
      p_amount: formatNumeric(payout),
      p_mode: bet.mode,
      p_user_id: bet.user_id,
    }
  );

  if (balanceError) {
    throw new Error(balanceError.message);
  }

  const { error: updateError } = await supabase
    .from('bets')
    .update({
      status: 'cashed_out',
      payout_amount: formatNumeric(payout),
      settled_at: new Date().toISOString(),
    })
    .eq('id', betId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: ledgerError } = await supabase.from('ledger_entries').insert({
    user_id: bet.user_id,
    mode: bet.mode,
    transaction_type: 'cashout',
    amount: formatNumeric(payout),
    balance_after: formatNumeric(Number.parseFloat(balance ?? '0')),
    reference_id: bet.id,
    reference_type: 'bet',
    metadata: {
      outcome_id: bet.outcome_id,
      shares: formatNumeric(shares, SHARE_PRECISION),
    },
  });

  if (ledgerError) {
    throw new Error(ledgerError.message);
  }

  return {
    betId: bet.id,
    calculation: {
      payout,
      exitPrice,
      priceChange,
    },
  };
}

export async function getMarketSummary(
  eventId: string,
  supabase: SupabaseClient<Database>
): Promise<MarketSummary> {
  const { data: outcomes, error: outcomesError } = await supabase
    .from('outcomes')
    .select('id')
    .eq('event_id', eventId);

  if (outcomesError) {
    throw new Error(outcomesError.message);
  }

  const outcomeIds = outcomes?.map((outcome) => outcome.id) ?? [];

  if (outcomeIds.length === 0) {
    return {
      eventId,
      totalVolume: 0,
      betsCount: 0,
      prices: [],
      priceHistory: [],
    };
  }

  const { data: betStats, error: betError } = await supabase
    .from('bets')
    .select('stake')
    .eq('status', 'open')
    .in('outcome_id', outcomeIds);

  if (betError) {
    throw new Error(betError.message);
  }

  const totalVolume =
    betStats?.reduce((sum, betRow) => sum + Number.parseFloat(betRow.stake), 0) ?? 0;

  const { count: betsCount, error: countError } = await supabase
    .from('bets')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open')
    .in('outcome_id', outcomeIds);

  if (countError) {
    throw new Error(countError.message);
  }

  const prices = await calculateAllPrices(eventId, supabase);

  return {
    eventId,
    totalVolume,
    betsCount: betsCount ?? 0,
    prices,
    priceHistory: [],
  };
}
