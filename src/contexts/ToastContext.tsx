'use client';

import * as React from 'react';

import Toast, { type ToastVariant } from '@/components/ui/Toast';

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextType = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

const createToast = (message: string, variant: ToastVariant): ToastItem => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  message,
  variant,
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const showToast = React.useCallback((message: string, variant: ToastVariant = 'info') => {
    setToasts((prev) => [...prev, createToast(message, variant)]);
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-24 right-4 left-4 md:bottom-4 md:left-auto z-50 flex flex-col gap-3 md:w-[320px]">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            variant={toast.variant}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
