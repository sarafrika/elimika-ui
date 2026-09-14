'use client';

import { PageHeader } from '@/components/dashboard/page-header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { useInstructorsByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getClassDefinitionsForOrganisationOptions,
  getClassDefinitionsForOrganisationQueryKey,
  getOrganisationByUuidOptions,
  getOrganisationByUuidQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { stripHtml } from '@/src/features/dashboard/courses/shared/_components/courses-data';
import { skipToken, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building2, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { organisationCourseInstructors } from '../../../instructors/_components/organisation-data';
import { useCreatorOrganisations } from '../../../instructors/_components/useCreatorOrganisations';
import Loading from '../loading';

const directoryHref = '/dashboard/course-creator/instructors?type=organisation';

export default function OrganisationDetails({ organisationUuid }: { organisationUuid: string }) {
  const { courseIds, courseMap, groups, applicationsQuery, hasError, hasProfile, isLoading } =
    useCreatorOrganisations(organisationUuid);
  const hasApproval = groups.some(group => group.uuid === organisationUuid);
  const profileQuery = useQuery({
    ...(organisationUuid && hasApproval
      ? getOrganisationByUuidOptions({ path: { uuid: organisationUuid } })
      : {
          queryKey: getOrganisationByUuidQueryKey({ path: { uuid: organisationUuid } }),
          queryFn: skipToken,
        }),
    enabled: Boolean(organisationUuid && hasApproval),
    staleTime: STALE_TIMES.reference,
  });
  const classesQuery = useQuery({
    ...(organisationUuid && hasApproval
      ? getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } })
      : {
          queryKey: getClassDefinitionsForOrganisationQueryKey({ path: { organisationUuid } }),
          queryFn: skipToken,
        }),
    enabled: Boolean(organisationUuid && hasApproval),
    staleTime: STALE_TIMES.live,
  });
  const organisation =
    profileQuery.data?.error || profileQuery.data?.success === false
      ? undefined
      : profileQuery.data?.data;
  const classesFailed =
    classesQuery.isError ||
    Boolean(classesQuery.data?.error) ||
    classesQuery.data?.success === false;
  const attachedByCourse = useMemo(
    () =>
      organisationCourseInstructors(
        classesFailed ? [] : (classesQuery.data?.data ?? []),
        organisationUuid,
        courseIds
      ),
    [classesFailed, classesQuery.data, organisationUuid, courseIds]
  );
  const instructorIds = useMemo(
    () => [
      ...new Set([...attachedByCourse.values()].flatMap(instructors => [...instructors.keys()])),
    ],
    [attachedByCourse]
  );
  const { instructorMap, isLoading: instructorsLoading } = useInstructorsByIds(instructorIds);

  if (isLoading || profileQuery.isLoading) return <Loading />;

  return (
    <main className='mx-auto w-full max-w-[2200px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[2400px]'>
      <Button variant='ghost' size='sm' asChild>
        <Link href={directoryHref}>
          <ArrowLeft className='size-4' />
          Back to organisations
        </Link>
      </Button>
      {!hasProfile ? (
        <EmptyState
          icon={Building2}
          title='Course creator profile unavailable'
          description='A course creator profile is needed to view this organisation.'
        />
      ) : hasError ? (
        <EmptyState
          icon={Building2}
          title='Could not load approved courses'
          description='Please retry to view this organisation’s approved courses.'
          action={
            <Button variant='outline' onClick={() => applicationsQuery.refetch()}>
              Retry
            </Button>
          }
        />
      ) : !hasApproval ? (
        <EmptyState
          icon={Building2}
          title='No approved courses for this organisation'
          description='This organisation has no approved applications to train your courses.'
        />
      ) : !organisation ? (
        <EmptyState
          icon={Building2}
          title='Organisation details unavailable'
          description='The organisation profile could not be loaded.'
          action={
            <Button variant='outline' onClick={() => profileQuery.refetch()}>
              Retry
            </Button>
          }
        />
      ) : (
        <>
          <PageHeader
            title={organisation.name}
            description='Organisation details and instructors attached to your approved courses.'
          />
          <Card>
            <CardHeader>
              <div className='flex flex-wrap items-center gap-2'>
                <CardTitle>Organisation details</CardTitle>
                <Badge>Approved to train</Badge>
                <Badge variant='outline'>{organisation.active ? 'Active' : 'Inactive'}</Badge>
                {organisation.admin_verified && (
                  <Badge variant='secondary'>Verified organisation</Badge>
                )}
              </div>
              <CardDescription>
                {stripHtml(organisation.description) || 'No description provided.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className='grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>
                {[
                  ['Location', organisation.location || 'Not provided'],
                  ['Country', organisation.country || 'Not provided'],
                  ['Licence / registration', organisation.licence_no || 'Not provided'],
                  [
                    'Approved courses',
                    `${courseIds.length}${applicationsQuery.hasNextPage ? ' (loaded so far)' : ''}`,
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className='text-muted-foreground text-xs'>{label}</dt>
                    <dd className='mt-1 text-sm font-medium break-words'>{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
          <div className='space-y-1'>
            <h2 className='text-xl font-semibold'>Approved courses & attached instructors</h2>
            <p className='text-muted-foreground text-sm'>
              Instructors assigned to this organisation’s classes for each course.
            </p>
          </div>
          {classesFailed && (
            <EmptyState
              title='Could not load attached instructors'
              description='Class assignments are currently unavailable.'
              action={
                <Button variant='outline' onClick={() => classesQuery.refetch()}>
                  Retry
                </Button>
              }
            />
          )}
          {courseIds.map(courseUuid => {
            const course = courseMap[courseUuid];
            const attached = attachedByCourse.get(courseUuid);
            return (
              <Card key={courseUuid}>
                <CardHeader>
                  <CardTitle>{course?.name || 'Course title unavailable'}</CardTitle>
                  <CardDescription>Approved to train this course</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {classesQuery.isLoading || instructorsLoading ? (
                    <Skeleton className='h-32 w-full' />
                  ) : classesFailed ? (
                    <p className='text-muted-foreground text-sm'>
                      Instructor assignments unavailable.
                    </p>
                  ) : !attached?.size ? (
                    <EmptyState
                      variant='compact'
                      icon={GraduationCap}
                      title='No instructor attached yet'
                      description='Instructors will appear when the organisation assigns them to a class for this course.'
                    />
                  ) : (
                    <div className='grid gap-4 xl:grid-cols-2'>
                      {[...attached].map(([instructorUuid, classes]) => {
                        const instructor = instructorMap[instructorUuid];
                        return (
                          <div
                            key={instructorUuid}
                            className='border-border bg-muted/20 space-y-4 rounded-lg border p-4'
                          >
                            <div className='flex items-start gap-3'>
                              <Avatar className='size-10'>
                                <AvatarFallback className='bg-primary/10 text-primary'>
                                  <GraduationCap className='size-5' />
                                </AvatarFallback>
                              </Avatar>
                              <div className='min-w-0 flex-1'>
                                <h3 className='font-semibold'>
                                  {instructor?.full_name || 'Instructor details unavailable'}
                                </h3>
                                <p className='text-muted-foreground text-sm'>
                                  {instructor?.professional_headline || 'Assigned instructor'}
                                </p>
                                {instructor?.admin_verified && (
                                  <Badge variant='outline' className='mt-2'>
                                    Verified instructor
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className='text-muted-foreground text-sm whitespace-pre-line'>
                              {stripHtml(instructor?.bio) || 'No biography provided.'}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              {instructor?.location_name ||
                                instructor?.formatted_location ||
                                'Location not listed'}
                            </p>
                            <div>
                              <p className='mb-2 text-xs font-medium'>Assigned classes</p>
                              <ul className='space-y-2'>
                                {classes.map((item, index) => (
                                  <li
                                    key={item.uuid ?? index}
                                    className='flex flex-wrap items-center justify-between gap-2 text-sm'
                                  >
                                    <span>{item.title}</span>
                                    <Badge variant='secondary'>
                                      {item.is_active === true
                                        ? 'Active'
                                        : item.is_active === false
                                          ? 'Inactive'
                                          : 'Status unavailable'}
                                    </Badge>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <Button variant='outline' size='sm' asChild>
                              <Link
                                href={`/dashboard/course-creator/instructors/${encodeURIComponent(instructorUuid)}`}
                              >
                                View instructor profile
                              </Link>
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
      {applicationsQuery.hasNextPage && (
        <div className='flex justify-center'>
          <Button
            variant='outline'
            disabled={applicationsQuery.isFetching}
            onClick={() => applicationsQuery.fetchNextPage()}
          >
            {applicationsQuery.isFetchingNextPage && <Spinner />}Load more approved courses
          </Button>
        </div>
      )}
    </main>
  );
}
