'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tags, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
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
import { STALE_TIMES } from '@/lib/query-client';
import {
  getCourseSkillsOptions,
  getCourseSkillsQueryKey,
  replaceCourseSkillsMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { type CourseSkill, LevelEnum } from '@/services/client/types.gen';
import { SkillPicker } from '@/src/features/skills/components/skill-picker';

const LEVELS: ReadonlyArray<{ value: LevelEnum; label: string }> = [
  { value: LevelEnum.BEGINNER, label: 'Beginner' },
  { value: LevelEnum.INTERMEDIATE, label: 'Intermediate' },
  { value: LevelEnum.ADVANCED, label: 'Advanced' },
  { value: LevelEnum.EXPERT, label: 'Expert' },
];

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
  level: LevelEnum;
  weight: number;
  active: boolean;
};

function toLevel(value: string | undefined): LevelEnum {
  const normalised = value?.toLowerCase();
  return LEVELS.find(level => level.value === normalised)?.value ?? LevelEnum.BEGINNER;
}

function toRows(items: readonly CourseSkill[] | undefined): SkillRow[] {
  return (items ?? [])
    .filter((item): item is CourseSkill & { skill_uuid: string } => Boolean(item.skill_uuid))
    .map(item => ({
      skillUuid: item.skill_uuid,
      name: item.skill_name ?? item.skill_slug ?? 'Skill',
      level: toLevel(item.level),
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
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<SkillRow[] | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const query = useQuery({
    ...getCourseSkillsOptions({ path: { uuid: courseUuid } }),
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.entity,
    retry: retryUnlessClientOrSearchError,
  });
  const mutation = useMutation(replaceCourseSkillsMutation());

  const current = rows ?? toRows(query.data?.data);
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
          queryClient.setQueryData(getCourseSkillsQueryKey({ path: { uuid: courseUuid } }), response);
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
        {query.isLoading ? (
          <div className='space-y-2' aria-busy='true'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
        ) : query.isError ? (
          <EmptyState
            variant='compact'
            title={
              isForbidden(query.error)
                ? 'Only the course owner can manage skills'
                : 'Could not load the course skills'
            }
            description={getErrorMessage(query.error, 'Try again in a moment.')}
            action={
              <Button variant='outline' size='sm' onClick={() => void query.refetch()}>
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
                excludeUuids={current.map(row => row.skillUuid)}
                onPick={skill =>
                  update([
                    ...current,
                    {
                      skillUuid: skill.uuid,
                      name: skill.name,
                      level: LevelEnum.BEGINNER,
                      weight: 1,
                      active: true,
                    },
                  ])
                }
              />
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
  onLevel,
  onWeight,
  onRemove,
}: {
  row: SkillRow;
  onLevel: (level: LevelEnum) => void;
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
        <Select value={row.level} onValueChange={value => onLevel(toLevel(value))}>
          <SelectTrigger id={levelId} className='h-8 w-36'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEVELS.map(level => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Label htmlFor={weightId} className='sr-only'>
          How central {row.name} is to the course
        </Label>
        <Select value={String(row.weight)} onValueChange={value => onWeight(Number(value))}>
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
        aria-label={`Remove ${row.name}`}
      >
        <Trash2 className='size-4' />
      </Button>
    </li>
  );
}
