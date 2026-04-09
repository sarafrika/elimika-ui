'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCourseTrainingRequirementsQueryKey } from '@/services/client/@tanstack/react-query.gen';
import { CheckCircle2, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { type Dispatch, Fragment, type SetStateAction, useState } from 'react';
import { toast } from 'sonner';
import { Textarea } from '../../../../components/ui/textarea';
import { requirementTypes } from './course-creation-types';

export type Provider = 'course_creator' | 'instructor' | 'organisation' | 'student';

const PROVIDERS: { value: Provider; label: string }[] = [
  { value: 'instructor', label: 'Instructor' },
  { value: 'organisation', label: 'Organisation' },
  { value: 'student', label: 'Student' },
];

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
  existingRequirements: any[];
  setExistingRequirements: Dispatch<SetStateAction<any[]>>;
  editingCourseId?: string;
  courseId?: string;
  draftsByProvider: DraftsByProvider;
  setDraftsByProvider: Dispatch<SetStateAction<DraftsByProvider>>;
  activeProvider: Provider | null;
  setActiveProvider: Dispatch<SetStateAction<Provider | null>>;
  addTrainingReqMut: any;
  updateTrainingReqMut: any;
  deleteTrainingReqMut: any;
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
  qc: any;
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

  const addDraftRow = (provider: Provider) => {
    setDraftsByProvider(prev => ({
      ...prev,
      [provider]: [...prev[provider], emptyDraft()],
    }));
  };

  const removeDraftRow = (provider: Provider, id: string) => {
    setDraftsByProvider(prev => ({
      ...prev,
      [provider]: prev[provider].filter(r => r.id !== id),
    }));
  };

  const saveDraftsForProvider = async (provider: Provider) => {
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
      const results = await Promise.allSettled(
        drafts.map(
          draft =>
            new Promise<any>((resolve, reject) => {
              addTrainingReqMut.mutate(
                {
                  body: {
                    name: draft.name.trim(),
                    requirement_type: draft.requirement_type,
                    quantity: draft.quantity ? Number(draft.quantity) : 0,
                    unit: draft.unit,
                    is_mandatory: draft.is_mandatory,
                    description: draft.description,
                    provided_by: provider,
                    course_uuid: targetCourseUuid,
                  } as any,
                  path: { courseUuid: targetCourseUuid },
                },
                {
                  onSuccess: (res: any) => resolve(res),
                  onError: (err: any) => reject(err),
                }
              );
            })
        )
      );

      const succeeded = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value?.data)
        .filter(Boolean);

      if (succeeded.length > 0) {
        setExistingRequirements(prev => [...prev, ...succeeded]);
        qc.invalidateQueries({
          queryKey: getCourseTrainingRequirementsQueryKey({
            path: { courseUuid: targetCourseUuid },
            query: { pageable: {} },
          }),
        });
        // Reset only the provider that was successfully persisted.
        setDraftsByProvider(prev => ({
          ...prev,
          [provider]: [emptyDraft()],
        }));
        toast.success(
          `${succeeded.length} requirement${succeeded.length > 1 ? 's' : ''} saved for ${PROVIDERS.find(p => p.value === provider)?.label}.`
        );
        setActiveProvider(null);
      }

      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) toast.error(`${failed} requirement(s) failed to save.`);
    } finally {
      setSavingProvider(null);
    }
  };

  const startEdit = (req: any) => {
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

  const saveEdit = (req: any) => {
    if (!editDraft.name?.trim()) {
      toast.error('Requirement name is required.');
      return;
    }
    updateTrainingReqMut.mutate(
      {
        body: {
          name: editDraft.name?.trim(),
          requirement_type: editDraft.requirement_type,
          quantity: editDraft.quantity ? Number(editDraft.quantity) : 0,
          unit: editDraft.unit,
          is_mandatory: editDraft.is_mandatory,
          description: editDraft.description,
          provided_by: req.provided_by,
          course_uuid: targetCourseUuid,
        } as any,
        path: {
          courseUuid: targetCourseUuid,
          requirementUuid: req.uuid,
        },
      },
      {
        onSuccess: () => {
          setExistingRequirements(prev =>
            prev.map(r =>
              r.uuid === req.uuid ? { ...r, ...editDraft, quantity: Number(editDraft.quantity) } : r
            )
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
      }
    );
  };

  const deleteReq = (req: any) => {
    setDeletingId(req.uuid);
    deleteTrainingReqMut.mutate(
      {
        path: {
          courseUuid: editingCourseId,
          requirementUuid: req.uuid,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({
            queryKey: getCourseTrainingRequirementsQueryKey({
              path: { courseUuid: editingCourseId as string },
              query: { pageable: {} },
            }),
          });
          setExistingRequirements(prev => prev.filter(r => r.uuid !== req.uuid));
          setDeletingId(null);
          if (editingReqId === req.uuid) cancelEdit();
        },
        onError: () => setDeletingId(null),
      }
    );
  };

  const grouped = PROVIDERS.map(p => ({
    ...p,
    rows: existingRequirements.filter(r => r.provided_by === p.value),
  })).filter(g => g.rows.length > 0);

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
              onClick={() => setActiveProvider(null)}
            >
              <X className='h-4 w-4' />
            </Button>
          </div>

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
                {draftsByProvider[activeProvider].map((row, idx) => (
                  <tr key={row.id} className='hover:bg-muted/20 transition-colors'>
                    {/* Name */}
                    <td className='px-3 py-2'>
                      <Textarea
                        placeholder='e.g., Piano room'
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
                        value={row.requirement_type}
                        onValueChange={v =>
                          updateDraftRow(activeProvider, row.id, { requirement_type: v })
                        }
                      >
                        <SelectTrigger className='h-8 min-w-[110px]'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {requirementTypes.map(t => (
                            <SelectItem key={t} value={t}>
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Quantity */}
                    <td className='px-3 py-2'>
                      <Input
                        type='number'
                        min='0'
                        placeholder='0'
                        value={row.quantity}
                        onChange={e =>
                          updateDraftRow(activeProvider, row.id, { quantity: e.target.value })
                        }
                        className='h-8 w-20'
                      />
                    </td>

                    {/* Unit */}
                    <td className='px-3 py-2'>
                      <Select
                        value={row.unit}
                        onValueChange={v => updateDraftRow(activeProvider, row.id, { unit: v })}
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
                    </td>

                    {/* Mandatory */}
                    <td className='px-3 py-2 text-center'>
                      <Checkbox
                        checked={row.is_mandatory}
                        onCheckedChange={v =>
                          updateDraftRow(activeProvider, row.id, { is_mandatory: !!v })
                        }
                      />
                    </td>

                    {/* Description */}
                    <td className='px-3 py-2'>
                      <Textarea
                        placeholder='Optional'
                        value={row.description}
                        onChange={e =>
                          updateDraftRow(activeProvider, row.id, { description: e.target.value })
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
                        disabled={draftsByProvider[activeProvider].length === 1}
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

          {/* Table footer */}
          <div className='border-border flex items-center justify-between border-t px-4 py-3'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => addDraftRow(activeProvider)}
              className='flex items-center gap-1 text-sm'
            >
              <Plus className='h-3.5 w-3.5' />
              Add row
            </Button>

            <div className='flex gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setActiveProvider(null)}
                disabled={savingProvider === activeProvider}
              >
                Cancel
              </Button>
              <Button
                type='button'
                size='sm'
                disabled={savingProvider === activeProvider}
                onClick={() => saveDraftsForProvider(activeProvider)}
              >
                {savingProvider === activeProvider ? (
                  <span className='flex items-center gap-2'>
                    <Loader2 className='h-3.5 w-3.5 animate-spin' />
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
                                    {requirementTypes.map(t => (
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
                              {isEditing ? (
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
                              {isEditing ? (
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
                                        <Save className='h-3.5 w-3.5 text-green-600' />
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
                                  {requirementTypes.map(t => (
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
                            {isEditing ? (
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
                            {isEditing ? (
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
                                      <Save className='h-3.5 w-3.5 text-green-600' />
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
