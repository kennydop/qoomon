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

const outcomeSchema = z.object({
  label: z.string().min(1).max(120),
  initial_probability: z.number().min(0).max(1),
});

export const validateOutcomes = (
  outcomes: Array<z.infer<typeof outcomeSchema>>
): AdminResult<Array<z.infer<typeof outcomeSchema>>> => {
  if (outcomes.length < 2) {
    return {
      success: false,
      error: { code: 'validation_error', message: 'At least two outcomes are required' },
    };
  }

  const labels = outcomes.map((o) => o.label.toLowerCase());
  const hasDuplicates = new Set(labels).size !== labels.length;
  if (hasDuplicates) {
    return { success: false, error: { code: 'validation_error', message: 'Outcome labels must be unique' } };
  }

  const parsed = z.array(outcomeSchema).safeParse(outcomes);
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'validation_error', message: parsed.error.message, details: parsed.error.issues },
    };
  }

  const totalProb = parsed.data.reduce((sum, outcome) => sum + outcome.initial_probability, 0);
  if (totalProb <= 0) {
    return {
      success: false,
      error: { code: 'validation_error', message: 'Total probability must be greater than 0' },
    };
  }

  return { success: true, data: parsed.data };
};

export const normalizeOutcomeProbabilities = (
  outcomes: Array<z.infer<typeof outcomeSchema>>
): Array<z.infer<typeof outcomeSchema>> => {
  const total = outcomes.reduce((sum, outcome) => sum + (outcome.initial_probability ?? 0), 0);

  if (!total) {
    const equalProb = 1 / outcomes.length;
    return outcomes.map((outcome) => ({
      ...outcome,
      initial_probability: Number(equalProb.toFixed(4)),
    }));
  }

  return outcomes.map((outcome) => ({
    ...outcome,
    initial_probability: Number(((outcome.initial_probability ?? 0) / total || 0).toFixed(4)),
  }));
};

export const addOutcome = async (
  client: AdminClient,
  eventId: string,
  outcomeData: z.infer<typeof outcomeSchema>
): Promise<AdminResult<Tables<'outcomes'>['id']>> => {
  const parsed = outcomeSchema.safeParse(outcomeData);
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'validation_error', message: parsed.error.message, details: parsed.error.issues },
    };
  }

  const { data: event, error: eventError } = await client.from('events').select('status').eq('id', eventId).single();
  if (eventError || !event) {
    return { success: false, error: { code: 'event_not_found', message: 'Event not found', details: eventError } };
  }

  if (event.status !== 'open') {
    return {
      success: false,
      error: { code: 'event_closed', message: 'Cannot add outcomes to closed or settled events' },
    };
  }

  const { data: existingOutcomes, error: existingError } = await client
    .from('outcomes')
    .select('label')
    .eq('event_id', eventId);

  if (existingError) {
    return {
      success: false,
      error: { code: 'fetch_failed', message: existingError.message, details: existingError },
    };
  }

  const hasDuplicate = existingOutcomes?.some(
    (existing) => existing.label.toLowerCase() === parsed.data.label.toLowerCase()
  );
  if (hasDuplicate) {
    return {
      success: false,
      error: { code: 'duplicate_label', message: 'Outcome label already exists for this event' },
    };
  }

  const { data, error } = await client
    .from('outcomes')
    .insert({
      event_id: eventId,
      label: parsed.data.label,
      initial_probability: parsed.data.initial_probability,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: { code: 'insert_failed', message: error?.message ?? 'Unable to add outcome', details: error } };
  }

  return { success: true, data: data.id };
};

export const updateOutcomeProbability = async (
  client: AdminClient,
  outcomeId: string,
  probability: number
): Promise<AdminResult<Tables<'outcomes'>>> => {
  const parsed = z
    .number()
    .min(0)
    .max(1)
    .refine((val) => Number.isFinite(val), 'Probability must be finite')
    .safeParse(probability);

  if (!parsed.success) {
    return { success: false, error: { code: 'validation_error', message: parsed.error.message } };
  }

  const { count, error: betError } = await client
    .from('bets')
    .select('id', { count: 'exact', head: true })
    .eq('outcome_id', outcomeId);

  if (betError) {
    return { success: false, error: { code: 'bet_check_failed', message: betError.message, details: betError } };
  }

  if ((count ?? 0) > 0) {
    return { success: false, error: { code: 'bets_exist', message: 'Cannot update probability after bets are placed' } };
  }

  const { data, error } = await client
    .from('outcomes')
    .update({ initial_probability: parsed.data })
    .eq('id', outcomeId)
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: { code: 'update_failed', message: error?.message ?? 'Unable to update outcome', details: error } };
  }

  return { success: true, data };
};

export const getEventOutcomes = async (
  client: AdminClient,
  eventId: string
): Promise<AdminResult<Tables<'outcomes'>[]>> => {
  const { data, error } = await client
    .from('outcomes')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    return { success: false, error: { code: 'fetch_failed', message: error?.message ?? 'Unable to fetch outcomes', details: error } };
  }

  return { success: true, data };
};

export const outcomeSchemas = {
  outcomeSchema,
};
