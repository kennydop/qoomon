'use client';

import * as React from 'react';
import { CheckCircle, Info, XCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'info';

type ToastProps = {
  message: string;
  variant: ToastVariant;
  onDismiss: () => void;
};

const variantStyles: Record<ToastVariant, { icon: React.ComponentType<{ className?: string }>; bg: string }> = {
  success: { icon: CheckCircle, bg: 'bg-gradient-to-r from-emerald-600 to-emerald-500' },
  error: { icon: XCircle, bg: 'bg-gradient-to-r from-rose-600 to-rose-500' },
  info: { icon: Info, bg: 'bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-primary-500)]' },
};

export default function Toast({ message, variant, onDismiss }: ToastProps) {
  const { icon: Icon, bg } = variantStyles[variant];

  React.useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(), 3000);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white shadow-2xl transition-all duration-300',
        'animate-in slide-in-from-bottom-4 md:slide-in-from-right-4',
        bg
      )}
      role="status"
    >
      <Icon className="h-4 w-4" />
      <span className="font-medium">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-auto text-xs uppercase tracking-[0.3em] text-white/80 transition hover:text-white"
      >
        Close
      </button>
    </div>
  );
}
