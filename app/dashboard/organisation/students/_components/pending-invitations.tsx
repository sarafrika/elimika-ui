'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MailCheck, RotateCw, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { AsyncSection } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  listOrganisationInvitationsOptions,
  listOrganisationInvitationsQueryKey,
  resendOrganisationInvitationMutation,
  revokeOrganisationInvitationMutation,
} from '@/services/client/@tanstack/react-query.gen';

/** Offers still awaiting a decision; these people are not members yet. */
const LIVE_STATUSES = ['PENDING', 'AWAITING_GUARDIAN_CONSENT'];
const isStudentInvite = (domainName: unknown) =>
  String(domainName ?? 'student').toLowerCase() === 'student';

export function PendingInvitations({ organisationUuid }: { organisationUuid: string }) {
  const queryClient = useQueryClient();
  const [actingOn, setActingOn] = useState<string | null>(null);

  const invitationsQuery = useQuery({
    ...listOrganisationInvitationsOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });

  const pending = (invitationsQuery.data?.data ?? []).filter(
    i => isStudentInvite(i.domain_name) && LIVE_STATUSES.includes(String(i.status))
  );

  const revoke = useMutation(revokeOrganisationInvitationMutation());
  const resend = useMutation(resendOrganisationInvitationMutation());

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: listOrganisationInvitationsQueryKey({ path: { organisationUuid } }),
    });

  const act = async (
    invitationUuid: string,
    kind: 'revoke' | 'resend',
    run: () => Promise<unknown>
  ) => {
    setActingOn(invitationUuid);
    try {
      await run();
      toast.success(kind === 'revoke' ? 'Invitation revoked' : 'Invitation resent');
      await refresh();
    } catch (err) {
      toast.error(kind === 'revoke' ? 'Could not revoke' : 'Could not resend', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setActingOn(null);
    }
  };

  // Stay out of the way entirely when there is nothing outstanding.
  if (!invitationsQuery.isLoading && pending.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <MailCheck className='h-4 w-4' /> Awaiting a response
        </CardTitle>
        <CardDescription>
          These people have been invited but have not joined yet. They become students only once
          they accept.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <AsyncSection
          loading={invitationsQuery.isLoading && !invitationsQuery.data}
          error={invitationsQuery.error}
          skeleton={
            <div className='space-y-2'>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          }
          errorTitle="Couldn't load pending invitations"
          onRetry={invitationsQuery.refetch}
        >
          <div className='space-y-2'>
            {pending.map(invite => {
              const busy = actingOn === invite.uuid;
              const awaitingGuardian = String(invite.status) === 'AWAITING_GUARDIAN_CONSENT';
              return (
                <div
                  key={invite.uuid}
                  className='flex flex-wrap items-center justify-between gap-3 rounded-md border p-3'
                >
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium'>
                      {invite.recipient_name || invite.recipient_email}
                    </p>
                    <p className='text-muted-foreground truncate text-xs'>
                      {invite.recipient_email}
                      {invite.expires_at
                        ? ` - expires ${new Date(invite.expires_at).toLocaleDateString()}`
                        : ''}
                    </p>
                  </div>

                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className='gap-1'>
                      {awaitingGuardian ? 'Awaiting guardian' : 'Invited'}
                    </Badge>
                    <Button
                      variant='ghost'
                      size='sm'
                      disabled={busy}
                      onClick={() =>
                        invite.uuid &&
                        act(invite.uuid, 'resend', () =>
                          resend.mutateAsync({
                            path: { organisationUuid, invitationUuid: invite.uuid as string },
                          })
                        )
                      }
                    >
                      <RotateCw className='mr-1.5 h-3.5 w-3.5' /> Resend
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      disabled={busy}
                      onClick={() =>
                        invite.uuid &&
                        act(invite.uuid, 'revoke', () =>
                          revoke.mutateAsync({
                            path: { organisationUuid, invitationUuid: invite.uuid as string },
                          })
                        )
                      }
                    >
                      <X className='mr-1.5 h-3.5 w-3.5' /> Revoke
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </AsyncSection>
      </CardContent>
    </Card>
  );
}
