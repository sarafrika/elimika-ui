'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { useTimeZone } from '@/context/timezone-context';
import { formatDateTime } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import type { UserDomain } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { AccountStatus } from '@/services/client';
import {
  getCurrentAccountStatusOptions,
  getDomainOnboardingOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useRefreshSessionIdentity } from '@/src/features/auth/use-refresh-session-identity';
import {
  buildDashboardSwitchPath,
  normalizeStoredUserDomain,
} from '@/src/features/dashboard/lib/active-domain-storage';
import { readApplicationDraft, registrationPath } from '@/src/features/onboarding/lib/application-draft';
import {
  isChangesRequested,
  REVIEW_PROFILES,
  reviewDomain,
  sameReviewDomain,
} from '@/src/features/onboarding/lib/application-review';
import { plainText } from '@/src/features/onboarding/lib/plain-text';
import {
  COURSE_CATEGORIES,
  WALLET_SECTIONS,
} from '@/src/features/onboarding/lib/registration-steps';
import { requireApiData } from '@/src/features/onboarding/lib/user-onboarding';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, BookOpen, Clock3, RefreshCw, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useEffect, useState } from 'react';

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:justify-between sm:gap-6'>
      <dt className='text-muted-foreground shrink-0'>{label}</dt>
      <dd className='text-foreground min-w-0 break-words sm:text-right'>{children}</dd>
    </div>
  );
}

export function ApplicationWaitingScreen({
  preferredDomain,
}: {
  preferredDomain: UserDomain | null;
}) {
  const query = useQuery({
    ...getCurrentAccountStatusOptions(),
    staleTime: STALE_TIMES.live,
    select: requireApiData<AccountStatus>,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
  const refreshSessionIdentity = useRefreshSessionIdentity();
  const domain =
    preferredDomain ??
    normalizeStoredUserDomain(
      query.data?.domain_applications?.find(application => application.status === 'PENDING')
        ?.domain ??
      query.data?.domain_applications?.[0]?.domain ??
      query.data?.approved_domains?.[0]
    );
  const approved =
    !!domain && !!query.data?.approved_domains?.some(item => sameReviewDomain(item, domain));
  useEffect(() => {
    if (approved) void refreshSessionIdentity();
  }, [approved, refreshSessionIdentity]);

  if (query.isPending) return <Skeleton className='h-96 w-full max-w-3xl' />;
  if (query.isError || !query.data)
    return (
      <EmptyState
        title='Unable to check your application'
        description='Your dashboard stays locked until approval can be confirmed.'
        action={
          <Button
            variant='outline'
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {query.isFetching ? <Spinner /> : <RefreshCw className='size-4' />} Try again
          </Button>
        }
      />
    );
  if (
    !domain ||
    (!approved &&
      !query.data.domain_applications?.some(application =>
        sameReviewDomain(application.domain, domain)
      ))
  )
    return (
      <EmptyState
        title='No application found'
        description='Choose a profile to begin your application.'
        action={
          <Button asChild>
            <Link href='/onboarding'>Choose a profile</Link>
          </Button>
        }
      />
    );
  return (
    <ApplicationReviewDetails
      domain={domain}
      account={query.data}
      approved={approved}
      checking={query.isFetching}
      refresh={() => void query.refetch()}
    />
  );
}

function ApplicationReviewDetails({
  domain,
  account,
  approved,
  checking,
  refresh,
}: {
  domain: UserDomain;
  account: AccountStatus;
  approved: boolean;
  checking: boolean;
  refresh: () => void;
}) {
  const user = useUserProfile();
  const { zone } = useTimeZone();
  const canonicalDomain = reviewDomain(domain);
  const profile =
    REVIEW_PROFILES[canonicalDomain === 'organisation_user' ? 'organisation_user' : domain];
  const label = profile?.label ?? domain;
  const query = useQuery({
    ...getDomainOnboardingOptions({ path: { domain: canonicalDomain } }),
    enabled: !!user?.uuid,
    staleTime: STALE_TIMES.live,
    select: response => requireApiData(response),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
  const application = account.domain_applications?.find(item =>
    sameReviewDomain(item.domain, domain)
  );
  const onboarding = query.data;
  const rejected =
    !approved &&
    (application?.status === 'REJECTED' ||
      application?.status === 'SUSPENDED' ||
      onboarding?.status === 'rejected' ||
      onboarding?.status === 'suspended');
  const [categories, setCategories] = useState<string[]>([]);
  const [savedSubmittedAt, setSavedSubmittedAt] = useState<string>();
  const [reason, setReason] = useState('');
  const rawReason = application?.review_reason ?? onboarding?.review_reason;
  useEffect(() => {
    setReason(plainText(rawReason));
  }, [rawReason]);
  const changesRequested = rejected && isChangesRequested(reason);
  const role =
    canonicalDomain === 'course_creator'
      ? 'course-creator'
      : canonicalDomain === 'organisation_user'
        ? 'organisation'
        : canonicalDomain;
  useEffect(() => {
    setCategories([]);
    setSavedSubmittedAt(undefined);
    if (!user?.uuid) return;
    const savedApplication = readApplicationDraft(user.uuid, role);
    setSavedSubmittedAt(savedApplication?.submittedAt);
    if (role === 'organisation') {
      const category = savedApplication?.values.category;
      if (typeof category === 'string' && category) setCategories([category]);
      return;
    }
    try {
      const stored: unknown = JSON.parse(
        localStorage.getItem(`elimika:onboarding:${user.uuid}:${role}:interests`) ?? '[]'
      );
      if (Array.isArray(stored))
        setCategories(COURSE_CATEGORIES.filter(category => stored.includes(category)));
    } catch {
      /* Interests are optional summary data when browser storage is unavailable. */
    }
  }, [user?.uuid, role]);
  const walletStep = onboarding?.steps?.find(
    step => step.key === 'skills_wallet' || step.key === 'wallet'
  );
  const counts = walletStep?.counts;
  const completedSections = counts?.sections_completed ?? counts?.skills_wallet_sections_completed;
  const walletKeys = WALLET_SECTIONS.map(section =>
    section.key === 'credentials' ? 'certifications' : section.key
  );
  const walletCount =
    completedSections !== undefined
      ? Number(completedSections)
      : counts && walletKeys.some(key => key in counts)
        ? walletKeys.filter(
          key =>
            Number(counts[key] ?? (key === 'certifications' ? counts.credentials : 0) ?? 0) > 0
        ).length
        : null;
  const hasWallet = canonicalDomain === 'instructor' || canonicalDomain === 'course_creator';
  const submittedAt = application?.submitted_at ?? onboarding?.submitted_at ?? savedSubmittedAt;
  const approvedAt = application?.reviewed_at ?? onboarding?.reviewed_at;
  const formatted = (date: Date | string | undefined) =>
    date ? formatDateTime(date, { zone }) : '—';
  const Icon = approved ? BadgeCheck : rejected ? ShieldAlert : Clock3;

  return (
    <Card className='w-full max-w-3xl'>
      <CardContent className='space-y-8 p-6 sm:p-8'>
        <div className='flex flex-col items-center py-4 text-center' aria-live='polite'>
          <span
            className={cn(
              'grid size-16 place-items-center rounded-full',
              approved
                ? 'bg-success/15 text-success'
                : rejected && !changesRequested
                  ? 'bg-destructive/15 text-destructive'
                  : 'bg-warning/15 text-warning'
            )}
          >
            <Icon className='size-8' aria-hidden='true' />
          </span>
          <p className='text-muted-foreground mt-4 text-xs font-semibold tracking-wider uppercase'>
            {label} application
          </p>
          <h1 className='text-foreground mt-2 text-2xl font-bold'>
            {approved
              ? `Verified — welcome, ${user?.first_name || label.toLowerCase()}`
              : changesRequested
                ? 'Changes requested to your application'
                : rejected
                  ? 'Your application was not approved'
                  : 'Awaiting admin verification'}
          </h1>
          <p className='text-muted-foreground mt-2 max-w-md text-sm leading-6'>
            {approved
              ? profile?.approved
              : changesRequested
                ? 'Review the feedback below and update your skills wallet with the requested changes.'
                : rejected
                  ? 'Review the rejection reasons below. Your application has been turned down.'
                  : profile?.pending}
          </p>
          {rejected && (
            <div
              className={cn(
                'mt-5 w-full rounded-md border p-4 text-left',
                changesRequested
                  ? 'border-warning/30 bg-warning/5'
                  : 'border-destructive/30 bg-destructive/5'
              )}
              role='status'
            >
              <h2 className='text-foreground text-sm font-semibold'>
                {changesRequested ? 'Requested changes' : 'Rejection reasons'}
              </h2>
              <p className='text-muted-foreground mt-2 text-sm'>
                {reason || 'No rejection reason was provided. Contact support for more details.'}
              </p>
            </div>
          )}
          <dl className='divide-border border-border mt-6 w-full divide-y overflow-hidden rounded-md border text-left'>
            <SummaryRow label='Profile'>{label}</SummaryRow>
            <SummaryRow label={canonicalDomain === 'organisation_user' ? 'Organisation category' : 'Categories'}>
              {categories.join(', ') || '—'}
            </SummaryRow>
            {hasWallet && (
              <SummaryRow label='Skills wallet'>
                {walletCount === null
                  ? query.isPending
                    ? 'Loading…'
                    : 'Summary unavailable'
                  : `${walletCount} of ${WALLET_SECTIONS.length} sections`}
              </SummaryRow>
            )}
            <SummaryRow label='Profile details submitted for review'>
              {formatted(submittedAt)}
            </SummaryRow>
            <SummaryRow label={rejected ? 'Reviewed' : 'Verified'}>
              {approved || rejected ? formatted(approvedAt) : 'Pending'}
            </SummaryRow>
          </dl>
          {!approved && (
            <>
              <p className='text-muted-foreground mt-5 text-xs'>
                This page checks for an admin decision every minute. Dashboard access is available
                after approval.
              </p>
              <Button
                variant='outline'
                className='mt-4'
                disabled={checking || query.isFetching}
                onClick={() => {
                  refresh();
                  void query.refetch();
                }}
              >
                {checking || query.isFetching ? <Spinner /> : <RefreshCw className='size-4' />}{' '}
                Check application status
              </Button>
            </>
          )}
        </div>
        {approved && profile?.firstAction && (
          <Button asChild className='w-full'>
            <Link href={buildDashboardSwitchPath(domain, profile.firstAction.path)}>
              {profile.firstAction.label}
            </Link>
          </Button>
        )}
        <div className='border-border flex flex-wrap justify-center gap-3 border-t pt-6'>
          {approved ? (
            <Button asChild variant='outline'>
              <Link href={buildDashboardSwitchPath(domain)}>
                <BookOpen className='size-4' /> Go to dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant='outline' size='sm'>
                <Link href={`/onboarding?${new URLSearchParams({ domain: canonicalDomain })}`}>
                  Profile selection
                </Link>
              </Button>
              <Button asChild variant='outline' size='sm'>
                <Link href={`${registrationPath(canonicalDomain)}?${new URLSearchParams({ step: canonicalDomain === 'organisation_user' ? 'activities' : 'interests', domain: canonicalDomain })}`}>
                  {canonicalDomain === 'organisation_user' ? 'Activities' : 'Interests'}
                </Link>
              </Button>
              <Button asChild variant='outline' size='sm'>
                <Link href={`/onboarding/skills-wallet?${new URLSearchParams({ domain: canonicalDomain })}`}>
                  Edit skills wallet
                </Link>
              </Button>
              <Button asChild variant='outline' size='sm'>
                <Link href={`${registrationPath(canonicalDomain)}?${new URLSearchParams({ step: 'user-information', domain: canonicalDomain })}`}>
                  User information
                </Link>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
