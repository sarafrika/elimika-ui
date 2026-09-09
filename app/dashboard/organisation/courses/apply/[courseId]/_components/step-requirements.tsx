'use client';

/**
 * Step 3 — the creator's requirements, answered.
 *
 * A course asks one question per requirement: do you have this? "No" is not a
 * dead end — Sarafrika will lease or hire the kit, and the choice is recorded.
 *
 * It is a check-off, not an asset register. Brand and serial were collected per
 * unit, had no column on the API to land in, and were dropped before submission,
 * so they blocked applications to no end. Condition and quantity belong to the
 * equipment inventory when that exists.
 *
 * Only requirements the *applicant* is on the hook for appear here; the filter
 * lives in `apply-model` and the route applies it before this step sees a list.
 *
 * A programme has no such transaction — its requirements are prose, not
 * inventory — so the programme branch reads rather than asks.
 */

import { ShoppingBag } from 'lucide-react';
import type { Dispatch } from 'react';
import { toast } from 'sonner';

import { AsyncSection } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { CourseTrainingRequirement, ProgramRequirement } from '@/services/client';

import {
  type ApplyAction,
  type ApplyState,
  type EquipmentAnswer,
  requirementKey,
  type TrainingContentKind,
} from './apply-model';

export function StepRequirements({
  state,
  dispatch,
  contentKind,
  requirements,
  programRequirements,
  courseName,
  loading,
  error,
  onRetry,
}: {
  state: ApplyState;
  dispatch: Dispatch<ApplyAction>;
  contentKind: TrainingContentKind;
  requirements: CourseTrainingRequirement[];
  programRequirements: ProgramRequirement[];
  courseName: string;
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
        <EquipmentDeclaration
          state={state}
          dispatch={dispatch}
          requirements={requirements}
          courseName={courseName}
        />
      )}
    </AsyncSection>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Programme — read, do not answer
 * ────────────────────────────────────────────────────────────────────────── */

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
            className='rounded-md border p-4'
          >
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div className='space-y-1'>
                <p className='font-medium'>{requirement.requirement_text}</p>
                <p className='text-muted-foreground text-sm'>
                  {requirement.requirement_category ?? requirement.requirement_type}
                </p>
              </div>
              <div className='flex flex-wrap gap-2'>
                {requirement.is_mandatory ? (
                  <Badge variant='destructive' className='text-[10px]'>
                    Mandatory
                  </Badge>
                ) : (
                  <Badge variant='outline' className='text-[10px]'>
                    Optional
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Course — the equipment declaration
 * ────────────────────────────────────────────────────────────────────────── */

function EquipmentDeclaration({
  state,
  dispatch,
  requirements,
  courseName,
}: {
  state: ApplyState;
  dispatch: Dispatch<ApplyAction>;
  requirements: CourseTrainingRequirement[];
  courseName: string;
}) {
  if (requirements.length === 0) {
    return (
      <div className='bg-muted/30 text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm'>
        The course creator has not listed any organisation equipment requirements for this course.
        You can continue to the next step.
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='bg-muted/30 flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed p-3'>
        <p className='text-muted-foreground text-sm'>
          The list below is{' '}
          <span className='text-foreground font-medium'>
            prefilled from the course creator&apos;s requirements
          </span>
          . For each one, tell us whether you already have it.
        </p>
        <Badge variant='secondary'>{requirements.length} required</Badge>
      </div>
      <div className='space-y-3'>
        {requirements.map(requirement => {
          const key = requirementKey(requirement);
          const answer = state.equipment.find(row => row.requirementUuid === key);
          if (!answer) return null;
          return (
            <EquipmentBlock
              key={key}
              requirement={requirement}
              answer={answer}
              dispatch={dispatch}
              courseName={courseName}
            />
          );
        })}
      </div>
    </div>
  );
}

function EquipmentBlock({
  requirement,
  answer,
  dispatch,
  courseName,
}: {
  requirement: CourseTrainingRequirement;
  answer: EquipmentAnswer;
  dispatch: Dispatch<ApplyAction>;
  courseName: string;
}) {
  return (
    <div className='rounded-md border p-4'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='font-medium'>{requirement.name}</p>
            <Badge variant='outline' className='text-[10px] font-normal'>
              Set by course creator
            </Badge>
            {answer.has === 'yes' && (
              <Badge variant='secondary' className='text-[10px]'>
                Available
              </Badge>
            )}
          </div>
          {requirement.description && (
            <p className='text-muted-foreground mt-1 text-sm'>{requirement.description}</p>
          )}
        </div>
        <div className='flex gap-2'>
          <Button
            type='button'
            size='sm'
            variant={answer.has === 'yes' ? 'default' : 'outline'}
            onClick={() => dispatch({ type: 'equipHas', uuid: answer.requirementUuid, has: 'yes' })}
          >
            Yes
          </Button>
          <Button
            type='button'
            size='sm'
            variant={answer.has === 'no' ? 'default' : 'outline'}
            onClick={() => dispatch({ type: 'equipHas', uuid: answer.requirementUuid, has: 'no' })}
          >
            No
          </Button>
        </div>
      </div>

      {answer.has === 'yes' && (
        <div className='bg-muted/30 mt-4 rounded-md border border-dashed p-3'>
          <p className='text-muted-foreground text-sm'>
            Noted as available. You will confirm condition and quantity with the course creator
            before your first session.
          </p>
        </div>
      )}

      {answer.has === 'no' && (
        <div className='bg-muted/30 mt-4 rounded-md border border-dashed p-3'>
          <p className='text-sm'>No problem — Sarafrika can help you acquire this equipment.</p>
          <div className='mt-3 flex flex-wrap gap-2'>
            <Button
              type='button'
              size='sm'
              variant={answer.acquisition === 'lease' ? 'default' : 'outline'}
              onClick={() =>
                dispatch({
                  type: 'equipAcquisition',
                  uuid: answer.requirementUuid,
                  acquisition: 'lease',
                })
              }
            >
              Lease to own
            </Button>
            <Button
              type='button'
              size='sm'
              variant={answer.acquisition === 'hire' ? 'default' : 'outline'}
              onClick={() =>
                dispatch({
                  type: 'equipAcquisition',
                  uuid: answer.requirementUuid,
                  acquisition: 'hire',
                })
              }
            >
              Hire
            </Button>
            {answer.acquisition && (
              // There is no shop route to send anyone to. The toast is the whole
              // of it, and inventing a destination would be a dead link on the
              // one screen an applicant is least able to recover from.
              <Button
                type='button'
                size='sm'
                variant='secondary'
                onClick={() =>
                  toast.info('Sarafrika Shop', {
                    description: `We'll help you ${
                      answer.acquisition === 'lease' ? 'lease to own' : 'hire'
                    } ${requirement.name} for ${courseName}.`,
                  })
                }
              >
                <ShoppingBag className='mr-2 h-4 w-4' /> Continue to Sarafrika Shop
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
