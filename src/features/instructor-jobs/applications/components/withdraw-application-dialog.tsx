'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/error-utils';
import type { ClassMarketplaceJobApplication } from '@/services/client';
import { withdrawApplicationMutation } from '@/services/client/@tanstack/react-query.gen';
import { invalidateJobApplicationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';

import { dayAndTime, isFuture, organisationOf, releasedSessions } from '../application-view';

const REASON_LIMIT = 500;

/** Confirms a withdrawal, with an optional reason the organisation sees. */
export function WithdrawApplicationDialog({
  application: requested,
  open,
  onOpenChange,
  onWithdrawn,
}: {
  application: ClassMarketplaceJobApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWithdrawn?: () => void;
}) {
  const queryClient = useQueryClient();
  const reasonId = useId();
  const [reason, setReason] = useState('');
  // Keeps the copy steady while the dialog animates closed after the caller clears it.
  const [application, setApplication] = useState(requested);
  if (requested && requested !== application) setApplication(requested);

  const withdraw = useMutation({
    ...withdrawApplicationMutation(),
    onSuccess: response => {
      if (response?.success === false) {
        toast.error(response.message || 'Unable to withdraw this application.');
        return;
      }
      toast.success('Application withdrawn.');
      setReason('');
      onOpenChange(false);
      onWithdrawn?.();
    },
    onError: error => {
      toast.error(getErrorMessage(error, 'Unable to withdraw this application.'));
    },
    onSettled: () => {
      void invalidateJobApplicationWorkflowQueries(queryClient);
    },
  });

  const job = application?.job;
  const org = organisationOf(job);
  const interview =
    application?.status === 'interviewing' && isFuture(application.interview_at)
      ? dayAndTime(application.interview_at)
      : null;
  const hired = application?.status === 'hired';

  const confirm = () => {
    if (!application?.uuid || !application.job_uuid) {
      toast.error('This application cannot be withdrawn.');
      return;
    }
    const note = reason.trim();
    withdraw.mutate({
      path: { jobUuid: application.job_uuid, applicationUuid: application.uuid },
      body: note ? { review_notes: note } : undefined,
    });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={next => {
        if (withdraw.isPending) return;
        if (!next) setReason('');
        onOpenChange(next);
      }}
    >
      <AlertDialogContent className='sm:max-w-md'>
        <AlertDialogHeader>
          <AlertDialogTitle>Withdraw your application?</AlertDialogTitle>
          <AlertDialogDescription>
            {org} won’t consider you for {job?.title || 'this job'}
            {interview ? `, and your interview on ${interview} is cancelled` : ''}.{' '}
            {hired
              ? `${releasedSessions(job?.session_count, 'blocked')} and the job reopens.`
              : `${releasedSessions(job?.session_count, 'pencilled')}.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className='space-y-2'>
          <Label htmlFor={reasonId}>Reason (optional)</Label>
          <Textarea
            id={reasonId}
            value={reason}
            maxLength={REASON_LIMIT}
            onChange={event => setReason(event.target.value)}
            placeholder={`Let ${org} know why you are withdrawing`}
            aria-describedby={`${reasonId}-hint`}
            disabled={withdraw.isPending}
          />
          <p id={`${reasonId}-hint`} className='text-muted-foreground text-xs'>
            Shared with {org}.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={withdraw.isPending}>Keep application</AlertDialogCancel>
          <Button
            variant='destructive'
            onClick={confirm}
            disabled={withdraw.isPending}
            className='min-w-28'
          >
            {withdraw.isPending ? <Spinner /> : null}
            Withdraw
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
