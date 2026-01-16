import type { SupabaseClient } from '@supabase/supabase-js';

import browserClient from '@/lib/supabase/client';
import type { Database, Json } from '@/lib/supabase/types';
import { calculateAllPrices } from '@/lib/market/state';
import { parseNumeric } from '@/lib/market/lmsr';
import type {
  Event,
  EventCategory,
  EventWithOutcomes,
  EventWithPrices,
} from '@/types/market';

type ClientOptions = {
  client?: SupabaseClient<Database>;
};

const getClient = (options?: ClientOptions) => options?.client ?? browserClient;

const mapEventPayload = (payload: Json | null): EventWithOutcomes | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as {
    event?: Event;
    outcomes?: EventWithOutcomes['outcomes'];
  };

  if (!data.event || !Array.isArray(data.outcomes)) {
    return null;
  }

  return {
    ...data.event,
    outcomes: data.outcomes,
  };
};

export async function getOpenEvents(
  category?: EventCategory,
  options?: ClientOptions
): Promise<EventWithOutcomes[]> {
  const client = getClient(options);
  let query = client
    .from('events')
    .select('*')
    .eq('status', 'open')
    .order('close_time', { ascending: true });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  const eventIds = data.map((event) => event.id);
  if (eventIds.length === 0) {
    return [];
  }

  const { data: outcomesData, error: outcomesError } = await client
    .from('outcomes')
    .select('*')
    .in('event_id', eventIds)
    .order('created_at', { ascending: true });

  if (outcomesError || !outcomesData) {
    return data.map((event) => ({ ...event, outcomes: [] }));
  }

  const outcomeMap = outcomesData.reduce<Record<string, EventWithOutcomes['outcomes']>>(
    (acc, outcome) => {
      const existing = acc[outcome.event_id] ?? [];
      existing.push(outcome);
      acc[outcome.event_id] = existing;
      return acc;
    },
    {}
  );

  return data.map((event) => ({
    ...event,
    outcomes: outcomeMap[event.id] ?? [],
  }));
}

export async function getEventById(
  eventId: string,
  options?: ClientOptions
): Promise<EventWithOutcomes | null> {
  const client = getClient(options);
  const { data, error } = await client.rpc('get_event_with_outcomes', {
    p_event_id: eventId,
  });

  if (error) {
    return null;
  }

  return mapEventPayload(data);
}

export async function getEventWithPrices(
  eventId: string,
  options?: ClientOptions
): Promise<EventWithPrices | null> {
  const client = getClient(options);
  const event = await getEventById(eventId, { client });
  if (!event) {
    return null;
  }

  const prices = await calculateAllPrices(eventId, client);
  const volume = event.outcomes.reduce((sum, outcome) => {
    return sum + parseNumeric(outcome.total_staked ?? 0);
  }, 0);

  return {
    ...event,
    prices,
    volume,
  };
}

export async function searchEvents(
  query: string,
  options?: ClientOptions
): Promise<EventWithOutcomes[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return getOpenEvents('all', options);
  }

  const client = getClient(options);
  const { data, error } = await client
    .from('events')
    .select('*')
    .eq('status', 'open')
    .or(`title.ilike.%${trimmed}%,description.ilike.%${trimmed}%`)
    .order('close_time', { ascending: true });

  if (error || !data) {
    return [];
  }

  const eventIds = data.map((event) => event.id);
  if (eventIds.length === 0) {
    return [];
  }

  const { data: outcomesData, error: outcomesError } = await client
    .from('outcomes')
    .select('*')
    .in('event_id', eventIds)
    .order('created_at', { ascending: true });

  if (outcomesError || !outcomesData) {
    return data.map((event) => ({ ...event, outcomes: [] }));
  }

  const outcomeMap = outcomesData.reduce<Record<string, EventWithOutcomes['outcomes']>>(
    (acc, outcome) => {
      const existing = acc[outcome.event_id] ?? [];
      existing.push(outcome);
      acc[outcome.event_id] = existing;
      return acc;
    },
    {}
  );

  return data.map((event) => ({
    ...event,
    outcomes: outcomeMap[event.id] ?? [],
  }));
}

export function getEventCategories(): EventCategory[] {
  return ['all', 'politics', 'sports', 'crypto', 'weather', 'culture'];
}

export async function calculateEventVolume(
  eventId: string,
  options?: ClientOptions
): Promise<number> {
  const client = getClient(options);
  const { data, error } = await client
    .from('outcomes')
    .select('total_staked')
    .eq('event_id', eventId);

  if (error || !data) {
    return 0;
  }

  return data.reduce((sum, outcome) => sum + parseNumeric(outcome.total_staked), 0);
}

export function subscribeToOutcomeUpdates(
  eventId: string,
  onUpdate: (prices: EventWithPrices['prices']) => void,
  options?: ClientOptions
) {
  const client = getClient(options);
  const channel = client
    .channel(`outcomes:${eventId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'outcomes', filter: `event_id=eq.${eventId}` },
      async () => {
        const prices = await calculateAllPrices(eventId, client);
        onUpdate(prices);
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
