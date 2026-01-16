'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, TrendingUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { MarketCardData } from '@/types/market';
import {
  formatCloseTime,
  formatOdds,
  formatProbability,
  formatVolume,
  getCategoryColor,
  getCategoryIcon,
  getEventImageFallback,
} from '@/lib/utils/market';

type MarketCardProps = {
  market: MarketCardData;
};

const cardBase =
  'flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200';

export default function MarketCard({ market }: MarketCardProps) {
  const Icon = getCategoryIcon(market.category);
  const imageFallback = getEventImageFallback(market.category);
  const badgeColor = getCategoryColor(market.category);

  return (
    <Link
      href={`/markets/${market.id}`}
      className={cn(
        cardBase,
        'group hover:scale-[1.02] hover:shadow-[0_16px_32px_rgba(99,102,241,0.15)]'
      )}
    >
      <div className="relative h-40 w-full overflow-hidden">
        {market.image_url ? (
          <Image
            src={market.image_url}
            alt={market.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ backgroundImage: imageFallback }}>
            <Icon className="h-10 w-10 text-white/90" />
          </div>
        )}
        <span
          className="absolute left-4 top-4 rounded-full px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white shadow"
          style={{ backgroundColor: badgeColor }}
        >
          {market.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <p className="line-clamp-2 text-lg font-semibold text-slate-900">
            {market.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatCloseTime(market.close_time)}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              {formatVolume(market.volume)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {market.topOutcomes.map((outcome) => (
            <div
              key={outcome.label}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
            >
              <span className="max-w-[65%] truncate">{outcome.label}</span>
              <span className="text-slate-500">
                {formatProbability(outcome.price)}
              </span>
              <span className="text-[var(--color-primary-600)]">
                {formatOdds(outcome.odds)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}
