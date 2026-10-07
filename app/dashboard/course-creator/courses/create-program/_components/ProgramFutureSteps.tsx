'use client';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/ui/spinner';
import { formatProgramTrainingFee, type ProgramRevenueShares } from '../program-pricing';
import type { PendingProgramMedia, ProgramMediaKey } from '../save-program-media';
import { ProgramTextField } from './ProgramFields';
import { ProgramMediaUpload } from './ProgramMediaUpload';

export { ProgramAssessment } from './ProgramAssessment';

export { ProgramEvaluation } from './ProgramEvaluation';

export function ProgramBranding({
  files,
  onSelect,
}: {
  files: PendingProgramMedia;
  onSelect: (key: ProgramMediaKey, file?: File) => void;
}) {
  return (
    <div className='space-y-6'>
      {/* <div className='space-y-2'>
        <h3 className='text-sm font-medium'>Program identity</h3>
        <div className='grid gap-4 md:grid-cols-2'>
          <DraftField name='brandName' label='Brand name' placeholder='e.g. Elimika Music School' />
          <DraftField
            name='tagline'
            label='Tagline'
            placeholder='One short line about the program'
          />
          <DraftField name='logoUrl' label='Logo URL' placeholder='https://…' type='url' />
          <DraftField name='coverUrl' label='Cover image URL' placeholder='https://…' type='url' />
        </div>
      </div> */}
      <ProgramMediaUpload files={files} onSelect={onSelect} />
    </div>
  );
}

export function ProgramPricing({
  revenueShares,
  isLoading,
  onRetry,
}: {
  revenueShares: ProgramRevenueShares | undefined;
  isLoading: boolean;
  onRetry: () => void;
}) {
  return (
    <section className='space-y-4' aria-label='Program pricing'>
      <h3 className='text-sm font-medium'>Pricing</h3>
      <div className='max-w-sm'>
        <ProgramTextField
          name='price'
          label='Program price (KES)'
          type='number'
          min={0}
          placeholder='Enter 0 for a free program'
        />
      </div>
      <p className='text-muted-foreground text-xs'>
        This is the total program price. Leave it blank for an unpriced draft, or enter 0 for free.
      </p>
      {isLoading ? (
        <p role='status' className='text-muted-foreground flex items-center gap-2 text-sm'>
          <Spinner /> Loading course revenue shares…
        </p>
      ) : !revenueShares ? (
        <EmptyState
          variant='compact'
          title='Unable to calculate revenue shares'
          description='Reload the selected course data to calculate the split.'
          action={
            <Button type='button' variant='outline' onClick={onRetry}>
              Try again
            </Button>
          }
        />
      ) : (
        <div className='grid max-w-2xl gap-4 sm:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='program-instructor-share'>Instructor share (%)</Label>
            <Input id='program-instructor-share' value={revenueShares.instructorShare} readOnly />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='program-creator-share'>Creator share (%)</Label>
            <Input id='program-creator-share' value={revenueShares.creatorShare} readOnly />
          </div>
          <p className='text-muted-foreground text-xs sm:col-span-2'>
            Shares are calculated from the selected courses, weighted by their minimum training fees
            ({formatProgramTrainingFee(revenueShares.totalMinimumFee)} combined). When every fee is
            zero, each course has equal weight.
          </p>
        </div>
      )}
      <p className='text-muted-foreground text-xs'>
        The program price is saved. Revenue shares are calculated from course data; the program API
        does not store a separate split.
      </p>
    </section>
  );
}
