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
  getCourseCreatorByUuidOptions,
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
  const { data: creatorData } = useQuery({
    ...getCourseCreatorByUuidOptions({
      path: { uuid: course?.course_creator_uuid as string },
    }),
    enabled: Boolean(course?.course_creator_uuid),
  });
  const courseCreatorName = (creatorData as any)?.data?.full_name as string | undefined;

  const safeDescription = useMemo(
    () => sanitizeCourseDescription(course?.description) || 'No description provided yet.',
    [course?.description]
  );
  const displayTitle =
    (course?.title as string | undefined) ||
    (course?.name as string | undefined) ||
    'Untitled course';
  const durationLabel = formatDuration(course);
  const categoryBadges = Array.isArray(course?.category_names)
    ? course?.category_names.slice(0, 3)
    : [];
  const objectives = buildListFromText(course?.objectives);
  const prerequisites = buildListFromText(course?.prerequisites);

  if (courseQuery.isLoading) {
    return (
      <div className='bg-background text-foreground min-h-screen'>
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
      <div className='bg-background text-foreground min-h-screen'>
        <PublicTopNav />
        <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:py-16'>
          <Link
            href='/courses'
            className='text-primary inline-flex items-center gap-2 text-sm font-medium hover:underline'
          >
            <ArrowLeft className='h-4 w-4' />
            Back to courses
          </Link>
          <Card className='border-destructive/40 bg-destructive/5'>
            <CardHeader>
              <CardTitle className='text-destructive flex items-center gap-2'>
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
    <div className='bg-background text-foreground min-h-screen'>
      <PublicTopNav />
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:py-16'>
        {/* Back Navigation */}
        <Link
          href='/courses'
          className='text-primary inline-flex items-center gap-2 text-sm font-medium hover:underline'
        >
          <ArrowLeft className='h-4 w-4' />
          Back to courses
        </Link>

        {/* Hero Section */}
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
            {course.level && (
              <Badge
                variant='outline'
                className='border-primary/30 bg-primary/10 text-primary rounded-full border'
              >
                {course.level}
              </Badge>
            )}
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

          {/* Course Meta */}
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
            {lessons.length > 0 && (
              <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                <BookMarked className='text-primary h-5 w-5' />
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
            <Card className='border-border bg-card rounded-[28px] border shadow-lg'>
              <CardHeader>
                <CardTitle className='text-foreground flex items-center gap-2 text-xl'>
                  <Target className='text-primary h-5 w-5' />
                  What you'll learn
                </CardTitle>
              </CardHeader>
              <CardContent>
                {objectives.length > 0 ? (
                  <ul className='grid gap-3 sm:grid-cols-2'>
                    {objectives.map((item, index) => (
                      <li key={index} className='text-muted-foreground flex items-start gap-3'>
                        <CheckCircle2 className='text-primary h-5 w-5 shrink-0' />
                        <span className='text-sm'>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className='text-muted-foreground text-sm'>
                    No objectives provided for this course yet.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Course Curriculum */}
            {lessons.length > 0 && (
              <Card className='border-border bg-card rounded-[28px] border shadow-lg'>
                <CardHeader>
                  <CardTitle className='text-foreground flex items-center gap-2 text-xl'>
                    <BookOpen className='text-primary h-5 w-5' />
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
            <Card className='border-border bg-card rounded-[28px] border shadow-lg'>
              <CardHeader>
                <CardTitle className='text-foreground flex items-center gap-2 text-xl'>
                  <Users className='text-primary h-5 w-5' />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {prerequisites.length > 0 ? (
                  <ul className='text-muted-foreground space-y-2 text-sm'>
                    {prerequisites.map((item, index) => (
                      <li key={index} className='flex items-start gap-3'>
                        <span className='bg-primary mt-1 size-1.5 rounded-full' />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className='text-muted-foreground text-sm'>No prerequisites specified.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Enrollment Card */}
          <div className='lg:col-span-1'>
            <Card className='border-border bg-card sticky top-24 rounded-[28px] border shadow-xl'>
              <CardHeader className='space-y-4'>
                <div className='space-y-2'>
                  <CardTitle className='text-foreground text-2xl'>Course overview</CardTitle>
                  <CardDescription className='text-muted-foreground'>
                    {courseCreatorName
                      ? `Published by ${courseCreatorName}`
                      : 'Publisher not provided'}
                  </CardDescription>
                </div>

                <Separator className='bg-border' />

                {/* Course Info Summary */}
                <div className='space-y-3'>
                  {durationLabel && (
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Duration</span>
                      <span className='text-foreground font-semibold'>{durationLabel}</span>
                    </div>
                  )}
                  {course.level && (
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Level</span>
                      <span className='text-foreground font-semibold'>{course.level}</span>
                    </div>
                  )}
                  {lessons.length > 0 && (
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Lessons</span>
                      <span className='text-foreground font-semibold'>{lessons.length}</span>
                    </div>
                  )}
                  {course.price !== undefined || course.is_free !== undefined ? (
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Pricing</span>
                      <span className='text-foreground font-semibold'>
                        {course.is_free
                          ? 'Free'
                          : typeof course.price === 'number'
                            ? `KES ${course.price.toLocaleString()}`
                            : 'Not set'}
                      </span>
                    </div>
                  ) : null}
                  {course.accepts_new_enrollments !== undefined ? (
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Enrollments</span>
                      <span className='text-foreground font-semibold'>
                        {course.accepts_new_enrollments ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className='space-y-3'>
                <Button
                  size='lg'
                  disabled={!course.is_published || course.accepts_new_enrollments === false}
                  className='bg-primary hover:bg-primary/90 w-full rounded-full text-base font-semibold shadow-lg transition'
                >
                  {course.accepts_new_enrollments === false
                    ? 'Enrollments closed'
                    : course.is_published
                      ? 'Enroll now'
                      : 'Not available'}
                </Button>
                {courseCreatorName ? (
                  <div className='border-border bg-muted/40 text-muted-foreground rounded-[16px] border px-4 py-3 text-xs'>
                    <div className='flex items-center gap-2'>
                      <Calendar className='text-primary h-4 w-4' />
                      <span>Created by {courseCreatorName}</span>
                    </div>
                    {course.updated_date ? (
                      <div className='mt-1 text-[11px]'>
                        Updated on {new Date(course.updated_date).toLocaleDateString()}
                      </div>
                    ) : null}
                  </div>
                ) : null}
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
    <div className='group border-border bg-muted/40 hover:border-primary/40 hover:bg-primary/5 rounded-2xl border p-4 transition'>
      <div className='flex items-start gap-4'>
        <div className='bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold'>
          {index}
        </div>
        <div className='flex-1 space-y-1'>
          <h4 className='text-foreground font-semibold'>{lesson.title}</h4>
          {safeDescription && (
            <div
              className='text-muted-foreground line-clamp-2 text-sm'
              dangerouslySetInnerHTML={{ __html: safeDescription }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function formatDuration(course?: Course | null) {
  if (!course) return null;

  const hasHours = typeof course.duration_hours === 'number';
  const hasMinutes = typeof course.duration_minutes === 'number';

  if (hasHours) {
    const hours = course.duration_hours;
    const minutes = hasMinutes && course.duration_minutes ? course.duration_minutes : 0;
    return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  const weeks = (course as any)?.duration_weeks;
  if (typeof weeks === 'number' && weeks > 0) {
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  }

  return null;
}

function buildListFromText(value?: string | null) {
  if (!value) return [];

  const plain = value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r?\n/g, '\n')
    .trim();

  const parts = plain
    .split(/\n|•|-|\u2022/)
    .map(part => part.replace(/^[\s\-•]+/, '').trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return [plain];
  }

  return parts;
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
