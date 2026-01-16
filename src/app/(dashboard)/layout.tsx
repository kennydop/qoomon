'use client';

import * as React from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { signOut } = useAuth();

  const handleLogout = React.useCallback(async () => {
    await signOut();
  }, [signOut]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="layout flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="text-lg font-semibold text-[var(--color-primary-700)]">
              Qoomon
            </p>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
              Wallet dashboard
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'rounded-2xl border border-transparent px-4 py-2 text-sm font-semibold transition',
              'bg-[var(--color-primary-500)] text-white shadow-lg shadow-[var(--color-primary-500)/25] hover:bg-[var(--color-primary-600)]'
            )}
          >
            Logout
          </button>
        </div>
      </header>
      <main className="layout py-6">{children}</main>
    </div>
  );
}
