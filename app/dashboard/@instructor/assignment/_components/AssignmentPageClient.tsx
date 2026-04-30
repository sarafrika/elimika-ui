'use client';

import { useUserProfile } from '@/context/profile-context';
import useInstructorClassesWithDetails from '@/hooks/use-instructor-classes';
import {
  getAssignmentByUuidOptions,
  getAssignmentSchedulesOptions,
  getAssignmentSubmissionsOptions,
  getCourseLessonsOptions,
  getEnrollmentsForClassOptions,
  getPendingGradingOptions,
  getQuizAttemptsOptions,
  getQuizByUuidOptions,
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
import { AssignmentCard } from './AssignmentCard';
import { AssignmentHeader } from './AssignmentHeader';
import { AssignmentInsights } from './AssignmentInsights';
import { AssignmentQuickActions } from './AssignmentQuickActions';
import { AssignmentToolbar } from './AssignmentToolbar';
import type { AssignmentCardData, AssignmentStatus } from './assignment-types';

type AssignmentScheduleWithClass = ClassAssignmentSchedule & { classUuid: string };
type QuizScheduleWithClass = ClassQuizSchedule & { classUuid: string };

const isDefinedString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

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

  return 'ongoing';
}

export function AssignmentPageClient() {
  const [activeFilter, setActiveFilter] = useState<AssignmentStatus>('all');
  const [search, setSearch] = useState('');
  const profile = useUserProfile();
  const instructorUuid = profile?.instructor?.uuid;
  const instructorName = profile?.instructor?.full_name || profile?.full_name || 'Instructor';

  const { classes, loading } = useInstructorClassesWithDetails(instructorUuid);

  const classEnrollmentQueries = useQueries({
    queries: classes.map(item => ({
      ...getEnrollmentsForClassOptions({ path: { uuid: item.uuid as string } }),
      enabled: !!item.uuid,
      staleTime: 60 * 1000,
    })),
  });

  const lessonQueries = useQueries({
    queries: classes.map(item => ({
      ...getCourseLessonsOptions({
        path: { courseUuid: item.course_uuid as string },
        query: { pageable: { page: 0, size: 100 } },
      }),
      enabled: !!item.course_uuid,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const assignmentScheduleQueries = useQueries({
    queries: classes.map(item => ({
      ...getAssignmentSchedulesOptions({ path: { classUuid: item.uuid as string } }),
      enabled: !!item.uuid,
      staleTime: 60 * 1000,
    })),
  });

  const quizScheduleQueries = useQueries({
    queries: classes.map(item => ({
      ...getQuizSchedulesOptions({ path: { classUuid: item.uuid as string } }),
      enabled: !!item.uuid,
      staleTime: 60 * 1000,
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

  const assignmentQueries = useQueries({
    queries: uniqueAssignmentUuids.map(uuid => ({
      ...getAssignmentByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
      staleTime: 5 * 60 * 1000,
    })),
  });
  const quizQueries = useQueries({
    queries: uniqueQuizUuids.map(uuid => ({
      ...getQuizByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const assignmentMap = useMemo(() => {
    const map = new Map<string, Assignment>();
    uniqueAssignmentUuids.forEach((uuid, index) => {
      const data = assignmentQueries[index]?.data?.data;
      if (data && uuid) {
        map.set(uuid, data);
      }
    });
    return map;
  }, [assignmentQueries, uniqueAssignmentUuids]);

  const quizMap = useMemo(() => {
    const map = new Map<string, Quiz>();
    uniqueQuizUuids.forEach((uuid, index) => {
      const data = quizQueries[index]?.data?.data;
      if (data && uuid) {
        map.set(uuid, data);
      }
    });
    return map;
  }, [quizQueries, uniqueQuizUuids]);

  const assignmentSubmissionQueries = useQueries({
    queries: uniqueAssignmentUuids.map(uuid => ({
      ...getAssignmentSubmissionsOptions({ path: { assignmentUuid: uuid } }),
      enabled: !!uuid,
      staleTime: 60 * 1000,
    })),
  });

  const quizAttemptQueries = useQueries({
    queries: uniqueQuizUuids.map(uuid => ({
      ...getQuizAttemptsOptions({
        path: { quizUuid: uuid },
        query: { pageable: { page: 0, size: 100 } },
      }),
      enabled: !!uuid,
      staleTime: 60 * 1000,
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

  const classMap = useMemo(() => new Map(classes.map(item => [item.uuid as string, item])), [classes]);

  const enrollmentCountMap = useMemo(() => {
    const map = new Map<string, number>();
    classes.forEach((item, index) => {
      map.set(item.uuid as string, classEnrollmentQueries[index]?.data?.data?.length ?? 0);
    });
    return map;
  }, [classEnrollmentQueries, classes]);

  const lessonMap = useMemo(() => {
    const map = new Map<
      string,
      {
        lessonTitle: string;
        courseTitle: string;
      }
    >();

    classes.forEach((item, index) => {
      const lessons = lessonQueries[index]?.data?.data?.content ?? [];
      lessons.forEach(lesson => {
        if (lesson.uuid) {
          map.set(lesson.uuid, {
            lessonTitle: lesson.title || 'Untitled lesson',
            courseTitle: item.course?.name || 'Untitled course',
          });
        }
      });
    });

    return map;
  }, [classes, lessonQueries]);

  const taskCards = useMemo<AssignmentCardData[]>(() => {
    const assignmentCards = assignmentSchedules
      .map(schedule => {
        const assignment = schedule.assignment_uuid ? assignmentMap.get(schedule.assignment_uuid) : null;
        if (!assignment?.uuid || !schedule.lesson_uuid) return null;

        const submissions = assignmentSubmissionMap.get(assignment.uuid) ?? [];
        const submissionCount = submissions.length;

        const gradedCount = submissions.filter(item => item.is_graded || item.graded_at).length;
        const lessonInfo = lessonMap.get(schedule.lesson_uuid);
        const classInfo = classMap.get(schedule.classUuid);
        const totalLearners = enrollmentCountMap.get(schedule.classUuid) ?? 0;
        const status = getTaskStatus(schedule.due_at, submissionCount, gradedCount, 'assignment');
        const pendingBadge =
          gradedCount < submissionCount ? `${submissionCount - gradedCount} Pending` : null;
        const metricLabel =
          totalLearners > 0
            ? `${Math.round((submissionCount / totalLearners) * 100)}% received`
            : null;

        const assignmentCard: AssignmentCardData = {
          ctaLabel:
            submissionCount > 0 && gradedCount < submissionCount
              ? 'Grade Now'
              : 'View Submissions',
          classUuid: schedule.classUuid,
          scheduleUuid: schedule?.uuid as string,
          classTitle: classInfo?.title || 'Class',
          courseTitle: lessonInfo?.courseTitle || classInfo?.course?.name || 'Course',
          dueLabel: formatDueLabel(schedule.due_at || assignment.due_date),
          iconTone: status === 'overdue' ? 'amber' : 'blue',
          id: `assignment_${assignment.uuid}`,
          instructor: instructorName,
          lesson: lessonInfo?.lessonTitle || 'Lesson',
          lessonUuid: schedule.lesson_uuid,
          metricValue: `${submissionCount}/${totalLearners || submissionCount} submitted`,
          status,
          statusLabel: status.charAt(0).toUpperCase() + status.slice(1),
          studentSummary: classInfo?.title || classInfo?.course?.name || 'Class',
          subtitle: assignment.title || 'Assignment',
          submissionCount,
          taskType: 'assignment',
        };

        if (pendingBadge) {
          assignmentCard.badge = pendingBadge;
        }
        if (metricLabel) {
          assignmentCard.metricLabel = metricLabel;
        }
        if (assignment.rubric_uuid) {
          assignmentCard.rubricUuid = assignment.rubric_uuid;
        }

        return assignmentCard;
      })
      .filter((item): item is AssignmentCardData => item !== null);

    const quizCards = quizSchedules
      .map(schedule => {
        const quiz = schedule.quiz_uuid ? quizMap.get(schedule.quiz_uuid) : null;
        if (!quiz?.uuid || !schedule.lesson_uuid) return null;

        const attempts = quizAttemptMap.get(quiz.uuid) ?? [];
        const submissionCount = attempts.length;

        const completedCount = attempts.filter(item => item.is_completed || item.submitted_at).length;
        const lessonInfo = lessonMap.get(schedule.lesson_uuid);
        const classInfo = classMap.get(schedule.classUuid);
        const totalLearners = enrollmentCountMap.get(schedule.classUuid) ?? 0;
        const status = getTaskStatus(schedule.due_at, submissionCount, completedCount, 'quiz');
        const pendingBadge =
          completedCount < submissionCount ? `${submissionCount - completedCount} Pending` : null;
        const metricLabel =
          totalLearners > 0
            ? `${Math.round((submissionCount / totalLearners) * 100)}% attempted`
            : null;

        const quizCard: AssignmentCardData = {
          ctaLabel: 'View Submissions',
          classUuid: schedule.classUuid,
          scheduleUuid: schedule?.uuid as string,
          classTitle: classInfo?.title || 'Class',
          courseTitle: lessonInfo?.courseTitle || classInfo?.course?.name || 'Course',
          dueLabel: formatDueLabel(schedule.due_at),
          iconTone: status === 'overdue' ? 'amber' : 'blue',
          id: `quiz_${quiz.uuid}`,
          instructor: instructorName,
          lesson: lessonInfo?.lessonTitle || 'Lesson',
          lessonUuid: schedule.lesson_uuid,
          metricValue: `${submissionCount}/${totalLearners || submissionCount} attempts`,
          status,
          statusLabel: status.charAt(0).toUpperCase() + status.slice(1),
          studentSummary: classInfo?.title || classInfo?.course?.name || 'Class',
          subtitle: quiz.title || 'Quiz',
          submissionCount,
          taskType: 'quiz',
        };

        if (pendingBadge) {
          quizCard.badge = pendingBadge;
        }
        if (metricLabel) {
          quizCard.metricLabel = metricLabel;
        }
        if (quiz.rubric_uuid) {
          quizCard.rubricUuid = quiz.rubric_uuid;
        }

        return quizCard;
      })
      .filter((item): item is AssignmentCardData => item !== null);

    return [...assignmentCards, ...quizCards].sort((left, right) => left.lesson.localeCompare(right.lesson));
  }, [
    assignmentMap,
    assignmentSchedules,
    assignmentSubmissionMap,
    classMap,
    enrollmentCountMap,
    instructorName,
    lessonMap,
    quizAttemptMap,
    quizMap,
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

  const { data: pendingGradingData } = useQuery({
    ...getPendingGradingOptions({ path: { instructorUuid: instructorUuid as string } }),
    enabled: !!instructorUuid,
    staleTime: 60 * 1000,
  });

  const analyticsQuery = useQueries({
    queries: uniqueAssignmentUuids.slice(0, 12).map(uuid => ({
      ...getSubmissionAnalyticsOptions({ path: { assignmentUuid: uuid } }),
      enabled: !!uuid,
      staleTime: 60 * 1000,
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
    <main className='bg-background p-3 sm:p-4 md:p-6'>
      <div className='mx-auto max-w-7xl space-y-4 sm:space-y-5'>
        <AssignmentHeader />

        <AssignmentToolbar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          search={search}
          setSearch={setSearch}
        />

        <div className='grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]'>
          <section className='space-y-5'>
            {loading ? (
              <div className="border-border/60 bg-card rounded-xl border p-5 shadow-sm sm:p-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative items-center text-center size-10 shrink-0">
                    <div className="absolute inset-0 rounded-full border-2 border-muted" />
                    <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  </div>
                  <div className="flex text-center flex-col gap-1 text-sm">
                    <p className="font-semibold text-foreground">
                      Loading lesson data...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fetching classes, assignments, and submissions
                    </p>
                  </div>
                </div>
              </div>
            ) : filteredAssignments.length > 0 ? (
              <div className='grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2'>
                {filteredAssignments.map(assignment => (
                  <AssignmentCard key={assignment.id} assignment={assignment} />
                ))}
              </div>
            ) : (
              <div className='border-border/70 bg-card rounded-xl border border-dashed p-4 text-xs text-muted-foreground shadow-sm sm:p-6 sm:text-sm'>
                No lesson tasks with student submissions were found for this instructor yet.
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
