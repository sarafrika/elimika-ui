import {
  normaliseRateCard,
  offeredMethods,
  type RateCard,
  validateRateCard,
} from '@/lib/rate-card';
import type {
  CourseTrainingApplicationUpdateRequest,
  CourseTrainingRequirement,
  TrainingRequirementAnswerRequest,
} from '@/services/client';
import type { CourseTrainerApplicantType } from '@/src/features/course-record';
import type { TrainingApplication } from '@/src/features/rate-card/types';

export type TrainingContentKind = 'course' | 'program';

export type StepId = 'venues' | 'requirements' | 'pricing' | 'review';

export type ApplyStep = { id: StepId; label: string };

/** Wizard order; instructors skip venues. */
export const APPLY_STEPS: readonly ApplyStep[] = [
  { id: 'venues', label: 'Classrooms & labs' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'review', label: 'Review' },
];

export function visibleSteps(applicantType: CourseTrainerApplicantType): readonly ApplyStep[] {
  return applicantType === 'organisation'
    ? APPLY_STEPS
    : APPLY_STEPS.filter(step => step.id !== 'venues');
}

/** Keyed by requirement uuid: a course may list the same name twice. */
export type RequirementAnswer = {
  requirementUuid: string;
  requirementName: string;
  has: 'yes' | 'no' | null;
  acquisition?: 'lease' | 'hire';
};

export type ApplyState = {
  step: StepId;
  card: RateCard;
  venueUuids: string[];
  answers: RequirementAnswer[];
  note: string;
};

export type ApplyAction =
  | { type: 'step'; step: StepId }
  | { type: 'card'; card: RateCard }
  | { type: 'toggleVenue'; uuid: string }
  | { type: 'answerHas'; uuid: string; has: 'yes' | 'no' }
  | { type: 'answerAcquisition'; uuid: string; acquisition: 'lease' | 'hire' }
  | { type: 'initAnswers'; requirements: { uuid: string; name: string }[] }
  | { type: 'note'; note: string };

/** A fresh draft, or one hydrated from a pending application being edited. */
export function initialApplyState(
  applicantType: CourseTrainerApplicantType,
  application?: TrainingApplication | null
): ApplyState {
  return {
    step: visibleSteps(applicantType)[0]!.id,
    card: normaliseRateCard(application?.rate_card),
    venueUuids: (application?.offered_venues ?? [])
      .map(venue => venue.resource_uuid)
      .filter((uuid): uuid is string => Boolean(uuid)),
    answers: (application?.requirement_answers ?? [])
      .filter(answer => answer.requirement_uuid)
      .map(answer => ({
        requirementUuid: answer.requirement_uuid as string,
        requirementName: answer.requirement_name ?? 'Requirement',
        has: answer.has_it ? 'yes' : 'no',
        acquisition: answer.has_it ? undefined : (answer.acquisition ?? undefined),
      })),
    note: application?.application_notes ?? '',
  };
}

export function applyReducer(state: ApplyState, action: ApplyAction): ApplyState {
  switch (action.type) {
    case 'step':
      return { ...state, step: action.step };
    case 'card':
      return { ...state, card: action.card };
    case 'toggleVenue':
      return {
        ...state,
        venueUuids: state.venueUuids.includes(action.uuid)
          ? state.venueUuids.filter(uuid => uuid !== action.uuid)
          : [...state.venueUuids, action.uuid],
      };
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
        answers: state.answers.map(answer =>
          answer.requirementUuid === action.uuid
            ? {
                ...answer,
                has: action.has,
                acquisition: action.has === 'yes' ? undefined : answer.acquisition,
              }
            : answer
        ),
      };
    case 'answerAcquisition':
      return {
        ...state,
        answers: state.answers.map(answer =>
          answer.requirementUuid === action.uuid
            ? { ...answer, acquisition: action.acquisition }
            : answer
        ),
      };
    case 'note':
      return { ...state, note: action.note };
    default:
      return state;
  }
}

export function validateAnswers(answers: RequirementAnswer[]): string[] {
  return answers.flatMap(answer => {
    if (answer.has === null) return [`Answer Yes or No for "${answer.requirementName}".`];
    if (answer.has === 'no' && !answer.acquisition)
      return [`Choose lease or hire for "${answer.requirementName}".`];
    return [];
  });
}

/** The rate card's blocking problems as one list, for the step's "complete the following". */
export function validatePricing(card: RateCard, minimumFee?: number | null): string[] {
  const { cells, card: cardErrors } = validateRateCard(card, minimumFee);
  const messages = Object.values(cells);
  const empty = messages.filter(message => message.startsWith('Enter a rate')).length;
  const tooLow = messages.length - empty;
  return [
    ...cardErrors,
    ...(empty > 0
      ? [
          `${empty} ${empty === 1 ? 'rate is' : 'rates are'} still empty. Every method you offer needs a price per hour, per session and per day.`,
        ]
      : []),
    ...(tooLow > 0
      ? [`${tooLow} ${tooLow === 1 ? 'rate is' : 'rates are'} below the minimum training fee.`]
      : []),
  ];
}

/** True when the card offers a method taught in a room. */
export function offersInPerson(card: RateCard): boolean {
  return offeredMethods(card).some(method => method.location === 'in-person');
}

/** The provider vocabulary, spelled every way the API has spelled it. */
export function normalizeRequirementProvider(provider?: string | null) {
  switch (provider?.toLowerCase()) {
    case 'organisation':
    case 'organization':
    case 'organisation_user':
    case 'organization_user':
    case 'training_center':
      return 'organisation';
    case 'instructor':
      return 'instructor';
    case 'student':
      return 'student';
    case 'course_creator':
      return 'course_creator';
    default:
      return null;
  }
}

/** Requirements the applicant provides; an unstated provider counts as theirs. */
export function isApplicantTrainingRequirement(
  requirement: CourseTrainingRequirement,
  applicantType: CourseTrainerApplicantType
) {
  const provider = normalizeRequirementProvider(requirement.provided_by);
  return provider === null || provider === applicantType;
}

/** The applicant's own note, or null; nothing else is folded into it. */
export function composeApplicationNotes(note: string): string | null {
  return note.trim() || null;
}

/** Everything the wizard sends besides the applicant identity. */
export function buildApplicationPayload(
  state: ApplyState,
  { applicantType, isProgram }: { applicantType: CourseTrainerApplicantType; isProgram: boolean }
): CourseTrainingApplicationUpdateRequest {
  const answers: TrainingRequirementAnswerRequest[] = state.answers
    .filter(answer => answer.has !== null)
    .map(answer => ({
      requirement_uuid: answer.requirementUuid,
      has_it: answer.has === 'yes',
      ...(answer.has === 'no' && answer.acquisition ? { acquisition: answer.acquisition } : {}),
    }));

  return {
    rate_card: normaliseRateCard(state.card),
    application_notes: composeApplicationNotes(state.note),
    ...(applicantType === 'organisation' ? { offered_venue_uuids: state.venueUuids } : {}),
    ...(isProgram ? {} : { requirement_answers: answers }),
  };
}
