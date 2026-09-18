'use client';

import { Check, Info } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { RateCardGrid } from '@/components/rate-card/rate-card-grid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { dayjs } from '@/lib/date';
import { rateCardChanges } from '@/lib/rate-card';
import { useDecideRateUpdate } from '../hooks/use-rate-update-mutations';
import type { RateUpdateDecision, TrainingApplicationKind, TrainingRateUpdate } from '../types';

/** A proposed rate card change, compared with the live card, for the owner to decide. */
export function CreatorRateUpdateReview({
  update,
  kind,
  parentUuid,
  title,
}: {
  update: TrainingRateUpdate;
  kind: TrainingApplicationKind;
  parentUuid: string;
  title?: string;
}) {
  const noteId = useId();
  const [note, setNote] = useState('');
  const decide = useDecideRateUpdate(kind, parentUuid);
  const changes = rateCardChanges(update.current_rate_card, update.proposed_rate_card).length;
  const applicantKind = update.applicant_type === 'organisation' ? 'Organisation' : 'Instructor';
  const pending = update.status === 'pending';

  const onDecide = (action: RateUpdateDecision) => {
    if (!update.uuid || !update.application_uuid) return;
    decide.mutate(
      {
        applicationUuid: update.application_uuid,
        updateUuid: update.uuid,
        action,
        reviewNotes: note,
      },
      {
        onSuccess: () => {
          setNote('');
          toast.success(action === 'approve' ? 'Rate update approved.' : 'Rate update rejected.');
        },
        onError: error => toast.error(error.message),
      }
    );
  };

  return (
    <article className='bg-card rounded-xl border'>
      <header className='flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4'>
        <div className='min-w-0'>
          <h2 className='text-foreground text-base font-semibold'>
            {update.applicant_name ?? applicantKind}
          </h2>
          <p className='text-muted-foreground mt-0.5 text-sm'>
            {[
              applicantKind,
              update.created_date
                ? `updated ${dayjs(update.created_date).format('D MMM YYYY')}`
                : null,
              title,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <Badge variant='outline' className='border-warning/50 bg-warning/10 text-foreground'>
          {changes} {changes === 1 ? 'change' : 'changes'}
        </Badge>
      </header>

      <div className='space-y-4 p-5'>
        <p className='border-primary/30 bg-primary/5 text-foreground flex items-start gap-2 rounded-lg border p-3 text-sm'>
          <Info aria-hidden className='text-primary mt-0.5 size-4 shrink-0' />
          Their current rates stay live while you decide. Approving makes these updates live.
        </p>
        <RateCardGrid
          mode='diff'
          value={update.proposed_rate_card}
          compareTo={update.current_rate_card}
        />
        <div className='bg-muted/30 rounded-lg border p-3'>
          <p className='text-muted-foreground text-xs font-medium'>
            Note from the {applicantKind.toLowerCase()}
          </p>
          <p className='text-foreground mt-1 text-sm'>{update.note || 'No note.'}</p>
        </div>

        {pending ? (
          <div className='space-y-3 border-t pt-4'>
            <div className='grid gap-2'>
              <Label htmlFor={noteId}>
                Note to the applicant <span className='text-muted-foreground'>(optional)</span>
              </Label>
              <Textarea
                id={noteId}
                rows={2}
                value={note}
                onChange={event => setNote(event.target.value)}
              />
            </div>
            <div className='flex flex-wrap justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                disabled={decide.isPending}
                onClick={() => onDecide('reject')}
              >
                {decide.isPending && decide.variables?.action === 'reject' ? (
                  <Spinner className='h-4 w-4' />
                ) : null}
                Reject
              </Button>
              <Button type='button' disabled={decide.isPending} onClick={() => onDecide('approve')}>
                {decide.isPending && decide.variables?.action === 'approve' ? (
                  <Spinner className='h-4 w-4' />
                ) : (
                  <Check aria-hidden />
                )}
                Approve changes
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
