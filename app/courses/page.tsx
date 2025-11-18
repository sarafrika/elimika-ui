'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PublicTopNav } from '@/components/PublicTopNav';
import { getPublishedCoursesOptions } from '@/services/client/@tanstack/react-query.gen';
import type { Course } from '@/services/client';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Clock, GraduationCap, CircleAlert, Layers } from 'lucide-react';
import { useMemo } from 'react';
import Link from 'next/link';

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
        <header className='space-y-6 rounded-[36px] border border-blue-200/40 bg-white/80 p-8 shadow-xl shadow-blue-200/30 backdrop-blur-sm dark:border-blue-500/25 dark:bg-blue-950/40 dark:shadow-blue-900/20 lg:p-12'>
          <div className='inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-blue-600 dark:border-blue-500/40 dark:bg-blue-900/40 dark:text-blue-100'>
            Course Catalogue
          </div>
          <div className='space-y-4'>
            <h1 className='text-3xl font-semibold text-slate-900 dark:text-blue-50 sm:text-4xl'>
              Explore published courses
            </h1>
            <p className='max-w-3xl text-base text-slate-600 dark:text-slate-200'>
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
            <Card className='border-blue-200/60 bg-card/80'>
              <CardHeader className='space-y-3 text-center'>
                <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/40'>
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
    title,
    description,
    level,
    duration_weeks,
    is_published,
  } = course;
  const courseUuid = uuid ?? '';
  const safeDescription = useMemo(
    () =>
      sanitizeCourseDescription(description) ||
      'Comprehensive course designed to help you develop new skills and knowledge.',
    [description]
  );

  return (
    <Card className='group h-full rounded-[28px] border-blue-200/60 bg-white/90 shadow-lg shadow-blue-200/30 transition hover:-translate-y-1 hover:border-blue-400/70 hover:shadow-xl hover:shadow-blue-200/40 dark:border-blue-500/25 dark:bg-blue-950/40 dark:shadow-blue-900/20'>
      <CardHeader className='space-y-3'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex-1 space-y-2'>
            <CardTitle className='line-clamp-2 text-lg font-semibold leading-6 text-slate-900 dark:text-blue-50'>
              {title}
            </CardTitle>
            <div className='flex flex-wrap gap-2'>
              <Badge
                variant={is_published ? 'default' : 'secondary'}
                className='rounded-full text-xs'
              >
                {is_published ? 'Published' : 'Draft'}
              </Badge>
              {level && (
                <Badge
                  variant='outline'
                  className='rounded-full border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-900/40 dark:text-blue-100'
                >
                  {level}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <CardDescription
          className='line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-200'
          dangerouslySetInnerHTML={{ __html: safeDescription }}
        />
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2.5'>
          {duration_weeks && (
            <div className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300'>
              <Clock className='h-4 w-4 text-primary' />
              <span>
                {duration_weeks} {duration_weeks === 1 ? 'week' : 'weeks'} duration
              </span>
            </div>
          )}
          <div className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300'>
            <GraduationCap className='h-4 w-4 text-primary' />
            <span>Expert-led instruction</span>
          </div>
          <div className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300'>
            <Layers className='h-4 w-4 text-primary' />
            <span>Structured learning path</span>
          </div>
        </div>

        <div className='flex items-center justify-between border-t border-blue-200/40 pt-4 dark:border-blue-500/25'>
          <div className='text-sm font-medium text-slate-600 dark:text-slate-300'>
            Learn more
          </div>
          <Link href={courseUuid ? `/courses/${encodeURIComponent(courseUuid)}` : '/courses'}>
            <Button
              size='sm'
              disabled={!is_published || !courseUuid}
              className='rounded-full bg-primary px-6 shadow-lg shadow-blue-200/40 transition hover:bg-primary/90 hover:shadow-xl dark:shadow-blue-900/20'
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
