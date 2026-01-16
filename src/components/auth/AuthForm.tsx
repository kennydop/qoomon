import * as React from 'react';

import { cn } from '@/lib/utils';

type AuthFormProps = {
  title: string;
  subtitle?: string;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
};

export default function AuthForm({ title, subtitle, onSubmit, children }: AuthFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'w-full max-w-md rounded-2xl bg-gradient-to-br from-purple-600/80 via-purple-700/70 to-purple-900/80',
        'px-6 py-8 text-white shadow-xl backdrop-blur-sm'
      )}
    >
      <div className='mb-8 flex flex-col items-center text-center'>
        <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20'>
          <img src='/svg/Logo.svg' alt='Qoomon' className='h-8 w-8' />
        </div>
        <h1 className='text-2xl font-semibold'>{title}</h1>
        {subtitle ? <p className='mt-2 text-sm text-white/80'>{subtitle}</p> : null}
      </div>
      <div className='space-y-5'>{children}</div>
    </form>
  );
}
