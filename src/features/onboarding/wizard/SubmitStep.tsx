'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, ShieldCheck } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import type { Onboarding } from '@/services/client';
import {
  getSummaryOptions,
  submitDomainOnboardingMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { isDomainOnboardingKey } from '../hooks/useDomainOnboarding';
import { type RegisterableDomain, requireApiData } from '../lib/user-onboarding';
import { WALLET_SECTIONS } from '../lib/wallet-sections';
import { FormError, StepBody, StepFooter, SummaryRow } from './OnboardingFrame';
import { ROLE_COPY } from './wizard-model';

type Props = {
  domain: RegisterableDomain;
  name?: string | null;
  email?: string | null;
  onboarding: Onboarding | undefined;
  onboardingPending: boolean;
  onBack: () => void;
  onSubmitted: () => void;
};

export function SubmitStep({
  domain,
  name,
  email,
  onboarding,
  onboardingPending,
  onBack,
  onSubmitted,
}: Props) {
  const queryClient = useQueryClient();
  const isStudent = domain === 'student';
  const wallet = useQuery({
    ...getSummaryOptions(),
    select: response => requireApiData(response).section_counts,
    staleTime: STALE_TIMES.entity,
  });
  const submit = useMutation(submitDomainOnboardingMutation());
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const steps = onboarding?.steps ?? [];
  const missing = steps.filter(step => step.required && !step.complete);
  const ready = Boolean(onboarding?.ready_for_submission) || (steps.length > 0 && !missing.length);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submit.isPending || !ready || (!isStudent && !confirmed)) return;
    setError('');
    try {
      requireApiData(await submit.mutateAsync({ path: { domain } }));
      await queryClient.invalidateQueries({
        predicate: query => isDomainOnboardingKey(query.queryKey),
      });
      onSubmitted();
    } catch (cause) {
      setError(getErrorMessage(cause, 'Unable to submit. Please try again.'));
    }
  };

  const walletCount = (key: string) => {
    const counts: Record<string, unknown> = { ...wallet.data };
    const value =
      key === 'credentials'
        ? Number(counts.certifications ?? 0) + Number(counts.documents ?? 0)
        : Number(counts[key] ?? 0);
    return `${value} record${value === 1 ? '' : 's'}`;
  };

  return (
    <form onSubmit={event => void handleSubmit(event)} noValidate>
      <StepBody className='grid items-start gap-6 space-y-0 lg:grid-cols-[minmax(0,1fr)_320px]'>
        <div className='space-y-3.5'>
          <SummaryGroup title='Account'>
            <SummaryRow label='Name' value={name} />
            <SummaryRow label='Email' value={email} />
            <SummaryRow label='Account type' value={ROLE_COPY[domain].label} />
          </SummaryGroup>
          <SummaryGroup title='Skills wallet'>
            {wallet.isPending ? (
              <Skeleton className='my-3 h-16 w-full' />
            ) : wallet.isError ? (
              <p className='text-muted-foreground py-3 text-sm'>Unable to load wallet counts.</p>
            ) : (
              WALLET_SECTIONS.filter(section => section.key !== 'verification').map(section => (
                <SummaryRow
                  key={section.key}
                  label={section.label}
                  value={walletCount(section.key)}
                />
              ))
            )}
          </SummaryGroup>
          {onboarding?.review_reason && (
            <div className='bg-warning/10 rounded-lg px-4 py-3 text-sm'>
              <p className='text-foreground font-semibold'>Previous review feedback</p>
              <p className='text-muted-foreground'>{onboarding.review_reason}</p>
            </div>
          )}
          {!isStudent && (
            <div className='flex items-start gap-2.5 pt-2'>
              <Checkbox
                id='confirm'
                checked={confirmed}
                onCheckedChange={value => setConfirmed(value === true)}
              />
              <Label htmlFor='confirm' className='leading-5 font-normal'>
                The information above is accurate, and the evidence I uploaded is my own.
              </Label>
            </div>
          )}
        </div>
        <aside className='border-border space-y-3 rounded-xl border p-4' aria-label='Checklist'>
          <p className='text-foreground text-[15px] font-semibold'>
            {ready ? (isStudent ? 'Ready to start' : 'Ready to submit') : 'Still to do'}
          </p>
          {onboardingPending ? (
            <Skeleton className='h-28 w-full' />
          ) : (
            <ul className='space-y-2.5'>
              {steps.map(step => (
                <li key={step.key} className='flex items-center gap-2.5 text-sm'>
                  {step.complete ? (
                    <CheckCircle2 className='text-success size-[18px] shrink-0' />
                  ) : (
                    <Circle
                      className={cn(
                        'size-[18px] shrink-0',
                        step.required ? 'text-warning' : 'text-muted-foreground'
                      )}
                    />
                  )}
                  <span className={cn(!step.complete && 'text-muted-foreground')}>
                    {step.title ?? step.key}
                    {!step.required && ' (optional)'}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {!isStudent && (
            <div className='border-border text-muted-foreground border-t pt-3 text-xs'>
              <p className='text-foreground mb-1 font-semibold'>What happens next</p>
              <ol className='list-decimal space-y-0.5 pl-4'>
                <li>An Elimika admin reviews your profile.</li>
                <li>We email you and notify you in the app.</li>
                <li>Once approved, your {ROLE_COPY[domain].label} dashboard opens.</li>
              </ol>
            </div>
          )}
        </aside>
      </StepBody>
      <FormError message={error} />
      <StepFooter
        onBack={onBack}
        primaryLabel={isStudent ? 'Start learning' : 'Submit for verification'}
        pendingLabel='Submitting…'
        primaryIcon={isStudent ? undefined : <ShieldCheck />}
        pending={submit.isPending}
        primaryDisabled={onboardingPending || !ready || (!isStudent && !confirmed)}
      />
    </form>
  );
}

function SummaryGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className='border-border overflow-hidden rounded-xl border'>
      <p className='border-border bg-muted/40 text-foreground border-b px-4 py-2.5 text-sm font-semibold'>
        {title}
      </p>
      <dl className='divide-border divide-y px-4'>{children}</dl>
    </div>
  );
}
