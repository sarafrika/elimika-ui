import { BookOpen, Clock, GraduationCap, Users } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  formatCourseDuration,
  getCourseDisplayTitle,
  stripRichText,
} from '@/src/features/catalogue/format';
import {
  CATALOGUE_PLACEHOLDER,
  catalogueInitials,
  formatCatalogueCount,
} from '@/src/features/catalogue/prospect';
import type { PublicCourseDetail } from '@/src/features/catalogue/types';

/**
 * The hero band and the stat strip beneath it — one card, as the record view
 * draws it.
 *
 * The gradient is mixed from `--primary` rather than written as hex, so the
 * public catalogue re-hues with the brand exactly as the dashboard record does.
 * The scrim and the text over it are deliberately literal white and a literal
 * near-black: they sit on an always-dark band and must not follow the surface
 * tokens into dark mode.
 *
 * The four stat cells are the ones this response can actually answer. The record
 * view's strip counts content items and names a difficulty level; the public
 * detail carries neither, and a cell that says "—" twice is worse than a cell
 * that says something true, so class size and enrolment take those two places.
 */
export function CourseDetailHero({
  detail,
  className,
}: {
  detail: PublicCourseDetail;
  className?: string;
}) {
  const { course, creator, creatorName, lessons } = detail;

  const title = getCourseDisplayTitle(course);
  const summary = stripRichText(course.description);
  const categories = Array.isArray(course.category_names) ? course.category_names : [];
  const [leadCategory, ...otherCategories] = categories;
  const duration = formatCourseDuration(course);
  const classLimit = course.class_limit;

  return (
    <Card className={cn('gap-0 overflow-hidden py-0', className)}>
      <div
        className='relative h-[172px] sm:h-[200px] lg:h-[244px]'
        style={
          {
            '--course-brand-mid': 'color-mix(in oklch, var(--primary) 78%, black)',
            '--course-brand-deep': 'color-mix(in oklch, var(--primary) 55%, black)',
            backgroundImage: [
              'radial-gradient(120% 140% at 12% 0%, rgb(255 255 255 / 0.22) 0%, rgb(255 255 255 / 0) 55%)',
              'repeating-linear-gradient(115deg, rgb(255 255 255 / 0.05) 0 2px, rgb(255 255 255 / 0) 2px 22px)',
              'linear-gradient(135deg, var(--primary) 0%, var(--course-brand-deep) 100%)',
            ].join(', '),
          } as CSSProperties
        }
      >
        {/* The to-top scrim. It always carries white text, in both themes, so it
            stays this dark whatever the palette does. */}
        <div
          className='absolute inset-0'
          style={{
            backgroundImage:
              'linear-gradient(to top, rgb(7 10 18 / 0.86) 0%, rgb(7 10 18 / 0.42) 46%, rgb(7 10 18 / 0.08) 100%)',
          }}
        />

        <div className='absolute inset-x-0 bottom-0 px-4 py-5 sm:px-7 sm:py-6'>
          {leadCategory || course.status ? (
            <div className='mb-3 flex flex-wrap gap-2'>
              {leadCategory ? <HeroChip variant='solid'>{leadCategory}</HeroChip> : null}
              {otherCategories.map(category => (
                <HeroChip key={category}>{category}</HeroChip>
              ))}
              {course.status ? <HeroChip className='capitalize'>{course.status}</HeroChip> : null}
            </div>
          ) : null}

          <h1 className='max-w-[780px] text-xl leading-[1.15] font-bold tracking-[-0.02em] text-white sm:text-2xl lg:text-[34px]'>
            {title}
          </h1>

          {summary ? (
            <p className='mt-2 line-clamp-2 max-w-[660px] text-sm leading-[1.5] text-white/85 sm:line-clamp-none sm:text-[15px]'>
              {summary}
            </p>
          ) : null}

          {creatorName ? (
            <div className='mt-4 flex flex-wrap items-center gap-x-[18px] gap-y-2 sm:mt-[18px]'>
              <div className='flex items-center gap-2.5'>
                <span className='inline-flex size-9 items-center justify-center rounded-full border-2 border-white/70 bg-[var(--course-brand-mid)] text-xs font-bold text-white'>
                  {catalogueInitials(creatorName)}
                </span>
                <span className='block'>
                  <span className='block text-sm leading-[1.2] font-semibold text-white'>
                    {creatorName}
                  </span>
                  <span className='block text-xs text-white/70'>
                    {creator?.professional_headline || 'Course creator'}
                  </span>
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Stat strip — 1px gaps on the border colour show through as dividers. */}
      <div className='bg-border grid grid-cols-2 gap-px sm:grid-cols-4'>
        <HeroStat
          icon={<BookOpen className='size-5' />}
          label='Lessons'
          value={lessons.length > 0 ? formatCatalogueCount(lessons.length) : CATALOGUE_PLACEHOLDER}
        />
        <HeroStat
          icon={<Clock className='size-5' />}
          label='Total duration'
          value={duration ?? CATALOGUE_PLACEHOLDER}
        />
        <HeroStat
          icon={<Users className='size-5' />}
          label='Class size'
          value={
            typeof classLimit === 'number'
              ? `${formatCatalogueCount(classLimit)} learners`
              : CATALOGUE_PLACEHOLDER
          }
        />
        <HeroStat
          icon={<GraduationCap className='size-5' />}
          label='Enrolment'
          value={
            course.accepts_new_enrollments === undefined
              ? CATALOGUE_PLACEHOLDER
              : course.accepts_new_enrollments
                ? 'Open'
                : 'Closed'
          }
        />
      </div>
    </Card>
  );
}

function HeroChip({
  children,
  variant = 'outline',
  className,
}: {
  children: ReactNode;
  variant?: 'solid' | 'outline';
  className?: string;
}) {
  return (
    // Literal white, like the title above it: these chips sit on the always-dark
    // hero band, so they must not follow the surface tokens into dark mode.
    <span
      className={cn(
        'inline-flex h-[22px] items-center rounded-[10px] px-[9px] text-xs',
        variant === 'solid'
          ? 'bg-white/95 font-semibold text-[var(--course-brand-deep)]'
          : 'border border-white/40 bg-white/12 font-medium text-white',
        className
      )}
    >
      {children}
    </span>
  );
}

function HeroStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className='bg-card flex items-center gap-3 px-4 py-4 sm:px-6'>
      <span className='bg-primary/10 text-primary inline-flex size-10 shrink-0 items-center justify-center rounded-xl'>
        {icon}
      </span>
      <span className='min-w-0'>
        <span className='text-muted-foreground block text-[11px] font-semibold tracking-[0.06em] uppercase'>
          {label}
        </span>
        <span className='mt-0.5 block truncate text-base font-bold'>{value}</span>
      </span>
    </div>
  );
}
