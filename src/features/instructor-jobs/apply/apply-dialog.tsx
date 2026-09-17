'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CircleAlert, CircleCheck } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Spinner from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/error-utils';
import {
  parseSchedulingConflicts,
  type SchedulingConflict,
  toSchedulingConflicts,
} from '@/lib/scheduling-conflicts';
import {
  applyToJobMutation,
  getJobEligibilityOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { ClassMarketplaceJob } from '@/services/client/types.gen';
import { invalidateJobApplicationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';

import { jobFacts } from '../job-facts';
import { applicationPageHref, findWorkHref } from '../job-routes';
import { ApplyStepRail } from './apply-step-rail';
import { AvailabilityStep } from './availability-step';
import { NoteStep } from './note-step';
import { ReviewStep } from './review-step';

type Refusal = { message: string; conflicts: SchedulingConflict[] };

/**
 * The three-step apply flow for one job. Pass `browseInPlace` where Find work is already on
 * screen, so "Browse more jobs" closes the dialog instead of navigating.
 */
export function ApplyDialog({
  job,
  open,
  onOpenChange,
  organisationName,
  contentTitle = null,
  browseInPlace = false,
}: {
  job: ClassMarketplaceJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisationName?: string | null;
  contentTitle?: string | null;
  browseInPlace?: boolean;
}) {
  return (
    <Dialog open={open && Boolean(job)} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[92vh] overflow-y-auto sm:max-w-3xl'>
        {job?.uuid ? (
          <ApplyFlow
            key={job.uuid}
            job={job}
            jobUuid={job.uuid}
            organisationName={organisationName || 'The organisation'}
            contentTitle={contentTitle}
            onClose={() => onOpenChange(false)}
            browseInPlace={browseInPlace}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ApplyFlow({
  job,
  jobUuid,
  organisationName,
  contentTitle,
  onClose,
  browseInPlace,
}: {
  job: ClassMarketplaceJob;
  jobUuid: string;
  organisationName: string;
  contentTitle: string | null;
  onClose: () => void;
  browseInPlace: boolean;
}) {
  const queryClient = useQueryClient();
  const facts = useMemo(() => jobFacts(job), [job]);
  const [step, setStep] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [note, setNote] = useState('');
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [sentUuid, setSentUuid] = useState<string | null | undefined>(undefined);

  // Opening the dialog always re-asks: approvals and calendars change under the page.
  const eligibilityQuery = useQuery({
    ...getJobEligibilityOptions({ path: { jobUuid } }),
    staleTime: 0,
  });
  const eligibility = eligibilityQuery.data?.data;
  const checking = eligibilityQuery.isFetching || (eligibilityQuery.isLoading && !eligibility);

  const conflicts = useMemo(
    () =>
      refusal?.conflicts.length
        ? refusal.conflicts
        : eligibility?.schedule_clear === false
          ? toSchedulingConflicts(eligibility.schedule_conflicts)
          : [],
    [refusal, eligibility]
  );
  const scheduleOnly =
    eligibility?.instructor_verified !== false &&
    eligibility?.training_approved !== false &&
    eligibility?.rate_ok !== false;
  const blocker =
    eligibility?.eligible === false && !(scheduleOnly && eligibility.schedule_clear === false)
      ? (eligibility.reason ?? 'You can’t apply for this job yet.')
      : null;
  const canContinue =
    confirmed && !checking && Boolean(eligibility) && eligibility?.eligible !== false;

  const apply = useMutation({
    ...applyToJobMutation(),
    onSuccess: async response => {
      setSentUuid(response?.data?.uuid ?? null);
      await invalidateJobApplicationWorkflowQueries(queryClient);
    },
    onError: async error => {
      const report = parseSchedulingConflicts(error);
      setRefusal({
        message: report?.message ?? getErrorMessage(error, 'Your application wasn’t sent.'),
        conflicts: report?.conflicts ?? [],
      });
      if (report?.conflicts.length) setConfirmed(false);
      setStep(1);
      await invalidateJobApplicationWorkflowQueries(queryClient);
    },
  });

  if (sentUuid !== undefined) {
    const sessions = facts.sessionCount;
    return (
      <div className='flex flex-col items-center gap-3 px-2 py-6 text-center'>
        <span className='bg-success/10 text-success flex size-14 items-center justify-center rounded-full'>
          <CircleCheck aria-hidden className='size-7' />
        </span>
        <DialogHeader className='items-center text-center sm:text-center'>
          <DialogTitle className='text-xl'>Application sent</DialogTitle>
          <DialogDescription className='max-w-md'>
            {organisationName} has your application. We’ll notify you when it moves, and{' '}
            {sessions === 1 ? 'the session is' : `the ${sessions} sessions are`} pencilled into
            your calendar.
          </DialogDescription>
        </DialogHeader>
        <div className='mt-2 flex flex-wrap justify-center gap-2'>
          {browseInPlace ? (
            <Button variant='outline' onClick={onClose}>
              Browse more jobs
            </Button>
          ) : (
            <Button asChild variant='outline'>
              <Link href={findWorkHref()}>Browse more jobs</Link>
            </Button>
          )}
          {sentUuid ? (
            <Button asChild>
              <Link href={applicationPageHref(sentUuid)}>Track application</Link>
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  const next = () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setRefusal(null);
    const trimmed = note.trim();
    apply.mutate({
      path: { jobUuid },
      body: trimmed ? { application_note: trimmed } : undefined,
    });
  };

  return (
    <div className='flex min-w-0 flex-col gap-5'>
      <DialogHeader className='pr-8'>
        <DialogTitle className='text-xl'>Apply for this job</DialogTitle>
        <DialogDescription>
          {job.title || 'Untitled job'} · {organisationName}
        </DialogDescription>
      </DialogHeader>

      <ApplyStepRail step={step} />

      {refusal ? (
        <p
          role='alert'
          className='border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm'
        >
          <CircleAlert aria-hidden className='mt-0.5 size-4 shrink-0' />
          <span>
            <strong>Your application wasn’t sent.</strong> {refusal.message}
          </span>
        </p>
      ) : null}

      {step === 1 ? (
        <AvailabilityStep
          facts={facts}
          conflicts={conflicts}
          confirmed={confirmed}
          onConfirmedChange={setConfirmed}
          check={{
            loading: checking,
            error: eligibilityQuery.error,
            onRetry: () => eligibilityQuery.refetch(),
            blocker,
          }}
        />
      ) : step === 2 ? (
        <NoteStep
          job={job}
          organisationName={organisationName}
          contentTitle={contentTitle}
          note={note}
          onNoteChange={setNote}
        />
      ) : (
        <ReviewStep
          job={job}
          facts={facts}
          eligibility={eligibility}
          organisationName={organisationName}
          note={note}
        />
      )}

      <div className='border-border flex items-center justify-between gap-2 border-t pt-4'>
        <Button
          variant='ghost'
          onClick={() => setStep(step - 1)}
          disabled={step === 1 || apply.isPending}
        >
          <ArrowLeft aria-hidden />
          Back
        </Button>
        <Button
          onClick={next}
          disabled={(step === 1 && !canContinue) || apply.isPending}
          className='min-w-36'
        >
          {apply.isPending ? <Spinner /> : null}
          {step === 3 ? (apply.isPending ? 'Sending…' : 'Send application') : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
