'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getStudentByIdOptions,
  getUserByUuidOptions,
  searchEnrollmentsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { InstructorClassWithSchedule } from '@/hooks/use-instructor-classes-with-schedules';
import type { ClassInstanceItem } from './new-class-page.utils';
import type { Enrollment, Student, User } from '@/services/client/types.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Clock3, Users } from 'lucide-react';
import { useMemo } from 'react';
import { formatDateTime, formatDuration, formatLabel } from './new-class-page.utils';

const WAITLIST_STATUS = 'WAITLISTED';

function getInitials(value?: string | null) {
  return (
    value
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'ST'
  );
}

function getPersonName(user?: User | null) {
  const parts = [user?.first_name, user?.last_name].filter(Boolean);
  return parts.join(' ').trim() || user?.display_name || user?.email || 'Unknown student';
}

function getWaitlistStatusTone(status?: string) {
  if (status === WAITLIST_STATUS) return 'warning';
  if (status === 'ENROLLED' || status === 'ATTENDED') return 'success';
  return 'secondary';
}

function WaitlistRow({
  enrollment,
  student,
  user,
}: {
  enrollment: Enrollment;
  student?: Student;
  user?: User | null;
}) {
  const name =
    getPersonName(user ?? null) || student?.full_name || enrollment.student_uuid.slice(0, 8);
  const initials = getInitials(name);

  return (
    <div className='border-border/70 bg-background/80 flex items-center gap-3 rounded-lg border px-3 py-3'>
      <Avatar className='border-border/60 size-10 border'>
        <AvatarImage src={user?.profile_image_url ?? undefined} alt={name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className='min-w-0 flex-1'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <p className='truncate text-sm font-semibold text-foreground'>{name}</p>
            <p className='truncate text-xs text-muted-foreground'>
              {user?.email ?? 'No email available'}
            </p>
          </div>
          <Badge variant='outline' className='border-warning/30 bg-warning/10 text-warning'>
            Waitlisted
          </Badge>
        </div>
        <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
          <span>{formatDateTime(enrollment.created_date)}</span>
          <span>Enrollment created</span>
        </div>
      </div>
    </div>
  );
}

export function ClassWaitingListTab({
  isLoadingClasses,
  selectedClass,
  selectedClassEntry,
  visibleInstances,
}: {
  isLoadingClasses: boolean;
  selectedClass: InstructorClassWithSchedule | null;
  selectedClassEntry: ClassInstanceItem | null;
  visibleInstances: InstructorClassWithSchedule['schedule'];
}) {
  const classUuid = selectedClass?.uuid;

  const waitlistQuery = useQuery({
    ...searchEnrollmentsOptions({
      query: {
        pageable: { page: 0, size: 100 },
        searchParams: {
          class_definition_uuid_eq: classUuid ?? '',
          status_eq: WAITLIST_STATUS,
        },
      },
    }),
    enabled: Boolean(classUuid),
    refetchOnWindowFocus: false,
  });

  const waitlistEnrollments = useMemo(
    () => waitlistQuery.data?.data?.content ?? [],
    [waitlistQuery.data]
  );

  const studentUuids = useMemo(
    () =>
      Array.from(
        new Set(
          waitlistEnrollments
            .map(enrollment => enrollment.student_uuid)
            .filter((uuid): uuid is string => Boolean(uuid))
        )
      ),
    [waitlistEnrollments]
  );

  const studentQueries = useQueries({
    queries: studentUuids.map(uuid => ({
      ...getStudentByIdOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
      staleTime: 60 * 1000,
    })),
  });

  const studentsById = useMemo(() => {
    const map: Record<string, Student> = {};
    studentQueries.forEach(queryResult => {
      const student = queryResult.data;
      if (student?.uuid) {
        map[student.uuid] = student;
      }
    });
    return map;
  }, [studentQueries]);

  const userUuids = useMemo(
    () =>
      Array.from(
        new Set(
          studentQueries
            .map(queryResult => queryResult.data?.user_uuid)
            .filter((uuid): uuid is string => Boolean(uuid))
        )
      ),
    [studentQueries]
  );

  const userQueries = useQueries({
    queries: userUuids.map(uuid => ({
      ...getUserByUuidOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
      staleTime: 60 * 1000,
    })),
  });

  const usersById = useMemo(() => {
    const map: Record<string, User> = {};
    userQueries.forEach(queryResult => {
      const user = queryResult.data?.data;
      if (user?.uuid) {
        map[user.uuid] = user;
      }
    });
    return map;
  }, [userQueries]);

  const waitlistByInstance = useMemo(() => {
    const map = new Map<string, Enrollment[]>();

    waitlistEnrollments.forEach(enrollment => {
      const key = enrollment.scheduled_instance_uuid || 'unassigned';
      const current = map.get(key) ?? [];
      current.push(enrollment);
      map.set(key, current);
    });

    return map;
  }, [waitlistEnrollments]);

  const visibleWaitlistInstances = useMemo(() => {
    const instances = visibleInstances ?? [];

    return instances
      .map(instance => ({
        instance,
        waitlisted: waitlistByInstance.get(instance.uuid ?? '') ?? [],
      }))
      .filter(group => group.waitlisted.length > 0);
  }, [visibleInstances, waitlistByInstance]);

  const unassignedWaitlist = waitlistByInstance.get('unassigned') ?? [];

  if (isLoadingClasses || waitlistQuery.isLoading) {
    return (
      <Card className='border-border/70 bg-card shadow-sm'>
        <CardContent className='space-y-3 p-4 md:p-5'>
          <Skeleton className='h-16 rounded-lg' />
          <Skeleton className='h-24 rounded-lg' />
          <Skeleton className='h-24 rounded-lg' />
        </CardContent>
      </Card>
    );
  }

  if (!selectedClass || !classUuid) {
    return (
      <Card className='border-border/70 bg-card shadow-sm'>
        <CardContent className='flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center'>
          <Users className='text-muted-foreground h-8 w-8' />
          <div className='space-y-1'>
            <h3 className='text-foreground text-lg font-semibold'>No class selected</h3>
            <p className='text-muted-foreground text-sm'>
              Pick a class from the sidebar to view its waitlisted students.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-border/70 bg-card shadow-sm'>
      <CardContent className='space-y-4 p-4 md:p-5'>
        <div className='flex flex-col gap-2 border-b border-border/60 pb-4'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <h3 className='text-foreground text-xl font-semibold'>Waiting List</h3>
              <p className='text-muted-foreground text-sm'>
                Waitlisted students grouped by class session for{' '}
                {selectedClass.course?.name || selectedClass.title}.
              </p>
            </div>
            <Badge variant='outline' className='border-warning/30 bg-warning/10 text-warning'>
              {waitlistEnrollments.length} waiting
            </Badge>
          </div>
          {selectedClassEntry ? (
            <div className='text-muted-foreground flex items-center gap-2 text-xs'>
              <Clock3 className='h-3.5 w-3.5' />
              Active instance: {formatDateTime(selectedClassEntry.start_time)} •{' '}
              {formatDuration(selectedClassEntry.start_time, selectedClassEntry.end_time)}
            </div>
          ) : null}
        </div>

        {visibleWaitlistInstances.length > 0 ? (
          <div className='space-y-4'>
            {visibleWaitlistInstances.map(group => (
              <section key={group.instance.uuid ?? formatDateTime(group.instance.start_time)} className='space-y-3'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='space-y-1'>
                    <h4 className='text-foreground font-semibold'>
                      {formatDateTime(group.instance.start_time)}
                    </h4>
                    <p className='text-muted-foreground text-sm'>
                      {formatDuration(group.instance.start_time, group.instance.end_time)} •{' '}
                      {group.instance.location_name || formatLabel(selectedClass.location_type)}
                    </p>
                  </div>
                  <Badge variant='secondary' className='bg-primary/10 text-primary'>
                    {group.waitlisted.length} students
                  </Badge>
                </div>
                <div className='space-y-2'>
                  {group.waitlisted.map(enrollment => {
                    const student = studentsById[enrollment.student_uuid];
                    const user = student?.user_uuid ? usersById[student.user_uuid] : undefined;

                    return (
                      <WaitlistRow
                        key={enrollment.uuid ?? `${group.instance.uuid}-${enrollment.student_uuid}`}
                        enrollment={enrollment}
                        student={student}
                        user={user}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : null}

        {unassignedWaitlist.length > 0 ? (
          <section className='space-y-3'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <h4 className='text-foreground font-semibold'>Unassigned waitlist</h4>
                <p className='text-muted-foreground text-sm'>
                  Students waiting for the class without a specific session assignment.
                </p>
              </div>
              <Badge variant='secondary' className='bg-primary/10 text-primary'>
                {unassignedWaitlist.length} students
              </Badge>
            </div>
            <div className='space-y-2'>
              {unassignedWaitlist.map(enrollment => {
                const student = studentsById[enrollment.student_uuid];
                const user = student?.user_uuid ? usersById[student.user_uuid] : undefined;

                return (
                  <WaitlistRow
                    key={enrollment.uuid ?? `unassigned-${enrollment.student_uuid}`}
                    enrollment={enrollment}
                    student={student}
                    user={user}
                  />
                );
              })}
            </div>
          </section>
        ) : null}

        {visibleWaitlistInstances.length === 0 && unassignedWaitlist.length === 0 ? (
          <div className='border-border/70 flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center'>
            <Users className='text-muted-foreground h-8 w-8' />
            <div className='space-y-1'>
              <h3 className='text-foreground text-lg font-semibold'>No waitlisted students</h3>
              <p className='text-muted-foreground max-w-md text-sm'>
                There are no waitlisted enrollments for this class yet. Students who join once the
                class reaches capacity will appear here by session.
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
