'use client';

/**
 * The application — five steps, one draft, one POST.
 *
 * The record view above answers "should I apply?". This answers "on what
 * terms?", and it is the only thing on the route that writes: everything the
 * applicant types lives in `applyReducer`'s state until the last step's button
 * turns it into a rate card and a notes line.
 *
 * ## Gating is per step, and it is shown
 *
 * `missing` is recomputed on every keystroke for the *current* step, so Next is
 * disabled with the reasons listed underneath rather than a form that refuses
 * on submit and does not say why. The last step re-runs every step's rules —
 * jumping back via a Review "Edit" link and leaving a field blank must not slip
 * through.
 *
 * ## What actually reaches the creator
 *
 * Two things: `buildRateCard`'s grid, and `composeApplicationNotes`' sentence.
 * The classroom photos and the acquisition choices have no field on the API's
 * application payload — they are captured, shown back on Review, and summarised
 * into the notes. See the route's doc comment.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useEffect, useMemo, useReducer } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CourseTrainingRequirement, ProgramRequirement } from '@/services/client';
import {
  submitProgramTrainingApplicationMutation,
  submitTrainingApplicationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { CourseTrainerApplicantType } from '@/src/features/course-record';
import { invalidateTrainingApplicationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';

import {
  APPLY_STEPS,
  applyReducer,
  buildRateCard,
  composeApplicationNotes,
  initialApplyState,
  requirementKey,
  validateClassrooms,
  validateEquipment,
  validatePricing,
} from './apply-model';
import { StepClassrooms } from './step-classrooms';
import { StepMethod } from './step-method';
import { StepPricing } from './step-pricing';
import { StepRequirements } from './step-requirements';
import { StepReview } from './step-review';

export type ApplyWizardProps = {
  trainingId: string;
  isProgram: boolean;
  /** Course name or programme title — used in the confirmation toast only. */
  contentTitle: string;
  applicantType: CourseTrainerApplicantType;
  /** Empty until the viewer's own profile resolves; submission waits for it. */
  applicantUuid: string;
  /** Already filtered to the requirements the applicant is on the hook for. */
  requirements: CourseTrainingRequirement[];
  programRequirements: ProgramRequirement[];
  /** The creator's floor per learner per hour; rates below it are rejected. */
  minimumFee?: number | null;
  requirementsLoading?: boolean;
  requirementsError?: unknown;
  onRetryRequirements?: () => void;
  /** Where a successful submission lands. */
  onSubmitted: () => void;
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
  onSubmitted,
}: ApplyWizardProps) {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(applyReducer, undefined, initialApplyState);

  /* ── seed the equipment answers from the creator's requirements ─────── */

  const requirementSeeds = useMemo(
    () =>
      requirements.map(requirement => ({
        uuid: requirementKey(requirement),
        name: requirement.name,
      })),
    [requirements]
  );

  useEffect(() => {
    if (isProgram) return;
    dispatch({ type: 'initEquipment', requirements: requirementSeeds });
  }, [isProgram, requirementSeeds]);

  /* ── what is stopping this step ─────────────────────────────────────── */

  const missing = useMemo(() => {
    const errors: string[] = [];
    const methodErrors = () =>
      state.methods.length === 0 ? ['Select at least one preferred training method.'] : [];

    if (state.step === 0) {
      errors.push(...methodErrors());
    } else if (state.step === 1) {
      errors.push(...validateClassrooms(state.classrooms, state.methods));
    } else if (state.step === 2) {
      if (!isProgram) errors.push(...validateEquipment(state.equipment));
    } else if (state.step === 3) {
      errors.push(...validatePricing(state.pricing, state.methods, minimumFee));
    } else if (state.step === 4) {
      errors.push(...methodErrors());
      errors.push(...validateClassrooms(state.classrooms, state.methods));
      if (!isProgram) errors.push(...validateEquipment(state.equipment));
      errors.push(...validatePricing(state.pricing, state.methods, minimumFee));
    }
    return errors;
  }, [isProgram, minimumFee, state]);

  const canNext = missing.length === 0;
  const isLastStep = state.step === APPLY_STEPS.length - 1;

  const goNext = () => {
    if (!canNext) return;
    dispatch({ type: 'step', step: Math.min(APPLY_STEPS.length - 1, state.step + 1) });
  };
  const goBack = () => dispatch({ type: 'step', step: Math.max(0, state.step - 1) });

  /* ── submitting ─────────────────────────────────────────────────────── */

  const courseSubmit = useMutation(submitTrainingApplicationMutation());
  const programSubmit = useMutation(submitProgramTrainingApplicationMutation());
  const submitting = courseSubmit.isPending || programSubmit.isPending;

  const submit = () => {
    if (!contentTitle || !applicantUuid) {
      toast.error('Not ready to submit', {
        description: !contentTitle
          ? `The ${isProgram ? 'program' : 'course'} has not finished loading.`
          : 'Your profile is still loading — try again in a moment.',
      });
      return;
    }

    const body = {
      applicant_type: applicantType,
      applicant_uuid: applicantUuid,
      rate_card: buildRateCard(state.pricing),
      application_notes: composeApplicationNotes({
        methods: state.methods,
        classrooms: state.classrooms,
        equipment: state.equipment,
        requirementCount: requirements.length,
        programRequirementCount: programRequirements.length,
        isProgram,
      }),
    };

    const onSuccess = async () => {
      await invalidateTrainingApplicationWorkflowQueries(queryClient);
      toast.success('Application submitted', {
        description: `Your application to train ${contentTitle} is under review.`,
      });
      onSubmitted();
    };
    const onError = () => {
      toast.error('Could not submit application', {
        description: 'Please review your answers and try again.',
      });
    };

    if (isProgram) {
      programSubmit.mutate({ path: { programUuid: trainingId }, body }, { onSuccess, onError });
    } else {
      courseSubmit.mutate({ path: { courseUuid: trainingId }, body }, { onSuccess, onError });
    }
  };

  /* ── render ─────────────────────────────────────────────────────────── */

  return (
    <div className='space-y-6'>
      <Stepper step={state.step} />

      <Card>
        <CardHeader>
          <CardTitle className='text-base' data-testid='apply-step-title'>
            {APPLY_STEPS[state.step]}
          </CardTitle>
          <CardDescription>{stepDescription(state.step, isProgram)}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {state.step === 0 && <StepMethod state={state} dispatch={dispatch} />}
          {state.step === 1 && <StepClassrooms state={state} dispatch={dispatch} />}
          {state.step === 2 && (
            <StepRequirements
              state={state}
              dispatch={dispatch}
              contentKind={isProgram ? 'program' : 'course'}
              requirements={requirements}
              programRequirements={programRequirements}
              courseName={contentTitle}
              loading={requirementsLoading}
              error={requirementsError}
              onRetry={onRetryRequirements}
            />
          )}
          {state.step === 3 && (
            <StepPricing state={state} dispatch={dispatch} minimumFee={minimumFee} />
          )}
          {state.step === 4 && (
            <StepReview
              state={state}
              dispatch={dispatch}
              contentKind={isProgram ? 'program' : 'course'}
              requirements={requirements}
              programRequirements={programRequirements}
            />
          )}

          {missing.length > 0 && (
            <div
              role='status'
              aria-live='polite'
              className='border-warning/40 bg-warning/10 text-warning rounded-md border p-3 text-sm'
            >
              <p className='mb-1 font-medium'>
                {isLastStep
                  ? 'Before submitting, complete the following:'
                  : 'To continue, complete the following:'}
              </p>
              <ul className='list-disc space-y-0.5 pl-5'>
                {missing.map(reason => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          <div className='flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between'>
            <Button type='button' variant='outline' onClick={goBack} disabled={state.step === 0}>
              <ArrowLeft className='mr-2 h-4 w-4' /> Back
            </Button>
            {isLastStep ? (
              <Button type='button' onClick={submit} disabled={!canNext || submitting}>
                <Check className='mr-2 h-4 w-4' />{' '}
                {submitting ? 'Submitting…' : 'Submit application'}
              </Button>
            ) : (
              <Button type='button' onClick={goNext} disabled={!canNext}>
                Next <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function stepDescription(step: number, isProgram: boolean) {
  switch (step) {
    case 0:
      return `Choose how you'd like to deliver this ${isProgram ? 'program' : 'course'}.`;
    case 1:
      return 'Tell us about the classrooms or labs you can provide.';
    case 2:
      return isProgram
        ? 'Review the published requirements for this program.'
        : 'Confirm the equipment required to run this course.';
    case 3:
      return "Propose your fee per student for each training method you'd offer.";
    default:
      return 'Review your answers, then submit for approval.';
  }
}

function Stepper({ step }: { step: number }) {
  return (
    <>
      <ol className='hidden items-center gap-2 sm:flex'>
        {APPLY_STEPS.map((label, index) => {
          const active = index === step;
          const done = index < step;
          return (
            <li key={label} className='flex flex-1 items-center gap-2'>
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  done && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary text-primary',
                  !active && !done && 'border-border text-muted-foreground'
                )}
              >
                {done ? <Check className='h-4 w-4' /> : index + 1}
              </div>
              <span
                className={cn(
                  'text-sm',
                  active ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
              {index < APPLY_STEPS.length - 1 && <div className='bg-border mx-2 h-px flex-1' />}
            </li>
          );
        })}
      </ol>
      <p className='text-muted-foreground text-sm sm:hidden'>
        Step {step + 1} of {APPLY_STEPS.length} —{' '}
        <span className='text-foreground font-medium'>{APPLY_STEPS[step]}</span>
      </p>
    </>
  );
}
