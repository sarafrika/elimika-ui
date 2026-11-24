'use client';

import Link from 'next/link';

import { SectionError } from '@/components/data/async-section';
import { RateCardGrid } from '@/components/rate-card/rate-card-grid';
import { RateUpdateStatus } from '@/components/rate-card/rate-update-status';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ApplicationStatusBadge } from '@/src/features/rate-card/components/application-status-badge';
import { useTrainingApplication } from '@/src/features/rate-card/hooks';
import { myTrainingApplicationsHref } from '../links';
import type { ApplyItem } from '../types';

/** Reads just the selected item's application, without loading the instructor's other rate cards. */
export function ItemRateCardDialog({
  item,
  open,
  onOpenChange,
}: {
  item: ApplyItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { application, query } = useTrainingApplication(
    item.kind,
    open ? item.uuid : null,
    open ? item.application?.uuid : null
  );
  const failed = query.isError || Boolean(query.data?.error) || query.data?.success === false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-6xl'>
        <DialogHeader className='gap-4 pr-8 sm:flex-row sm:items-start sm:justify-between'>
          <div className='min-w-0 space-y-2'>
            <DialogTitle>{item.title} — rate card</DialogTitle>
            <DialogDescription>
              Your rates per learner for this {item.kind === 'program' ? 'program' : 'course'}.
            </DialogDescription>
          </div>
          <Button asChild variant='outline' className='shrink-0'>
            <Link href={myTrainingApplicationsHref()}>View all rate cards</Link>
          </Button>
        </DialogHeader>
        {query.isLoading ? (
          <Skeleton className='h-72 w-full rounded-lg' aria-label='Loading rate card' />
        ) : failed ? (
          <SectionError
            title='Could not load this rate card'
            error={query.error ?? query.data}
            onRetry={() => void query.refetch()}
          />
        ) : !application?.rate_card ? (
          <EmptyState variant='compact' title='No rate card available for this application' />
        ) : (
          <div className='min-w-0 space-y-4'>
            <ApplicationStatusBadge status={application.status} kind={item.kind} />
            <RateUpdateStatus
              kind={item.kind}
              parentUuid={item.uuid}
              applicationUuid={application.uuid ?? item.application?.uuid ?? ''}
              pendingUpdateUuid={
                application.status === 'approved' ? application.pending_rate_update_uuid : null
              }
            />
            <RateCardGrid
              mode='view'
              value={application.rate_card}
              reviewNotes={application.review_notes}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
