'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicTopNav } from '@/components/PublicTopNav';
import { getCourseCreatorByUuidOptions, getPublishedCoursesOptions } from '@/services/client/@tanstack/react-query.gen';
import type { Course } from '@/services/client';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Clock, GraduationCap, CircleAlert, Layers } from 'lucide-react';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function PublicCoursesPage() {
  const coursesQuery = useQuery({
    ...getPublishedCoursesOptions({
      query: {
        pageable: {},
      },
    }),
    retry: 1,
  });
  const courses = useMemo(
    () => coursesQuery.data?.data?.content ?? [],
    [coursesQuery.data]
  );

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <PublicTopNav />
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:py-16'>
        <header className='space-y-6 rounded-[36px] border border-border bg-card p-8 shadow-xl backdrop-blur-sm lg:p-12'>
          <div className='inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-primary'>
            Course Catalogue
          </div>
          <div className='space-y-4'>
            <h1 className='text-3xl font-semibold text-foreground sm:text-4xl'>
              Explore published courses
            </h1>
            <p className='max-w-3xl text-base text-muted-foreground'>
              Discover comprehensive courses created by expert instructors. Each course offers
              structured learning paths designed to help you master new skills.
            </p>
          </div>
        </header>

        <section className='space-y-6'>
          {coursesQuery.isLoading ? (
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {[1, 2, 3, 4, 5, 6].map(idx => (
                <Skeleton key={idx} className='h-[360px] w-full rounded-[28px]' />
              ))}
            </div>
          ) : coursesQuery.error ? (
            <Card className='border-destructive/40 bg-destructive/5'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-destructive'>
                  <CircleAlert className='h-4 w-4' />
                  Unable to load courses
                </CardTitle>
                <CardDescription className='text-muted-foreground'>
                  Please refresh the page or try again later. If the issue persists, contact support.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : courses.length === 0 ? (
            <Card className='border-border bg-card/80'>
              <CardHeader className='space-y-3 text-center'>
                <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
                  <BookOpen className='h-6 w-6 text-primary' />
                </div>
                <CardTitle className='text-foreground'>No published courses yet</CardTitle>
                <CardDescription className='text-muted-foreground'>
                  Check back soon for new courses or reach out to explore custom learning opportunities.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <div className='flex items-center justify-between'>
                <div className='text-sm text-muted-foreground'>
                  <span className='font-semibold text-foreground'>{courses.length}</span>{' '}
                  {courses.length === 1 ? 'course' : 'courses'} available
                </div>
              </div>
              <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {courses.map(course => (
                  <CourseCard key={course.uuid} course={course} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  const {
    uuid,
    name,
    title,
    description,
    level,
    duration_weeks,
    duration_hours,
    duration_minutes,
    is_published,
    category_names,
    status,
    price,
    is_free,
    accepts_new_enrollments,
    thumbnail_url,
    course_creator_uuid,
  } = course;
  const courseUuid = uuid ?? '';
  const displayTitle = title || (name as string | undefined) || 'Untitled course';
  const safeDescription = useMemo(
    () =>
      sanitizeCourseDescription(description) ||
      'No description provided yet.',
    [description]
  );
  const durationLabel =
    typeof duration_hours === 'number' && typeof duration_minutes === 'number'
      ? `${duration_hours}h ${duration_minutes}m`
      : duration_weeks
        ? `${duration_weeks} ${duration_weeks === 1 ? 'week' : 'weeks'}`
        : null;
  const { data: courseCreatorData } = useQuery({
    ...getCourseCreatorByUuidOptions({ path: { uuid: course_creator_uuid as string } }),
    enabled: Boolean(course_creator_uuid),
  });
  const courseCreatorName = (courseCreatorData as any)?.data?.full_name as string | undefined;

  return (
    <Card className='group h-full rounded-[28px] border border-border bg-card transition hover:-translate-y-1 hover:shadow-lg'>
      {thumbnail_url ? (
        <div className='relative aspect-[16/9] w-full overflow-hidden rounded-t-[28px] border-b border-border/60 bg-muted'>
          <Image
            src={thumbnail_url}
            alt={title ?? 'Course thumbnail'}
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
            <CardTitle className='line-clamp-2 text-lg font-semibold leading-6 text-foreground'>
              {displayTitle}
            </CardTitle>
            <div className='flex flex-wrap gap-2'>
              <Badge
                variant={is_published ? 'default' : 'secondary'}
                className='rounded-full text-xs'
              >
                {is_published ? 'Published' : 'Draft'}
              </Badge>
              {status ? (
                <Badge variant='outline' className='rounded-full text-xs'>
                  {status}
                </Badge>
              ) : null}
              {level && (
                <Badge
                  variant='outline'
                  className='rounded-full border border-primary/30 bg-primary/10 text-primary'
                >
                  {level}
                </Badge>
              )}
              {Array.isArray(category_names) &&
                category_names.slice(0, 2).map(category => (
                  <Badge key={`${courseUuid}-${category}`} variant='secondary' className='rounded-full text-xs'>
                    {category}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
        <CardDescription
          className='line-clamp-3 text-sm leading-6 text-muted-foreground'
          dangerouslySetInnerHTML={{ __html: safeDescription }}
        />
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2.5'>
          {durationLabel && (
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Clock className='h-4 w-4 text-primary' />
              <span>{durationLabel}</span>
            </div>
          )}
          {courseCreatorName && (
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <GraduationCap className='h-4 w-4 text-primary' />
              <span>Created by {courseCreatorName}</span>
            </div>
          )}
          <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
            <Layers className='h-4 w-4 text-primary' />
            <span className='font-semibold text-foreground'>
              {is_free
                ? 'Free'
                : typeof price === 'number'
                  ? `KES ${price.toLocaleString()}`
                  : 'Pricing not set'}
            </span>
            {accepts_new_enrollments === false ? (
              <Badge variant='outline' className='text-xs'>
                Closed
              </Badge>
            ) : (
              <Badge variant='outline' className='text-xs'>
                Enrollments open
              </Badge>
            )}
          </div>
        </div>

        <div className='flex items-center justify-between border-t border-border pt-4'>
          <div className='text-sm font-medium text-muted-foreground'>
            Learn more
          </div>
          <Link href={courseUuid ? `/courses/${encodeURIComponent(courseUuid)}` : '/courses'}>
            <Button
              size='sm'
              disabled={!is_published || !courseUuid}
              className='rounded-full bg-primary px-6 shadow-lg transition hover:bg-primary/90'
            >
              View Course
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function sanitizeCourseDescription(value?: string | null) {
  if (!value) return '';

  const stripped = value
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/\s(on\w+)\s*=\s*(['"]).*?\2/gi, '')
    .replace(/\s(href|src)\s*=\s*(['"]?)javascript:[^'"]*\2/gi, '');

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return stripped;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(stripped, 'text/html');

    doc.querySelectorAll('script, style').forEach(el => el.remove());
    doc.querySelectorAll<HTMLElement>('*').forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        const name = attr.name.toLowerCase();
        const val = attr.value.trim().toLowerCase();

        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
        } else if ((name === 'href' || name === 'src') && val.startsWith('javascript:')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return doc.body.innerHTML;
  } catch {
    return value;
  }
}
