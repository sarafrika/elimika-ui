import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCourseDuration, formatPricingLabel } from '@/src/features/catalogue/format';
import { formatCatalogueCount, PROSPECT_ENROL_NOTE } from '@/src/features/catalogue/prospect';
import type { PublicCourseDetail } from '@/src/features/catalogue/types';
import { RailCard } from './RecordSurfaces';

/**
 * The enrol panel — the price, the way in, and what the money buys.
 *
 * The panel takes the price the catalogue item carried and no more: a course
 * with no published price says so rather than rendering a zero.
 *
 * The button keeps the legacy page's rules exactly — enabled only for a
 * published course still accepting enrolments, and carrying the same three
 * labels. It is not yet wired to a checkout: the public catalogue has never had
 * one, and inventing a destination here would be worse than the honest dead
 * control the legacy page shipped. See the unit's report.
 */
export function CourseEnrolPanel({
  detail,
  className,
}: {
  detail: PublicCourseDetail;
  className?: string;
}) {
  const { course, lessons, priceAmount, isFree } = detail;

  const hasPrice = isFree || typeof priceAmount === 'number';
  const duration = formatCourseDuration(course);
  const closed = course.accepts_new_enrollments === false;
  const unavailable = closed || !course.is_published;

  const inclusions = [
    lessons.length > 0
      ? [`${formatCatalogueCount(lessons.length)} lesson${lessons.length === 1 ? '' : 's'}`, duration]
          .filter(Boolean)
          .join(' · ')
      : undefined,
    'Certificate issued on completion',
  ].filter((line): line is string => Boolean(line));

  return (
    <RailCard className={cn('border-primary/30', className)}>
      {hasPrice ? (
        <div className='flex items-baseline justify-between gap-2.5'>
          <span className='text-[26px] font-extrabold tracking-[-0.03em]'>
            {formatPricingLabel(detail)}
          </span>
          <span className='text-muted-foreground text-xs'>full course</span>
        </div>
      ) : (
        <div>
          <span className='block text-sm font-bold'>No price published yet</span>
          <p className='text-muted-foreground mt-1 text-xs leading-[1.5]'>
            Enrolment opens once a provider publishes a price for this course.
          </p>
        </div>
      )}

      <div className='mt-[13px] flex flex-col gap-2'>
        <Button
          disabled={unavailable}
          className='h-[42px] w-full rounded-xl text-[14.5px] font-bold'
        >
          {closed ? 'Enrollments closed' : course.is_published ? 'Enroll now' : 'Not available'}
        </Button>
      </div>

      {inclusions.length > 0 ? (
        <ul className='border-border/60 mt-[13px] flex flex-col gap-[7px] border-t pt-3'>
          {inclusions.map(line => (
            <li key={line} className='text-foreground/80 flex items-center gap-2 text-[12.5px]'>
              <Check className='text-success size-3.5 flex-none stroke-[2.4]' aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      ) : null}

      <p className='text-muted-foreground mt-3 text-[11.5px] leading-[1.5]'>{PROSPECT_ENROL_NOTE}</p>
    </RailCard>
  );
}
