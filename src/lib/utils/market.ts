import {
  Bitcoin,
  Cloud,
  Music,
  Trophy,
  Vote,
  type LucideIcon,
} from 'lucide-react';

const volumeFormatter = new Intl.NumberFormat('en-GH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const categoryColors: Record<string, string> = {
  politics: 'var(--color-primary-500)',
  sports: 'var(--color-primary-400)',
  crypto: 'var(--color-primary-600)',
  weather: 'var(--color-primary-300)',
  culture: 'var(--color-primary-700)',
};

const categoryGradients: Record<string, string> = {
  politics: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
  sports: 'linear-gradient(135deg, #5b21b6, #7c3aed)',
  crypto: 'linear-gradient(135deg, #4c1d95, #6d28d9)',
  weather: 'linear-gradient(135deg, #7c3aed, #a855f7)',
  culture: 'linear-gradient(135deg, #4338ca, #7c3aed)',
};

const categoryIcons: Record<string, LucideIcon> = {
  politics: Vote,
  sports: Trophy,
  crypto: Bitcoin,
  weather: Cloud,
  culture: Music,
};

const formatUnit = (value: number, unit: string) =>
  `${value} ${unit}${value === 1 ? '' : 's'}`;

export function formatCloseTime(closeTime: string): string {
  const target = new Date(closeTime).getTime();
  if (Number.isNaN(target)) {
    return 'Closing time unavailable';
  }

  const now = Date.now();
  const deltaMs = target - now;
  const absSeconds = Math.abs(deltaMs) / 1000;

  const isFuture = deltaMs >= 0;

  if (absSeconds < 60) {
    return isFuture ? 'Closes in moments' : 'Closed moments ago';
  }
  if (absSeconds < 60 * 60) {
    const minutes = Math.max(1, Math.round(absSeconds / 60));
    return isFuture
      ? `Closes in ${formatUnit(minutes, 'minute')}`
      : `Closed ${formatUnit(minutes, 'minute')} ago`;
  }
  if (absSeconds < 60 * 60 * 24) {
    const hours = Math.max(1, Math.round(absSeconds / (60 * 60)));
    return isFuture
      ? `Closes in ${formatUnit(hours, 'hour')}`
      : `Closed ${formatUnit(hours, 'hour')} ago`;
  }
  const days = Math.max(1, Math.round(absSeconds / (60 * 60 * 24)));
  return isFuture
    ? `Closes in ${formatUnit(days, 'day')}`
    : `Closed ${formatUnit(days, 'day')} ago`;
}

export function formatVolume(volume: number): string {
  const safeVolume = Number.isFinite(volume) ? volume : 0;
  return `GHS ${volumeFormatter.format(safeVolume)}`;
}

export function formatOdds(odds: number): string {
  const safeOdds = Number.isFinite(odds) ? odds : 0;
  return safeOdds.toFixed(2);
}

export function formatProbability(price: number): string {
  const safePrice = Number.isFinite(price) ? price : 0;
  const percentage = Math.max(0, Math.min(1, safePrice)) * 100;
  return `${percentage.toFixed(1)}%`;
}

export function getCategoryColor(category: string): string {
  return categoryColors[category] ?? 'var(--color-primary-500)';
}

export function getCategoryIcon(category: string): LucideIcon {
  return categoryIcons[category] ?? Vote;
}

export function getEventImageFallback(category: string): string {
  return categoryGradients[category] ?? 'linear-gradient(135deg, #6d28d9, #7c3aed)';
}
