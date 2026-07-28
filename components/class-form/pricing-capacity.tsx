'use client';

import { Coins, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { formatMoney } from './class-form-shared';

export function PricingCapacity({
  approvedFee,
  currency,
  maxParticipants,
  onMaxChange,
  allowWaitlist,
  onAllowWaitlistChange,
  totalSessions,
}: {
  approvedFee?: number;
  currency?: string | null;
  maxParticipants: string;
  onMaxChange: (v: string) => void;
  allowWaitlist: boolean;
  onAllowWaitlistChange: (v: boolean) => void;
  totalSessions: number;
}) {
  const totalFee = approvedFee !== undefined ? approvedFee * Math.max(totalSessions, 1) : undefined;
  return (
    <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-3">
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Coins className="size-3.5" /> Fee per session
          <span className="text-[11px] font-normal text-muted-foreground">(approved rate)</span>
        </Label>
        <div className="flex h-9 items-center gap-2 rounded-md border bg-muted/40 px-3">
          <Lock className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">{formatMoney(approvedFee, currency)}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {approvedFee === undefined
            ? 'The course creator has not approved a rate for this format and delivery mode.'
            : `Approved by the course creator. ${totalSessions} session${totalSessions === 1 ? '' : 's'} × ${approvedFee.toLocaleString()} = `}
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
