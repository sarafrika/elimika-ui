'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { SectionCard, SectionCardSkeleton, StatusBadge, surfaceTheme } from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { OptionCombobox } from '@/components/search/entity-combobox';
import { SearchUnavailable } from '@/components/search/search-unavailable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSearchState, useSearchStatePatch } from '@/hooks/use-search-state';
import { isConflict, isSearchUnavailable } from '@/lib/api-errors';
import { stringParam } from '@/lib/search-state';
import type { Skill } from '@/services/client/types.gen';
import { ConfirmDialog } from '../components/confirm-dialog';
import { FilterBar } from '../components/filter-bar';
import { FormSheet } from '../components/form-sheet';
import { SectionBoundary } from '../components/section-boundary';
import {
  descendantsOf,
  parseAliases,
  SKILL_CONFLICT_MESSAGE,
  type SkillFormValues,
  useAllSkills,
  useDeleteSkill,
  useSaveSkill,
  useSkillList,
} from '../hooks/use-skills';

const searchParam = stringParam();
const activeParam = stringParam('any');

const emptyForm: SkillFormValues = {
  name: '',
  slug: '',
  parent_uuid: '',
  aliases: '',
  active: true,
};

const NO_PARENT = '__none__';

export function SkillsPage() {
  const [q] = useSearchState('q', searchParam);
  const [active] = useSearchState('active', activeParam);
  const patch = useSearchStatePatch();

  const all = useAllSkills();
  const list = useSkillList(q, active);
  const saveSkill = useSaveSkill();
  const deleteSkill = useDeleteSkill();

  const [editing, setEditing] = useState<{ skill?: Skill } | null>(null);
  const [form, setForm] = useState<SkillFormValues>(emptyForm);
  const [initialForm, setInitialForm] = useState<SkillFormValues>(emptyForm);
  const [conflict, setConflict] = useState(false);
  const [deleting, setDeleting] = useState<Skill | null>(null);

  const rows = list.filtered ? list.skills : all.skills;
  const rowsQuery = list.filtered ? list.query : all.query;
  const unavailable = isSearchUnavailable(rowsQuery.error);

  const openCreate = () => {
    setForm(emptyForm);
    setInitialForm(emptyForm);
    setConflict(false);
    setEditing({});
  };

  const openEdit = (skill: Skill) => {
    const values: SkillFormValues = {
      name: skill.name ?? '',
      slug: skill.slug ?? '',
      parent_uuid: skill.parent_uuid ?? '',
      aliases: (skill.aliases ?? []).join(', '),
      active: skill.active ?? true,
    };
    setForm(values);
    setInitialForm(values);
    setConflict(false);
    setEditing({ skill });
  };

  const parentOptions = useMemo(() => {
    const blocked = descendantsOf(editing?.skill?.uuid, all.skills);
    return [
      { value: NO_PARENT, label: 'No parent (top level)' },
      ...all.skills
        .filter(skill => skill.uuid && !blocked.has(skill.uuid))
        .map(skill => ({
          value: skill.uuid ?? '',
          label: skill.name ?? skill.slug ?? '',
          description: skill.active === false ? 'Retired' : skill.slug,
        })),
    ];
  }, [all.skills, editing?.skill?.uuid]);

  const nameError =
    form.name.trim().length === 0
      ? 'A skill needs a name.'
      : form.name.trim().length > 200
        ? 'Keep the name to 200 characters.'
        : undefined;
  const aliases = parseAliases(form.aliases);
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  const submit = () => {
    if (nameError) return;
    setConflict(false);
    saveSkill.mutate(
      { uuid: editing?.skill?.uuid, values: form },
      {
        onSuccess: () => setEditing(null),
        onError: error => {
          if (isConflict(error)) setConflict(true);
        },
      }
    );
  };

  return (
    <div className={`${surfaceTheme.pageWide} py-4`}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Platform'
          title='Skills'
          description='The skills taxonomy course owners tag courses and jobs with, and learners set goals from.'
          actions={
            <Button className='rounded-md' onClick={openCreate}>
              <Plus className='mr-2 size-4' />
              New skill
            </Button>
          }
        />

        <FilterBar
          values={{ q, active }}
          searchPlaceholder='Search names, slugs and aliases…'
          filters={[
            {
              key: 'active',
              label: 'Status',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Retired' },
              ],
            },
          ]}
        />

        <SectionCard
          title={list.filtered ? 'Matching skills' : 'All skills'}
          description={
            rowsQuery.isLoading
              ? undefined
              : `${rows.length} skill${rows.length === 1 ? '' : 's'}${list.filtered ? ' match' : ''}`
          }
        >
          {unavailable ? (
            <SearchUnavailable
              onClear={() => patch({ q: undefined })}
              onRetry={() => void rowsQuery.refetch()}
            />
          ) : (
            <SectionBoundary
              label='the skills'
              loading={rowsQuery.isLoading}
              error={rowsQuery.error}
              onRetry={rowsQuery.refetch}
              empty={!rowsQuery.isLoading && rows.length === 0}
              emptyTitle={list.filtered ? 'Nothing matches' : 'No skills yet'}
              emptyDescription={
                list.filtered
                  ? 'Try a different word, or clear the filters.'
                  : 'Add the first skill course owners can tag with.'
              }
              skeleton={<SectionCardSkeleton rows={6} withHeader={false} />}
            >
              <ul className='divide-border/60 divide-y' aria-label='Skills'>
                {rows.map(skill => {
                  const parent = skill.parent_uuid ? all.byUuid.get(skill.parent_uuid) : undefined;
                  return (
                    <li key={skill.uuid} className='flex items-start gap-3 px-3 py-3'>
                      <div className='min-w-0 flex-1 space-y-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='text-foreground text-sm font-medium'>{skill.name}</span>
                          <span className='text-muted-foreground font-mono text-xs'>{skill.slug}</span>
                          {skill.active === false ? (
                            <StatusBadge status='inactive' label='Retired' />
                          ) : null}
                        </div>
                        <p className='text-muted-foreground text-xs'>
                          {skill.parent_uuid
                            ? `Under ${parent?.name ?? 'a skill not in this list'}`
                            : 'Top level'}
                        </p>
                        {skill.aliases?.length ? (
                          <div className='flex flex-wrap gap-1'>
                            {skill.aliases.map(alias => (
                              <Badge key={alias} variant='secondary' className='font-normal'>
                                {alias}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className='flex shrink-0 gap-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-8'
                          onClick={() => openEdit(skill)}
                          aria-label={`Edit ${skill.name}`}
                        >
                          <Pencil className='size-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='text-destructive size-8'
                          onClick={() => setDeleting(skill)}
                          aria-label={`Delete ${skill.name}`}
                        >
                          <Trash2 className='size-4' />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </SectionBoundary>
          )}
        </SectionCard>
      </div>

      <FormSheet
        open={editing !== null}
        onOpenChange={open => {
          if (!open) setEditing(null);
        }}
        title={editing?.skill ? `Edit ${editing.skill.name}` : 'New skill'}
        description='Every field is replaced when you save.'
        isDirty={isDirty}
        isPending={saveSkill.isPending}
        submitLabel={editing?.skill ? 'Save skill' : 'Create skill'}
        onSubmit={submit}
      >
        {conflict ? (
          <p
            className='border-destructive/40 bg-destructive/5 text-destructive rounded-md border p-3 text-sm'
            role='alert'
          >
            {SKILL_CONFLICT_MESSAGE}
          </p>
        ) : null}

        <div className='space-y-1.5'>
          <Label htmlFor='skill-name' className='text-sm font-semibold'>
            Name <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='skill-name'
            value={form.name}
            maxLength={200}
            onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
            className='rounded-md'
            aria-invalid={Boolean(nameError)}
          />
          {nameError ? <p className='text-destructive text-xs'>{nameError}</p> : null}
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='skill-slug' className='text-sm font-semibold'>
            Slug
          </Label>
          <Input
            id='skill-slug'
            value={form.slug}
            onChange={event => {
              setConflict(false);
              setForm(current => ({ ...current, slug: event.target.value }));
            }}
            placeholder='Derived from the name when left empty'
            className='rounded-md font-mono'
            aria-invalid={conflict}
          />
          <p className='text-muted-foreground text-xs'>
            Lower-case words joined by hyphens; it is normalised on save.
          </p>
        </div>

        <div className='space-y-1.5'>
          <Label className='text-sm font-semibold'>Parent skill</Label>
          <OptionCombobox
            value={form.parent_uuid || NO_PARENT}
            onChange={value =>
              setForm(current => ({ ...current, parent_uuid: value === NO_PARENT ? '' : value }))
            }
            options={parentOptions}
            loading={all.query.isLoading}
            placeholder='No parent (top level)'
            searchPlaceholder='Filter skills…'
            aria-label='Parent skill'
          />
          <p className='text-muted-foreground text-xs'>
            A broader skill this one sits under. A skill cannot sit under itself or one of its own
            children.
          </p>
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='skill-aliases' className='text-sm font-semibold'>
            Aliases
          </Label>
          <Input
            id='skill-aliases'
            value={form.aliases}
            onChange={event => {
              setConflict(false);
              setForm(current => ({ ...current, aliases: event.target.value }));
            }}
            placeholder='e.g. JS, ECMAScript'
            className='rounded-md'
            aria-invalid={conflict}
            aria-describedby='skill-aliases-help'
          />
          <p id='skill-aliases-help' className='text-muted-foreground text-xs'>
            Separate with commas. Aliases resolve to this skill and act as search synonyms.
          </p>
          {aliases.length > 0 ? (
            <div className='flex flex-wrap gap-1' aria-label='Aliases to save'>
              {aliases.map(alias => (
                <Badge key={alias} variant='secondary' className='font-normal'>
                  {alias}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className='flex items-center justify-between gap-4'>
          <div>
            <Label htmlFor='skill-active' className='text-sm font-semibold'>
              Active
            </Label>
            <p className='text-muted-foreground text-xs'>
              Retired skills stay on existing tags but can no longer be picked.
            </p>
          </div>
          <Switch
            id='skill-active'
            checked={form.active}
            onCheckedChange={checked => setForm(current => ({ ...current, active: checked }))}
          />
        </div>
      </FormSheet>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={open => {
          if (!open) setDeleting(null);
        }}
        action='deleteSkill'
        subject={{ name: deleting?.name ?? '', confirmValue: deleting?.name ?? '' }}
        isPending={deleteSkill.isPending}
        onConfirm={() => {
          if (!deleting?.uuid) return;
          deleteSkill.mutate(
            { uuid: deleting.uuid, name: deleting.name ?? 'Skill' },
            { onSuccess: () => setDeleting(null) }
          );
        }}
      />
    </div>
  );
}
