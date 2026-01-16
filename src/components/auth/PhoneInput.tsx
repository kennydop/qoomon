'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import {
  formatPhoneNumber,
  normalizePhoneInput,
  validateGhanaPhone,
} from '@/lib/utils/phone';

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

const formatDisplay = (value: string) => {
  const normalized = normalizePhoneInput(value);
  if (!normalized) return '';

  const digits = normalized.replace('+233', '');
  const part1 = digits.slice(0, 2);
  const part2 = digits.slice(2, 5);
  const part3 = digits.slice(5, 9);

  return `+233${part1 ? ` ${part1}` : ''}${part2 ? ` ${part2}` : ''}${
    part3 ? ` ${part3}` : ''
  }`.trim();
};

export default function PhoneInput({
  value,
  onChange,
  error,
  disabled,
}: PhoneInputProps) {
  const displayValue = formatDisplay(value);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    const normalized = normalizePhoneInput(inputValue);
    onChange(formatPhoneNumber(normalized));
  };

  const isInvalid = Boolean(error) || (value.length > 0 && !validateGhanaPhone(value));

  return (
    <div className='w-full'>
      <label className='mb-2 block text-sm font-medium text-white'>Phone Number</label>
      <div className='relative flex items-center'>
        <span
          className='absolute left-3 flex h-6 w-6 items-center justify-center rounded-full border border-white/30'
          aria-hidden='true'
        >
          <svg
            aria-hidden='true'
            viewBox='0 0 36 24'
            className='h-4 w-5 overflow-hidden rounded-sm'
          >
            <rect width='36' height='8' y='0' fill='#CE1126' />
            <rect width='36' height='8' y='8' fill='#FCD116' />
            <rect width='36' height='8' y='16' fill='#006B3F' />
            <path
              d='M18 9.5L19.4 13.2H23.3L20.1 15.4L21.4 19L18 16.8L14.6 19L15.9 15.4L12.7 13.2H16.6L18 9.5Z'
              fill='#000000'
            />
          </svg>
        </span>
        <input
          type='tel'
          inputMode='tel'
          autoComplete='tel'
          disabled={disabled}
          value={displayValue}
          onChange={handleChange}
          placeholder='+233 24 123 4567'
          className={cn(
            'w-full rounded-md border bg-white/10 px-10 py-2 text-sm text-white shadow-xs',
            'placeholder:text-white/60',
            'focus:border-purple-300 focus:outline-hidden focus:ring-2 focus:ring-purple-300',
            isInvalid ? 'border-red-400' : 'border-white/30',
            disabled && 'cursor-not-allowed opacity-60'
          )}
          aria-invalid={isInvalid}
          aria-describedby={error ? 'phone-error' : undefined}
        />
      </div>
      {error ? (
        <p id='phone-error' className='mt-2 text-xs text-red-200'>
          {error}
        </p>
      ) : null}
    </div>
  );
}
