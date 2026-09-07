import { formatPricingLabel } from '@/src/features/catalogue/format';
import { formatAgeRange, formatCatalogueDate } from '@/src/features/catalogue/prospect';
import type { PublicCourseDetail } from '@/src/features/catalogue/types';
import { RailCard } from './RecordSurfaces';

/**
 * "At a glance" — the label/value rows that answer what a prospect asks first.
 *
 * The record view's prospect row set is Price, Next class starts, Classes open
 * now, Formats, Age range, Assessments, Certificate. The public detail response
 * carries no classes, no formats and no assessments, and a row whose value is
 * not known is **dropped** rather than filled with a zero or a dash — a
 * four-row card is the honest answer, and "Next class starts —" is not.
 *
 * "Last updated" is borrowed from the record's full row set so the freshness the
 * legacy overview card showed keeps a home.
 */
export function CourseGlanceCard({
  detail,
  className,
}: {
  detail: PublicCourseDetail;
  className?: string;
}) {
  const { course } = detail;

  const rows: Array<{ k: string; v: string }> = [];

  rows.push({ k: 'Price', v: formatPricingLabel(detail) });

  const ageRange = formatAgeRange(course.age_lower_limit, course.age_upper_limit);
  if (ageRange) rows.push({ k: 'Age range', v: ageRange });

  rows.push({ k: 'Certificate', v: 'Issued on completion' });

  const updated = formatCatalogueDate(course.updated_date);
  if (updated) rows.push({ k: 'Last updated', v: updated });

  return (
    <RailCard className={className}>
      <h2 className='mb-3 text-sm font-bold'>At a glance</h2>

      <dl className='flex flex-col'>
        {rows.map(row => (
          <div
            key={row.k}
            className='border-border/60 flex items-center justify-between gap-3 border-t py-[7px] text-[12.5px]'
          >
            <dt className='text-muted-foreground'>{row.k}</dt>
            <dd className='text-right font-semibold'>{row.v}</dd>
          </div>
        ))}
      </dl>
    </RailCard>
  );
}
