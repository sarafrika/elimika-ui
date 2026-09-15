'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  InstructorAttendanceRail,
  type AttendanceStudent,
} from '@/app/dashboard/instructor/classes/training/components/InstructorAttendanceRail';
import { useStudentsByIds, useUsersByIds } from '@/hooks/use-batched-lookups';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import Spinner from '@/components/ui/spinner';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getEnrollmentsForClassOptions,
  getEnrollmentsForClassQueryKey,
  markAttendanceMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { hasApiError } from './workbook-data';
import { WorkbookLoading } from './WorkbookLoading';
import { WorkbookError } from './WorkbookError';

export function WorkbookClassRegister({
  classId,
  sessionId,
  onEvaluate,
}: {
  classId: string;
  sessionId?: string;
  onEvaluate: (enrollmentId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const client = useQueryClient();
  const query = useQuery({
    ...getEnrollmentsForClassOptions({ path: { uuid: classId } }),
    enabled: Boolean(classId && sessionId),
    staleTime: STALE_TIMES.live,
  });
  const enrollments = useMemo(() => {
    if (hasApiError(query.data) || !sessionId) return [];
    const entries = (query.data?.data ?? []).filter(
      entry =>
        entry.scheduled_instance_uuid === sessionId &&
        ['ENROLLED', 'ATTENDED', 'ABSENT'].includes(entry.status ?? '')
    );
    return [...new Map(entries.map(entry => [entry.student_uuid, entry])).values()];
  }, [query.data, sessionId]);
  const studentIds = useMemo(() => enrollments.map(entry => entry.student_uuid), [enrollments]);
  const {
    studentMap,
    isLoading: studentsLoading,
    isError: studentsError,
    refetch: refetchStudents,
  } = useStudentsByIds(studentIds);
  const userIds = useMemo(
    () => studentIds.flatMap(id => (studentMap[id]?.user_uuid ? [studentMap[id].user_uuid] : [])),
    [studentIds, studentMap]
  );
  const {
    userMap,
    isLoading: usersLoading,
    isError: usersError,
    refetch: refetchUsers,
  } = useUsersByIds(userIds);
  const roster = useMemo<AttendanceStudent[]>(
    () =>
      enrollments.map(entry => {
        const student = studentMap[entry.student_uuid];
        const user = student?.user_uuid ? userMap[student.user_uuid] : undefined;
        const name = user?.full_name || 'Student';
        return {
          uuid: entry.student_uuid,
          name,
          initials: name
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part[0])
            .join('')
            .toUpperCase(),
          imageUrl: toAuthenticatedMediaUrl(user?.profile_image_url) ?? undefined,
          status: entry.is_attendance_marked
            ? entry.did_attend
              ? 'PRESENT'
              : 'ABSENT'
            : entry.status === 'ATTENDED'
              ? 'PRESENT'
              : entry.status === 'ABSENT'
                ? 'ABSENT'
                : 'UNMARKED',
          checked_in_at: entry.attendance_marked_at,
        };
      }),
    [enrollments, studentMap, userMap]
  );
  const mutation = useMutation({
    ...markAttendanceMutation(),
    onSuccess: async response => {
      if (hasApiError(response)) {
        toast.error(response.message || 'Unable to mark attendance.');
        return;
      }
      await client.invalidateQueries({
        queryKey: getEnrollmentsForClassQueryKey({ path: { uuid: classId } }),
      });
      toast.success('Attendance updated.');
    },
    onError: () => toast.error('Unable to mark attendance. Please try again.'),
  });
  const mark = (studentId: string, attended: boolean) => {
    const enrollment = enrollments.find(entry => entry.student_uuid === studentId);
    if (!enrollment?.uuid || mutation.isPending) return;
    mutation.mutate({ path: { enrollmentUuid: enrollment.uuid }, query: { attended } });
  };
  if (!sessionId) return <EmptyState title='Select a class session to view its students' />;
  if (query.isLoading || studentsLoading || usersLoading) return <WorkbookLoading />;
  if (query.isError || hasApiError(query.data) || studentsError || usersError)
    return (
      <WorkbookError
        title='Unable to load class register'
        retry={() => {
          void query.refetch();
          void refetchStudents();
          void refetchUsers();
        }}
      />
    );
  return (
    <>
      <InstructorAttendanceRail
        roster={roster}
        canAdmit={!mutation.isPending}
        pendingStudentId={
          enrollments.find(entry => entry.uuid === mutation.variables?.path.enrollmentUuid)
            ?.student_uuid
        }
        isPending={mutation.isPending}
        onAdmit={id => mark(id, true)}
        onEvaluate={id => {
          const enrollmentId = enrollments.find(entry => entry.student_uuid === id)?.uuid;
          if (enrollmentId) onEvaluate(enrollmentId);
        }}
        onOpenRegister={() => setOpen(true)}
      />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className='overflow-y-auto'>
          <SheetHeader>
            <SheetTitle>Class register</SheetTitle>
            <SheetDescription>{roster.length} students enrolled in this session.</SheetDescription>
          </SheetHeader>
          <div className='space-y-4 p-4'>
            {!roster.length && <EmptyState title='No students enrolled in this session' />}
            {roster.map(student => (
              <div key={student.uuid} className='space-y-2 rounded-lg border p-3'>
                <p className='font-medium'>{student.name}</p>
                <p className='text-muted-foreground text-xs'>{student.status}</p>
                <div className='flex flex-wrap gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={mutation.isPending || student.status === 'PRESENT'}
                    onClick={() => mark(student.uuid, true)}
                  >
                    {mutation.isPending &&
                      mutation.variables?.query.attended &&
                      mutation.variables?.path.enrollmentUuid ===
                        enrollments.find(entry => entry.student_uuid === student.uuid)?.uuid && (
                        <Spinner />
                      )}
                    Mark present
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={mutation.isPending || student.status === 'ABSENT'}
                    onClick={() => mark(student.uuid, false)}
                  >
                    {mutation.isPending &&
                      !mutation.variables?.query.attended &&
                      mutation.variables?.path.enrollmentUuid ===
                        enrollments.find(entry => entry.student_uuid === student.uuid)?.uuid && (
                        <Spinner />
                      )}
                    Mark absent
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => {
                      setOpen(false);
                      const enrollmentId = enrollments.find(
                        entry => entry.student_uuid === student.uuid
                      )?.uuid;
                      if (enrollmentId) onEvaluate(enrollmentId);
                    }}
                  >
                    Evaluate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
