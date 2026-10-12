'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Info, Plus, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import type {
  Onboarding,
  RelationshipTypeEnum,
  Student,
  StudentGuardianRequest,
} from '@/services/client';
import {
  getCurrentUserOptions,
  searchStudentsOptions,
  updateStudentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { requireApiData } from '../lib/user-onboarding';
import { FieldError, FormError, StepBody, StepFooter } from './OnboardingFrame';
import { isDomainOnboardingKey, onboardingStep } from '../hooks/useDomainOnboarding';

type Guardian = {
  name: string;
  email: string;
  phone: string;
  relationship_type: RelationshipTypeEnum;
};

const emptyGuardian = (): Guardian => ({
  name: '',
  email: '',
  phone: '',
  relationship_type: 'PARENT',
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** The spec types this as a bare page, but the API wraps it: `{ data: { content: [...] } }`. */
function firstStudent(response: unknown): Student | undefined {
  const page = isRecord(response) && isRecord(response.data) ? response.data : response;
  const first = isRecord(page) && Array.isArray(page.content) ? page.content[0] : undefined;
  return isRecord(first) && typeof first.uuid === 'string' && typeof first.user_uuid === 'string'
    ? (first as Student)
    : undefined;
}

function assertSaved(response: unknown) {
  if (isRecord(response) && (response.success === false || response.error))
    throw new Error(
      typeof response.message === 'string' ? response.message : 'Unable to save your guardian.'
    );
}

type Props = { onboarding: Onboarding | undefined; onBack: () => void; onDone: () => void };

export function StudentDetails({ onboarding, onBack, onDone }: Props) {
  const guardiansStep = onboardingStep(onboarding, 'guardians');
  const needsGuardian = Boolean(guardiansStep?.required && !guardiansStep.complete);

  if (!needsGuardian)
    return (
      <>
        <StepBody>
          <div className='border-border bg-muted/40 flex gap-3.5 rounded-xl border p-4'>
            <CheckCircle2 className='text-success mt-0.5 size-5 shrink-0' />
            <div className='text-sm'>
              <p className='text-foreground font-semibold'>Your learner profile is ready</p>
              <p className='text-muted-foreground'>
                {guardiansStep?.complete
                  ? 'Your guardian details are saved. Continue to your skills wallet.'
                  : 'Nothing else is needed here. Continue to your skills wallet.'}
              </p>
            </div>
          </div>
        </StepBody>
        <StepFooter onBack={onBack} primaryLabel='Save and continue' onPrimary={onDone} />
      </>
    );
  return <GuardianForm onBack={onBack} onDone={onDone} />;
}

function GuardianForm({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const user = useQuery({
    ...getCurrentUserOptions(),
    select: response => requireApiData(response),
    staleTime: STALE_TIMES.entity,
  });
  const userUuid = user.data?.uuid;
  const student = useQuery({
    ...searchStudentsOptions({
      query: { searchParams: { user_uuid_eq: userUuid }, pageable: { page: 0, size: 1 } },
    }),
    select: firstStudent,
    enabled: Boolean(userUuid && session),
    staleTime: STALE_TIMES.entity,
  });
  const update = useMutation(updateStudentMutation());
  const [guardians, setGuardians] = useState<Guardian[]>([emptyGuardian()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const setGuardian = (index: number, changes: Partial<Guardian>) =>
    setGuardians(current => current.map((g, i) => (i === index ? { ...g, ...changes } : g)));

  const validate = () => {
    const next: Record<string, string> = {};
    guardians.forEach((guardian, index) => {
      if (!guardian.name.trim()) next[`name-${index}`] = 'Enter the guardian’s full name.';
      if (!/^\S+@\S+\.\S+$/.test(guardian.email.trim()))
        next[`email-${index}`] = 'Enter a valid email address.';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const record = student.data;
    if (update.isPending || !record?.uuid || !validate()) return;
    setFormError('');
    try {
      const body: StudentGuardianRequest[] = guardians.map(guardian => ({
        name: guardian.name.trim(),
        email: guardian.email.trim(),
        phone: guardian.phone || null,
        relationship_type: guardian.relationship_type,
      }));
      const { uuid, ...writable } = record;
      if (!uuid) return;
      assertSaved(
        await update.mutateAsync({ path: { uuid }, body: { ...writable, guardians: body } })
      );
      await queryClient.invalidateQueries({
        predicate: query => isDomainOnboardingKey(query.queryKey),
      });
      toast.success('Guardian added. We have emailed them an invitation.');
      onDone();
    } catch (cause) {
      setFormError(getErrorMessage(cause, 'Unable to save your guardian. Please try again.'));
    }
  };

  const loading = user.isPending || student.isPending;
  const failed = user.isError || student.isError || (student.isSuccess && !student.data);

  return (
    <form onSubmit={event => void handleSubmit(event)} noValidate>
      <StepBody>
        <div role='note' className='bg-warning/10 flex gap-2.5 rounded-lg px-3.5 py-3 text-sm'>
          <Info className='text-warning mt-0.5 size-4 shrink-0' />
          <span className='text-foreground'>
            You are under 18, so add at least one parent or guardian. We email them an invitation to
            link to your account.
          </span>
        </div>
        {loading ? (
          <Skeleton className='h-48 w-full' />
        ) : failed ? (
          <EmptyState
            title='Unable to load your learner profile'
            description='Please try again in a moment.'
            action={
              <Button
                type='button'
                variant='outline'
                onClick={() => void Promise.all([user.refetch(), student.refetch()])}
              >
                Try again
              </Button>
            }
          />
        ) : (
          <fieldset disabled={update.isPending} className='space-y-4'>
            {guardians.map((guardian, index) => (
              <div key={index} className='border-border space-y-4 rounded-xl border p-4'>
                <div className='flex items-center justify-between gap-2'>
                  <p className='text-foreground text-[15px] font-semibold'>Guardian {index + 1}</p>
                  {index > 0 && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => setGuardians(current => current.filter((_, i) => i !== index))}
                    >
                      <Trash2 className='text-destructive size-4' />
                      Remove
                    </Button>
                  )}
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-1.5'>
                    <Label htmlFor={`name-${index}`}>Full name</Label>
                    <Input
                      id={`name-${index}`}
                      autoComplete='off'
                      value={guardian.name}
                      onChange={event => setGuardian(index, { name: event.target.value })}
                      aria-invalid={Boolean(errors[`name-${index}`])}
                    />
                    <FieldError id={`name-${index}`} message={errors[`name-${index}`]} />
                  </div>
                  <div className='space-y-1.5'>
                    <Label htmlFor={`rel-${index}`}>Relationship</Label>
                    <Select
                      value={guardian.relationship_type}
                      onValueChange={value =>
                        setGuardian(index, { relationship_type: value as RelationshipTypeEnum })
                      }
                    >
                      <SelectTrigger id={`rel-${index}`} className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='PARENT'>Parent</SelectItem>
                        <SelectItem value='GUARDIAN'>Guardian</SelectItem>
                        <SelectItem value='SPONSOR'>Sponsor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-1.5'>
                    <Label htmlFor={`email-${index}`}>Email</Label>
                    <Input
                      id={`email-${index}`}
                      type='email'
                      value={guardian.email}
                      onChange={event => setGuardian(index, { email: event.target.value })}
                      aria-invalid={Boolean(errors[`email-${index}`])}
                      aria-describedby={`email-${index}-hint`}
                    />
                    <p id={`email-${index}-hint`} className='text-muted-foreground text-xs'>
                      The invitation goes here.
                    </p>
                    <FieldError id={`email-${index}`} message={errors[`email-${index}`]} />
                  </div>
                  <div className='space-y-1.5'>
                    <Label htmlFor={`phone-${index}`}>Phone (optional)</Label>
                    <PhoneInput
                      id={`phone-${index}`}
                      value={guardian.phone}
                      onChange={value => setGuardian(index, { phone: value ?? '' })}
                    />
                  </div>
                </div>
              </div>
            ))}
            {guardians.length < 2 && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setGuardians(current => [...current, emptyGuardian()])}
              >
                <Plus className='size-4' />
                Add a second guardian
              </Button>
            )}
          </fieldset>
        )}
      </StepBody>
      <FormError message={formError} />
      <StepFooter
        onBack={onBack}
        primaryLabel='Save and continue'
        pending={update.isPending}
        primaryDisabled={loading || failed}
      />
    </form>
  );
}
