'use client';

import * as React from 'react';

import MarketCard from '@/components/markets/MarketCard';
import MarketCardSkeleton from '@/components/markets/MarketCardSkeleton';
import MarketSearch from '@/components/markets/MarketSearch';
import ErrorState from '@/components/markets/ErrorState';
import { calculateAllPrices } from '@/lib/market/state';
import browserClient from '@/lib/supabase/client';
import { getEventCategories, getOpenEvents, searchEvents } from '@/lib/services/markets';
import type { EventCategory, MarketCardData } from '@/types/market';
import { cn } from '@/lib/utils';
import { parseNumeric } from '@/lib/market/lmsr';

const normalizeCategory = (value?: string | null): EventCategory => {
  const categories = getEventCategories();
  const normalized = value?.toLowerCase() ?? 'culture';
  return categories.includes(normalized as EventCategory)
    ? (normalized as EventCategory)
    : 'culture';
};

export default function MarketsPage() {
  const categories = getEventCategories();
  const [activeCategory, setActiveCategory] = React.useState<EventCategory>('all');
  const [query, setQuery] = React.useState('');
  const [markets, setMarkets] = React.useState<MarketCardData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadMarkets = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const events = query
        ? await searchEvents(query)
        : await getOpenEvents('all');

      const enriched = await Promise.all(
        events.map(async (event) => {
          if (!event.outcomes.length) {
            return {
              id: event.id,
              title: event.title,
              category: normalizeCategory(event.category),
              image_url: event.image_url,
              close_time: event.close_time,
              volume: 0,
              topOutcomes: [],
            } satisfies MarketCardData;
          }

          let prices = [];
          try {
            prices = await calculateAllPrices(event.id, browserClient);
          } catch (pricingError) {
            console.error(pricingError);
          }

          const volume = event.outcomes.reduce((sum, outcome) => {
            return sum + parseNumeric(outcome.total_staked ?? 0);
          }, 0);

          const topOutcomes = prices
            .slice()
            .sort((a, b) => b.price - a.price)
            .slice(0, 3)
            .map((outcome) => ({
              label: outcome.label,
              odds: outcome.odds,
              price: outcome.price,
            }));

          return {
            id: event.id,
            title: event.title,
            category: normalizeCategory(event.category),
            image_url: event.image_url,
            close_time: event.close_time,
            volume,
            topOutcomes,
          } satisfies MarketCardData;
        })
      );

      setMarkets(enriched);
    } catch (err) {
      console.error(err);
      setError('We could not load the markets right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  React.useEffect(() => {
    void loadMarkets();
  }, [loadMarkets]);

  const visibleMarkets =
    activeCategory === 'all'
      ? markets
      : markets.filter((market) => market.category === activeCategory);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="h1">Markets</p>
          <p className="text-sm text-slate-500">Bet on real-world events.</p>
        </div>
        <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
          {categories.map((category) => {
            const isActive = category === activeCategory;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  'whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition',
                  isActive
                    ? 'border-transparent bg-[var(--color-primary-500)] text-white shadow-lg shadow-[var(--color-primary-500)/20]'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-[var(--color-primary-200)]'
                )}
              >
                {category}
              </button>
            );
          })}
        </div>
        <div className="mt-4">
          <MarketSearch onChange={setQuery} />
        </div>
      </section>

      {error ? (
        <ErrorState message={error} onRetry={loadMarkets} />
      ) : null}

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <MarketCardSkeleton key={index} />
          ))}
        </div>
      ) : visibleMarkets.length === 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700">No markets yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Try a different category or search term.
          </p>
        </section>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visibleMarkets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </div>
  );
}
