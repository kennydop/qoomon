'use client';

import * as React from 'react';

import ModeToggle from '@/components/wallet/ModeToggle';
import TransactionHistory from '@/components/wallet/TransactionHistory';
import WalletBalance from '@/components/wallet/WalletBalance';
import Skeleton from '@/components/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import type { WalletMode } from '@/types/wallet';
import { useRouter } from 'next/navigation';

const BalanceSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2">
    {[...Array(2)].map((_, index) => (
      <Skeleton key={index} className="h-36 rounded-3xl" />
    ))}
  </div>
);

export default function WalletPage() {
  const { user, loading, userProfile } = useAuth();
  const router = useRouter();
  const [mode, setMode] = React.useState<WalletMode>('paper');

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem('walletMode') as WalletMode | null;
    if (stored) {
      setMode(stored);
    }
  }, []);

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [loading, router, user]);

  const handleModeChange = (next: WalletMode) => {
    setMode(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('walletMode', next);
    }
  };

  const paperBalance = Number(userProfile?.paper_balance ?? 0);
  const liveBalance = Number(userProfile?.live_balance ?? 0);

  const isProfileReady = Boolean(userProfile);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="h1">Wallet</p>
            <p className="text-sm text-slate-500">
              Track your balances and recent activity.
            </p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Powered by Qoomon
          </p>
        </div>

        <div className="mt-6">
          <ModeToggle currentMode={mode} onChange={handleModeChange} />
        </div>

        <div className="mt-8">
          {isProfileReady ? (
            <WalletBalance
              currentMode={mode}
              paperBalance={paperBalance}
              liveBalance={liveBalance}
            />
          ) : (
            <BalanceSkeleton />
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {['Deposit', 'Withdraw'].map((label) => (
            <button
              key={label}
              type="button"
              disabled
              title={`${label} coming soon`}
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {user?.id ? (
        <TransactionHistory userId={user.id} mode={mode} limit={12} />
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <Skeleton className="h-60 rounded-3xl" />
        </section>
      )}
    </div>
  );
}
