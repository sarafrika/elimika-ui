'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CourseCatalogCardLayout } from '@/src/features/dashboard/courses/shared/_components/CourseCatalogCardLayout';
import { getCardPresentation } from '@/src/features/dashboard/courses/shared/_components/courses-data';
import { trackApplicationHref } from '../links';
import { type ApplyItem, ageRangeLabel, isLocked } from '../types';

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
  const locked = isLocked(item);
  const status = item.application?.status;
  const reapply = status === 'rejected' || status === 'revoked';

  return (
    <div className={cn('relative rounded-2xl', selected && 'ring-primary ring-2 ring-offset-2 ring-offset-background')}>
      <CourseCatalogCardLayout
        showRating={false}
        card={{
          contentKind: item.kind,
          title: item.title,
          provider: item.creator ?? '',
          icon: presentation.icon,
          imageTone: presentation.imageTone,
          imageUrl: item.thumbnailUrl ?? undefined,
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
        <div className='grid grid-cols-[1fr_2fr] gap-2'>
          <Button type='button' variant='outline' onClick={onDetails}>
            Details
          </Button>
          {locked && item.application ? (
            <Button asChild variant='outline'>
              <Link href={trackApplicationHref(item.kind, item.uuid)}>
                {status === 'approved' ? 'View approval' : 'Track application'}
              </Link>
            </Button>
          ) : (
            <Button type='button' onClick={onChoose} aria-pressed={selected}>
              {selected ? (
                <>
                  <Check aria-hidden /> Selected
                </>
              ) : reapply ? (
                'Reapply'
              ) : (
                'Choose'
              )}
            </Button>
          )}
        </div>
      </CourseCatalogCardLayout>

      {selected ? (
        <span className='bg-primary text-primary-foreground absolute top-3 right-3 z-20 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm'>
          <Check aria-hidden className='size-3.5' />
          Selected
        </span>
      ) : null}
      {status ? (
        <span
          className={cn(
            'bg-card absolute top-3 left-3 z-20 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm',
            status === 'approved' && 'text-success',
            status === 'pending' && 'text-warning',
            reapply && 'text-destructive'
          )}
        >
          {STATUS_LABEL[status]}
        </span>
      ) : null}
    </div>
  );
}
