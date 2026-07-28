'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, CalendarClock, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { AsyncSection } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  acceptInvitationFromInboxMutation,
  declineInvitationFromInboxMutation,
  listMyInvitationsOptions,
  listMyInvitationsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';

/**
 * Invitations addressed to the signed-in student, so someone who never opened the email
 * can still find and act on an offer.
 */
function InvitesPage() {
  const queryClient = useQueryClient();
  const [actingOn, setActingOn] = useState<string | null>(null);

  const invitesQuery = useQuery({ ...listMyInvitationsOptions(), retry: false });
  const invites = invitesQuery.data?.data ?? [];

  const accept = useMutation(acceptInvitationFromInboxMutation());
  const decline = useMutation(declineInvitationFromInboxMutation());

  const refresh = () => queryClient.invalidateQueries({ queryKey: listMyInvitationsQueryKey() });

  const onAccept = async (invitationUuid: string, organisationName?: string) => {
    setActingOn(invitationUuid);
    try {
      const response = await accept.mutateAsync({
        path: { invitationUuid },
        body: { scope_acknowledged: true },
      });
      if (response?.data?.guardian_consent_required) {
        toast.info('A parent or guardian needs to approve this', {
          description: 'Open the link we emailed you to tell us who to ask.',
        });
      } else {
        toast.success(`You have joined ${organisationName ?? 'the organisation'}`);
      }
      await refresh();
    } catch (err) {
      toast.error('Could not accept this invitation', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setActingOn(null);
    }
  };

  const onDecline = async (invitationUuid: string) => {
    setActingOn(invitationUuid);
    try {
      await decline.mutateAsync({ path: { invitationUuid } });
      toast.success('Invitation declined');
      await refresh();
    } catch (err) {
      toast.error('Could not decline this invitation', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setActingOn(null);
    }
  };

  return (
    <AsyncSection
      loading={invitesQuery.isLoading && !invitesQuery.data}
      error={invitesQuery.error}
      empty={invites.length === 0}
      skeleton={
        <div className='space-y-3'>
          <Skeleton className='h-40 w-full rounded-xl' />
          <Skeleton className='h-40 w-full rounded-xl' />
        </div>
      }
      errorTitle='Couldn’t load your invites'
      onRetry={invitesQuery.refetch}
      emptyState={
        <div className='flex flex-col items-center justify-center gap-4 py-24 text-center'>
          <div className='bg-muted rounded-full p-5'>
            <Mail className='text-muted-foreground h-8 w-8' />
          </div>
          <div className='space-y-1'>
            <h3 className='text-lg font-semibold'>No invites</h3>
            <p className='text-muted-foreground max-w-xs text-sm'>
              You don&apos;t have any pending invites right now. Check back later.
            </p>
          </div>
        </div>
      }
    >
      <div className='space-y-3'>
        {invites.map(invite => {
          const busy = actingOn === invite.uuid;
          const awaitingGuardian = Boolean(invite.requires_guardian_consent);
          return (
            <Card key={invite.uuid}>
              <CardHeader>
                <div className='flex flex-wrap items-start justify-between gap-2'>
                  <div className='min-w-0'>
                    <CardTitle className='flex items-center gap-2 text-base'>
                      <Building2 className='h-4 w-4 shrink-0' />
                      {invite.organisation_name ?? 'An organisation'}
                    </CardTitle>
                    <CardDescription>
                      {invite.inviter_name ? `${invite.inviter_name} invited you ` : 'You were invited '}
                      to join as a {invite.domain_name ?? 'student'}.
                    </CardDescription>
                  </div>
                  {awaitingGuardian ? (
                    <Badge variant='secondary' className='gap-1'>
                      <ShieldCheck className='h-3 w-3' /> Awaiting guardian
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className='space-y-4'>
                {invite.message ? (
                  <blockquote className='border-l-2 border-muted-foreground/30 pl-3 text-sm italic text-muted-foreground'>
                    {invite.message}
                  </blockquote>
                ) : null}

                <div className='flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
                  {invite.class_count ? (
                    <span>
                      {invite.class_count} class{invite.class_count === 1 ? '' : 'es'} shared with you
                    </span>
                  ) : null}
                  {invite.expires_at ? (
                    <span className='flex items-center gap-1'>
                      <CalendarClock className='h-3.5 w-3.5' />
                      Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>

                <p className='rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground'>
                  They will only see your enrolment and performance in{' '}
                  <strong>their own courses and classes</strong> — nothing else on your account, and
                  nothing from other institutions.
                </p>

                {awaitingGuardian ? (
                  <p className='text-sm text-muted-foreground'>
                    We are waiting on your parent or guardian to approve this.
                  </p>
                ) : (
                  <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={busy}
                      onClick={() => invite.uuid && onDecline(invite.uuid)}
                    >
                      Decline
                    </Button>
                    <Button
                      size='sm'
                      disabled={busy}
                      onClick={() => invite.uuid && onAccept(invite.uuid, invite.organisation_name)}
                    >
                      {busy ? 'Joining…' : 'Accept and join'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AsyncSection>
  );
}

export default InvitesPage;
