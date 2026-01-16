'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

import AuthButton from '@/components/auth/AuthButton';
import AuthForm from '@/components/auth/AuthForm';
import OTPInput from '@/components/auth/OTPInput';
import { handleAuthError } from '@/lib/utils/errors';

const RESEND_DELAY = 60;

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') ?? '';

  const [otp, setOtp] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(RESEND_DELAY);

  React.useEffect(() => {
    setResendTimer(RESEND_DELAY);
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [phone]);

  const handleVerify = async (token: string) => {
    if (!phone) {
      setError('Missing phone number. Please return to signup.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, token }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to verify code.');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(handleAuthError(err));
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    const storedPassword = sessionStorage.getItem('signup_password');
    if (!storedPassword) {
      setError('Please return to signup to request a new code.');
      return;
    }

    setError(null);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          password: storedPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to resend code.');
      }

      setResendTimer(RESEND_DELAY);
    } catch (err) {
      setError(handleAuthError(err));
    }
  };

  return (
    <AuthForm
      title='Verify your phone'
      subtitle='Enter the 6-digit code sent to your phone.'
    >
      <div className='text-sm text-white/80'>
        Code sent to <span className='font-semibold text-white'>{phone}</span>
      </div>
      <OTPInput value={otp} onChange={setOtp} onComplete={handleVerify} error={error ?? undefined} />
      {error ? <p className='text-sm text-red-200'>{error}</p> : null}
      <AuthButton
        type='button'
        isLoading={loading}
        disabled={loading || otp.length !== 6}
        onClick={() => handleVerify(otp)}
      >
        Verify
      </AuthButton>
      <button
        type='button'
        onClick={handleResend}
        disabled={resendTimer > 0}
        className='text-sm text-white/80 underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60'
      >
        {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
      </button>
    </AuthForm>
  );
}
