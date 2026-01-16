import type { SupabaseClient } from '@supabase/supabase-js';

import browserClient from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import type { WalletMode, BalanceInfo } from '@/types/wallet';
import {
  recordLedgerEntry,
  recordTransfer,
  type LedgerClientOptions,
  type LedgerRecordPayload,
  type LedgerTransactionType,
  type TransferOptions,
  type TransferResult,
} from '@/lib/services/ledger';

const WALLET_MODE_STORAGE_KEY = 'qoomon-wallet-mode';

type ClientOptions = {
  client?: SupabaseClient<Database>;
};

const getClient = (options?: ClientOptions) => options?.client ?? browserClient;

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

export const DEFAULT_WALLET_MODE: WalletMode = 'paper';

export function getStoredWalletMode(
  fallback: WalletMode = DEFAULT_WALLET_MODE
): WalletMode {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const stored = window.localStorage.getItem(WALLET_MODE_STORAGE_KEY) as
    | WalletMode
    | null;
  return stored ?? fallback;
}

export function setStoredWalletMode(mode: WalletMode) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(WALLET_MODE_STORAGE_KEY, mode);
}

export async function getBalance(
  userId: string,
  mode: WalletMode,
  options?: ClientOptions
): Promise<number> {
  const column = mode === 'paper' ? 'paper_balance' : 'live_balance';
  const { data, error } = await getClient(options)
    .from('users')
    .select(column)
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return 0;
  }

  return parseAmount(data[column] ?? 0);
}

export async function getBothBalances(
  userId: string,
  options?: ClientOptions
): Promise<BalanceInfo> {
  const { data, error } = await getClient(options)
    .from('users')
    .select('paper_balance, live_balance')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return { paper: 0, live: 0 };
  }

  return {
    paper: parseAmount(data.paper_balance),
    live: parseAmount(data.live_balance),
  };
}

export async function hasInsufficientBalance(
  userId: string,
  mode: WalletMode,
  amount: number,
  options?: ClientOptions
): Promise<boolean> {
  const balance = await getBalance(userId, mode, options);
  return amount > balance;
}

export function formatBalance(balance: string | number | null | undefined) {
  const parsed = parseAmount(balance);
  return `GHS ${decimalFormatter.format(parsed)}`;
}

export async function applyTransaction(
  userId: string,
  mode: WalletMode,
  amount: number,
  transactionType: LedgerTransactionType,
  payload?: LedgerRecordPayload,
  options?: LedgerClientOptions
): Promise<number> {
  return recordLedgerEntry(userId, mode, amount, transactionType, payload, options);
}

export async function transferBalance(
  userId: string,
  fromMode: WalletMode,
  toMode: WalletMode,
  amount: number,
  options?: TransferOptions
): Promise<TransferResult> {
  return recordTransfer(userId, fromMode, toMode, amount, options);
}
