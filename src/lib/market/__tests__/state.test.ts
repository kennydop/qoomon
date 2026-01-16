import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/types';
import { fetchMarketState, getEventPricingConfig, updateOutcomeShares } from '@/lib/market/state';

const buildOutcomesData = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `outcome-${index}`,
    label: `Outcome ${index}`,
    shares_outstanding: `${index + 1}.0`,
  }));

const buildOutcomesQuery = (data: unknown) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockResolvedValue({ data, error: null }),
});

const buildEventsQuery = (data: unknown, error: { message: string } | null = null) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockResolvedValue({ data, error }),
});

describe('market state utilities', () => {
  it('should fetch market state for various outcome counts', async () => {
    const counts = [2, 3, 5, 10];

    for (const count of counts) {
      const outcomesData = buildOutcomesData(count);
      const eventsQuery = buildEventsQuery({ liquidity_parameter: '250' });
      const supabase = {
        from: jest.fn((table: string) => {
          if (table === 'events') {
            return eventsQuery;
          }
          return buildOutcomesQuery(outcomesData);
        }),
      } as unknown as SupabaseClient<Database>;

      const state = await fetchMarketState('event-1', supabase);
      expect(state.outcomes).toHaveLength(count);
      expect(state.outcomes[0]?.shares).toBeCloseTo(1, 6);
      expect(state.liquidityParameter).toBeCloseTo(250, 6);
    }
  });

  it('should throw on non-existent events', async () => {
    const supabase = {
      from: jest.fn().mockReturnValue(buildEventsQuery(null)),
    } as unknown as SupabaseClient<Database>;

    await expect(getEventPricingConfig('missing', supabase)).rejects.toThrow(
      'Event not found.'
    );
  });

  it('should allow concurrent share updates', async () => {
    const supabase = {
      rpc: jest.fn().mockResolvedValue({ data: 1, error: null }),
    } as unknown as SupabaseClient<Database>;

    await Promise.all([
      updateOutcomeShares('outcome-1', 2, 10, supabase),
      updateOutcomeShares('outcome-1', 3, 12, supabase),
    ]);

    expect(supabase.rpc).toHaveBeenCalledTimes(2);
  });
});

describe('price calculation caching', () => {
  it('should reuse cached prices within the TTL', async () => {
    jest.resetModules();
    const { calculateAllPrices } = await import('@/lib/market/state');

    const outcomesQuery = buildOutcomesQuery([
      { id: 'a', label: 'A', shares_outstanding: '0' },
      { id: 'b', label: 'B', shares_outstanding: '0' },
    ]);
    const eventsQuery = buildEventsQuery({
      pricing_model: 'lmsr',
      liquidity_parameter: '100',
    });

    const supabase = {
      from: jest.fn((table: string) => {
        if (table === 'events') {
          return eventsQuery;
        }
        return outcomesQuery;
      }),
    } as unknown as SupabaseClient<Database>;

    const first = await calculateAllPrices('event-1', supabase);
    const second = await calculateAllPrices('event-1', supabase);

    expect(first).toEqual(second);
    expect(supabase.from).toHaveBeenCalledTimes(3);
  });
});
