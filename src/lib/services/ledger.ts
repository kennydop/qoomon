import type { Json } from '@/lib/supabase/types';
import type { LucideIcon } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';

import browserClient from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import type { WalletMode, TransactionDisplay } from '@/types/wallet';

import {
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingDown,
  Trophy,
  XCircle,
  DollarSign,
  Gift,
} from 'lucide-react';

export type LedgerClientOptions = {
  client?: SupabaseClient<Database>;
};

export type LedgerTransactionType =
  Database['public']['Tables']['ledger_entries']['Row']['transaction_type'];

export type LedgerRecordPayload = {
  metadata?: Json | null;
  referenceId?: string | null;
  referenceType?: string | null;
};

type TransactionMeta = {
  label: string;
  color: TransactionDisplay['color'];
  icon: LucideIcon;
  sign: '+' | '-';
};

const transactionMap: Record<string, TransactionMeta> = {
  deposit: {
    label: 'Deposit',
    color: 'green',
    icon: ArrowDownCircle,
    sign: '+',
  },
  withdrawal: {
    label: 'Withdrawal',
    color: 'red',
    icon: ArrowUpCircle,
    sign: '-',
  },
  bet_placed: {
    label: 'Bet Placed',
    color: 'orange',
    icon: TrendingDown,
    sign: '-',
  },
  bet_won: {
    label: 'Bet Won',
    color: 'green',
    icon: Trophy,
    sign: '+',
  },
  bet_lost: {
    label: 'Bet Lost',
    color: 'red',
    icon: XCircle,
    sign: '-',
  },
  cashout: {
    label: 'Cash Out',
    color: 'blue',
    icon: DollarSign,
    sign: '+',
  },
  signup_bonus: {
    label: 'Welcome Bonus',
    color: 'purple',
    icon: Gift,
    sign: '+',
  },
};

const decimalFormatter = new Intl.NumberFormat('en-GH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const parseAmount = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getClient = (options?: LedgerClientOptions) => options?.client ?? browserClient;

const mapToDisplay = (
  entry: Database['public']['Tables']['ledger_entries']['Row']
): TransactionDisplay => {
  const meta = transactionMap[entry.transaction_type] || {
    label: entry.transaction_type,
    color: 'blue' as const,
    icon: ArrowDownCircle,
    sign: '+',
  };

  const amount = parseAmount(entry.amount);
  const balanceAfter = parseAmount(entry.balance_after);
  const iconName =
    meta.icon.displayName ?? meta.icon.name ?? entry.transaction_type;

  return {
    id: entry.id,
    mode: entry.mode,
    type: entry.transaction_type,
    typeLabel: meta.label,
    amount,
    balanceAfter,
    timestamp: entry.created_at ?? new Date().toISOString(),
    icon: iconName,
    color: meta.color,
  };
};

export async function recordLedgerEntry(
  userId: string,
  mode: WalletMode,
  amount: number,
  transactionType: LedgerTransactionType,
  payload?: LedgerRecordPayload,
  options?: LedgerClientOptions
): Promise<number> {
  const client = getClient(options);

  const { data, error } = await client.rpc('update_user_balance', {
    p_user_id: userId,
    p_mode: mode,
    p_amount: amount,
    p_transaction_type: transactionType,
    p_reference_id: payload?.referenceId ?? null,
    p_reference_type: payload?.referenceType ?? null,
    p_metadata: payload?.metadata ?? null,
  });

  if (error) {
    console.error('Failed to record ledger entry', error);
    throw error;
  }

  return parseAmount(data);
}

export type TransferOptions = LedgerClientOptions & {
  metadata?: Json | null;
  debitMetadata?: Json | null;
  creditMetadata?: Json | null;
  referenceId?: string | null;
  referenceType?: string | null;
  debitTransactionType?: LedgerTransactionType;
  creditTransactionType?: LedgerTransactionType;
};

export interface TransferResult {
  fromBalance: number;
  toBalance: number;
}

export async function recordTransfer(
  userId: string,
  fromMode: WalletMode,
  toMode: WalletMode,
  amount: number,
  options?: TransferOptions
): Promise<TransferResult> {
  const absoluteAmount = Math.abs(amount);
  if (absoluteAmount <= 0) {
    throw new Error('Transfer amount must be greater than zero.');
  }

  if (fromMode === toMode) {
    throw new Error('Source and destination wallet modes must differ.');
  }

  const debitPayload: LedgerRecordPayload = {
    metadata: options?.debitMetadata ?? options?.metadata ?? null,
    referenceId: options?.referenceId ?? null,
    referenceType: options?.referenceType ?? null,
  };
  const creditPayload: LedgerRecordPayload = {
    metadata: options?.creditMetadata ?? options?.metadata ?? null,
    referenceId: options?.referenceId ?? null,
    referenceType: options?.referenceType ?? null,
  };
  const ledgerClientOptions: LedgerClientOptions = { client: options?.client };

  const fromBalance = await recordLedgerEntry(
    userId,
    fromMode,
    -absoluteAmount,
    options?.debitTransactionType ?? 'withdrawal',
    debitPayload,
    ledgerClientOptions
  );

  const toBalance = await recordLedgerEntry(
    userId,
    toMode,
    absoluteAmount,
    options?.creditTransactionType ?? 'deposit',
    creditPayload,
    ledgerClientOptions
  );

  return { fromBalance, toBalance };
}

export async function getTransactionHistory(
  userId: string,
  mode?: WalletMode,
  limit = 20,
  options?: LedgerClientOptions
): Promise<TransactionDisplay[]> {
  const query = getClient(options)
    .from('ledger_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (mode) {
    query.eq('mode', mode);
  }

  const { data = [], error } = await query;
  if (error) {
    console.error('Failed to fetch transactions', error);
    return [];
  }

  return data.map(mapToDisplay);
}

export async function getRecentTransactions(
  userId: string,
  limit = 10,
  options?: LedgerClientOptions
): Promise<TransactionDisplay[]> {
  return getTransactionHistory(userId, undefined, limit, options);
}

export function formatTransactionType(type: string) {
  return transactionMap[type]?.label ?? type.replace(/_/g, ' ');
}

export function getTransactionIcon(type: string): LucideIcon {
  return transactionMap[type]?.icon ?? ArrowDownCircle;
}

export function formatTransactionAmount(amount: string | number, type: string) {
  const parsed = parseAmount(amount);
  const meta = transactionMap[type];
  const sign = meta?.sign ?? '+';
  const absoluteAmount = Math.abs(parsed);
  return `${sign}GHS ${decimalFormatter.format(absoluteAmount)}`;
}
