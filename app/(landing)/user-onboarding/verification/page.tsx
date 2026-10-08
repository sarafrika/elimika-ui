'use client';

import { BadgeCheck, Clock3, ShieldAlert } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { formatDateTime } from '@/lib/date';
import { getErrorMessage } from '@/lib/error-utils';
import { buildDashboardSwitchPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useCourseCreatorOnboarding } from '@/src/features/onboarding/hooks/useCourseCreatorOnboarding';
import { ONBOARDING_VERIFICATION_PATH } from '@/src/features/onboarding/lib/user-onboarding';
import { OnboardingSkillsWallet } from '@/src/features/onboarding/components/OnboardingSkillsWallet';

const STATUS_CONTENT = {
  DRAFT: {
    title: 'Complete your onboarding',
    description: 'Your course creator onboarding has not been submitted yet.',
    icon: Clock3,
  },
  SUBMITTED: {
    title: 'Awaiting admin verification',
    description:
      'Your course creator onboarding has been submitted. An Elimika admin will review your information before you can create courses.',
    icon: Clock3,
  },
  APPROVED: {
    title: 'Your course creator account is verified',
    description: 'Your onboarding has been approved. You can now continue to your dashboard.',
    icon: BadgeCheck,
  },
  REJECTED: {
    title: 'Your onboarding needs changes',
    description:
      'An admin has reviewed your onboarding. Check the feedback below, update your categories and submit again.',
    icon: ShieldAlert,
  },
  REVOKED: {
    title: 'Your verification has been revoked',
    description:
      'Review the admin feedback below. Contact support if you need help with your account.',
    icon: ShieldAlert,
  },
};

export default function OnboardingVerificationPage() {
  const { data: session, status: sessionStatus } = useSession();
  const authenticated = sessionStatus === 'authenticated' && !session?.error;
  const onboarding = useCourseCreatorOnboarding(authenticated);
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState('');
  const state = onboarding.data;
  const content = state?.verification_status
    ? STATUS_CONTENT[state.verification_status]
    : undefined;

  const handleSignIn = async () => {
    setSigningIn(true);
    setSignInError('');
    try {
      await signIn('keycloak', {
        redirectTo: `${window.location.origin}${ONBOARDING_VERIFICATION_PATH}`,
      });
    } catch (cause) {
      setSignInError(getErrorMessage(cause, 'Unable to sign in. Please try again.'));
      setSigningIn(false);
    }
  };

  return (
    <div className='bg-muted/40 min-h-screen px-4 py-12 sm:px-6'>
      <Card className='mx-auto max-w-2xl'>
        <CardContent className='p-6 sm:p-8'>
          {sessionStatus === 'loading' || (authenticated && onboarding.isPending) ? (
            <Skeleton className='h-64 w-full' />
          ) : !authenticated ? (
            <>
              <EmptyState
                title='Sign in to check your verification status'
                description='Use the Sarafrika account you registered with.'
                action={
                  <Button onClick={() => void handleSignIn()} disabled={signingIn}>
                    {signingIn && <Spinner />}Sign in
                  </Button>
                }
              />
              {signInError && (
                <p role='alert' className='text-destructive mt-4 text-sm'>
                  {signInError}
                </p>
              )}
            </>
          ) : onboarding.isError ? (
            <EmptyState
              title='Unable to check verification status'
              description={getErrorMessage(onboarding.error, 'Please try again.')}
              action={
                <Button
                  variant='outline'
                  disabled={onboarding.isFetching}
                  onClick={() => void onboarding.refetch()}
                >
                  {onboarding.isFetching && <Spinner />}Try again
                </Button>
              }
            />
          ) : content && state ? (
            <>
              <EmptyState
                variant='plain'
                icon={content.icon}
                title={content.title}
                description={content.description}
              />
              <dl className='divide-border divide-y text-sm'>
                <StatusRow label='Status' value={state.verification_status} />
                <StatusRow
                  label='Submitted'
                  value={
                    state.submitted_at || state.verification_requested_at
                      ? formatDateTime(state.submitted_at ?? state.verification_requested_at)
                      : 'Not submitted'
                  }
                />
                <StatusRow
                  label='Reviewed'
                  value={state.reviewed_at ? formatDateTime(state.reviewed_at) : 'Pending'}
                />
                {state.review_reason && (
                  <StatusRow label='Admin feedback' value={state.review_reason} />
                )}
              </dl>
              <div className='mt-6 flex flex-wrap justify-center gap-3'>
                <Button
                  variant='outline'
                  disabled={onboarding.isFetching}
                  onClick={() => void onboarding.refetch()}
                >
                  {onboarding.isFetching && <Spinner />}Refresh status
                </Button>
                {state.verification_status === 'APPROVED' && (
                  <Button asChild>
                    <Link href={buildDashboardSwitchPath('course_creator')}>Go to dashboard</Link>
                  </Button>
                )}
                {(state.verification_status === 'DRAFT' ||
                  state.verification_status === 'REJECTED') && (
                  <Button asChild>
                    <Link href='/user-onboarding'>Continue onboarding</Link>
                  </Button>
                )}
              </div>
              {state.verification_status === 'SUBMITTED' && (
                <p className='text-muted-foreground mt-4 text-center text-xs'>
                  Status refreshes automatically every five minutes.
                </p>
              )}
            </>
          ) : (
            <EmptyState
              title='Verification status is unavailable'
              description='Please refresh to check your onboarding status.'
              action={
                <Button variant='outline' onClick={() => void onboarding.refetch()}>
                  Refresh status
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
      {authenticated && state && (
        <Card className='mx-auto mt-6 max-w-5xl'>
          <CardContent className='p-4 sm:p-6'>
            <OnboardingSkillsWallet readOnly initialTab='verification' />
          </CardContent>
        </Card>
      )}
      <div className='mt-4 text-center'>
        <Button asChild variant='link'>
          <Link href='/'>Back home</Link>
        </Button>
      </div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className='flex justify-between gap-4 py-3'>
      <dt className='text-muted-foreground'>{label}</dt>
      <dd className='text-foreground text-right font-medium'>{value ?? '—'}</dd>
    </div>
  );
}
