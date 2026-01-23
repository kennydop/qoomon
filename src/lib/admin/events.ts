import { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import type { Database, Tables } from '@/lib/supabase/types';

type AdminClient = SupabaseClient<Database>;

type AdminError = {
  code: string;
  message: string;
  details?: unknown;
};

type AdminResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: AdminError;
    };

const categorySchema = z.enum(['politics', 'sports', 'crypto', 'weather', 'culture']);
const pricingSchema = z.enum(['lmsr', 'parimutuel']);

const closeTimeSchema = z.preprocess(
  (value) => (typeof value === 'string' || value instanceof Date ? new Date(value) : value),
  z
    .date()
    .refine((val) => val.getTime() > Date.now(), {
      message: 'close_time must be in the future',
    })
);

const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(3).max(500).optional(),
  category: categorySchema,
  pricing_model: pricingSchema,
  liquidity_parameter: z.number().positive().default(100),
  close_time: closeTimeSchema,
  status: z.enum(['open', 'closed', 'settled']).default('open'),
});

const updateEventSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(3).max(500).optional(),
  close_time: closeTimeSchema.optional(),
  liquidity_parameter: z.number().positive().optional(),
});

export type EventFilters = Partial<
  Pick<Tables<'events'>, 'status' | 'category'> & {
    pricing_model: Tables<'events'>['pricing_model'];
  }
>;

export const createEvent = async (
  client: AdminClient,
  eventData: z.infer<typeof createEventSchema>
): Promise<AdminResult<{ id: string }>> => {
  const parsed = createEventSchema.safeParse(eventData);

  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'validation_error', message: parsed.error.message, details: parsed.error.issues },
    };
  }

  const { data, error } = await client
    .from('events')
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      pricing_model: parsed.data.pricing_model,
      liquidity_parameter: parsed.data.liquidity_parameter,
      close_time: parsed.data.close_time.toISOString(),
      status: parsed.data.status,
    })
    .select('id')
    .single();

  if (error || !data) {
    return {
      success: false,
      error: {
        code: 'create_failed',
        message: error?.message ?? 'Unable to create event',
        details: error,
      },
    };
  }

  return { success: true, data: { id: data.id } };
};

export const updateEvent = async (
  client: AdminClient,
  eventId: string,
  updates: z.infer<typeof updateEventSchema>
): Promise<AdminResult<Tables<'events'>>> => {
  const parsedUpdates = updateEventSchema.safeParse(updates);

  if (!parsedUpdates.success) {
    return {
      success: false,
      error: {
        code: 'validation_error',
        message: parsedUpdates.error.message,
        details: parsedUpdates.error.issues,
      },
    };
  }

  const { data, error } = await client
    .from('events')
    .update({
      ...parsedUpdates.data,
      close_time: parsedUpdates.data.close_time?.toISOString(),
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error || !data) {
    return {
      success: false,
      error: {
        code: 'update_failed',
        message: error?.message ?? 'Unable to update event',
        details: error,
      },
    };
  }

  return { success: true, data };
};

export const closeEvent = async (
  client: AdminClient,
  eventId: string
): Promise<AdminResult<Tables<'events'>>> => {
  const { data: current, error: fetchError } = await client
    .from('events')
    .select('status,winning_outcome_id')
    .eq('id', eventId)
    .single();

  if (fetchError || !current) {
    return {
      success: false,
      error: {
        code: 'event_not_found',
        message: fetchError?.message ?? 'Event not found',
        details: fetchError,
      },
    };
  }

  if (current.status === 'settled') {
    return {
      success: false,
      error: { code: 'already_settled', message: 'Cannot close an already settled event' },
    };
  }

  if (current.status === 'closed') {
    return {
      success: false,
      error: { code: 'already_closed', message: 'Event is already closed' },
    };
  }

  const { data, error } = await client
    .from('events')
    .update({
      status: 'closed',
      close_time: new Date().toISOString(),
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error || !data) {
    return {
      success: false,
      error: {
        code: 'close_failed',
        message: error?.message ?? 'Unable to close event',
        details: error,
      },
    };
  }

  return { success: true, data };
};

export const getEventDetails = async (
  client: AdminClient,
  eventId: string
): Promise<AdminResult<unknown>> => {
  const { data, error } = await client.rpc('get_event_with_outcomes', { p_event_id: eventId });

  if (error) {
    return {
      success: false,
      error: {
        code: 'fetch_failed',
        message: error.message,
        details: error,
      },
    };
  }

  return { success: true, data };
};

export const listEvents = async (
  client: AdminClient,
  filters: EventFilters = {}
): Promise<AdminResult<Tables<'events'>[]>> => {
  let query = client.from('events').select('*');

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  if (filters.pricing_model) {
    query = query.eq('pricing_model', filters.pricing_model);
  }

  const { data, error } = await query.order('close_time', { ascending: true });

  if (error || !data) {
    return {
      success: false,
      error: {
        code: 'list_failed',
        message: error?.message ?? 'Unable to list events',
        details: error,
      },
    };
  }

  return { success: true, data };
};

export const eventSchemas = {
  createEventSchema,
  updateEventSchema,
  categorySchema,
  pricingSchema,
};
