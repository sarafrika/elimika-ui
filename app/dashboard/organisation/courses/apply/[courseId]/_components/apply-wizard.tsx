'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useReducer, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/error-utils';
import { cn } from '@/lib/utils';
import type { CourseTrainingRequirement, Lesson, ProgramRequirement } from '@/services/client';
import {
  getCourseLessonsOptions,
  submitProgramTrainingApplicationMutation,
  submitTrainingApplicationMutation,
  updateProgramTrainingApplicationMutation,
  updateTrainingApplicationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { CourseTrainerApplicantType } from '@/src/features/course-record';
import { invalidateTrainingApplicationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';
import type { TrainingApplication } from '@/src/features/rate-card/types';

import {
  applyReducer,
  type ApplyStep,
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

type LessonPlanAgeGroup = {
  id: string;
  name: string;
  minAge: string;
  maxAge: string;
  hours: Record<string, string>;
};

function createAgeGroup(): LessonPlanAgeGroup {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: '',
    minAge: '',
    maxAge: '',
    hours: {},
  };
}

function validateTargetGroups(
  ageGroups: LessonPlanAgeGroup[],
  lessons: Lesson[],
  courseAgeRange?: { min: number | null; max: number | null } | null
): string[] {
  if (!ageGroups.length) return ['Add at least one target group.'];

  const messages: string[] = [];
  const minCourseAge = courseAgeRange?.min ?? null;
  const maxCourseAge = courseAgeRange?.max ?? null;

  ageGroups.forEach((group, groupIndex) => {
    const groupLabel = group.name.trim() || `age group ${groupIndex + 1}`;
    const minAge = Number(group.minAge);
    const maxAge = Number(group.maxAge);

    if (!group.name.trim()) messages.push(`Give ${groupLabel} a name.`);
    if (!group.minAge || Number.isNaN(minAge) || minAge <= 0) {
      messages.push(`Set a valid minimum age for ${groupLabel}.`);
    }
    if (!group.maxAge || Number.isNaN(maxAge) || maxAge <= 0) {
      messages.push(`Set a valid maximum age for ${groupLabel}.`);
    }
    if (group.minAge && group.maxAge && maxAge < minAge) {
      messages.push(`Maximum age must be greater than or equal to minimum age for ${groupLabel}.`);
    }
    if (minCourseAge != null && minAge < minCourseAge) {
      messages.push(`${groupLabel} must start at ${minCourseAge} or older to stay within the course age range.`);
    }
    if (maxCourseAge != null && maxAge > maxCourseAge) {
      messages.push(`${groupLabel} must end at ${maxCourseAge} or younger to stay within the course age range.`);
    }

    lessons.forEach((lesson, lessonIndex) => {
      const lessonId = lesson.uuid || `${lesson.lesson_number ?? lessonIndex + 1}`;
      const hours = group.hours[lessonId];
      if (!hours || Number(hours) <= 0) {
        messages.push(
          `Enter how many hours ${groupLabel} will spend on lesson ${lesson.title || `#${lessonIndex + 1}`}.`
        );
      }
    });
  });

  return messages;
}

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
  courseAgeRange?: { min: number | null; max: number | null } | null;
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
  'target-group': () => 'Add named age groups, each with its own lesson plan.',
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
  courseAgeRange,
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

  const shouldLoadLessonPlan = applicantType === 'instructor' && !isProgram && Boolean(trainingId);
  const courseLessonsQuery = useQuery({
    ...getCourseLessonsOptions({
      path: { courseUuid: trainingId },
      query: { pageable: { page: 0, size: 200 } },
    }),
    enabled: shouldLoadLessonPlan,
    staleTime: 60_000,
  });
  const courseLessons = useMemo(() => courseLessonsQuery.data?.data?.content ?? [], [courseLessonsQuery.data]);

  const [ageGroups, setAgeGroups] = useState<LessonPlanAgeGroup[]>([createAgeGroup()]);
  useEffect(() => {
    if (applicantType !== 'instructor' || isProgram) return;
    setAgeGroups(prev => (prev.length > 0 ? prev : [createAgeGroup()]));
  }, [applicantType, isProgram]);

  const updateAgeGroup = (id: string, next: Partial<LessonPlanAgeGroup>) => {
    setAgeGroups(prev =>
      prev.map(group => (group.id === id ? { ...group, ...next } : group))
    );
  };

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
    const lessonPlan = () => {
      if (applicantType !== 'instructor' || isProgram) return [];
      if (courseLessonsQuery.isLoading && !courseLessonsQuery.data) {
        return ['Wait for the course lessons to load.'];
      }
      if (courseLessonsQuery.error) {
        return ['Reload the course lessons to complete your lesson plan.'];
      }
      return validateTargetGroups(ageGroups, courseLessons, courseAgeRange);
    };
    switch (state.step) {
      case 'requirements':
        return answers();
      case 'target-group':
        return lessonPlan();
      case 'pricing':
        return pricing();
      case 'review':
        return [...answers(), ...lessonPlan(), ...pricing()];
      default:
        return [];
    }
  }, [
    ageGroups,
    applicantType,
    courseLessons,
    courseLessonsQuery.data,
    courseLessonsQuery.error,
    courseLessonsQuery.isLoading,
    isProgram,
    minimumFee,
    requirementsError,
    requirementsLoading,
    state.answers,
    state.card,
    state.step,
    courseAgeRange,
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

          {current.id === 'target-group' && applicantType === 'instructor' && !isProgram ? (
            <div className='space-y-4'>
              <div className='flex justify-end'>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={() => setAgeGroups(prev => [...prev, createAgeGroup()])}
                  disabled={ageGroups.length >= 20}
                >
                  <Plus className='mr-1 h-4 w-4' />
                  Add age group
                </Button>
              </div>

              {ageGroups.map((group, groupIndex) => (
                <div key={group.id} className='space-y-4 rounded-sm border border-border bg-background p-6'>
                  <div className='flex flex-wrap items-end gap-3'>
                    <div className='min-w-40 flex-1 space-y-1'>
                      <Label htmlFor={`ag-name-${group.id}`}>Name tag</Label>
                      <Input
                        id={`ag-name-${group.id}`}
                        value={group.name}
                        maxLength={60}
                        placeholder='e.g. Juniors'
                        onChange={event =>
                          updateAgeGroup(group.id, { name: event.target.value })
                        }
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label htmlFor={`ag-min-${group.id}`}>Min age</Label>
                      <Input
                        id={`ag-min-${group.id}`}
                        type='number'
                        min={courseAgeRange?.min ?? 1}
                        max={courseAgeRange?.max ?? 120}
                        className='w-20'
                        value={group.minAge}
                        onChange={event =>
                          updateAgeGroup(group.id, { minAge: event.target.value })
                        }
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label htmlFor={`ag-max-${group.id}`}>Max age</Label>
                      <Input
                        id={`ag-max-${group.id}`}
                        type='number'
                        min={courseAgeRange?.min ?? 1}
                        max={courseAgeRange?.max ?? 120}
                        className='w-20'
                        value={group.maxAge}
                        onChange={event =>
                          updateAgeGroup(group.id, { maxAge: event.target.value })
                        }
                      />
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      aria-label={`Remove age group ${groupIndex + 1}`}
                      disabled={ageGroups.length === 1}
                      onClick={() =>
                        setAgeGroups(prev => prev.filter(item => item.id !== group.id))
                      }
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>

                  <div className='space-y-2'>
                    <p className='text-sm font-medium'>
                      Lesson plan{group.name.trim() ? ` · ${group.name.trim()}` : ''} · hours per lesson *
                    </p>
                    {courseLessons.length ? (
                      courseLessons.map((lesson, index) => {
                        const lessonKey = lesson.uuid || `${lesson.lesson_number ?? index + 1}`;
                        return (
                          <div
                            key={lessonKey}
                            className='flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2 last:border-0'
                          >
                            <Label
                              className='min-w-0 flex-1 font-normal'
                              htmlFor={`hours-${group.id}-${lessonKey}`}
                            >
                              {index + 1}. {lesson.title || `Lesson ${index + 1}`}
                            </Label>
                            <div className='flex items-center gap-2'>
                              <Input
                                id={`hours-${group.id}-${lessonKey}`}
                                type='number'
                                min='0.25'
                                max='100'
                                step='0.25'
                                required
                                value={group.hours[lessonKey] ?? ''}
                                onChange={event =>
                                  updateAgeGroup(group.id, {
                                    hours: { ...group.hours, [lessonKey]: event.target.value },
                                  })
                                }
                                className='w-24'
                              />
                              <span className='text-sm text-muted-foreground'>hours</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className='text-sm text-muted-foreground'>
                        Choose a course with lessons to create a lesson plan.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
              lessonPlanGroups={ageGroups.map(group => ({
                id: group.id,
                name: group.name.trim() || 'Unnamed age group',
                minAge: group.minAge,
                maxAge: group.maxAge,
                hours: group.hours,
                lessons: courseLessons.map(lesson => ({
                  id: lesson.uuid || `${lesson.lesson_number ?? 0}`,
                  title: lesson.title || 'Lesson',
                })),
              }))}
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
