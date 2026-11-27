'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, UserRoundPlus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { useStudent } from '@/context/student-context';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getGuardiansOptions,
  getGuardiansQueryKey,
  getStudentByIdQueryKey,
  resendInvitationMutation,
  updateStudentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { requireApiData } from '@/src/features/onboarding/lib/user-onboarding';
import { assertGuardianInvitationSaved } from './invitation-response';

const inviteSchema = z.object({
  name: z.string().trim().min(1, 'Enter your parent or guardian’s name.'),
  email: z.string().trim().email('Enter a valid email address.'),
  relationship_type: z.enum(['PARENT', 'GUARDIAN']),
});

function InviteGuardianForm({ studentUuid, userUuid }: { studentUuid: string; userUuid: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState<'PARENT' | 'GUARDIAN'>('PARENT');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const guardians = useQuery({
    ...getGuardiansOptions({ path: { studentUuid } }),
    enabled: Boolean(studentUuid),
    staleTime: STALE_TIMES.entity,
    select: response => requireApiData(response),
  });
  const invite = useMutation({ ...updateStudentMutation(), retry: false });
  const resend = useMutation({ ...resendInvitationMutation(), retry: false });
  const pending = invite.isPending || resend.isPending;
  const entries = guardians.data ?? [];

  async function refresh() {
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: getGuardiansQueryKey({ path: { studentUuid } }) }),
      queryClient.invalidateQueries({
        queryKey: getStudentByIdQueryKey({ path: { uuid: studentUuid } }),
      }),
    ]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || guardians.isFetching) return;
    setError('');
    setNotice('');
    const parsed = inviteSchema.safeParse({ name, email, relationship_type: relationship });
    if (!parsed.success) {
      setError(parsed.error.issues.map(issue => issue.message).join('\n'));
      return;
    }
    if (entries.some(entry => entry.email?.toLowerCase() === parsed.data.email.toLowerCase())) {
      setError('This guardian is already listed. You can resend their invitation below.');
      return;
    }
    if (entries.length >= 2) {
      setError('You can have up to two guardians. Use the existing guardian invitation below.');
      return;
    }
    // PUT replaces the guardian list: preserve each existing contact, including
    // their relationship, so inviting another guardian cannot withdraw invitations.
    if (entries.some(entry => !entry.name || !entry.email)) {
      setError(
        'An existing guardian has incomplete contact details. Update those details before adding another guardian.'
      );
      return;
    }
    try {
      const response = await invite.mutateAsync({
        path: { uuid: studentUuid },
        body: {
          user_uuid: userUuid,
          guardians: [
            ...entries.map(entry => ({
              name: entry.name ?? '',
              email: entry.email ?? '',
              phone: entry.phone,
              relationship_type: entry.relationship_type,
            })),
            parsed.data,
          ],
        },
      });
      assertGuardianInvitationSaved(response, studentUuid);
      setNotice(
        `Guardian saved for ${parsed.data.email}. A new guardian receives an invitation by email; an existing account is linked immediately.`
      );
      setName('');
      setEmail('');
    } catch (failure) {
      setError(getErrorMessage(failure, 'Unable to invite your guardian. Please try again.'));
    } finally {
      await refresh();
    }
  }

  async function resendInvite(guardianUuid: string) {
    if (pending) return;
    setError('');
    setNotice('');
    try {
      requireApiData(await resend.mutateAsync({ path: { studentUuid, guardianUuid } }));
      setNotice(
        'A new invitation has been emailed to your guardian. The previous link will no longer work.'
      );
      await refresh();
    } catch (failure) {
      setError(getErrorMessage(failure, 'Unable to resend this invitation. Please try again.'));
    }
  }

  if (guardians.isLoading) return <Skeleton className='h-64 w-full' />;
  if (guardians.isError)
    return (
      <EmptyState
        variant='compact'
        title='Unable to load guardians'
        description='Please try again before sending an invitation.'
        action={
          <Button variant='outline' onClick={() => void guardians.refetch()}>
            Try again
          </Button>
        }
      />
    );

  return (
    <div className='space-y-5'>
      {entries.length < 2 && (
        <form onSubmit={submit} className='space-y-4'>
          <fieldset disabled={pending} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='invite-guardian-name'>Guardian’s name</Label>
              <Input
                id='invite-guardian-name'
                required
                value={name}
                onChange={event => setName(event.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='invite-guardian-email'>Guardian’s email</Label>
              <Input
                id='invite-guardian-email'
                required
                type='email'
                value={email}
                onChange={event => setEmail(event.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='invite-guardian-relationship'>Relationship</Label>
              <select
                id='invite-guardian-relationship'
                value={relationship}
                onChange={event => {
                  if (event.target.value === 'PARENT' || event.target.value === 'GUARDIAN')
                    setRelationship(event.target.value);
                }}
                className='border-input bg-background h-10 w-full rounded-md border px-3 text-sm'
              >
                <option value='PARENT'>Parent</option>
                <option value='GUARDIAN'>Guardian</option>
              </select>
            </div>
          </fieldset>
          <Button type='submit' disabled={pending || guardians.isFetching} className='w-full'>
            {invite.isPending ? <Spinner /> : <Mail className='size-4' aria-hidden />}
            {invite.isPending ? 'Sending invitation…' : 'Send email invitation'}
          </Button>
        </form>
      )}
      {!!entries.length && (
        <div className='space-y-3'>
          <h3 className='text-sm font-semibold'>Your guardians</h3>
          {entries.map((entry, index) => (
            <div
              key={entry.uuid ?? entry.email ?? index}
              className='space-y-2 rounded-lg border p-3 text-sm'
            >
              <p className='font-medium'>{entry.name}</p>
              <p className='text-muted-foreground break-all'>{entry.email}</p>
              <p className='capitalize'>{entry.status}</p>
              {entry.uuid && entry.status !== 'linked' && (
                <Button
                  variant='outline'
                  size='sm'
                  disabled={pending}
                  onClick={() => {
                    if (entry.uuid) void resendInvite(entry.uuid);
                  }}
                >
                  {resend.isPending && resend.variables?.path?.guardianUuid === entry.uuid && (
                    <Spinner />
                  )}
                  Resend invitation
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      {notice && (
        <p role='status' className='text-success text-sm'>
          {notice}
        </p>
      )}
      {error && (
        <p role='alert' className='text-destructive text-sm whitespace-pre-line'>
          {error}
        </p>
      )}
    </div>
  );
}

export function InviteGuardianBanner() {
  const student = useStudent();
  const [open, setOpen] = useState(false);
  return (
    <Card className='border-primary/20 bg-primary/5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex items-start gap-3'>
        <UserRoundPlus className='text-primary mt-1 size-6 shrink-0' aria-hidden />
        <div>
          <h2 className='font-semibold'>Invite a parent or guardian</h2>
          <p className='text-muted-foreground mt-1 text-sm'>
            Let someone support your learning. Invite your parent or guardian to connect with you on
            Elimika.
          </p>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button disabled={!student?.uuid || !student.user_uuid} className='shrink-0'>
            Invite guardian
          </Button>
        </DialogTrigger>
        <DialogContent className='max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Invite your guardian</DialogTitle>
            <DialogDescription>
              We’ll email a personal invitation to your parent or guardian. They’ll use that address
              to create their account and connect with you.
            </DialogDescription>
          </DialogHeader>
          {open && student?.uuid && student.user_uuid && (
            <InviteGuardianForm studentUuid={student.uuid} userUuid={student.user_uuid} />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
