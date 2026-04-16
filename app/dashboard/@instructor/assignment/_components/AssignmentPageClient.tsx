'use client';

import { useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useUserProfile } from '@/context/profile-context';
import useInstructorClassesWithDetails from '@/hooks/use-instructor-classes';
import {
  getAssignmentByUuidOptions,
  getAssignmentSchedulesOptions,
  getEnrollmentsForClassOptions,
  getQuizAttemptsOptions,
  getQuizByUuidOptions,
  getQuizSchedulesOptions,
  getSubmissionAnalyticsOptions,
  getCourseLessonsOptions,
  getPendingGradingOptions,
  getAssignmentSubmissionsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Assignment,
  AssignmentSubmission,
  ClassAssignmentSchedule,
  ClassQuizSchedule,
  Quiz,
  QuizAttempt,
} from '@/services/client/types.gen';
import { AssignmentCard } from './AssignmentCard';
import { AssignmentHeader } from './AssignmentHeader';
import { AssignmentInsights } from './AssignmentInsights';
import { AssignmentQuickActions } from './AssignmentQuickActions';
import { AssignmentToolbar } from './AssignmentToolbar';
import type { AssignmentCardData, AssignmentStatus } from './assignment-types';

type AssignmentScheduleWithClass = ClassAssignmentSchedule & { classUuid: string };
type QuizScheduleWithClass = ClassQuizSchedule & { classUuid: string };

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
  if (taskType === 'assignment' && submissionCount > 0 && gradedCount === submissionCount) {
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
        query: { pageable: { page: 0, size: 100, sort: [] } },
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
    () => Array.from(new Set(assignmentSchedules.map(item => item.assignment_uuid).filter(Boolean))),
    [assignmentSchedules]
  );
  const uniqueQuizUuids = useMemo(
    () => Array.from(new Set(quizSchedules.map(item => item.quiz_uuid).filter(Boolean))),
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
        query: { pageable: { page: 0, size: 100, sort: [] } },
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
        if (submissionCount === 0) return null;

        const gradedCount = submissions.filter(item => item.is_graded || item.graded_at).length;
        const lessonInfo = lessonMap.get(schedule.lesson_uuid);
        const classInfo = classMap.get(schedule.classUuid);
        const totalLearners = enrollmentCountMap.get(schedule.classUuid) ?? 0;
        const status = getTaskStatus(schedule.due_at, submissionCount, gradedCount, 'assignment');

        return {
          badge:
            gradedCount < submissionCount ? `${submissionCount - gradedCount} Pending` : undefined,
          ctaLabel: gradedCount < submissionCount ? 'Grade Now' : 'View Submissions',
          classUuid: schedule.classUuid,
          classTitle: classInfo?.title || 'Class',
          courseTitle: lessonInfo?.courseTitle || classInfo?.course?.name || 'Course',
          dueLabel: formatDueLabel(schedule.due_at || assignment.due_date),
          iconTone: status === 'overdue' ? 'amber' : 'blue',
          id: `assignment_${assignment.uuid}`,
          instructor: instructorName,
          lesson: lessonInfo?.lessonTitle || 'Lesson',
          lessonUuid: schedule.lesson_uuid,
          metricLabel:
            totalLearners > 0 ? `${Math.round((submissionCount / totalLearners) * 100)}% received` : undefined,
          metricValue: `${submissionCount}/${totalLearners || submissionCount} submitted`,
          rubricUuid: assignment.rubric_uuid,
          status,
          statusLabel: status.charAt(0).toUpperCase() + status.slice(1),
          studentSummary: classInfo?.title || classInfo?.course?.name || undefined,
          subtitle: assignment.title,
          submissionCount,
          taskType: 'assignment',
        } satisfies AssignmentCardData;
      })
      .filter((item): item is AssignmentCardData => item !== null);

    const quizCards = quizSchedules
      .map(schedule => {
        const quiz = schedule.quiz_uuid ? quizMap.get(schedule.quiz_uuid) : null;
        if (!quiz?.uuid || !schedule.lesson_uuid) return null;

        const attempts = quizAttemptMap.get(quiz.uuid) ?? [];
        const submissionCount = attempts.length;
        if (submissionCount === 0) return null;

        const completedCount = attempts.filter(item => item.is_completed || item.submitted_at).length;
        const lessonInfo = lessonMap.get(schedule.lesson_uuid);
        const classInfo = classMap.get(schedule.classUuid);
        const totalLearners = enrollmentCountMap.get(schedule.classUuid) ?? 0;
        const status = getTaskStatus(schedule.due_at, submissionCount, completedCount, 'quiz');

        return {
          badge: completedCount < submissionCount ? `${submissionCount - completedCount} Pending` : undefined,
          ctaLabel: 'View Submissions',
          classUuid: schedule.classUuid,
          classTitle: classInfo?.title || 'Class',
          courseTitle: lessonInfo?.courseTitle || classInfo?.course?.name || 'Course',
          dueLabel: formatDueLabel(schedule.due_at),
          iconTone: status === 'overdue' ? 'amber' : 'blue',
          id: `quiz_${quiz.uuid}`,
          instructor: instructorName,
          lesson: lessonInfo?.lessonTitle || 'Lesson',
          lessonUuid: schedule.lesson_uuid,
          metricLabel:
            totalLearners > 0 ? `${Math.round((submissionCount / totalLearners) * 100)}% attempted` : undefined,
          metricValue: `${submissionCount}/${totalLearners || submissionCount} attempts`,
          rubricUuid: quiz.rubric_uuid,
          status,
          statusLabel: status.charAt(0).toUpperCase() + status.slice(1),
          studentSummary: classInfo?.title || classInfo?.course?.name || undefined,
          subtitle: quiz.title,
          submissionCount,
          taskType: 'quiz',
        } satisfies AssignmentCardData;
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
    <main className='bg-background p-4 md:p-6'>
      <div className='mx-auto max-w-7xl space-y-5'>
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
              <div className='rounded-2xl border bg-white p-6 text-sm text-muted-foreground shadow-sm'>
                Loading lesson submissions...
              </div>
            ) : filteredAssignments.length > 0 ? (
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2'>
                {filteredAssignments.map(assignment => (
                  <AssignmentCard key={assignment.id} assignment={assignment} />
                ))}
              </div>
            ) : (
              <div className='rounded-2xl border border-dashed bg-white p-6 text-sm text-muted-foreground shadow-sm'>
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
