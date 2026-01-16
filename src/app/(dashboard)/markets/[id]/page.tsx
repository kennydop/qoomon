'use client';

import * as React from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Clock, TrendingUp } from 'lucide-react';

import ErrorState from '@/components/markets/ErrorState';
import MarketDetailsSkeleton from '@/components/markets/MarketDetailsSkeleton';
import PriceChart from '@/components/markets/PriceChart';
import { getEventWithPrices, subscribeToOutcomeUpdates } from '@/lib/services/markets';
import {
  formatCloseTime,
  formatOdds,
  formatProbability,
  formatVolume,
  getCategoryColor,
  getEventImageFallback,
} from '@/lib/utils/market';
import type { EventWithPrices } from '@/types/market';

export default function MarketDetailsPage() {
  const params = useParams();
  const eventId = params?.id as string;
  const [market, setMarket] = React.useState<EventWithPrices | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadMarket = React.useCallback(async () => {
    if (!eventId) {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await getEventWithPrices(eventId);
      setMarket(response);
      if (!response) {
        setError('Market not found.');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load this market. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  React.useEffect(() => {
    void loadMarket();
  }, [loadMarket]);

  React.useEffect(() => {
    if (!eventId) {
      return;
    }

    let isActive = true;
    const unsubscribe = subscribeToOutcomeUpdates(eventId, async () => {
      const refreshed = await getEventWithPrices(eventId);
      if (isActive && refreshed) {
        setMarket(refreshed);
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [eventId]);

  if (loading) {
    return <MarketDetailsSkeleton />;
  }

  if (error || !market) {
    return (
      <ErrorState
        message={error ?? 'Market not found.'}
        onRetry={loadMarket}
      />
    );
  }

  const category = market.category ?? 'culture';
  const badgeColor = getCategoryColor(category);
  const imageFallback = getEventImageFallback(category);
  const outcomesSorted = market.prices.slice().sort((a, b) => b.price - a.price);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <div className="relative h-52 w-full overflow-hidden rounded-3xl">
            {market.image_url ? (
              <Image
                src={market.image_url}
                alt={market.title}
                fill
                sizes="(max-width: 768px) 100vw, 240px"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full" style={{ backgroundImage: imageFallback }} />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="rounded-full px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white"
                style={{ backgroundColor: badgeColor }}
              >
                {category}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                {formatCloseTime(market.close_time)}
              </span>
            </div>

            <div>
              <p className="h2 text-slate-900">{market.title}</p>
              <p className="mt-2 text-sm text-slate-500">
                {market.description ?? 'No description provided yet.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1">
                <TrendingUp className="h-3.5 w-3.5" />
                {formatVolume(market.volume)} volume
              </span>
              <span className="rounded-full border border-slate-200 px-3 py-1">
                {market.outcomes.length} outcomes
              </span>
            </div>
          </div>
        </div>
      </section>

      <PriceChart
        eventId={market.id}
        outcomes={market.outcomes.map((outcome) => ({
          id: outcome.id,
          label: outcome.label,
        }))}
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Outcomes
        </p>
        <div className="mt-4 space-y-3">
          {outcomesSorted.map((outcome) => (
            <div
              key={outcome.outcomeId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {outcome.label}
                </p>
                <p className="text-xs text-slate-500">
                  {formatProbability(outcome.price)} probability
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm font-semibold">
                <span className="text-slate-500">{formatOdds(outcome.odds)}x</span>
                <button
                  type="button"
                  className="rounded-2xl bg-[var(--color-primary-500)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-[var(--color-primary-500)/25] transition hover:bg-[var(--color-primary-600)]"
                >
                  Bet
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
