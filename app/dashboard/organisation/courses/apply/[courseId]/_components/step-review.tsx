'use client';

/**
 * Step 5 — everything the applicant is about to send, on one screen.
 *
 * The four-up strip is the shape of the offer at a glance; each section below
 * it restates its step in full and carries an Edit link straight back to that
 * step, so a wrong rate is three clicks from fixed rather than four Backs.
 *
 * The denominators here count the same requirements the equipment step asked
 * about — the applicant's own. A total that included the creator's or the
 * student's kit would read as "3/9 ready" for a school that is in fact ready.
 */

import { Camera, Tag } from 'lucide-react';
import type { Dispatch } from 'react';

import { rateBasisLabel } from '@/components/class-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CourseTrainingRequirement, ProgramRequirement } from '@/services/client';

import {
  APPLICATION_CURRENCY,
  type ApplyAction,
  type ApplyState,
  type MethodOption,
  methodOption,
  requirementKey,
  type TrainingContentKind,
} from './apply-model';

export function StepReview({
  state,
  dispatch,
  contentKind,
  requirements,
  programRequirements,
}: {
  state: ApplyState;
  dispatch: Dispatch<ApplyAction>;
  contentKind: TrainingContentKind;
  requirements: CourseTrainingRequirement[];
  programRequirements: ProgramRequirement[];
}) {
  const isProgram = contentKind === 'program';

  const selectedMethods = state.methods
    .map(methodOption)
    .filter((option): option is MethodOption => Boolean(option));

  const haveCount = state.equipment.filter(answer => answer.has === 'yes').length;
  const needCount = state.equipment.filter(answer => answer.has === 'no').length;
  const requirementCount = isProgram ? programRequirements.length : requirements.length;

  const goToStep = (step: number) => dispatch({ type: 'step', step });

  const firstMethodName = selectedMethods[0]?.title.split(' (')[0];
  const methodSummary =
    selectedMethods.length === 0
      ? '—'
      : selectedMethods.length === 1
        ? (firstMethodName ?? '—')
        : `${selectedMethods.length} selected`;

  return (
    <div className='space-y-6 text-sm'>
      <div className='bg-muted/30 grid gap-3 rounded-md border p-3 sm:grid-cols-4'>
        <SummaryStat label='Methods' value={methodSummary} />
        <SummaryStat label='Classrooms' value={String(state.classrooms.length)} />
        {isProgram ? (
          <SummaryStat label='Requirements' value={String(requirementCount)} />
        ) : (
          <SummaryStat label='Equipment on hand' value={`${haveCount}/${requirementCount}`} />
        )}
        <SummaryStat
          label={isProgram ? 'Reviewed' : 'To be sourced'}
          value={isProgram ? 'Yes' : String(needCount)}
        />
      </div>

      <section className='space-y-2'>
        <SectionHeader
          title={`Training methods (${selectedMethods.length})`}
          onEdit={() => goToStep(0)}
        />
        {selectedMethods.length === 0 ? (
          <p className='text-muted-foreground rounded-md border border-dashed p-3'>
            No training methods selected.
          </p>
        ) : (
          <ul className='grid gap-2 sm:grid-cols-2'>
            {selectedMethods.map(method => {
              const Icon = method.icon;
              return (
                <li key={method.value} className='flex items-start gap-3 rounded-md border p-3'>
                  <span className='bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-md'>
                    <Icon className='h-5 w-5' />
                  </span>
                  <div className='min-w-0'>
                    <p className='font-medium'>{method.title}</p>
                    <p className='text-muted-foreground'>{method.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className='space-y-2'>
        <SectionHeader
          title={`Classrooms & labs (${state.classrooms.length})`}
          onEdit={() => goToStep(1)}
        />
        {state.classrooms.length === 0 ? (
          <p className='text-muted-foreground rounded-md border border-dashed p-3'>
            No classrooms added.
          </p>
        ) : (
          <ol className='grid gap-2 sm:grid-cols-2'>
            {state.classrooms.map((classroom, index) => (
              <li key={classroom.id} className='flex items-center gap-3 rounded-md border p-2'>
                {classroom.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={classroom.photoUrl}
                    alt={classroom.name || `Classroom ${index + 1}`}
                    className='h-14 w-14 rounded-md object-cover'
                  />
                ) : (
                  <div className='bg-muted text-muted-foreground flex h-14 w-14 items-center justify-center rounded-md'>
                    <Camera className='h-4 w-4' />
                  </div>
                )}
                <div className='min-w-0 flex-1'>
                  <p className='truncate font-medium'>
                    <span className='text-muted-foreground mr-1'>#{index + 1}</span>
                    {classroom.name || '(unnamed)'}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {classroom.photoUrl ? 'Photo attached' : 'No photo'}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className='space-y-2'>
        <SectionHeader
          title={
            isProgram
              ? `Program requirements (${requirementCount})`
              : `Equipment (${haveCount} ready · ${needCount} to source)`
          }
          onEdit={() => goToStep(2)}
        />
        {isProgram ? (
          programRequirements.length === 0 ? (
            <p className='text-muted-foreground rounded-md border border-dashed p-3'>
              No program requirements were published yet.
            </p>
          ) : (
            <ul className='space-y-2'>
              {programRequirements.map(requirement => (
                <li
                  key={requirement.uuid ?? requirement.requirement_text}
                  className='rounded-md border p-3'
                >
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <span className='font-medium'>{requirement.requirement_text}</span>
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
                  <p className='text-muted-foreground mt-1 text-sm'>
                    {requirement.requirement_category ?? requirement.requirement_type}
                  </p>
                </li>
              ))}
            </ul>
          )
        ) : (
          <ul className='space-y-2'>
            {requirements.map(requirement => {
              const key = requirementKey(requirement);
              const answer = state.equipment.find(row => row.requirementUuid === key);
              if (!answer) return null;
              return (
                <li key={key} className='rounded-md border p-3'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <span className='font-medium'>{requirement.name}</span>
                    {answer.has === 'yes' && <Badge variant='secondary'>Available</Badge>}
                    {answer.has === 'no' && answer.acquisition && (
                      <Badge variant='outline'>
                        {answer.acquisition === 'lease' ? 'Lease to own' : 'Hire'} via Sarafrika
                      </Badge>
                    )}
                    {answer.has === null && <Badge variant='outline'>Not answered</Badge>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className='space-y-2'>
        <SectionHeader
          title={`Pricing (${state.pricing.length} ${state.pricing.length === 1 ? 'tier' : 'tiers'})`}
          onEdit={() => goToStep(3)}
        />
        {state.pricing.length === 0 ? (
          <p className='text-muted-foreground rounded-md border border-dashed p-3'>
            No pricing tiers added.
          </p>
        ) : (
          <div className='overflow-x-auto rounded-md border'>
            <table className='w-full text-xs'>
              <thead className='bg-muted/50 text-muted-foreground'>
                <tr>
                  <th className='px-3 py-2 text-left font-medium'>Training method</th>
                  <th className='px-3 py-2 text-left font-medium'>Session duration</th>
                  <th className='px-3 py-2 text-left font-medium'>Charged per</th>
                  <th className='px-3 py-2 text-right font-medium'>
                    Fee / student ({APPLICATION_CURRENCY})
                  </th>
                </tr>
              </thead>
              <tbody>
                {state.pricing.map(tier => {
                  const option = methodOption(tier.method);
                  const amount = Number.parseFloat(tier.amount);
                  return (
                    <tr key={tier.id} className='border-t'>
                      <td className='px-3 py-2'>
                        <span className='inline-flex items-center gap-1.5'>
                          <Tag className='text-muted-foreground h-3 w-3' />
                          {option?.title ?? '—'}
                        </span>
                      </td>
                      <td className='px-3 py-2'>{tier.duration || '—'}</td>
                      <td className='px-3 py-2'>{rateBasisLabel(tier.basis)}</td>
                      <td className='px-3 py-2 text-right font-mono'>
                        {Number.isFinite(amount) ? amount.toLocaleString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className='text-muted-foreground text-[11px] tracking-wide uppercase'>{label}</p>
      <p className='mt-0.5 font-semibold'>{value}</p>
    </div>
  );
}

function SectionHeader({ title, onEdit }: { title: string; onEdit: () => void }) {
  return (
    <div className='flex items-center justify-between'>
      <h3 className='font-semibold'>{title}</h3>
      <Button type='button' variant='ghost' size='sm' onClick={onEdit} className='h-7 px-2 text-xs'>
        Edit
      </Button>
    </div>
  );
}
