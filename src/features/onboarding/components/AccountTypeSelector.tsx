'use client';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, Check, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup } from '@/components/ui/radio-group';
import Spinner from '@/components/ui/spinner';
import { useUserProfile } from '@/context/profile-context';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import { getCurrentAccountStatusOptions } from '@/services/client/@tanstack/react-query.gen';
import { buildDashboardSwitchPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { ADULT_AGE, ageFrom, STARTING_PATHS } from '@/src/features/onboarding/lib/starting-paths';

export function AccountTypeSelector() {
  const [selectedId, setSelectedId] = useState('');
  const router = useRouter();
  const user = useUserProfile();
  const {
    data: accountStatus,
    isPending,
    isError,
  } = useQuery({
    ...getCurrentAccountStatusOptions(),
    enabled: !!user?.uuid,
    staleTime: STALE_TIMES.entity,
    select: response => (response.error || response.success === false ? undefined : response.data),
    retry: false,
  });
  const age = ageFrom(user?.dob);
  const minor = age !== null && age < ADULT_AGE;
  const intent = STARTING_PATHS.find(path => path.id === selectedId);
  const domains = accountStatus?.approved_domains ?? [];
  const hasDomain = (domain: string | undefined) =>
    !!domain &&
    (domains.includes(domain) ||
      (domain === 'organisation' && domains.includes('organisation_user')));
  const existing = hasDomain(intent?.domain);
  const blocked = !!intent?.adultOnly && minor;
  const unavailable = !!intent && !existing && !intent.onboardingHref;
  const loading = !user || user.isLoading || isPending;
  const statusUnavailable = isError || (!isPending && !accountStatus);
  const href =
    existing && intent?.domain
      ? buildDashboardSwitchPath(intent.domain, intent.dashboardHref)
      : intent?.onboardingHref;

  return (
    <div className='mt-10 grid gap-6 lg:grid-cols-[1fr_340px]'>
      <RadioGroup
        aria-label='Goals'
        value={selectedId}
        onValueChange={setSelectedId}
        className='grid content-start gap-3 sm:grid-cols-2'
      >
        {STARTING_PATHS.map(path => {
          const active = selectedId === path.id;
          const Icon = path.icon;
          const adultOnly = path.adultOnly && minor;
          return (
            <Card
              key={path.id}
              className={cn(
                'relative gap-0 rounded-2xl p-0 transition-all hover:shadow-md motion-safe:hover:-translate-y-0.5',
                active && 'border-primary ring-primary/25 ring-2',
                adultOnly && 'opacity-55'
              )}
            >
              <RadioGroupPrimitive.Item value={path.id} asChild>
                <Button
                  variant='ghost'
                  className='hover:bg-primary/5 relative h-full w-full items-start justify-start gap-4 rounded-2xl p-5 text-left whitespace-normal'
                >
                  <span
                    className={cn(
                      'grid size-11 shrink-0 place-items-center rounded-xl transition-colors',
                      active ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                    )}
                  >
                    <Icon className='size-5' aria-hidden />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='text-muted-foreground block pr-5 text-[11px] font-medium tracking-wider uppercase'>
                      I want to
                    </span>
                    <span className='text-foreground block text-lg font-semibold'>
                      {path.title}
                    </span>
                    <span className='text-muted-foreground mt-1 block text-sm font-normal'>
                      {path.description}
                    </span>
                    {hasDomain(path.domain) && (
                      <span className='text-success mt-2 block text-xs font-semibold'>
                        ✓ You have this profile
                      </span>
                    )}
                    {adultOnly && (
                      <span className='text-destructive mt-2 block text-xs font-semibold'>
                        18+ only
                      </span>
                    )}
                  </span>
                  {active && (
                    <span className='bg-primary text-primary-foreground absolute top-4 right-4 grid size-5 place-items-center rounded-full'>
                      <Check className='size-3' aria-hidden />
                    </span>
                  )}
                </Button>
              </RadioGroupPrimitive.Item>
            </Card>
          );
        })}
      </RadioGroup>

      <aside aria-label='Your starting path' className='lg:sticky lg:top-24 lg:self-start'>
        <Card className='bg-primary text-primary-foreground gap-0 overflow-hidden rounded-3xl border-0 p-6 shadow-lg'>
          <div aria-live='polite' aria-atomic='true'>
            <p className='text-[11px] font-semibold tracking-[0.2em] uppercase opacity-80'>
              Your starting path
            </p>
            {intent ? (
              <>
                <h2 className='mt-3 text-3xl font-bold tracking-tight'>{intent.title}</h2>
                <p className='mt-2 text-sm opacity-90'>
                  {existing ? (
                    <>
                      Open your <b>{intent.destination}</b> with your existing{' '}
                      <b>{intent.mapping.toLowerCase()}</b>.
                    </>
                  ) : (
                    <>
                      We&apos;ll guide you through setting up your{' '}
                      <b>{intent.mapping.toLowerCase()}</b> for your <b>{intent.destination}</b>.
                    </>
                  )}
                </p>
                <dl className='bg-primary-foreground/10 mt-5 space-y-3 rounded-xl p-4 text-xs'>
                  <div className='flex justify-between gap-4'>
                    <dt className='opacity-75'>{existing ? 'Profile' : 'Creates'}</dt>
                    <dd className='text-right'>{intent.mapping}</dd>
                  </div>
                  <div className='flex justify-between gap-4'>
                    <dt className='opacity-75'>First destination</dt>
                    <dd className='text-right'>{intent.destination}</dd>
                  </div>
                  <div className='flex justify-between gap-4'>
                    <dt className='opacity-75'>Verification</dt>
                    <dd className='text-right'>
                      {intent.id === 'learn'
                        ? 'None to start'
                        : intent.kind === 'organisation'
                          ? 'Organisation checks'
                          : intent.id === 'child'
                            ? 'Guardian relationship'
                            : 'Before going live'}
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className='mt-3 text-sm opacity-80'>
                Select a goal to see what we&apos;ll set up for you.
              </p>
            )}
            <p className='mt-5 text-xs opacity-75'>
              One sign-in. Add teaching, creator or other profiles anytime.
            </p>
            {blocked && (
              <p className='bg-primary-foreground/10 mt-4 flex gap-2 rounded-xl p-3 text-xs'>
                <AlertTriangle className='size-4 shrink-0' aria-hidden /> This path requires you to
                be 18 or older. Choose Learn &amp; Grow instead.
              </p>
            )}
            {existing && (
              <p className='bg-primary-foreground/10 mt-4 flex gap-2 rounded-xl p-3 text-xs'>
                <Info className='size-4 shrink-0' aria-hidden /> You already have this profile —
                we&apos;ll take you straight there.
              </p>
            )}
            {unavailable && (
              <p className='bg-primary-foreground/10 mt-4 flex gap-2 rounded-xl p-3 text-xs'>
                <Info className='size-4 shrink-0' aria-hidden />{' '}
                Individual funder profile setup is not available yet. Please choose another starting path.
              </p>
            )}
            {statusUnavailable && (
              <p className='mt-4 text-xs'>
                We couldn&apos;t check your existing profiles. Refresh the page to try again.
              </p>
            )}
          </div>
          <Button
            variant='secondary'
            size='lg'
            className='mt-6 h-auto min-h-11 w-full whitespace-normal'
            disabled={!intent || blocked || unavailable || loading || statusUnavailable}
            onClick={() => {
              if (href) router.push(href);
            }}
          >
            {loading ? (
              <>
                <Spinner className='size-4' /> Loading profiles
              </>
            ) : existing ? (
              'Open workspace'
            ) : unavailable ? (
              'Setup unavailable'
            ) : intent?.profileLabel ? (
              `Add ${intent.profileLabel} profile`
            ) : (
              'Continue'
            )}
            {!loading && <ArrowRight className='size-4' aria-hidden />}
          </Button>
        </Card>
      </aside>
    </div>
  );
}
