'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/ui/spinner';
import { httpStatusOf } from '@/lib/api-errors';
import { localDate } from '@/lib/date';
import { getErrorMessage } from '@/lib/error-utils';
import {
  addChildMutation,
  getCurrentAccountStatusQueryKey,
  getMyStudentsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useRefreshSessionIdentity } from '@/src/features/auth/use-refresh-session-identity';
import { buildDashboardSwitchPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { readAddedChild } from '@/src/features/guardians/child-response';
import { childSchema } from '@/src/features/guardians/validation';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

export function ParentOnboardingForm({
  context = 'onboarding',
}: {
  context?: 'onboarding' | 'dashboard';
}) {
  const user = useUserProfile();
  const router = useRouter();
  const queryClient = useQueryClient();
  const refreshIdentity = useRefreshSessionIdentity();
  const inDashboard = context === 'dashboard';
  const returnPath = inDashboard ? '/dashboard/parent/add-child' : '/onboarding/parent';
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [duplicate, setDuplicate] = useState(false);
  const [fields, setFields] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    dob: '',
    relationship_type: 'PARENT',
  });
  const add = useMutation({
    ...addChildMutation(),
    retry: false,
    onSuccess: async response => {
      const { message } = readAddedChild(response);
      setError('');
      setSuccessMessage(message);
      toast.success(message);
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: getCurrentAccountStatusQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getMyStudentsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: ['guardian', 'students'] }),
        user?.invalidateQuery?.(),
        refreshIdentity(),
      ]);
      router.replace(
        inDashboard
          ? '/dashboard/parent/overview'
          : buildDashboardSwitchPath('parent', '/dashboard/parent/overview')
      );
    },
    onError: failure => {
      const status = httpStatusOf(failure);
      setDuplicate(status === 409);
      setError(
        status === 409
          ? 'You have already added a child with this name and date of birth. Open Family Hub to view them.'
          : status === 401
            ? 'Your session has expired. Sign in again to add your child.'
            : getErrorMessage(
                failure,
                'Unable to add your child. Review their details and try again.'
              )
      );
      if (status === 401) void signIn('keycloak', { redirectTo: returnPath });
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (add.isPending || duplicate) return;
    setError('');
    const parsed = childSchema.safeParse(fields);
    if (!parsed.success) {
      setError(parsed.error.issues.map(issue => issue.message).join('\n'));
      return;
    }
    add.mutate({
      body: {
        ...parsed.data,
        middle_name: parsed.data.middle_name || undefined,
        dob: localDate(parsed.data.dob),
      },
    });
  }

  if (successMessage)
    return (
      <Card className='mx-auto max-w-xl gap-5 p-8 text-center' role='status'>
        <CheckCircle2 className='text-success mx-auto size-12' aria-hidden />
        <h1 className='text-3xl font-bold'>{successMessage}</h1>
        <p className='text-muted-foreground flex items-center justify-center gap-2'>
          <Spinner aria-hidden /> Returning to Family Hub…
        </p>
      </Card>
    );

  return (
    <div className='mx-auto w-full max-w-xl'>
      <Button asChild variant='ghost' className='mb-6'>
        <Link href={inDashboard ? '/dashboard/parent/overview' : '/onboarding'}>
          {inDashboard ? 'Back to Family Hub' : 'Back to profiles'}
        </Link>
      </Button>
      <Card className='gap-5 rounded-3xl p-6 sm:p-8'>
        <div>
          <h1 className='text-3xl font-bold'>Add your child</h1>
          <p className='text-muted-foreground mt-2'>
            Create a learner profile for a child aged 5–17. Their learning will be linked to your
            parent or guardian account.
          </p>
        </div>
        <form onSubmit={submit} className='space-y-5'>
          <fieldset disabled={add.isPending} className='space-y-4'>
            {(
              [
                ['first_name', 'First name', 'text'],
                ['middle_name', 'Middle name (optional)', 'text'],
                ['last_name', 'Last name', 'text'],
                ['dob', 'Date of birth', 'date'],
              ] as const
            ).map(([key, label, type]) => (
              <div key={key} className='space-y-2'>
                <Label htmlFor={`child-${key}`}>{label}</Label>
                <Input
                  id={`child-${key}`}
                  type={type}
                  value={fields[key]}
                  required={key !== 'middle_name'}
                  onChange={event => {
                    setFields(previous => ({ ...previous, [key]: event.target.value }));
                    setError('');
                    setDuplicate(false);
                  }}
                />
              </div>
            ))}
            <div className='space-y-2'>
              <Label htmlFor='child-relationship'>Relationship</Label>
              <select
                id='child-relationship'
                value={fields.relationship_type}
                onChange={event => {
                  setFields(previous => ({ ...previous, relationship_type: event.target.value }));
                  setError('');
                }}
                className='border-input bg-background h-10 w-full rounded-md border px-3 text-sm'
              >
                <option value='PARENT'>Parent</option>
                <option value='GUARDIAN'>Guardian</option>
              </select>
            </div>
          </fieldset>
          {error && (
            <p role='alert' className='text-destructive text-sm whitespace-pre-line'>
              {error}
            </p>
          )}
          {duplicate && (
            <Button asChild variant='outline'>
              <Link href='/dashboard/parent/overview'>Open Family Hub</Link>
            </Button>
          )}
          <Button
            type='submit'
            className='w-full'
            disabled={add.isPending || !user?.uuid || duplicate}
          >
            {add.isPending && <Spinner className='size-4' />}
            {add.isPending ? 'Adding child…' : 'Add child to my family'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
