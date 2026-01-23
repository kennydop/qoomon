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

const uuidSchema = z.string().uuid();

export const validateSettlement = async (
  client: AdminClient,
  eventId: string,
  outcomeId: string
): Promise<AdminResult<{ event: Tables<'events'>; outcome: Tables<'outcomes'> }>> => {
  const parsedEvent = uuidSchema.safeParse(eventId);
  const parsedOutcome = uuidSchema.safeParse(outcomeId);

  if (!parsedEvent.success || !parsedOutcome.success) {
    return {
      success: false,
      error: { code: 'validation_error', message: 'Invalid event or outcome id' },
    };
  }

  const { data: event, error: eventError } = await client
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    return { success: false, error: { code: 'event_not_found', message: 'Event not found', details: eventError } };
  }

  if (event.status !== 'closed') {
    return {
      success: false,
      error: { code: 'event_open', message: 'Event must be closed before settlement' },
    };
  }

  if (event.winning_outcome_id) {
    return {
      success: false,
      error: { code: 'already_settled', message: 'Event already settled' },
    };
  }

  const { data: outcome, error: outcomeError } = await client
    .from('outcomes')
    .select('*')
    .eq('id', outcomeId)
    .single();

  if (outcomeError || !outcome) {
    return { success: false, error: { code: 'outcome_not_found', message: 'Outcome not found', details: outcomeError } };
  }

  if (outcome.event_id !== event.id) {
    return {
      success: false,
      error: { code: 'mismatched_outcome', message: 'Outcome does not belong to event' },
    };
  }

  return { success: true, data: { event, outcome } };
};

export const settleEvent = async (
  client: AdminClient,
  eventId: string,
  winningOutcomeId: string
): Promise<AdminResult<{ settled: number }>> => {
  const validation = await validateSettlement(client, eventId, winningOutcomeId);
  if (!validation.success) return validation;

  const { data, error } = await client.rpc('settle_event', {
    p_event_id: eventId,
    p_winning_outcome_id: winningOutcomeId,
  });

  if (error) {
    return { success: false, error: { code: 'settle_failed', message: error.message, details: error } };
  }

  return { success: true, data: { settled: data ?? 0 } };
};

type SettlementOutcomeSummary = {
  outcome_id: string;
  label: string;
  open_bets: number;
  won_bets: number;
  lost_bets: number;
  total_staked: number;
  total_payout: number;
};

export type SettlementSummary = {
  event_id: string;
  outcomes: SettlementOutcomeSummary[];
};

export const getSettlementSummary = async (
  client: AdminClient,
  eventId: string
): Promise<AdminResult<SettlementSummary>> => {
  const parsedEvent = uuidSchema.safeParse(eventId);
  if (!parsedEvent.success) {
    return { success: false, error: { code: 'validation_error', message: 'Invalid event id' } };
  }

  const { data: outcomes, error: outcomesError } = await client
    .from('outcomes')
    .select('id,label')
    .eq('event_id', eventId);

  if (outcomesError || !outcomes) {
    return {
      success: false,
      error: { code: 'fetch_failed', message: outcomesError?.message ?? 'Unable to fetch outcomes', details: outcomesError },
    };
  }

  const outcomeIds = outcomes.map((o) => o.id);
  if (outcomeIds.length === 0) {
    return {
      success: false,
      error: { code: 'no_outcomes', message: 'No outcomes found for event' },
    };
  }

  const { data: bets, error: betsError } = await client
    .from('bets')
    .select('outcome_id,status,stake,payout_amount')
    .in('outcome_id', outcomeIds);

  if (betsError || !bets) {
    return {
      success: false,
      error: { code: 'bets_fetch_failed', message: betsError?.message ?? 'Unable to fetch bets', details: betsError },
    };
  }

  const summaries = outcomes.map<SettlementOutcomeSummary>((outcome) => {
    const related = bets.filter((bet) => bet.outcome_id === outcome.id);
    const open_bets = related.filter((bet) => bet.status === 'open').length;
    const won_bets = related.filter((bet) => bet.status === 'won').length;
    const lost_bets = related.filter((bet) => bet.status === 'lost').length;
    const total_staked = related.reduce((sum, bet) => sum + Number(bet.stake), 0);
    const total_payout = related.reduce((sum, bet) => sum + Number(bet.payout_amount ?? 0), 0);

    return {
      outcome_id: outcome.id,
      label: outcome.label,
      open_bets,
      won_bets,
      lost_bets,
      total_staked,
      total_payout,
    };
  });

  return { success: true, data: { event_id: eventId, outcomes: summaries } };
};
