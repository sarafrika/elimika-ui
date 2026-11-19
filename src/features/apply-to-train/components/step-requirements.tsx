'use client';

import type { RequirementAnswer } from '@/app/dashboard/organisation/courses/apply/[courseId]/_components/apply-model';
import { AsyncSection } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { CourseTrainingRequirement, ProgramRequirement } from '@/services/client';
import { type Dispatch, useMemo } from 'react';
import { type ApplyToTrainAction, type RequirementPrompt, instructorRequirementPrompts } from '../model';
import type { ApplyKind } from '../types';

/** Courses and programmes share the same Yes/No and acquisition choices. */
export function StepRequirements({
  kind,
  creator,
  answers,
  dispatch,
  courseRequirements,
  programRequirements,
  loading,
  error,
  onRetry,
  showErrors,
}: {
  kind: ApplyKind;
  creator: string;
  answers: RequirementAnswer[];
  dispatch: Dispatch<ApplyToTrainAction>;
  courseRequirements: CourseTrainingRequirement[];
  programRequirements: ProgramRequirement[];
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  showErrors: boolean;
}) {
  const prompts = useMemo(
    () => instructorRequirementPrompts(kind, courseRequirements, programRequirements),
    [kind, courseRequirements, programRequirements]
  );
  return (
    <section className='bg-card space-y-4 rounded-2xl border p-5 shadow-sm'>
      <div>
        <h2 className='text-foreground font-semibold'>
          What this {kind === 'program' ? 'programme' : 'course'} needs
        </h2>
        <p className='text-muted-foreground mt-0.5 text-sm'>
          Tell {creator} whether you already have each item. If not, say whether you’ll lease or hire it.
        </p>
      </div>
      <AsyncSection
        loading={loading}
        error={error}
        onRetry={onRetry}
        errorTitle='Couldn’t load the requirements'
        skeleton={
          <div className='space-y-3'>
            <Skeleton className='h-20 w-full' />
            <Skeleton className='h-20 w-full' />
          </div>
        }
      >
        {prompts.length === 0 ? (
          <Empty
            text={`This ${kind === 'program' ? 'programme' : 'course'} has no requirements assigned to you. Nothing to answer here.`}
          />
        ) : (
          <div className='space-y-3'>
            {prompts.map(requirement => {
              const answer = answers.find(row => row.requirementUuid === requirement.uuid);
              if (!answer) return null;
              return (
                <AnswerBlock
                  key={answer.requirementUuid}
                  requirement={requirement}
                  answer={answer}
                  dispatch={dispatch}
                  showErrors={showErrors}
                />
              );
            })}
          </div>
        )}
      </AsyncSection>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className='bg-muted/40 text-muted-foreground rounded-xl p-5 text-sm'>{text}</p>;
}

function AnswerBlock({
  requirement,
  answer,
  dispatch,
  showErrors,
}: {
  requirement: RequirementPrompt;
  answer: RequirementAnswer;
  dispatch: Dispatch<ApplyToTrainAction>;
  showErrors: boolean;
}) {
  const uuid = answer.requirementUuid;
  const error =
    answer.has === null
      ? 'Answer this requirement.'
      : answer.has === 'no' && !answer.acquisition
        ? 'Choose leasing or hiring.'
        : null;

  return (
    <div className='space-y-2.5 rounded-xl border px-4 py-3.5'>
      <div className='flex flex-wrap items-center justify-between gap-2.5'>
        <div className='min-w-0'>
          <p className='text-foreground font-medium'>{requirement.name}</p>
          {requirement.description ? (
            <p className='text-muted-foreground text-sm'>{requirement.description}</p>
          ) : null}
        </div>
        <div role='group' aria-label={`Do you have ${requirement.name}?`} className='flex gap-1.5'>
          <Choice on={answer.has === 'yes'} onClick={() => dispatch({ type: 'answerHas', uuid, has: 'yes' })}>
            Yes
          </Choice>
          <Choice on={answer.has === 'no'} onClick={() => dispatch({ type: 'answerHas', uuid, has: 'no' })}>
            No
          </Choice>
        </div>
      </div>
      {answer.has === 'no' ? (
        <div role='group' aria-label='How you’ll get it' className='flex flex-wrap items-center gap-1.5'>
          <span className='text-muted-foreground mr-1 text-sm'>I’ll get it by</span>
          <Choice
            on={answer.acquisition === 'lease'}
            onClick={() => dispatch({ type: 'answerAcquisition', uuid, acquisition: 'lease' })}
          >
            Leasing
          </Choice>
          <Choice
            on={answer.acquisition === 'hire'}
            onClick={() => dispatch({ type: 'answerAcquisition', uuid, acquisition: 'hire' })}
          >
            Hiring
          </Choice>
        </div>
      ) : null}
      {showErrors && error ? (
        <p className='bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm'>{error}</p>
      ) : null}
    </div>
  );
}

function Choice({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type='button'
      variant={on ? 'default' : 'outline'}
      aria-pressed={on}
      onClick={onClick}
      className='h-9 rounded-full px-3.5 text-sm font-medium'
    >
      {children}
    </Button>
  );
}
