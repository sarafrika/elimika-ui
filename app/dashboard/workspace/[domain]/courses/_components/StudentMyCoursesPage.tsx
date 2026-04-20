'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudent } from '@/context/student-context';
import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import { getCourseCreatorByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useQueries } from '@tanstack/react-query';
import { ArrowRight, BookOpenCheck, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { CoursesCatalogCard } from './CoursesCatalogCard';
import {
  formatDurationFromParts,
  getCardPresentation,
  type CoursesCatalogCardData,
} from './courses-data';

type EnrolledCourseCard = CoursesCatalogCardData & {
  sortTitle: string;
};

export function StudentMyCoursesPage() {
  const student = useStudent();
  const { classDefinitions, loading } = useStudentClassDefinitions(student ?? undefined);

  const creatorIds = useMemo(
    () =>
      Array.from(
        new Set(
          classDefinitions
            .map(item => item.course?.course_creator_uuid)
            .filter((value): value is string => Boolean(value))
        )
      ),
    [classDefinitions]
  );

  const creatorQueries = useQueries({
    queries: creatorIds.map(uuid => ({
      ...getCourseCreatorByUuidOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
      refetchOnWindowFocus: false,
    })),
  });

  const creatorMap = useMemo(() => {
    const map = new Map<string, string>();

    creatorQueries.forEach((query, index) => {
      const uuid = creatorIds[index];
      const name = query.data?.full_name;

      if (uuid && name) {
        map.set(uuid, name);
      }
    });

    return map;
  }, [creatorIds, creatorQueries]);

  const enrolledCourseCards = useMemo<EnrolledCourseCard[]>(() => {
    const cards = new Map<string, EnrolledCourseCard>();

    classDefinitions.forEach((item, index) => {
      const course = item.course;
      const classDetails = item.classDetails;
      const classId = item.uuid;
      const activeEnrollment = item.enrollments.find(
        enrollment => enrollment.enrollment_status !== 'CANCELLED'
      );

      if (!course?.uuid || !activeEnrollment) {
        return;
      }

      const presentation = getCardPresentation(index);
      const existing = cards.get(course.uuid);
      const scheduleCount = item.schedules?.length ?? item.enrollments.length;

      if (existing) {
        return;
      }

      cards.set(course.uuid, {
        id: course.uuid,
        title: course.name,
        provider: creatorMap.get(course.course_creator_uuid) ?? 'Course Creator',
        duration: formatDurationFromParts(
          course.duration_hours,
          course.duration_minutes,
          course.total_duration_display
        ),
        secondaryMeta:
          classDetails?.title ??
          course.category_names?.[0] ??
          (scheduleCount === 1 ? '1 enrolled class' : `${scheduleCount} enrolled classes`),
        ctaLabel: 'Continue',
        ctaKind: 'link',
        showInstructorCta: false,
        detailsHref: buildWorkspaceAliasPath('student', `/dashboard/courses/${course.uuid}`),
        enrollHref: buildWorkspaceAliasPath('student', `/dashboard/schedule/classes/${classId}`),
        instructorHref: buildWorkspaceAliasPath(
          'student',
          `/dashboard/courses/instructor?courseId=${course.uuid}`
        ),
        icon: presentation.icon,
        imageTone: presentation.imageTone,
        imageUrl: course.banner_url ?? course.thumbnail_url,
        sortTitle: course.name,
      });
    });

    return Array.from(cards.values()).sort((left, right) =>
      left.sortTitle.localeCompare(right.sortTitle)
    );
  }, [classDefinitions, creatorMap]);

  const isLoading =
    loading || creatorQueries.some(query => query.isLoading || query.isFetching);

  return (
    <div className='mx-auto w-full max-w-[1680px] bg-background px-3 py-4 sm:px-4 lg:px-6 2xl:px-8'>
      <div className='space-y-7'>
        <section className='border-border bg-card relative overflow-hidden rounded-[20px] border px-4 py-4 sm:px-5 sm:py-5'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div className='min-w-0'>
              <h1 className='text-foreground text-[clamp(1.55rem,2vw,2.2rem)] font-semibold leading-tight tracking-[-0.03em]'>
                My Courses
              </h1>
              <p className='text-muted-foreground mt-1 text-[clamp(0.82rem,1.1vw,1rem)]'>
                Continue the courses and classes you are currently enrolled in.
              </p>
            </div>

            <Button asChild className='h-10 rounded-xl px-4 text-sm font-semibold shadow-none'>
              <Link href='/dashboard/workspace/student/courses'>
                Browse Courses
                <ArrowRight className='size-4' />
              </Link>
            </Button>
          </div>
        </section>

        <section className='space-y-4'>
          <div className='flex items-center justify-between gap-3'>
            <h2 className='text-foreground text-[clamp(1.1rem,1.5vw,1.35rem)] font-semibold tracking-[-0.02em]'>
              Enrolled Courses
            </h2>
            <p className='text-muted-foreground text-xs font-medium sm:text-sm'>
              {enrolledCourseCards.length} course{enrolledCourseCards.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className='border-border bg-card rounded-[16px] border'>
            {isLoading ? (
              <div className='grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3'>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className='h-[268px] rounded-2xl' />
                ))}
              </div>
            ) : enrolledCourseCards.length > 0 ? (
              <div className='p-4'>
                <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                  {enrolledCourseCards.map(({ sortTitle: _sortTitle, ...card }) => (
                    <CoursesCatalogCard key={card.id} card={card} />
                  ))}
                </div>
              </div>
            ) : (
              <div className='px-4 py-14 text-center'>
                <span className='mx-auto inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                  <BookOpenCheck className='size-6' />
                </span>
                <p className='text-foreground mt-4 text-base font-semibold'>
                  No enrolled courses yet
                </p>
                <p className='text-muted-foreground mx-auto mt-2 max-w-md text-sm'>
                  Courses you enroll in will appear here with quick links back to your active
                  classes.
                </p>
                <Button asChild className='mt-5 rounded-xl shadow-none'>
                  <Link href='/dashboard/workspace/student/courses'>
                    <GraduationCap className='size-4' />
                    Enroll in New Course
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
