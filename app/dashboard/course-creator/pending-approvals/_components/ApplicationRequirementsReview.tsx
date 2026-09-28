'use client';

import { useEffect, useState } from 'react';
import { Check, CircleAlert, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { RateCardGrid } from '@/components/rate-card/rate-card-grid';
import { offeredMethods } from '@/lib/rate-card';
import { OfferedVenuesList } from '@/src/features/rate-card/components/application-sections';
import { useDecideApplication } from '@/src/features/rate-card/components/creator-application-review';
import type { TrainingApplicationEntry } from '@/src/features/rate-card/hooks/use-training-application-list';
import { RequirementReviewCard } from './RequirementReviewCard';
import { SkillsWalletReview } from './SkillsWalletReview';
import {
  emptyReviewDraft,
  parseReviewDraft,
  REVIEW_ITEMS,
  reviewDecisionNotes,
  reviewSummary,
} from './requirement-review';

export function ApplicationRequirementsReview({
  entry,
  creatorUuid,
  applicantUuid,
  applicantType,
  canDecide,
  onPendingChange,
  onDecided,
}: {
  entry: TrainingApplicationEntry;
  creatorUuid: string;
  applicantUuid: string;
  applicantType: 'instructor' | 'organisation';
  canDecide: boolean;
  onPendingChange: (pending: boolean) => void;
  onDecided: (status: 'approved' | 'rejected') => void;
}) {
  const { application } = entry;
  const storageKey = `application-review:${creatorUuid}:${entry.kind}:${entry.uuid}:${String(application.updated_date ?? application.created_date ?? '')}`;
  const [draft, setDraft] = useState(() => {
    try {
      return parseReviewDraft(JSON.parse(sessionStorage.getItem(storageKey) ?? 'null'));
    } catch {
      return emptyReviewDraft();
    }
  });
  const [saved, setSaved] = useState(true);
  const { decide, pending, action } = useDecideApplication(
    entry.kind,
    entry.parentUuid,
    entry.uuid
  );
  useEffect(() => {
    onPendingChange(pending);
    return () => onPendingChange(false);
  }, [pending, onPendingChange]);
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(draft));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [draft, storageKey]);

  const { reviewed, allApproved, hasDeclined, hasInfoRequest } = reviewSummary(draft);
  const disabled = pending || !canDecide;
  const methods = offeredMethods(application.rate_card);
  const submit = (decision: 'approve' | 'reject') => {
    if (disabled || (decision === 'approve' ? !allApproved : !hasDeclined || !draft.note.trim()))
      return;
    decide(decision, reviewDecisionNotes(draft), () => {
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* Storage may be unavailable. */
      }
      onDecided(decision === 'approve' ? 'approved' : 'rejected');
    });
  };

  return (
    <div className='space-y-5'>
      <section aria-labelledby='review-requirements-title' className='space-y-3'>
        <div className='flex items-end justify-between gap-3'>
          <div>
            <h3 id='review-requirements-title' className='font-semibold'>
              Submitted requirements
            </h3>
            <p className='text-muted-foreground text-sm'>
              Open each item to view its content, leave a comment and record your review.
            </p>
          </div>
          <span className='shrink-0 text-sm font-medium' aria-live='polite'>
            {reviewed}/{REVIEW_ITEMS.length} reviewed
          </span>
        </div>
        {REVIEW_ITEMS.map((item, index) => (
          <RequirementReviewCard
            key={item.id}
            title={item.title}
            summary={item.summary}
            initiallyOpen={index === 0}
            disabled={disabled}
            review={draft.requirements[item.id]}
            onChange={update =>
              setDraft(previous => ({
                ...previous,
                requirements: {
                  ...previous.requirements,
                  [item.id]: { ...previous.requirements[item.id], ...update },
                },
              }))
            }
          >
            {item.id === 'skills-wallet' &&
              (applicantType === 'instructor' ? (
                <SkillsWalletReview instructorUuid={applicantUuid} />
              ) : (
                <p className='text-muted-foreground text-sm'>
                  No skills wallet is included in this organisation’s application. Review the
                  organisation details above and request any supporting qualifications you need.
                </p>
              ))}
            {item.id === 'training-method' && (
              <div className='space-y-4'>
                {methods.length ? (
                  <div className='flex flex-wrap gap-2'>
                    {methods.map(method => (
                      <Badge key={method.prefix} variant='secondary'>
                        {method.label}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className='text-muted-foreground text-sm'>
                    No training methods were supplied.
                  </p>
                )}
                <p className='text-muted-foreground text-xs'>
                  Training methods are based on the applicant’s proposed rate card.
                </p>
                {applicantType === 'organisation' && (
                  <div className='space-y-2'>
                    <h4 className='text-sm font-medium'>Venues offered</h4>
                    <OfferedVenuesList venues={application.offered_venues} />
                  </div>
                )}
              </div>
            )}
            {item.id === 'target-age-group' && (
              <p className='text-muted-foreground text-sm'>
                No target age group was included in this application.
              </p>
            )}
            {item.id === 'lesson-plan' && (
              <div className='space-y-3'>
                <p className='text-muted-foreground text-sm'>
                  No lesson plan was included in this application.
                </p>
                {application.application_notes && (
                  <div className='bg-card rounded-md border p-3 text-sm'>
                    <p className='font-medium'>Applicant’s supporting note</p>
                    <p className='text-muted-foreground mt-1 whitespace-pre-wrap'>
                      {application.application_notes}
                    </p>
                  </div>
                )}
              </div>
            )}
            {item.id === 'rate-card' && (
              <RateCardGrid
                mode='view'
                value={application.rate_card}
                floorFlags={application.rate_floor_flags}
                minimum={entry.minimum}
              />
            )}
          </RequirementReviewCard>
        ))}
      </section>

      <Card className='border-primary/20'>
        <CardContent className='space-y-4 p-5'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div className='space-y-1'>
              <h3 className='font-semibold'>Approval summary</h3>
              <p className='text-muted-foreground text-sm' aria-live='polite'>
                {allApproved
                  ? 'All requirements are approved. This application is ready for final approval.'
                  : hasDeclined
                    ? 'One or more requirements were declined. Add a decision note before declining the application.'
                    : hasInfoRequest
                      ? 'More information is needed before this application can be approved.'
                      : `${REVIEW_ITEMS.length - reviewed} requirements still need review.`}
              </p>
            </div>
            <Badge variant='outline'>
              {reviewed}/{REVIEW_ITEMS.length} reviewed
            </Badge>
          </div>
          <p className='text-muted-foreground text-xs'>
            {saved
              ? 'Review choices and comments are saved in this browser tab until you submit a final decision.'
              : 'Browser storage is unavailable. Keep this sheet open to retain your review.'}{' '}
            Comments are included with your final decision.
          </p>
          {hasInfoRequest && (
            <p className='border-info/40 bg-info/10 text-foreground rounded-md border p-3 text-sm'>
              Information requests are saved as drafts. Sending them to the applicant is not
              available yet; no request has been sent.
            </p>
          )}
          <div className='grid gap-2'>
            <Label htmlFor='application-decision-note'>Decision note</Label>
            <Textarea
              id='application-decision-note'
              value={draft.note}
              maxLength={1000}
              rows={3}
              disabled={disabled}
              onChange={event => setDraft(previous => ({ ...previous, note: event.target.value }))}
              placeholder='Summarise the final decision for the applicant…'
            />
          </div>
          {!canDecide && (
            <p className='text-destructive text-sm'>
              Only the owner of this {entry.kind} can submit a decision.
            </p>
          )}
          <div className='flex flex-wrap justify-end gap-2'>
            <Button
              variant='outline'
              disabled
              title='Sending information requests is not available yet'
            >
              <CircleAlert className='size-4' />
              Request information
            </Button>
            <Button
              variant='destructive'
              disabled={disabled || !hasDeclined || !draft.note.trim()}
              onClick={() => submit('reject')}
            >
              {pending && action === 'reject' ? <Spinner /> : <X className='size-4' />}Decline
              application
            </Button>
            <Button disabled={disabled || !allApproved} onClick={() => submit('approve')}>
              {pending && action === 'approve' ? <Spinner /> : <Check className='size-4' />}Approve
              application
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
