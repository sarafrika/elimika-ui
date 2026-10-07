'use client';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import Spinner from '@/components/ui/spinner';
import type { RequirementTypeEnum } from '@/services/client/types.gen';
import { CheckCircle2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import {
  type RequirementEntry,
  TrainingRequirementFields,
} from '../../../_components/training-requirement-fields';
import { programRequirementText, requirementEntry } from '../program-requirements';
import type { ProgramFormValues } from '../program-schema';

type Requirement = ProgramFormValues['requirements'][number];
type DraftRow = RequirementEntry & { id: string };

const PROVIDERS: { value: RequirementTypeEnum; label: string }[] = [
  { value: 'INSTRUCTOR', label: 'Instructor' },
  { value: 'TRAINING_CENTER', label: 'Organisation' },
  { value: 'STUDENT', label: 'Student' },
];
const HEADERS = ['Requirement Name', 'Type', 'Quantity', 'Unit', 'Mandatory', 'Description', ''];

function emptyDraft(): DraftRow {
  return {
    id: crypto.randomUUID(),
    name: '',
    requirement_type: 'material',
    quantity: '',
    unit: 'pieces',
    description: '',
    is_mandatory: false,
  };
}

function validateEntry(entry: RequirementEntry) {
  if (!entry.name.trim()) {
    toast.error('Requirement name is required.');
    return false;
  }
  if (
    entry.quantity !== '' &&
    (!Number.isFinite(Number(entry.quantity)) || Number(entry.quantity) < 0)
  ) {
    toast.error('Quantity must be zero or greater.');
    return false;
  }
  return true;
}

function RequirementTableHeader() {
  return (
    <thead className='bg-muted/40 border-border border-b'>
      <tr>
        {HEADERS.map(title => (
          <th
            key={title}
            className='text-muted-foreground px-3 py-2 text-left text-xs font-medium whitespace-nowrap'
          >
            {title}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function ProgramRequirements({
  programUuid,
  onSave,
}: {
  programUuid?: string;
  onSave: (requirements: ProgramFormValues['requirements']) => Promise<boolean>;
}) {
  const { control, getValues, setValue } = useFormContext<ProgramFormValues>();
  const rows = useWatch({ control, name: 'requirements' });
  const [activeProvider, setActiveProvider] = useState<RequirementTypeEnum | null>(null);
  const [drafts, setDrafts] = useState<Record<RequirementTypeEnum, DraftRow[]>>({
    INSTRUCTOR: [],
    TRAINING_CENTER: [],
    STUDENT: [],
  });
  const [editing, setEditing] = useState<{ uuid: string; resource: RequirementEntry } | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const busy = pending !== null;
  const groups = useMemo(
    () =>
      PROVIDERS.map(provider => ({
        ...provider,
        rows: rows.filter(row => row.uuid && row.requirementType === provider.value),
      })).filter(group => group.rows.length > 0),
    [rows]
  );

  const selectProvider = (provider: RequirementTypeEnum) => {
    setActiveProvider(current => (current === provider ? null : provider));
    if (!drafts[provider].length) {
      const draft = emptyDraft();
      setDrafts(current => ({ ...current, [provider]: [draft] }));
    }
  };
  const updateDraft = (
    provider: RequirementTypeEnum,
    id: string,
    patch: Partial<RequirementEntry>
  ) => {
    setDrafts(current => ({
      ...current,
      [provider]: current[provider].map(row => (row.id === id ? { ...row, ...patch } : row)),
    }));
  };
  const requireProgram = () => {
    if (programUuid) return true;
    toast.error('Save the program before managing its requirements.');
    return false;
  };
  const saveDrafts = async (provider: RequirementTypeEnum) => {
    if (busy || !requireProgram()) return;
    const ready = drafts[provider].filter(row => row.name.trim());
    if (!ready.length) {
      toast.error('Add at least one requirement with a name.');
      return;
    }
    if (!ready.every(validateEntry)) return;
    const existing = getValues('requirements');
    const additions = ready.map(resource => ({
      requirementType: provider,
      requirementText: programRequirementText(resource),
      isMandatory: resource.is_mandatory,
      resource,
    }));
    setPending(`create:${provider}`);
    try {
      await onSave([...existing, ...additions]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save requirements.');
    } finally {
      // Keep confirmed additions visible and retain only failed drafts for retry.
      const current = getValues('requirements');
      const saved = new Set(
        ready.flatMap((draft, index) => (current[existing.length + index]?.uuid ? [draft.id] : []))
      );
      setValue(
        'requirements',
        current.filter((row, index) => index < existing.length || row.uuid),
        { shouldDirty: true }
      );
      setDrafts(previous => ({
        ...previous,
        [provider]: previous[provider].filter(row => !saved.has(row.id)),
      }));
      if (saved.size)
        toast.success(`${saved.size} requirement${saved.size === 1 ? '' : 's'} saved.`);
      if (saved.size === ready.length) setActiveProvider(null);
      setPending(null);
    }
  };
  const saveEdit = async () => {
    if (!editing || busy || !requireProgram() || !validateEntry(editing.resource)) return;
    const previous = getValues('requirements');
    const resource = editing.resource;
    const updated = previous.map(row =>
      row.uuid === editing.uuid
        ? {
            ...row,
            resource,
            requirementText: programRequirementText(resource),
            isMandatory: resource.is_mandatory,
          }
        : row
    );
    setPending(`update:${editing.uuid}`);
    try {
      if (!(await onSave(updated))) {
        setValue('requirements', previous, { shouldDirty: true });
        return;
      }
      setEditing(null);
      toast.success('Requirement updated.');
    } catch (error) {
      setValue('requirements', previous, { shouldDirty: true });
      toast.error(error instanceof Error ? error.message : 'Unable to update requirement.');
    } finally {
      setPending(null);
    }
  };
  const deleteRequirement = async (row: Requirement) => {
    if (!row.uuid || busy || !requireProgram()) return;
    const previous = getValues('requirements');
    setPending(`delete:${row.uuid}`);
    try {
      if (!(await onSave(previous.filter(item => item.uuid !== row.uuid)))) {
        setValue('requirements', previous, { shouldDirty: true });
        return;
      }
      toast.success('Requirement removed.');
    } catch (error) {
      setValue('requirements', previous, { shouldDirty: true });
      toast.error(error instanceof Error ? error.message : 'Unable to remove requirement.');
    } finally {
      setPending(null);
    }
  };

  return (
    <section className='space-y-6' aria-label='Program requirements'>
      <div className='space-y-3'>
        <h3 className='text-sm font-medium'>Requirements</h3>
        <p className='text-muted-foreground text-sm'>
          {programUuid
            ? 'Select a provider to add requirements:'
            : 'Save program set-up first, then add requirements.'}
        </p>
        <div className='flex flex-wrap gap-2'>
          {PROVIDERS.map(provider => (
            <Button
              key={provider.value}
              type='button'
              variant={activeProvider === provider.value ? 'default' : 'outline'}
              className='rounded-full'
              aria-pressed={activeProvider === provider.value}
              disabled={!programUuid || busy || Boolean(editing)}
              onClick={() => selectProvider(provider.value)}
            >
              {provider.label}
            </Button>
          ))}
        </div>
      </div>
      {activeProvider && (
        <div className='border-border overflow-hidden rounded-lg border'>
          <div className='bg-muted/40 border-border flex items-center justify-between border-b px-4 py-3'>
            <h4 className='text-sm font-semibold'>
              {PROVIDERS.find(provider => provider.value === activeProvider)?.label} — Requirements
            </h4>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={busy}
              onClick={() => {
                const draft = emptyDraft();
                setDrafts(current => ({
                  ...current,
                  [activeProvider]: [...current[activeProvider], draft],
                }));
              }}
            >
              <Plus /> Add requirement
            </Button>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <RequirementTableHeader />
              <tbody className='divide-border divide-y'>
                {drafts[activeProvider].map((draft, index) => (
                  <tr key={draft.id}>
                    <TrainingRequirementFields
                      value={draft}
                      instructor={activeProvider === 'INSTRUCTOR'}
                      disabled={busy}
                      label={`New requirement ${index + 1}`}
                      onChange={patch => updateDraft(activeProvider, draft.id, patch)}
                    />
                    <td className='px-3 py-2'>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        aria-label={`Remove new requirement ${index + 1}`}
                        disabled={busy}
                        onClick={() =>
                          setDrafts(current => ({
                            ...current,
                            [activeProvider]: current[activeProvider].filter(
                              row => row.id !== draft.id
                            ),
                          }))
                        }
                      >
                        <X />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className='border-border flex justify-end gap-2 border-t px-4 py-3'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={busy}
              onClick={() => setActiveProvider(null)}
            >
              Cancel
            </Button>
            <Button
              type='button'
              size='sm'
              disabled={busy}
              onClick={() => void saveDrafts(activeProvider)}
            >
              {pending === `create:${activeProvider}` ? <Spinner /> : <Save />}
              {pending === `create:${activeProvider}` ? 'Saving…' : 'Save Requirements'}
            </Button>
          </div>
        </div>
      )}
      {groups.map(group => (
        <div key={group.value} className='space-y-2'>
          <h4 className='text-sm font-semibold'>{group.label} — Saved requirements</h4>
          <div className='border-border overflow-x-auto rounded-lg border'>
            <table className='w-full text-sm'>
              <RequirementTableHeader />
              <tbody className='divide-border divide-y'>
                {group.rows.map(row => {
                  const entry = requirementEntry(row);
                  const isEditing = editing?.uuid === row.uuid;
                  return (
                    <tr key={row.uuid} className={isEditing ? 'bg-muted/30' : 'hover:bg-muted/20'}>
                      {isEditing && editing ? (
                        <TrainingRequirementFields
                          value={editing.resource}
                          instructor={row.requirementType === 'INSTRUCTOR'}
                          disabled={busy}
                          label={`Edit ${entry.name}`}
                          onChange={patch =>
                            setEditing(current =>
                              current
                                ? { ...current, resource: { ...current.resource, ...patch } }
                                : null
                            )
                          }
                        />
                      ) : (
                        <>
                          <td className='px-3 py-2 font-medium'>{entry.name}</td>
                          <td className='text-muted-foreground px-3 py-2 capitalize'>
                            {entry.requirement_type}
                          </td>
                          <td className='text-muted-foreground px-3 py-2'>
                            {entry.quantity || '0'}
                          </td>
                          <td className='text-muted-foreground px-3 py-2'>{entry.unit || '—'}</td>
                          <td className='px-3 py-2'>
                            {entry.is_mandatory ? (
                              <>
                                <CheckCircle2 className='text-primary h-4 w-4' />
                                <span className='sr-only'>Mandatory</span>
                              </>
                            ) : (
                              'No'
                            )}
                          </td>
                          <td className='text-muted-foreground max-w-[240px] px-3 py-2 whitespace-pre-wrap'>
                            {entry.description || '—'}
                          </td>
                        </>
                      )}
                      <td className='px-3 py-2'>
                        <div className='flex items-center gap-1'>
                          {isEditing ? (
                            <>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                aria-label={`Save ${entry.name}`}
                                disabled={busy}
                                onClick={() => void saveEdit()}
                              >
                                {pending === `update:${row.uuid}` ? (
                                  <Spinner />
                                ) : (
                                  <Save className='text-success' />
                                )}
                              </Button>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                aria-label={`Cancel editing ${entry.name}`}
                                disabled={busy}
                                onClick={() => setEditing(null)}
                              >
                                <X />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                aria-label={`Edit ${entry.name}`}
                                disabled={busy || Boolean(editing)}
                                onClick={() => {
                                  if (!row.uuid) return;
                                  setActiveProvider(null);
                                  setEditing({ uuid: row.uuid, resource: { ...entry } });
                                }}
                              >
                                <Pencil />
                              </Button>
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                aria-label={`Delete ${entry.name}`}
                                disabled={busy || Boolean(editing)}
                                onClick={() => void deleteRequirement(row)}
                              >
                                {pending === `delete:${row.uuid}` ? (
                                  <Spinner />
                                ) : (
                                  <Trash2 className='text-destructive' />
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
      {!groups.length && !activeProvider && (
        <EmptyState
          variant='compact'
          title='No requirements yet'
          description='Select a provider to add materials, equipment, facilities, or other resources.'
        />
      )}
    </section>
  );
}
