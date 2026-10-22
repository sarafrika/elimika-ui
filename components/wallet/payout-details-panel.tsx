'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Check, Plus, Smartphone } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { PayoutMethod } from '@/services/client/types.gen';
import { AddPayoutMethodSheet, type PendingMethod } from './add-payout-method-sheet';
import { PAYOUT_QUERY_IDS, payoutActions, usePayoutMethods } from './payout-api';
import type { WalletScope } from './wallet-scope';

const RULES = [
  { title: 'Confirmed by SMS code', body: 'A code sent to the number proves it is yours before anything is paid to it.' },
  { title: 'Held for a day', body: 'A just-added number can receive money after its hold, so a taken-over account cannot be emptied.' },
  { title: 'You are told', body: 'We email you whenever a payout number is added or removed.' },
  { title: 'Name check', body: 'M-Pesa tells us the registered name on the first payout and we compare it with yours.' },
];

function unlockText(method: PayoutMethod) {
  if (!method.unlock_at) return '';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(method.unlock_at));
}

/** The Payout details tab: the scope's M-Pesa numbers, and the rules that keep them safe. */
export function PayoutDetailsPanel({
  scope,
  active,
  canManage,
  ownerName,
  readOnlyNote,
  aside,
}: {
  scope: WalletScope;
  active: boolean;
  /** False for an organisation admin who is not a payout approver: they see the numbers, nothing more. */
  canManage: boolean;
  ownerName: string;
  readOnlyNote?: string;
  /** Extra cards beside the rules, e.g. an organisation's approvers. */
  aside?: ReactNode;
}) {
  const queryClient = useQueryClient();
  const { methods, isLoading } = usePayoutMethods(scope, active);
  const actions = payoutActions(scope);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [resume, setResume] = useState<PendingMethod | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = () =>
    void queryClient.invalidateQueries({
      predicate: query => PAYOUT_QUERY_IDS.includes(String((query.queryKey[0] as { _id?: string } | undefined)?._id)),
    });

  const run = async (key: string, call: () => Promise<{ error?: string }>, success: string) => {
    setBusy(key);
    const result = await call();
    setBusy(null);
    if (result.error) toast.error(result.error);
    else {
      toast.success(success);
      setRemoving(null);
      refresh();
    }
  };

  const openAdd = () => {
    setResume(null);
    setSheetOpen(true);
  };

  return (
    <div className='flex flex-wrap items-start gap-5'>
      <Card className='min-w-0 flex-[2_1_520px]'>
        <CardHeader className='flex flex-row flex-wrap items-center justify-between gap-3 space-y-0'>
          <div className='space-y-1'>
            <CardTitle className='text-base'>Payout details</CardTitle>
            <CardDescription>
              Where withdrawals go. We use the default number unless another is picked.
            </CardDescription>
          </div>
          {canManage ? (
            <Button variant='outline' size='sm' onClick={openAdd}>
              <Plus aria-hidden className='size-4' />
              Add M-Pesa number
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className='space-y-3'>
          {readOnlyNote && !canManage ? (
            <p className='bg-muted text-muted-foreground rounded-md px-3 py-2 text-sm'>{readOnlyNote}</p>
          ) : null}
          {isLoading ? (
            <Skeleton className='h-24 w-full' />
          ) : methods.length === 0 ? (
            <div className='flex flex-col items-center gap-2 rounded-xl border border-dashed px-5 py-8 text-center'>
              <p className='font-semibold'>No payout method yet</p>
              <p className='text-muted-foreground max-w-sm text-sm'>
                Add the M-Pesa number you want withdrawals sent to. We confirm it with a code sent by SMS.
              </p>
              {canManage ? <Button onClick={openAdd}>Add M-Pesa number</Button> : null}
            </div>
          ) : (
            methods.map(method => {
              const pending = method.status === 'PENDING_VERIFICATION';
              const uuid = method.uuid ?? '';
              return (
                <div
                  key={uuid}
                  className={cn(
                    'space-y-3 rounded-xl border p-4',
                    method.is_default ? 'border-primary/30 bg-primary/5' : 'bg-card'
                  )}
                >
                  <div className='flex flex-wrap items-start gap-3'>
                    <span className='bg-success/10 text-success grid size-10 shrink-0 place-items-center rounded-full'>
                      <Smartphone aria-hidden className='size-5' />
                    </span>
                    <div className='min-w-0 flex-[1_1_220px] space-y-1'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='text-sm font-semibold'>M-Pesa · {method.label || 'Number'}</span>
                        {method.is_default ? (
                          <Badge variant='outline' className='border-primary/30 text-primary text-[11px]'>
                            DEFAULT
                          </Badge>
                        ) : null}
                        {pending ? (
                          <Badge variant='outline' className='border-warning/40 bg-warning/10 text-[11px]'>
                            WAITING FOR CODE
                          </Badge>
                        ) : method.on_hold ? (
                          <Badge variant='outline' className='border-warning/40 bg-warning/10 text-[11px]'>
                            VERIFIED · ON HOLD
                          </Badge>
                        ) : (
                          <Badge variant='outline' className='border-success/40 bg-success/10 text-success text-[11px]'>
                            <Check aria-hidden className='size-3' />
                            VERIFIED
                          </Badge>
                        )}
                      </div>
                      <p className='font-mono text-sm'>{method.msisdn}</p>
                      <p className='text-muted-foreground text-xs'>
                        {method.mpesa_registered_name
                          ? `Name on M-Pesa: ${method.mpesa_registered_name}`
                          : 'Name on M-Pesa is confirmed on the first payout'}
                      </p>
                      {method.on_hold ? (
                        <p className='text-warning text-xs font-semibold'>
                          New number: withdrawals to it unlock on {unlockText(method)} (EAT).
                        </p>
                      ) : null}
                    </div>
                    {canManage ? (
                      <div className='flex flex-wrap gap-1.5'>
                        {pending ? (
                          <Button
                            size='sm'
                            onClick={() => {
                              setResume({ method });
                              setSheetOpen(true);
                            }}
                          >
                            Enter code
                          </Button>
                        ) : !method.is_default ? (
                          <Button
                            size='sm'
                            variant='outline'
                            disabled={busy === uuid}
                            onClick={() => void run(uuid, () => actions.makeDefault(uuid), 'Default payout number updated')}
                          >
                            Make default
                          </Button>
                        ) : null}
                        <Button size='sm' variant='ghost' onClick={() => setRemoving(uuid)}>
                          Remove
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  {removing === uuid ? (
                    <div className='flex flex-wrap items-center gap-2 border-t pt-3'>
                      <p className='text-muted-foreground flex-[1_1_260px] text-sm'>
                        Remove {method.msisdn}? Withdrawals already sent to it still complete.
                      </p>
                      <Button size='sm' variant='ghost' onClick={() => setRemoving(null)}>
                        Keep
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        disabled={busy === uuid}
                        onClick={() => void run(uuid, () => actions.remove(uuid), 'Number removed')}
                      >
                        Remove number
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
          <div className='flex flex-wrap gap-2 pt-1'>
            {['Bank transfer', 'Airtel Money'].map(name => (
              <div
                key={name}
                className='text-muted-foreground flex flex-[1_1_200px] items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold'
              >
                {name}
                <Badge variant='secondary' className='text-[11px]'>
                  SOON
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className='flex min-w-0 flex-[1_1_300px] flex-col gap-5'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>How payout numbers stay safe</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {RULES.map(rule => (
              <div key={rule.title} className='flex items-start gap-3'>
                <span className='bg-primary/10 text-primary grid size-6 shrink-0 place-items-center rounded-full'>
                  <Check aria-hidden className='size-3.5' />
                </span>
                <div>
                  <p className='text-sm font-semibold'>{rule.title}</p>
                  <p className='text-muted-foreground text-xs'>{rule.body}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        {aside}
      </div>
      <AddPayoutMethodSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        scope={scope}
        ownerName={ownerName}
        resume={resume}
        onChanged={refresh}
      />
    </div>
  );
}
