'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { getUsersByOrganisationAndDomainOptions } from '@/services/client/@tanstack/react-query.gen';
import type { PayoutApprover, User } from '@/services/client/types.gen';
import { approverActions, PAYOUT_QUERY_IDS } from './payout-api';

const nameOf = (user?: User) => (user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email : '');

/** Which admins may manage the organisation's payout numbers and withdraw. Any admin can change this. */
export function PayoutApproversCard({
  organisationUuid,
  approvers,
  selfUuid,
  active,
}: {
  organisationUuid: string;
  approvers: PayoutApprover[];
  selfUuid?: string;
  active: boolean;
}) {
  const queryClient = useQueryClient();
  const actions = approverActions(organisationUuid);
  const [choice, setChoice] = useState('');
  const [busy, setBusy] = useState(false);
  const admins = useQuery({
    ...getUsersByOrganisationAndDomainOptions({ path: { uuid: organisationUuid, domainName: 'admin' } }),
    enabled: active && Boolean(organisationUuid),
  });
  const adminList: User[] = admins.data?.data ?? [];
  const byUuid = new Map(adminList.map(user => [user.uuid ?? '', user]));
  const named = new Set(approvers.map(a => a.user_uuid));
  const candidates = adminList.filter(user => user.uuid && !named.has(user.uuid));

  const refresh = () =>
    void queryClient.invalidateQueries({
      predicate: query => PAYOUT_QUERY_IDS.includes(String((query.queryKey[0] as { _id?: string } | undefined)?._id)),
    });

  const run = async (call: () => Promise<{ error?: string }>, success: string) => {
    setBusy(true);
    const result = await call();
    setBusy(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success(success);
      setChoice('');
      refresh();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Payout approvers</CardTitle>
        <CardDescription>
          Only these admins can add payout numbers and withdraw the organisation&apos;s money.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        {approvers.length === 0 ? (
          <p className='text-muted-foreground text-sm'>No one yet. Name at least one admin so money can be withdrawn.</p>
        ) : (
          approvers.map(approver => (
            <div key={approver.user_uuid} className='flex items-center justify-between gap-2'>
              <div className='flex min-w-0 items-center gap-2'>
                <UserCheck aria-hidden className='text-primary size-4 shrink-0' />
                <span className='truncate text-sm font-medium'>
                  {nameOf(byUuid.get(approver.user_uuid ?? '')) || 'Admin'}
                  {approver.user_uuid === selfUuid ? ' (you)' : ''}
                </span>
              </div>
              <Button
                size='sm'
                variant='ghost'
                disabled={busy}
                onClick={() => void run(() => actions.remove(approver.user_uuid ?? ''), 'Approver removed')}
              >
                Remove
              </Button>
            </div>
          ))
        )}
        <div className='flex gap-2 border-t pt-3'>
          <Select value={choice} onValueChange={setChoice}>
            <SelectTrigger className='flex-1' aria-label='Admin to name as payout approver'>
              <SelectValue placeholder={candidates.length ? 'Choose an admin' : 'Every admin is an approver'} />
            </SelectTrigger>
            <SelectContent>
              {candidates.map(user => (
                <SelectItem key={user.uuid} value={user.uuid ?? ''}>
                  {nameOf(user)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button disabled={!choice || busy} onClick={() => void run(() => actions.add(choice), 'Approver added')}>
            {busy && <Spinner />}Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
