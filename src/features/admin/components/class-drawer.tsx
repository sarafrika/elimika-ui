'use client';

import { CalendarX2, CircleSlash, UserCheck, UserX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { DetailGrid, SectionCard, StatusBadge } from '@/components/data-display';
import { useStudentsByIds, useUsersByIds } from '@/hooks/use-batched-lookups';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { absoluteDateTime, formatDate } from '@/lib/date';
import { toNumber } from '@/lib/metrics';
import type { ClassDefinition, Enrollment, ScheduledInstance } from '@/services/client';
import {
  useCancelSession,
  useClassDefinition,
  useClassRating,
  useClassSchedule,
  useInstanceEnrolments,
  useDeactivateClass,
  useMarkAttendance,
} from '../hooks/use-classes';
import { ConfirmDialog } from './confirm-dialog';
import { NoteField, noteToPlainText } from './note-field';
import { SectionBoundary } from './section-boundary';

interface ClassDrawerProps {
  classUuid: string | null;
  /** The row that was clicked, so the header can paint before the record lands. */
  fallback?: ClassDefinition | null;
  onOpenChange: (open: boolean) => void;
}

const instanceLabel = (instance: ScheduledInstance) =>
  `${instance.title} · ${absoluteDateTime(instance.start_time, '')}`;

/** One class: what it is, when it runs, and the three writes an admin has over it. */
export function ClassDrawer({ classUuid, fallback, onOpenChange }: ClassDrawerProps) {
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [cancelling, setCancelling] = useState<ScheduledInstance | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | undefined>();
  const [deactivating, setDeactivating] = useState(false);
  const [attendance, setAttendance] = useState<{ enrolment: Enrollment; attended: boolean } | null>(
    null
  );

  const { definition, query: definitionQuery } = useClassDefinition(classUuid);
  const { instances, query: scheduleQuery } = useClassSchedule(classUuid);
  const { rating, query: ratingQuery } = useClassRating(classUuid);
  const { enrolments, query: enrolmentsQuery } = useInstanceEnrolments(selectedInstance || null);

  const cancelSession = useCancelSession();
  const deactivateClass = useDeactivateClass();
  const markAttendance = useMarkAttendance();

  const klass = definition ?? fallback ?? null;

  useEffect(() => {
    setSelectedInstance('');
  }, [classUuid]);

  // Learner names come from two batched lookups for the open session, never per row.
  const studentIds = useMemo(
    () =>
      Array.from(
        new Set(enrolments.map(row => row.student_uuid).filter((id): id is string => Boolean(id)))
      ),
    [enrolments]
  );
  const { studentMap } = useStudentsByIds(studentIds);
  const userIds = useMemo(
    () =>
      Array.from(
        new Set(
          Object.values(studentMap)
            .map(student => student.user_uuid)
            .filter((id): id is string => Boolean(id))
        )
      ),
    [studentMap]
  );
  const { userMap } = useUsersByIds(userIds);

  const learnerName = (enrolment: Enrollment) => {
    const student = studentMap[enrolment.student_uuid ?? ''];
    const user = student?.user_uuid ? userMap[student.user_uuid] : undefined;
    return user?.full_name || student?.full_name || 'Loading…';
  };

  return (
    <Sheet open={Boolean(classUuid)} onOpenChange={onOpenChange}>
      <SheetContent className='w-full gap-0 overflow-y-auto sm:max-w-[640px]'>
        <SheetHeader>
          <SheetTitle>{klass?.title ?? 'Class'}</SheetTitle>
          <SheetDescription>
            {[klass?.session_format, klass?.location_type, klass?.location_name]
              .filter(Boolean)
              .join(' · ') || 'No delivery details set'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex flex-col gap-4 px-4 pb-6'>
          <SectionBoundary
            label='the class'
            loading={definitionQuery.isLoading && !fallback}
            error={definitionQuery.error}
            onRetry={definitionQuery.refetch}
          >
            <DetailGrid
              items={[
                {
                  label: 'Running',
                  value: <StatusBadge status={klass?.is_active ? 'active' : 'inactive'} />,
                },
                {
                  label: 'Capacity',
                  value: klass?.max_participants ? `${klass.max_participants} places` : '—',
                },
                {
                  label: 'Sessions',
                  value: `${toNumber(klass?.completed_session_count)} of ${toNumber(
                    klass?.scheduled_session_count
                  )} done`,
                },
                {
                  label: 'Rating',
                  value: ratingQuery.isLoading
                    ? 'Loading…'
                    : rating?.average_rating
                      ? `${Number(rating.average_rating).toFixed(1)} · ${toNumber(rating.review_count)} reviews`
                      : 'No reviews yet',
                },
              ]}
            />
          </SectionBoundary>

          <SectionCard title='Sessions' description='Every instance this class has scheduled.'>
            <SectionBoundary
              label='the sessions'
              loading={scheduleQuery.isLoading}
              error={scheduleQuery.error}
              empty={instances.length === 0}
              onRetry={scheduleQuery.refetch}
              emptyTitle='Nothing scheduled'
              emptyDescription='This class has no sessions on the timetable.'
            >
              <ul className='divide-border/60 divide-y'>
                {instances.map(instance => (
                  <li
                    key={instance.uuid}
                    className='flex flex-wrap items-center gap-3 py-2.5 first:pt-0'
                  >
                    <div className='min-w-0 flex-1'>
                      <p className='text-foreground truncate text-sm font-medium'>
                        {absoluteDateTime(instance.start_time, '—')}
                      </p>
                      <p className='text-muted-foreground truncate text-xs'>
                        {instance.location_name || instance.location_type || '—'}
                      </p>
                    </div>
                    <StatusBadge status={instance.status ?? undefined} />
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='rounded-md'
                        onClick={() => setSelectedInstance(instance.uuid ?? '')}
                      >
                        Roster
                      </Button>
                      {instance.can_be_cancelled ? (
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-destructive rounded-md'
                          onClick={() => {
                            setCancelReason('');
                            setCancelError(undefined);
                            setCancelling(instance);
                          }}
                        >
                          <CalendarX2 className='mr-1.5 size-3.5' />
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </SectionBoundary>
          </SectionCard>

          <SectionCard
            title='Roster'
            description='Who is enrolled in one session, and whether they turned up.'
          >
            <div className='flex flex-col gap-3'>
              <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                <SelectTrigger className='border-border/70 h-9 w-full rounded-md'>
                  <SelectValue placeholder='Pick a session to see its roster' />
                </SelectTrigger>
                <SelectContent>
                  {instances.map(instance => (
                    <SelectItem key={instance.uuid} value={instance.uuid ?? ''}>
                      {instanceLabel(instance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedInstance ? (
                <SectionBoundary
                  label='the roster'
                  loading={enrolmentsQuery.isLoading}
                  error={enrolmentsQuery.error}
                  empty={enrolments.length === 0}
                  onRetry={enrolmentsQuery.refetch}
                  emptyTitle='Nobody enrolled'
                  emptyDescription='No learner is on this session yet.'
                >
                  <ul className='divide-border/60 divide-y'>
                    {enrolments.map(enrolment => (
                      <li key={enrolment.uuid} className='flex items-center gap-3 py-2.5 first:pt-0'>
                        <span className='min-w-0 flex-1 truncate text-sm'>
                          {learnerName(enrolment)}
                        </span>
                        <StatusBadge status={enrolment.status ?? undefined} />
                        {enrolment.is_attendance_marked ? (
                          <span className='text-muted-foreground text-xs'>
                            {enrolment.did_attend ? 'Present' : 'Absent'}
                          </span>
                        ) : (
                          <div className='flex gap-1.5'>
                            <Button
                              variant='outline'
                              size='sm'
                              className='rounded-md'
                              onClick={() => setAttendance({ enrolment, attended: true })}
                            >
                              <UserCheck className='mr-1.5 size-3.5' />
                              Present
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='rounded-md'
                              onClick={() => setAttendance({ enrolment, attended: false })}
                            >
                              <UserX className='mr-1.5 size-3.5' />
                              Absent
                            </Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </SectionBoundary>
              ) : (
                <p className='text-muted-foreground text-sm'>
                  Pick a session above. The roster is only fetched for the session you open.
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard title='Class facts'>
            <DetailGrid
              columns={2}
              items={[
                { label: 'Organisation', value: klass?.organisation_uuid ? 'Organisation-run' : 'Independent' },
                { label: 'Visibility', value: klass?.class_visibility ?? '—' },
                {
                  label: 'Registration closes',
                  value: formatDate(klass?.registration_period_end_date) || '—',
                },
                { label: 'Class id', value: <span className='font-mono text-xs'>{klass?.uuid ?? '—'}</span> },
              ]}
            />
          </SectionCard>

          {klass?.is_active ? (
            <Button
              variant='outline'
              className='text-destructive border-destructive/40 rounded-md'
              onClick={() => setDeactivating(true)}
            >
              <CircleSlash className='mr-2 size-4' />
              Stop running this class
            </Button>
          ) : null}
        </div>
      </SheetContent>

      <ConfirmDialog
        open={cancelling !== null}
        onOpenChange={open => {
          if (!open) setCancelling(null);
        }}
        action='cancelSession'
        subject={{
          name: klass?.title ?? 'this class',
          detail: cancelling ? absoluteDateTime(cancelling.start_time, 'this date') : undefined,
        }}
        note={noteToPlainText(cancelReason) || undefined}
        isPending={cancelSession.isPending}
        onConfirm={() => {
          if (!cancelling) return;
          if (noteToPlainText(cancelReason).length < 10) {
            setCancelError('Say why the session is off — the learners are told.');
            return;
          }
          cancelSession.mutate(
            {
              instanceUuid: cancelling.uuid ?? '',
              reason: cancelReason,
              title: klass?.title ?? 'The session',
            },
            { onSuccess: () => setCancelling(null) }
          );
        }}
      >
        <NoteField
          id='cancel-session-reason'
          label='Reason'
          required
          value={cancelReason}
          onChange={value => {
            setCancelReason(value);
            setCancelError(undefined);
          }}
          error={cancelError}
          helper='Sent with the cancellation and kept in the request log.'
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={deactivating}
        onOpenChange={setDeactivating}
        action='deactivateClass'
        subject={{ name: klass?.title ?? '', confirmValue: klass?.title ?? '' }}
        isPending={deactivateClass.isPending}
        onConfirm={() =>
          deactivateClass.mutate(
            { uuid: klass?.uuid ?? '', title: klass?.title ?? 'The class' },
            {
              onSuccess: () => {
                setDeactivating(false);
                onOpenChange(false);
              },
            }
          )
        }
      />

      <ConfirmDialog
        open={attendance !== null}
        onOpenChange={open => {
          if (!open) setAttendance(null);
        }}
        action='markAttendance'
        subject={{
          name: attendance ? learnerName(attendance.enrolment) : '',
          detail: attendance?.attended ? 'present' : 'absent',
        }}
        isPending={markAttendance.isPending}
        onConfirm={() => {
          if (!attendance) return;
          markAttendance.mutate(
            {
              enrollmentUuid: attendance.enrolment.uuid ?? '',
              attended: attendance.attended,
              learnerName: learnerName(attendance.enrolment),
            },
            { onSuccess: () => setAttendance(null) }
          );
        }}
      />
    </Sheet>
  );
}
