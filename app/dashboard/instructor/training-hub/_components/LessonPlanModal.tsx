'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { localDate } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import {
  assignScheduledInstanceLessonMutation,
  getClassScheduleInfiniteOptions,
  getClassScheduleQueryKey,
  getCourseLessonsInfiniteOptions,
  getInstructorScheduleQueryKey,
  getProgramCoursesOptions,
  getScheduledInstanceQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import type { Lesson, PageMetadata, ScheduledInstance } from '@/services/client/types.gen';
import { useInfiniteQuery, useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { BookOpen, CalendarDays, Pencil } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { assignedLesson, AUTOMATIC_LESSON as AUTOMATIC, canEditLesson } from './lesson-plan';
import type { TrainingHubLiveClass } from './training-hub-data';

const PAGE_SIZE = 50;
type CourseOption = { uuid: string; name: string };

function nextPage(metadata: PageMetadata | undefined, pageCount: number) {
  if (metadata?.hasNext === false || metadata?.last === true) return undefined;
  if (metadata?.hasNext || (metadata?.totalPages ?? 0) > pageCount) {
    return pageCount;
  }
  return undefined;
}

function sessionTimeRange(session: ScheduledInstance) {
  if (session.time_range) return session.time_range;
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: session.timezone,
  });
  return `${formatter.format(new Date(session.start_time))} – ${formatter.format(new Date(session.end_time))}`;
}

export function LessonPlanModal({
  liveClass,
  open,
  onOpenChange,
  onPlanSaved,
  initialView,
}: {
  liveClass: TrainingHubLiveClass;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanSaved: () => void;
  initialView: boolean;
}) {
  const [saving, setSaving] = useState(false);

  return (
    <Sheet open={open} onOpenChange={value => !saving && onOpenChange(value)}>
      <SheetContent side='right' className='flex w-full flex-col gap-0 p-0 sm:max-w-4xl'>
        <SheetHeader className='shrink-0 border-b px-6 py-6 pr-12'>
          <SheetTitle>Lesson plan — {liveClass.title}</SheetTitle>
          <SheetDescription>
            View the lesson UUID attached to each scheduled session. You can change lesson
            assignments for future sessions. Automatic has no attached lesson UUID and uses
            the lesson matching the session's position in the schedule.
          </SheetDescription>
        </SheetHeader>
        {open && liveClass.classUuid && (
          <LessonPlanContent
            liveClass={liveClass}
            onClose={() => onOpenChange(false)}
            onSavingChange={setSaving}
            onPlanSaved={onPlanSaved}
            initialView={initialView}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function LessonPlanContent({
  liveClass,
  onClose,
  onSavingChange,
  onPlanSaved,
  initialView,
}: {
  liveClass: TrainingHubLiveClass;
  onClose: () => void;
  onSavingChange: (saving: boolean) => void;
  onPlanSaved: () => void;
  initialView: boolean;
}) {
  const scheduleQuery = useInfiniteQuery({
    ...getClassScheduleInfiniteOptions({
      path: { uuid: liveClass.classUuid },
      query: { pageable: { page: 0, size: PAGE_SIZE } },
    }),
    initialPageParam: {
      path: { uuid: liveClass.classUuid },
      query: { pageable: { page: 0, size: PAGE_SIZE } },
    },
    getNextPageParam: (lastPage, pages) => {
      const page = nextPage(lastPage.data?.metadata, pages.length);
      return page === undefined
        ? undefined
        : {
          path: { uuid: liveClass.classUuid },
          query: { pageable: { page, size: PAGE_SIZE } },
        };
    },
    enabled: Boolean(liveClass.classUuid),
    staleTime: STALE_TIMES.live,
  });

  const programUuid = liveClass.class.program_uuid;
  const programQueries = useQueries({
    queries: [programUuid]
      .filter((uuid): uuid is string => Boolean(uuid))
      .map(uuid => ({
        ...getProgramCoursesOptions({ path: { programUuid: uuid } }),
        enabled: Boolean(uuid),
        staleTime: STALE_TIMES.entity,
      })),
  });
  const programQuery = programQueries[0];
  const courses = useMemo<CourseOption[]>(() => {
    if (programUuid) {
      return (programQuery?.data?.data ?? liveClass.programCourses ?? [])
        .filter((course): course is typeof course & { uuid: string } => Boolean(course.uuid))
        .map(course => ({ uuid: course.uuid, name: course.name }));
    }
    const uuid = liveClass.class.course_uuid;
    return uuid ? [{ uuid, name: liveClass.class.course?.name ?? 'Class course' }] : [];
  }, [programUuid, programQuery?.data, liveClass]);

  const sessions = useMemo(() => {
    const unique = new Map<string, ScheduledInstance & { uuid: string }>();
    for (const page of scheduleQuery.data?.pages ?? []) {
      for (const session of page.data?.content ?? []) {
        if (session.uuid) unique.set(session.uuid, { ...session, uuid: session.uuid });
      }
    }
    return [...unique.values()].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  }, [scheduleQuery.data]);

  useEffect(() => {
    if (
      scheduleQuery.hasNextPage &&
      !scheduleQuery.isFetching &&
      !scheduleQuery.isFetchNextPageError
    ) {
      void scheduleQuery.fetchNextPage();
    }
  }, [
    scheduleQuery.hasNextPage,
    scheduleQuery.isFetching,
    scheduleQuery.isFetchNextPageError,
    scheduleQuery.fetchNextPage,
  ]);

  if (
    scheduleQuery.isError ||
    programQuery?.isError ||
    scheduleQuery.data?.pages.some(page => page.success === false)
  ) {
    return (
      <EmptyState
        title='Unable to load the lesson plan'
        description='Please try loading the sessions and courses again.'
        action={
          <Button
            variant='outline'
            onClick={() => {
              void scheduleQuery.refetch();
              void programQuery?.refetch();
            }}
          >
            Try again
          </Button>
        }
      />
    );
  }

  if (scheduleQuery.isPending || scheduleQuery.hasNextPage || programQuery?.isPending) {
    return <PlanSkeleton />;
  }

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title='No scheduled sessions'
        description='Schedule sessions for this class before adding a lesson plan.'
      />
    );
  }

  if (courses.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title='No courses available'
        description='This class needs a course with lessons before you can create its lesson plan.'
      />
    );
  }

  return (
    <LessonPlanDetails
      courses={courses}
      sessions={sessions}
      classUuid={liveClass.classUuid}
      onClose={onClose}
      onSavingChange={onSavingChange}
      onPlanSaved={onPlanSaved}
      initialView={initialView}
    />
  );
}

function LessonPlanDetails({
  courses,
  sessions,
  classUuid,
  onClose,
  onSavingChange,
  onPlanSaved,
  initialView,
}: {
  courses: CourseOption[];
  sessions: (ScheduledInstance & { uuid: string })[];
  classUuid: string;
  onClose: () => void;
  onSavingChange: (saving: boolean) => void;
  onPlanSaved: () => void;
  initialView: boolean;
}) {
  const [editing, setEditing] = useState(() =>
    !initialView && !sessions.some(session => assignedLesson(session) !== AUTOMATIC)
  );

  if (editing) {
    return (
      <LessonPlanEditor
        courses={courses}
        sessions={sessions}
        classUuid={classUuid}
        onClose={onClose}
        onSavingChange={onSavingChange}
        onPlanSaved={onPlanSaved}
      />
    );
  }

  return (
    <>
      <div className='min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4'>
        <div className='space-y-1'>
          <p className='text-muted-foreground text-xs'>
            {courses.length === 1 ? 'Course' : 'Program courses'}
          </p>
          <p className='text-sm font-medium'>{courses.map(course => course.name).join(', ')}</p>
        </div>
        {sessions.map((session, index) => {
          const lessonUuid = assignedLesson(session);
          return (
            <Card key={session.uuid} className='py-0'>
              <CardContent className='space-y-3 p-4'>
                <div className='space-y-1'>
                  <h3 className='text-sm font-medium'>Session {index + 1} · {session.title}</h3>
                  <p className='text-muted-foreground text-xs'>{sessionTimeRange(session)}</p>
                  {session.status && (
                    <Badge variant='secondary'>{session.status.replaceAll('_', ' ')}</Badge>
                  )}
                </div>
                <div className='space-y-1'>
                  <p className='text-muted-foreground text-xs'>Attached lesson UUID</p>
                  {lessonUuid === AUTOMATIC ? (
                    <p className='text-muted-foreground text-sm'>No lesson UUID attached</p>
                  ) : (
                    <p className='text-foreground break-all font-mono text-sm'>{lessonUuid}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <SheetFooter className='shrink-0 border-t px-6 py-4 sm:flex-row sm:items-center'>
        <Button variant='outline' onClick={onClose}>Close</Button>
        <Button
          disabled={!sessions.some(session => canEditLesson(session))}
          onClick={() => setEditing(true)}
        >
          <Pencil className='size-4' />
          Edit lesson plan
        </Button>
      </SheetFooter>
    </>
  );
}

function LessonPlanEditor({
  courses,
  sessions,
  classUuid,
  onClose,
  onSavingChange,
  onPlanSaved,
}: {
  courses: CourseOption[];
  sessions: (ScheduledInstance & { uuid: string })[];
  classUuid: string;
  onClose: () => void;
  onSavingChange: (saving: boolean) => void;
  onPlanSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const [courseSelection, setCourseSelection] = useState<string>();
  const courseUuid = courseSelection ?? courses[0]!.uuid;
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkLesson, setBulkLesson] = useState(AUTOMATIC);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [knownLessons, setKnownLessons] = useState<Record<string, Lesson & { uuid: string }>>({});
  const [saveError, setSaveError] = useState('');
  const [now, setNow] = useState(Date.now);
  const editableSessions = useMemo(
    () => sessions.filter(session => canEditLesson(session, now)),
    [sessions, now]
  );
  const selectedEditable = useMemo(
    () => selected.filter(uuid => editableSessions.some(session => session.uuid === uuid)),
    [selected, editableSessions]
  );

  useEffect(() => {
    const nextStart = Math.min(
      ...sessions.map(session => new Date(session.start_time).getTime()).filter(time => time > now)
    );
    if (!Number.isFinite(nextStart)) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.min(nextStart - Date.now(), 2_147_483_647));
    return () => clearTimeout(timer);
  }, [sessions, now]);

  const lessonsQuery = useInfiniteQuery({
    ...getCourseLessonsInfiniteOptions({
      path: { courseUuid },
      query: { pageable: { page: 0, size: PAGE_SIZE } },
    }),
    initialPageParam: {
      path: { courseUuid },
      query: { pageable: { page: 0, size: PAGE_SIZE } },
    },
    getNextPageParam: (lastPage, pages) => {
      const page = nextPage(lastPage.data?.metadata, pages.length);
      return page === undefined
        ? undefined
        : {
          path: { courseUuid },
          query: { pageable: { page, size: PAGE_SIZE } },
        };
    },
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.entity,
  });
  const lessons = useMemo(
    () =>
      (lessonsQuery.data?.pages ?? [])
        .flatMap(page => page.data?.content ?? [])
        .filter((lesson): lesson is Lesson & { uuid: string } => Boolean(lesson.uuid))
        .sort((a, b) => a.lesson_number - b.lesson_number),
    [lessonsQuery.data]
  );

  useEffect(() => {
    if (
      lessonsQuery.hasNextPage &&
      !lessonsQuery.isFetching &&
      !lessonsQuery.isFetchNextPageError
    ) {
      void lessonsQuery.fetchNextPage();
    }
  }, [
    lessonsQuery.hasNextPage,
    lessonsQuery.isFetching,
    lessonsQuery.isFetchNextPageError,
    lessonsQuery.fetchNextPage,
  ]);

  useEffect(() => {
    setKnownLessons(previous => ({
      ...previous,
      ...Object.fromEntries(lessons.map(lesson => [lesson.uuid, lesson])),
    }));
  }, [lessons]);

  const assignLessonMutation = useMutation(assignScheduledInstanceLessonMutation());
  const saveMutation = useMutation({
    mutationFn: async (changes: [string, string][]) => {
      const results: { uuid: string; lesson: string; success: boolean }[] = [];
      // Keep writes bounded. Retrying only the failed drafts avoids re-saving successful sessions.
      for (const [uuid, lesson] of changes) {
        try {
          const session = sessions.find(session => session.uuid === uuid);
          if (!session || !canEditLesson(session)) {
            throw new Error('Only future sessions can be changed');
          }
          const response = await assignLessonMutation.mutateAsync({
            path: { instanceUuid: uuid },
            query: lesson === AUTOMATIC ? {} : { lessonUuid: lesson },
          });
          if (!response || response.success === false || response.error)
            throw new Error('Assignment failed');
          results.push({ uuid, lesson, success: true });
        } catch {
          results.push({ uuid, lesson, success: false });
        }
      }
      return results;
    },
    onSuccess: async results => {
      const successful = results.filter(result => result.success);
      const failed = results.length - successful.length;
      setSaved(previous => ({
        ...previous,
        ...Object.fromEntries(successful.map(result => [result.uuid, result.lesson])),
      }));
      setDrafts(previous =>
        Object.fromEntries(
          Object.entries(previous).filter(
            ([uuid]) => !successful.some(result => result.uuid === uuid)
          )
        )
      );
      const invalidations = successful.map(result =>
        queryClient.invalidateQueries({
          queryKey: getScheduledInstanceQueryKey({ path: { instanceUuid: result.uuid } }),
        })
      );
      const instructorUuid = sessions[0]?.instructor_uuid;
      if (successful.length) {
        onPlanSaved();
        // Drop pagination from the canonical key to refresh all schedule pages,
        // including both regular and infinite query consumers.
        invalidations.push(queryClient.invalidateQueries({
          queryKey: getClassScheduleQueryKey({
            path: { uuid: classUuid },
            query: { pageable: {} },
          }).map(({ query, ...key }) => key),
        }));
      }
      if (successful.length && instructorUuid) {
        invalidations.push(queryClient.invalidateQueries({
          queryKey: getInstructorScheduleQueryKey({
            path: { instructorUuid },
            query: {
              start: localDate(sessions[0]!.start_time),
              end: localDate(sessions[sessions.length - 1]!.end_time),
            },
          }).map(({ query, ...key }) => key),
        }));
      }
      await Promise.all(invalidations);
      if (failed) {
        const message = `${failed} session${failed === 1 ? '' : 's'} could not be saved. ${successful.length} saved successfully. Only future sessions can be changed. Retry any remaining eligible changes.`;
        setSaveError(message);
        toast.error(message);
      } else {
        setSaveError('');
        toast.success('Lesson plan saved');
        onClose();
      }
    },
    onSettled: () => {
      onSavingChange(false);
      setNow(Date.now());
    },
  });

  const currentLesson = (session: ScheduledInstance & { uuid: string }) =>
    (canEditLesson(session, now) ? drafts[session.uuid] : undefined) ??
    saved[session.uuid] ?? assignedLesson(session);
  const setLesson = (session: ScheduledInstance & { uuid: string }, lesson: string) => {
    if (!canEditLesson(session)) return;
    setDrafts(previous => {
      const next = { ...previous };
      if (lesson === (saved[session.uuid] ?? assignedLesson(session))) delete next[session.uuid];
      else next[session.uuid] = lesson;
      return next;
    });
  };
  const lessonsLoading = lessonsQuery.isPending || lessonsQuery.hasNextPage;
  const lessonsError =
    lessonsQuery.isError || lessonsQuery.data?.pages.some(page => page.success === false);
  const allSelected = editableSessions.length > 0 && selectedEditable.length === editableSessions.length;
  const changes = Object.entries(drafts).filter(([uuid]) =>
    editableSessions.some(session => session.uuid === uuid)
  );

  const lessonSelect = (value: string, onChange: (value: string) => void, label: string, readOnly = false) => (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={readOnly || saveMutation.isPending || lessonsLoading || Boolean(lessonsError)}
    >
      <SelectTrigger className='w-full sm:min-w-64' aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={AUTOMATIC}>Automatic (by session order)</SelectItem>
        {value !== AUTOMATIC && !lessons.some(lesson => lesson.uuid === value) && (
          <SelectItem value={value}>
            {knownLessons[value]?.title ?? 'Assigned lesson (another course)'}
          </SelectItem>
        )}
        {lessons.map(lesson => (
          <SelectItem key={lesson.uuid} value={lesson.uuid}>
            {lesson.lesson_number}. {lesson.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <>
      <div className='min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4'>
        {courses.length > 1 && (
          <div className='space-y-2'>
            <p className='text-sm font-medium'>Choose a course to view its lessons</p>
            <Select
              value={courseUuid}
              onValueChange={value => {
                setCourseSelection(value);
                setBulkLesson(AUTOMATIC);
              }}
              disabled={saveMutation.isPending}
            >
              <SelectTrigger className='w-full' aria-label='Course'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {courses.map(course => (
                  <SelectItem key={course.uuid} value={course.uuid}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {lessonsLoading && (
          <div role='status' className='text-muted-foreground flex items-center gap-2 text-sm'>
            <Spinner />
            Loading lessons…
          </div>
        )}
        {lessonsError && (
          <EmptyState
            variant='compact'
            title='Unable to load lessons'
            action={
              <Button variant='outline' onClick={() => void lessonsQuery.refetch()}>
                Try again
              </Button>
            }
          />
        )}
        {!lessonsLoading && !lessonsError && lessons.length === 0 && (
          <EmptyState
            variant='compact'
            title='No lessons in this course'
            description='Add lessons to the course to assign them to sessions.'
          />
        )}
        <div className='bg-muted/40 space-y-3 rounded-lg border p-3'>
          <div className='flex items-center gap-2'>
            <Checkbox
              id='select-all-sessions'
              checked={allSelected ? true : selectedEditable.length ? 'indeterminate' : false}
              onCheckedChange={checked =>
                setSelected(checked === true ? editableSessions.map(session => session.uuid) : [])
              }
              disabled={saveMutation.isPending || !editableSessions.length}
            />
            <label htmlFor='select-all-sessions' className='text-sm font-medium'>
              Select all {editableSessions.length} future sessions
            </label>
            <Badge variant='secondary'>{selectedEditable.length} selected</Badge>
          </div>
          <div className='flex flex-col gap-2 sm:flex-row'>
            {lessonSelect(bulkLesson, setBulkLesson, 'Lesson for selected sessions', !editableSessions.length)}
            <Button
              variant='outline'
              className='shrink-0'
              disabled={
                !selectedEditable.length ||
                saveMutation.isPending ||
                lessonsLoading ||
                Boolean(lessonsError)
              }
              onClick={() => {
                for (const session of sessions)
                  if (selectedEditable.includes(session.uuid)) setLesson(session, bulkLesson);
              }}
            >
              Apply to selected
            </Button>
          </div>
        </div>
        <div className='space-y-3'>
          {sessions.map((session, index) => (
            <Card key={session.uuid} className='py-0'>
              <CardContent className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center'>
                <div className='flex min-w-0 flex-1 items-start gap-3'>
                  <Checkbox
                    id={`lesson-session-${session.uuid}`}
                    className='mt-1'
                    checked={selectedEditable.includes(session.uuid)}
                    disabled={saveMutation.isPending || !canEditLesson(session, now)}
                    onCheckedChange={checked =>
                      setSelected(previous =>
                        checked === true
                          ? [...previous, session.uuid]
                          : previous.filter(uuid => uuid !== session.uuid)
                      )
                    }
                  />
                  <div className='min-w-0 space-y-1'>
                    <label
                      htmlFor={`lesson-session-${session.uuid}`}
                      className='text-sm font-medium'
                    >
                      Session {index + 1} · {session.title}
                    </label>
                    <p className='text-muted-foreground text-xs'>
                      {sessionTimeRange(session)}
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      {session.status && (
                        <Badge variant='secondary'>{session.status.replaceAll('_', ' ')}</Badge>
                      )}
                      {session.timezone && (
                        <span className='text-muted-foreground text-xs'>{session.timezone}</span>
                      )}
                      {!canEditLesson(session, now) && <Badge variant='outline'>Read-only</Badge>}
                      {drafts[session.uuid] !== undefined && canEditLesson(session, now) && (
                        <Badge variant='outline'>Unsaved</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className='w-full sm:w-72'>
                  {lessonSelect(
                    currentLesson(session),
                    value => setLesson(session, value),
                    `Lesson for session ${index + 1}`,
                    !canEditLesson(session, now)
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {saveError && (
          <p role='alert' className='text-destructive text-sm'>
            {saveError}
          </p>
        )}
      </div>
      <SheetFooter className='shrink-0 border-t px-6 py-4 sm:flex-row sm:items-center'>
        <p className='text-muted-foreground mr-auto self-center text-sm'>
          {changes.length} unsaved session{changes.length === 1 ? '' : 's'}
        </p>
        <Button variant='outline' disabled={saveMutation.isPending} onClick={onClose}>
          Close
        </Button>
        <Button
          disabled={!changes.length || saveMutation.isPending}
          onClick={() => {
            onSavingChange(true);
            saveMutation.mutate(changes);
          }}
        >
          {saveMutation.isPending && <Spinner />}{' '}
          {saveMutation.isPending ? 'Saving…' : 'Save lesson plan'}
        </Button>
      </SheetFooter>
    </>
  );
}

function PlanSkeleton() {
  return (
    <div role='status' aria-label='Loading lesson plan' className='space-y-3 px-6 py-4'>
      {[0, 1, 2].map(index => (
        <Skeleton key={index} className='h-24 w-full' />
      ))}
    </div>
  );
}
