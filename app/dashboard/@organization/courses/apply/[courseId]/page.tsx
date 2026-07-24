// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Layers,
  Monitor,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  Users,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity } from '@/lib/api-helpers';
import { cn } from '@/lib/utils';
import type { Course, CourseTrainingRequirement } from '@/services/client';
import {
  getCourseByUuidOptions,
  submitTrainingApplicationMutation,
} from '@/services/client/@tanstack/react-query.gen';

// ---------- types & state ----------

type TrainingMethod = 'private-in-person' | 'private-virtual' | 'group-in-person' | 'group-virtual' | 'hybrid';

type Classroom = { id: string; name: string; photoUrl?: string };
type EquipmentItem = { id: string; name: string; brand: string; serial: string };
type EquipmentAnswer = {
  requirementName: string;
  has: 'yes' | 'no' | null;
  items: EquipmentItem[];
  acquisition?: 'lease' | 'hire';
};
type PriceTier = { id: string; method: TrainingMethod | ''; duration: string; amount: string };

type State = {
  step: number;
  methods: TrainingMethod[];
  classroomCount: number;
  classrooms: Classroom[];
  equipment: EquipmentAnswer[];
  pricing: PriceTier[];
};

type Action =
  | { type: 'step'; step: number }
  | { type: 'toggleMethod'; method: TrainingMethod }
  | { type: 'classroomCount'; count: number }
  | { type: 'classroom'; id: string; patch: Partial<Classroom> }
  | { type: 'addClassroom' }
  | { type: 'removeClassroom'; id: string }
  | { type: 'moveClassroom'; id: string; direction: 'up' | 'down' }
  | { type: 'reorderClassrooms'; fromId: string; toId: string }
  | { type: 'equipHas'; name: string; has: 'yes' | 'no' }
  | { type: 'equipAcquisition'; name: string; acquisition: 'lease' | 'hire' }
  | { type: 'equipAddItem'; name: string }
  | { type: 'equipRemoveItem'; name: string; itemId: string }
  | { type: 'equipItem'; name: string; itemId: string; patch: Partial<EquipmentItem> }
  | { type: 'priceAdd' }
  | { type: 'priceRemove'; id: string }
  | { type: 'priceUpdate'; id: string; patch: Partial<PriceTier> }
  | { type: 'initEquipment'; names: string[] };

const uid = () => Math.random().toString(36).slice(2, 9);

function makeClassrooms(count: number, existing: Classroom[]): Classroom[] {
  if (count <= existing.length) return existing.slice(0, count);
  const extras = Array.from({ length: count - existing.length }, () => ({ id: uid(), name: '' }));
  return [...existing, ...extras];
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'step':
      return { ...state, step: action.step };
    case 'initEquipment':
      return {
        ...state,
        equipment: action.names.map(name => {
          const existing = state.equipment.find(e => e.requirementName === name);
          return existing ?? { requirementName: name, has: null, items: [] };
        }),
      };
    case 'toggleMethod': {
      const exists = state.methods.includes(action.method);
      const methods = exists ? state.methods.filter(m => m !== action.method) : [...state.methods, action.method];
      const pricing = exists
        ? state.pricing.filter(p => p.method !== action.method)
        : state.pricing.some(p => p.method === action.method)
          ? state.pricing
          : [...state.pricing, { id: uid(), method: action.method, duration: '', amount: '' }];
      return { ...state, methods, pricing };
    }
    case 'classroomCount': {
      if (!Number.isFinite(action.count)) return state;
      const count = Math.max(0, Math.min(20, action.count));
      return { ...state, classroomCount: count, classrooms: makeClassrooms(count, state.classrooms) };
    }
    case 'classroom':
      return { ...state, classrooms: state.classrooms.map(c => (c.id === action.id ? { ...c, ...action.patch } : c)) };
    case 'addClassroom': {
      const next = [...state.classrooms, { id: uid(), name: '' }];
      return { ...state, classroomCount: next.length, classrooms: next };
    }
    case 'removeClassroom': {
      const next = state.classrooms.filter(c => c.id !== action.id);
      return { ...state, classroomCount: next.length, classrooms: next };
    }
    case 'moveClassroom': {
      const idx = state.classrooms.findIndex(c => c.id === action.id);
      if (idx < 0) return state;
      const target = action.direction === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= state.classrooms.length) return state;
      const next = state.classrooms.slice();
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...state, classrooms: next };
    }
    case 'reorderClassrooms': {
      if (action.fromId === action.toId) return state;
      const from = state.classrooms.findIndex(c => c.id === action.fromId);
      const to = state.classrooms.findIndex(c => c.id === action.toId);
      if (from < 0 || to < 0) return state;
      const next = state.classrooms.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...state, classrooms: next };
    }
    case 'equipHas':
      return {
        ...state,
        equipment: state.equipment.map(e =>
          e.requirementName === action.name
            ? {
                ...e,
                has: action.has,
                items:
                  action.has === 'yes' && e.items.length === 0
                    ? [{ id: uid(), name: action.name, brand: '', serial: '' }]
                    : e.items,
                acquisition: action.has === 'yes' ? undefined : e.acquisition,
              }
            : e
        ),
      };
    case 'equipAcquisition':
      return {
        ...state,
        equipment: state.equipment.map(e =>
          e.requirementName === action.name ? { ...e, acquisition: action.acquisition } : e
        ),
      };
    case 'equipAddItem':
      return {
        ...state,
        equipment: state.equipment.map(e =>
          e.requirementName === action.name
            ? { ...e, items: [...e.items, { id: uid(), name: action.name, brand: '', serial: '' }] }
            : e
        ),
      };
    case 'equipRemoveItem':
      return {
        ...state,
        equipment: state.equipment.map(e =>
          e.requirementName === action.name ? { ...e, items: e.items.filter(it => it.id !== action.itemId) } : e
        ),
      };
    case 'equipItem':
      return {
        ...state,
        equipment: state.equipment.map(e =>
          e.requirementName === action.name
            ? { ...e, items: e.items.map(it => (it.id === action.itemId ? { ...it, ...action.patch } : it)) }
            : e
        ),
      };
    case 'priceAdd':
      return {
        ...state,
        pricing: [...state.pricing, { id: uid(), method: state.methods[0] ?? '', duration: '', amount: '' }],
      };
    case 'priceRemove':
      return { ...state, pricing: state.pricing.filter(p => p.id !== action.id) };
    case 'priceUpdate':
      return { ...state, pricing: state.pricing.map(p => (p.id === action.id ? { ...p, ...action.patch } : p)) };
    default:
      return state;
  }
}

// ---------- validation helpers ----------

function validateClassrooms(classrooms: Classroom[]): string[] {
  const errors: string[] = [];
  if (classrooms.length === 0) errors.push('Add at least one classroom or lab.');
  const blank = classrooms.filter(c => !c.name.trim()).length;
  if (blank > 0) errors.push(`Name ${blank} classroom${blank > 1 ? 's' : ''}.`);
  return errors;
}

function validateEquipment(equipment: EquipmentAnswer[]): string[] {
  const errors: string[] = [];
  equipment.forEach(e => {
    if (e.has === null) {
      errors.push(`Answer Yes/No for "${e.requirementName}".`);
    } else if (e.has === 'yes') {
      if (e.items.length === 0) {
        errors.push(`Add at least one item for "${e.requirementName}".`);
      } else if (e.items.some(it => !it.name.trim() || !it.brand.trim() || !it.serial.trim())) {
        errors.push(`Complete name, brand, and serial for every "${e.requirementName}" item.`);
      }
    } else if (e.has === 'no' && !e.acquisition) {
      errors.push(`Choose lease or hire for "${e.requirementName}".`);
    }
  });
  return errors;
}

function validatePricing(pricing: PriceTier[], methods: TrainingMethod[]): string[] {
  const errors: string[] = [];
  if (pricing.length === 0) errors.push('Add at least one pricing tier.');
  pricing.forEach((p, idx) => {
    const label = `pricing tier #${idx + 1}`;
    if (!p.method) errors.push(`Select a training method for ${label}.`);
    if (p.method && !methods.includes(p.method)) errors.push(`${label} uses a training method that is no longer selected.`);
    if (!p.duration.trim()) errors.push(`Enter a session duration for ${label}.`);
    const amt = parseFloat(p.amount);
    if (!p.amount.trim() || Number.isNaN(amt) || amt <= 0) errors.push(`Enter a valid fee per student for ${label}.`);
  });
  return errors;
}

// ---------- component ----------

const STEPS = ['Training method', 'Classrooms & labs', 'Equipment', 'Pricing', 'Review'] as const;

const METHOD_OPTIONS: { value: TrainingMethod; title: string; description: string; icon: React.ElementType }[] = [
  { value: 'private-in-person', title: 'Private in-person (live)', description: 'One-on-one on-site sessions.', icon: Users },
  { value: 'private-virtual', title: 'Private virtual', description: 'One-on-one online sessions.', icon: Monitor },
  { value: 'group-in-person', title: 'Group in-person (live)', description: 'Cohort on-site at your venue.', icon: Building2 },
  { value: 'group-virtual', title: 'Group virtual', description: 'Cohort delivered online.', icon: Video },
  { value: 'hybrid', title: 'Hybrid', description: 'Mix of in-person and virtual.', icon: Layers },
];

/** Maps the wizard's method pricing into the backend's fixed 4-cell rate card. */
function buildRateCard(pricing: PriceTier[]) {
  const rate: Record<string, number> = {
    private_online_rate: 0,
    private_inperson_rate: 0,
    group_online_rate: 0,
    group_inperson_rate: 0,
  };
  const field: Record<TrainingMethod, string | null> = {
    'private-virtual': 'private_online_rate',
    'private-in-person': 'private_inperson_rate',
    'group-virtual': 'group_online_rate',
    'group-in-person': 'group_inperson_rate',
    hybrid: null,
  };
  for (const tier of pricing) {
    const key = tier.method ? field[tier.method] : null;
    const amt = parseFloat(tier.amount);
    if (key && Number.isFinite(amt)) rate[key] = amt;
  }
  return { currency: 'KES', ...rate };
}

export default function ApplyPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId ?? '';
  const router = useRouter();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseId } }),
    enabled: Boolean(courseId),
  });
  const course = extractEntity<Course>(courseQuery.data);
  const requirements: CourseTrainingRequirement[] = course?.training_requirements ?? [];

  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    step: 0,
    methods: [],
    classroomCount: 1,
    classrooms: [{ id: uid(), name: '' }],
    equipment: [],
    pricing: [],
  }));

  // Seed equipment answers from the course creator's real requirements once loaded.
  const reqKey = requirements.map(r => r.name).join('|');
  useEffect(() => {
    dispatch({ type: 'initEquipment', names: requirements.map(r => r.name) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reqKey]);

  const submitMutation = useMutation(submitTrainingApplicationMutation());

  const missing = useMemo(() => {
    const errors: string[] = [];
    if (state.step === 0) {
      if (state.methods.length === 0) errors.push('Select at least one preferred training method.');
    } else if (state.step === 1) {
      errors.push(...validateClassrooms(state.classrooms));
    } else if (state.step === 2) {
      errors.push(...validateEquipment(state.equipment));
    } else if (state.step === 3) {
      errors.push(...validatePricing(state.pricing, state.methods));
    } else if (state.step === 4) {
      if (state.methods.length === 0) errors.push('Select at least one preferred training method.');
      errors.push(...validateClassrooms(state.classrooms));
      errors.push(...validateEquipment(state.equipment));
      errors.push(...validatePricing(state.pricing, state.methods));
    }
    return errors;
  }, [state]);

  const canNext = missing.length === 0;
  const goNext = () => {
    if (!canNext) return;
    dispatch({ type: 'step', step: Math.min(STEPS.length - 1, state.step + 1) });
  };
  const goBack = () => dispatch({ type: 'step', step: Math.max(0, state.step - 1) });

  const submit = () => {
    if (!course || !organisationUuid) return;
    const methodTitles = state.methods
      .map(v => METHOD_OPTIONS.find(m => m.value === v)?.title)
      .filter(Boolean)
      .join(', ');
    const notes = [
      `Methods: ${methodTitles}`,
      `Classrooms: ${state.classrooms.map(c => c.name || '(unnamed)').join(', ')}`,
      `Equipment ready: ${state.equipment.filter(e => e.has === 'yes').length}/${requirements.length}`,
    ].join(' · ');

    submitMutation.mutate(
      {
        path: { courseUuid: courseId },
        body: {
          applicant_type: 'organisation',
          applicant_uuid: organisationUuid,
          rate_card: buildRateCard(state.pricing),
          application_notes: notes,
        },
      },
      {
        onSuccess: () => {
          toast.success('Application submitted', {
            description: `Your application to train ${course.name} is under review.`,
          });
          router.push('/dashboard/my-applications');
        },
        onError: () => {
          toast.error('Could not submit application', {
            description: 'Please review your answers and try again.',
          });
        },
      }
    );
  };

  if (courseQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Course not found.{' '}
        <Link href="/dashboard/courses/catalog" className="text-primary hover:underline">
          Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]">
      <PageHeader
        title={`Apply to train: ${course.name}`}
        description={`${course.category_names?.[0] ?? 'General'} · ${course.total_duration_display ?? '—'}`}
        action={
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/courses/catalog">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to catalog
            </Link>
          </Button>
        }
      />

      <Stepper step={state.step} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base" data-testid="apply-step-title">
            {STEPS[state.step]}
          </CardTitle>
          <CardDescription>
            {state.step === 0 && "Choose how you'd like to deliver this course."}
            {state.step === 1 && 'Tell us about the classrooms or labs you can provide.'}
            {state.step === 2 && 'Confirm the equipment required to run this course.'}
            {state.step === 3 && "Propose your fee per student for each training method you'd offer."}
            {state.step === 4 && 'Review your answers, then submit for approval.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {state.step === 0 && <StepMethod state={state} dispatch={dispatch} />}
          {state.step === 1 && <StepClassrooms state={state} dispatch={dispatch} />}
          {state.step === 2 && (
            <StepEquipment state={state} dispatch={dispatch} requirements={requirements} course={course} />
          )}
          {state.step === 3 && <StepPricing state={state} dispatch={dispatch} />}
          {state.step === 4 && <StepReview state={state} requirements={requirements} dispatch={dispatch} />}

          {missing.length > 0 && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning"
            >
              <p className="mb-1 font-medium">
                {state.step === STEPS.length - 1
                  ? 'Before submitting, complete the following:'
                  : 'To continue, complete the following:'}
              </p>
              <ul className="list-disc space-y-0.5 pl-5">
                {missing.map(m => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={goBack} disabled={state.step === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {state.step < STEPS.length - 1 ? (
              <Button type="button" onClick={goNext} disabled={!canNext}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={submit} disabled={!canNext || submitMutation.isPending}>
                <Check className="mr-2 h-4 w-4" /> {submitMutation.isPending ? 'Submitting…' : 'Submit application'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- stepper ----------

function Stepper({ step }: { step: number }) {
  return (
    <>
      <ol className="hidden items-center gap-2 sm:flex">
        {STEPS.map((label, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  done && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary text-primary',
                  !active && !done && 'border-border text-muted-foreground'
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn('text-sm', active ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="mx-2 h-px flex-1 bg-border" />}
            </li>
          );
        })}
      </ol>
      <p className="text-sm text-muted-foreground sm:hidden">
        Step {step + 1} of {STEPS.length} — <span className="font-medium text-foreground">{STEPS[step]}</span>
      </p>
    </>
  );
}

// ---------- step 1 ----------

function StepMethod({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Select all training methods you can offer — you'll set pricing per method in the Pricing step.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {METHOD_OPTIONS.map(({ value, title, description, icon: Icon }) => {
          const selected = state.methods.includes(value);
          return (
            <label
              key={value}
              htmlFor={`m-${value}`}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
              )}
            >
              <Checkbox
                id={`m-${value}`}
                checked={selected}
                onCheckedChange={() => dispatch({ type: 'toggleMethod', method: value })}
                className="mt-0.5"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-medium">{title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ---------- step 2 ----------

function StepClassrooms({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [countInput, setCountInput] = useState<string>(String(state.classroomCount));

  useEffect(() => {
    setCountInput(String(state.classroomCount));
  }, [state.classroomCount]);

  return (
    <div className="space-y-4">
      <div className="max-w-xs space-y-2">
        <Label htmlFor="count">How many classrooms/labs do you have for this course?</Label>
        <Input
          id="count"
          type="number"
          min={0}
          max={20}
          value={countInput}
          onChange={e => {
            const raw = e.target.value;
            setCountInput(raw);
            if (raw === '') return;
            const parsed = parseInt(raw, 10);
            if (Number.isFinite(parsed)) dispatch({ type: 'classroomCount', count: parsed });
          }}
          onBlur={() => {
            if (countInput === '' || !Number.isFinite(parseInt(countInput, 10))) {
              setCountInput(String(state.classroomCount));
            }
          }}
        />
      </div>

      {state.classrooms.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Drag rows or use the arrows to set your preferred order — the first row is your primary space.
        </p>
      )}

      <div className="space-y-3">
        {state.classrooms.map((c, idx) => (
          <ClassroomRow
            key={c.id}
            index={idx}
            total={state.classrooms.length}
            classroom={c}
            isDragging={dragId === c.id}
            isDragOver={dragOverId === c.id && dragId !== c.id}
            onChange={patch => dispatch({ type: 'classroom', id: c.id, patch })}
            onRemove={() => dispatch({ type: 'removeClassroom', id: c.id })}
            onMoveUp={() => dispatch({ type: 'moveClassroom', id: c.id, direction: 'up' })}
            onMoveDown={() => dispatch({ type: 'moveClassroom', id: c.id, direction: 'down' })}
            onDragStart={() => setDragId(c.id)}
            onDragEnd={() => {
              setDragId(null);
              setDragOverId(null);
            }}
            onDragOver={() => setDragOverId(c.id)}
            onDrop={() => {
              if (dragId && dragId !== c.id) dispatch({ type: 'reorderClassrooms', fromId: dragId, toId: c.id });
              setDragId(null);
              setDragOverId(null);
            }}
          />
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={() => dispatch({ type: 'addClassroom' })}>
        <Plus className="mr-2 h-4 w-4" /> Add classroom
      </Button>
    </div>
  );
}

function ClassroomRow({
  index,
  total,
  classroom,
  isDragging,
  isDragOver,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  index: number;
  total: number;
  classroom: Classroom;
  isDragging: boolean;
  isDragOver: boolean;
  onChange: (patch: Partial<Classroom>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDrop: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const previousUrl = useRef<string | undefined>(classroom.photoUrl);
  const progressTimer = useRef<number | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const MAX_MB = 5;
  const MAX_BYTES = MAX_MB * 1024 * 1024;
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  useEffect(() => {
    return () => {
      if (previousUrl.current?.startsWith('blob:')) URL.revokeObjectURL(previousUrl.current);
      if (progressTimer.current) window.clearInterval(progressTimer.current);
    };
  }, []);

  const clearFileInput = () => {
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = (file: File | null) => {
    setError(null);
    if (progressTimer.current) {
      window.clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
    if (!file) {
      if (previousUrl.current?.startsWith('blob:')) URL.revokeObjectURL(previousUrl.current);
      previousUrl.current = undefined;
      setProgress(null);
      onChange({ photoUrl: undefined });
      return;
    }
    if (!ALLOWED.includes(file.type)) {
      setError('Unsupported file type. Use JPG, PNG, WEBP, or GIF.');
      setProgress(null);
      clearFileInput();
      return;
    }
    if (file.size > MAX_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setError(`File is ${mb}MB. Maximum allowed is ${MAX_MB}MB.`);
      setProgress(null);
      clearFileInput();
      return;
    }
    setProgress(0);
    progressTimer.current = window.setInterval(() => {
      setProgress(prev => {
        const next = (prev ?? 0) + Math.random() * 18 + 8;
        if (next >= 100) {
          if (progressTimer.current) {
            window.clearInterval(progressTimer.current);
            progressTimer.current = null;
          }
          if (previousUrl.current?.startsWith('blob:')) URL.revokeObjectURL(previousUrl.current);
          const url = URL.createObjectURL(file);
          previousUrl.current = url;
          onChange({ photoUrl: url });
          window.setTimeout(() => setProgress(null), 250);
          return 100;
        }
        return next;
      });
    }, 120);
  };

  const uploading = progress !== null && progress < 100;

  return (
    <div
      draggable
      onDragStart={e => {
        onDragStart();
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', classroom.id);
      }}
      onDragEnd={onDragEnd}
      onDragOver={e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver();
      }}
      onDrop={e => {
        e.preventDefault();
        onDrop();
      }}
      className={cn(
        'grid gap-3 rounded-md border bg-card p-3 transition-all sm:grid-cols-[auto_96px_1fr_auto] sm:items-start',
        isDragging && 'opacity-50',
        isDragOver && 'border-primary ring-2 ring-primary/40'
      )}
    >
      <div className="flex items-center gap-1 sm:flex-col sm:items-center sm:gap-0.5">
        <span className="cursor-grab text-muted-foreground active:cursor-grabbing" aria-hidden title="Drag to reorder">
          <GripVertical className="h-4 w-4" />
        </span>
        <Badge variant="secondary" className="h-5 min-w-[1.5rem] justify-center px-1.5 text-[10px]">
          {index + 1}
        </Badge>
        <div className="ml-auto flex gap-0.5 sm:ml-0 sm:flex-col">
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveUp} disabled={index === 0} aria-label={`Move classroom ${index + 1} up`}>
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveDown} disabled={index === total - 1} aria-label={`Move classroom ${index + 1} down`}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={cn(
            'group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-md border border-dashed text-muted-foreground transition-colors hover:bg-muted',
            classroom.photoUrl && !uploading && 'border-solid border-border',
            error && 'border-destructive text-destructive',
            uploading && 'cursor-progress'
          )}
          aria-label={uploading ? `Uploading, ${Math.round(progress ?? 0)}%` : classroom.photoUrl ? 'Replace classroom photo' : 'Upload classroom photo'}
        >
          {classroom.photoUrl && !uploading ? (
            <>
              <img src={classroom.photoUrl} alt={classroom.name || `Classroom ${index + 1}`} className="h-full w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-foreground/60 py-0.5 text-center text-[10px] font-medium uppercase tracking-wide text-background opacity-0 transition-opacity group-hover:opacity-100">
                Replace
              </span>
            </>
          ) : uploading ? (
            <div className="flex w-full flex-col items-center gap-1 px-2 text-foreground">
              <span className="text-[10px] font-medium uppercase tracking-wide">{Math.round(progress ?? 0)}%</span>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress ?? 0)}>
                <div className="h-full bg-primary transition-all" style={{ width: `${progress ?? 0}%` }} />
              </div>
            </div>
          ) : (
            <span className="flex flex-col items-center gap-1">
              <Camera className="h-5 w-5" />
              <span className="text-[10px] font-medium uppercase tracking-wide">Add photo</span>
            </span>
          )}
        </button>
        {classroom.photoUrl && !uploading && !error && (
          <button type="button" onClick={() => handleFile(null)} className="w-24 text-center text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
            Remove
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0] ?? null;
          handleFile(file);
          if (fileRef.current && !file) fileRef.current.value = '';
        }}
      />

      <div className="space-y-1">
        <Label htmlFor={`room-${classroom.id}`} className="text-xs text-muted-foreground">
          Classroom #{index + 1} name <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`room-${classroom.id}`}
          value={classroom.name}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g. Room 12A / Lab B"
          required
          aria-invalid={!classroom.name.trim()}
          className={cn(!classroom.name.trim() && 'border-destructive focus-visible:ring-destructive/40')}
        />
        {!classroom.name.trim() ? (
          <p className="text-[11px] text-destructive">Classroom name is required.</p>
        ) : (
          <p className="text-[11px] text-muted-foreground">Photo is optional. Max {MAX_MB}MB · JPG, PNG, WEBP, GIF.</p>
        )}
        {error && (
          <p role="alert" className="text-[11px] font-medium text-destructive">
            {error}
          </p>
        )}
        {uploading && (
          <p aria-live="polite" className="text-[11px] text-muted-foreground">
            Uploading photo… {Math.round(progress ?? 0)}%
          </p>
        )}
      </div>
      <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove classroom" className="justify-self-end">
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
}

// ---------- step 3 ----------

function StepEquipment({
  state,
  dispatch,
  requirements,
  course,
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  requirements: CourseTrainingRequirement[];
  course: Course;
}) {
  if (requirements.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        The course creator has not listed any equipment requirements for this course. You can continue to the next step.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed bg-muted/30 p-3">
        <p className="text-sm text-muted-foreground">
          The list below is <span className="font-medium text-foreground">prefilled from the course creator's requirements</span>. For each one, tell us if you have it — you can add multiple units per requirement using <span className="font-medium text-foreground">Add another</span>.
        </p>
        <Badge variant="secondary">{requirements.length} required</Badge>
      </div>
      <div className="space-y-3">
        {requirements.map(req => {
          const answer = state.equipment.find(e => e.requirementName === req.name);
          if (!answer) return null;
          return <EquipmentBlock key={req.name} requirement={req} answer={answer} dispatch={dispatch} course={course} state={state} />;
        })}
      </div>
    </div>
  );
}

function EquipmentBlock({
  requirement,
  answer,
  dispatch,
  course,
  state,
}: {
  requirement: CourseTrainingRequirement;
  answer: EquipmentAnswer;
  dispatch: React.Dispatch<Action>;
  course: Course;
  state: State;
}) {
  return (
    <div className="rounded-md border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{requirement.name}</p>
            <Badge variant="outline" className="text-[10px] font-normal">
              Set by course creator
            </Badge>
            {answer.has === 'yes' && (
              <Badge variant="secondary" className="text-[10px]">
                {answer.items.length} {answer.items.length === 1 ? 'item' : 'items'} added
              </Badge>
            )}
          </div>
          {requirement.description && <p className="mt-1 text-sm text-muted-foreground">{requirement.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant={answer.has === 'yes' ? 'default' : 'outline'} onClick={() => dispatch({ type: 'equipHas', name: requirement.name, has: 'yes' })}>
            Yes
          </Button>
          <Button type="button" size="sm" variant={answer.has === 'no' ? 'default' : 'outline'} onClick={() => dispatch({ type: 'equipHas', name: requirement.name, has: 'no' })}>
            No
          </Button>
        </div>
      </div>

      {answer.has === 'yes' && (
        <div className="mt-4 space-y-3">
          {answer.items.map((item, idx) => {
            const nameInvalid = !item.name.trim();
            const brandInvalid = !item.brand.trim();
            const serialInvalid = !item.serial.trim();
            const rowInvalid = nameInvalid || brandInvalid || serialInvalid;
            return (
              <div key={item.id} className={cn('grid gap-2 rounded-md bg-muted/40 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]', rowInvalid && 'ring-1 ring-destructive/40')}>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Name / Model <span className="text-destructive">*</span>
                  </Label>
                  <Input value={item.name} onChange={e => dispatch({ type: 'equipItem', name: requirement.name, itemId: item.id, patch: { name: e.target.value } })} placeholder={`Item ${idx + 1}`} required aria-invalid={nameInvalid} className={cn(nameInvalid && 'border-destructive focus-visible:ring-destructive/40')} />
                  {nameInvalid && <p className="text-[11px] text-destructive">Required.</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Brand <span className="text-destructive">*</span>
                  </Label>
                  <Input value={item.brand} onChange={e => dispatch({ type: 'equipItem', name: requirement.name, itemId: item.id, patch: { brand: e.target.value } })} required aria-invalid={brandInvalid} className={cn(brandInvalid && 'border-destructive focus-visible:ring-destructive/40')} />
                  {brandInvalid && <p className="text-[11px] text-destructive">Required.</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Serial number <span className="text-destructive">*</span>
                  </Label>
                  <Input value={item.serial} onChange={e => dispatch({ type: 'equipItem', name: requirement.name, itemId: item.id, patch: { serial: e.target.value } })} required aria-invalid={serialInvalid} className={cn(serialInvalid && 'border-destructive focus-visible:ring-destructive/40')} />
                  {serialInvalid && <p className="text-[11px] text-destructive">Required.</p>}
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => dispatch({ type: 'equipRemoveItem', name: requirement.name, itemId: item.id })} aria-label="Remove item" className="self-end">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            );
          })}
          {answer.items.length === 0 && <p className="text-[11px] text-destructive">Add at least one item with name, brand, and serial number.</p>}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-xs text-muted-foreground">Have more than one? Add each unit so we can track serial numbers individually.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => dispatch({ type: 'equipAddItem', name: requirement.name })}>
              <Plus className="mr-2 h-4 w-4" /> Add another {requirement.name}
            </Button>
          </div>
        </div>
      )}

      {answer.has === 'no' && (
        <div className="mt-4 rounded-md border border-dashed bg-muted/30 p-3">
          <p className="text-sm">No problem — Sarafrika can help you acquire this equipment.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant={answer.acquisition === 'lease' ? 'default' : 'outline'} onClick={() => dispatch({ type: 'equipAcquisition', name: requirement.name, acquisition: 'lease' })}>
              Lease to own
            </Button>
            <Button type="button" size="sm" variant={answer.acquisition === 'hire' ? 'default' : 'outline'} onClick={() => dispatch({ type: 'equipAcquisition', name: requirement.name, acquisition: 'hire' })}>
              Hire
            </Button>
            {answer.acquisition && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  toast.info('Sarafrika Shop', {
                    description: `We'll help you ${answer.acquisition === 'lease' ? 'lease to own' : 'hire'} ${requirement.name} for ${course.name}.`,
                  })
                }
              >
                <ShoppingBag className="mr-2 h-4 w-4" /> Continue to Sarafrika Shop
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- step 4 (pricing) ----------

function StepPricing({ state, dispatch }: { state: State; dispatch: React.Dispatch<Action> }) {
  const selectedTitles = state.methods.map(v => METHOD_OPTIONS.find(m => m.value === v)?.title).filter(Boolean) as string[];
  const totalTiers = state.pricing.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed bg-muted/30 p-3">
        <div className="text-sm text-muted-foreground">
          What's your <span className="font-medium text-foreground">proposed fee per student</span>?
          {selectedTitles.length > 0 && <> A pricing row is auto-created for each selected method. Add extra tiers if you offer different session durations for the same method.</>}
          {selectedTitles.length === 0 && <span className="text-destructive"> Select at least one training method first.</span>}
        </div>
        <Badge variant="secondary">
          {totalTiers} {totalTiers === 1 ? 'tier' : 'tiers'}
        </Badge>
      </div>

      <div className="space-y-3">
        {state.pricing.map((tier, idx) => {
          const methodOpt = METHOD_OPTIONS.find(m => m.value === tier.method);
          const methodInvalid = !tier.method;
          const durationInvalid = !tier.duration.trim();
          const amt = parseFloat(tier.amount);
          const amountInvalid = !tier.amount.trim() || Number.isNaN(amt) || amt <= 0;
          return (
            <div key={tier.id} className="rounded-md border p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Training method {idx + 1}
                  </Badge>
                  {methodOpt && <span className="text-xs text-muted-foreground">{methodOpt.title}</span>}
                </div>
                {state.pricing.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => dispatch({ type: 'priceRemove', id: tier.id })} aria-label={`Remove pricing tier ${idx + 1}`}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
                <div className="space-y-1">
                  <Label htmlFor={`p-method-${tier.id}`} className="text-xs text-muted-foreground">
                    Training method <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id={`p-method-${tier.id}`}
                    value={tier.method}
                    onChange={e => dispatch({ type: 'priceUpdate', id: tier.id, patch: { method: e.target.value as TrainingMethod | '' } })}
                    aria-invalid={methodInvalid}
                    className={cn(
                      'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring',
                      methodInvalid && 'border-destructive focus-visible:ring-destructive/40'
                    )}
                  >
                    <option value="">Select method…</option>
                    {METHOD_OPTIONS.map(m => (
                      <option key={m.value} value={m.value}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                  {methodInvalid && <p className="text-[11px] text-destructive">Required.</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`p-duration-${tier.id}`} className="text-xs text-muted-foreground">
                    Session duration <span className="text-destructive">*</span>
                  </Label>
                  <Input id={`p-duration-${tier.id}`} value={tier.duration} onChange={e => dispatch({ type: 'priceUpdate', id: tier.id, patch: { duration: e.target.value } })} placeholder="e.g. 1 hour, 90 min, half-day" aria-invalid={durationInvalid} className={cn(durationInvalid && 'border-destructive focus-visible:ring-destructive/40')} />
                  {durationInvalid && <p className="text-[11px] text-destructive">Required.</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`p-amount-${tier.id}`} className="text-xs text-muted-foreground">
                    Amount (KES / student) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs font-medium text-muted-foreground">KES</span>
                    <Input id={`p-amount-${tier.id}`} type="number" min={0} inputMode="decimal" value={tier.amount} onChange={e => dispatch({ type: 'priceUpdate', id: tier.id, patch: { amount: e.target.value } })} placeholder="0" aria-invalid={amountInvalid} className={cn('pl-11', amountInvalid && 'border-destructive focus-visible:ring-destructive/40')} />
                  </div>
                  {amountInvalid && <p className="text-[11px] text-destructive">Enter an amount greater than 0.</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={() => dispatch({ type: 'priceAdd' })}>
        <Plus className="mr-2 h-4 w-4" /> Add training method pricing
      </Button>
    </div>
  );
}

// ---------- step 5 (review) ----------

function StepReview({
  state,
  requirements,
  dispatch,
}: {
  state: State;
  requirements: CourseTrainingRequirement[];
  dispatch: React.Dispatch<Action>;
}) {
  const selectedMethods = state.methods
    .map(v => METHOD_OPTIONS.find(m => m.value === v))
    .filter((m): m is (typeof METHOD_OPTIONS)[number] => Boolean(m));

  const haveCount = state.equipment.filter(e => e.has === 'yes').length;
  const needCount = state.equipment.filter(e => e.has === 'no').length;
  const totalItems = state.equipment.reduce((n, e) => n + (e.has === 'yes' ? e.items.length : 0), 0);

  const goToStep = (step: number) => dispatch({ type: 'step', step });

  const methodSummary =
    selectedMethods.length === 0 ? '—' : selectedMethods.length === 1 ? selectedMethods[0].title.split(' (')[0] : `${selectedMethods.length} selected`;

  return (
    <div className="space-y-6 text-sm">
      <div className="grid gap-3 rounded-md border bg-muted/30 p-3 sm:grid-cols-4">
        <SummaryStat label="Methods" value={methodSummary} />
        <SummaryStat label="Classrooms" value={String(state.classrooms.length)} />
        <SummaryStat label="Equipment on hand" value={`${haveCount}/${requirements.length}`} />
        <SummaryStat label="Items catalogued" value={String(totalItems)} />
      </div>

      <section className="space-y-2">
        <SectionHeader title={`Training methods (${selectedMethods.length})`} onEdit={() => goToStep(0)} />
        {selectedMethods.length === 0 ? (
          <p className="rounded-md border border-dashed p-3 text-muted-foreground">No training methods selected.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {selectedMethods.map(m => {
              const Icon = m.icon;
              return (
                <li key={m.value} className="flex items-start gap-3 rounded-md border p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium">{m.title}</p>
                    <p className="text-muted-foreground">{m.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <SectionHeader title={`Classrooms & labs (${state.classrooms.length})`} onEdit={() => goToStep(1)} />
        {state.classrooms.length === 0 ? (
          <p className="rounded-md border border-dashed p-3 text-muted-foreground">No classrooms added.</p>
        ) : (
          <ol className="grid gap-2 sm:grid-cols-2">
            {state.classrooms.map((c, idx) => (
              <li key={c.id} className="flex items-center gap-3 rounded-md border p-2">
                {c.photoUrl ? (
                  <img src={c.photoUrl} alt={c.name || `Classroom ${idx + 1}`} className="h-14 w-14 rounded-md object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Camera className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    <span className="mr-1 text-muted-foreground">#{idx + 1}</span>
                    {c.name || '(unnamed)'}
                  </p>
                  <p className="text-xs text-muted-foreground">{c.photoUrl ? 'Photo attached' : 'No photo'}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="space-y-2">
        <SectionHeader title={`Equipment (${haveCount} ready · ${needCount} to source)`} onEdit={() => goToStep(2)} />
        <ul className="space-y-2">
          {requirements.map(req => {
            const a = state.equipment.find(e => e.requirementName === req.name);
            if (!a) return null;
            return (
              <li key={req.name} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{req.name}</span>
                  {a.has === 'yes' && (
                    <Badge variant="secondary">
                      Ready · {a.items.length} item{a.items.length === 1 ? '' : 's'}
                    </Badge>
                  )}
                  {a.has === 'no' && a.acquisition && (
                    <Badge variant="outline">{a.acquisition === 'lease' ? 'Lease to own' : 'Hire'} via Sarafrika</Badge>
                  )}
                  {a.has === null && <Badge variant="outline">Not answered</Badge>}
                </div>
                {a.has === 'yes' && a.items.length > 0 && (
                  <div className="mt-3 overflow-hidden rounded-md border">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          <th className="px-2 py-1.5 text-left font-medium">Name / Model</th>
                          <th className="px-2 py-1.5 text-left font-medium">Brand</th>
                          <th className="px-2 py-1.5 text-left font-medium">Serial</th>
                        </tr>
                      </thead>
                      <tbody>
                        {a.items.map(it => (
                          <tr key={it.id} className="border-t">
                            <td className="px-2 py-1.5">{it.name || '—'}</td>
                            <td className="px-2 py-1.5">{it.brand || '—'}</td>
                            <td className="px-2 py-1.5 font-mono">{it.serial || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-2">
        <SectionHeader title={`Pricing (${state.pricing.length} ${state.pricing.length === 1 ? 'tier' : 'tiers'})`} onEdit={() => goToStep(3)} />
        {state.pricing.length === 0 ? (
          <p className="rounded-md border border-dashed p-3 text-muted-foreground">No pricing tiers added.</p>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Training method</th>
                  <th className="px-3 py-2 text-left font-medium">Session duration</th>
                  <th className="px-3 py-2 text-right font-medium">Fee / student (KES)</th>
                </tr>
              </thead>
              <tbody>
                {state.pricing.map(p => {
                  const m = METHOD_OPTIONS.find(mo => mo.value === p.method);
                  const amt = parseFloat(p.amount);
                  return (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1.5">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          {m?.title ?? '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2">{p.duration || '—'}</td>
                      <td className="px-3 py-2 text-right font-mono">{Number.isFinite(amt) ? amt.toLocaleString() : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  );
}

function SectionHeader({ title, onEdit }: { title: string; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-semibold">{title}</h3>
      <Button type="button" variant="ghost" size="sm" onClick={onEdit} className="h-7 px-2 text-xs">
        Edit
      </Button>
    </div>
  );
}
