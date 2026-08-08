'use client';

import { Coins, Wallet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  DEFAULT_RATE_BASIS,
  formatMoney,
  RATE_BASES,
  type RateBasis,
  rateBasisShort,
  rateBasisUnit,
} from './class-form-shared';

const parseAmount = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export function PricingCapacity({
  approvedFee,
  currency,
  salePrice,
  onSalePriceChange,
  instructorPay,
  onInstructorPayChange,
  maxParticipants,
  onMaxChange,
  allowWaitlist,
  onAllowWaitlistChange,
  totalSessions,
  totalMinutes,
  totalDays,
  rateBasis = DEFAULT_RATE_BASIS,
  onRateBasisChange,
}: {
  approvedFee?: number;
  currency?: string | null;
  salePrice: string;
  onSalePriceChange: (v: string) => void;
  instructorPay: string;
  onInstructorPayChange: (v: string) => void;
  maxParticipants: string;
  onMaxChange: (v: string) => void;
  allowWaitlist: boolean;
  onAllowWaitlistChange: (v: boolean) => void;
  totalSessions: number;
  totalMinutes?: number;
  totalDays?: number;
  rateBasis?: RateBasis;
  onRateBasisChange?: (v: RateBasis) => void;
}) {
  const sale = parseAmount(salePrice);
  const pay = parseAmount(instructorPay);
  const margin = sale !== undefined && pay !== undefined ? sale - pay : undefined;
  const unit = rateBasisUnit(rateBasis);
  const short = rateBasisShort(rateBasis);
  // Both prices are quoted in the contracted basis, so the total follows the matching unit:
  // scheduled hours, scheduled sessions, or distinct calendar days.
  const units =
    rateBasis === 'per_session'
      ? Math.max(totalSessions, 1)
      : rateBasis === 'per_day'
        ? Math.max(totalDays ?? totalSessions, 1)
        : totalMinutes && totalMinutes > 0
          ? totalMinutes / 60
          : Math.max(totalSessions, 1);
  const totalMargin = margin !== undefined ? margin * units : undefined;
  const unitsLabel = Number.isInteger(units) ? String(units) : units.toFixed(2);
  const overpaid = margin !== undefined && margin < 0;

  return (
    <div className='space-y-3 rounded-lg border p-4'>
      {onRateBasisChange ? (
        <div className='space-y-2'>
          <Label htmlFor='rate-basis'>Billing basis</Label>
          <Select value={rateBasis} onValueChange={v => onRateBasisChange(v as RateBasis)}>
            <SelectTrigger id='rate-basis' className='sm:w-64'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RATE_BASES.map(b => (
                <SelectItem key={b.value} value={b.value}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className='text-muted-foreground text-[11px]'>
            Both prices below are quoted in this unit, and it is the unit the instructor is paid and
            the learner is charged in. A day means a calendar day, however many sessions fall in it.
          </p>
        </div>
      ) : null}

      <div className='grid gap-4 sm:grid-cols-4'>
        <div className='space-y-2'>
          <Label htmlFor='sale-price' className='flex items-center gap-1.5'>
            <Coins className='size-3.5' /> Sale price per {unit}
          </Label>
          <Input
            id='sale-price'
            type='number'
            min={0}
            step='0.01'
            value={salePrice}
            onChange={e => onSalePriceChange(e.target.value)}
          />
          <p className='text-muted-foreground text-[11px]'>
            {approvedFee === undefined
              ? `The course creator has not approved a per-${unit} rate for this format and delivery mode.`
              : `What a learner pays. Suggested ${formatMoney(approvedFee, currency)} — the approved rate. The course minimum floors this.`}
          </p>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='instructor-pay' className='flex items-center gap-1.5'>
            <Wallet className='size-3.5' /> Instructor pay per {unit}
          </Label>
          <Input
            id='instructor-pay'
            type='number'
            min={0}
            step='0.01'
            value={instructorPay}
            onChange={e => onInstructorPayChange(e.target.value)}
          />
          <p className='text-muted-foreground text-[11px]'>
            What you pay the instructor. It cannot exceed the sale price, and an applicant can only
            be assigned when it covers their approved rate.
          </p>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='max-participants'>Max participants</Label>
          <Input
            id='max-participants'
            type='number'
            min={1}
            value={maxParticipants}
            onChange={e => onMaxChange(e.target.value)}
          />
        </div>

        <div className='flex items-start gap-2 pt-7'>
          <Switch
            id='allow-waitlist'
            checked={allowWaitlist}
            onCheckedChange={onAllowWaitlistChange}
          />
          <Label htmlFor='allow-waitlist' className='font-normal'>
            Allow waitlist
          </Label>
        </div>
      </div>

      <p className={overpaid ? 'text-destructive text-[11px]' : 'text-muted-foreground text-[11px]'}>
        {margin === undefined ? (
          'Enter a sale price and an instructor pay to see the margin.'
        ) : overpaid ? (
          `Instructor pay exceeds the sale price by ${formatMoney(Math.abs(margin), currency)} per ${unit}. Lower it to at most ${formatMoney(sale, currency)}.`
        ) : (
          <>
            {`Margin ${formatMoney(margin, currency)} per ${unit} × ${unitsLabel} ${short} = `}
            <span className='text-foreground font-semibold'>
              {formatMoney(totalMargin, currency)}
            </span>
          </>
        )}
      </p>
    </div>
  );
}
