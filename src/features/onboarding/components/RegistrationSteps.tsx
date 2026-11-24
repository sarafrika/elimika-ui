'use client';

import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { COURSE_CATEGORIES } from '../lib/registration-steps';
import { RegistrationSkillsWallet } from './RegistrationSkillsWallet';

type RegistrationRole = 'student' | 'instructor' | 'course-creator' | 'organisation';
type Props = { role: RegistrationRole; children: ReactNode; backHref?: string };

export function RegistrationSteps({ role, children, backHref = '/onboarding' }: Props) {
  const user = useUserProfile();
  if (!user || user.isLoading)
    return (
      <div className='mx-auto w-full max-w-3xl space-y-4'>
        <Skeleton className='h-16 w-full' />
        <Skeleton className='h-80 w-full' />
      </div>
    );
  if (!user.uuid)
    return (
      <EmptyState
        title='Unable to load your profile'
        description='Refresh the page to continue registration.'
      />
    );
  return (
    <AccountRegistrationSteps
      key={`${user.uuid}:${role}`}
      role={role}
      userUuid={user.uuid}
      backHref={backHref}
    >
      {children}
    </AccountRegistrationSteps>
  );
}

function AccountRegistrationSteps({
  role,
  userUuid,
  children,
  backHref = '/onboarding',
}: Props & { userUuid: string }) {
  const needsWallet = role === 'instructor' || role === 'course-creator';
  const [step, setStep] = useState(0);
  const [detailsVisited, setDetailsVisited] = useState(false);
  const [walletVisited, setWalletVisited] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const storageKey = `elimika:onboarding:${userUuid}:${role}:interests`;
  const detailsStep = needsWallet ? 2 : 1;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const stored: unknown = JSON.parse(raw);
        if (Array.isArray(stored))
          setCategories(COURSE_CATEGORIES.filter(category => stored.includes(category)));
      }
    } catch {
      setStorageUnavailable(true);
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(categories));
    } catch {
      setStorageUnavailable(true);
    }
  }, [categories, hydrated, storageKey]);

  const showDetails = () => {
    setDetailsVisited(true);
    setStep(detailsStep);
  };
  const continueFromInterests = () => {
    if (!categories.length) return;
    if (needsWallet) {
      setWalletVisited(true);
      setStep(1);
    } else showDetails();
  };

  return (
    <div className={cn('mx-auto w-full', needsWallet && step === 1 ? 'max-w-7xl' : 'max-w-4xl')}>
      <div hidden={step !== 0}>
        <Card>
          <CardHeader>
            <CardTitle>
              <h1>Select your interests</h1>
            </CardTitle>
            <CardDescription>
              {role === 'student'
                ? 'What would you like to learn? Select at least one category to continue.'
                : role === 'organisation'
                  ? 'Select the categories your organisation is interested in.'
                  : 'Select the categories you want to offer courses in.'}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-5'>
            {!hydrated ? (
              <Skeleton className='h-64 w-full' />
            ) : (
              <div className='grid gap-2 sm:grid-cols-2'>
                {COURSE_CATEGORIES.map(category => {
                  const selected = categories.includes(category);
                  return (
                    <Button
                      key={category}
                      type='button'
                      variant='outline'
                      aria-pressed={selected}
                      onClick={() =>
                        setCategories(current =>
                          selected
                            ? current.filter(item => item !== category)
                            : [...current, category]
                        )
                      }
                      className={cn(
                        'h-auto min-h-12 justify-between gap-3 px-4 py-3 text-left whitespace-normal',
                        selected
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border bg-background text-muted-foreground'
                      )}
                    >
                      {category}
                      {selected ? <CheckCircle2 className='text-primary size-4 shrink-0' /> : null}
                    </Button>
                  );
                })}
              </div>
            )}
            <p className='text-muted-foreground text-sm'>
              Your interests are saved on this browser. You can change them by returning to this
              step.
            </p>
            {storageUnavailable ? (
              <p role='status' className='text-warning text-sm'>
                Browser storage is unavailable. Your selections will be kept for this visit only.
              </p>
            ) : null}
            <div className='flex justify-between gap-3'>
              <Button asChild variant='outline'>
                <Link href={backHref}>Back to profiles</Link>
              </Button>
              <Button
                type='button'
                disabled={!hydrated || categories.length === 0}
                onClick={continueFromInterests}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      {needsWallet && walletVisited ? (
        <div hidden={step !== 1}>
          <Card>
            <CardHeader>
              <CardTitle>
                <h1>Build your skills wallet</h1>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RegistrationSkillsWallet
                active={step === 1}
                onBack={() => setStep(0)}
                onContinue={showDetails}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
      {detailsVisited ? (
        <div hidden={step !== detailsStep} className='space-y-4'>
          <Button
            type='button'
            variant='link'
            className='h-auto px-0 py-1 has-[>svg]:px-0'
            onClick={() => setStep(detailsStep - 1)}
          >
            <ArrowLeft className='size-4' aria-hidden='true' />
            Back to {needsWallet ? 'skills wallet' : 'interests'}
          </Button>
          {children}
        </div>
      ) : null}
    </div>
  );
}
