'use client';

import {
  BadgeCheck,
  Check,
  Clock3,
  MessageSquareText,
  PencilLine,
  ShieldAlert,
  ShieldOff,
} from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { type ComponentType, Suspense, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { formatDateTime } from '@/lib/date';
import { getErrorMessage } from '@/lib/error-utils';
import { cn } from '@/lib/utils';
import type { AccountStatus, Onboarding } from '@/services/client';
import { buildDashboardSwitchPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { OnboardingSkillsWallet } from '@/src/features/onboarding/components/OnboardingSkillsWallet';
import {
  useAccountStatus,
  useDomainOnboarding,
} from '@/src/features/onboarding/hooks/useDomainOnboarding';
import {
  isRegisterableDomain,
  onboardingPath,
  type RegisterableDomain,
  verificationPath,
} from '@/src/features/onboarding/lib/user-onboarding';

const SUPPORT_EMAIL = 'hello@sarafrika.com';

const DOMAIN_LABELS: Record<RegisterableDomain, string> = {
  course_creator: 'Course Creator',
  instructor: 'Instructor',
  student: 'Student',
  organisation_user: 'Organisation',
};

type VerificationStatus = NonNullable<Onboarding['status']>;
type Tone = 'success' | 'warning' | 'destructive' | 'muted';

const TONE_CLASSES: Record<Tone, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  muted: 'bg-muted text-muted-foreground',
};

const BADGE_VARIANTS = {
  success: 'success',
  warning: 'warning',
  destructive: 'destructive',
  muted: 'secondary',
} as const satisfies Record<Tone, string>;

type StatusCopy = {
  tag: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  tone: Tone;
};

function statusCopy(status: VerificationStatus, label: string): StatusCopy {
  switch (status) {
    case 'submitted':
      return {
        tag: 'In review',
        title: 'Awaiting admin verification',
        description: `Your ${label} onboarding has been submitted. An Elimika admin will review it before your ${label} dashboard opens.`,
        icon: Clock3,
        tone: 'warning',
      };
    case 'approved':
      return {
        tag: 'Approved',
        title: `Your ${label} account is verified`,
        description: 'Your onboarding has been approved. You can now continue to your dashboard.',
        icon: BadgeCheck,
        tone: 'success',
      };
    case 'rejected':
      return {
        tag: 'Needs changes',
        title: 'Your onboarding needs a few changes',
        description:
          'Read the feedback below, update your details and submit again. Everything you entered is still saved.',
        icon: ShieldAlert,
        tone: 'destructive',
      };
    case 'suspended':
      return {
        tag: 'Suspended',
        title: 'Your verification has been suspended',
        description: 'Read the feedback below. Contact support if you need help with your account.',
        icon: ShieldOff,
        tone: 'destructive',
      };
    default:
      return {
        tag: 'Not submitted',
        title: 'Finish your onboarding',
        description: `You have not submitted your ${label} onboarding yet.`,
        icon: PencilLine,
        tone: 'muted',
      };
  }
}

const APPLICATION_RANK: Record<string, number> = { PENDING: 0, REJECTED: 1, SUSPENDED: 2 };

/** The non-approved application the user most likely came to check: pending, then rejected. */
function pickRelevantDomain(account: AccountStatus | undefined): RegisterableDomain | undefined {
  const candidates = (account?.domain_applications ?? []).filter(
    application =>
      isRegisterableDomain(application.domain) &&
      application.status !== undefined &&
      application.status in APPLICATION_RANK
  );
  candidates.sort(
    (a, b) =>
      (APPLICATION_RANK[a.status ?? ''] ?? 9) - (APPLICATION_RANK[b.status ?? ''] ?? 9) ||
      timeOf(b.submitted_at ?? b.requested_at) - timeOf(a.submitted_at ?? a.requested_at)
  );
  const domain = candidates[0]?.domain;
  return isRegisterableDomain(domain) ? domain : undefined;
}

function timeOf(value: Date | string | undefined) {
  return value ? new Date(value).getTime() || 0 : 0;
}

export default function OnboardingVerificationPage() {
  return (
    <div className='bg-muted/40 min-h-screen px-4 py-12 sm:px-6'>
      <Suspense
        fallback={
          <Card className='mx-auto max-w-2xl'>
            <CardContent className='p-6 sm:p-8'>
              <StatusSkeleton />
            </CardContent>
          </Card>
        }
      >
        <VerificationStatusView />
      </Suspense>
      <div className='mt-4 text-center'>
        <Button asChild variant='link'>
          <Link href='/'>Back home</Link>
        </Button>
      </div>
    </div>
  );
}

function VerificationStatusView() {
  const searchParams = useSearchParams();
  const requestedDomain = searchParams.get('domain');
  const paramDomain = isRegisterableDomain(requestedDomain) ? requestedDomain : undefined;

  const { data: session, status: sessionStatus } = useSession();
  const authenticated = sessionStatus === 'authenticated' && !session?.error;
  const accountStatus = useAccountStatus(authenticated && !paramDomain);
  const accountSettled = !accountStatus.isPending || accountStatus.isError;
  const domain: RegisterableDomain | undefined =
    paramDomain ??
    (accountSettled ? (pickRelevantDomain(accountStatus.data) ?? 'course_creator') : undefined);
  const onboarding = useDomainOnboarding(domain, authenticated);
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState('');

  const handleSignIn = async () => {
    setSigningIn(true);
    setSignInError('');
    try {
      await signIn('keycloak', {
        redirectTo: `${window.location.origin}${verificationPath(paramDomain)}`,
      });
    } catch (cause) {
      setSignInError(getErrorMessage(cause, 'Unable to sign in. Please try again.'));
      setSigningIn(false);
    }
  };

  const state = onboarding.data;
  const loading =
    sessionStatus === 'loading' || (authenticated && (!domain || onboarding.isPending));

  return (
    <>
      <Card className='mx-auto max-w-2xl'>
        <CardContent className='p-6 sm:p-8'>
          {loading ? (
            <StatusSkeleton />
          ) : !authenticated ? (
            <>
              <EmptyState
                variant='plain'
                title='Sign in to check your verification status'
                description='Use the Sarafrika account you registered with.'
                action={
                  <Button onClick={() => void handleSignIn()} disabled={signingIn}>
                    {signingIn && <Spinner />}Sign in
                  </Button>
                }
              />
              {signInError && (
                <p role='alert' className='text-destructive mt-4 text-center text-sm'>
                  {signInError}
                </p>
              )}
            </>
          ) : onboarding.isError || !state || !domain ? (
            <EmptyState
              variant='plain'
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
          ) : (
            <StatusDetails
              domain={domain}
              state={state}
              refreshing={onboarding.isFetching}
              onRefresh={() => void onboarding.refetch()}
            />
          )}
        </CardContent>
      </Card>
      {authenticated && state && (domain === 'instructor' || domain === 'course_creator') && (
        <Card className='mx-auto mt-6 max-w-5xl'>
          <CardContent className='p-4 sm:p-6'>
            <OnboardingSkillsWallet readOnly initialTab='verification' />
          </CardContent>
        </Card>
      )}
    </>
  );
}

function StatusDetails({
  domain,
  state,
  refreshing,
  onRefresh,
}: {
  domain: RegisterableDomain;
  state: Onboarding;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const label = DOMAIN_LABELS[domain];
  const rawStatus = state.status ?? 'not_started';
  // Students who need no approval are active straight away; treat that as approved.
  const status: VerificationStatus =
    domain === 'student' && state.active && rawStatus !== 'rejected' && rawStatus !== 'suspended'
      ? 'approved'
      : rawStatus;
  const copy = statusCopy(status, label);
  const Icon = copy.icon;
  const submitted = status !== 'not_started' && status !== 'in_progress';

  return (
    <div className='space-y-6'>
      <div className='flex flex-col items-center gap-3 text-center'>
        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full',
            TONE_CLASSES[copy.tone]
          )}
        >
          <Icon className='h-6 w-6' />
        </div>
        <Badge variant={BADGE_VARIANTS[copy.tone]}>{copy.tag}</Badge>
        <div className='space-y-1'>
          <h1 className='text-foreground text-xl font-semibold'>{copy.title}</h1>
          <p className='text-muted-foreground mx-auto max-w-md text-sm'>{copy.description}</p>
        </div>
      </div>

      <StatusTracker status={status} />

      <dl className='divide-border border-border divide-y border-y text-sm'>
        <StatusRow label='Account type' value={label} />
        <StatusRow
          label='Submitted'
          value={
            submitted && state.submitted_at ? formatDateTime(state.submitted_at) : 'Not submitted'
          }
        />
        <StatusRow
          label='Reviewed'
          value={
            state.reviewed_at
              ? formatDateTime(state.reviewed_at)
              : submitted
                ? 'Pending'
                : 'Not yet'
          }
        />
      </dl>

      {state.review_reason && (
        <Alert
          className={cn(
            status === 'approved' ? 'border-border' : 'border-destructive/30 bg-destructive/5'
          )}
        >
          <MessageSquareText />
          <AlertTitle>Admin feedback</AlertTitle>
          <AlertDescription className='text-foreground whitespace-pre-line'>
            {state.review_reason}
          </AlertDescription>
        </Alert>
      )}

      <div className='flex flex-wrap justify-center gap-3'>
        <Button variant='outline' disabled={refreshing} onClick={onRefresh}>
          {refreshing && <Spinner />}Refresh status
        </Button>
        <PrimaryAction domain={domain} status={status} />
      </div>

      {status === 'submitted' && (
        <p className='text-muted-foreground text-center text-xs'>
          We will email you and notify you in the app when there is a decision.
        </p>
      )}
    </div>
  );
}

function PrimaryAction({
  domain,
  status,
}: {
  domain: RegisterableDomain;
  status: VerificationStatus;
}) {
  switch (status) {
    case 'approved':
      return (
        <Button asChild>
          <Link href={buildDashboardSwitchPath(domain)}>
            {domain === 'student' ? 'Start learning' : 'Go to dashboard'}
          </Link>
        </Button>
      );
    case 'rejected':
      return (
        <Button asChild>
          <Link href={onboardingPath(domain)}>Update and resubmit</Link>
        </Button>
      );
    case 'in_progress':
    case 'not_started':
      return (
        <Button asChild>
          <Link href={onboardingPath(domain)}>Continue onboarding</Link>
        </Button>
      );
    case 'suspended':
      return (
        <Button asChild>
          <a href={`mailto:${SUPPORT_EMAIL}`}>Contact support</a>
        </Button>
      );
    default:
      return null;
  }
}

type StepState = 'done' | 'current' | 'upcoming';

function trackerSteps(
  status: VerificationStatus
): { label: string; state: StepState; tone?: Tone }[] {
  const decided = status === 'approved' || status === 'rejected' || status === 'suspended';
  const decisionLabel =
    status === 'approved'
      ? 'Approved'
      : status === 'rejected'
        ? 'Needs changes'
        : status === 'suspended'
          ? 'Suspended'
          : 'Decision';
  return [
    {
      label: 'Submitted',
      state: status === 'not_started' || status === 'in_progress' ? 'current' : 'done',
    },
    {
      label: 'In review',
      state: decided ? 'done' : status === 'submitted' ? 'current' : 'upcoming',
    },
    {
      label: decisionLabel,
      state: decided ? 'done' : 'upcoming',
      tone: decided ? (status === 'approved' ? 'success' : 'destructive') : undefined,
    },
  ];
}

function StatusTracker({ status }: { status: VerificationStatus }) {
  const steps = trackerSteps(status);
  return (
    <ol className='flex items-start' aria-label='Verification progress'>
      {steps.map((step, index) => (
        <li key={step.label} className='relative flex flex-1 flex-col items-center gap-2'>
          {index > 0 && (
            <span
              aria-hidden
              className={cn(
                'absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2',
                step.state === 'upcoming' ? 'bg-border' : 'bg-primary'
              )}
            />
          )}
          <span
            className={cn(
              'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold',
              step.state === 'done' &&
                (step.tone === 'success'
                  ? 'border-success bg-success text-success-foreground'
                  : step.tone === 'destructive'
                    ? 'border-destructive bg-destructive text-primary-foreground'
                    : 'border-primary bg-primary text-primary-foreground'),
              step.state === 'current' && 'border-primary bg-card text-primary',
              step.state === 'upcoming' && 'border-border bg-card text-muted-foreground'
            )}
          >
            {step.state === 'done' ? <Check className='h-4 w-4' /> : index + 1}
          </span>
          <span
            className={cn(
              'text-center text-xs font-medium',
              step.state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground'
            )}
            aria-current={step.state === 'current' ? 'step' : undefined}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function StatusSkeleton() {
  return (
    <div className='flex flex-col items-center gap-4'>
      <Skeleton className='h-14 w-14 rounded-full' />
      <Skeleton className='h-5 w-24' />
      <Skeleton className='h-6 w-64' />
      <Skeleton className='h-4 w-full max-w-md' />
      <Skeleton className='mt-2 h-12 w-full' />
      <Skeleton className='h-32 w-full' />
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
