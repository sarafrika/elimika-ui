'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Sparkles, Trash2 } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { SectionCard, SectionCardSkeleton } from '@/components/data-display';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Spinner from '@/components/ui/spinner';
import { isForbidden } from '@/lib/api-errors';
import { getErrorMessage } from '@/lib/error-utils';
import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import { skillDifficultyOptions } from '@/lib/skill-difficulty';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getMarketplaceJobRequiredSkillsOptions,
  getMarketplaceJobRequiredSkillsQueryKey,
  replaceMarketplaceJobRequiredSkillsMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassMarketplaceJobRequiredSkill } from '@/services/client/types.gen';
import { SkillPicker } from '@/src/features/skills/components/skill-picker';

function skillLevelLabel(
  level: ClassMarketplaceJobRequiredSkill['min_proficiency'],
  levels: ReturnType<typeof skillDifficultyOptions>
) {
  return levels.find(item => item.value === level)?.label ?? level ?? 'Unspecified';
}

type DraftSkill = {
  skill_uuid: string;
  name: string;
  min_proficiency: ClassMarketplaceJobRequiredSkill['min_proficiency'];
  is_mandatory: boolean;
};

function toDraft(skill: ClassMarketplaceJobRequiredSkill): DraftSkill | null {
  if (!skill.skill_uuid) return null;
  return {
    skill_uuid: skill.skill_uuid,
    name: skill.skill_name ?? skill.skill_slug ?? 'Skill',
    min_proficiency: skill.min_proficiency,
    is_mandatory: skill.is_mandatory ?? true,
  };
}

/**
 * "Required skills" on the organisation's job page: what an instructor should hold to
 * teach it. A job without its own tags inherits its course's skills; saving any skill here
 * replaces them for this job only. Used by job matching and the suggested instructors.
 */
export function JobRequiredSkillsSection({
  jobUuid,
  canEdit,
}: {
  jobUuid: string;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const difficulty = useDifficultyLevels();
  const levels = useMemo(
    () => skillDifficultyOptions(difficulty.difficultyLevels),
    [difficulty.difficultyLevels]
  );
  const query = useQuery({
    ...getMarketplaceJobRequiredSkillsOptions({ path: { jobUuid } }),
    enabled: Boolean(jobUuid),
    staleTime: STALE_TIMES.entity,
  });
  const responseError =
    query.data?.error || query.data?.success === false
      ? new Error(query.data.message || 'Could not load required skills')
      : null;
  const data = responseError ? undefined : query.data?.data;
  const skills = data?.skills ?? [];
  const inherited = Boolean(data?.inherited);

  if (isForbidden(query.error)) return null;

  return (
    <SectionCard
      title='Required skills'
      description={
        inherited
          ? 'Inherited from the course. Add skills here to set this job’s own requirements instead.'
          : 'What an instructor should bring. Used to rank matching jobs and suggest instructors.'
      }
      actions={
        canEdit && data ? (
          <Button variant='outline' size='sm' onClick={() => setEditing(true)}>
            <Pencil className='h-4 w-4' />
            Edit skills
          </Button>
        ) : null
      }
    >
      {query.isLoading ? (
        <SectionCardSkeleton rows={2} withHeader={false} />
      ) : query.error || responseError ? (
        <div className='flex flex-wrap items-center gap-3 text-sm' role='alert'>
          <span className='text-destructive'>
            {getErrorMessage(query.error ?? responseError, 'Couldn’t load the required skills.')}
          </span>
          <Button variant='ghost' size='sm' onClick={() => query.refetch()}>
            Try again
          </Button>
        </div>
      ) : skills.length === 0 ? (
        <EmptyState
          variant='plain'
          icon={Sparkles}
          title='No required skills'
          description='Neither this job nor its course lists any skills yet.'
        />
      ) : (
        <ul className='flex flex-wrap gap-2' aria-label='Required skills'>
          {skills.map(skill => (
            <li key={skill.skill_uuid}>
              <Badge variant='outline' className='gap-1.5 py-1 font-normal'>
                <span className='text-foreground font-medium'>{skill.skill_name}</span>
                <span className='text-muted-foreground'>
                  {skillLevelLabel(skill.min_proficiency, levels)}+
                </span>
                {skill.is_mandatory === false ? (
                  <span className='text-muted-foreground'>· nice to have</span>
                ) : null}
                {skill.inherited || inherited ? (
                  <Badge variant='secondary' className='ml-1 px-1.5 py-0 text-[10px]'>
                    Inherited from course
                  </Badge>
                ) : null}
                {skill.skill_active === false ? (
                  <span className='text-warning'>· retired</span>
                ) : null}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {editing && data ? (
        <RequiredSkillsSheet
          jobUuid={jobUuid}
          initial={inherited ? [] : skills}
          inheritedSkills={inherited ? skills : []}
          levels={levels}
          levelsLoading={difficulty.isLoading}
          levelsError={difficulty.error}
          onRetryLevels={() => void difficulty.refetch()}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </SectionCard>
  );
}

function RequiredSkillsSheet({
  jobUuid,
  initial,
  inheritedSkills,
  levels,
  levelsLoading,
  levelsError,
  onRetryLevels,
  onClose,
}: {
  jobUuid: string;
  initial: ClassMarketplaceJobRequiredSkill[];
  inheritedSkills: ClassMarketplaceJobRequiredSkill[];
  levels: ReturnType<typeof skillDifficultyOptions>;
  levelsLoading: boolean;
  levelsError: unknown;
  onRetryLevels: () => void;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const idPrefix = useId();
  const [draft, setDraft] = useState<DraftSkill[]>(() =>
    initial.map(toDraft).filter((item): item is DraftSkill => item !== null)
  );

  const save = useMutation({
    ...replaceMarketplaceJobRequiredSkillsMutation(),
    onSuccess: async response => {
      if (response.error || response.success === false) {
        toast.error(response.message || 'Unable to save the required skills.');
        return;
      }
      toast.success(
        draft.length ? 'Required skills saved.' : 'The job now uses its course’s skills.'
      );
      await queryClient.invalidateQueries({
        queryKey: getMarketplaceJobRequiredSkillsQueryKey({ path: { jobUuid } }),
      });
      onClose();
    },
    onError: error => toast.error(getErrorMessage(error, 'Unable to save the required skills.')),
  });

  const update = (uuid: string, patch: Partial<DraftSkill>) =>
    setDraft(items => items.map(item => (item.skill_uuid === uuid ? { ...item, ...patch } : item)));

  return (
    <Sheet open onOpenChange={open => !open && !save.isPending && onClose()}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-lg'>
        <SheetHeader>
          <SheetTitle>Required skills</SheetTitle>
          <SheetDescription>
            Set the skills an instructor needs for this job and the minimum level. Removing every
            skill falls back to the course’s skills.
          </SheetDescription>
        </SheetHeader>

        <div className='space-y-5 px-4 pb-4'>
          {inheritedSkills.length > 0 ? (
            <div className='bg-muted/40 space-y-2 rounded-md border p-3'>
              <p className='text-sm font-medium'>Currently inherited from the course</p>
              <ul className='flex flex-wrap gap-1.5'>
                {inheritedSkills.map(skill => (
                  <li key={skill.skill_uuid}>
                    <Badge variant='secondary' className='font-normal'>
                      {skill.skill_name} · {skillLevelLabel(skill.min_proficiency, levels)}+
                    </Badge>
                  </li>
                ))}
              </ul>
              <p className='text-muted-foreground text-xs'>
                Adding a skill below replaces these for this job.
              </p>
            </div>
          ) : null}

          <SkillPicker
            excludeUuids={draft.map(item => item.skill_uuid)}
            disabled={draft.length >= 20 || save.isPending || levelsLoading || levels.length === 0}
            onPick={skill =>
              setDraft(items => [
                ...items,
                {
                  skill_uuid: skill.uuid,
                  name: skill.name,
                  min_proficiency: levels[0]?.value,
                  is_mandatory: true,
                },
              ])
            }
          />
          {levelsLoading ? (
            <p className='text-muted-foreground flex items-center gap-2 text-sm' role='status'>
              <Spinner />
              Loading difficulty levels…
            </p>
          ) : levelsError ? (
            <EmptyState
              variant='compact'
              title='Could not load difficulty levels'
              action={
                <Button variant='outline' size='sm' onClick={onRetryLevels}>
                  Try again
                </Button>
              }
            />
          ) : levels.length === 0 ? (
            <p className='text-muted-foreground text-sm' role='status'>
              No difficulty levels supported by required skills are available.
            </p>
          ) : null}

          {draft.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              No skills of its own. The job will use its course’s skills.
            </p>
          ) : (
            <ul className='divide-y rounded-md border' aria-label='Skills for this job'>
              {draft.map(item => {
                const levelId = `${idPrefix}-${item.skill_uuid}-level`;
                const mandatoryId = `${idPrefix}-${item.skill_uuid}-mandatory`;
                return (
                  <li key={item.skill_uuid} className='space-y-2 p-3'>
                    <div className='flex items-center justify-between gap-2'>
                      <span className='text-sm font-medium'>{item.name}</span>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-8'
                        aria-label={`Remove ${item.name}`}
                        onClick={() =>
                          setDraft(items =>
                            items.filter(entry => entry.skill_uuid !== item.skill_uuid)
                          )
                        }
                        disabled={save.isPending}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                    <div className='flex flex-wrap items-center gap-4'>
                      <div className='flex items-center gap-2'>
                        <Label htmlFor={levelId} className='text-muted-foreground text-xs'>
                          Minimum level
                        </Label>
                        <Select
                          value={item.min_proficiency ?? ''}
                          disabled={save.isPending || levelsLoading || levels.length === 0}
                          onValueChange={value => {
                            const level = levels.find(option => option.value === value);
                            if (level) update(item.skill_uuid, { min_proficiency: level.value });
                          }}
                        >
                          <SelectTrigger id={levelId} size='sm' className='w-36'>
                            <SelectValue placeholder='Select level'>
                              {skillLevelLabel(item.min_proficiency, levels)}
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
                      </div>
                      <div className='flex items-center gap-2'>
                        <Checkbox
                          id={mandatoryId}
                          checked={item.is_mandatory}
                          disabled={save.isPending}
                          onCheckedChange={checked =>
                            update(item.skill_uuid, { is_mandatory: checked === true })
                          }
                        />
                        <Label htmlFor={mandatoryId} className='text-sm font-normal'>
                          Mandatory
                        </Label>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <SheetFooter className='flex-row justify-end gap-2'>
          <Button variant='outline' onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button
            disabled={save.isPending}
            onClick={() =>
              save.mutate({
                path: { jobUuid },
                body: {
                  skills: draft.map(item => ({
                    skill_uuid: item.skill_uuid,
                    min_proficiency: item.min_proficiency,
                    is_mandatory: item.is_mandatory,
                  })),
                },
              })
            }
          >
            {save.isPending ? <Spinner className='h-4 w-4' /> : null}
            Save skills
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
