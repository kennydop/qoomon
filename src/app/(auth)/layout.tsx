import * as React from 'react';

type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <section className='min-h-screen bg-gradient-to-br from-purple-800 via-purple-900 to-slate-950'>
      <div className='mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-12'>
        {children}
      </div>
    </section>
  );
}
