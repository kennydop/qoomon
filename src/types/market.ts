import type { Tables } from '@/lib/supabase/types';
import type { OutcomePrices } from '@/lib/market/types';

export type Event = Tables<'events'>;
export type Outcome = Tables<'outcomes'>;

export interface EventWithOutcomes extends Event {
  outcomes: Outcome[];
}

export interface EventWithPrices extends EventWithOutcomes {
  prices: OutcomePrices[];
  volume: number;
}

export interface MarketCardData {
  id: string;
  title: string;
  category: string;
  image_url: string | null;
  close_time: string;
  volume: number;
  topOutcomes: Array<{
    label: string;
    odds: number;
    price: number;
  }>;
}

export type EventCategory =
  | 'all'
  | 'politics'
  | 'sports'
  | 'crypto'
  | 'weather'
  | 'culture';
