'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import AuthButton from '@/components/auth/AuthButton';
import AuthForm from '@/components/auth/AuthForm';
import PhoneInput from '@/components/auth/PhoneInput';
import { handleAuthError } from '@/lib/utils/errors';
import { validateGhanaPhone } from '@/lib/utils/phone';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!validateGhanaPhone(phone)) {
      setError('Enter a valid Ghana phone number.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to log in.');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(handleAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm title='Welcome back' subtitle='Log in with your phone number.' onSubmit={handleSubmit}>
      <PhoneInput value={phone} onChange={setPhone} error={error ?? undefined} />
      <div>
        <label className='mb-2 block text-sm font-medium text-white'>Password</label>
        <input
          type='password'
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder='Enter your password'
          autoComplete='current-password'
          className='w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm text-white shadow-xs placeholder:text-white/60 focus:border-purple-300 focus:outline-hidden focus:ring-2 focus:ring-purple-300'
        />
        <div className='mt-2 text-right'>
          <a href='#' className='text-xs text-white/70 underline'>
            Forgot password?
          </a>
        </div>
      </div>
      {error ? <p className='text-sm text-red-200'>{error}</p> : null}
      <AuthButton type='submit' isLoading={loading} disabled={loading}>
        Log in
      </AuthButton>
      <p className='text-center text-sm text-white/80'>
        Need an account?{' '}
        <a href='/auth/signup' className='font-semibold text-white underline'>
          Sign up
        </a>
      </p>
    </AuthForm>
  );
}
