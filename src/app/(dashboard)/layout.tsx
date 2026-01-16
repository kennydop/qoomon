'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { signOut } = useAuth();
  const pathname = usePathname();

  const handleLogout = React.useCallback(async () => {
    await signOut();
  }, [signOut]);

  const subtitle = React.useMemo(() => {
    if (pathname?.startsWith('/markets/')) {
      return 'Market details';
    }
    if (pathname === '/markets') {
      return 'Bet on real-world events';
    }
    if (pathname === '/wallet') {
      return 'Wallet dashboard';
    }
    return 'Qoomon dashboard';
  }, [pathname]);

  const navLinks = [
    { href: '/markets', label: 'Markets' },
    { href: '/wallet', label: 'Wallet' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="layout flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="space-y-1">
            <p className="text-lg font-semibold text-[var(--color-primary-700)]">
              Qoomon
            </p>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
              {subtitle}
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-full px-3 py-2 transition',
                    isActive
                      ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)] shadow-[0_8px_20px_rgba(99,102,241,0.2)]'
                      : 'hover:text-[var(--color-primary-600)]'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <span className="rounded-full border border-slate-200 px-3 py-2 text-slate-400">
              Portfolio (soon)
            </span>
          </nav>
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
