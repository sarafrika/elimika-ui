'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CalendarDays, CheckCircle2, Clock3, Mail, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { listMyInvitationsOptions, listMyInvitationsQueryKey } from '@/services/client/@tanstack/react-query.gen';
import {
    acceptInvitationFromInbox,
    declineInvitationFromInbox,
} from '@/services/client/sdk.gen';
import type {
    AcceptInvitationFromInboxData,
    AcceptInvitationFromInboxResponse,
    DeclineInvitationFromInboxData,
    DeclineInvitationFromInboxResponse,
    MyInvitation,
} from '@/services/client/types.gen';

import { useUserProfile } from '../../../../../context/profile-context';

export function LessonHubClassInvitesTab({ highlightId }: { highlightId?: string }) {
    const user = useUserProfile();
    const qc = useQueryClient();
    const highlightRef = useRef<HTMLDivElement | null>(null);

    const { data, isLoading } = useQuery({
        ...listMyInvitationsOptions(),
        enabled: Boolean(user),
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });

    const acceptInvite = useMutation<
        AcceptInvitationFromInboxResponse,
        unknown,
        AcceptInvitationFromInboxData
    >({
        mutationFn: async variables => {
            const { data, error } = await acceptInvitationFromInbox({
                ...variables,
                throwOnError: false,
            });

            if (error) throw error;

            return data;
        },
        onSuccess: () => {
            toast.success('Invitation accepted.');
            qc.invalidateQueries({ queryKey: listMyInvitationsQueryKey() });
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : 'Could not accept the invitation.';
            toast.error(message);
        },
    });

    const declineInvite = useMutation<
        DeclineInvitationFromInboxResponse,
        unknown,
        DeclineInvitationFromInboxData
    >({
        mutationFn: async variables => {
            const { data, error } = await declineInvitationFromInbox({
                ...variables,
                throwOnError: false,
            });

            if (error) throw error;

            return data;
        },
        onSuccess: () => {
            toast.success('Invitation declined.');
            qc.invalidateQueries({ queryKey: listMyInvitationsQueryKey() });
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : 'Could not decline the invitation.';
            toast.error(message);
        },
    });

    const invites = useMemo(
        () =>
            [...((data?.data ?? []) as MyInvitation[])].sort((a, b) => {
                const aTime = a.created_date ? new Date(a.created_date).getTime() : 0;
                const bTime = b.created_date ? new Date(b.created_date).getTime() : 0;
                return bTime - aTime;
            }),
        [data?.data]
    );

    useEffect(() => {
        if (!highlightId || !invites.some(invite => invite.uuid === highlightId)) return;

        const timeout = setTimeout(() => {
            highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);

        return () => clearTimeout(timeout);
    }, [highlightId, invites]);

    if (isLoading) {
        return (
            <div className='space-y-3'>
                <Skeleton className='h-32 w-full rounded-2xl' />
                <Skeleton className='h-32 w-full rounded-2xl' />
            </div>
        );
    }

    if (invites.length === 0) {
        return (
            <EmptyState
                variant='plain'
                icon={Mail}
                title='No class invites'
                description='When an instructor or institution invites you to a class, it will show up here.'
                action={
                    <Button asChild variant='outline'>
                        <Link href='/dashboard/student/courses'>Browse courses</Link>
                    </Button>
                }
            />
        );
    }

    return (
        <div className='grid gap-4'>
            {invites.map(invite => {
                const inviteId = invite.uuid;
                const isHighlighted = highlightId === inviteId;
                const accepting = acceptInvite.isPending && acceptInvite.variables?.path.invitationUuid === inviteId;
                const declining = declineInvite.isPending && declineInvite.variables?.path.invitationUuid === inviteId;
                const pending = accepting || declining;
                const sentLabel = invite.created_date
                    ? new Date(invite.created_date).toLocaleDateString()
                    : 'TBD';
                const expiryLabel = invite.expires_at ? new Date(invite.expires_at).toLocaleDateString() : 'TBD';

                return (
                    <Card
                        key={inviteId}
                        ref={isHighlighted ? highlightRef : undefined}
                        className={`overflow-hidden transition-shadow ${isHighlighted ? 'ring-2 ring-primary ring-offset-2 shadow-lg' : ''
                            }`}
                    >
                        <CardContent className='flex flex-col gap-4 p-5 sm:flex-row sm:items-start'>
                            <div className='flex items-start gap-3 sm:w-1/2'>
                                <div className='bg-primary/10 text-primary grid h-16 w-16 shrink-0 place-items-center rounded-lg'>
                                    <Mail className='h-6 w-6' />
                                </div>

                                <div className='min-w-0 flex-1'>
                                    <div className='flex flex-wrap items-center gap-1.5'>
                                        <Badge variant='secondary' className='uppercase tracking-wide'>
                                            Invite
                                        </Badge>
                                        {invite.domain_name && (
                                            <Badge variant='outline' className='capitalize'>
                                                {invite.domain_name}
                                            </Badge>
                                        )}
                                        {invite.requires_guardian_consent && (
                                            <Badge variant='outline'>Guardian consent</Badge>
                                        )}
                                    </div>

                                    <div className='mt-1 text-sm font-semibold text-foreground'>
                                        {invite.organisation_name ?? 'Invitation'}
                                    </div>
                                    <div className='text-muted-foreground text-xs'>
                                        {invite.message ?? 'You have been invited to join this organisation.'}
                                    </div>

                                    <div className='mt-2 flex items-center gap-2 text-xs text-muted-foreground'>
                                        <span>{invite.inviter_name ?? 'Inviter not available'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className='grid flex-1 grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-2'>
                                <div className='inline-flex items-center gap-1.5'>
                                    <CalendarDays className='h-3.5 w-3.5 text-muted-foreground' />
                                    Sent {sentLabel}
                                </div>
                                <div className='inline-flex items-center gap-1.5'>
                                    <Clock3 className='h-3.5 w-3.5 text-muted-foreground' />
                                    Expires {expiryLabel}
                                </div>
                                <div className='inline-flex items-center gap-1.5 truncate'>
                                    <Users className='h-3.5 w-3.5 text-muted-foreground' />
                                    {invite.class_count ?? 0} class{invite.class_count === 1 ? '' : 'es'}
                                </div>
                                <div className='inline-flex items-center gap-1.5 truncate'>
                                    <Mail className='h-3.5 w-3.5 text-muted-foreground' />
                                    {String(invite.status ?? 'OPEN').replace(/_/g, ' ').toLowerCase()}
                                </div>
                            </div>

                            <div className='flex flex-row items-center gap-2 sm:flex-col sm:items-stretch'>
                                <Button
                                    size='sm'
                                    className='bg-primary hover:bg-primary/90'
                                    disabled={pending || !inviteId}
                                    onClick={() =>
                                        inviteId &&
                                        acceptInvite.mutate({
                                            body: { scope_acknowledged: true },
                                            path: { invitationUuid: inviteId },
                                        })
                                    }
                                >
                                    <CheckCircle2 className='mr-1 h-3.5 w-3.5' />
                                    {accepting ? 'Accepting…' : 'Accept'}
                                </Button>

                                <Button
                                    size='sm'
                                    variant='outline'
                                    disabled={pending || !inviteId}
                                    onClick={() =>
                                        inviteId &&
                                        declineInvite.mutate({
                                            path: { invitationUuid: inviteId },
                                        })
                                    }
                                >
                                    <AlertCircle className='mr-1 h-3.5 w-3.5' />
                                    {declining ? 'Declining…' : 'Decline'}
                                </Button>

                                <Button asChild size='sm' variant='ghost'>
                                    <Link href='/dashboard/student/schedule'>Open schedule</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
