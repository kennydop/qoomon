'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

type OTPInputProps = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string;
};

const OTP_LENGTH = 6;

export default function OTPInput({ value, onChange, onComplete, error }: OTPInputProps) {
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('');

  const focusInput = (index: number) => {
    inputsRef.current[index]?.focus();
  };

  const handleChange = (index: number, nextValue: string) => {
    const sanitized = nextValue.replace(/\D/g, '');
    if (!sanitized) return;

    const nextDigits = value.split('');
    nextDigits[index] = sanitized[0];
    const nextOtp = nextDigits.join('').slice(0, OTP_LENGTH);

    onChange(nextOtp);

    if (index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const nextDigits = value.split('');
      nextDigits[index] = '';
      const nextOtp = nextDigits.join('').slice(0, OTP_LENGTH);
      onChange(nextOtp);

      if (index > 0 && !value[index]) {
        focusInput(index - 1);
      }
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;

    onChange(pasted);
    if (pasted.length === OTP_LENGTH) {
      onComplete?.(pasted);
    }
  };

  React.useEffect(() => {
    if (value.length === OTP_LENGTH) {
      onComplete?.(value);
    }
  }, [onComplete, value]);

  return (
    <div className='w-full'>
      <label className='mb-2 block text-sm font-medium text-white'>Verification Code</label>
      <div className='flex gap-2'>
        {digits.map((digit, index) => (
          <input
            key={`otp-${index}`}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type='text'
            inputMode='numeric'
            autoComplete='one-time-code'
            maxLength={1}
            value={digit === ' ' ? '' : digit}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            className={cn(
              'h-12 w-11 rounded-md border text-center text-lg text-white',
              'bg-white/10 focus:border-purple-300 focus:outline-hidden focus:ring-2 focus:ring-purple-300',
              error ? 'border-red-400' : 'border-white/30'
            )}
            aria-label={`OTP digit ${index + 1}`}
          />
        ))}
      </div>
      {error ? <p className='mt-2 text-xs text-red-200'>{error}</p> : null}
    </div>
  );
}
