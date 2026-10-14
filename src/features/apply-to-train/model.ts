import {
  type RequirementAnswer,
  validateAnswers,
} from '@/app/dashboard/organisation/courses/apply/[courseId]/_components/apply-model';
import type { TrainingRequirementAnswerRequest } from '@/services/client';
import type { TrainingApplication } from '@/src/features/rate-card/types';
import {
  type AgeGroupDraft,
  defaultGroups,
  groupsFromApplication,
} from './age-groups/model';
import { type DeliveryDraft, deliveryFromCard } from './delivery-model';
import { APPLY_TO_TRAIN_STEPS, type ApplyItem, type ApplyStepId } from './types';

export type ApplyToTrainState = {
  step: ApplyStepId;
  item: ApplyItem | null;
  groups: AgeGroupDraft[];
  delivery: DeliveryDraft;
  answers: RequirementAnswer[];
  note: string;
  visited: Partial<Record<ApplyStepId, boolean>>;
  /** A submit was attempted: every step shows its errors. */
  tried: boolean;
  sent: { applicationUuid: string | null } | null;
};

export type ApplyToTrainAction =
  | { type: 'go'; step: ApplyStepId }
  | { type: 'choose'; item: ApplyItem }
  | { type: 'groups'; groups: AgeGroupDraft[] }
  | { type: 'delivery'; delivery: DeliveryDraft }
  | { type: 'initAnswers'; requirements: { uuid: string; name: string }[] }
  | { type: 'answerHas'; uuid: string; has: 'yes' | 'no' }
  | { type: 'answerAcquisition'; uuid: string; acquisition: 'lease' | 'hire' }
  | { type: 'note'; note: string }
  | { type: 'blocked'; step: ApplyStepId }
  | { type: 'sent'; applicationUuid: string | null }
  | { type: 'reset' };

/** A fresh draft, optionally preselected or hydrated from a pending application. */
export function initialApplyToTrainState(
  item: ApplyItem | null,
  application?: TrainingApplication | null
): ApplyToTrainState {
  const scope = { min: item?.ageMin ?? null, max: item?.ageMax ?? null };
  const stored = groupsFromApplication(application?.age_groups);
  return {
    step: item ? 'groups' : 'course',
    item,
    groups: stored.length ? stored : item ? defaultGroups(scope) : [],
    delivery: deliveryFromCard(application?.rate_card),
    answers: (application?.requirement_answers ?? [])
      .filter(answer => answer.requirement_uuid)
      .map(answer => ({
        requirementUuid: answer.requirement_uuid as string,
        requirementName: answer.requirement_name ?? 'Requirement',
        has: answer.has_it ? 'yes' : 'no',
        acquisition: answer.has_it ? undefined : (answer.acquisition ?? undefined),
      })),
    note: application?.application_notes ?? '',
    visited: item ? { course: true } : {},
    tried: false,
    sent: null,
  };
}

const mapAnswer = (
  answers: RequirementAnswer[],
  uuid: string,
  patch: (answer: RequirementAnswer) => RequirementAnswer
) => answers.map(answer => (answer.requirementUuid === uuid ? patch(answer) : answer));

export function applyToTrainReducer(
  state: ApplyToTrainState,
  action: ApplyToTrainAction
): ApplyToTrainState {
  switch (action.type) {
    case 'go':
      return { ...state, step: action.step, visited: { ...state.visited, [state.step]: true } };
    case 'choose':
      if (state.item?.uuid === action.item.uuid) return { ...state, item: action.item };
      return {
        ...state,
        item: action.item,
        groups: defaultGroups({ min: action.item.ageMin, max: action.item.ageMax }),
        answers: [],
        visited: { ...state.visited, course: true },
      };
    case 'groups':
      return { ...state, groups: action.groups };
    case 'delivery':
      return { ...state, delivery: action.delivery };
    case 'initAnswers':
      return {
        ...state,
        answers: action.requirements.map(
          requirement =>
            state.answers.find(answer => answer.requirementUuid === requirement.uuid) ?? {
              requirementUuid: requirement.uuid,
              requirementName: requirement.name,
              has: null,
            }
        ),
      };
    case 'answerHas':
      return {
        ...state,
        answers: mapAnswer(state.answers, action.uuid, answer => ({
          ...answer,
          has: action.has,
          acquisition: action.has === 'yes' ? undefined : answer.acquisition,
        })),
      };
    case 'answerAcquisition':
      return {
        ...state,
        answers: mapAnswer(state.answers, action.uuid, answer => ({
          ...answer,
          acquisition: action.acquisition,
        })),
      };
    case 'note':
      return { ...state, note: action.note };
    case 'blocked':
      return { ...state, tried: true, step: action.step, visited: { ...state.visited, [state.step]: true } };
    case 'sent':
      return { ...state, sent: { applicationUuid: action.applicationUuid } };
    case 'reset':
      return initialApplyToTrainState(null);
    default:
      return state;
  }
}

export const answerErrors = (answers: RequirementAnswer[]) => validateAnswers(answers);

export function answersPayload(answers: RequirementAnswer[]): TrainingRequirementAnswerRequest[] {
  return answers
    .filter(answer => answer.has !== null)
    .map(answer => ({
      requirement_uuid: answer.requirementUuid,
      has_it: answer.has === 'yes',
      ...(answer.has === 'no' && answer.acquisition ? { acquisition: answer.acquisition } : {}),
    }));
}

export const stepIndex = (step: ApplyStepId) =>
  APPLY_TO_TRAIN_STEPS.findIndex(entry => entry.id === step);
