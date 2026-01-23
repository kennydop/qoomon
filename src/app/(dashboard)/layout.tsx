'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LogOut, TrendingUp, User, Wallet } from 'lucide-react';

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

  const navItems = [
    { href: '/markets', label: 'Markets', icon: Home },
    { href: '/portfolio', label: 'Portfolio', icon: TrendingUp },
    { href: '/wallet', label: 'Wallet', icon: Wallet },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-dark-green)] to-slate-900 text-white pb-20 md:pb-0">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--color-bg-dark-green)]/95 backdrop-blur-sm md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-lg font-bold text-[var(--color-primary-400)]">
              Qoomon
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden border-b border-white/10 bg-[var(--color-bg-dark-green)]/95 backdrop-blur-sm md:block">
        <div className="layout flex items-center justify-between py-4">
          <div className="space-y-1">
            <p className="text-xl font-bold text-[var(--color-primary-400)]">
              Qoomon
            </p>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">
              Prediction Markets
            </p>
          </div>
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] transition-all duration-200',
                    isActive
                      ? 'bg-[var(--color-primary-600)] text-white shadow-lg shadow-[var(--color-primary-600)]/30'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/20"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="layout py-4 md:py-6">{children}</main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[var(--color-bg-dark-green)]/98 backdrop-blur-md md:hidden">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl px-3 py-2.5 transition-all duration-200',
                  isActive
                    ? 'bg-[var(--color-primary-600)] text-white shadow-lg shadow-[var(--color-primary-600)]/40'
                    : 'text-white/60 active:bg-white/10'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'animate-in zoom-in-50 duration-200')} />
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
