'use client';

import { Coins } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { num } from './class-form-shared';

export function PricingCapacity({
  feePerSession,
  onFeeChange,
  maxParticipants,
  onMaxChange,
  allowWaitlist,
  onAllowWaitlistChange,
  totalSessions,
}: {
  feePerSession: string;
  onFeeChange: (v: string) => void;
  maxParticipants: string;
  onMaxChange: (v: string) => void;
  allowWaitlist: boolean;
  onAllowWaitlistChange: (v: boolean) => void;
  totalSessions: number;
}) {
  const fee = num(feePerSession);
  const totalFee = fee !== undefined ? fee * Math.max(totalSessions, 1) : undefined;
  return (
    <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-3">
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Coins className="size-3.5" /> Fee per session
        </Label>
        <Input
          type="number"
          min={0}
          step="0.01"
          value={feePerSession}
          onChange={e => onFeeChange(e.target.value)}
          placeholder="0.00"
        />
        <p className="text-[11px] text-muted-foreground">
          {totalFee !== undefined
            ? `${totalSessions} session${totalSessions === 1 ? '' : 's'} × ${fee?.toLocaleString()} = `
            : `${totalSessions} session${totalSessions === 1 ? '' : 's'}`}
          {totalFee !== undefined ? (
            <span className="font-semibold text-foreground">{totalFee.toLocaleString()}</span>
          ) : null}
        </p>
      </div>
      <div className="space-y-2">
        <Label>Max participants</Label>
        <Input type="number" min={1} value={maxParticipants} onChange={e => onMaxChange(e.target.value)} />
      </div>
      <div className="flex items-end gap-2 pb-1">
        <Switch id="allow-waitlist" checked={allowWaitlist} onCheckedChange={onAllowWaitlistChange} />
        <Label htmlFor="allow-waitlist" className="font-normal">
          Allow waitlist
        </Label>
      </div>
    </div>
  );
}
