'use client';

import type { Dispatch } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { CourseTrainingRequirement, ProgramRequirement } from '@/services/client';

import type {
  ApplyAction,
  ApplyState,
  RequirementAnswer,
  TrainingContentKind,
} from './apply-model';

/** Courses ask "do you have it?" per requirement; programs list theirs to read. */
export function StepRequirements({
  state,
  dispatch,
  contentKind,
  requirements,
  programRequirements,
  loading,
  error,
  onRetry,
}: {
  state: ApplyState;
  dispatch: Dispatch<ApplyAction>;
  contentKind: TrainingContentKind;
  requirements: CourseTrainingRequirement[];
  programRequirements: ProgramRequirement[];
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}) {
  return (
    <AsyncSection
      loading={loading}
      error={error}
      onRetry={onRetry}
      errorTitle='Couldn’t load the requirements'
      skeleton={
        <div className='space-y-3'>
          <Skeleton className='h-14 w-full' />
          <Skeleton className='h-24 w-full' />
          <Skeleton className='h-24 w-full' />
        </div>
      }
    >
      {contentKind === 'program' ? (
        <ProgramRequirements requirements={programRequirements} />
      ) : (
        <RequirementAnswers
          answers={state.answers}
          dispatch={dispatch}
          requirements={requirements}
        />
      )}
    </AsyncSection>
  );
}

function ProgramRequirements({ requirements }: { requirements: ProgramRequirement[] }) {
  if (requirements.length === 0) {
    return (
      <div className='bg-muted/30 text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm'>
        The program creator has not listed any requirements for this program yet. You can continue
        to the next step.
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='bg-muted/30 flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed p-3'>
        <p className='text-muted-foreground text-sm'>
          These are the program requirements published by the creator. Review them before submitting
          your application.
        </p>
        <Badge variant='secondary'>{requirements.length} listed</Badge>
      </div>
      <div className='space-y-3'>
        {requirements.map(requirement => (
          <div
            key={requirement.uuid ?? requirement.requirement_text}
            className='flex flex-wrap items-center justify-between gap-2 rounded-md border p-4'
          >
            <div className='space-y-1'>
              <p className='font-medium'>{requirement.requirement_text}</p>
              <p className='text-muted-foreground text-sm'>
                {requirement.requirement_category ?? requirement.requirement_type}
              </p>
            </div>
            <Badge variant={requirement.is_mandatory ? 'destructive' : 'outline'}>
              {requirement.is_mandatory ? 'Mandatory' : 'Optional'}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function RequirementAnswers({
  answers,
  dispatch,
  requirements,
}: {
  answers: RequirementAnswer[];
  dispatch: Dispatch<ApplyAction>;
  requirements: CourseTrainingRequirement[];
}) {
  if (requirements.length === 0) {
    return (
      <div className='bg-muted/30 text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm'>
        The course creator has not listed any requirements for you to provide. You can continue to
        the next step.
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='bg-muted/30 flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed p-3'>
        <p className='text-muted-foreground text-sm'>
          For each requirement the course creator set, tell us whether you already have it, and if
          not, how you would get it.
        </p>
        <Badge variant='secondary'>{requirements.length} required</Badge>
      </div>
      <div className='space-y-3'>
        {requirements.map(requirement => {
          const answer = answers.find(row => row.requirementUuid === requirement.uuid);
          if (!answer) return null;
          return (
            <RequirementBlock
              key={answer.requirementUuid}
              requirement={requirement}
              answer={answer}
              dispatch={dispatch}
            />
          );
        })}
      </div>
    </div>
  );
}

function RequirementBlock({
  requirement,
  answer,
  dispatch,
}: {
  requirement: CourseTrainingRequirement;
  answer: RequirementAnswer;
  dispatch: Dispatch<ApplyAction>;
}) {
  const uuid = answer.requirementUuid;
  return (
    <div className='rounded-md border p-4'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='min-w-0 flex-1'>
          <p className='font-medium'>{requirement.name}</p>
          {requirement.description ? (
            <p className='text-muted-foreground mt-1 text-sm'>{requirement.description}</p>
          ) : null}
        </div>
        <div className='flex gap-2' role='group' aria-label={`Do you have ${requirement.name}?`}>
          <Button
            type='button'
            size='sm'
            variant={answer.has === 'yes' ? 'default' : 'outline'}
            aria-pressed={answer.has === 'yes'}
            onClick={() => dispatch({ type: 'answerHas', uuid, has: 'yes' })}
          >
            Yes
          </Button>
          <Button
            type='button'
            size='sm'
            variant={answer.has === 'no' ? 'default' : 'outline'}
            aria-pressed={answer.has === 'no'}
            onClick={() => dispatch({ type: 'answerHas', uuid, has: 'no' })}
          >
            No
          </Button>
        </div>
      </div>

      {answer.has === 'no' ? (
        <div className='bg-muted/30 mt-4 rounded-md border border-dashed p-3'>
          <p className='text-sm'>How would you get it?</p>
          <div className='mt-3 flex flex-wrap gap-2' role='group' aria-label='How you would get it'>
            <Button
              type='button'
              size='sm'
              variant={answer.acquisition === 'lease' ? 'default' : 'outline'}
              aria-pressed={answer.acquisition === 'lease'}
              onClick={() => dispatch({ type: 'answerAcquisition', uuid, acquisition: 'lease' })}
            >
              Lease
            </Button>
            <Button
              type='button'
              size='sm'
              variant={answer.acquisition === 'hire' ? 'default' : 'outline'}
              aria-pressed={answer.acquisition === 'hire'}
              onClick={() => dispatch({ type: 'answerAcquisition', uuid, acquisition: 'hire' })}
            >
              Hire
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
