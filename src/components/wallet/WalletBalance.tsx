'use client';

import { Banknote, Wallet } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatBalance } from '@/lib/services/wallet';
import type { WalletMode } from '@/types/wallet';

type WalletBalanceProps = {
  paperBalance: number;
  liveBalance: number;
  currentMode: WalletMode;
};

const cardBase =
  'flex flex-col justify-between gap-3 rounded-3xl border p-6 shadow-sm transition duration-200';

export default function WalletBalance({
  paperBalance,
  liveBalance,
  currentMode,
}: WalletBalanceProps) {
  const cards = [
    {
      mode: 'paper' as const,
      label: 'Paper Mode',
      balance: paperBalance,
      icon: Wallet,
    },
    {
      mode: 'live' as const,
      label: 'Live Mode',
      balance: liveBalance,
      icon: Banknote,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map(({ mode, label, balance, icon: Icon }) => {
        const isActive = currentMode === mode;
        return (
          <div
            key={mode}
            className={cn(
              cardBase,
              isActive
                ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)] shadow-[0_10px_30px_rgba(98,0,238,0.15)]'
                : 'border-slate-200 bg-white text-slate-600'
            )}
            style={
              isActive
                ? {
                    boxShadow:
                      '0 20px 40px rgba(99, 102, 241, 0.2), inset 0 0 0 1px rgba(99, 102, 241, 0.3)',
                  }
                : undefined
            }
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  {label}
                </p>
                <p className="h1 mt-2 text-3xl">{formatBalance(balance)}</p>
              </div>

              <div
                className={cn(
                  'rounded-2xl p-3 text-white',
                  isActive ? 'bg-[var(--color-primary-500)]' : 'bg-slate-100 text-slate-500'
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
            </div>

            <p
              className={cn(
                'text-xs font-semibold tracking-wide',
                isActive ? 'text-[var(--color-primary-600)]' : 'text-slate-400'
              )}
            >
              {isActive ? 'Active' : 'Switch to see details'}
            </p>
          </div>
        );
      })}
    </div>
  );
}
