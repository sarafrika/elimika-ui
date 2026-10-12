'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Target, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { isForbidden } from '@/lib/api-errors';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getLearnerSkillGoalsOptions,
  getLearnerSkillGoalsQueryKey,
  replaceLearnerSkillGoalsMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { LearnerSkillGoal } from '@/services/client/types.gen';
import { type PickedSkill, SkillPicker } from '@/src/features/skills/components/skill-picker';

/** The API accepts at most 20 goals. */
const MAX_SKILL_GOALS = 20;

type GoalChip = { uuid: string; name: string };

function toChips(goals: LearnerSkillGoal[] | undefined): GoalChip[] {
  return (goals ?? [])
    .filter((goal): goal is LearnerSkillGoal & { skill_uuid: string } => Boolean(goal.skill_uuid))
    .map(goal => ({ uuid: goal.skill_uuid, name: goal.name ?? goal.slug ?? 'Skill' }));
}

/**
 * The skills a learner wants to build (`GET/PUT /api/v1/students/{uuid}/skill-goals`).
 * They steer course recommendations. The learner edits; a guardian with a FULL or
 * ACADEMICS share reads (`readOnly`), and a 403 means the ward has not shared them.
 */
export function LearnerSkillGoalsCard({
  studentUuid,
  readOnly = false,
  title = 'Skill goals',
  description,
}: {
  studentUuid: string | null | undefined;
  readOnly?: boolean;
  title?: string;
  description?: string;
}) {
  const queryClient = useQueryClient();
  const options = { path: { uuid: studentUuid ?? '' } };
  const query = useQuery({
    ...getLearnerSkillGoalsOptions(options),
    enabled: Boolean(studentUuid),
    staleTime: STALE_TIMES.entity,
  });
  const [draft, setDraft] = useState<GoalChip[] | null>(null);
  const save = useMutation({
    ...replaceLearnerSkillGoalsMutation(),
    onSuccess: response => {
      queryClient.setQueryData(getLearnerSkillGoalsQueryKey(options), response);
      setDraft(null);
      toast.success('Skill goals saved');
    },
    onError: error => toast.error(getErrorMessage(error, 'Could not save your skill goals.')),
  });

  const saved = toChips(query.data?.data);
  const goals = draft ?? saved;
  const dirty = draft !== null;
  const full = goals.length >= MAX_SKILL_GOALS;

  const add = (skill: PickedSkill) => {
    if (goals.some(goal => goal.uuid === skill.uuid) || full) return;
    setDraft([...goals, { uuid: skill.uuid, name: skill.name }]);
  };
  const remove = (uuid: string) => setDraft(goals.filter(goal => goal.uuid !== uuid));

  let body: ReactNode;
  if (!studentUuid || query.isLoading) {
    body = (
      <div className='flex flex-wrap gap-2' aria-busy='true'>
        {[0, 1, 2].map(key => (
          <Skeleton key={key} className='h-7 w-24 rounded-full' />
        ))}
      </div>
    );
  } else if (isForbidden(query.error)) {
    body = (
      <EmptyState
        variant='compact'
        icon={Lock}
        title='Not shared'
        description={
          readOnly
            ? 'This learner has not shared their academic goals with you.'
            : 'You cannot view these skill goals.'
        }
      />
    );
  } else if (query.isError) {
    body = (
      <EmptyState
        variant='compact'
        title='Could not load skill goals'
        action={
          <Button size='sm' variant='outline' onClick={() => void query.refetch()}>
            Try again
          </Button>
        }
      />
    );
  } else {
    body = (
      <div className='space-y-4'>
        {goals.length === 0 ? (
          <EmptyState
            variant='compact'
            icon={Target}
            title='No skill goals yet'
            description={
              readOnly
                ? 'This learner has not set any skill goals.'
                : 'Add the skills you want to build and we will suggest courses for them.'
            }
          />
        ) : (
          <ul className='flex flex-wrap gap-2' aria-label='Skill goals'>
            {goals.map(goal => (
              <li key={goal.uuid}>
                <Badge variant='secondary' className='gap-1 py-1 pr-1 pl-2.5 text-sm font-normal'>
                  {goal.name}
                  {readOnly ? null : (
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='size-5 rounded-full'
                      onClick={() => remove(goal.uuid)}
                      disabled={save.isPending}
                      aria-label={`Remove ${goal.name}`}
                    >
                      <X className='size-3' />
                    </Button>
                  )}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        {readOnly ? null : (
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
            <div className='sm:max-w-xs sm:flex-1'>
              <SkillPicker
                onPick={add}
                excludeUuids={goals.map(goal => goal.uuid)}
                disabled={full || save.isPending}
                placeholder={full ? `Up to ${MAX_SKILL_GOALS} goals` : 'Add a skill goal…'}
                aria-label='Add a skill goal'
              />
            </div>
            <div className='flex gap-2'>
              <Button
                type='button'
                onClick={() =>
                  save.mutate({
                    path: { uuid: studentUuid ?? '' },
                    body: { skill_uuids: goals.map(goal => goal.uuid) },
                  })
                }
                disabled={!dirty || save.isPending}
              >
                {save.isPending ? <Spinner /> : null}
                Save goals
              </Button>
              {dirty ? (
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => setDraft(null)}
                  disabled={save.isPending}
                >
                  Discard
                </Button>
              ) : null}
            </div>
          </div>
        )}
        {!readOnly ? (
          <p className='text-muted-foreground text-xs'>
            {goals.length} of {MAX_SKILL_GOALS} goals
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Target className='text-primary size-4' aria-hidden />
          {title}
        </CardTitle>
        <CardDescription>
          {description ??
            (readOnly
              ? 'Skills this learner wants to build.'
              : 'Skills you want to build. They shape the courses we recommend.')}
        </CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
