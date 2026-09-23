'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import {
  addCourseTrainingRequirementMutation,
  deleteCourseTrainingRequirementMutation,
  getCourseTrainingRequirementsQueryKey,
  updateCourseTrainingRequirementMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  AddCourseTrainingRequirementResponse,
  CourseTrainingRequirement,
} from '@/services/client/types.gen';
import type { QueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { type Dispatch, Fragment, type SetStateAction, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Textarea } from '../../../../components/ui/textarea';
import { providedByOptions, requirementTypes } from './course-creation-types';

type MutationVariables<T> = T extends {
  mutationFn?: (variables: infer TVariables) => Promise<unknown>;
}
  ? TVariables
  : never;
export type Provider = (typeof providedByOptions)[number];
type RequirementRecord = {
  uuid?: string;
  course_uuid: string;
  requirement_type: string;
  name: string;
  description?: string;
  quantity?: number;
  unit?: string;
  provided_by?: Provider;
  is_mandatory?: boolean;
  created_date?: CourseTrainingRequirement['created_date'];
  created_by?: CourseTrainingRequirement['created_by'];
  updated_date?: CourseTrainingRequirement['updated_date'];
  updated_by?: CourseTrainingRequirement['updated_by'];
};
type AddRequirementVariables = MutationVariables<
  ReturnType<typeof addCourseTrainingRequirementMutation>
>;
type UpdateRequirementVariables = MutationVariables<
  ReturnType<typeof updateCourseTrainingRequirementMutation>
>;
type DeleteRequirementVariables = MutationVariables<
  ReturnType<typeof deleteCourseTrainingRequirementMutation>
>;
type RequirementMutation<TVariables> = {
  mutate: (
    variables: TVariables,
    options?: {
      onSuccess?: (data: unknown) => void;
      onError?: (error: unknown) => void;
    }
  ) => void;
  isPending: boolean;
};

const PROVIDERS: { value: Provider; label: string }[] = [
  { value: 'instructor', label: 'Instructor' },
  { value: 'organisation', label: 'Organisation' },
  { value: 'student', label: 'Student' },
];

const EDUCATION_QUANTITY = 1;
const EDUCATION_UNIT = 'license';

const INSTRUCTOR_REQUIREMENT_TYPES = [...requirementTypes, 'education'] as const;

const requirementTypesForProvider = (provider?: Provider | null) =>
  provider === 'instructor' ? INSTRUCTOR_REQUIREMENT_TYPES : requirementTypes;

const UNIT_OPTIONS = [
  'pieces',
  'units',
  'sets',
  'bundles',
  'dozens',
  'pairs',
  'boxes',
  'kits',
  'seats',
  'license',
  'licenses',
  'copies',
  'other',
];

export type DraftRow = {
  id: string; // temp local id
  name: string;
  requirement_type: string;
  quantity: string;
  unit: string;
  is_mandatory: boolean;
  description: string;
};

export const emptyDraft = (): DraftRow => ({
  id: crypto.randomUUID(),
  name: '',
  requirement_type: requirementTypes[0] ?? 'material',
  quantity: '',
  unit: 'pieces',
  is_mandatory: false,
  description: '',
});

export type DraftsByProvider = Record<Provider, DraftRow[]>;

export const createEmptyDraftsByProvider = (): DraftsByProvider => ({
  course_creator: [emptyDraft()],
  instructor: [emptyDraft()],
  organisation: [emptyDraft()],
  student: [emptyDraft()],
});

type Props = {
  draftsByProvider: DraftsByProvider;
  setDraftsByProvider: Dispatch<SetStateAction<DraftsByProvider>>;
  activeProvider: Provider | null;
  setActiveProvider: Dispatch<SetStateAction<Provider | null>>;
  existingRequirements: RequirementRecord[];
  setExistingRequirements: React.Dispatch<React.SetStateAction<RequirementRecord[]>>;
  editingCourseId?: string;
  courseId?: string;
  addTrainingReqMut: {
    mutateAsync: (
      variables: AddRequirementVariables
    ) => Promise<AddCourseTrainingRequirementResponse>;
  };
  updateTrainingReqMut: RequirementMutation<UpdateRequirementVariables>;
  deleteTrainingReqMut: RequirementMutation<DeleteRequirementVariables>;
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
  qc: QueryClient;
};

export function TrainingRequirementsSection({
  existingRequirements,
  setExistingRequirements,
  editingCourseId,
  courseId,
  draftsByProvider,
  setDraftsByProvider,
  activeProvider,
  setActiveProvider,
  addTrainingReqMut,
  updateTrainingReqMut,
  deleteTrainingReqMut,
  deletingId,
  setDeletingId,
  qc,
}: Props) {
  const targetCourseUuid = editingCourseId ?? courseId;

  const [savingProvider, setSavingProvider] = useState<Provider | null>(null);

  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<DraftRow>>({});

  const updateDraftRow = (provider: Provider, id: string, patch: Partial<DraftRow>) => {
    setDraftsByProvider(prev => ({
      ...prev,
      [provider]: prev[provider].map(r => (r.id === id ? { ...r, ...patch } : r)),
    }));
  };

  const addDraftRow = (provider: Provider, education = false) => {
    setDraftsByProvider(prev => ({
      ...prev,
      [provider]: [
        ...prev[provider],
        {
          ...emptyDraft(),
          ...(education
            ? {
              requirement_type: 'education',
              quantity: String(EDUCATION_QUANTITY),
              unit: EDUCATION_UNIT,
            }
            : {}),
        },
      ],
    }));
  };

  const removeDraftRow = (provider: Provider, id: string) => {
    setDraftsByProvider(prev => ({
      ...prev,
      [provider]: prev[provider].filter(r => r.id !== id),
    }));
  };

  const saveDraftsForProvider = async (provider: Provider) => {
    if (savingProvider) return;
    if (!targetCourseUuid) {
      toast.error('Save the course first before adding requirements.');
      return;
    }

    const drafts = draftsByProvider[provider].filter(d => d.name.trim());

    if (drafts.length === 0) {
      toast.error('Add at least one requirement with a name.');
      return;
    }

    setSavingProvider(provider);

    try {
      // Each mutateAsync call owns its promise; consecutive mutate callbacks do not.
      const results = await Promise.allSettled(
        drafts.map(async draft => {
          const response = await addTrainingReqMut.mutateAsync({
            body: {
              name: draft.name.trim(),
              requirement_type: draft.requirement_type,
              ...(draft.requirement_type === 'education'
                ? { quantity: EDUCATION_QUANTITY, unit: EDUCATION_UNIT }
                : {
                  quantity: draft.quantity ? Number(draft.quantity) : 0,
                  unit: draft.unit,
                }),
              is_mandatory: draft.is_mandatory,
              description: draft.description,
              provided_by: provider,
              course_uuid: targetCourseUuid,
            } as AddRequirementVariables['body'],
            path: { courseUuid: targetCourseUuid },
          });
          if (response.error || response.success === false || !response.data) {
            throw new Error(response.message || 'Failed to save requirement.');
          }
          return { draftId: draft.id, requirement: response.data };
        })
      );

      const succeeded = results.flatMap(result =>
        result.status === 'fulfilled' ? [result.value] : []
      );
      const failed = results.length - succeeded.length;

      if (succeeded.length > 0) {
        setExistingRequirements(prev => [...prev, ...succeeded.map(item => item.requirement)]);
        qc.invalidateQueries({
          queryKey: getCourseTrainingRequirementsQueryKey({
            path: { courseUuid: targetCourseUuid },
            query: { pageable: {} },
          }),
        });
        const savedDraftIds = new Set(succeeded.map(item => item.draftId));
        setDraftsByProvider(prev => {
          const remaining = prev[provider].filter(draft => !savedDraftIds.has(draft.id));
          return {
            ...prev,
            [provider]: remaining.length > 0 ? remaining : [emptyDraft()],
          };
        });
        toast.success(
          `${succeeded.length} requirement${succeeded.length > 1 ? 's' : ''} saved for ${PROVIDERS.find(p => p.value === provider)?.label}.`
        );
        if (failed === 0) setActiveProvider(null);
      }

      if (failed > 0)
        toast.error(`${failed} requirement(s) failed to save. Retry the remaining rows.`);
    } finally {
      setSavingProvider(null);
    }
  };

  const startEdit = (req: RequirementRecord) => {
    if (!req.uuid) return;
    setEditingReqId(req.uuid);
    setEditDraft({
      name: req.name ?? '',
      requirement_type: req.requirement_type ?? requirementTypes[0],
      quantity: req.quantity?.toString() ?? '',
      unit: req.unit ?? 'pieces',
      is_mandatory: req.is_mandatory ?? false,
      description: req.description ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingReqId(null);
    setEditDraft({});
  };

  const saveEdit = (req: RequirementRecord) => {
    if (!targetCourseUuid || !req.uuid) return;
    if (updateTrainingReqMut.isPending) return;
    if (!editDraft.name?.trim()) {
      toast.error('Requirement name is required.');
      return;
    }
    const requirementType = editDraft.requirement_type ?? req.requirement_type;
    const isEducation = requirementType === 'education';
    const variables = {
      body: {
        name: editDraft.name?.trim(),
        requirement_type: requirementType,
        ...(isEducation
          ? { quantity: EDUCATION_QUANTITY, unit: EDUCATION_UNIT }
          : {
            quantity: editDraft.quantity ? Number(editDraft.quantity) : 0,
            unit: editDraft.unit,
          }),
        is_mandatory: editDraft.is_mandatory,
        description: editDraft.description,
        provided_by: req.provided_by,
        course_uuid: targetCourseUuid,
      } as UpdateRequirementVariables['body'],
      path: {
        courseUuid: targetCourseUuid,
        requirementUuid: req.uuid,
      },
    } as UpdateRequirementVariables;
    updateTrainingReqMut.mutate(variables, {
      onSuccess: () => {
        setExistingRequirements(prev =>
          prev.map(r => {
            if (r.uuid !== req.uuid) return r;
            return {
              ...r,
              ...editDraft,
              requirement_type: editDraft.requirement_type ?? r.requirement_type,
              quantity: isEducation ? EDUCATION_QUANTITY : Number(editDraft.quantity),
              unit: isEducation ? EDUCATION_UNIT : editDraft.unit,
            };
          })
        );
        qc.invalidateQueries({
          queryKey: getCourseTrainingRequirementsQueryKey({
            path: { courseUuid: targetCourseUuid as string },
            query: { pageable: {} },
          }),
        });
        toast.success('Requirement updated.');
        cancelEdit();
      },
      onError: () => toast.error('Failed to update requirement.'),
    });
  };

  const deleteReq = (req: RequirementRecord) => {
    if (!targetCourseUuid || !req.uuid || deleteTrainingReqMut.isPending) return;
    setDeletingId(req.uuid);
    const variables = {
      path: {
        courseUuid: targetCourseUuid,
        requirementUuid: req.uuid,
      },
    } as DeleteRequirementVariables;
    deleteTrainingReqMut.mutate(variables, {
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey: getCourseTrainingRequirementsQueryKey({
            path: { courseUuid: targetCourseUuid },
            query: { pageable: {} },
          }),
        });
        setExistingRequirements(prev => prev.filter(r => r.uuid !== req.uuid));
        setDeletingId(null);
        if (editingReqId === req.uuid) cancelEdit();
      },
      onError: () => setDeletingId(null),
    });
  };

  const draftGroups = useMemo(() => {
    if (!activeProvider) return [];
    const rows = draftsByProvider[activeProvider];
    if (activeProvider !== 'instructor') {
      return [{ id: activeProvider, label: '', education: false, rows }];
    }
    return [
      // {
      //   id: 'instructor-education',
      //   label: 'Instructor Educational Requirements',
      //   education: true,
      //   rows: rows.filter(row => row.requirement_type === 'education'),
      // },
      {
        id: 'instructor-other',
        label: '',
        education: false,
        rows: rows.filter(row => row.requirement_type !== 'education'),
      },
    ];
  }, [activeProvider, draftsByProvider]);

  const grouped = useMemo(
    () =>
      PROVIDERS.flatMap(provider => {
        const rows = existingRequirements.filter(row => row.provided_by === provider.value);
        if (provider.value !== 'instructor') return [{ ...provider, rows }];
        return [
          // {
          //   value: 'instructor-education',
          //   label: 'Instructor Educational Requirements',
          //   rows: rows.filter(row => row.requirement_type === 'education'),
          // },
          {
            value: 'instructor-other',
            label: '',
            rows: rows.filter(row => row.requirement_type !== 'education'),
          },
        ];
      }).filter(group => group.rows.length > 0),
    [existingRequirements]
  );

  return (
    <div className='space-y-6'>
      {/* ── Provider tabs ── */}
      <div>
        <p className='text-muted-foreground mb-3 text-sm'>Select a provider to add requirements:</p>
        <div className='flex flex-wrap gap-2'>
          {PROVIDERS.map(p => (
            <button
              key={p.value}
              type='button'
              disabled={!!savingProvider}
              onClick={() => setActiveProvider(prev => (prev === p.value ? null : p.value))}
              className={[
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                activeProvider === p.value
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted',
              ].join(' ')}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Draft entry table for active provider ── */}
      {activeProvider && (
        <div className='border-border animate-in fade-in-0 slide-in-from-top-2 rounded-lg border duration-200'>
          {/* Table header */}
          <div className='bg-muted/40 border-border flex items-center justify-between rounded-t-lg border-b px-4 py-3'>
            <span className='text-foreground text-sm font-semibold'>
              {PROVIDERS.find(p => p.value === activeProvider)?.label} — Requirements
            </span>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='h-7 w-7 p-0'
              disabled={!!savingProvider}
              onClick={() => setActiveProvider(null)}
            >
              <X className='h-4 w-4' />
            </Button>
          </div>

          {draftGroups.map(group => (
            <section key={group.id} className='border-border space-y-3 border-t py-4'>
              <div className='flex flex-wrap items-center justify-between gap-3 px-4'>
                {group.label && (
                  <h4 className='text-foreground text-base font-semibold'>{group.label}</h4>
                )}
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={!!savingProvider}
                  onClick={() => addDraftRow(activeProvider, group.education)}
                >
                  <Plus className='h-3.5 w-3.5' />
                  {group.education ? 'Add new educational requirement' : 'Add requirement'}
                </Button>
              </div>
              {group.rows.length === 0 ? (
                <EmptyState
                  variant='compact'
                  className='mx-4'
                  title={
                    group.education ? 'No new educational requirements' : 'No new requirements'
                  }
                  description={
                    group.education
                      ? 'Add the qualifications instructors need to teach this course.'
                      : undefined
                  }
                />
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead className='border-border border-b'>
                      <tr>
                        {[
                          'Requirement Name *',
                          'Type',
                          'Quantity',
                          'Unit',
                          'Mandatory',
                          'Description',
                          '',
                        ].map(h => (
                          <th
                            key={h}
                            className='text-muted-foreground px-3 py-2 text-left text-xs font-medium tracking-wide whitespace-nowrap'
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className='divide-border divide-y'>
                      {group.rows.map(row => (
                        <tr key={row.id} className='hover:bg-muted/20 transition-colors'>
                          {/* Name */}
                          <td className='px-3 py-2'>
                            <Textarea
                              disabled={!!savingProvider}
                              placeholder={
                                row.requirement_type === 'education'
                                  ? 'e.g., Bachelor of Education'
                                  : 'e.g., Piano room'
                              }
                              value={row.name}
                              onChange={e =>
                                updateDraftRow(activeProvider, row.id, { name: e.target.value })
                              }
                              className='h-8 min-w-[140px]'
                            />
                          </td>

                          {/* Type */}
                          <td className='px-3 py-2'>
                            <Select
                              disabled={!!savingProvider}
                              value={row.requirement_type}
                              onValueChange={v =>
                                updateDraftRow(activeProvider, row.id, { requirement_type: v })
                              }
                            >
                              <SelectTrigger className='h-8 min-w-[110px]'>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {requirementTypesForProvider(activeProvider).map(t => (
                                  <SelectItem key={t} value={t}>
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>

                          {/* Quantity */}
                          <td className='px-3 py-2'>
                            {row.requirement_type === 'education' ? (
                              <span className='text-muted-foreground'>{EDUCATION_QUANTITY}</span>
                            ) : (
                              <Input
                                disabled={!!savingProvider}
                                type='number'
                                min='0'
                                placeholder='0'
                                value={row.quantity}
                                onChange={e =>
                                  updateDraftRow(activeProvider, row.id, {
                                    quantity: e.target.value,
                                  })
                                }
                                className='h-8 w-20'
                              />
                            )}
                          </td>

                          {/* Unit */}
                          <td className='px-3 py-2'>
                            {row.requirement_type === 'education' ? (
                              <span className='text-muted-foreground'>{EDUCATION_UNIT}</span>
                            ) : (
                              <Select
                                disabled={!!savingProvider}
                                value={row.unit}
                                onValueChange={v =>
                                  updateDraftRow(activeProvider, row.id, { unit: v })
                                }
                              >
                                <SelectTrigger className='h-8 min-w-[100px]'>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {UNIT_OPTIONS.map(u => (
                                    <SelectItem key={u} value={u}>
                                      {u}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </td>

                          {/* Mandatory */}
                          <td className='px-3 py-2 text-center'>
                            <Checkbox
                              disabled={!!savingProvider}
                              checked={row.is_mandatory}
                              onCheckedChange={v =>
                                updateDraftRow(activeProvider, row.id, { is_mandatory: !!v })
                              }
                            />
                          </td>

                          {/* Description */}
                          <td className='px-3 py-2'>
                            <Textarea
                              disabled={!!savingProvider}
                              placeholder='Optional'
                              value={row.description}
                              onChange={e =>
                                updateDraftRow(activeProvider, row.id, {
                                  description: e.target.value,
                                })
                              }
                              className='h-8 min-w-[160px]'
                            />
                          </td>

                          {/* Remove row */}
                          <td className='px-3 py-2'>
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              className='h-7 w-7 p-0'
                              disabled={!!savingProvider}
                              onClick={() => removeDraftRow(activeProvider, row.id)}
                            >
                              <X className='text-muted-foreground h-3.5 w-3.5' />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}

          {/* Table footer */}
          <div className='border-border flex justify-end border-t px-4 py-3'>
            <div className='flex gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setActiveProvider(null)}
                disabled={!!savingProvider}
              >
                Cancel
              </Button>
              <Button
                type='button'
                size='sm'
                disabled={!!savingProvider}
                onClick={() => saveDraftsForProvider(activeProvider)}
              >
                {savingProvider === activeProvider ? (
                  <span className='flex items-center gap-2'>
                    <Spinner className='h-3.5 w-3.5' />
                    Saving…
                  </span>
                ) : (
                  <span className='flex items-center gap-2'>
                    <Save className='h-3.5 w-3.5' />
                    Save Requirements
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className='flex'>
        {grouped.length > 0 && (
          <div className='space-y-6'>
            {grouped.map(group => (
              <div key={group.value}>
                <h4 className='text-foreground mb-2 text-sm font-semibold'>{group.label}</h4>
                <div className='border-border overflow-hidden rounded-lg border'>
                  <table className='w-full text-sm'>
                    <thead className='bg-muted/60 border-border border-b'>
                      <tr>
                        {[
                          'Requirement Name',
                          'Type',
                          'Quantity',
                          'Unit',
                          'Mandatory',
                          'Description',
                          '',
                        ].map(h => (
                          <th
                            key={h}
                            className='text-muted-foreground px-3 py-2 text-left text-xs font-medium tracking-wide whitespace-nowrap'
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className='divide-border divide-y'>
                      {group.rows.map(req => {
                        const isEditing = editingReqId === req.uuid;
                        const isDeleting = deletingId === req.uuid;
                        const isSavingEdit = updateTrainingReqMut.isPending && isEditing;
                        const isEducation =
                          (isEditing ? editDraft.requirement_type : req.requirement_type) ===
                          'education';

                        return (
                          <tr
                            key={req.uuid}
                            className={
                              isEditing ? 'bg-muted/30' : 'hover:bg-muted/20 transition-colors'
                            }
                          >
                            {/* Name */}
                            <td className='px-3 py-2'>
                              {isEditing ? (
                                <Input
                                  value={editDraft.name ?? ''}
                                  onChange={e =>
                                    setEditDraft(p => ({ ...p, name: e.target.value }))
                                  }
                                  className='h-8 min-w-[120px]'
                                />
                              ) : (
                                <span className='text-foreground font-medium'>{req.name}</span>
                              )}
                            </td>

                            {/* Type */}
                            <td className='px-3 py-2'>
                              {isEditing ? (
                                <Select
                                  value={editDraft.requirement_type ?? requirementTypes[0]}
                                  onValueChange={v =>
                                    setEditDraft(p => ({ ...p, requirement_type: v }))
                                  }
                                >
                                  <SelectTrigger className='h-8 min-w-[110px]'>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {requirementTypesForProvider(req.provided_by).map(t => (
                                      <SelectItem key={t} value={t}>
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className='text-muted-foreground capitalize'>
                                  {req.requirement_type}
                                </span>
                              )}
                            </td>

                            {/* Quantity */}
                            <td className='px-3 py-2'>
                              {isEducation ? (
                                <span className='text-muted-foreground'>
                                  {isEditing
                                    ? EDUCATION_QUANTITY
                                    : (req.quantity ?? EDUCATION_QUANTITY)}
                                </span>
                              ) : isEditing ? (
                                <Input
                                  type='number'
                                  min='0'
                                  value={editDraft.quantity ?? ''}
                                  onChange={e =>
                                    setEditDraft(p => ({ ...p, quantity: e.target.value }))
                                  }
                                  className='h-8 w-20'
                                />
                              ) : (
                                <span className='text-muted-foreground'>{req.quantity || '—'}</span>
                              )}
                            </td>

                            {/* Unit */}
                            <td className='px-3 py-2'>
                              {isEducation ? (
                                <span className='text-muted-foreground'>
                                  {isEditing ? EDUCATION_UNIT : req.unit || EDUCATION_UNIT}
                                </span>
                              ) : isEditing ? (
                                <Select
                                  value={editDraft.unit ?? 'pieces'}
                                  onValueChange={v => setEditDraft(p => ({ ...p, unit: v }))}
                                >
                                  <SelectTrigger className='h-8 min-w-[100px]'>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {UNIT_OPTIONS.map(u => (
                                      <SelectItem key={u} value={u}>
                                        {u}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className='text-muted-foreground'>{req.unit || '—'}</span>
                              )}
                            </td>

                            {/* Mandatory */}
                            <td className='px-3 py-2 text-center'>
                              {isEditing ? (
                                <Checkbox
                                  checked={!!editDraft.is_mandatory}
                                  onCheckedChange={v =>
                                    setEditDraft(p => ({ ...p, is_mandatory: !!v }))
                                  }
                                />
                              ) : req.is_mandatory ? (
                                <CheckCircle2 className='text-primary mx-auto h-4 w-4' />
                              ) : (
                                <span className='text-muted-foreground'>False</span>
                              )}
                            </td>

                            {/* Description */}
                            <td className='max-w-[200px] px-3 py-2'>
                              {isEditing ? (
                                <Input
                                  value={editDraft.description ?? ''}
                                  onChange={e =>
                                    setEditDraft(p => ({ ...p, description: e.target.value }))
                                  }
                                  className='h-8'
                                  placeholder='Optional'
                                />
                              ) : (
                                <span className='text-muted-foreground line-clamp-2 text-xs'>
                                  {req.description || '—'}
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className='px-3 py-2'>
                              <div className='flex items-center gap-1'>
                                {isEditing ? (
                                  <>
                                    <Button
                                      type='button'
                                      size='sm'
                                      variant='ghost'
                                      className='h-7 w-7 p-0'
                                      disabled={isSavingEdit}
                                      onClick={() => saveEdit(req)}
                                    >
                                      {isSavingEdit ? (
                                        <Loader2 className='h-3.5 w-3.5 animate-spin' />
                                      ) : (
                                        <Save className='text-success h-3.5 w-3.5' />
                                      )}
                                    </Button>
                                    <Button
                                      type='button'
                                      size='sm'
                                      variant='ghost'
                                      className='h-7 w-7 p-0'
                                      onClick={cancelEdit}
                                    >
                                      <X className='text-muted-foreground h-3.5 w-3.5' />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      type='button'
                                      size='sm'
                                      variant='ghost'
                                      className='h-7 w-7 p-0'
                                      disabled={isDeleting}
                                      onClick={() => startEdit(req)}
                                    >
                                      <Pencil className='text-muted-foreground h-3.5 w-3.5' />
                                    </Button>
                                    <Button
                                      type='button'
                                      size='sm'
                                      variant='ghost'
                                      className='h-7 w-7 p-0'
                                      disabled={isDeleting}
                                      onClick={() => deleteReq(req)}
                                    >
                                      {isDeleting ? (
                                        <Loader2 className='h-3.5 w-3.5 animate-spin' />
                                      ) : (
                                        <Trash2 className='text-destructive h-3.5 w-3.5' />
                                      )}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='hidden'>
        {grouped.length > 0 && (
          <div className='border-border overflow-hidden rounded-lg border'>
            <table className='w-full text-sm'>
              <thead className='bg-muted/60 border-border border-b'>
                <tr>
                  {[
                    'Requirement Name',
                    'Type',
                    'Quantity',
                    'Unit',
                    'Mandatory',
                    'Description',
                    '',
                  ].map(h => (
                    <th
                      key={h}
                      className='text-muted-foreground px-3 py-2 text-left text-xs font-medium tracking-wide whitespace-nowrap'
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className='divide-border items-start divide-y'>
                {grouped.map(group => (
                  <Fragment key={group.value}>
                    {/* Group Label Row */}
                    <tr className='bg-muted/40'>
                      <td
                        colSpan={7}
                        className='text-foreground px-3 py-2 text-xs font-bold tracking-wide uppercase'
                      >
                        {group.label}
                      </td>
                    </tr>

                    {group.rows.map(req => {
                      const isEditing = editingReqId === req.uuid;
                      const isDeleting = deletingId === req.uuid;
                      const isSavingEdit = updateTrainingReqMut.isPending && isEditing;
                      const isEducation =
                        (isEditing ? editDraft.requirement_type : req.requirement_type) ===
                        'education';

                      return (
                        <tr
                          key={req.uuid}
                          className={
                            isEditing ? 'bg-muted/30' : 'hover:bg-muted/20 transition-colors'
                          }
                        >
                          {/* Name */}
                          <td className='px-3 py-2'>
                            {isEditing ? (
                              <Textarea
                                value={editDraft.name ?? ''}
                                onChange={e =>
                                  setEditDraft(p => ({
                                    ...p,
                                    name: e.target.value,
                                  }))
                                }
                                className='h-8 min-w-[120px]'
                              />
                            ) : (
                              <span className='text-foreground font-medium'>{req.name}</span>
                            )}
                          </td>

                          {/* Type */}
                          <td className='px-3 py-2'>
                            {isEditing ? (
                              <Select
                                value={editDraft.requirement_type ?? requirementTypes[0]}
                                onValueChange={v =>
                                  setEditDraft(p => ({
                                    ...p,
                                    requirement_type: v,
                                  }))
                                }
                              >
                                <SelectTrigger className='h-8 min-w-[110px]'>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {requirementTypesForProvider(req.provided_by).map(t => (
                                    <SelectItem key={t} value={t}>
                                      {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className='text-muted-foreground capitalize'>
                                {req.requirement_type}
                              </span>
                            )}
                          </td>

                          {/* Quantity */}
                          <td className='px-3 py-2'>
                            {isEducation ? (
                              <span className='text-muted-foreground'>
                                {isEditing
                                  ? EDUCATION_QUANTITY
                                  : (req.quantity ?? EDUCATION_QUANTITY)}
                              </span>
                            ) : isEditing ? (
                              <Input
                                type='number'
                                min='0'
                                value={editDraft.quantity ?? ''}
                                onChange={e =>
                                  setEditDraft(p => ({
                                    ...p,
                                    quantity: e.target.value,
                                  }))
                                }
                                className='h-8 w-20'
                              />
                            ) : (
                              <span className='text-muted-foreground'>{req.quantity || '—'}</span>
                            )}
                          </td>

                          {/* Unit */}
                          <td className='px-3 py-2'>
                            {isEducation ? (
                              <span className='text-muted-foreground'>
                                {isEditing ? EDUCATION_UNIT : req.unit || EDUCATION_UNIT}
                              </span>
                            ) : isEditing ? (
                              <Select
                                value={editDraft.unit ?? 'pieces'}
                                onValueChange={v => setEditDraft(p => ({ ...p, unit: v }))}
                              >
                                <SelectTrigger className='h-8 min-w-[100px]'>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {UNIT_OPTIONS.map(u => (
                                    <SelectItem key={u} value={u}>
                                      {u}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className='text-muted-foreground'>{req.unit || '—'}</span>
                            )}
                          </td>

                          {/* Mandatory */}
                          <td className='px-3 py-2 text-center'>
                            {isEditing ? (
                              <Checkbox
                                checked={!!editDraft.is_mandatory}
                                onCheckedChange={v =>
                                  setEditDraft(p => ({
                                    ...p,
                                    is_mandatory: !!v,
                                  }))
                                }
                              />
                            ) : req.is_mandatory ? (
                              <CheckCircle2 className='text-primary mx-auto h-4 w-4' />
                            ) : (
                              <span className='text-muted-foreground'>False</span>
                            )}
                          </td>

                          {/* Description */}
                          <td className='max-w-[200px] px-3 py-2'>
                            {isEditing ? (
                              <Textarea
                                value={editDraft.description ?? ''}
                                onChange={e =>
                                  setEditDraft(p => ({
                                    ...p,
                                    description: e.target.value,
                                  }))
                                }
                                className='h-8'
                                placeholder='Optional'
                              />
                            ) : (
                              <span className='text-muted-foreground line-clamp-2 text-xs'>
                                {req.description || '—'}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className='px-3 py-2'>
                            <div className='flex items-center gap-1'>
                              {isEditing ? (
                                <>
                                  <Button
                                    type='button'
                                    size='sm'
                                    variant='ghost'
                                    className='h-7 w-7 p-0'
                                    disabled={isSavingEdit}
                                    onClick={() => saveEdit(req)}
                                  >
                                    {isSavingEdit ? (
                                      <Loader2 className='h-3.5 w-3.5 animate-spin' />
                                    ) : (
                                      <Save className='text-success h-3.5 w-3.5' />
                                    )}
                                  </Button>

                                  <Button
                                    type='button'
                                    size='sm'
                                    variant='ghost'
                                    className='h-7 w-7 p-0'
                                    onClick={cancelEdit}
                                  >
                                    <X className='text-muted-foreground h-3.5 w-3.5' />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    type='button'
                                    size='sm'
                                    variant='ghost'
                                    className='h-7 w-7 p-0'
                                    disabled={isDeleting}
                                    onClick={() => startEdit(req)}
                                  >
                                    <Pencil className='text-muted-foreground h-3.5 w-3.5' />
                                  </Button>

                                  <Button
                                    type='button'
                                    size='sm'
                                    variant='ghost'
                                    className='h-7 w-7 p-0'
                                    disabled={isDeleting}
                                    onClick={() => deleteReq(req)}
                                  >
                                    {isDeleting ? (
                                      <Loader2 className='h-3.5 w-3.5 animate-spin' />
                                    ) : (
                                      <Trash2 className='text-destructive h-3.5 w-3.5' />
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
