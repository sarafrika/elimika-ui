'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tags, Trash2 } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { isForbidden, retryUnlessClientOrSearchError } from '@/lib/api-errors';
import { getErrorMessage } from '@/lib/error-utils';
import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import { skillDifficultyOptions } from '@/lib/skill-difficulty';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getCourseSkillsOptions,
  getCourseSkillsQueryKey,
  replaceCourseSkillsMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { CourseSkill } from '@/services/client/types.gen';
import { SkillPicker } from '@/src/features/skills/components/skill-picker';

const WEIGHTS = [
  { value: 1, label: '1 · Touches on it' },
  { value: 2, label: '2' },
  { value: 3, label: '3 · A main theme' },
  { value: 4, label: '4' },
  { value: 5, label: '5 · The core skill' },
] as const;

type SkillRow = {
  skillUuid: string;
  name: string;
  level: CourseSkill['level'];
  weight: number;
  active: boolean;
};

function toRows(items: readonly CourseSkill[] | undefined): SkillRow[] {
  return (items ?? [])
    .filter((item): item is CourseSkill & { skill_uuid: string } => Boolean(item.skill_uuid))
    .map(item => ({
      skillUuid: item.skill_uuid,
      name: item.skill_name ?? item.skill_slug ?? 'Skill',
      level: item.level,
      weight: item.weight ?? 1,
      active: item.skill_active !== false,
    }));
}

/**
 * Owner-only skill tags for a course (`GET/PUT /api/v1/courses/{uuid}/skills`). Optional:
 * tags never gate publishing and apply to the live course straight away (they describe
 * the course for matching and recommendations, not its content). The PUT replaces the
 * whole list. A skill an admin has since retired keeps its tag, marked "Retired", until
 * the owner removes it.
 */
export function CourseSkillsEditor({ courseUuid }: { courseUuid: string }) {
  if (!courseUuid) return null;
  return <SavedCourseSkillsEditor key={courseUuid} courseUuid={courseUuid} />;
}

function SavedCourseSkillsEditor({ courseUuid }: { courseUuid: string }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<SkillRow[] | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const difficulty = useDifficultyLevels();
  const levels = useMemo(
    () => skillDifficultyOptions(difficulty.difficultyLevels),
    [difficulty.difficultyLevels]
  );

  const query = useQuery({
    ...getCourseSkillsOptions({ path: { uuid: courseUuid } }),
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.entity,
    retry: retryUnlessClientOrSearchError,
  });
  const mutation = useMutation(replaceCourseSkillsMutation());

  const responseError =
    query.data?.error || query.data?.success === false
      ? new Error(query.data.message || 'Could not load the course skills')
      : null;
  const current = rows ?? toRows(responseError ? undefined : query.data?.data);
  const dirty = rows !== null;

  const update = (next: SkillRow[]) => {
    setRows(next);
    setSaveError(null);
  };
  const patch = (skillUuid: string, change: Partial<SkillRow>) =>
    update(current.map(row => (row.skillUuid === skillUuid ? { ...row, ...change } : row)));

  const save = () => {
    setSaveError(null);
    mutation.mutate(
      {
        path: { uuid: courseUuid },
        body: {
          skills: current.map(row => ({
            skill_uuid: row.skillUuid,
            level: row.level,
            weight: row.weight,
          })),
        },
      },
      {
        onSuccess: response => {
          if (response.error || response.success === false) {
            const message = response.message || 'Could not save the course skills.';
            setSaveError(message);
            toast.error(message);
            return;
          }
          queryClient.setQueryData(
            getCourseSkillsQueryKey({ path: { uuid: courseUuid } }),
            response
          );
          setRows(null);
          toast.success('Course skills saved');
        },
        onError: error => {
          const message = getErrorMessage(error, 'Could not save the course skills.');
          setSaveError(message);
          toast.error(message);
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <Tags className='text-primary size-5' aria-hidden />
          Skills
        </CardTitle>
        <CardDescription>
          Optional. Tag the skills this course teaches so it reaches the right learners and
          instructors. Saved changes apply straight away and are not reviewed.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {query.isLoading || difficulty.isLoading ? (
          <div className='space-y-2' aria-busy='true'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
        ) : query.isError || responseError || difficulty.error ? (
          <EmptyState
            variant='compact'
            title={
              isForbidden(query.error)
                ? 'Only the course owner can manage skills'
                : difficulty.error
                  ? 'Could not load difficulty levels'
                  : 'Could not load the course skills'
            }
            description={getErrorMessage(
              query.error ?? responseError ?? difficulty.error,
              'Try again in a moment.'
            )}
            action={
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  if (difficulty.error) void difficulty.refetch();
                  else void query.refetch();
                }}
              >
                Try again
              </Button>
            }
          />
        ) : (
          <>
            {current.length === 0 ? (
              <EmptyState
                variant='compact'
                title='No skills tagged'
                description='Add the skills a learner gains from this course.'
              />
            ) : (
              <ul className='divide-border divide-y rounded-lg border'>
                {current.map(row => (
                  <SkillRowItem
                    key={row.skillUuid}
                    row={row}
                    levels={levels}
                    disabled={mutation.isPending}
                    onLevel={level => patch(row.skillUuid, { level })}
                    onWeight={weight => patch(row.skillUuid, { weight })}
                    onRemove={() =>
                      update(current.filter(item => item.skillUuid !== row.skillUuid))
                    }
                  />
                ))}
              </ul>
            )}

            <div className='space-y-1.5'>
              <Label>Add a skill</Label>
              <SkillPicker
                disabled={mutation.isPending || levels.length === 0}
                excludeUuids={current.map(row => row.skillUuid)}
                onPick={skill =>
                  update([
                    ...current,
                    {
                      skillUuid: skill.uuid,
                      name: skill.name,
                      level: levels[0]?.value,
                      weight: 1,
                      active: true,
                    },
                  ])
                }
              />
              {levels.length === 0 && (
                <p className='text-muted-foreground text-sm' role='status'>
                  No difficulty levels supported by course skills are available.
                </p>
              )}
            </div>

            {saveError ? (
              <p className='text-destructive text-sm' role='alert'>
                {saveError}
              </p>
            ) : null}

            <div className='flex flex-wrap justify-end gap-2'>
              {dirty ? (
                <Button
                  variant='ghost'
                  onClick={() => {
                    setRows(null);
                    setSaveError(null);
                  }}
                  disabled={mutation.isPending}
                >
                  Discard changes
                </Button>
              ) : null}
              <Button onClick={save} disabled={!dirty || mutation.isPending}>
                {mutation.isPending ? <Spinner /> : null}
                Save skills
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SkillRowItem({
  row,
  levels,
  disabled,
  onLevel,
  onWeight,
  onRemove,
}: {
  row: SkillRow;
  levels: ReturnType<typeof skillDifficultyOptions>;
  disabled: boolean;
  onLevel: (level: CourseSkill['level']) => void;
  onWeight: (weight: number) => void;
  onRemove: () => void;
}) {
  const levelId = useId();
  const weightId = useId();
  return (
    <li className='flex flex-wrap items-center gap-3 px-3 py-2.5'>
      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <span className='truncate text-sm font-medium'>{row.name}</span>
        {row.active ? null : (
          <Badge variant='outlineWarning' title='An admin has retired this skill'>
            Retired
          </Badge>
        )}
      </div>
      <div className='flex items-center gap-2'>
        <Label htmlFor={levelId} className='sr-only'>
          Level taught for {row.name}
        </Label>
        <Select
          value={row.level ?? ''}
          disabled={disabled || levels.length === 0}
          onValueChange={value => {
            const level = levels.find(option => option.value === value);
            if (level) onLevel(level.value);
          }}
        >
          <SelectTrigger id={levelId} className='h-8 w-36'>
            <SelectValue placeholder='Select level'>
              {levels.find(level => level.value === row.level)?.label ?? row.level}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {levels.map(level => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Label htmlFor={weightId} className='sr-only'>
          How central {row.name} is to the course
        </Label>
        <Select
          value={String(row.weight)}
          disabled={disabled}
          onValueChange={value => onWeight(Number(value))}
        >
          <SelectTrigger id={weightId} className='h-8 w-40'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WEIGHTS.map(weight => (
              <SelectItem key={weight.value} value={String(weight.value)}>
                Weight {weight.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        variant='ghost'
        size='icon'
        className='size-8'
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${row.name}`}
      >
        <Trash2 className='size-4' />
      </Button>
    </li>
  );
}
