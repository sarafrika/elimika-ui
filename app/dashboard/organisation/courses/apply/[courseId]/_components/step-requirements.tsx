'use client';

/**
 * Step 3 — the creator's requirements, answered.
 *
 * A course asks a question per requirement: do you have this? "Yes" opens a
 * unit list — name/model, brand and serial per unit, each required — because a
 * school with three of a thing is a different proposition from a school with
 * one, and the serials are what a later audit is done against. "No" is not a
 * dead end: Sarafrika will lease or hire the kit, and the choice is recorded.
 *
 * Only requirements the *applicant* is on the hook for appear here; the filter
 * lives in `apply-model` and the route applies it before this step sees a list.
 *
 * A programme has no such transaction — its requirements are prose, not
 * inventory — so the programme branch reads rather than asks.
 */

import { Plus, ShoppingBag, Trash2 } from 'lucide-react';
import type { Dispatch } from 'react';
import { toast } from 'sonner';

import { AsyncSection } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CourseTrainingRequirement, ProgramRequirement } from '@/services/client';

import {
  requirementKey,
  type ApplyAction,
  type ApplyState,
  type EquipmentAnswer,
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
          . For each one, tell us if you have it — you can add multiple units per requirement using{' '}
          <span className='text-foreground font-medium'>Add another</span>.
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
                {answer.items.length} {answer.items.length === 1 ? 'item' : 'items'} added
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
        <div className='mt-4 space-y-3'>
          {answer.items.map((item, index) => {
            const nameInvalid = !item.name.trim();
            const brandInvalid = !item.brand.trim();
            const serialInvalid = !item.serial.trim();
            const rowInvalid = nameInvalid || brandInvalid || serialInvalid;
            return (
              <div
                key={item.id}
                className={cn(
                  'bg-muted/40 grid gap-2 rounded-md p-3 sm:grid-cols-[1fr_1fr_1fr_auto]',
                  rowInvalid && 'ring-destructive/40 ring-1'
                )}
              >
                <div className='space-y-1'>
                  <Label className='text-muted-foreground text-xs'>
                    Name / Model <span className='text-destructive'>*</span>
                  </Label>
                  <Input
                    value={item.name}
                    onChange={event =>
                      dispatch({
                        type: 'equipItem',
                        uuid: answer.requirementUuid,
                        itemId: item.id,
                        patch: { name: event.target.value },
                      })
                    }
                    placeholder={`Item ${index + 1}`}
                    required
                    aria-invalid={nameInvalid}
                    className={cn(
                      nameInvalid && 'border-destructive focus-visible:ring-destructive/40'
                    )}
                  />
                  {nameInvalid && <p className='text-destructive text-[11px]'>Required.</p>}
                </div>
                <div className='space-y-1'>
                  <Label className='text-muted-foreground text-xs'>
                    Brand <span className='text-destructive'>*</span>
                  </Label>
                  <Input
                    value={item.brand}
                    onChange={event =>
                      dispatch({
                        type: 'equipItem',
                        uuid: answer.requirementUuid,
                        itemId: item.id,
                        patch: { brand: event.target.value },
                      })
                    }
                    required
                    aria-invalid={brandInvalid}
                    className={cn(
                      brandInvalid && 'border-destructive focus-visible:ring-destructive/40'
                    )}
                  />
                  {brandInvalid && <p className='text-destructive text-[11px]'>Required.</p>}
                </div>
                <div className='space-y-1'>
                  <Label className='text-muted-foreground text-xs'>
                    Serial number <span className='text-destructive'>*</span>
                  </Label>
                  <Input
                    value={item.serial}
                    onChange={event =>
                      dispatch({
                        type: 'equipItem',
                        uuid: answer.requirementUuid,
                        itemId: item.id,
                        patch: { serial: event.target.value },
                      })
                    }
                    required
                    aria-invalid={serialInvalid}
                    className={cn(
                      serialInvalid && 'border-destructive focus-visible:ring-destructive/40'
                    )}
                  />
                  {serialInvalid && <p className='text-destructive text-[11px]'>Required.</p>}
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={() =>
                    dispatch({
                      type: 'equipRemoveItem',
                      uuid: answer.requirementUuid,
                      itemId: item.id,
                    })
                  }
                  aria-label='Remove item'
                  className='self-end'
                >
                  <Trash2 className='text-muted-foreground h-4 w-4' />
                </Button>
              </div>
            );
          })}
          {answer.items.length === 0 && (
            <p className='text-destructive text-[11px]'>
              Add at least one item with name, brand, and serial number.
            </p>
          )}
          <div className='flex flex-wrap items-center justify-between gap-2 pt-1'>
            <p className='text-muted-foreground text-xs'>
              Have more than one? Add each unit so we can track serial numbers individually.
            </p>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() =>
                dispatch({
                  type: 'equipAddItem',
                  uuid: answer.requirementUuid,
                  name: requirement.name,
                })
              }
            >
              <Plus className='mr-2 h-4 w-4' /> Add another {requirement.name}
            </Button>
          </div>
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
