'use client';

import { Check } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CourseCatalogCardLayout } from '@/src/features/dashboard/courses/shared/_components/CourseCatalogCardLayout';
import { getCardPresentation } from '@/src/features/dashboard/courses/shared/_components/courses-data';
import { trackApplicationHref } from '../links';
import { type ApplyItem, ageRangeLabel, canReapply } from '../types';

const ItemRateCardDialog = dynamic(() =>
  import('./item-rate-card-dialog').then(module => module.ItemRateCardDialog)
);

const STATUS_LABEL = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  revoked: 'Revoked',
} as const;

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;

/** One catalogue result on the shared catalogue card shell. */
export function ApplyItemCard({
  item,
  index,
  selected,
  onDetails,
  onChoose,
}: {
  item: ApplyItem;
  index: number;
  selected: boolean;
  onDetails: () => void;
  onChoose: () => void;
}) {
  const presentation = getCardPresentation(index);
  const status = item.application?.status;
  const reapply = canReapply(item);
  const [rateCardOpen, setRateCardOpen] = useState(false);

  return (
    <div
      className={cn(
        'relative rounded-2xl',
        selected && 'ring-primary ring-offset-background ring-2 ring-offset-2'
      )}
    >
      <CourseCatalogCardLayout
        showRating={false}
        videoButtonPosition='top'
        onDetails={onDetails}
        card={{
          contentKind: item.kind,
          title: item.title,
          provider: item.creator ?? '',
          icon: presentation.icon,
          imageTone: presentation.imageTone,
          imageUrl: item.thumbnailUrl ?? undefined,
          videoUrl: item.introVideoUrl ?? undefined,
          description: [item.code, item.category].filter(Boolean).join(' · ') || undefined,
        }}
        badges={
          <div className='flex flex-wrap gap-1.5'>
            {item.kind === 'course' ? (
              <Badge variant='secondary' className='rounded-full'>
                Course
              </Badge>
            ) : null}
            {item.lessonCount !== null ? (
              <Badge variant='secondary' className='rounded-full'>
                {plural(item.lessonCount, 'lesson')}
              </Badge>
            ) : null}
            <Badge variant='secondary' className='rounded-full'>
              Ages {ageRangeLabel(item.ageMin, item.ageMax)}
            </Badge>
            {item.matchesSkills ? (
              <Badge className='bg-primary/10 text-primary rounded-full'>Matches your skills</Badge>
            ) : null}
          </div>
        }
        stats={
          <>
            <span>
              {item.requirementCount
                ? plural(item.requirementCount, 'requirement')
                : 'No requirements'}
            </span>
            {item.courseCount ? <span>{plural(item.courseCount, 'course')}</span> : null}
          </>
        }
      >
        <div className='grid w-full gap-2'>
          {status === 'approved' ? (
            <>
              <Button type='button' className='w-full' onClick={onDetails}>
                View approval
              </Button>
              <Button
                type='button'
                variant='outline'
                className='w-full'
                aria-haspopup='dialog'
                onClick={() => setRateCardOpen(true)}
              >
                View rate cards
              </Button>
            </>
          ) : status === 'pending' ? (
            <Button asChild variant='outline' className='w-full'>
              <Link href={trackApplicationHref(item.kind, item.uuid)}>Track application</Link>
            </Button>
          ) : (
            <>
              <Button type='button' className='w-full' onClick={onChoose} aria-pressed={selected}>
                {reapply ? (
                  'Reapply'
                ) : selected ? (
                  <>
                    <Check aria-hidden /> Selected
                  </>
                ) : (
                  'Apply'
                )}
              </Button>
              {status === 'revoked' ? (
                <Button asChild variant='outline' className='w-full'>
                  <Link href={trackApplicationHref(item.kind, item.uuid)}>Track application</Link>
                </Button>
              ) : null}
            </>
          )}
        </div>
      </CourseCatalogCardLayout>

      {selected ? (
        <span
          className={cn(
            'bg-primary text-primary-foreground pointer-events-none absolute top-3 z-20 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm',
            item.introVideoUrl ? 'right-14' : 'right-3'
          )}
        >
          <Check aria-hidden className='size-3.5' />
          Selected
        </span>
      ) : null}
      {status ? (
        <span
          className={cn(
            'bg-card pointer-events-none absolute top-3 left-3 z-20 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm',
            status === 'approved' && 'text-success',
            status === 'pending' && 'text-warning',
            reapply && 'text-destructive'
          )}
        >
          {STATUS_LABEL[status]}
        </span>
      ) : null}
      {rateCardOpen ? <ItemRateCardDialog item={item} open onOpenChange={setRateCardOpen} /> : null}
    </div>
  );
}
