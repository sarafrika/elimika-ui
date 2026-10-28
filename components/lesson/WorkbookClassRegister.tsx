'use client';

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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Spinner from '@/components/ui/spinner';
import { useStudentsByIds, useUsersByIds } from '@/hooks/use-batched-lookups';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import { richTextOrUndefined } from '@/lib/rich-text';
import {
  getEnrollmentsForClassOptions,
  getEnrollmentsForClassQueryKey,
  getSessionRecordOptions,
  getSessionRecordQueryKey,
  recordAttendanceMutation,
  recordSessionMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { Enrollment, ScheduledInstance } from '@/services/client/types.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { StatCard } from '@/components/data-display';
import { CircleCheck, CircleMinus, CircleX, Clock3 } from 'lucide-react';
import { enrollmentAttendanceStatus, type RegisterMark, registerMarkOf } from './attendance';
import { invalidateSessionReportData } from './session-report-cache';
import { hasStudentNoteChanges, type StudentNotes } from './student-notes';
import { useWorkbookNavigation } from './useWorkbookNavigation';
import {
  getWorkbookSessionAvailability,
  useWorkbookSessionAvailability,
} from './useWorkbookSessionAvailability';
import { hasApiError } from './workbook-data';
import { WorkbookError } from './WorkbookError';
import { WorkbookLoading } from './WorkbookLoading';

const ROSTER_STATUS = { ATTENDED: 'PRESENT', ABSENT: 'ABSENT', EXCUSED: 'EXCUSED' } as const;
const MARKS = [
  { mark: 'ATTENDED', label: 'Mark present' },
  { mark: 'ABSENT', label: 'Mark absent' },
  { mark: 'EXCUSED', label: 'Mark excused' },
] as const satisfies readonly { mark: RegisterMark; label: string }[];
const STATUS_LABEL: Record<string, string> = {
  PRESENT: 'Present',
  LATE: 'Late',
  ABSENT: 'Absent',
  EXCUSED: 'Excused',
  UNMARKED: 'Not marked',
};
const STATUS_PILL: Record<string, string> = {
  PRESENT: 'bg-primary/10 text-primary',
  LATE: 'bg-warning/10 text-warning',
  ABSENT: 'bg-destructive/10 text-destructive',
  EXCUSED: 'bg-muted text-foreground/80',
  UNMARKED: 'bg-warning/10 text-warning',
};
const REGISTER_STATS = [
  { status: 'PRESENT', label: 'Present', icon: CircleCheck, tone: 'info' },
  { status: 'EXCUSED', label: 'Excused · not counted', icon: CircleMinus, tone: 'neutral' },
  { status: 'ABSENT', label: 'Absent', icon: CircleX, tone: 'destructive' },
  { status: 'UNMARKED', label: 'Not marked', icon: Clock3, tone: 'warning' },
] as const;

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
  const { searchParams, navigate } = useWorkbookNavigation();
  const openRequested = searchParams.get('register') === '1';
  // The session report's "Open register" lands here with ?register=1; open once, then drop the flag.
  useEffect(() => {
    if (!openRequested) return;
    setOpen(true);
    navigate({ register: null });
  }, [openRequested, navigate]);
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
        ['ENROLLED', 'ATTENDED', 'ABSENT', 'EXCUSED'].includes(
          String(entry.status ?? '').toUpperCase()
        )
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
          status: enrollmentAttendanceStatus(entry),
          checked_in_at: entry.attendance_marked_at,
        };
      }),
    [enrollments, studentMap, userMap]
  );
  const [notes, setNotes] = useState<Record<string, StudentNotes>>({});
  const [pendingAction, setPendingAction] = useState<RegisterMark | 'notes'>('ATTENDED');
  const mutation = useMutation({
    ...recordAttendanceMutation(),
    onError: error => toast.error(getErrorMessage(error, 'Unable to mark attendance.')),
    onSuccess: (response, variables) => {
      if (hasApiError(response)) {
        toast.error(response.message || 'Unable to mark attendance.');
        return;
      }
      const savedEnrollment = query.data?.data?.find(
        entry => entry.uuid === variables.path.enrollmentUuid
      );
      const savedSessionId = savedEnrollment?.scheduled_instance_uuid ?? sessionId;
      // Keep successful rows saved locally even if another row or the refresh fails.
      client.setQueryData(
        getEnrollmentsForClassQueryKey({ path: { uuid: classId } }),
        (current: typeof query.data) =>
          current && !hasApiError(current)
            ? {
                ...current,
                data: current.data?.map(
                  (entry): Enrollment =>
                    entry.uuid === variables.path.enrollmentUuid
                      ? {
                          ...entry,
                          status: (variables.body.attendance_status ??
                            (variables.body.attended
                              ? 'ATTENDED'
                              : 'ABSENT')) as Enrollment['status'],
                          instrument_condition:
                            variables.body.instrument_condition === 'GOOD' ||
                            variables.body.instrument_condition === 'NEEDS_REPAIR' ||
                            variables.body.instrument_condition === 'NO_EQUIPMENT'
                              ? variables.body.instrument_condition
                              : entry.instrument_condition,
                          attendance_comment: variables.body.comment,
                        }
                      : entry
                ),
              }
            : current
      );
      if (savedSessionId && savedEnrollment) {
        setNotes(current => {
          const next = { ...current };
          delete next[`${savedSessionId}-${savedEnrollment.student_uuid}`];
          return next;
        });
      }
    },
  });
  const noteKey = (studentId: string) => `${sessionId}-${studentId}`;
  const noteFor = (studentId: string) => {
    const enrollment = enrollments.find(entry => entry.student_uuid === studentId);
    return {
      condition:
        notes[noteKey(studentId)]?.condition ?? enrollment?.instrument_condition ?? undefined,
      comment: notes[noteKey(studentId)]?.comment ?? enrollment?.attendance_comment ?? '',
    };
  };
  const changedEnrollments = enrollments.filter(enrollment =>
    hasStudentNoteChanges(enrollment, notes[noteKey(enrollment.student_uuid)])
  );
  const notesToSave = changedEnrollments.filter(
    enrollment => enrollment.uuid && enrollmentAttendanceStatus(enrollment) !== 'UNMARKED'
  );
  const unmarkedChanges = changedEnrollments.length - notesToSave.length;
  const refreshRegister = () =>
    Promise.all([
      client.invalidateQueries({
        queryKey: getEnrollmentsForClassQueryKey({ path: { uuid: classId } }),
      }),
      ...(sessionId ? [invalidateSessionReportData(client, sessionId, classId)] : []),
    ]);
  const saveNotes = useMutation({
    mutationFn: async () => {
      setPendingAction('notes');
      let saved = 0;
      for (const enrollment of notesToSave) {
        if (!enrollment.uuid) continue;
        const note = noteFor(enrollment.student_uuid);
        const response = await mutation
          .mutateAsync({
            path: { enrollmentUuid: enrollment.uuid },
            body: {
              attended: enrollmentAttendanceStatus(enrollment) === 'PRESENT',
              attendance_status: registerMarkOf(enrollment),
              instrument_condition: note.condition || undefined,
              comment: richTextOrUndefined(note.comment) ?? '',
            },
          })
          .catch(() => null);
        if (response && !hasApiError(response)) saved++;
      }
      if (saved > 0) {
        toast.success(`Notes saved for ${saved} ${saved === 1 ? 'student' : 'students'}.`);
        await refreshRegister();
      }
    },
  });
  const busy = mutation.isPending || saveNotes.isPending;
  const mark = async (studentId: string, next: RegisterMark) => {
    const enrollment = enrollments.find(entry => entry.student_uuid === studentId);
    if (!enrollment?.uuid || busy) return;
    const status = roster.find(student => student.uuid === studentId)?.status;
    if (status === ROSTER_STATUS[next]) return;
    const note = noteFor(studentId);
    setPendingAction(next);
    const response = await mutation
      .mutateAsync({
        path: { enrollmentUuid: enrollment.uuid },
        // The comment is rich-text HTML, so it travels in the body rather than the URL.
        body: {
          attended: next === 'ATTENDED',
          attendance_status: next,
          instrument_condition: note.condition || undefined,
          comment: richTextOrUndefined(note.comment) ?? '',
        },
      })
      .catch(() => null);
    if (!response || hasApiError(response)) return;
    toast.success('Attendance updated.');
    await refreshRegister();
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
        canAdmit={canAdmit && !busy}
        pendingStudentId={
          enrollments.find(entry => entry.uuid === mutation.variables?.path.enrollmentUuid)
            ?.student_uuid
        }
        isPending={busy}
        onAdmit={id => {
          if (getWorkbookSessionAvailability(session).canAdmit) mark(id, 'ATTENDED');
        }}
        onEvaluate={id => {
          const enrollmentId = enrollments.find(entry => entry.student_uuid === id)?.uuid;
          if (enrollmentId) onEvaluate(enrollmentId);
        }}
        onOpenRegister={() => setOpen(true)}
      />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className='w-full overflow-hidden sm:max-w-2xl'>
          <SheetHeader className='shrink-0'>
            <SheetTitle>Class register</SheetTitle>
            <SheetDescription>
              {roster.length} {roster.length === 1 ? 'student' : 'students'} in this session. Use
              Excused for an agreed absence, such as illness with a note. A mark can be corrected.
            </SheetDescription>
          </SheetHeader>
          <div className='min-h-0 flex-1 space-y-4 overflow-y-auto p-4'>
            <div aria-label='Register totals' role='group' className='grid grid-cols-2 gap-2.5'>
              {REGISTER_STATS.map(stat => (
                <StatCard
                  key={stat.status}
                  label={stat.label}
                  value={roster.filter(student => student.status === stat.status).length}
                  icon={stat.icon}
                  tone={stat.tone}
                  className='p-3'
                />
              ))}
            </div>
            {sessionId && (
              <SessionRecordForm key={sessionId} sessionId={sessionId} classId={classId} />
            )}
            {!roster.length && <EmptyState title='No students enrolled in this session' />}
            {roster.map(student => (
              <div key={student.uuid} className='space-y-2 rounded-lg border p-3'>
                <div className='flex items-center justify-between gap-2'>
                  <p className='font-medium'>{student.name}</p>
                  <span
                    data-testid='register-status'
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_PILL[student.status] ?? STATUS_PILL.UNMARKED}`}
                  >
                    {STATUS_LABEL[student.status] ?? 'Not marked'}
                  </span>
                </div>
                <p className='text-muted-foreground text-xs'>
                  Attendance saves the instrument condition and comment. Use Save notes below to
                  save changes for all students with marked attendance.
                </p>
                <div className='grid gap-2 sm:grid-cols-2'>
                  <Select
                    disabled={busy}
                    value={noteFor(student.uuid).condition ?? ''}
                    onValueChange={value =>
                      setNotes(current => ({
                        ...current,
                        [noteKey(student.uuid)]: { ...noteFor(student.uuid), condition: value },
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
                  <div
                    role='group'
                    aria-label={`Comment on ${student.name}`}
                    className='sm:col-span-2'
                  >
                    <p className='text-muted-foreground mb-1 text-xs'>Student comment</p>
                    <SimpleEditor
                      key={`${sessionId}-${student.uuid}`}
                      value={noteFor(student.uuid).comment}
                      isEditable={!busy}
                      onChange={comment =>
                        setNotes(current => ({
                          ...current,
                          [noteKey(student.uuid)]: { ...noteFor(student.uuid), comment },
                        }))
                      }
                    />
                  </div>
                </div>
                <div
                  role='group'
                  aria-label={`Attendance for ${student.name}`}
                  className='flex flex-wrap gap-2'
                >
                  {MARKS.map(entry => {
                    const on = student.status === ROSTER_STATUS[entry.mark];
                    const seat = enrollments.find(row => row.student_uuid === student.uuid)?.uuid;
                    return (
                      <Button
                        key={entry.mark}
                        size='sm'
                        variant={on ? 'default' : 'outline'}
                        aria-pressed={on}
                        disabled={busy || on}
                        onClick={() => mark(student.uuid, entry.mark)}
                      >
                        {mutation.isPending &&
                          pendingAction === entry.mark &&
                          mutation.variables?.path.enrollmentUuid === seat && <Spinner />}
                        {entry.label}
                      </Button>
                    );
                  })}
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
          <SheetFooter className='bg-background shrink-0 items-center border-t'>
            <p className='text-muted-foreground text-center text-xs' role='status'>
              {notesToSave.length} {notesToSave.length === 1 ? 'student has' : 'students have'}{' '}
              unsaved notes.
              {unmarkedChanges > 0 &&
                ` Mark attendance for ${unmarkedChanges} more ${unmarkedChanges === 1 ? 'student' : 'students'} to save their notes.`}
            </p>
            <Button
              className='w-full'
              disabled={busy || notesToSave.length === 0}
              onClick={() => saveNotes.mutate()}
            >
              {saveNotes.isPending && <Spinner />}
              Save notes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** What was actually taught in this session, as the school's attendance sheet records it. */
function SessionRecordForm({ sessionId, classId }: { sessionId: string; classId: string }) {
  const client = useQueryClient();
  const query = useQuery({
    ...getSessionRecordOptions({ path: { instanceUuid: sessionId } }),
    enabled: Boolean(sessionId),
    staleTime: STALE_TIMES.live,
  });
  const mutation = useMutation({
    ...recordSessionMutation(),
    onError: error => toast.error(getErrorMessage(error, 'Unable to save the session record.')),
  });
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
        <p className='text-muted-foreground text-xs'>
          Topic covered, e.g. grand staff: treble and bass clefs
        </p>
        <SimpleEditor
          key={`topic-${sessionId}-${query.isSuccess}`}
          value={topicValue}
          onChange={setTopic}
        />
      </div>
      <div role='group' aria-label='Instructor remarks' className='space-y-1'>
        <p className='text-muted-foreground text-xs'>Remarks on the session</p>
        <SimpleEditor
          key={`remarks-${sessionId}-${query.isSuccess}`}
          value={remarksValue}
          onChange={setRemarks}
        />
      </div>
      <div className='flex justify-end'>
        <Button
          size='sm'
          disabled={mutation.isPending || query.isLoading}
          onClick={async () => {
            const response = await mutation
              .mutateAsync({
                path: { instanceUuid: sessionId },
                body: {
                  topic_covered: richTextOrUndefined(topicValue),
                  instructor_remarks: richTextOrUndefined(remarksValue),
                },
              })
              .catch(() => null);
            if (!response) return;
            if (hasApiError(response)) {
              toast.error(response.message || 'Unable to save the session record.');
              return;
            }
            toast.success('Session record saved.');
            await Promise.all([
              client.invalidateQueries({
                queryKey: getSessionRecordQueryKey({ path: { instanceUuid: sessionId } }),
              }),
              invalidateSessionReportData(client, sessionId, classId),
            ]);
          }}
        >
          {mutation.isPending && <Spinner />}
          Save
        </Button>
      </div>
    </div>
  );
}
