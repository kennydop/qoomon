import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/types';

/**
 * Calculate parimutuel odds from a pool of stakes.
 */
export function calculateParimutuelOdds(
  outcomes: Array<{ id: string; totalStaked: number }>
): Map<string, number> {
  const totalPool = outcomes.reduce((sum, outcome) => sum + outcome.totalStaked, 0);
  const oddsMap = new Map<string, number>();

  outcomes.forEach((outcome) => {
    if (outcome.totalStaked <= 0) {
      oddsMap.set(outcome.id, 2.0);
      return;
    }

    oddsMap.set(outcome.id, totalPool / outcome.totalStaked);
  });

  return oddsMap;
}

/**
 * Calculate parimutuel payout as stake * odds.
 */
export function calculateParimutuelPayout(stake: number, odds: number): number {
  if (!Number.isFinite(stake) || stake < 0) {
    throw new Error('Stake must be a non-negative number.');
  }

  if (!Number.isFinite(odds) || odds <= 0) {
    throw new Error('Odds must be a positive number.');
  }

  return stake * odds;
}

/**
 * Determine if an event should use parimutuel pricing.
 */
export async function shouldUseParimutuel(
  eventId: string,
  supabase: SupabaseClient<Database>
): Promise<boolean> {
  const { data, error } = await supabase
    .from('events')
    .select('pricing_model')
    .eq('id', eventId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.pricing_model === 'parimutuel';
}
