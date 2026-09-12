'use client';

import { useId, useState, type ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { fmtDate } from './class-form-shared';

type ScheduleDateInputProps = Omit<
  ComponentProps<typeof Input>,
  'type' | 'value' | 'min' | 'onChange'
> & {
  value: string;
  min?: string;
  onValueChange: (value: string) => void;
};

/** Keep unfinished keyboard edits local; past dates must never enter form state. */
export function ScheduleDateInput({
  value,
  min,
  onValueChange,
  onBlur,
  ...props
}: ScheduleDateInputProps) {
  const errorId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const today = fmtDate(new Date());
  const minimum = min && min > today ? min : today;

  return (
    <>
      <Input
        {...props}
        type='date'
        min={minimum}
        value={draft ?? value}
        aria-invalid={error || props['aria-invalid']}
        aria-describedby={
          [props['aria-describedby'], error ? errorId : undefined].filter(Boolean).join(' ') ||
          undefined
        }
        onChange={event => {
          const next = event.currentTarget.value;
          const currentToday = fmtDate(new Date());
          const currentMinimum = min && min > currentToday ? min : currentToday;
          const invalid = Boolean(next && next < currentMinimum);
          // Reject the value without interrupting typing a multi-digit year.
          setDraft(invalid ? next : null);
          setError(invalid);
          onValueChange(invalid ? '' : next);
        }}
        onBlur={event => {
          if (draft !== null) {
            event.currentTarget.value = '';
            setDraft(null);
          }
          onBlur?.(event);
        }}
      />
      {error && (
        <p id={errorId} className='text-destructive text-[11px]' role='alert'>
          Choose a date on or after {minimum}.
        </p>
      )}
    </>
  );
}
