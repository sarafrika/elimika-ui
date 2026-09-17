'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';
import { toast } from 'sonner';

import { RateCardGrid } from '@/components/rate-card/rate-card-grid';
import { RateUpdateStatus } from '@/components/rate-card/rate-update-status';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/error-utils';
import { DEFAULT_CURRENCY, formatRateAmount } from '@/lib/rate-card';
import { cn } from '@/lib/utils';
import {
  decideOnProgramTrainingApplicationMutation,
  decideOnTrainingApplicationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { invalidateTrainingApplicationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';
import { useTrainingApplication } from '../hooks/use-training-application';
import type { TrainingApplicationEntry } from '../hooks/use-training-application-list';
import type { TrainingApplicationKind } from '../types';
import { OfferedVenuesList, RequirementAnswersTable } from './application-sections';
import { ApplicationStatusBadge } from './application-status-badge';

type Decision = 'approve' | 'reject' | 'revoke';

const DECISION_DONE: Record<Decision, string> = {
  approve: 'Application approved.',
  reject: 'Application rejected.',
  revoke: 'Approval revoked.',
};

function useDecideApplication(kind: TrainingApplicationKind, parentUuid: string, uuid: string) {
  const queryClient = useQueryClient();
  const course = useMutation(decideOnTrainingApplicationMutation());
  const program = useMutation(decideOnProgramTrainingApplicationMutation());

  const decide = (action: Decision, reviewNotes: string, onDone: () => void) => {
    const body = { review_notes: reviewNotes.trim() || null };
    const callbacks = {
      onSuccess: async () => {
        await invalidateTrainingApplicationWorkflowQueries(queryClient);
        toast.success(DECISION_DONE[action]);
        onDone();
      },
      onError: (error: unknown) =>
        toast.error(getErrorMessage(error, `Could not ${action} this application.`)),
    };
    if (kind === 'course')
      course.mutate(
        { path: { courseUuid: parentUuid, applicationUuid: uuid }, query: { action }, body },
        callbacks
      );
    else
      program.mutate(
        { path: { programUuid: parentUuid, applicationUuid: uuid }, query: { action }, body },
        callbacks
      );
  };

  const pending = course.isPending || program.isPending;
  const variables = kind === 'course' ? course.variables : program.variables;
  return { decide, pending, action: variables?.query.action as Decision | undefined };
}

/** Reading the detail as the owner stamps `first_opened_at` for the applicant's tracker. */
function RecordOpened({ entry }: { entry: TrainingApplicationEntry }) {
  useTrainingApplication(entry.kind, entry.parentUuid, entry.uuid);
  return null;
}

export type CreatorApplicationReviewProps = {
  entry: TrainingApplicationEntry;
  heading: ReactNode;
  subheading?: ReactNode;
  leading?: ReactNode;
  /** The viewer owns the course or program; only then are decisions offered. */
  canDecide: boolean;
  className?: string;
};

/** One training application as its course or program owner reviews it. */
export function CreatorApplicationReview({
  entry,
  heading,
  subheading,
  leading,
  canDecide,
  className,
}: CreatorApplicationReviewProps) {
  const { application, kind } = entry;
  const status = application.status;
  const card = application.rate_card;
  const minimum = entry.minimum ?? application.rate_floor_flags?.minimum_training_fee ?? null;
  const currency = card?.currency || DEFAULT_CURRENCY;
  const answers = application.requirement_answers ?? [];

  return (
    <article className={cn('bg-card rounded-xl border', className)}>
      {canDecide && status === 'pending' && !application.first_opened_at ? (
        <RecordOpened entry={entry} />
      ) : null}
      <header className='flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4'>
        <div className='flex min-w-0 items-center gap-3'>
          {leading}
          <div className='min-w-0'>
            <h2 className='text-foreground truncate text-base font-semibold'>{heading}</h2>
            {subheading ? (
              <p className='text-muted-foreground mt-0.5 text-sm'>{subheading}</p>
            ) : null}
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {status === 'approved' ? (
            <RateUpdateStatus
              variant='badge'
              kind={kind}
              parentUuid={entry.parentUuid}
              applicationUuid={entry.uuid}
              pendingUpdateUuid={application.pending_rate_update_uuid}
            />
          ) : null}
          <ApplicationStatusBadge status={status} kind={kind} viewer='owner' />
        </div>
      </header>

      <div className='space-y-4 p-5'>
        <div className='flex flex-wrap items-baseline justify-between gap-2'>
          <h3 className='text-foreground text-sm font-semibold'>Rate card</h3>
          <span className='text-muted-foreground text-xs'>
            {currency} per learner
            {minimum ? ` · ${kind} minimum ${formatRateAmount(minimum, currency)}` : ''}
          </span>
        </div>
        <RateCardGrid
          mode='view'
          value={card}
          floorFlags={application.rate_floor_flags}
          minimum={minimum}
        />

        <div className='bg-muted/30 rounded-lg border p-3'>
          <p className='text-muted-foreground text-xs font-medium'>Applicant’s note</p>
          <p className='text-foreground mt-1 text-sm'>
            {application.application_notes || 'No note.'}
          </p>
        </div>

        {application.applicant_type === 'organisation' ? (
          <section className='space-y-2'>
            <h3 className='text-foreground text-sm font-semibold'>Venues offered</h3>
            <OfferedVenuesList venues={application.offered_venues} />
          </section>
        ) : null}

        {kind === 'course' || answers.length > 0 ? (
          <section className='space-y-2'>
            <h3 className='text-foreground text-sm font-semibold'>Requirements</h3>
            <div className='overflow-hidden rounded-lg border'>
              <RequirementAnswersTable answers={answers} />
            </div>
          </section>
        ) : null}

        {application.review_notes && status !== 'pending' ? (
          <div className='bg-muted/30 rounded-lg border p-3'>
            <p className='text-muted-foreground text-xs font-medium'>Your note to the applicant</p>
            <p className='text-foreground mt-1 text-sm'>{application.review_notes}</p>
          </div>
        ) : null}

        {canDecide && (status === 'pending' || status === 'approved') ? (
          <DecisionPanel entry={entry} />
        ) : null}
      </div>
    </article>
  );
}

function DecisionPanel({ entry }: { entry: TrainingApplicationEntry }) {
  const noteId = useId();
  const [note, setNote] = useState('');
  const [revoking, setRevoking] = useState(false);
  const { decide, pending, action } = useDecideApplication(
    entry.kind,
    entry.parentUuid,
    entry.uuid
  );
  const isPending = entry.application.status === 'pending';
  const reset = () => {
    setNote('');
    setRevoking(false);
  };

  if (!isPending && !revoking) {
    return (
      <div className='flex justify-end'>
        <Button type='button' variant='outline' onClick={() => setRevoking(true)}>
          Revoke approval
        </Button>
      </div>
    );
  }

  const spinnerFor = (decision: Decision) =>
    pending && action === decision ? <Spinner className='h-4 w-4' /> : null;

  return (
    <div className='space-y-3 border-t pt-4'>
      <div className='grid gap-2'>
        <Label htmlFor={noteId}>
          Note to the applicant <span className='text-muted-foreground'>(optional)</span>
        </Label>
        <Textarea
          id={noteId}
          rows={3}
          value={note}
          onChange={event => setNote(event.target.value)}
          placeholder={
            isPending
              ? 'e.g. what to change before applying again'
              : 'Why the approval is being revoked'
          }
        />
      </div>
      <div className='flex flex-wrap justify-end gap-2'>
        {isPending ? (
          <>
            <Button
              type='button'
              variant='outline'
              disabled={pending}
              onClick={() => decide('reject', note, reset)}
            >
              {spinnerFor('reject')}
              Reject
            </Button>
            <Button type='button' disabled={pending} onClick={() => decide('approve', note, reset)}>
              {spinnerFor('approve') ?? <Check aria-hidden />}
              Approve rate card
            </Button>
          </>
        ) : (
          <>
            <Button type='button' variant='ghost' disabled={pending} onClick={reset}>
              Cancel
            </Button>
            <Button
              type='button'
              variant='destructive'
              disabled={pending}
              onClick={() => decide('revoke', note, reset)}
            >
              {spinnerFor('revoke')}
              Revoke approval
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
