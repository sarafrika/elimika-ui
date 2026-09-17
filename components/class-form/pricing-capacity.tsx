'use client';

import { TriangleAlert } from 'lucide-react';
import { type ReactNode, useId } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { formatRateAmount, getRateBasis, type RateBasis } from '@/lib/rate-card';
import {
  billableUnits,
  num,
  priceAndPayIssue,
  type ScheduleTotals,
  unitsLabel,
} from './class-form-shared';

function AmountInput({
  id,
  currency,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  id: string;
  currency: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
  describedBy: string;
}) {
  return (
    <div className='relative'>
      <span className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-medium'>
        {currency}
      </span>
      <Input
        id={id}
        type='number'
        inputMode='decimal'
        min={0}
        step='0.01'
        value={value}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onChange={event => onChange(event.target.value)}
        className='pl-12 tabular-nums'
      />
    </div>
  );
}

function TotalCell({ label, amount, detail }: { label: string; amount: string; detail: string }) {
  return (
    <div className='border-border/60 bg-muted/20 rounded-md border px-3 py-2.5'>
      <p className='text-muted-foreground text-xs tracking-wide uppercase'>{label}</p>
      <p className='text-foreground mt-1 text-base font-semibold tabular-nums'>{amount}</p>
      <p className='text-muted-foreground text-xs'>{detail}</p>
    </div>
  );
}

/** Sale price and instructor pay per unit of the basis, capacity, and what the schedule totals. */
export function PricingCapacity({
  basis,
  approvedRate,
  currency,
  salePrice,
  onSalePriceChange,
  instructorPay,
  onInstructorPayChange,
  maxParticipants,
  onMaxChange,
  allowWaitlist,
  onAllowWaitlistChange,
  totals,
  payHint = 'Instructors can be hired only if their approved rate fits under this.',
  children,
}: {
  basis: RateBasis;
  approvedRate?: number | null;
  currency?: string | null;
  salePrice: string;
  onSalePriceChange: (value: string) => void;
  instructorPay: string;
  onInstructorPayChange: (value: string) => void;
  maxParticipants: string;
  onMaxChange: (value: string) => void;
  allowWaitlist: boolean;
  onAllowWaitlistChange: (value: boolean) => void;
  totals: ScheduleTotals;
  payHint?: ReactNode;
  /** Extra capacity fields, e.g. target groups. */
  children?: ReactNode;
}) {
  const fieldId = useId();
  const { unit } = getRateBasis(basis);
  const money = currency || 'KES';
  const issue = priceAndPayIssue({ salePrice, instructorPay, approvedRate, basis, currency });
  const shownIssue = issue && !issue.incomplete ? issue.message : null;
  const saleInvalid = Boolean(shownIssue?.startsWith('Sale price'));
  const payInvalid = Boolean(shownIssue?.startsWith('Instructor pay'));

  const units = billableUnits(basis, totals);
  const sale = num(salePrice) ?? 0;
  const pay = num(instructorPay) ?? 0;
  const margin = Math.max(sale - pay, 0);
  const perUnits = unitsLabel(units, basis);

  return (
    <div className='flex min-w-0 flex-col gap-5'>
      <div className='grid gap-4 md:grid-cols-3'>
        <div className='flex min-w-0 flex-col gap-2'>
          <Label htmlFor={`${fieldId}-sale`}>Sale price per {unit}</Label>
          <AmountInput
            id={`${fieldId}-sale`}
            currency={money}
            value={salePrice}
            onChange={onSalePriceChange}
            invalid={saleInvalid}
            describedBy={`${fieldId}-sale-hint`}
          />
          <p id={`${fieldId}-sale-hint`} className='text-muted-foreground text-xs'>
            {typeof approvedRate === 'number'
              ? `At least ${formatRateAmount(approvedRate, currency)}, your approved rate.`
              : 'What each learner pays.'}
          </p>
        </div>

        <div className='flex min-w-0 flex-col gap-2'>
          <Label htmlFor={`${fieldId}-pay`}>Instructor pay per {unit}</Label>
          <AmountInput
            id={`${fieldId}-pay`}
            currency={money}
            value={instructorPay}
            onChange={onInstructorPayChange}
            invalid={payInvalid}
            describedBy={`${fieldId}-pay-hint`}
          />
          <p id={`${fieldId}-pay-hint`} className='text-muted-foreground text-xs'>
            {payHint}
          </p>
        </div>

        <div className='flex min-w-0 flex-col gap-2'>
          <Label htmlFor={`${fieldId}-max`}>Max participants</Label>
          <Input
            id={`${fieldId}-max`}
            type='number'
            inputMode='numeric'
            min={1}
            value={maxParticipants}
            onChange={event => onMaxChange(event.target.value)}
          />
          <div className='flex items-center gap-2'>
            <Switch
              id={`${fieldId}-waitlist`}
              checked={allowWaitlist}
              onCheckedChange={onAllowWaitlistChange}
            />
            <Label htmlFor={`${fieldId}-waitlist`} className='font-normal'>
              Allow a waitlist
            </Label>
          </div>
        </div>
      </div>

      {children}

      {shownIssue ? (
        <div
          role='alert'
          className='border-destructive/50 bg-destructive/10 text-foreground flex items-start gap-2 rounded-md border p-3 text-sm'
        >
          <TriangleAlert className='text-destructive mt-0.5 size-4 shrink-0' />
          <span>{shownIssue}</span>
        </div>
      ) : null}

      <div className='grid gap-3 sm:grid-cols-3'>
        <TotalCell
          label='Each learner pays'
          amount={formatRateAmount(sale * units, currency)}
          detail={`${formatRateAmount(sale, currency)} × ${perUnits}`}
        />
        <TotalCell
          label='Instructor earns'
          amount={formatRateAmount(pay * units, currency)}
          detail={`${formatRateAmount(pay, currency)} × ${perUnits}`}
        />
        <TotalCell
          label='Your margin per learner'
          amount={formatRateAmount(margin * units, currency)}
          detail={`${formatRateAmount(margin, currency)} × ${perUnits}`}
        />
      </div>
    </div>
  );
}
