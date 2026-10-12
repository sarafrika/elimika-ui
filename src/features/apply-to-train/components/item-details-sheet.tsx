'use client';

import { TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { Fragment } from 'react';

import { SectionError } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRateAmount } from '@/lib/rate-card';
import { usePlanLessons } from '../age-groups/use-plan-lessons';
import { trackApplicationHref } from '../links';
import { type ApplyItem, ageRangeLabel, isLocked, kindNoun } from '../types';
import { useItemRequirements } from '../use-item-requirements';

/** Everything about one catalogue item before choosing it: lessons, requirements, ages. */
export function ItemDetailsSheet({
  item,
  selected,
  onOpenChange,
  onChoose,
}: {
  item: ApplyItem | null;
  selected: boolean;
  onOpenChange: (open: boolean) => void;
  onChoose: (item: ApplyItem) => void;
}) {
  const open = item !== null;
  const plan = usePlanLessons(open ? item.kind : null, open ? item.uuid : null);
  const requirements = useItemRequirements(open ? item.kind : null, open ? item.uuid : null, open);
  const locked = item ? isLocked(item) : false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-lg'>
        {item ? (
          <>
            <SheetHeader className='border-b'>
              <p className='text-primary text-xs font-semibold tracking-wider uppercase'>
                {item.kind === 'program' ? 'Programme details' : 'Course details'}
              </p>
              <SheetTitle className='text-lg'>{item.title}</SheetTitle>
              <SheetDescription className='sr-only'>
                Lessons, requirements and ages for this {kindNoun(item.kind)}.
              </SheetDescription>
              <div className='flex flex-wrap gap-1.5 pt-1'>
                {item.code ? (
                  <Badge variant='secondary' className='font-mono'>
                    {item.code}
                  </Badge>
                ) : null}
                {item.category ? <Badge variant='secondary'>{item.category}</Badge> : null}
                <Badge variant='secondary'>Ages {ageRangeLabel(item.ageMin, item.ageMax)}</Badge>
                {item.creator ? <Badge variant='secondary'>by {item.creator}</Badge> : null}
                {item.minimumFee ? (
                  <Badge variant='secondary'>Min fee {formatRateAmount(item.minimumFee)}</Badge>
                ) : null}
              </div>
            </SheetHeader>

            <div className='space-y-6 px-4 pb-6'>
              <section className='space-y-2'>
                <h3 className='text-foreground font-semibold'>Lessons</h3>
                {plan.error ? (
                  <SectionError title='Couldn’t load the lessons' error={plan.error} onRetry={plan.refetch} />
                ) : plan.loading ? (
                  <ListSkeleton />
                ) : plan.lessons.length === 0 ? (
                  <p className='text-muted-foreground text-sm'>No active lessons yet.</p>
                ) : (
                  <ol className='text-sm'>
                    {plan.lessons.map((lesson, index) => (
                      <Fragment key={lesson.uuid}>
                        {lesson.courseTitle &&
                        plan.lessons[index - 1]?.courseUuid !== lesson.courseUuid ? (
                          <li className='text-primary pt-3 pb-1 text-xs font-semibold tracking-wide uppercase'>
                            {lesson.courseTitle}
                          </li>
                        ) : null}
                        <li className='flex gap-3 border-t py-2'>
                          <span className='text-muted-foreground w-6 font-mono'>{lesson.number}</span>
                          {lesson.title}
                        </li>
                      </Fragment>
                    ))}
                  </ol>
                )}
              </section>

              <section className='space-y-2'>
                <h3 className='text-foreground font-semibold'>Requirements</h3>
                {requirements.error ? (
                  <SectionError
                    title='Couldn’t load the requirements'
                    error={requirements.error}
                    onRetry={requirements.refetch}
                  />
                ) : requirements.loading ? (
                  <ListSkeleton />
                ) : (
                  <RequirementNames
                    names={
                      item.kind === 'program'
                        ? requirements.programRequirements.map(row => row.requirement_text)
                        : requirements.courseRequirements.map(row => row.name)
                    }
                  />
                )}
              </section>

              {locked ? (
                <div className='space-y-3'>
                  <p className='bg-warning/10 text-foreground flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm'>
                    <TriangleAlert aria-hidden className='text-warning mt-0.5 size-4 shrink-0' />
                    {item.application?.status === 'approved'
                      ? `You’re already approved to train this ${kindNoun(item.kind)}.`
                      : `You have an application waiting for review on this ${kindNoun(item.kind)}.`}
                  </p>
                  <Button asChild variant='outline' className='w-full'>
                    <Link href={trackApplicationHref(item.kind, item.uuid)}>
                      {item.application?.status === 'approved' ? 'View approval' : 'Track application'}
                    </Link>
                  </Button>
                </div>
              ) : selected ? null : (
                <Button type='button' className='h-11 w-full' onClick={() => onChoose(item)}>
                  Choose this {kindNoun(item.kind)}
                </Button>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function RequirementNames({ names }: { names: string[] }) {
  if (names.length === 0) return <p className='text-muted-foreground text-sm'>None.</p>;
  return (
    <ul className='text-sm'>
      {names.map((name, index) => (
        <li key={`${name}-${index}`} className='border-t py-2'>
          {name}
        </li>
      ))}
    </ul>
  );
}

function ListSkeleton() {
  return (
    <div className='space-y-2'>
      {[0, 1, 2].map(row => (
        <Skeleton key={row} className='h-8 w-full' />
      ))}
    </div>
  );
}
