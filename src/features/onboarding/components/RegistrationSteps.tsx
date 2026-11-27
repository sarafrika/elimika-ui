'use client';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { type ReactNode, Suspense, useState } from 'react';
import { interestDomain } from '../lib/interests';
import { RegistrationInterests } from './RegistrationInterests';
import { RegistrationSkillsWallet } from './RegistrationSkillsWallet';

type RegistrationRole = 'student' | 'instructor' | 'course-creator' | 'organisation';
type Props = { role: RegistrationRole; children: ReactNode; backHref?: string };

export function RegistrationSteps(props: Props) {
  return (
    <Suspense fallback={<Skeleton className='mx-auto h-96 w-full max-w-3xl' />}>
      <RegistrationStepsContent {...props} />
    </Suspense>
  );
}

function RegistrationStepsContent({ role, children, backHref = '/onboarding' }: Props) {
  const searchParams = useSearchParams();
  const requestedStep = searchParams.get('step');
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
      key={`${user.uuid}:${role}:${requestedStep}`}
      role={role}
      initialDetails={
        requestedStep === 'user-information' ||
        (role === 'organisation' &&
          (requestedStep === 'activities' || requestedStep === 'verification'))
      }
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
  initialDetails = false,
}: Props & { userUuid: string; initialDetails?: boolean }) {
  const needsWallet = role === 'instructor' || role === 'course-creator';
  const [step, setStep] = useState(initialDetails ? (needsWallet ? 2 : 1) : 0);
  const [detailsVisited, setDetailsVisited] = useState(initialDetails);
  const [walletVisited, setWalletVisited] = useState(initialDetails && needsWallet);
  const domain = interestDomain(role);
  const detailsStep = needsWallet ? 2 : 1;

  const showDetails = () => {
    setDetailsVisited(true);
    setStep(detailsStep);
  };
  const continueFromInterests = () => {
    if (needsWallet) {
      setWalletVisited(true);
      setStep(1);
    } else showDetails();
  };

  return (
    <div className={cn('mx-auto w-full', needsWallet && step === 1 ? 'max-w-7xl' : 'max-w-5xl')}>
      <div hidden={step !== 0} className='space-y-4'>
        <Button asChild variant='link' className='h-auto px-0 py-1 has-[>svg]:px-0'>
          <Link href={backHref}>
            <ArrowLeft className='size-4' aria-hidden='true' />
            Back to profiles
          </Link>
        </Button>
        {step === 0 && domain && (
          <RegistrationInterests
            domain={domain}
            userUuid={userUuid}
            onContinue={continueFromInterests}
          />
        )}
      </div>
      {needsWallet && walletVisited ? (
        <div hidden={step !== 1}>
          <RegistrationSkillsWallet
            active={step === 1}
            onBack={() => setStep(0)}
            onContinue={showDetails}
          />
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
