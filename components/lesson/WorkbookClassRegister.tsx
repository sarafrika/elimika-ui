'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  type AttendanceStudent,
  InstructorAttendanceRail,
} from '@/app/dashboard/instructor/classes/training/components/InstructorAttendanceRail';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor-lazy';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Spinner from '@/components/ui/spinner';
import { useStudentsByIds, useUsersByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getEnrollmentsForClassOptions,
  getEnrollmentsForClassQueryKey,
  getSessionRecordOptions,
  getSessionRecordQueryKey,
  recordAttendanceMutation,
  recordSessionMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { ScheduledInstance } from '@/services/client/types.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import {
  getWorkbookSessionAvailability,
  useWorkbookSessionAvailability,
} from './useWorkbookSessionAvailability';
import { WorkbookError } from './WorkbookError';
import { WorkbookLoading } from './WorkbookLoading';
import { hasApiError } from './workbook-data';

export function WorkbookClassRegister({
  classId,
  session,
  onEvaluate,
}: {
  classId: string;
  session?: ScheduledInstance;
  onEvaluate: (enrollmentId: string) => void;
}) {
  const sessionId = session?.uuid;
  const { canAdmit } = useWorkbookSessionAvailability(session);
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
    ...recordAttendanceMutation(),
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
  const [notes, setNotes] = useState<Record<string, { condition?: string; comment?: string }>>({});
  const noteFor = (studentId: string) => {
    const enrollment = enrollments.find(entry => entry.student_uuid === studentId);
    return {
      condition: notes[studentId]?.condition ?? enrollment?.instrument_condition ?? undefined,
      comment: notes[studentId]?.comment ?? enrollment?.attendance_comment ?? '',
    };
  };
  const mark = (studentId: string, attended: boolean) => {
    const enrollment = enrollments.find(entry => entry.student_uuid === studentId);
    if (!enrollment?.uuid || mutation.isPending) return;
    const note = noteFor(studentId);
    mutation.mutate({
      path: { enrollmentUuid: enrollment.uuid },
      // The comment is rich-text HTML, so it travels in the body rather than the URL.
      body: {
        attended,
        instrument_condition: note.condition || undefined,
        comment: note.comment?.trim() || undefined,
      },
    });
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
        canAdmit={canAdmit && !mutation.isPending}
        pendingStudentId={
          enrollments.find(entry => entry.uuid === mutation.variables?.path.enrollmentUuid)
            ?.student_uuid
        }
        isPending={mutation.isPending}
        onAdmit={id => {
          if (getWorkbookSessionAvailability(session).canAdmit) mark(id, true);
        }}
        onEvaluate={id => {
          const enrollmentId = enrollments.find(entry => entry.student_uuid === id)?.uuid;
          if (enrollmentId) onEvaluate(enrollmentId);
        }}
        onOpenRegister={() => setOpen(true)}
      />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className='w-full overflow-y-auto sm:max-w-2xl'>
          <SheetHeader>
            <SheetTitle>Class register</SheetTitle>
            <SheetDescription>{roster.length} students enrolled in this session.</SheetDescription>
          </SheetHeader>
          <div className='space-y-4 p-4'>
            {sessionId && <SessionRecordForm sessionId={sessionId} />}
            {!roster.length && <EmptyState title='No students enrolled in this session' />}
            {roster.map(student => (
              <div key={student.uuid} className='space-y-2 rounded-lg border p-3'>
                <p className='font-medium'>{student.name}</p>
                <p className='text-muted-foreground text-xs'>{student.status}</p>
                <div className='grid gap-2 sm:grid-cols-2'>
                  <Select
                    value={noteFor(student.uuid).condition ?? ''}
                    onValueChange={value =>
                      setNotes(current => ({
                        ...current,
                        [student.uuid]: { ...noteFor(student.uuid), condition: value },
                      }))
                    }
                  >
                    <SelectTrigger aria-label={`Instrument condition for ${student.name}`}>
                      <SelectValue placeholder='Instrument condition' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='GOOD'>Good</SelectItem>
                      <SelectItem value='NEEDS_REPAIR'>Needs repair</SelectItem>
                      <SelectItem value='NO_EQUIPMENT'>No equipment provided</SelectItem>
                    </SelectContent>
                  </Select>
                  <div role='group' aria-label={`Comment on ${student.name}`} className='sm:col-span-2'>
                    <SimpleEditor
                      key={`${student.uuid}-${query.isSuccess}`}
                      value={noteFor(student.uuid).comment}
                      onChange={comment =>
                        setNotes(current => ({
                          ...current,
                          [student.uuid]: { ...noteFor(student.uuid), comment },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={mutation.isPending}
                    onClick={() => mark(student.uuid, true)}
                  >
                    {mutation.isPending &&
                      mutation.variables?.body.attended &&
                      mutation.variables?.path.enrollmentUuid ===
                        enrollments.find(entry => entry.student_uuid === student.uuid)?.uuid && (
                        <Spinner />
                      )}
                    Mark present
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={mutation.isPending}
                    onClick={() => mark(student.uuid, false)}
                  >
                    {mutation.isPending &&
                      !mutation.variables?.body.attended &&
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

/** What was actually taught in this session, as the school's attendance sheet records it. */
function SessionRecordForm({ sessionId }: { sessionId: string }) {
  const client = useQueryClient();
  const query = useQuery({
    ...getSessionRecordOptions({ path: { instanceUuid: sessionId } }),
    enabled: Boolean(sessionId),
    staleTime: STALE_TIMES.live,
  });
  const mutation = useMutation(recordSessionMutation());
  const record = query.data?.data;
  const [topic, setTopic] = useState<string | undefined>(undefined);
  const [remarks, setRemarks] = useState<string | undefined>(undefined);
  const topicValue = topic ?? record?.topic_covered ?? '';
  const remarksValue = remarks ?? record?.instructor_remarks ?? '';

  return (
    <div className='space-y-2 rounded-lg border p-3'>
      <p className='font-medium'>What was taught</p>
      {record?.duration_minutes != null && (
        <p className='text-muted-foreground text-xs'>{record.duration_minutes} minute session</p>
      )}
      <div role='group' aria-label='Topic covered' className='space-y-1'>
        <p className='text-muted-foreground text-xs'>Topic covered, e.g. grand staff: treble and bass clefs</p>
        <SimpleEditor key={`topic-${sessionId}-${query.isSuccess}`} value={topicValue} onChange={setTopic} />
      </div>
      <div role='group' aria-label='Instructor remarks' className='space-y-1'>
        <p className='text-muted-foreground text-xs'>Remarks on the session</p>
        <SimpleEditor key={`remarks-${sessionId}-${query.isSuccess}`} value={remarksValue} onChange={setRemarks} />
      </div>
      <div className='flex justify-end'>
        <Button
          size='sm'
          disabled={mutation.isPending || query.isLoading}
          onClick={async () => {
            const response = await mutation.mutateAsync({
              path: { instanceUuid: sessionId },
              body: { topic_covered: topicValue, instructor_remarks: remarksValue },
            });
            if (hasApiError(response)) {
              toast.error(response.message || 'Unable to save the session record.');
              return;
            }
            toast.success('Session record saved.');
            await client.invalidateQueries({
              queryKey: getSessionRecordQueryKey({ path: { instanceUuid: sessionId } }),
            });
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
