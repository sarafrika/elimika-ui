'use client';

import { PageHeader } from '@/components/dashboard/page-header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getErrorMessage } from '@/lib/error-utils';
import { formatCount } from '@/lib/metrics';
import { GraduationCap, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDeferredValue, useMemo, useState } from 'react';
import { useClassesEnrollmentsByIds, useInstructorClasses, useInstructorRatingSummaries } from '../../../../hooks/use-batched-lookups';
import { useCreatorInstructors } from './_components/useCreatorInstructors';

export default function InstructorsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const searchTerm = useDeferredValue(search).trim().toLowerCase();

  const {
    instructors,
    courseCount,
    applicationsQuery,
    isLoading,
    hasProfile,
  } = useCreatorInstructors();

  const instructorUuids =
    instructors?.map((instructor) => instructor.uuid) ?? [];

  const { instructorRatingSummariesMap, } = useInstructorRatingSummaries(instructorUuids);
  const { instructorClassesMap, } = useInstructorClasses(instructorUuids);

  // Get all class UUIDs across all instructors
  const classUuids = useMemo(
    () =>
      Object.values(instructorClassesMap ?? {})
        .flatMap((classes) =>
          // @ts-ignore
          classes.map((item) => item?.class_definition?.uuid).filter(Boolean)
        ),
    [instructorClassesMap]
  );

  const { classEnrollmentsMap } = useClassesEnrollmentsByIds(classUuids);

  const filtered = useMemo(
    () =>
      instructors
        .filter((instructor) =>
          [
            instructor.name,
            instructor.profile?.professional_headline,
            ...instructor.courses.map((course) => course.name),
          ].some((value) =>
            value?.toLowerCase().includes(searchTerm)
          )
        )
        .map((instructor) => {
          const classes =
            instructorClassesMap?.[instructor.uuid]?.map(
              // @ts-ignore
              (item) => item?.class_definition
            ) ?? [];

          // Count unique students across all of this instructor's classes
          const uniqueStudentUuids = new Set<string>();

          classes.forEach(classItem => {
            if (!classItem?.uuid) return;

            const enrollments = classEnrollmentsMap.get(classItem.uuid) ?? [];

            enrollments.forEach(enrollment => {
              if (enrollment?.student_uuid) {
                uniqueStudentUuids.add(enrollment.student_uuid);
              }
            });
          });

          const totalStudents = uniqueStudentUuids.size;

          return {
            ...instructor,

            ratingSummary:
              instructorRatingSummariesMap?.[instructor.uuid] ?? {
                instructor_uuid: instructor.uuid,
                average_rating: 0,
                review_count: 0,
              },

            classes,

            totalStudents,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [
      instructors,
      searchTerm,
      instructorRatingSummariesMap,
      instructorClassesMap,
      classEnrollmentsMap,
    ]
  );

  return (
    <main className='mx-auto w-full max-w-[2200px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[2400px]'>
      <PageHeader
        title='Instructors'
        description='Instructors approved to train courses you created.'
        actions={
          <Button variant='outline' asChild>
            <Link href='/dashboard/course-creator/pending-approvals'>Pending approvals</Link>
          </Button>
        }
      />
      <div className='grid gap-4 sm:grid-cols-2'>
        {[
          { label: 'Approved instructors', value: instructors.length },
          { label: 'Courses with approved instructors', value: courseCount },
        ].map(metric => (
          <Card key={metric.label} className='border-l-primary border-l-4'>
            <CardContent className='p-6'>
              {isLoading ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <div className='text-2xl font-bold'>
                  {applicationsQuery.isError ? '—' : formatCount(metric.value, '0')}
                </div>
              )}
              <div className='text-muted-foreground text-xs'>
                {metric.label}
                {applicationsQuery.hasNextPage ? ' (loaded so far)' : ''}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className='relative max-w-md'>
        <Search className='text-muted-foreground absolute top-3 left-3 h-4 w-4' />
        <Input
          aria-label='Search instructors or courses'
          placeholder='Search instructors or courses...'
          value={search}
          onChange={event => setSearch(event.target.value)}
          className='pl-9'
        />
      </div>
      {isLoading && instructors.length === 0 ? (
        <div className='space-y-2'>
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className='h-16 w-full' />
          ))}
        </div>
      ) : applicationsQuery.isError && instructors.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title='Could not load instructors'
          description={getErrorMessage(applicationsQuery.error, 'Please try again.')}
          action={
            <Button variant='outline' onClick={() => applicationsQuery.refetch()}>
              Retry
            </Button>
          }
        />
      ) : !hasProfile ? (
        <EmptyState
          icon={GraduationCap}
          title='Course creator profile unavailable'
          description='A course creator profile is needed to view your instructors.'
        />
      ) : instructors.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title='No approved instructors yet'
          description='Instructors will appear here once their application to train one of your courses is approved.'
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title='No instructors match your search'
          description='Try another instructor or course name, or load more results.'
        />
      ) : (
        <div className='overflow-x-auto rounded-lg border'>
          <Table className='min-w-[1000px]'>
            <TableHeader>
              <TableRow>
                <TableHead>Instructor</TableHead>
                <TableHead>Your courses</TableHead>
                <TableHead className='flex flex-col text-start'>
                  <p>Split Ratio</p>
                  <p>Creator/Instructor</p>
                </TableHead>
                <TableHead>No of Classes</TableHead>
                <TableHead>No of Students</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map(instructor => (
                <TableRow
                  key={instructor.uuid}
                  className='cursor-pointer transition-colors hover:bg-muted/50'
                  onClick={() =>
                    router.push(
                      `/dashboard/course-creator/instructors/${encodeURIComponent(
                        instructor.uuid
                      )}`
                    )
                  }
                >
                  {/* Instructor */}
                  <TableCell className='align-top'>
                    <div className='flex items-center gap-3'>
                      <Avatar className='h-9 w-9 shrink-0'>
                        <AvatarFallback className='bg-primary/10 text-primary text-xs'>
                          {instructor.name
                            .split(' ')
                            .map(part => part[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <p className='font-medium'>{instructor.name}</p>
                        <p className='text-muted-foreground max-w-xs truncate text-xs'>
                          {instructor.profile?.professional_headline || 'Instructor'}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Courses */}
                  <TableCell className='align-top'>
                    <div className='space-y-3'>
                      {instructor.courses.map(course => (
                        <div
                          key={course.uuid}
                          className='min-w-[180px]'
                        >
                          <p className='truncate text-sm font-medium'>
                            {course.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </TableCell>

                  {/* Split Ratio */}
                  <TableCell className='align-top'>
                    <div className='space-y-3'>
                      {instructor.courses.map(course => (
                        <div key={course.uuid} className='h-5'>
                          <Badge variant='outline' className='font-medium'>
                            {course.creator_share_percentage ?? 0}/
                            {course.instructor_share_percentage ?? 0}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </TableCell>

                  {/* Number of Classes */}
                  <TableCell className='align-top'>
                    <div className='space-y-3'>
                      {instructor.courses.map(course => {
                        const courseClasses =
                          instructor.classes?.filter(
                            classItem => classItem.course_uuid === course.uuid
                          ) ?? [];

                        const classCount = courseClasses.length;

                        return (
                          <div
                            key={course.uuid}
                            className='h-5 text-sm text-muted-foreground'
                          >
                            {classCount}{' '}
                            {classCount === 1 ? 'class' : 'classes'}
                          </div>
                        );
                      })}
                    </div>
                  </TableCell>

                  {/* Number of Students */}
                  <TableCell className='align-top'>
                    <div className='space-y-3'>
                      {instructor.courses.map(course => {
                        const courseClasses =
                          instructor.classes?.filter(
                            classItem => classItem.course_uuid === course.uuid
                          ) ?? [];

                        const studentUuids = new Set<string>();

                        courseClasses.forEach(classItem => {
                          const classUuid = classItem.uuid;

                          if (!classUuid) return;

                          const enrollments =
                            classEnrollmentsMap.get(classUuid) ?? [];

                          enrollments.forEach(enrollment => {
                            if (enrollment?.student_uuid) {
                              studentUuids.add(enrollment.student_uuid);
                            }
                          });
                        });

                        const studentCount = studentUuids.size;

                        return (
                          <div
                            key={course.uuid}
                            className='h-5 text-sm text-muted-foreground'
                          >
                            {studentCount}{' '}
                            {studentCount === 1 ? 'student' : 'students'}
                          </div>
                        );
                      })}
                    </div>
                  </TableCell>

                  {/* Rating */}
                  <TableCell className='align-top text-muted-foreground'>
                    {instructor.ratingSummary?.review_count > 0
                      ? `${instructor.ratingSummary.average_rating.toFixed(1)} (${instructor.ratingSummary.review_count
                      } ${instructor.ratingSummary.review_count === 1
                        ? 'review'
                        : 'reviews'
                      })`
                      : 'No reviews'}
                  </TableCell>

                  {/* Status */}
                  <TableCell className='align-top'>
                    <Badge>Approved</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {applicationsQuery.isError && instructors.length > 0 && (
        <EmptyState
          title='Could not refresh all instructors'
          description='The results already loaded are shown above.'
          action={
            <Button variant='outline' onClick={() => applicationsQuery.refetch()}>
              Retry
            </Button>
          }
        />
      )}
      {applicationsQuery.hasNextPage && (
        <div className='flex justify-center'>
          <Button
            variant='outline'
            disabled={applicationsQuery.isFetching}
            onClick={() => applicationsQuery.fetchNextPage()}
          >
            {applicationsQuery.isFetchingNextPage && <Spinner />}Load more
          </Button>
        </div>
      )}
    </main>
  );
}
