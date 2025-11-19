'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { PublicTopNav } from '@/components/PublicTopNav';
import {
  getCourseByUuidOptions,
  getCourseLessonsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { Course, CourseLesson } from '@/services/client';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Clock,
  GraduationCap,
  CircleAlert,
  Layers,
  CheckCircle2,
  ArrowLeft,
  Users,
  Calendar,
  Target,
  BookMarked,
} from 'lucide-react';
import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const courseQuery = useQuery({
    ...getCourseByUuidOptions({
      path: { uuid: courseId },
    }),
    retry: 1,
    enabled: !!courseId,
  });

  const lessonsQuery = useQuery({
    ...getCourseLessonsOptions({
      path: { courseUuid: courseId },
      query: {
        pageable: {},
      },
    }),
    retry: 1,
    enabled: !!courseId,
  });

  const course = useMemo(() => courseQuery.data?.data, [courseQuery.data]);
  const lessons = useMemo(() => lessonsQuery.data?.data ?? [], [lessonsQuery.data]);

  const safeDescription = useMemo(
    () =>
      sanitizeCourseDescription(course?.description) ||
      'Comprehensive course designed to help you develop new skills and knowledge.',
    [course?.description]
  );

  if (courseQuery.isLoading) {
    return (
      <div className='min-h-screen bg-background text-foreground'>
        <PublicTopNav />
        <div className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12 lg:py-16'>
          <Skeleton className='h-12 w-48' />
          <Skeleton className='h-[400px] w-full rounded-[36px]' />
          <div className='grid gap-6 lg:grid-cols-3'>
            <Skeleton className='h-[300px] rounded-[28px] lg:col-span-2' />
            <Skeleton className='h-[300px] rounded-[28px]' />
          </div>
        </div>
      </div>
    );
  }

  if (courseQuery.error || !course) {
    return (
      <div className='min-h-screen bg-background text-foreground'>
        <PublicTopNav />
        <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:py-16'>
          <Link
            href='/courses'
            className='inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline'
          >
            <ArrowLeft className='h-4 w-4' />
            Back to courses
          </Link>
          <Card className='border-destructive/40 bg-destructive/5'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-destructive'>
                <CircleAlert className='h-5 w-5' />
                Course not found
              </CardTitle>
              <CardDescription className='text-muted-foreground'>
                The course you're looking for doesn't exist or has been removed.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <PublicTopNav />
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:py-16'>
        {/* Back Navigation */}
        <Link
          href='/courses'
          className='inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline'
        >
          <ArrowLeft className='h-4 w-4' />
          Back to courses
        </Link>

        {/* Hero Section */}
        <header className='space-y-6 rounded-[36px] border border-border bg-card p-8 shadow-xl backdrop-blur-sm lg:p-12'>
          <div className='flex flex-wrap items-center gap-3'>
            <Badge
              variant={course.is_published ? 'default' : 'secondary'}
              className='rounded-full'
            >
              {course.is_published ? 'Published' : 'Draft'}
            </Badge>
            {course.level && (
              <Badge
                variant='outline'
                className='rounded-full border border-primary/30 bg-primary/10 text-primary'
              >
                {course.level}
              </Badge>
            )}
          </div>

          <div className='space-y-4'>
            <h1 className='text-3xl font-semibold text-foreground sm:text-4xl lg:text-5xl'>
              {course.title}
            </h1>
            <div
              className='prose max-w-none text-base text-muted-foreground dark:prose-invert'
              dangerouslySetInnerHTML={{ __html: safeDescription }}
            />
          </div>

          {/* Course Meta */}
          <div className='flex flex-wrap gap-6 pt-4'>
            {course.duration_weeks && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Clock className='h-5 w-5 text-primary' />
                <span className='font-medium'>
                  {course.duration_weeks} {course.duration_weeks === 1 ? 'week' : 'weeks'}
                </span>
              </div>
            )}
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <GraduationCap className='h-5 w-5 text-primary' />
              <span className='font-medium'>Expert-led instruction</span>
            </div>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Layers className='h-5 w-5 text-primary' />
              <span className='font-medium'>Structured learning path</span>
            </div>
            {lessons.length > 0 && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <BookMarked className='h-5 w-5 text-primary' />
                <span className='font-medium'>
                  {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Grid */}
        <div className='grid gap-6 lg:grid-cols-3'>
          {/* Left Column - Course Details */}
          <div className='space-y-6 lg:col-span-2'>
            {/* What You'll Learn */}
            <Card className='rounded-[28px] border border-border bg-card shadow-lg'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-xl text-foreground'>
                  <Target className='h-5 w-5 text-primary' />
                  What you'll learn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className='grid gap-3 sm:grid-cols-2'>
                  {[
                    'Master core concepts and principles',
                    'Apply knowledge to real-world scenarios',
                    'Build practical skills through hands-on exercises',
                    'Gain confidence in your abilities',
                  ].map((item, index) => (
                    <li key={index} className='flex items-start gap-3 text-muted-foreground'>
                      <CheckCircle2 className='h-5 w-5 shrink-0 text-primary' />
                      <span className='text-sm'>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Course Curriculum */}
            {lessons.length > 0 && (
              <Card className='rounded-[28px] border border-border bg-card shadow-lg'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-xl text-foreground'>
                    <BookOpen className='h-5 w-5 text-primary' />
                    Course curriculum
                  </CardTitle>
                  <CardDescription className='text-muted-foreground'>
                    {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'} to help you
                    master the material
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {lessons.map((lesson, index) => (
                      <LessonItem key={lesson.uuid || index} lesson={lesson} index={index + 1} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Requirements */}
            <Card className='rounded-[28px] border border-border bg-card shadow-lg'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-xl text-foreground'>
                  <Users className='h-5 w-5 text-primary' />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2 text-sm text-muted-foreground'>
                  <li className='flex items-start gap-3'>
                    <span className='mt-1 size-1.5 rounded-full bg-primary' />
                    <span>Basic understanding of the subject matter</span>
                  </li>
                  <li className='flex items-start gap-3'>
                    <span className='mt-1 size-1.5 rounded-full bg-primary' />
                    <span>Willingness to learn and practice</span>
                  </li>
                  <li className='flex items-start gap-3'>
                    <span className='mt-1 size-1.5 rounded-full bg-primary' />
                    <span>Access to a computer and internet connection</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Enrollment Card */}
          <div className='lg:col-span-1'>
              <Card className='sticky top-24 rounded-[28px] border border-border bg-card shadow-xl'>
                <CardHeader className='space-y-4'>
                  <div className='space-y-2'>
                    <CardTitle className='text-2xl text-foreground'>
                      Enroll in this course
                    </CardTitle>
                    <CardDescription className='text-muted-foreground'>
                      Start your learning journey today
                    </CardDescription>
                  </div>

                  <Separator className='bg-border' />

                {/* Course Info Summary */}
                <div className='space-y-3'>
                  {course.duration_weeks && (
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Duration</span>
                      <span className='font-semibold text-foreground'>
                        {course.duration_weeks} {course.duration_weeks === 1 ? 'week' : 'weeks'}
                      </span>
                    </div>
                  )}
                  {course.level && (
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Level</span>
                      <span className='font-semibold text-foreground'>
                        {course.level}
                      </span>
                    </div>
                  )}
                  {lessons.length > 0 && (
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Lessons</span>
                      <span className='font-semibold text-foreground'>
                        {lessons.length}
                      </span>
                    </div>
                  )}
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-muted-foreground'>Certificate</span>
                    <span className='font-semibold text-foreground'>
                      Upon completion
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className='space-y-3'>
                <Button
                  size='lg'
                  disabled={!course.is_published}
                  className='w-full rounded-full bg-primary text-base font-semibold shadow-lg transition hover:bg-primary/90'
                >
                  {course.is_published ? 'Enroll Now' : 'Not Available'}
                </Button>
                <Button variant='outline' size='lg' className='w-full rounded-full text-base font-medium'>
                  Contact Instructor
                </Button>

                <div className='space-y-2 pt-4'>
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <Calendar className='h-4 w-4 text-primary' />
                    <span>Flexible start dates available</span>
                  </div>
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <CheckCircle2 className='h-4 w-4 text-primary' />
                    <span>Full lifetime access</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function LessonItem({ lesson, index }: { lesson: CourseLesson; index: number }) {
  const safeDescription = useMemo(
    () => sanitizeCourseDescription(lesson.description),
    [lesson.description]
  );

  return (
    <div className='group rounded-2xl border border-border bg-muted/40 p-4 transition hover:border-primary/40 hover:bg-primary/5'>
      <div className='flex items-start gap-4'>
        <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary'>
          {index}
        </div>
        <div className='flex-1 space-y-1'>
          <h4 className='font-semibold text-foreground'>{lesson.title}</h4>
          {safeDescription && (
            <div
              className='line-clamp-2 text-sm text-muted-foreground'
              dangerouslySetInnerHTML={{ __html: safeDescription }}
            />
          )}
        </div>
      </div>
    </div>
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
