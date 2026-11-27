'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { httpStatusOf } from '@/lib/api-errors';
import { localDate } from '@/lib/date';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import type { GenderEnum2 } from '@/services/client';
import {
  acceptByTokenMutation,
  getByTokenOptions,
  getCurrentAccountStatusQueryKey,
  getMyStudentsQueryKey,
  registerAndAcceptMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useRefreshSessionIdentity } from '@/src/features/auth/use-refresh-session-identity';
import { buildDashboardSwitchPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { guardianRegistrationSchema } from './validation';
import { requireApiData } from '@/src/features/onboarding/lib/user-onboarding';

export function GuardianRegistration({ token }: { token: string }) {
  if (!token)
    return (
      <EmptyState
        title='Invalid invitation'
        description='Ask the student to send a new invitation.'
      />
    );
  return <GuardianRegistrationContent token={token} />;
}

function GuardianRegistrationContent({ token }: { token: string }) {
  const { status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const refreshIdentity = useRefreshSessionIdentity();
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);
  const [gender, setGender] = useState<GenderEnum2 | undefined>();
  const [terms, setTerms] = useState(false);
  const [fields, setFields] = useState({
    first_name: '',
    last_name: '',
    email: '',
    dob: '',
    password: '',
  });
  const invitation = useQuery({
    ...getByTokenOptions({ path: { token } }),
    enabled: Boolean(token),
    staleTime: STALE_TIMES.live,
    retry: false,
    select: response => requireApiData(response),
  });
  const request = invitation.data;
  const registration = useMutation({ ...registerAndAcceptMutation(), retry: false });
  const accept = useMutation({ ...acceptByTokenMutation(), retry: false });
  const pending = registration.isPending || accept.isPending || signingIn;
  const returnHere = `/guardian-links/${encodeURIComponent(token)}`;

  async function startSignIn(toDashboard = false) {
    setSigningIn(true);
    try {
      await signIn(
        'keycloak',
        { redirectTo: toDashboard ? '/dashboard/parent/overview' : returnHere },
        {
          ...(fields.email.trim() ? { login_hint: fields.email.trim() } : {}),
          ...(status === 'authenticated' ? { prompt: 'login' } : {}),
        }
      );
    } catch {
      setError('Unable to open sign in. Please try again.');
    } finally {
      setSigningIn(false);
    }
  }

  function showError(failure: unknown) {
    const code = httpStatusOf(failure);
    if (code === 409) setHasAccount(true);
    setError(
      code === 409
        ? 'This email already has an account. Sign in with the invited email address to accept this invitation.'
        : code === 404 || code === 410
          ? 'This invitation is invalid or has expired. Ask the student to send a new invitation.'
          : getErrorMessage(
              failure,
              'Unable to complete registration. Check that your email matches the invitation, you are at least 18, and your password meets the password policy.'
            )
    );
    if (code === 401) void startSignIn();
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError('');
    const parsed = guardianRegistrationSchema.safeParse({
      ...fields,
      gender,
      terms_accepted: terms,
    });
    if (!parsed.success) {
      setError(parsed.error.issues.map(issue => issue.message).join('\n'));
      return;
    }
    try {
      const response = await registration.mutateAsync({
        path: { token },
        body: { ...parsed.data, dob: localDate(parsed.data.dob) },
      });
      const link = requireApiData(response);
      if (!link.uuid || !link.student_uuid)
        throw new Error('The guardian link was not confirmed. Please try again.');
      setFields(previous => ({ ...previous, password: '' }));
      setRegistered(true);
      await startSignIn(true);
    } catch (failure) {
      showError(failure);
    }
  }

  async function acceptInvitation() {
    if (pending) return;
    setError('');
    try {
      const link = requireApiData(await accept.mutateAsync({ path: { token } }));
      if (!link.uuid || !link.student_uuid)
        throw new Error('The guardian link was not confirmed. Please try again.');
      await Promise.allSettled([
        refreshIdentity(),
        queryClient.invalidateQueries({ queryKey: getCurrentAccountStatusQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getMyStudentsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: ['guardian', 'students'] }),
      ]);
      router.replace(buildDashboardSwitchPath('parent', '/dashboard/parent/overview'));
    } catch (failure) {
      showError(failure);
    }
  }

  if (registered)
    return (
      <Card className='space-y-4 p-8 text-center' role='status'>
        <CheckCircle2 className='text-success mx-auto size-12' aria-hidden />
        <h1 className='text-2xl font-bold'>Your guardian account is ready</h1>
        <p className='text-muted-foreground'>
          You’re linked to {request?.student_name || 'your child'}. Sign in now with your email and
          the password you just chose to open Family Hub.
        </p>
        {error && (
          <p role='alert' className='text-destructive text-sm'>
            {error}
          </p>
        )}
        <Button disabled={signingIn} onClick={() => void startSignIn(true)}>
          {signingIn && <Spinner />}Sign in to Family Hub
        </Button>
      </Card>
    );

  if (invitation.isLoading || status === 'loading')
    return <Skeleton className='h-[520px] w-full rounded-xl' />;
  if (invitation.isError || !request)
    return (
      <EmptyState
        title='Unable to open this invitation'
        description={getErrorMessage(
          invitation.error,
          'This invitation may be invalid or expired. Ask the student for a new invitation.'
        )}
        action={
          <Button variant='outline' onClick={() => void invitation.refetch()}>
            Try again
          </Button>
        }
      />
    );
  if (!request.actionable)
    return (
      <EmptyState
        title='This invitation is no longer available'
        description='It may have expired, already been accepted, or been withdrawn. Ask the student for a new invitation if you still need access.'
        action={
          request.status === 'linked' ? (
            <Button onClick={() => void startSignIn(true)}>Sign in to Family Hub</Button>
          ) : undefined
        }
      />
    );

  return (
    <Card className='gap-6 rounded-2xl p-6 sm:p-8'>
      <div>
        <h1 className='text-2xl font-bold'>
          Support {request.student_name || 'your child'}’s learning
        </h1>
        <p className='text-muted-foreground mt-2'>
          You’ve been invited as a parent or guardian. This invitation was sent to{' '}
          {request.masked_guardian_email || 'your email address'}.
        </p>
      </div>
      {status === 'authenticated' ? (
        <div className='space-y-4'>
          <p>
            Accept this invitation using the account with the invited email address to connect to
            this learner.
          </p>
          <Button disabled={pending} onClick={() => void acceptInvitation()}>
            {pending && <Spinner />}Accept invitation
          </Button>
          {error && (
            <Button variant='outline' disabled={pending} onClick={() => void startSignIn()}>
              Sign in with the invited email
            </Button>
          )}
        </div>
      ) : request.has_account || hasAccount ? (
        <div className='space-y-4'>
          <p>
            You already have an Elimika account. Sign in with the invited email address, then accept
            this invitation.
          </p>
          <Button disabled={pending} onClick={() => void startSignIn()}>
            {pending && <Spinner />}Sign in to accept
          </Button>
        </div>
      ) : (
        <form onSubmit={register} className='space-y-5'>
          <fieldset disabled={pending} className='space-y-4'>
            {(
              [
                ['first_name', 'First name', 'text', 'given-name'],
                ['last_name', 'Last name', 'text', 'family-name'],
                ['email', 'Invited email address', 'email', 'email'],
                ['dob', 'Date of birth', 'date', 'bday'],
                ['password', 'Password', 'password', 'new-password'],
              ] as const
            ).map(([key, label, type, autoComplete]) => (
              <div key={key} className='space-y-2'>
                <Label htmlFor={`guardian-${key}`}>{label}</Label>
                <Input
                  id={`guardian-${key}`}
                  type={type}
                  autoComplete={autoComplete}
                  required
                  value={fields[key]}
                  minLength={key === 'password' ? 8 : undefined}
                  maxLength={key === 'password' ? 128 : undefined}
                  onChange={event =>
                    setFields(previous => ({ ...previous, [key]: event.target.value }))
                  }
                />
                {key === 'email' && (
                  <p className='text-muted-foreground text-xs'>
                    Use the exact email address that received this invitation.
                  </p>
                )}
                {key === 'dob' && (
                  <p className='text-muted-foreground text-xs'>
                    Parents and guardians must be at least 18 years old.
                  </p>
                )}
                {key === 'password' && (
                  <p className='text-muted-foreground text-xs'>
                    Use 8–128 characters. Additional password requirements will be shown if your
                    password is rejected.
                  </p>
                )}
              </div>
            ))}
            <div className='space-y-2'>
              <Label htmlFor='guardian-gender'>Gender (optional)</Label>
              <select
                id='guardian-gender'
                value={gender ?? ''}
                onChange={event => {
                  const value = event.target.value;
                  setGender(
                    value === 'MALE' || value === 'FEMALE' || value === 'PREFER_NOT_TO_SAY'
                      ? value
                      : undefined
                  );
                }}
                className='border-input bg-background h-10 w-full rounded-md border px-3 text-sm'
              >
                <option value=''>Select gender</option>
                <option value='MALE'>Male</option>
                <option value='FEMALE'>Female</option>
                <option value='PREFER_NOT_TO_SAY'>Prefer not to say</option>
              </select>
            </div>
            <div className='flex items-start gap-3'>
              <Checkbox
                id='guardian-terms'
                checked={terms}
                onCheckedChange={value => setTerms(value === true)}
              />
              <Label htmlFor='guardian-terms' className='text-sm leading-relaxed'>
                I accept the terms of use.
              </Label>
            </div>
          </fieldset>
          <Button type='submit' disabled={pending} className='w-full'>
            {pending && <Spinner />}
            {registration.isPending ? 'Creating account…' : 'Create guardian account'}
          </Button>
          <p className='text-muted-foreground text-sm'>
            After registration, sign in immediately using this password to access Family Hub.
          </p>
          <Button
            type='button'
            variant='link'
            disabled={pending}
            onClick={() => void startSignIn()}
          >
            Already have an account? Sign in
          </Button>
        </form>
      )}
      {error && (
        <p role='alert' className='text-destructive text-sm whitespace-pre-line'>
          {error}
        </p>
      )}
    </Card>
  );
}
