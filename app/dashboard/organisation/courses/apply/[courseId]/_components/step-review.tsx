'use client';

import { TriangleAlert } from 'lucide-react';
import { type Dispatch, useId } from 'react';

import { RateCardGrid } from '@/components/rate-card/rate-card-grid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { offeredMethods } from '@/lib/rate-card';
import type { ProgramRequirement } from '@/services/client';
import type { CourseTrainerApplicantType } from '@/src/features/course-record';

import {
  type ApplyAction,
  type ApplyState,
  offersInPerson,
  type StepId,
  type TrainingContentKind,
} from './apply-model';
import { useOfferableVenues } from './use-offerable-venues';

/** Everything the applicant is about to send, each section one click from its step. */
export function StepReview({
  state,
  dispatch,
  contentKind,
  applicantType,
  organisationUuid,
  programRequirements,
}: {
  state: ApplyState;
  dispatch: Dispatch<ApplyAction>;
  contentKind: TrainingContentKind;
  applicantType: CourseTrainerApplicantType;
  organisationUuid: string;
  programRequirements: ProgramRequirement[];
}) {
  const noteId = useId();
  const isOrganisation = applicantType === 'organisation';
  const { byUuid } = useOfferableVenues(organisationUuid, isOrganisation);
  const methods = offeredMethods(state.card);
  const goTo = (step: StepId) => dispatch({ type: 'step', step });
  const creator = contentKind === 'program' ? 'program creator' : 'course creator';

  return (
    <div className='space-y-6 text-sm'>
      <section className='space-y-2'>
        <SectionHeader
          title={`Rate card · ${methods.length} ${methods.length === 1 ? 'method' : 'methods'}`}
          onEdit={() => goTo('pricing')}
        />
        <RateCardGrid mode='view' value={state.card} />
      </section>

      {isOrganisation ? (
        <section className='space-y-2'>
          <SectionHeader
            title={`Where you'll teach (${state.venueUuids.length})`}
            onEdit={() => goTo('venues')}
          />
          {state.venueUuids.length === 0 ? (
            <p className='text-muted-foreground rounded-md border border-dashed p-3'>
              No venues offered.
            </p>
          ) : (
            <ul className='grid gap-2 sm:grid-cols-2'>
              {state.venueUuids.map(uuid => {
                const venue = byUuid.get(uuid);
                return (
                  <li key={uuid} className='rounded-md border p-3'>
                    <p className='font-medium'>{venue?.name ?? 'Venue'}</p>
                    <p className='text-muted-foreground text-xs'>
                      {[
                        venue?.seat_capacity ? `${venue.seat_capacity} seats` : null,
                        venue?.location_name,
                      ]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          {state.venueUuids.length === 0 && offersInPerson(state.card) ? (
            <p className='text-foreground bg-warning/10 border-warning/40 flex items-start gap-2 rounded-md border p-3'>
              <TriangleAlert aria-hidden className='text-warning mt-0.5 size-4 shrink-0' />
              You offer in-person training but no venue. The {creator} will not know where you would
              teach.
            </p>
          ) : null}
        </section>
      ) : null}

      <section className='space-y-2'>
        <SectionHeader
          title={
            contentKind === 'program'
              ? `Program requirements (${programRequirements.length})`
              : `Course requirements (${state.answers.length})`
          }
          onEdit={() => goTo('requirements')}
        />
        {contentKind === 'program' ? (
          <p className='text-muted-foreground rounded-md border border-dashed p-3'>
            {programRequirements.length === 0
              ? 'No program requirements were published yet.'
              : 'You reviewed the program requirements.'}
          </p>
        ) : state.answers.length === 0 ? (
          <p className='text-muted-foreground rounded-md border border-dashed p-3'>
            No requirements to answer.
          </p>
        ) : (
          <ul className='divide-y rounded-md border'>
            {state.answers.map(answer => (
              <li
                key={answer.requirementUuid}
                className='flex flex-wrap items-center justify-between gap-2 px-3 py-2'
              >
                <span className='font-medium'>{answer.requirementName}</span>
                {answer.has === 'yes' ? (
                  <Badge variant='outline' className='border-success/40 bg-success/10 text-success'>
                    Has it
                  </Badge>
                ) : answer.has === 'no' ? (
                  <Badge variant='outline' className='border-warning/50 bg-warning/10'>
                    {answer.acquisition === 'lease'
                      ? 'Will lease'
                      : answer.acquisition === 'hire'
                        ? 'Will hire'
                        : 'Not yet'}
                  </Badge>
                ) : (
                  <Badge variant='outline'>Not answered</Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className='space-y-2'>
        <Label htmlFor={noteId} className='font-semibold'>
          Note for the {creator}{' '}
          <span className='text-muted-foreground font-normal'>(optional)</span>
        </Label>
        <Textarea
          id={noteId}
          rows={3}
          value={state.note}
          onChange={event => dispatch({ type: 'note', note: event.target.value })}
          placeholder='Anything that helps them decide, e.g. your experience with this subject.'
        />
      </section>
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
