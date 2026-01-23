import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/types';

import { DEFAULT_LIQUIDITY_PARAMETER } from './constants';
import { decimalOdds, parseNumeric, price } from './lmsr';
import { calculateParimutuelOdds } from './parimutuel';
import type { MarketState, OutcomePrices, PricingConfig } from './types';

const PRICE_CACHE_TTL_MS = 1000;
const CASHOUT_CACHE_TTL_MS = 1000;
const priceCache = new Map<string, { timestamp: number; data: OutcomePrices[] }>();
const cashoutPreviewCache = new Map<
  string,
  { timestamp: number; data: { payout: number; exitPrice: number; priceChange: number; slippage: number } }
>();

export type CashoutPreview = {
  payout: number;
  exitPrice: number;
  priceChange: number;
  slippage: number;
};

export function getCachedCashoutPreview(key: string): CashoutPreview | null {
  const cached = cashoutPreviewCache.get(key);
  if (!cached) {
    return null;
  }

  if (Date.now() - cached.timestamp > CASHOUT_CACHE_TTL_MS) {
    cashoutPreviewCache.delete(key);
    return null;
  }

  return cached.data;
}

export function setCachedCashoutPreview(key: string, preview: CashoutPreview): void {
  cashoutPreviewCache.set(key, { timestamp: Date.now(), data: preview });
}

export async function fetchMarketState(
  eventId: string,
  supabase: SupabaseClient<Database>
): Promise<MarketState> {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('liquidity_parameter')
    .eq('id', eventId)
    .maybeSingle();

  if (eventError) {
    throw new Error(eventError.message);
  }

  if (!event) {
    throw new Error('Event not found.');
  }

  const { data, error } = await supabase
    .from('outcomes')
    .select('id,label,shares_outstanding')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error('No outcomes found for event.');
  }

  return {
    eventId,
    outcomes: data.map((outcome) => ({
      id: outcome.id,
      label: outcome.label,
      shares: parseNumeric(outcome.shares_outstanding),
    })),
    liquidityParameter: parseNumeric(
      event.liquidity_parameter ?? DEFAULT_LIQUIDITY_PARAMETER
    ),
  };
}

export async function updateOutcomeShares(
  outcomeId: string,
  deltaShares: number,
  deltaStake: number,
  supabase: SupabaseClient<Database>
): Promise<void> {
  if (!Number.isFinite(deltaShares)) {
    throw new Error('Delta shares must be a finite number.');
  }

  if (!Number.isFinite(deltaStake)) {
    throw new Error('Delta stake must be a finite number.');
  }

  const { error: updateError } = await supabase.rpc('increment_outcome_totals', {
    p_outcome_id: outcomeId,
    p_delta_shares: deltaShares,
    p_delta_stake: deltaStake,
  });

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export async function getEventPricingConfig(
  eventId: string,
  supabase: SupabaseClient<Database>
): Promise<PricingConfig> {
  const { data, error } = await supabase
    .from('events')
    .select('pricing_model,liquidity_parameter')
    .eq('id', eventId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Event not found.');
  }

  return {
    model: data.pricing_model ?? 'lmsr',
    liquidityParameter: parseNumeric(
      data.liquidity_parameter ?? DEFAULT_LIQUIDITY_PARAMETER
    ),
  };
}

export async function calculateAllPrices(
  eventId: string,
  supabase: SupabaseClient<Database>
): Promise<OutcomePrices[]> {
  const cached = priceCache.get(eventId);
  const now = Date.now();

  if (cached && now - cached.timestamp < PRICE_CACHE_TTL_MS) {
    return cached.data;
  }

  const pricingConfig = await getEventPricingConfig(eventId, supabase);
  const marketState = await fetchMarketState(eventId, supabase);

  if (pricingConfig.model === 'parimutuel') {
    const { data, error } = await supabase
      .from('outcomes')
      .select('id,total_staked')
      .eq('event_id', eventId);

    if (error) {
      throw new Error(error.message);
    }

    const poolData =
      data?.map((outcome) => ({
        id: outcome.id,
        totalStaked: parseNumeric(outcome.total_staked),
      })) ?? [];

    const oddsMap = calculateParimutuelOdds(poolData);

    const priced = marketState.outcomes.map((outcome) => {
      const odds = oddsMap.get(outcome.id) ?? 2.0;
      const priceValue = odds > 0 ? 1 / odds : 0;

      return {
        outcomeId: outcome.id,
        label: outcome.label,
        price: priceValue,
        odds,
        shares: outcome.shares,
      };
    });

    priceCache.set(eventId, { timestamp: now, data: priced });
    return priced;
  }

  const quantities = marketState.outcomes.map((outcome) => outcome.shares);
  const priced = marketState.outcomes.map((outcome, index) => ({
    outcomeId: outcome.id,
    label: outcome.label,
    price: price(quantities, index, pricingConfig.liquidityParameter),
    odds: decimalOdds(quantities, index, pricingConfig.liquidityParameter),
    shares: outcome.shares,
  }));

  priceCache.set(eventId, { timestamp: now, data: priced });
  return priced;
}
