'use client';

import { Coins, Wallet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { formatMoney } from './class-form-shared';

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
}) {
  const sale = parseAmount(salePrice);
  const pay = parseAmount(instructorPay);
  const margin = sale !== undefined && pay !== undefined ? sale - pay : undefined;
  // Both prices are per hour, so the total follows scheduled time, not the number of sessions.
  const hours = totalMinutes && totalMinutes > 0 ? totalMinutes / 60 : Math.max(totalSessions, 1);
  const totalMargin = margin !== undefined ? margin * hours : undefined;
  const hoursLabel = Number.isInteger(hours) ? String(hours) : hours.toFixed(2);
  const overpaid = margin !== undefined && margin < 0;

  return (
    <div className='space-y-3 rounded-lg border p-4'>
      <div className='grid gap-4 sm:grid-cols-4'>
        <div className='space-y-2'>
          <Label htmlFor='sale-price' className='flex items-center gap-1.5'>
            <Coins className='size-3.5' /> Sale price per hour
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
              ? 'The course creator has not approved a rate for this format and delivery mode.'
              : `What a learner pays. Suggested ${formatMoney(approvedFee, currency)} — the approved rate. The course minimum floors this.`}
          </p>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='instructor-pay' className='flex items-center gap-1.5'>
            <Wallet className='size-3.5' /> Instructor pay per hour
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
          `Instructor pay exceeds the sale price by ${formatMoney(Math.abs(margin), currency)} per hour. Lower it to at most ${formatMoney(sale, currency)}.`
        ) : (
          <>
            {`Margin ${formatMoney(margin, currency)} per hour × ${hoursLabel} h = `}
            <span className='text-foreground font-semibold'>
              {formatMoney(totalMargin, currency)}
            </span>
          </>
        )}
      </p>
    </div>
  );
}
