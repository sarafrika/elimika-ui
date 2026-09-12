'use client';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ScheduleDateInput } from './ScheduleDateInput';
import { REGISTRATION_WINDOW_HINT, type RegistrationWindowErrors } from './class-form-shared';

/**
 * The registration window — required on every class, and rendered outside the
 * schedule-mode switch so it is present whichever way the sessions are laid out.
 *
 * It used to live inside {@link StandardSchedule} with an opt-out "continuous
 * registration" checkbox, which meant a class built from picked dates or an
 * academic period never got asked for one at all.
 */
export function RegistrationWindow({
  start,
  onStartChange,
  end,
  onEndChange,
  errors,
  idPrefix = 'registration',
  className,
}: {
  start: string;
  onStartChange: (value: string) => void;
  end: string;
  onEndChange: (value: string) => void;
  errors?: RegistrationWindowErrors;
  /** Set when more than one of these can be on the page at once. */
  idPrefix?: string;
  className?: string;
}) {
  const startId = `${idPrefix}-opens`;
  const endId = `${idPrefix}-closes`;

  return (
    <div className={cn('space-y-2', className)}>
      <div className='text-sm font-semibold'>Registration window *</div>
      <div className='text-muted-foreground text-xs'>{REGISTRATION_WINDOW_HINT}</div>
      <div className='grid gap-3 sm:max-w-md sm:grid-cols-2'>
        <div className='space-y-1'>
          <Label htmlFor={startId} className='text-xs'>
            Registration opens *
          </Label>
          <ScheduleDateInput
            id={startId}
            aria-required
            value={start}
            aria-invalid={Boolean(errors?.start)}
            aria-describedby={errors?.start ? `${startId}-error` : undefined}
            onValueChange={onStartChange}
          />
          {errors?.start ? (
            <p id={`${startId}-error`} className='text-destructive text-[11px]'>
              {errors.start}
            </p>
          ) : null}
        </div>
        <div className='space-y-1'>
          <Label htmlFor={endId} className='text-xs'>
            Registration closes *
          </Label>
          <ScheduleDateInput
            id={endId}
            min={start}
            aria-required
            value={end}
            aria-invalid={Boolean(errors?.end)}
            aria-describedby={errors?.end ? `${endId}-error` : undefined}
            onValueChange={onEndChange}
          />
          {errors?.end ? (
            <p id={`${endId}-error`} className='text-destructive text-[11px]'>
              {errors.end}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
