'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import AuthButton from '@/components/auth/AuthButton';
import AuthForm from '@/components/auth/AuthForm';
import PhoneInput from '@/components/auth/PhoneInput';
import { handleAuthError } from '@/lib/utils/errors';
import { validateGhanaPhone } from '@/lib/utils/phone';

export default function SignupPage() {
  const router = useRouter();
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!validateGhanaPhone(phone)) {
      setError('Enter a valid Ghana phone number.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          password,
          fullName: fullName.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to sign up.');
      }

      sessionStorage.setItem('signup_phone', phone);
      sessionStorage.setItem('signup_password', password);

      router.push(`/auth/verify-otp?phone=${encodeURIComponent(phone)}`);
    } catch (err) {
      setError(handleAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      title='Create your account'
      subtitle='Verify with an SMS code to get started.'
      onSubmit={handleSubmit}
    >
      <PhoneInput value={phone} onChange={setPhone} error={error ?? undefined} />
      <div>
        <label className='mb-2 block text-sm font-medium text-white'>Full Name</label>
        <input
          type='text'
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder='Optional'
          className='w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm text-white shadow-xs placeholder:text-white/60 focus:border-purple-300 focus:outline-hidden focus:ring-2 focus:ring-purple-300'
        />
      </div>
      <div>
        <label className='mb-2 block text-sm font-medium text-white'>Password</label>
        <input
          type='password'
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder='At least 8 characters'
          autoComplete='new-password'
          className='w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm text-white shadow-xs placeholder:text-white/60 focus:border-purple-300 focus:outline-hidden focus:ring-2 focus:ring-purple-300'
        />
      </div>
      {error ? <p className='text-sm text-red-200'>{error}</p> : null}
      <AuthButton type='submit' isLoading={loading} disabled={loading}>
        Sign up
      </AuthButton>
      <p className='text-center text-sm text-white/80'>
        Already have an account?{' '}
        <a href='/auth/login' className='font-semibold text-white underline'>
          Log in
        </a>
      </p>
    </AuthForm>
  );
}
