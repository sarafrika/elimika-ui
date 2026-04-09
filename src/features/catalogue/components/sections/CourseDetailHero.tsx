import { BookMarked, Clock, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  formatCourseDuration,
  getCourseDisplayTitle,
  sanitizeRichText,
} from '@/src/features/catalogue/format';
import type { PublicCourseDetail } from '@/src/features/catalogue/types';

export function CourseDetailHero({ detail }: { detail: PublicCourseDetail }) {
  const { course, lessons } = detail;
  const safeDescription = sanitizeRichText(course.description) || 'No description provided yet.';
  const displayTitle = getCourseDisplayTitle(course);
  const durationLabel = formatCourseDuration(course);
  const categoryBadges = Array.isArray(course.category_names)
    ? course.category_names.slice(0, 3)
    : [];

  return (
    <header className='border-border bg-card space-y-6 rounded-[36px] border p-8 shadow-xl backdrop-blur-sm lg:p-12'>
      <div className='flex flex-wrap items-center gap-3'>
        <Badge variant={course.is_published ? 'default' : 'secondary'} className='rounded-full'>
          {course.is_published ? 'Published' : 'Draft'}
        </Badge>
        {course.status ? (
          <Badge variant='outline' className='rounded-full'>
            {course.status}
          </Badge>
        ) : null}
        {categoryBadges.map(category => (
          <Badge key={category} variant='secondary' className='rounded-full'>
            {category}
          </Badge>
        ))}
      </div>

      <div className='space-y-4'>
        <h1 className='text-foreground text-3xl font-semibold sm:text-4xl lg:text-5xl'>
          {displayTitle}
        </h1>
        <div
          className='prose text-muted-foreground dark:prose-invert max-w-none text-base'
          dangerouslySetInnerHTML={{ __html: safeDescription }}
        />
      </div>

      <div className='flex flex-wrap gap-6 pt-4'>
        {durationLabel ? (
          <div className='text-muted-foreground flex items-center gap-2 text-sm'>
            <Clock className='text-primary h-5 w-5' />
            <span className='font-medium'>{durationLabel}</span>
          </div>
        ) : null}
        {course.accepts_new_enrollments !== undefined ? (
          <div className='text-muted-foreground flex items-center gap-2 text-sm'>
            <Layers className='text-primary h-5 w-5' />
            <span className='font-medium'>
              {course.accepts_new_enrollments ? 'Accepting enrollments' : 'Enrollments closed'}
            </span>
          </div>
        ) : null}
        {lessons.length > 0 ? (
          <div className='text-muted-foreground flex items-center gap-2 text-sm'>
            <BookMarked className='text-primary h-5 w-5' />
            <span className='font-medium'>
              {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
            </span>
          </div>
        ) : null}
      </div>
    </header>
  );
}
