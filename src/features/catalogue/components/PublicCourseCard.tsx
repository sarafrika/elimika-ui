import { Clock, GraduationCap, Layers } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  formatCourseDuration,
  formatPricingLabel,
  getCourseDisplayTitle,
  sanitizeRichText,
} from '@/src/features/catalogue/format';
import type { PublicCatalogueCourse } from '@/src/features/catalogue/types';

export function PublicCourseCard({ item }: { item: PublicCatalogueCourse }) {
  const { course, creatorName, isFree } = item;
  const displayTitle = getCourseDisplayTitle(course);
  const safeDescription = sanitizeRichText(course.description) || 'No description provided yet.';
  const durationLabel = formatCourseDuration(course);
  const courseUuid = course.uuid ?? '';

  return (
    <Card className='group border-border bg-card h-full rounded-[28px] border transition hover:-translate-y-1 hover:shadow-lg'>
      {course.thumbnail_url ? (
        <div className='border-border/60 bg-muted relative aspect-[16/9] w-full overflow-hidden rounded-t-[28px] border-b'>
          <Image
            src={course.thumbnail_url}
            alt={displayTitle}
            fill
            sizes='(min-width: 1024px) 320px, 100vw'
            className='object-cover transition duration-500 group-hover:scale-[1.03]'
            priority={false}
          />
        </div>
      ) : null}
      <CardHeader className='space-y-3'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex-1 space-y-2'>
            <CardTitle className='text-foreground line-clamp-2 text-lg leading-6 font-semibold'>
              {displayTitle}
            </CardTitle>
            <div className='flex flex-wrap gap-2'>
              <Badge
                variant={course.is_published ? 'default' : 'secondary'}
                className='rounded-full text-xs'
              >
                {course.is_published ? 'Published' : 'Draft'}
              </Badge>
              {course.status ? (
                <Badge variant='outline' className='rounded-full text-xs'>
                  {course.status}
                </Badge>
              ) : null}
              {Array.isArray(course.category_names) &&
                course.category_names.slice(0, 2).map(category => (
                  <Badge
                    key={`${courseUuid}-${category}`}
                    variant='secondary'
                    className='rounded-full text-xs'
                  >
                    {category}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
        <CardDescription
          className='text-muted-foreground line-clamp-3 text-sm leading-6'
          dangerouslySetInnerHTML={{ __html: safeDescription }}
        />
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2.5'>
          {durationLabel ? (
            <div className='text-muted-foreground flex items-center gap-2 text-sm'>
              <Clock className='text-primary h-4 w-4' />
              <span>{durationLabel}</span>
            </div>
          ) : null}
          {creatorName ? (
            <div className='text-muted-foreground flex items-center gap-2 text-sm'>
              <GraduationCap className='text-primary h-4 w-4' />
              <span>Created by {creatorName}</span>
            </div>
          ) : null}
          <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-sm'>
            <Layers className='text-primary h-4 w-4' />
            <span className='text-foreground font-semibold'>{formatPricingLabel(item)}</span>
            {course.accepts_new_enrollments === false ? (
              <Badge variant='outline' className='text-xs'>
                Closed
              </Badge>
            ) : (
              <Badge variant='outline' className='text-xs'>
                Enrollments open
              </Badge>
            )}
            {isFree ? (
              <Badge variant='outline' className='text-xs'>
                Free
              </Badge>
            ) : null}
          </div>
        </div>

        <div className='border-border flex items-center justify-between border-t pt-4'>
          <div className='text-muted-foreground text-sm font-medium'>Learn more</div>
          <Button
            size='sm'
            asChild
            disabled={!course.is_published || !courseUuid}
            className='bg-primary hover:bg-primary/90 rounded-full px-6 shadow-lg transition'
          >
            <Link href={courseUuid ? `/courses/${encodeURIComponent(courseUuid)}` : '/courses'}>
              View Course
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
