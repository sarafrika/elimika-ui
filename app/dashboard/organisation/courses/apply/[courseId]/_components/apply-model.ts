/**
 * The application's draft, and everything that reads it.
 *
 * The wizard's five steps all edit one {@link ApplyState}: which delivery
 * methods the applicant offers, the rooms they would teach in, the equipment
 * they can already put their hands on, and the price they want for each method.
 * The reducer is the only writer; the validators and the two composers
 * (`buildRateCard`, `composeApplicationNotes`) are the only readers that leave
 * the browser.
 *
 * Two of those readers are the whole point of the screen, so they are here
 * rather than inline in a step:
 *
 * - `buildRateCard` folds the tier list onto the API's 4 modalities × 3 bases
 *   grid. A basis nobody quoted is left unset, which makes the applicant
 *   ineligible for work contracted that way rather than guessing a figure.
 * - `composeApplicationNotes` is what the course creator's approval screen
 *   actually reads. The rate card carries numbers; this carries the sentence.
 */

import type { ElementType } from 'react';

import { Building2, Layers, Monitor, Users, Video } from 'lucide-react';

import { DEFAULT_RATE_BASIS, type RateBasis } from '@/components/class-form';
import type { CourseTrainingRateCard, CourseTrainingRequirement } from '@/services/client';

/* ────────────────────────────────────────────────────────────────────────────
 * Vocabulary
 * ────────────────────────────────────────────────────────────────────────── */

export type TrainingMethod =
  | 'private-in-person'
  | 'private-virtual'
  | 'group-in-person'
  | 'group-virtual'
  | 'hybrid';

export type TrainingContentKind = 'course' | 'program';

export type Classroom = { id: string; name: string; photoUrl?: string };

export type EquipmentItem = { id: string; name: string; brand: string; serial: string };

export type EquipmentAnswer = {
  /**
   * Requirements are keyed by uuid, not name: a course may list the same name
   * twice (this catalogue has four such pairs) and name-keyed answers made those
   * rows share one another's state while leaving orphan rows nobody could
   * answer — the wizard could then never satisfy its own validation.
   */
  requirementUuid: string;
  requirementName: string;
  has: 'yes' | 'no' | null;
  items: EquipmentItem[];
  acquisition?: 'lease' | 'hire';
};

export type PriceTier = {
  id: string;
  method: TrainingMethod | '';
  duration: string;
  amount: string;
  basis: RateBasis;
};

export type ApplyState = {
  step: number;
  methods: TrainingMethod[];
  classroomCount: number;
  classrooms: Classroom[];
  equipment: EquipmentAnswer[];
  pricing: PriceTier[];
};

export type ApplyAction =
  | { type: 'step'; step: number }
  | { type: 'toggleMethod'; method: TrainingMethod }
  | { type: 'classroomCount'; count: number }
  | { type: 'classroom'; id: string; patch: Partial<Classroom> }
  | { type: 'addClassroom' }
  | { type: 'removeClassroom'; id: string }
  | { type: 'moveClassroom'; id: string; direction: 'up' | 'down' }
  | { type: 'reorderClassrooms'; fromId: string; toId: string }
  | { type: 'equipHas'; uuid: string; has: 'yes' | 'no' }
  | { type: 'equipAcquisition'; uuid: string; acquisition: 'lease' | 'hire' }
  | { type: 'equipAddItem'; uuid: string; name: string }
  | { type: 'equipRemoveItem'; uuid: string; itemId: string }
  | { type: 'equipItem'; uuid: string; itemId: string; patch: Partial<EquipmentItem> }
  | { type: 'priceAdd' }
  | { type: 'priceRemove'; id: string }
  | { type: 'priceUpdate'; id: string; patch: Partial<PriceTier> }
  | { type: 'initEquipment'; requirements: { uuid: string; name: string }[] };

export const APPLY_STEPS = [
  'Training method',
  'Classrooms & labs',
  'Requirements',
  'Pricing',
  'Review',
] as const;

/** The applicant's own quote is always in the platform currency. */
export const APPLICATION_CURRENCY = 'KES';

/** How many classrooms the count control will accept. */
export const MAX_CLASSROOMS = 20;

export type MethodOption = {
  value: TrainingMethod;
  title: string;
  description: string;
  icon: ElementType;
};

export const METHOD_OPTIONS: MethodOption[] = [
  {
    value: 'private-in-person',
    title: 'Private in-person (live)',
    description: 'One-on-one on-site sessions.',
    icon: Users,
  },
  {
    value: 'private-virtual',
    title: 'Private virtual',
    description: 'One-on-one online sessions.',
    icon: Monitor,
  },
  {
    value: 'group-in-person',
    title: 'Group in-person (live)',
    description: 'Cohort on-site at your venue.',
    icon: Building2,
  },
  {
    value: 'group-virtual',
    title: 'Group virtual',
    description: 'Cohort delivered online.',
    icon: Video,
  },
  { value: 'hybrid', title: 'Hybrid', description: 'Mix of in-person and virtual.', icon: Layers },
];

export const methodOption = (method: TrainingMethod | '') =>
  METHOD_OPTIONS.find(option => option.value === method);

export const methodTitle = (method: TrainingMethod | '') => methodOption(method)?.title;

/* ────────────────────────────────────────────────────────────────────────────
 * The draft
 * ────────────────────────────────────────────────────────────────────────── */

export const uid = () => Math.random().toString(36).slice(2, 9);

export function initialApplyState(): ApplyState {
  return {
    step: 0,
    methods: [],
    classroomCount: 1,
    classrooms: [{ id: uid(), name: '' }],
    equipment: [],
    pricing: [],
  };
}

function makeClassrooms(count: number, existing: Classroom[]): Classroom[] {
  if (count <= existing.length) return existing.slice(0, count);
  const extras = Array.from({ length: count - existing.length }, () => ({ id: uid(), name: '' }));
  return [...existing, ...extras];
}

export function applyReducer(state: ApplyState, action: ApplyAction): ApplyState {
  switch (action.type) {
    case 'step':
      return { ...state, step: action.step };
    case 'initEquipment':
      return {
        ...state,
        equipment: action.requirements.map(requirement => {
          const existing = state.equipment.find(
            answer => answer.requirementUuid === requirement.uuid
          );
          return (
            existing ?? {
              requirementUuid: requirement.uuid,
              requirementName: requirement.name,
              has: null,
              items: [],
            }
          );
        }),
      };
    case 'toggleMethod': {
      const exists = state.methods.includes(action.method);
      const methods = exists
        ? state.methods.filter(method => method !== action.method)
        : [...state.methods, action.method];
      // Selecting a method opens a tier for it; deselecting takes its tiers away
      // rather than leaving the applicant priced for something they withdrew.
      const pricing = exists
        ? state.pricing.filter(tier => tier.method !== action.method)
        : state.pricing.some(tier => tier.method === action.method)
          ? state.pricing
          : [
              ...state.pricing,
              {
                id: uid(),
                method: action.method,
                duration: '',
                amount: '',
                basis: DEFAULT_RATE_BASIS,
              },
            ];
      return { ...state, methods, pricing };
    }
    case 'classroomCount': {
      if (!Number.isFinite(action.count)) return state;
      const count = Math.max(0, Math.min(MAX_CLASSROOMS, action.count));
      return {
        ...state,
        classroomCount: count,
        classrooms: makeClassrooms(count, state.classrooms),
      };
    }
    case 'classroom':
      return {
        ...state,
        classrooms: state.classrooms.map(room =>
          room.id === action.id ? { ...room, ...action.patch } : room
        ),
      };
    case 'addClassroom': {
      const next = [...state.classrooms, { id: uid(), name: '' }];
      return { ...state, classroomCount: next.length, classrooms: next };
    }
    case 'removeClassroom': {
      const next = state.classrooms.filter(room => room.id !== action.id);
      return { ...state, classroomCount: next.length, classrooms: next };
    }
    case 'moveClassroom': {
      const index = state.classrooms.findIndex(room => room.id === action.id);
      if (index < 0) return state;
      const target = action.direction === 'up' ? index - 1 : index + 1;
      const next = state.classrooms.slice();
      const moved = next[index];
      const displaced = next[target];
      if (!moved || !displaced) return state;
      next[index] = displaced;
      next[target] = moved;
      return { ...state, classrooms: next };
    }
    case 'reorderClassrooms': {
      if (action.fromId === action.toId) return state;
      const from = state.classrooms.findIndex(room => room.id === action.fromId);
      const to = state.classrooms.findIndex(room => room.id === action.toId);
      if (from < 0 || to < 0) return state;
      const next = state.classrooms.slice();
      const [moved] = next.splice(from, 1);
      if (!moved) return state;
      next.splice(to, 0, moved);
      return { ...state, classrooms: next };
    }
    case 'equipHas':
      return {
        ...state,
        equipment: state.equipment.map(answer =>
          answer.requirementUuid === action.uuid
            ? {
                ...answer,
                has: action.has,
                // A first "yes" opens one unit prefilled with the requirement's
                // own name — the commonest case is one of the thing asked for.
                items:
                  action.has === 'yes' && answer.items.length === 0
                    ? [{ id: uid(), name: answer.requirementName, brand: '', serial: '' }]
                    : answer.items,
                acquisition: action.has === 'yes' ? undefined : answer.acquisition,
              }
            : answer
        ),
      };
    case 'equipAcquisition':
      return {
        ...state,
        equipment: state.equipment.map(answer =>
          answer.requirementUuid === action.uuid
            ? { ...answer, acquisition: action.acquisition }
            : answer
        ),
      };
    case 'equipAddItem':
      return {
        ...state,
        equipment: state.equipment.map(answer =>
          answer.requirementUuid === action.uuid
            ? {
                ...answer,
                items: [...answer.items, { id: uid(), name: action.name, brand: '', serial: '' }],
              }
            : answer
        ),
      };
    case 'equipRemoveItem':
      return {
        ...state,
        equipment: state.equipment.map(answer =>
          answer.requirementUuid === action.uuid
            ? { ...answer, items: answer.items.filter(item => item.id !== action.itemId) }
            : answer
        ),
      };
    case 'equipItem':
      return {
        ...state,
        equipment: state.equipment.map(answer =>
          answer.requirementUuid === action.uuid
            ? {
                ...answer,
                items: answer.items.map(item =>
                  item.id === action.itemId ? { ...item, ...action.patch } : item
                ),
              }
            : answer
        ),
      };
    case 'priceAdd':
      return {
        ...state,
        pricing: [
          ...state.pricing,
          {
            id: uid(),
            method: state.methods[0] ?? '',
            duration: '',
            amount: '',
            basis: DEFAULT_RATE_BASIS,
          },
        ],
      };
    case 'priceRemove':
      return { ...state, pricing: state.pricing.filter(tier => tier.id !== action.id) };
    case 'priceUpdate':
      return {
        ...state,
        pricing: state.pricing.map(tier =>
          tier.id === action.id ? { ...tier, ...action.patch } : tier
        ),
      };
    default:
      return state;
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Validation — the live "complete the following" list
 * ────────────────────────────────────────────────────────────────────────── */

export function validateClassrooms(classrooms: Classroom[]): string[] {
  const errors: string[] = [];
  if (classrooms.length === 0) errors.push('Add at least one classroom or lab.');
  const blank = classrooms.filter(room => !room.name.trim()).length;
  if (blank > 0) errors.push(`Name ${blank} classroom${blank > 1 ? 's' : ''}.`);
  return errors;
}

export function validateEquipment(equipment: EquipmentAnswer[]): string[] {
  const errors: string[] = [];
  equipment.forEach(answer => {
    if (answer.has === null) {
      errors.push(`Answer Yes/No for "${answer.requirementName}".`);
    } else if (answer.has === 'yes') {
      if (answer.items.length === 0) {
        errors.push(`Add at least one item for "${answer.requirementName}".`);
      } else if (
        answer.items.some(item => !item.name.trim() || !item.brand.trim() || !item.serial.trim())
      ) {
        errors.push(`Complete name, brand, and serial for every "${answer.requirementName}" item.`);
      }
    } else if (answer.has === 'no' && !answer.acquisition) {
      errors.push(`Choose lease or hire for "${answer.requirementName}".`);
    }
  });
  return errors;
}

export function validatePricing(pricing: PriceTier[], methods: TrainingMethod[]): string[] {
  const errors: string[] = [];
  if (pricing.length === 0) errors.push('Add at least one pricing tier.');
  pricing.forEach((tier, index) => {
    const label = `pricing tier #${index + 1}`;
    if (!tier.method) errors.push(`Select a training method for ${label}.`);
    if (tier.method && !methods.includes(tier.method))
      errors.push(`${label} uses a training method that is no longer selected.`);
    if (!tier.duration.trim()) errors.push(`Enter a session duration for ${label}.`);
    const amount = Number.parseFloat(tier.amount);
    if (!tier.amount.trim() || Number.isNaN(amount) || amount <= 0)
      errors.push(`Enter a valid fee per student for ${label}.`);
  });
  return errors;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Whose requirement is it
 * ────────────────────────────────────────────────────────────────────────── */

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

/**
 * Only the requirements the applicant is on the hook for.
 *
 * A requirement the student brings, or the creator supplies, is not a question
 * to put to a school — asking makes the equipment step unanswerable and the
 * "ready 3/5" figure meaningless. An unstated provider is treated as the
 * applicant's, which is how the catalogue's older rows were entered.
 */
export function isOrganisationTrainingRequirement(requirement: CourseTrainingRequirement) {
  const provider = normalizeRequirementProvider(requirement.provided_by);
  return provider === null || provider === 'organisation';
}

/** The stable key a requirement's answer is filed under. */
export const requirementKey = (requirement: CourseTrainingRequirement) =>
  requirement.uuid ?? requirement.name;

/* ────────────────────────────────────────────────────────────────────────────
 * What leaves the browser
 * ────────────────────────────────────────────────────────────────────────── */

type RateModality = 'private_online' | 'private_inperson' | 'group_online' | 'group_inperson';
type RateSuffix = 'hourly_rate' | 'session_rate' | 'daily_rate';
type RateCardField = `${RateModality}_${RateSuffix}`;

/** Hybrid has no cell of its own — it is captured in the notes, not the grid. */
const RATE_MODALITY: Record<TrainingMethod, RateModality | null> = {
  'private-virtual': 'private_online',
  'private-in-person': 'private_inperson',
  'group-virtual': 'group_online',
  'group-in-person': 'group_inperson',
  hybrid: null,
};

const RATE_SUFFIX: Record<RateBasis, RateSuffix> = {
  per_hour: 'hourly_rate',
  per_session: 'session_rate',
  per_day: 'daily_rate',
};

/**
 * The tier list as the API's rate card.
 *
 * One tier prices one modality in the basis it was quoted in. The four hourly
 * cells are required by the schema so they default to `0` — "not offered" —
 * and a per-session or per-day quote lands in its own `*_session_rate` /
 * `*_daily_rate` cell, leaving the hourly one at zero.
 */
export function buildRateCard(pricing: PriceTier[]): CourseTrainingRateCard {
  const quoted: Partial<Record<RateCardField, number>> = {};

  for (const tier of pricing) {
    const modality = tier.method ? RATE_MODALITY[tier.method] : null;
    const amount = Number.parseFloat(tier.amount);
    if (modality && Number.isFinite(amount)) {
      quoted[`${modality}_${RATE_SUFFIX[tier.basis ?? DEFAULT_RATE_BASIS]}`] = amount;
    }
  }

  return {
    currency: APPLICATION_CURRENCY,
    private_online_hourly_rate: 0,
    private_inperson_hourly_rate: 0,
    group_online_hourly_rate: 0,
    group_inperson_hourly_rate: 0,
    ...quoted,
  };
}

/**
 * The sentence the creator's approval screen reads.
 *
 * The rate card carries the numbers and nothing else; this is where the shape
 * of the offer goes — which methods, which rooms, and how much of the kit the
 * applicant already owns.
 */
export function composeApplicationNotes({
  methods,
  classrooms,
  equipment,
  requirementCount,
  programRequirementCount,
  isProgram,
}: {
  methods: TrainingMethod[];
  classrooms: Classroom[];
  equipment: EquipmentAnswer[];
  requirementCount: number;
  programRequirementCount: number;
  isProgram: boolean;
}): string {
  const titles = methods
    .map(methodTitle)
    .filter((title): title is string => Boolean(title))
    .join(', ');

  return [
    `Methods: ${titles}`,
    `Classrooms: ${classrooms.map(room => room.name || '(unnamed)').join(', ')}`,
    isProgram
      ? `Program requirements reviewed: ${programRequirementCount}`
      : `Equipment ready: ${equipment.filter(answer => answer.has === 'yes').length}/${requirementCount}`,
  ].join(' · ');
}
