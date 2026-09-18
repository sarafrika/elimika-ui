'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useEffect, useMemo, useReducer } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/error-utils';
import { cn } from '@/lib/utils';
import type { CourseTrainingRequirement, ProgramRequirement } from '@/services/client';
import {
  submitProgramTrainingApplicationMutation,
  submitTrainingApplicationMutation,
  updateProgramTrainingApplicationMutation,
  updateTrainingApplicationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { CourseTrainerApplicantType } from '@/src/features/course-record';
import { invalidateTrainingApplicationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';
import type { TrainingApplication } from '@/src/features/rate-card/types';

import {
  type ApplyStep,
  applyReducer,
  buildApplicationPayload,
  initialApplyState,
  type StepId,
  validateAnswers,
  validatePricing,
  visibleSteps,
} from './apply-model';
import { StepClassrooms } from './step-classrooms';
import { StepPricing } from './step-pricing';
import { StepRequirements } from './step-requirements';
import { StepReview } from './step-review';

export type ApplyWizardProps = {
  trainingId: string;
  isProgram: boolean;
  /** Course name or program title, for the confirmation toast. */
  contentTitle: string;
  applicantType: CourseTrainerApplicantType;
  /** Empty until the viewer's profile resolves; submission waits for it. */
  applicantUuid: string;
  /** Already filtered to the requirements the applicant provides. */
  requirements: CourseTrainingRequirement[];
  programRequirements: ProgramRequirement[];
  minimumFee?: number | null;
  requirementsLoading?: boolean;
  requirementsError?: unknown;
  onRetryRequirements?: () => void;
  /** A pending application to edit; the draft starts from it and saving updates it. */
  application?: TrainingApplication | null;
  /** Receives the saved application's uuid. */
  onSubmitted: (applicationUuid: string | null) => void;
};

const STEP_DESCRIPTIONS: Record<StepId, (isProgram: boolean) => string> = {
  venues: () => 'Offer the venues at your branches you would teach in.',
  requirements: isProgram =>
    isProgram
      ? 'Review the published requirements for this program.'
      : 'Tell the course creator what you already have.',
  pricing: () => 'Choose your training methods and price each one on all three bases.',
  review: () => 'Check your application, then send it for approval.',
};

export function ApplyWizard({
  trainingId,
  isProgram,
  contentTitle,
  applicantType,
  applicantUuid,
  requirements,
  programRequirements,
  minimumFee,
  requirementsLoading,
  requirementsError,
  onRetryRequirements,
  application,
  onSubmitted,
}: ApplyWizardProps) {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(applyReducer, undefined, () =>
    initialApplyState(applicantType, application)
  );
  const editing = Boolean(application?.uuid);

  const requirementSeeds = useMemo(
    () =>
      requirements
        .filter(requirement => requirement.uuid)
        .map(requirement => ({ uuid: requirement.uuid as string, name: requirement.name })),
    [requirements]
  );

  const requirementsReady = !isProgram && !requirementsLoading && !requirementsError;
  useEffect(() => {
    if (requirementsReady) dispatch({ type: 'initAnswers', requirements: requirementSeeds });
  }, [requirementsReady, requirementSeeds]);

  const steps = visibleSteps(applicantType);
  const index = Math.max(
    0,
    steps.findIndex(step => step.id === state.step)
  );
  const isLastStep = index === steps.length - 1;

  const missing = useMemo(() => {
    const answers = () => {
      if (isProgram) return [];
      if (requirementsError) return ['Reload the course requirements to answer them.'];
      if (requirementsLoading) return ['Wait for the course requirements to load.'];
      return validateAnswers(state.answers);
    };
    const pricing = () => validatePricing(state.card, minimumFee);
    switch (state.step) {
      case 'requirements':
        return answers();
      case 'pricing':
        return pricing();
      case 'review':
        return [...answers(), ...pricing()];
      default:
        return [];
    }
  }, [
    isProgram,
    minimumFee,
    requirementsError,
    requirementsLoading,
    state.answers,
    state.card,
    state.step,
  ]);
  const canNext = missing.length === 0;

  const goTo = (offset: number) => {
    const target = steps[Math.min(steps.length - 1, Math.max(0, index + offset))];
    if (target) dispatch({ type: 'step', step: target.id });
  };

  const courseSubmit = useMutation(submitTrainingApplicationMutation());
  const programSubmit = useMutation(submitProgramTrainingApplicationMutation());
  const courseUpdate = useMutation(updateTrainingApplicationMutation());
  const programUpdate = useMutation(updateProgramTrainingApplicationMutation());
  const submitting =
    courseSubmit.isPending ||
    programSubmit.isPending ||
    courseUpdate.isPending ||
    programUpdate.isPending;

  const submit = () => {
    if (!contentTitle || (!editing && !applicantUuid)) {
      toast.error('Not ready to submit', {
        description: !contentTitle
          ? `The ${isProgram ? 'program' : 'course'} has not finished loading.`
          : 'Your profile is still loading. Try again in a moment.',
      });
      return;
    }

    const payload = buildApplicationPayload(state, { applicantType, isProgram });
    const onSuccess = async (response: { data?: { uuid?: string } } | undefined) => {
      await invalidateTrainingApplicationWorkflowQueries(queryClient);
      toast.success(editing ? 'Application updated' : 'Application submitted', {
        description: `Your application to train ${contentTitle} is with the ${isProgram ? 'program' : 'course'} creator.`,
      });
      onSubmitted(response?.data?.uuid ?? application?.uuid ?? null);
    };
    const onError = (error: unknown) =>
      toast.error(editing ? 'Could not update your application' : 'Could not submit application', {
        description: getErrorMessage(error, 'Please review your answers and try again.'),
      });

    if (editing && application?.uuid) {
      const path = { applicationUuid: application.uuid };
      if (isProgram)
        programUpdate.mutate(
          { path: { ...path, programUuid: trainingId }, body: payload },
          { onSuccess, onError }
        );
      else
        courseUpdate.mutate(
          { path: { ...path, courseUuid: trainingId }, body: payload },
          { onSuccess, onError }
        );
      return;
    }

    const body = { ...payload, applicant_type: applicantType, applicant_uuid: applicantUuid };
    if (isProgram)
      programSubmit.mutate({ path: { programUuid: trainingId }, body }, { onSuccess, onError });
    else courseSubmit.mutate({ path: { courseUuid: trainingId }, body }, { onSuccess, onError });
  };

  const current = steps[index]!;

  return (
    <div className='space-y-6'>
      <Stepper index={index} steps={steps} />

      <Card>
        <CardHeader>
          <CardTitle className='text-base' data-testid='apply-step-title'>
            {current.label}
          </CardTitle>
          <CardDescription>{STEP_DESCRIPTIONS[current.id](isProgram)}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {current.id === 'venues' ? (
            <StepClassrooms state={state} dispatch={dispatch} organisationUuid={applicantUuid} />
          ) : null}
          {current.id === 'requirements' ? (
            <StepRequirements
              state={state}
              dispatch={dispatch}
              contentKind={isProgram ? 'program' : 'course'}
              requirements={requirements}
              programRequirements={programRequirements}
              loading={requirementsLoading}
              error={requirementsError}
              onRetry={onRetryRequirements}
            />
          ) : null}
          {current.id === 'pricing' ? (
            <StepPricing state={state} dispatch={dispatch} minimumFee={minimumFee} />
          ) : null}
          {current.id === 'review' ? (
            <StepReview
              state={state}
              dispatch={dispatch}
              contentKind={isProgram ? 'program' : 'course'}
              applicantType={applicantType}
              organisationUuid={applicantUuid}
              programRequirements={programRequirements}
            />
          ) : null}

          {missing.length > 0 ? (
            <div
              role='status'
              aria-live='polite'
              className='border-warning/40 bg-warning/10 text-foreground rounded-md border p-3 text-sm'
            >
              <p className='mb-1 font-medium'>
                {isLastStep
                  ? 'Before sending, complete the following:'
                  : 'To continue, complete the following:'}
              </p>
              <ul className='list-disc space-y-0.5 pl-5'>
                {missing.map(reason => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className='flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between'>
            <Button type='button' variant='outline' onClick={() => goTo(-1)} disabled={index === 0}>
              <ArrowLeft className='mr-2 h-4 w-4' /> Back
            </Button>
            {isLastStep ? (
              <Button type='button' onClick={submit} disabled={!canNext || submitting}>
                {submitting ? (
                  <Spinner className='mr-2 h-4 w-4' />
                ) : (
                  <Check className='mr-2 h-4 w-4' />
                )}
                {editing ? 'Save changes' : 'Submit application'}
              </Button>
            ) : (
              <Button type='button' onClick={() => goTo(1)} disabled={!canNext}>
                {steps[index + 1]?.id === 'review' ? 'Review application' : 'Next'}
                <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stepper({ index, steps }: { index: number; steps: readonly ApplyStep[] }) {
  return (
    <>
      <ol className='hidden items-center gap-2 sm:flex'>
        {steps.map((step, position) => {
          const active = position === index;
          const done = position < index;
          return (
            <li key={step.id} className='flex flex-1 items-center gap-2'>
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  done && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary text-primary',
                  !active && !done && 'border-border text-muted-foreground'
                )}
              >
                {done ? <Check className='h-4 w-4' /> : position + 1}
              </div>
              <span
                className={cn(
                  'text-sm',
                  active ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
              {position < steps.length - 1 ? <div className='bg-border mx-2 h-px flex-1' /> : null}
            </li>
          );
        })}
      </ol>
      <p className='text-muted-foreground text-sm sm:hidden'>
        Step {index + 1} of {steps.length}:{' '}
        <span className='text-foreground font-medium'>{steps[index]?.label}</span>
      </p>
    </>
  );
}

/** Shape-matching placeholder while an application being edited loads. */
export function ApplyWizardSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='hidden gap-2 sm:flex'>
        {Array.from({ length: 4 }, (_, position) => (
          <Skeleton key={position} className='h-7 flex-1' />
        ))}
      </div>
      <div className='space-y-4 rounded-xl border p-6'>
        <Skeleton className='h-5 w-40' />
        <Skeleton className='h-4 w-72 max-w-full' />
        <Skeleton className='h-48 w-full' />
        <div className='flex justify-between border-t pt-4'>
          <Skeleton className='h-9 w-24' />
          <Skeleton className='h-9 w-28' />
        </div>
      </div>
    </div>
  );
}
