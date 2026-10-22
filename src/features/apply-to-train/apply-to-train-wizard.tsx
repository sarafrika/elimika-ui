'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useReducer, useState } from 'react';
import { toast } from 'sonner';

import { useInstructor } from '@/context/instructor-context';
import { getErrorMessage } from '@/lib/error-utils';
import {
  submitProgramTrainingApplicationMutation,
  submitTrainingApplicationMutation,
  updateProgramTrainingApplicationMutation,
  updateTrainingApplicationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { invalidateTrainingApplicationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';
import type { TrainingApplication } from '@/src/features/rate-card/types';
import { toAgeGroupRequests, validateGroups } from './age-groups/model';
import { StepAgeGroups } from './age-groups/step-age-groups';
import { usePlanLessons } from './age-groups/use-plan-lessons';
import { ItemDetailsSheet } from './components/item-details-sheet';
import { SentPanel } from './components/sent-panel';
import { StepCourse } from './components/step-course';
import { StepDelivery } from './components/step-delivery';
import { StepRequirements } from './components/step-requirements';
import { StepReview } from './components/step-review';
import { type StepStatus, StepTabs } from './components/step-tabs';
import { type RailLine, SummaryRail } from './components/summary-rail';
import { deliveryRateCard, validateDelivery } from './delivery-model';
import {
  answerErrors,
  answersPayload,
  applyToTrainReducer,
  initialApplyToTrainState,
  stepIndex,
} from './model';
import { APPLY_TO_TRAIN_STEPS, type ApplyItem, type ApplyStepId, kindNoun } from './types';
import type { CatalogueFilters } from './use-apply-catalogue';
import { useItemRequirements } from './use-item-requirements';

const NEXT_LABEL: Record<ApplyStepId, string> = {
  course: 'Continue to age groups',
  groups: 'Continue to delivery & rates',
  delivery: 'Continue to requirements',
  requirements: 'Review application',
  review: 'Submit application',
};

const TIPS: Record<ApplyStepId, string> = {
  course:
    'Courses you’re already approved for, or waiting on, sit under “Already applied”. Open one to track it instead.',
  groups:
    'Groups can leave gaps but can’t overlap, and every group must sit inside the age range. Lesson titles come from the course.',
  delivery:
    'Rates are per hour and per day. The cost table multiplies the hourly rate by each group’s lesson plan so you can sanity-check what a learner or class pays.',
  requirements:
    'Answers go to the creator with your application. Leasing or hiring is fine; it just tells them how you’ll cover it.',
  review:
    'Your profile, credentials and skills wallet are attached automatically. You can edit a pending application until it’s reviewed.',
};

export type WizardHeading = { eyebrow: string; title: string; description: string };

/** Header copy for the current step, so the page header follows the wizard. */
export function headingFor(step: ApplyStepId, item: ApplyItem | null): WizardHeading {
  const noun = item ? kindNoun(item.kind) : 'course';
  const eyebrow = item && step !== 'course' ? `Apply to train · ${item.title}` : 'Training hub';
  switch (step) {
    case 'groups':
      return {
        eyebrow,
        title: 'Age groups',
        description:
          'Split learners into age groups. Each group gets its own lesson plan, because younger learners often need shorter lessons.',
      };
    case 'delivery':
      return { eyebrow, title: 'Delivery & rates', description: 'Pick the methods you offer and price each one.' };
    case 'requirements':
      return { eyebrow, title: 'Requirements', description: `Confirm what you have for this ${noun}.` };
    case 'review':
      return {
        eyebrow,
        title: 'Review and submit',
        description: 'Check everything once. You can still edit while it’s pending.',
      };
    default:
      return {
        eyebrow,
        title: 'Apply to train',
        description:
          'Choose a course or programme, tell the creator who you can teach and how, and set your rates.',
      };
  }
}

type ApplyToTrainWizardProps = {
  initialItem: ApplyItem | null;
  application: TrainingApplication | null;
  onHeading: (heading: WizardHeading) => void;
  onReset: () => void;
};

/** The five-step instructor application, from choosing an item to the sent screen. */
export function ApplyToTrainWizard({
  initialItem,
  application,
  onHeading,
  onReset,
}: ApplyToTrainWizardProps) {
  const queryClient = useQueryClient();
  const instructor = useInstructor();
  const [state, dispatch] = useReducer(applyToTrainReducer, undefined, () =>
    initialApplyToTrainState(initialItem, application)
  );
  const [filters, setFilters] = useState<CatalogueFilters>({
    q: '',
    show: 'all',
    fit: 'open',
    category: null,
    page: 0,
  });
  const [details, setDetails] = useState<ApplyItem | null>(null);
  const { item, step } = state;
  const editing = Boolean(application?.uuid);
  const noun = item ? kindNoun(item.kind) : 'course';
  const creator = item?.creator ?? `the ${noun} creator`;

  const plan = usePlanLessons(item?.kind ?? null, item?.uuid ?? null);
  const requirements = useItemRequirements(item?.kind ?? null, item?.uuid ?? null);
  const scope = useMemo(
    () => ({ min: item?.ageMin ?? null, max: item?.ageMax ?? null }),
    [item?.ageMin, item?.ageMax]
  );

  const seeds = useMemo(
    () =>
      requirements.courseRequirements
        .filter(requirement => requirement.uuid)
        .map(requirement => ({ uuid: requirement.uuid as string, name: requirement.name })),
    [requirements.courseRequirements]
  );
  const answersReady = item?.kind === 'course' && !requirements.loading && !requirements.error;
  useEffect(() => {
    if (answersReady) dispatch({ type: 'initAnswers', requirements: seeds });
  }, [answersReady, seeds]);

  useEffect(() => onHeading(headingFor(step, item)), [step, item, onHeading]);

  const groupValidation = useMemo(() => {
    const result = validateGroups(state.groups, plan.lessons, scope);
    if (plan.loading) return { ...result, general: [...result.general, 'Wait for the lessons to load.'], count: result.count + 1 };
    if (plan.error)
      return { ...result, general: [...result.general, 'Reload the lessons to plan your hours.'], count: result.count + 1 };
    return result;
  }, [state.groups, plan.lessons, plan.loading, plan.error, scope]);
  const deliveryValidation = useMemo(
    () => validateDelivery(state.delivery, item?.minimumFee ?? null),
    [state.delivery, item?.minimumFee]
  );

  const errors: Record<ApplyStepId, number> = {
    course: item ? 0 : 1,
    groups: item ? groupValidation.count : 0,
    delivery: item ? deliveryValidation.count : 0,
    requirements: !item
      ? 0
      : requirements.loading || requirements.error
        ? 1
        : item.kind === 'course'
          ? answerErrors(state.answers).length
          : 0,
    review: 0,
  };
  const shown = (id: ApplyStepId) => state.tried || Boolean(state.visited[id]);
  const currentIndex = stepIndex(step);

  const statuses = Object.fromEntries(
    APPLY_TO_TRAIN_STEPS.map(({ id }, index) => [
      id,
      {
        done:
          id !== step &&
          id !== 'review' &&
          errors[id] === 0 &&
          (Boolean(state.visited[id]) || index < currentIndex),
        errors: id !== 'review' && shown(id) ? errors[id] : 0,
      } satisfies StepStatus,
    ])
  ) as Record<ApplyStepId, StepStatus>;

  const tone = (id: ApplyStepId): RailLine['tone'] =>
    errors[id] > 0 && shown(id) ? 'danger' : 'default';
  const answered = state.answers.filter(
    answer => answer.has === 'yes' || (answer.has === 'no' && answer.acquisition)
  ).length;
  const lines: Record<ApplyStepId, RailLine> = {
    course: item ? { label: 'Course', status: 'Chosen', tone: 'success' } : { label: 'Course', status: 'Not started', tone: 'muted' },
    groups: item
      ? {
        label: 'Age groups',
        status: `${state.groups.length} ${state.groups.length === 1 ? 'group' : 'groups'}`,
        tone: tone('groups'),
      }
      : { label: 'Age groups', status: 'Not started', tone: 'muted' },
    delivery: state.delivery.methods.length
      ? {
        label: 'Delivery',
        status: `${state.delivery.methods.length} ${state.delivery.methods.length === 1 ? 'method' : 'methods'}`,
        tone: tone('delivery'),
      }
      : { label: 'Delivery', status: 'Not started', tone: shown('delivery') && item ? 'danger' : 'muted' },
    requirements: !item
      ? { label: 'Requirements', status: 'Not started', tone: 'muted' }
      : item.kind === 'program'
        ? { label: 'Requirements', status: 'Read only', tone: 'default' }
        : {
          label: 'Requirements',
          status: state.answers.length ? `${answered} of ${state.answers.length} answered` : 'None',
          tone: tone('requirements'),
        },
    review: { label: 'Review', status: step === 'review' ? 'In progress' : '—', tone: 'muted' },
  };

  const go = (target: ApplyStepId) => {
    if (target === 'course' || item) dispatch({ type: 'go', step: target });
  };

  const courseSubmit = useMutation(submitTrainingApplicationMutation());
  const programSubmit = useMutation(submitProgramTrainingApplicationMutation());
  const courseUpdate = useMutation(updateTrainingApplicationMutation());
  const programUpdate = useMutation(updateProgramTrainingApplicationMutation());
  const submitting =
    courseSubmit.isPending || programSubmit.isPending || courseUpdate.isPending || programUpdate.isPending;

  const submit = () => {
    const first = APPLY_TO_TRAIN_STEPS.find(entry => errors[entry.id] > 0);
    if (first || !item) {
      dispatch({ type: 'blocked', step: first?.id ?? 'course' });
      return;
    }
    if (!editing && !instructor?.uuid) {
      toast.error('Not ready to submit', { description: 'Your profile is still loading. Try again in a moment.' });
      return;
    }

    const payload = {
      rate_card: deliveryRateCard(state.delivery),
      application_notes: state.note.trim() || null,
      ...(item.kind === 'course' ? { requirement_answers: answersPayload(state.answers) } : {}),
      age_groups: toAgeGroupRequests(state.groups, plan.lessons),
    };
    const onSuccess = async (response: { data?: { uuid?: string } } | undefined) => {
      await invalidateTrainingApplicationWorkflowQueries(queryClient);
      toast.success(editing ? 'Application updated' : 'Application submitted', {
        description: `Your application to train ${item.title} is with ${creator}.`,
      });
      dispatch({ type: 'sent', applicationUuid: response?.data?.uuid ?? application?.uuid ?? null });
    };
    const onError = (error: unknown) =>
      toast.error(editing ? 'Could not update your application' : 'Could not submit application', {
        description: getErrorMessage(error, 'Please review your answers and try again.'),
      });

    if (editing && application?.uuid) {
      const applicationUuid = application.uuid;
      if (item.kind === 'program')
        programUpdate.mutate(
          { path: { programUuid: item.uuid, applicationUuid }, body: payload },
          { onSuccess, onError }
        );
      else
        courseUpdate.mutate(
          { path: { courseUuid: item.uuid, applicationUuid }, body: payload },
          { onSuccess, onError }
        );
      return;
    }

    const body = { ...payload, applicant_type: 'instructor' as const, applicant_uuid: instructor?.uuid ?? '' };
    if (item.kind === 'program')
      programSubmit.mutate({ path: { programUuid: item.uuid }, body }, { onSuccess, onError });
    else courseSubmit.mutate({ path: { courseUuid: item.uuid }, body }, { onSuccess, onError });
  };

  const next = () => {
    if (step === 'review') submit();
    else if (item) go(APPLY_TO_TRAIN_STEPS[currentIndex + 1]!.id);
  };

  if (state.sent && item)
    return (
      <SentPanel
        item={item}
        creator={item.creator ?? `The ${noun} creator`}
        edited={editing}
        onAnother={() => {
          dispatch({ type: 'reset' });
          onReset();
        }}
      />
    );

  const lessonCount = item && !plan.loading && !plan.error ? plan.lessons.length : (item?.lessonCount ?? null);

  return (
    <div className='space-y-5'>
      {/* <StepTabs current={step} statuses={statuses} canOpen={id => id === 'course' || Boolean(item)} onOpen={go} /> */}

      <div className='grid min-w-0 gap-5'>
        <div className='min-w-0 space-y-4'>
          {step === 'course' ? (
            <StepCourse
              filters={filters}
              onFilters={setFilters}
              selectedUuid={item?.uuid ?? null}
              onChoose={choice => dispatch({ type: 'choose', item: choice })}
              onDetails={setDetails}
            />
          ) : null}
          {step === 'groups' && item ? (
            <StepAgeGroups
              groups={state.groups}
              onChange={groups => dispatch({ type: 'groups', groups })}
              lessons={plan.lessons}
              lessonsLoading={plan.loading}
              lessonsError={plan.error}
              onRetryLessons={plan.refetch}
              scope={scope}
              validation={groupValidation}
              showErrors={shown('groups') || step === 'groups'}
              itemNoun={noun}
            />
          ) : null}
          {step === 'delivery' && item ? (
            <StepDelivery
              draft={state.delivery}
              onChange={delivery => dispatch({ type: 'delivery', delivery })}
              validation={deliveryValidation}
              showErrors={shown('delivery')}
              minimumFee={item.minimumFee}
              creator={creator}
              groups={state.groups}
              lessons={plan.lessons}
            />
          ) : null}
          {step === 'requirements' && item ? (
            <StepRequirements
              kind={item.kind}
              creator={creator}
              answers={state.answers}
              dispatch={dispatch}
              courseRequirements={requirements.courseRequirements}
              programRequirements={requirements.programRequirements}
              loading={requirements.loading}
              error={requirements.error}
              onRetry={requirements.refetch}
              showErrors={shown('requirements')}
            />
          ) : null}
          {step === 'review' && item ? (
            <StepReview
              item={item}
              groups={state.groups}
              lessons={plan.lessons}
              delivery={state.delivery}
              answers={state.answers}
              programRequirements={requirements.programRequirements}
              note={state.note}
              onNote={note => dispatch({ type: 'note', note })}
              onEdit={go}
              blocked={state.tried && Object.values(errors).some(count => count > 0)}
              creator={creator}
            />
          ) : null}
        </div>

        <SummaryRail
          item={item}
          lessonCount={lessonCount}
          lines={lines}
          step={step}
          canBack={currentIndex > 0}
          onBack={() => go(APPLY_TO_TRAIN_STEPS[currentIndex - 1]!.id)}
          onNext={next}
          nextLabel={
            step === 'course' && !item
              ? 'Choose a course first'
              : step === 'review' && editing
                ? 'Save changes'
                : NEXT_LABEL[step]
          }
          nextDisabled={step === 'course' && !item}
          submitting={submitting}
          tip={TIPS[step]}
        />
      </div>

      <ItemDetailsSheet
        item={details}
        selected={Boolean(details && details.uuid === item?.uuid)}
        onOpenChange={open => {
          if (!open) setDetails(null);
        }}
        onChoose={choice => {
          dispatch({ type: 'choose', item: choice });
          setDetails(null);
        }}
      />
    </div>
  );
}
