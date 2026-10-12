'use client';

import { Bookmark, BookmarkPlus, Plus, Trash2 } from 'lucide-react';
import { Fragment, useId, useState } from 'react';

import { SectionError } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ErrorList } from '../components/error-list';
import { ageRangeLabel } from '../types';
import {
  type AgeGroupDraft,
  type AgeScope,
  createGroup,
  formatHours,
  type GroupValidation,
  groupFromSaved,
  HOUR_PRESETS,
  hoursFor,
  MAX_AGE_GROUPS,
  MAX_GROUP_NAME,
  type PlanLesson,
  totalHours,
  validHours,
} from './model';
import { SavedAgeGroupsSheet } from './saved-age-groups-sheet';
import { useSaveMyAgeGroup } from './use-saved-age-groups';

/** Series colours for groups, from the chart tokens so every dashboard theme holds. */
export const GROUP_COLOURS = [
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5',
] as const;
export const groupColour = (index: number) => GROUP_COLOURS[index % GROUP_COLOURS.length]!;

type StepAgeGroupsProps = {
  groups: AgeGroupDraft[];
  onChange: (groups: AgeGroupDraft[]) => void;
  lessons: PlanLesson[];
  lessonsLoading: boolean;
  lessonsError: unknown;
  onRetryLessons: () => void;
  scope: AgeScope;
  validation: GroupValidation;
  showErrors: boolean;
  itemNoun: string;
};

/** Split learners into age groups, each with its own hours per lesson. */
export function StepAgeGroups({
  groups,
  onChange,
  lessons,
  lessonsLoading,
  lessonsError,
  onRetryLessons,
  scope,
  validation,
  showErrors,
  itemNoun,
}: StepAgeGroupsProps) {
  const [openId, setOpenId] = useState<string | null>(groups[0]?.id ?? null);
  const [savedOpen, setSavedOpen] = useState(false);
  const { save, saving } = useSaveMyAgeGroup();
  const activeId = groups.some(group => group.id === openId) ? openId : (groups[0]?.id ?? null);
  const full = groups.length >= MAX_AGE_GROUPS;

  const update = (id: string, patch: Partial<AgeGroupDraft>) =>
    onChange(groups.map(group => (group.id === id ? { ...group, ...patch } : group)));
  const remove = (id: string) => onChange(groups.filter(group => group.id !== id));
  const add = () => {
    const group = createGroup();
    onChange([...groups, group]);
    setOpenId(group.id);
  };
  const pickSaved = (saved: Parameters<typeof groupFromSaved>[0]) => {
    if (full) return;
    const group = groupFromSaved(saved);
    onChange([...groups, group]);
    setOpenId(group.id);
    setSavedOpen(false);
  };

  return (
    <div className='space-y-4'>
      <AgeCoverage
        groups={groups}
        scope={scope}
        validation={validation}
        showErrors={showErrors}
        itemNoun={itemNoun}
      />

      {lessonsError ? (
        <SectionError
          title='Couldn’t load the lessons'
          error={lessonsError}
          onRetry={onRetryLessons}
        />
      ) : null}

      {showErrors && validation.general.length > 0 ? (
        <ErrorList messages={validation.general} />
      ) : null}

      {groups.map((group, index) => {
        const errors = showErrors ? (validation.byGroup[group.id] ?? []) : [];
        const previous = index > 0 ? groups[index - 1] : undefined;
        return activeId === group.id ? (
          <GroupEditor
            key={group.id}
            group={group}
            index={index}
            previous={previous}
            lessons={lessons}
            lessonsLoading={lessonsLoading}
            errors={errors}
            showErrors={showErrors}
            onUpdate={patch => update(group.id, patch)}
            onRemove={() => remove(group.id)}
            onSave={saved => save(saved)}
            saving={saving}
          />
        ) : (
          <GroupSummary
            key={group.id}
            group={group}
            index={index}
            lessons={lessons}
            errors={errors}
            onEdit={() => setOpenId(group.id)}
          />
        );
      })}

      <div className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]'>
        <Button
          type='button'
          variant='outline'
          className='border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 h-11 border-dashed'
          onClick={add}
          disabled={full}
        >
          <Plus aria-hidden />
          {full ? `Up to ${MAX_AGE_GROUPS} age groups` : 'Add age group'}
        </Button>
        <Button
          type='button'
          variant='outline'
          className='h-11'
          onClick={() => setSavedOpen(true)}
          disabled={full}
        >
          <Bookmark aria-hidden />
          Add from saved
        </Button>
      </div>

      <SavedAgeGroupsSheet
        open={savedOpen}
        onOpenChange={setSavedOpen}
        scope={scope}
        itemNoun={itemNoun}
        usedNames={groups.map(group => group.name)}
        onPick={pickSaved}
      />
    </div>
  );
}

function AgeCoverage({
  groups,
  scope,
  validation,
  showErrors,
  itemNoun,
}: {
  groups: AgeGroupDraft[];
  scope: AgeScope;
  validation: GroupValidation;
  showErrors: boolean;
  itemNoun: string;
}) {
  const ages = groups.flatMap(group => [Number(group.minAge), Number(group.maxAge)]).filter(
    value => Number.isFinite(value) && value > 0
  );
  const low = scope.min ?? Math.min(0, ...ages);
  const high = scope.max ?? Math.max(low + 18, ...ages);
  const span = Math.max(1, high - low + 1);

  return (
    <section className='bg-card space-y-3 rounded-2xl border p-5 shadow-sm'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <h2 className='text-foreground font-semibold'>Age coverage</h2>
        <p className='text-muted-foreground text-sm'>
          This {itemNoun} is for ages{' '}
          <strong className='text-foreground'>{ageRangeLabel(scope.min, scope.max)}</strong>
        </p>
      </div>
      <div className='bg-muted relative h-[18px] overflow-hidden rounded-full' aria-hidden>
        {groups.map((group, index) => {
          const min = Number(group.minAge);
          const max = Number(group.maxAge);
          if (!group.minAge || !group.maxAge || !Number.isFinite(min) || !Number.isFinite(max) || min > max)
            return null;
          const left = Math.max(0, ((min - low) / span) * 100);
          const right = Math.min(100, ((max - low + 1) / span) * 100);
          if (right <= left) return null;
          const bad = showErrors && Boolean(validation.byGroup[group.id]);
          return (
            <div
              key={group.id}
              className={cn(
                'absolute top-0 bottom-0 rounded-sm',
                bad ? 'bg-destructive/40' : groupColour(index)
              )}
              style={{ left: `${left}%`, width: `calc(${right - left}% - 2px)` }}
            />
          );
        })}
      </div>
      <div className='text-muted-foreground flex justify-between font-mono text-xs'>
        <span>{scope.min ?? low}</span>
        <span>{scope.max ?? `${high}+`}</span>
      </div>
      <ul className='flex flex-wrap gap-x-4 gap-y-1 text-sm'>
        {groups.map((group, index) => (
          <li
            key={group.id}
            className={cn(
              'inline-flex items-center gap-1.5',
              showErrors && validation.byGroup[group.id] && 'text-destructive font-semibold'
            )}
          >
            <span aria-hidden className={cn('size-2.5 rounded-[3px]', groupColour(index))} />
            {group.name.trim() || 'Untitled group'} {rangeText(group)}
          </li>
        ))}
      </ul>
    </section>
  );
}

const rangeText = (group: AgeGroupDraft) =>
  group.minAge && group.maxAge ? `ages ${group.minAge}–${group.maxAge}` : 'ages not set';

function GroupEditor({
  group,
  index,
  previous,
  lessons,
  lessonsLoading,
  errors,
  showErrors,
  onUpdate,
  onRemove,
  onSave,
  saving,
}: {
  group: AgeGroupDraft;
  index: number;
  previous?: AgeGroupDraft;
  lessons: PlanLesson[];
  lessonsLoading: boolean;
  errors: string[];
  showErrors: boolean;
  onUpdate: (patch: Partial<AgeGroupDraft>) => void;
  onRemove: () => void;
  onSave: (group: { name: string; min_age: number; max_age: number }) => void;
  saving: boolean;
}) {
  const id = useId();
  const savable =
    group.name.trim().length > 0 &&
    /^\d{1,3}$/.test(group.minAge) &&
    /^\d{1,3}$/.test(group.maxAge) &&
    Number(group.minAge) <= Number(group.maxAge) &&
    Number(group.maxAge) <= 120;
  const setAll = (value: string) =>
    onUpdate({ hours: Object.fromEntries(lessons.map(lesson => [lesson.uuid, value])), seed: undefined });
  const copyPrevious = () => {
    if (!previous) return;
    onUpdate({
      hours: Object.fromEntries(lessons.map(lesson => [lesson.uuid, hoursFor(previous, lesson.uuid)])),
      seed: undefined,
    });
  };
  const setHours = (lessonUuid: string, value: string) =>
    onUpdate({ hours: { ...group.hours, [lessonUuid]: value.replace(/[^0-9.]/g, '') } });

  return (
    <section
      className={cn(
        'bg-card overflow-hidden rounded-2xl border shadow-sm',
        errors.length > 0 && 'border-destructive/50'
      )}
    >
      <div className='bg-muted/30 flex flex-wrap items-end gap-3 border-b px-5 py-4'>
        <span aria-hidden className={cn('h-11 w-3 shrink-0 rounded', groupColour(index))} />
        <div className='min-w-48 flex-1 space-y-1.5'>
          <Label htmlFor={`${id}-name`}>Group name</Label>
          <Input
            id={`${id}-name`}
            value={group.name}
            maxLength={MAX_GROUP_NAME}
            placeholder='e.g. Juniors'
            onChange={event => onUpdate({ name: event.target.value })}
          />
        </div>
        <div className='w-24 space-y-1.5'>
          <Label htmlFor={`${id}-min`}>Min age</Label>
          <Input
            id={`${id}-min`}
            inputMode='numeric'
            value={group.minAge}
            onChange={event => onUpdate({ minAge: event.target.value.replace(/\D/g, '') })}
          />
        </div>
        <div className='w-24 space-y-1.5'>
          <Label htmlFor={`${id}-max`}>Max age</Label>
          <Input
            id={`${id}-max`}
            inputMode='numeric'
            value={group.maxAge}
            onChange={event => onUpdate({ maxAge: event.target.value.replace(/\D/g, '') })}
          />
        </div>
        <Button
          type='button'
          variant='outline'
          size='icon'
          className='size-9'
          aria-label={`Remove ${group.name.trim() || 'this group'}`}
          onClick={onRemove}
        >
          <Trash2 aria-hidden className='text-muted-foreground' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='text-primary basis-full justify-start px-0 sm:basis-auto'
          disabled={!savable || saving}
          onClick={() =>
            onSave({
              name: group.name.trim(),
              min_age: Number(group.minAge),
              max_age: Number(group.maxAge),
            })
          }
        >
          <BookmarkPlus aria-hidden />
          Save to my age groups
        </Button>
      </div>

      <div className='flex flex-wrap items-center justify-between gap-2 px-5 pt-4 pb-1'>
        <h3 className='text-foreground text-sm font-semibold'>Lesson plan · hours per lesson</h3>
        <div className='flex flex-wrap items-center gap-1.5'>
          <span className='text-muted-foreground text-xs'>Set all to</span>
          {HOUR_PRESETS.map(value => (
            <Button
              key={value}
              type='button'
              variant='outline'
              size='sm'
              className='h-8 rounded-full'
              onClick={() => setAll(value)}
              disabled={lessons.length === 0}
            >
              {value} h
            </Button>
          ))}
          {previous ? (
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='h-8 rounded-full'
              onClick={copyPrevious}
              disabled={lessons.length === 0}
            >
              Copy from {previous.name.trim() || 'previous group'}
            </Button>
          ) : null}
        </div>
      </div>

      <div className='px-5'>
        {lessonsLoading ? (
          <div className='space-y-2 py-3'>
            {[0, 1, 2].map(row => (
              <Skeleton key={row} className='h-10 w-full' />
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <p className='text-muted-foreground py-4 text-sm'>No active lessons to plan yet.</p>
        ) : (
          <ul>
            {lessons.map((lesson, position) => {
              const value = hoursFor(group, lesson.uuid);
              const startsCourse =
                lesson.courseTitle && lessons[position - 1]?.courseUuid !== lesson.courseUuid;
              return (
                <Fragment key={lesson.uuid}>
                  {startsCourse ? (
                    <li className='text-primary pt-3 pb-1 text-xs font-semibold tracking-wide uppercase'>
                      {lesson.courseTitle}
                    </li>
                  ) : null}
                  <li className='flex items-center gap-3 border-b py-2.5 last:border-b-0'>
                    <span className='bg-muted flex size-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs'>
                      {lesson.number}
                    </span>
                    <span className='text-foreground min-w-0 flex-1 text-sm'>{lesson.title}</span>
                    <label className='text-muted-foreground flex items-center gap-2 text-sm'>
                      <span className='sr-only'>Hours for lesson {lesson.number}</span>
                      <Input
                        inputMode='decimal'
                        className={cn(
                          'w-20 text-right',
                          showErrors && !validHours(value) && 'border-destructive'
                        )}
                        value={value}
                        onChange={event => setHours(lesson.uuid, event.target.value)}
                      />
                      hours
                    </label>
                  </li>
                </Fragment>
              );
            })}
          </ul>
        )}
      </div>

      <div className='space-y-2 px-5 pt-3 pb-4'>
        <div className='flex justify-between gap-3 text-sm'>
          <span className='text-muted-foreground'>{lessons.length} lessons</span>
          <span className='text-foreground font-semibold'>
            {formatHours(totalHours(group, lessons))} in total
          </span>
        </div>
        {errors.length > 0 ? <ErrorList messages={errors} /> : null}
      </div>
    </section>
  );
}

function GroupSummary({
  group,
  index,
  lessons,
  errors,
  onEdit,
}: {
  group: AgeGroupDraft;
  index: number;
  lessons: PlanLesson[];
  errors: string[];
  onEdit: () => void;
}) {
  return (
    <section
      className={cn(
        'bg-card space-y-2 rounded-2xl border px-5 py-4 shadow-sm',
        errors.length > 0 && 'border-destructive/50'
      )}
    >
      <div className='flex flex-wrap items-center gap-3'>
        <span aria-hidden className={cn('size-3 rounded', groupColour(index))} />
        <div className='min-w-0 flex-1'>
          <p className='text-foreground font-semibold'>
            {group.name.trim() || 'Untitled group'}{' '}
            <span className='text-muted-foreground font-medium'>· {rangeText(group)}</span>
          </p>
          <p className='text-muted-foreground text-sm'>
            {lessons.length} lessons · {formatHours(totalHours(group, lessons))} in total
          </p>
        </div>
        <Button type='button' variant='outline' onClick={onEdit}>
          Edit
        </Button>
      </div>
      {errors.length > 0 ? <ErrorList messages={errors} /> : null}
    </section>
  );
}
