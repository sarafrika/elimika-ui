'use client';

import type * as React from 'react';
import PhoneInputBase, { type Country, type Value } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

import { cn } from '@/lib/utils';

export type PhoneInputProps = {
  value?: string | null;
  onChange?: (value: string | undefined) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Country whose dial code is offered first. */
  defaultCountry?: Country;
};

/**
 * Phone entry with a country selector, storing the E.164 form ("+254712345678")
 * so a number typed in one country reads back correctly in another.
 */
export function PhoneInput({
  value,
  onChange,
  onBlur,
  name,
  id,
  placeholder = 'Phone number',
  disabled,
  className,
  defaultCountry = 'KE',
}: PhoneInputProps) {
  return (
    <PhoneInputBase
      international
      countryCallingCodeEditable={false}
      defaultCountry={defaultCountry}
      value={(value ?? undefined) as Value | undefined}
      onChange={next => onChange?.(next || undefined)}
      onBlur={onBlur}
      name={name}
      id={id}
      placeholder={placeholder}
      disabled={disabled}
      numberInputProps={{
        className:
          'flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
      }}
      className={cn(
        'border-input flex h-9 w-full min-w-0 items-center gap-2 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm',
        'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
    />
  );
}

export { formatPhoneNumberIntl, isValidPhoneNumber } from 'react-phone-number-input';
