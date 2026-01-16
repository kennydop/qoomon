'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import {
  formatTransactionAmount,
  getTransactionHistory,
  getTransactionIcon,
} from '@/lib/services/ledger';
import { formatBalance } from '@/lib/services/wallet';
import Skeleton from '@/components/Skeleton';
import type { WalletMode, TransactionDisplay } from '@/types/wallet';

type TransactionHistoryProps = {
  userId: string;
  mode?: WalletMode;
  limit?: number;
};

const amountColorMap: Record<TransactionDisplay['color'], string> = {
  green: 'text-emerald-600',
  red: 'text-rose-600',
  blue: 'text-sky-600',
  orange: 'text-orange-500',
  purple: 'text-violet-600',
};

const formatRelativeTime = (timestamp: string) => {
  const createdAt = new Date(timestamp).getTime();
  if (Number.isNaN(createdAt)) {
    return 'just now';
  }

  const diff = Date.now() - createdAt;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) {
    return 'moments ago';
  }
  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

export default function TransactionHistory({
  userId,
  mode,
  limit = 10,
}: TransactionHistoryProps) {
  const [transactions, setTransactions] = React.useState<TransactionDisplay[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    getTransactionHistory(userId, mode, limit)
      .then((data) => {
        if (!active) return;
        setTransactions(data);
      })
      .catch(() => {
        if (!active) return;
        setTransactions([]);
        setError('Unable to load transactions right now.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId, mode, limit]);

  const content = () => {
    if (loading) {
      return (
        <div className="space-y-3 pt-4">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      );
    }

    if (error) {
      return <p className="py-4 text-sm text-rose-500">{error}</p>;
    }

    if (!transactions.length) {
      return (
        <p className="py-6 text-center text-sm text-slate-500">
          Your transaction history will appear here once activity starts.
        </p>
      );
    }

    return (
      <ul className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {transactions.map((transaction) => {
          const Icon = getTransactionIcon(transaction.type);
          return (
            <li
              key={transaction.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-transparent bg-slate-50 px-3 py-3 transition hover:border-slate-200 hover:bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-3 text-slate-600 shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {transaction.typeLabel}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatRelativeTime(transaction.timestamp)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span
                  className={cn(
                    'text-sm font-semibold',
                    amountColorMap[transaction.color]
                  )}
                >
                  {formatTransactionAmount(
                    transaction.amount.toString(),
                    transaction.type
                  )}
                </span>
                <span className="text-xs text-slate-500">
                  Balance {formatBalance(transaction.balanceAfter)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <section className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-500">
            Recent Transactions
          </p>
          <p className="text-xs text-slate-400">Mode: {mode ?? 'all'}</p>
        </div>
      </header>
      {content()}
    </section>
  );
}
