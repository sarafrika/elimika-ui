'use client';

import type { Course } from '@/services/client';
import { getCourseByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
import { isAuthenticatedMediaUrl, toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { useQueries } from '@tanstack/react-query';
import { Book } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { Card, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Skeleton } from '../../../../../components/ui/skeleton';
import { useBranchClasses } from './use-branch-classes';

/**
 * Distinct courses taught at this branch — i.e. the courses behind the classes
 * scheduled into this branch's venues. Each card links to the course detail page.
 */
export default function BranchCourses({
  organisationUuid,
  branchUuid,
}: {
  organisationUuid: string;
  branchUuid: string;
}) {
  const { branchClasses, isLoading } = useBranchClasses(organisationUuid, branchUuid);

  const courseUuids = useMemo(() => {
    const set = new Set<string>();
    for (const classDef of branchClasses) {
      if (classDef.course_uuid) set.add(classDef.course_uuid);
    }
    return [...set];
  }, [branchClasses]);

  const courseQueries = useQueries({
    queries: courseUuids.map(uuid => ({
      ...getCourseByUuidOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
    })),
  });

  const courses = courseQueries
    .map(query => query.data?.data as Course | undefined)
    .filter((course): course is Course => Boolean(course?.uuid));

  const coursesLoading = isLoading || courseQueries.some(query => query.isLoading);

  if (coursesLoading && courses.length === 0) {
    return (
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <Skeleton className='h-44 w-full' />
        <Skeleton className='h-44 w-full' />
        <Skeleton className='h-44 w-full' />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className='text-muted-foreground flex flex-col items-center justify-center gap-2 py-12 text-center'>
        <Book className='h-10 w-10' />
        <p className='text-sm'>No courses are taught at this branch yet.</p>
        <p className='text-xs'>
          A course appears here once one of its classes is scheduled into a venue at this branch.
        </p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {courses.map(course => (
        <Link
          key={course.uuid}
          href={`/dashboard/course-management/preview/${course.uuid}`}
          className='group'
        >
          <Card className='hover:border-primary/50 h-full gap-0 overflow-hidden py-0 transition-colors'>
            {course.thumbnail_url && course.thumbnail_url.length > 0 ? (
              <Image
                width={320}
                height={160}
                alt={course.name}
                src={toAuthenticatedMediaUrl(course.thumbnail_url) || course.thumbnail_url}
                className='h-32 w-full object-cover'
                unoptimized={isAuthenticatedMediaUrl(toAuthenticatedMediaUrl(course.thumbnail_url))}
              />
            ) : (
              <div className='bg-muted flex h-32 items-center justify-center'>
                <Book className='text-muted-foreground h-10 w-10' />
              </div>
            )}
            <CardHeader className='py-4'>
              <CardTitle className='text-base group-hover:underline'>{course.name}</CardTitle>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
