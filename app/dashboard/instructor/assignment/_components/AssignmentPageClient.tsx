'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/context/profile-context';
import { useAssignmentsByIds, useQuizzesByIds } from '@/hooks/use-batched-lookups';
import useInstructorClassesWithDetails from '@/hooks/use-instructor-classes';
import {
  getAssignmentSchedulesOptions,
  getAssignmentSubmissionsOptions,
  getCourseLessonsOptions,
  getPendingGradingOptions,
  getQuizAttemptsOptions,
  getQuizSchedulesOptions,
  getSubmissionAnalyticsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Assignment,
  AssignmentSubmission,
  ClassAssignmentSchedule,
  ClassQuizSchedule,
  Quiz,
  QuizAttempt,
} from '@/services/client/types.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { useClassEnrollmentsMap } from '../../../../../hooks/use-enrollment-map';
import { AssignmentCard } from './AssignmentCard';
import { AssignmentHeader } from './AssignmentHeader';
import { AssignmentInsights } from './AssignmentInsights';
import { AssignmentQuickActions } from './AssignmentQuickActions';
import { AssignmentToolbar } from './AssignmentToolbar';
import type { AssignmentCardData, AssignmentStatus } from './assignment-types';

type AssignmentScheduleWithClass = ClassAssignmentSchedule & { classUuid: string };
type QuizScheduleWithClass = ClassQuizSchedule & { classUuid: string };

const QUERY_STALE_TIME = 1000 * 60 * 30;
const QUERY_GC_TIME = 1000 * 60 * 60 * 24;

const isDefinedString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

function dedupeByKey<T>(items: T[], getKey: (item: T) => string | null | undefined) {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = getKey(item);
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function formatDueLabel(value?: Date | string) {
  if (!value) return 'No due date';
  const dueDate = new Date(value);
  return Number.isNaN(dueDate.getTime()) ? 'No due date' : `Due ${format(dueDate, 'MMM dd, yyyy')}`;
}

function getTaskStatus(
  dueAt: Date | string | undefined,
  submissionCount: number,
  gradedCount: number,
  taskType: 'assignment' | 'quiz'
): Exclude<AssignmentStatus, 'all'> {
  if (taskType === 'assignment' && submissionCount > 0 && gradedCount >= submissionCount) {
    return 'graded';
  }

  if (dueAt && new Date(dueAt).getTime() < Date.now()) {
    return 'overdue';
  }

  if (submissionCount === 0) {
    return 'pending';
  }

  return 'ongoing';
}

export function AssignmentPageClient() {
  const [activeFilter, setActiveFilter] = useState<AssignmentStatus>('pending');
  const [search, setSearch] = useState('');
  const profile = useUserProfile();
  const instructorUuid = profile?.instructor?.uuid;
  const instructorName = profile?.instructor?.full_name || profile?.full_name || 'Instructor';

  const { classes, loading } = useInstructorClassesWithDetails(instructorUuid);
  const uniqueClasses = useMemo(() => dedupeByKey(classes, item => item.uuid ?? null), [classes]);

  const classUuids = useMemo(
    () => uniqueClasses.map(c => c.uuid ?? ''),
    [uniqueClasses]
  );
  const { classEnrollmentsMap } = useClassEnrollmentsMap(classUuids);

  const uniqueCourses = useMemo(
    () => dedupeByKey(uniqueClasses, item => item.course_uuid ?? null),
    [uniqueClasses]
  );

  const lessonQueries = useQueries({
    queries: uniqueCourses.map(item => ({
      ...getCourseLessonsOptions({
        path: { courseUuid: item.course_uuid as string },
        query: { pageable: { page: 0, size: 100 } },
      }),
      enabled: !!item.course_uuid,
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_GC_TIME,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    })),
  });

  const assignmentScheduleQueries = useQueries({
    queries: uniqueClasses.map(item => ({
      ...getAssignmentSchedulesOptions({ path: { classUuid: item.uuid as string } }),
      enabled: !!item.uuid,
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_GC_TIME,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    })),
  });

  const quizScheduleQueries = useQueries({
    queries: uniqueClasses.map(item => ({
      ...getQuizSchedulesOptions({ path: { classUuid: item.uuid as string } }),
      enabled: !!item.uuid,
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_GC_TIME,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    })),
  });

  const assignmentSchedules = useMemo<AssignmentScheduleWithClass[]>(
    () =>
      classes.flatMap((item, index) =>
        ((assignmentScheduleQueries[index]?.data?.data ?? []) as ClassAssignmentSchedule[]).map(
          schedule => ({
            ...schedule,
            classUuid: item.uuid as string,
          })
        )
      ),
    [assignmentScheduleQueries, classes]
  );

  const quizSchedules = useMemo<QuizScheduleWithClass[]>(
    () =>
      classes.flatMap((item, index) =>
        ((quizScheduleQueries[index]?.data?.data ?? []) as ClassQuizSchedule[]).map(schedule => ({
          ...schedule,
          classUuid: item.uuid as string,
        }))
      ),
    [classes, quizScheduleQueries]
  );

  const uniqueAssignmentUuids = useMemo(
    () =>
      Array.from(new Set(assignmentSchedules.map(item => item.assignment_uuid).filter(isDefinedString))),
    [assignmentSchedules]
  );
  const uniqueQuizUuids = useMemo(
    () => Array.from(new Set(quizSchedules.map(item => item.quiz_uuid).filter(isDefinedString))),
    [quizSchedules]
  );

  const { assignmentMap, isLoading: assignmentsLoading } = useAssignmentsByIds(
    uniqueAssignmentUuids
  );
  const { quizMap, isLoading: quizzesLoading } = useQuizzesByIds(uniqueQuizUuids);

  const assignmentMapMemo = useMemo(
    () => new Map<string, Assignment>(Object.entries(assignmentMap ?? {})),
    [assignmentMap]
  );
  const quizMapMemo = useMemo(
    () => new Map<string, Quiz>(Object.entries(quizMap ?? {})),
    [quizMap]
  );

  // const { assignmentMap } = useAssignmentsMap();
  // const { quizMap } = useQuizMap();

  const assignmentSubmissionQueries = useQueries({
    queries: uniqueAssignmentUuids.map(uuid => ({
      ...getAssignmentSubmissionsOptions({ path: { assignmentUuid: uuid } }),
      enabled: !!uuid,
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_GC_TIME,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    })),
  });

  const quizAttemptQueries = useQueries({
    queries: uniqueQuizUuids.map(uuid => ({
      ...getQuizAttemptsOptions({
        path: { quizUuid: uuid },
        query: { pageable: { page: 0, size: 100 } },
      }),
      enabled: !!uuid,
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_GC_TIME,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    })),
  });

  const assignmentSubmissionMap = useMemo(() => {
    const map = new Map<string, AssignmentSubmission[]>();
    uniqueAssignmentUuids.forEach((uuid, index) => {
      map.set(uuid, assignmentSubmissionQueries[index]?.data?.data ?? []);
    });
    return map;
  }, [assignmentSubmissionQueries, uniqueAssignmentUuids]);

  const quizAttemptMap = useMemo(() => {
    const map = new Map<string, QuizAttempt[]>();
    uniqueQuizUuids.forEach((uuid, index) => {
      map.set(uuid, quizAttemptQueries[index]?.data?.data?.content ?? []);
    });
    return map;
  }, [quizAttemptQueries, uniqueQuizUuids]);

  const classMap = useMemo(
    () => new Map(uniqueClasses.map(item => [item.uuid as string, item])),
    [uniqueClasses]
  );

  const lessonMap = useMemo(() => {
    const map = new Map<string, { lessonTitle: string; courseTitle: string }>();
    uniqueCourses.forEach((course, index) => {
      const lessons = lessonQueries[index]?.data?.data?.content ?? [];
      lessons.forEach(lesson => {
        if (lesson.uuid) {
          map.set(lesson.uuid, {
            lessonTitle: lesson.title || 'Untitled lesson',
            courseTitle: course.course?.name || 'Untitled course',
          });
        }
      });
    });
    return map;
  }, [lessonQueries, uniqueCourses]);

  const taskCards = useMemo<AssignmentCardData[]>(() => {
    const assignmentCards = assignmentSchedules
      .map(schedule => {
        if (!schedule.lesson_uuid) return null;

        const assignment = schedule.assignment_uuid
          ? assignmentMapMemo.get(schedule.assignment_uuid)
          : null;

        const submissions = assignmentSubmissionMap.get(schedule.assignment_uuid ?? '') ?? [];
        const submissionCount = submissions.length;

        const gradedCount = submissions.filter(item => item.is_graded || item.graded_at).length;
        const lessonInfo = lessonMap.get(schedule.lesson_uuid);
        const classInfo = classMap.get(schedule.classUuid);

        const uniqueCount = new Set(
          classInfo?.enrollment?.map((e) => e.student_uuid) ?? []
        ).size;

        const totalLearners = classEnrollmentsMap.get(schedule.classUuid)?.length ?? 0;
        const status = getTaskStatus(schedule.due_at, submissionCount, gradedCount, 'assignment');
        const pendingBadge =
          gradedCount < submissionCount ? `${submissionCount - gradedCount} Pending` : null;
        const metricLabel =
          uniqueCount > 0
            ? `${Math.round((submissionCount / uniqueCount) * 100)}% received`
            : null;

        const assignmentCard: AssignmentCardData = {
          ctaLabel:
            submissionCount > 0 && gradedCount < submissionCount
              ? 'Grade Now'
              : 'View Submissions',
          classUuid: schedule.classUuid,
          scheduleUuid: schedule?.uuid as string,
          classTitle: classInfo?.title || 'Class',
          courseTitle: lessonInfo?.courseTitle || classInfo?.course?.name || '',
          courseId: classInfo?.course_uuid as string,
          uniqueEnrollmentCount: uniqueCount,
          availableCount: totalLearners - uniqueCount,
          dueLabel: formatDueLabel(schedule.due_at || assignment?.due_date),
          iconTone: status === 'overdue' ? 'amber' : 'blue',
          id: `assignment_${assignment?.uuid ?? schedule.uuid ?? ''}`,
          instructor: instructorName,
          lesson: lessonInfo?.lessonTitle || 'Lesson',
          lessonUuid: schedule.lesson_uuid,
          metricValue:
            submissionCount > 0
              ? `${submissionCount}/${uniqueCount || submissionCount} submitted`
              : `${uniqueCount ?? 0} enrolled`,
          status,
          statusLabel: status.charAt(0).toUpperCase() + status.slice(1),
          studentSummary: classInfo?.title || classInfo?.course?.name || 'Class',
          subtitle: assignment?.title || 'Assignment',
          submissionCount,
          taskType: 'assignment',
        };

        if (pendingBadge) {
          assignmentCard.badge = pendingBadge;
        }
        if (metricLabel) {
          assignmentCard.metricLabel = metricLabel;
        }
        if (assignment?.rubric_uuid) {
          assignmentCard.rubricUuid = assignment.rubric_uuid;
        }

        return assignmentCard;
      })
      .filter((item): item is AssignmentCardData => item !== null);

    const quizCards = quizSchedules
      .map(schedule => {
        if (!schedule.lesson_uuid) return null;

        const quiz = schedule.quiz_uuid ? quizMapMemo.get(schedule.quiz_uuid) : null;
        const attempts = quizAttemptMap.get(schedule.quiz_uuid ?? '') ?? [];
        const submissionCount = attempts.length;

        const completedCount = attempts.filter(item => item.is_completed || item.submitted_at).length;
        const lessonInfo = lessonMap.get(schedule.lesson_uuid);
        const classInfo = classMap.get(schedule.classUuid);

        const uniqueCount = new Set(
          classInfo?.enrollment?.map((e) => e.student_uuid)
        ).size;

        const totalLearners = classEnrollmentsMap.get(schedule.classUuid)?.length ?? 0;
        const status = getTaskStatus(schedule.due_at, submissionCount, completedCount, 'quiz');
        const pendingBadge =
          completedCount < submissionCount ? `${submissionCount - completedCount} Pending` : null;
        const metricLabel =
          uniqueCount > 0
            ? `${Math.round((submissionCount / uniqueCount) * 100)}% attempted`
            : null;

        const quizCard: AssignmentCardData = {
          ctaLabel: 'View Submissions',
          classUuid: schedule.classUuid,
          scheduleUuid: schedule?.uuid as string,
          classTitle: classInfo?.title || 'Class',
          courseTitle: lessonInfo?.courseTitle || classInfo?.course?.name || 'Course',
          courseId: classInfo?.course_uuid as string,
          uniqueEnrollmentCount: uniqueCount,
          availableCount: totalLearners - uniqueCount,
          dueLabel: formatDueLabel(schedule.due_at),
          iconTone: status === 'overdue' ? 'amber' : 'blue',
          id: `quiz_${quiz?.uuid ?? schedule.uuid ?? ''}`,
          instructor: instructorName,
          lesson: lessonInfo?.lessonTitle || 'Lesson',
          lessonUuid: schedule.lesson_uuid,
          metricValue:
            submissionCount > 0
              ? `${submissionCount}/${uniqueCount || submissionCount} attempts`
              : `${uniqueCount ?? 0} enrolled`,
          status,
          statusLabel: status.charAt(0).toUpperCase() + status.slice(1),
          studentSummary: classInfo?.title || classInfo?.course?.name || 'Class',
          subtitle: quiz?.title || 'Quiz',
          submissionCount,
          taskType: 'quiz',
        };

        if (pendingBadge) {
          quizCard.badge = pendingBadge;
        }
        if (metricLabel) {
          quizCard.metricLabel = metricLabel;
        }
        if (quiz?.rubric_uuid) {
          quizCard.rubricUuid = quiz.rubric_uuid;
        }

        return quizCard;
      })
      .filter((item): item is AssignmentCardData => item !== null);

    return [...assignmentCards, ...quizCards].sort((left, right) => left.lesson.localeCompare(right.lesson));
  }, [
    assignmentMapMemo,
    assignmentSchedules,
    assignmentSubmissionMap,
    classMap,
    classEnrollmentsMap,
    instructorName,
    lessonMap,
    quizAttemptMap,
    quizMapMemo,
    quizSchedules,
  ]);

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return taskCards.filter(item => {
      const matchesFilter = activeFilter === 'all' || item.status === activeFilter;
      const matchesSearch =
        !query ||
        [item.lesson, item.subtitle, item.courseTitle, item.classTitle, item.taskType]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, search, taskCards]);

  const scheduleLoading = assignmentScheduleQueries.some(query => query.isPending) ||
    quizScheduleQueries.some(query => query.isPending);

  const hasScheduleData = assignmentSchedules.length + quizSchedules.length > 0;
  const isInitialLoading = loading || (!hasScheduleData && scheduleLoading);

  const { data: pendingGradingData } = useQuery({
    ...getPendingGradingOptions({ path: { instructorUuid: instructorUuid as string } }),
    enabled: !!instructorUuid,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const analyticsQuery = useQueries({
    queries: uniqueAssignmentUuids.slice(0, 12).map(uuid => ({
      ...getSubmissionAnalyticsOptions({ path: { assignmentUuid: uuid } }),
      enabled: !!uuid,
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_GC_TIME,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    })),
  });

  const insights = useMemo(() => {
    const totalTasks = taskCards.length;
    const totalSubmissions = taskCards.reduce((sum, item) => sum + (item.submissionCount ?? 0), 0);
    const overdueTasks = taskCards.filter(item => item.status === 'overdue').length;
    const pendingGrading = pendingGradingData?.data?.length ?? 0;
    const analyticsValues = analyticsQuery.flatMap(query =>
      Object.values(query.data?.data ?? {}).filter(value => typeof value === 'number')
    ) as number[];
    const averageSignal = analyticsValues.length
      ? `${Math.round(analyticsValues.reduce((sum, value) => sum + value, 0) / analyticsValues.length)}`
      : '0';

    return {
      averageSignal,
      overdueTasks,
      pendingGrading,
      totalSubmissions,
      totalTasks,
    };
  }, [analyticsQuery, pendingGradingData?.data, taskCards]);

  return (
    <main className='bg-background mb-10 p-3 sm:p-4 md:p-6'>
      <div className='mx-auto w-full max-w-screen-2xl space-y-4 sm:space-y-5'>
        <AssignmentHeader />

        <AssignmentToolbar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          search={search}
          setSearch={setSearch}
        />

        <div className='grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]'>
          <section className='min-w-0 space-y-5'>
            {isInitialLoading ? (
              <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-1'>
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className='rounded-2xl border border-border/70 bg-card p-4 shadow-sm'>
                    <div className='flex items-center justify-between gap-3'>
                      <Skeleton className='h-5 w-32 rounded-full' />
                      <Skeleton className='h-8 w-20 rounded-full' />
                    </div>
                    <div className='mt-4 space-y-3'>
                      <Skeleton className='h-5 w-3/4 rounded-full' />
                      <Skeleton className='h-4 w-1/2 rounded-full' />
                      <div className='flex gap-2'>
                        <Skeleton className='h-10 w-10 rounded-xl' />
                        <Skeleton className='h-10 flex-1 rounded-xl' />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAssignments.length > 0 ? (
              <div className="flex flex-row flex-wrap gap-4">
                {filteredAssignments.map((assignment, index) => (
                  <AssignmentCard
                    key={`${assignment.id}-${index}`}
                    assignment={assignment}
                  />
                ))}
              </div>
            ) : (
              <div className='border-border/70 bg-card rounded-xl border border-dashed p-4 text-xs text-muted-foreground shadow-sm sm:p-6 sm:text-sm'>
                No lesson tasks with student submissions were found for this instructor
                yet.
              </div>
            )}
          </section>

          <aside className='space-y-4'>
            <AssignmentInsights insights={insights} />
            <AssignmentQuickActions insights={insights} />
          </aside>
        </div>
      </div>
    </main>
  );
}
