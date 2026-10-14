'use client';

import type { Dispatch } from 'react';
import type { RequirementAnswer } from '@/app/dashboard/organisation/courses/apply/[courseId]/_components/apply-model';
import { AsyncSection } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CourseTrainingRequirement, ProgramRequirement } from '@/services/client';
import type { ApplyToTrainAction } from '../model';
import type { ApplyKind } from '../types';

/** Courses ask "do you have it?" per requirement; programmes list theirs to read. */
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
  return (
    <section className='bg-card space-y-4 rounded-2xl border p-5 shadow-sm'>
      <div>
        <h2 className='text-foreground font-semibold'>
          What this {kind === 'program' ? 'programme' : 'course'} needs
        </h2>
        <p className='text-muted-foreground mt-0.5 text-sm'>
          {kind === 'program'
            ? 'These are the requirements the programme creator published. Review them before you apply.'
            : `Tell ${creator} whether you already have each item. If not, say whether you’ll lease or hire it.`}
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
        {kind === 'program' ? (
          <ProgramList requirements={programRequirements} />
        ) : courseRequirements.length === 0 ? (
          <Empty text='This course lists no requirements. Nothing to answer here.' />
        ) : (
          <div className='space-y-3'>
            {courseRequirements.map(requirement => {
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

function ProgramList({ requirements }: { requirements: ProgramRequirement[] }) {
  if (requirements.length === 0)
    return <Empty text='This programme lists no requirements yet.' />;
  return (
    <ul className='space-y-2'>
      {requirements.map(requirement => (
        <li
          key={requirement.uuid ?? requirement.requirement_text}
          className='flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3'
        >
          <div>
            <p className='text-foreground font-medium'>{requirement.requirement_text}</p>
            <p className='text-muted-foreground text-sm'>
              {requirement.requirement_category ?? requirement.requirement_type}
            </p>
          </div>
          <Badge variant={requirement.is_mandatory ? 'destructive' : 'outline'}>
            {requirement.is_mandatory ? 'Mandatory' : 'Optional'}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

function AnswerBlock({
  requirement,
  answer,
  dispatch,
  showErrors,
}: {
  requirement: CourseTrainingRequirement;
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
            I have it
          </Choice>
          <Choice on={answer.has === 'no'} onClick={() => dispatch({ type: 'answerHas', uuid, has: 'no' })}>
            I don’t
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
    <button
      type='button'
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'h-9 rounded-full border px-3.5 text-sm font-medium transition-colors',
        on ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'
      )}
    >
      {children}
    </button>
  );
}
