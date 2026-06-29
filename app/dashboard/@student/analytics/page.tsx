'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Layers3,
  ListChecks,
  PlayCircle,
  TrendingUp
} from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ChevronRight } from "lucide-react";

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useCoursesByIds, useProgramsByIds } from '@/hooks/use-batched-lookups';
import { localDate } from '@/lib/date';
import { useStudent } from '../../../../context/student-context';
import { cn } from '../../../../lib/utils';
import {
  getAllActiveClassDefinitionsOptions,
  getEnrollmentOverviewForStudentOptions,
  getStudentScheduleOptions,
  searchAssignmentsOptions,
  searchAttemptsOptions,
  searchQuizzesOptions,
  searchSubmissionsOptions,
} from '../../../../services/client/@tanstack/react-query.gen';
import type {
  Assignment,
  AssignmentSubmission,
  ClassDefinition,
  Quiz,
  QuizAttempt,
  StudentSchedule,
} from '../../../../services/client/types.gen';
import { DonutChart } from '../../@instructor/analytics/_components/charts/StatusBreakdown';

type StudentAnalyticsTab = 'Overview' | 'Enrollments' | 'Assessments';

const TABS: StudentAnalyticsTab[] = ['Overview', 'Enrollments', 'Assessments'];

const PAGEABLE = { page: 0, size: 100 };

function formatDateTime(value?: Date | string | null) {
  if (!value) {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatDate(value?: Date | string | null) {
  if (!value) {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(date);
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }

  return `${Math.round(value)}%`;
}

function formatDurationMinutes(minutes?: number | bigint | null) {
  const totalMinutes = Number(minutes ?? 0);

  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return '—';
  }

  if (totalMinutes >= 60) {
    const hours = totalMinutes / 60;
    const roundedHours = Math.round(hours * 10) / 10;

    return `${roundedHours}h`;
  }

  return `${Math.round(totalMinutes)}m`;
}

function formatStatusLabel(status?: string | null) {
  if (!status) {
    return 'Unknown';
  }

  return status
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getSessionLabel(session: StudentSchedule) {
  if (session.scheduling_status === 'CANCELLED') {
    return 'Cancelled';
  }

  if (session.scheduling_status === 'ONGOING') {
    return 'Ongoing';
  }

  if (session.scheduling_status === 'COMPLETED') {
    return session.enrollment_status === 'ABSENT' ? 'Absent' : 'Completed';
  }

  if (session.is_upcoming || session.scheduling_status === 'SCHEDULED') {
    return 'Upcoming';
  }

  if (session.enrollment_status) {
    return formatStatusLabel(session.enrollment_status);
  }

  return 'Scheduled';
}

function getSessionBadgeVariant(session: StudentSchedule) {
  if (session.scheduling_status === 'CANCELLED') {
    return 'destructive' as const;
  }

  if (session.scheduling_status === 'ONGOING') {
    return 'warning' as const;
  }

  if (session.scheduling_status === 'COMPLETED') {
    return session.enrollment_status === 'ABSENT' ? 'outlineWarning' : 'success';
  }

  return 'secondary' as const;
}

function getAssessmentBadgeVariant(status?: string | null) {
  switch (status) {
    case 'GRADED':
    case 'PASSED':
    case 'COMPLETED':
      return 'success' as const;
    case 'IN_PROGRESS':
    case 'SUBMITTED':
    case 'IN_REVIEW':
      return 'warning' as const;
    case 'RETURNED':
      return 'outlineWarning' as const;
    case 'DRAFT':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
}

function metricValue(value: number | string) {
  return typeof value === 'number' ? value.toLocaleString() : value;
}

function TabNav({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: StudentAnalyticsTab[];
  activeTab: StudentAnalyticsTab;
  onTabChange: (tab: StudentAnalyticsTab) => void;
}) {
  return (
    <div className='mb-4 overflow-x-auto border-b border-border sm:mb-5 scrollbar-hide'>
      <nav role='tablist' aria-label='Student analytics tabs' className='flex min-w-max'>
        {tabs.map(tab => {
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              type='button'
              role='tab'
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab)}
              className={[
                'whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
              ].join(' ')}
            >
              {tab}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className='border-border bg-card rounded-2xl p-4 shadow-sm sm:p-5'>
      <div>
        <h3 className='text-foreground text-base font-semibold sm:text-lg'>{title}</h3>
        {description && <p className='text-muted-foreground mt-1 text-sm'>{description}</p>}
      </div>
      <div className='mt-4'>{children}</div>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  subtext,
  icon,
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className='border-border bg-card flex-1 min-w-[180px] rounded-2xl p-4 shadow-sm'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-muted-foreground text-xs font-medium uppercase tracking-wide'>
            {label}
          </p>
          <div className='mt-2 flex flex-wrap items-baseline gap-2'>
            <span className='text-foreground text-2xl font-semibold leading-none sm:text-3xl'>
              {value}
            </span>
            {subtext && <span className='text-muted-foreground text-sm'>{subtext}</span>}
          </div>
        </div>
        <div className='bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full'>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function ProgressRow({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between gap-3 text-sm'>
        <span className='text-foreground font-medium'>{label}</span>
        <span className='text-muted-foreground'>
          {metricValue(value)} {total > 0 ? `(${percent}%)` : ''}
        </span>
      </div>
      <div className='bg-muted h-2 overflow-hidden rounded-full'>
        <div className='bg-primary h-full rounded-full' style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function StudentAnalyticsDashboard() {
  const student = useStudent();
  const [activeTab, setActiveTab] = useState<StudentAnalyticsTab>('Overview');

  const studentUuid = student?.uuid;

  const overviewQuery = useQuery({
    ...getEnrollmentOverviewForStudentOptions({
      path: { studentUuid: studentUuid ?? '' },
      query: { pageable: PAGEABLE },
    }),
    enabled: !!studentUuid,
  });

  const scheduleQuery = useQuery({
    ...getStudentScheduleOptions({
      path: { studentUuid: studentUuid ?? '' },
      query: {
        start: localDate('2024-01-01'),
        end: localDate('2030-12-31'),
      },
    }),
    enabled: !!studentUuid,
  });

  const activeClassDefinitionsQuery = useQuery({
    ...getAllActiveClassDefinitionsOptions({}),
    enabled: !!studentUuid,
  });

  const scheduleRows = scheduleQuery.data?.data ?? [];

  const enrollmentIds = useMemo(
    () => Array.from(new Set(scheduleRows.map(row => row.enrollment_uuid).filter(Boolean))),
    [scheduleRows]
  );
  const classDefinitionIds = useMemo(
    () => Array.from(new Set(scheduleRows.map(row => row.class_definition_uuid).filter(Boolean))),
    [scheduleRows]
  );

  const classDefinitionMap = useMemo(() => {
    const map = new Map<string, ClassDefinition>();
    const entries = activeClassDefinitionsQuery.data?.data ?? [];

    for (const entry of entries) {
      const classDefinition = entry.class_definition;
      if (classDefinition?.uuid) {
        map.set(classDefinition.uuid, classDefinition);
      }
    }

    return map;
  }, [activeClassDefinitionsQuery.data]);

  const courseIdsFromClasses = useMemo(
    () =>
      Array.from(
        new Set(
          classDefinitionIds
            .map(classDefinitionId => classDefinitionMap.get(classDefinitionId)?.course_uuid)
            .filter((courseUuid): courseUuid is string => !!courseUuid)
        )
      ),
    [classDefinitionIds, classDefinitionMap]
  );

  const programIdsFromClasses = useMemo(
    () =>
      Array.from(
        new Set(
          classDefinitionIds
            .map(classDefinitionId => classDefinitionMap.get(classDefinitionId)?.program_uuid)
            .filter((courseUuid): courseUuid is string => !!courseUuid)
        )
      ),
    [classDefinitionIds, classDefinitionMap]
  );

  const { courseMap } = useCoursesByIds(courseIdsFromClasses);
  const { programMap } = useProgramsByIds(programIdsFromClasses)

  const courseEnrollmentRows = overviewQuery.data?.data?.course_enrollments?.content ?? [];
  const classEnrollmentRows = overviewQuery.data?.data?.class_enrollments?.content ?? [];

  const courseLookupById = useMemo(() => {
    const lookup = new Map<string, string>();

    for (const enrollment of courseEnrollmentRows) {
      if (enrollment.course_uuid && enrollment.course_name) {
        lookup.set(enrollment.course_uuid, enrollment.course_name);
      }
    }

    return lookup;
  }, [courseEnrollmentRows]);

  const programLookupById = useMemo(() => {
    const lookup = new Map<string, string>();
    for (const enrollment of classEnrollmentRows) {        // ← program enrollments
      if (enrollment.program_uuid && enrollment.program_name) {
        lookup.set(enrollment.program_uuid, enrollment.program_name);
      }
    }
    return lookup;
  }, [classEnrollmentRows]);

  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  const toggleClass = (uuid: string) => {
    setExpandedClasses(prev => {
      const next = new Set(prev);

      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }

      return next;
    });
  };

  const groupedSchedules = Array.from(
    scheduleRows.reduce((map, row) => {
      const classUuid = row.class_definition_uuid ?? "";

      if (!map.has(classUuid)) {
        map.set(classUuid, []);
      }

      map.get(classUuid)!.push(row);

      return map;
    }, new Map<string, typeof scheduleRows>())
  ).map(([classUuid, sessions]) => {
    const classDefinition =
      classUuid !== ""
        ? classDefinitionMap.get(classUuid)
        : undefined;

    const courseUuid = classDefinition?.course_uuid ?? null;
    const programUuid = classDefinition?.program_uuid ?? null;

    const parentName =
      courseUuid
        ? (
          courseLookupById.get(courseUuid) ??
          courseMap[courseUuid]?.name
        )
        : programUuid
          ? (
            programLookupById.get(programUuid) ??
            programMap[programUuid]?.title
          )
          : undefined;

    const parentType = courseUuid ? "Course" : programUuid ? "Program" : null;

    const className =
      classDefinition?.title ??
      sessions[0]?.title ??
      "—";

    const sorted = [...sessions].sort(
      (a, b) =>
        new Date(a.start_time ?? 0).getTime() -
        new Date(b.start_time ?? 0).getTime()
    );

    const completed = sorted.filter(
      s => s.scheduling_status === "COMPLETED"
    ).length;

    const total = sorted.length;

    const startedAt = sorted[0]?.start_time;

    const completedAt =
      completed === total
        ? sorted[total - 1]?.end_time ??
        sorted[total - 1]?.attendance_marked_at
        : null;

    const now = Date.now();

    const hasOngoing = sorted.some(session => {
      if (!session.start_time || !session.end_time) return false;

      return (
        new Date(session.start_time).getTime() <= now &&
        new Date(session.end_time).getTime() >= now
      );
    });

    let status = "Upcoming";

    if (completed === total && total > 0) {
      status = "Completed";
    } else if (hasOngoing) {
      status = "Ongoing";
    } else if (completed > 0) {
      status = "In Progress";
    }

    return {
      classUuid,
      className,
      parentName,   // ← correctly declared above
      parentType,
      sessions: sorted,
      total,
      completed,
      startedAt,
      completedAt,
      status,
    };
  });

  const assignmentSubmissionsQuery = useQuery({
    ...searchSubmissionsOptions({
      query: {
        pageable: { ...PAGEABLE, size: 100 },
        searchParams: {
          enrollment_uuid_in: enrollmentIds.join(','),
        },
      },
    }),
    enabled: enrollmentIds.length > 0,
  });

  const attemptQuery = useQuery({
    ...searchAttemptsOptions({
      query: {
        pageable: { ...PAGEABLE, size: 100 },
        searchParams: {
          enrollment_uuid_in: enrollmentIds.join(','),
        },
      },
    }),
    enabled: enrollmentIds.length > 0,
  });

  const assignmentIds = useMemo(() => {
    const submissions = assignmentSubmissionsQuery.data?.data?.content ?? [];
    return Array.from(new Set(submissions.map(submission => submission.assignment_uuid).filter(Boolean)));
  }, [assignmentSubmissionsQuery.data]);

  const quizIds = useMemo(() => {
    const attempts = attemptQuery.data?.data?.content ?? [];
    return Array.from(new Set(attempts.map(attempt => attempt.quiz_uuid).filter(Boolean)));
  }, [attemptQuery.data]);

  const assignmentLookupQuery = useQuery({
    ...searchAssignmentsOptions({
      query: {
        pageable: { page: 0, size: Math.max(assignmentIds.length, 1) },
        searchParams: {
          uuid_in: assignmentIds.join(','),
        },
      },
    }),
    enabled: assignmentIds.length > 0,
  });

  const quizLookupQuery = useQuery({
    ...searchQuizzesOptions({
      query: {
        pageable: { page: 0, size: Math.max(quizIds.length, 1) },
        searchParams: {
          uuid_in: quizIds.join(','),
        },
      },
    }),
    enabled: quizIds.length > 0,
  });

  const latestSubmissionsByAssignment = useMemo(() => {
    const submissions = assignmentSubmissionsQuery.data?.data?.content ?? [];
    return submissions.reduce<Record<string, AssignmentSubmission>>((acc, submission) => {
      const assignmentUuid = submission.assignment_uuid;
      if (!assignmentUuid) {
        return acc;
      }

      const current = acc[assignmentUuid];
      const nextTime = new Date(submission.submitted_at ?? submission.created_date ?? 0).getTime();
      const currentTime = current
        ? new Date(current.submitted_at ?? current.created_date ?? 0).getTime()
        : -1;

      if (!current || nextTime >= currentTime) {
        acc[assignmentUuid] = submission;
      }

      return acc;
    }, {});
  }, [assignmentSubmissionsQuery.data]);

  const latestAttemptsByQuiz = useMemo(() => {
    const attempts = attemptQuery.data?.data?.content ?? [];
    return attempts.reduce<Record<string, QuizAttempt>>((acc, attempt) => {
      const quizUuid = attempt.quiz_uuid;
      if (!quizUuid) {
        return acc;
      }

      const current = acc[quizUuid];
      const nextTime = new Date(attempt.submitted_at ?? attempt.started_at ?? attempt.created_date ?? 0).getTime();
      const currentTime = current
        ? new Date(current.submitted_at ?? current.started_at ?? current.created_date ?? 0).getTime()
        : -1;

      if (!current || nextTime >= currentTime) {
        acc[quizUuid] = attempt;
      }

      return acc;
    }, {});
  }, [attemptQuery.data]);

  const assignmentLookup = useMemo(() => {
    const map = new Map<string, Assignment>();
    const assignments = assignmentLookupQuery.data?.data?.content ?? [];

    for (const assignment of assignments) {
      if (assignment.uuid) {
        map.set(assignment.uuid, assignment);
      }
    }

    return map;
  }, [assignmentLookupQuery.data]);

  const quizLookup = useMemo(() => {
    const map = new Map<string, Quiz>();
    const quizzes = quizLookupQuery.data?.data?.content ?? [];

    for (const quiz of quizzes) {
      if (quiz.uuid) {
        map.set(quiz.uuid, quiz);
      }
    }

    return map;
  }, [quizLookupQuery.data]);

  const sessionSummary = useMemo(() => {
    const total = scheduleRows.length;
    const completed = scheduleRows.filter(row => row.scheduling_status === 'COMPLETED').length;
    const ongoing = scheduleRows.filter(row => row.scheduling_status === 'ONGOING').length;
    const upcoming = scheduleRows.filter(row => row.is_upcoming || row.scheduling_status === 'SCHEDULED').length;
    const cancelled = scheduleRows.filter(row => row.scheduling_status === 'CANCELLED').length;
    const attended = scheduleRows.filter(row => row.did_attend || row.enrollment_status === 'ATTENDED').length;
    const completedMinutes = scheduleRows
      .filter(row => row.scheduling_status === 'COMPLETED')
      .reduce((sum, row) => sum + Number(row.duration_minutes ?? 0n), 0);
    const totalMinutes = scheduleRows.reduce((sum, row) => sum + Number(row.duration_minutes ?? 0n), 0);

    return {
      total,
      completed,
      ongoing,
      upcoming,
      cancelled,
      attended,
      completedMinutes,
      totalMinutes,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      attendanceRate: total > 0 ? Math.round((attended / total) * 100) : 0,
      trainingHoursTaken: Math.round((completedMinutes / 60) * 10) / 10,
      totalTrainingHours: Math.round((totalMinutes / 60) * 10) / 10,
      latestSession: scheduleRows
        .map(row => row.start_time)
        .filter((value): value is Date => !!value)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0],
    };
  }, [scheduleRows]);

  const statusRows = useMemo(() => {
    const total = sessionSummary.total;

    return [
      {
        label: "Upcoming",
        value: sessionSummary.upcoming,
        pct: total > 0 ? Math.round((sessionSummary.upcoming / total) * 100) : 0,
        color: "text-primary",
      },
      {
        label: "Ongoing",
        value: sessionSummary.ongoing,
        pct: total > 0 ? Math.round((sessionSummary.ongoing / total) * 100) : 0,
        color: "text-warning",
      },
      {
        label: "Completed",
        value: sessionSummary.completed,
        pct: total > 0 ? Math.round((sessionSummary.completed / total) * 100) : 0,
        color: "text-success",
      },
    ];
  }, [
    sessionSummary.total,
    sessionSummary.upcoming,
    sessionSummary.ongoing,
    sessionSummary.completed,
  ]);

  const courseProgressStats = useMemo(() => {
    const total = courseEnrollmentRows.length;
    const completed = courseEnrollmentRows.filter(row => row.enrollment_status === 'COMPLETED').length;
    const active = courseEnrollmentRows.filter(row => row.enrollment_status === 'ACTIVE').length;
    const progressValues = courseEnrollmentRows
      .map(row => row.progress_percentage ?? 0)
      .filter(value => Number.isFinite(value));

    const averageProgress =
      progressValues.length > 0
        ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length)
        : 0;

    return {
      total,
      completed,
      active,
      averageProgress,
    };
  }, [courseEnrollmentRows]);

  const assignmentRows = useMemo(
    () =>
      Object.values(latestSubmissionsByAssignment)
        .map(submission => {
          const assignment = submission.assignment_uuid ? assignmentLookup.get(submission.assignment_uuid) : undefined;
          const classDefinition = assignment?.class_definition_uuid
            ? classDefinitionMap.get(assignment.class_definition_uuid)
            : undefined;
          const courseUuid = classDefinition?.course_uuid ?? null;

          return {
            submission,
            assignment,
            courseName:
              (courseUuid ? courseLookupById.get(courseUuid) : undefined) ?? courseMap[courseUuid ?? '']?.name ?? '—',
            className: classDefinition?.title ?? '—',
          };
        })
        .sort((a, b) => new Date(b.submission.submitted_at ?? b.submission.created_date ?? 0).getTime() - new Date(a.submission.submitted_at ?? a.submission.created_date ?? 0).getTime()),
    [assignmentLookup, classDefinitionMap, courseLookupById, courseMap, latestSubmissionsByAssignment]
  );

  // FIX: this useMemo's dependency array referenced `attemptsByQuiz`, a
  // variable that doesn't exist anywhere in this file (it was presumably
  // meant to be `latestAttemptsByQuiz`, which is what the memo body
  // actually iterates over via `Object.values(latestAttemptsByQuiz)`
  // a few lines below). The typo'd name would throw a ReferenceError at
  // runtime / fail type-checking, since nothing ever defines it.
  const quizRows = useMemo(
    () =>
      Object.values(latestAttemptsByQuiz)
        .map(attempt => {
          const quiz = attempt.quiz_uuid ? quizLookup.get(attempt.quiz_uuid) : undefined;
          const classDefinition = quiz?.class_definition_uuid
            ? classDefinitionMap.get(quiz.class_definition_uuid)
            : undefined;
          const courseUuid = classDefinition?.course_uuid ?? null;

          return {
            attempt,
            quiz,
            courseName:
              (courseUuid ? courseLookupById.get(courseUuid) : undefined) ?? courseMap[courseUuid ?? '']?.name ?? '—',
            className: classDefinition?.title ?? '—',
          };
        })
        .sort((a, b) => new Date(b.attempt.submitted_at ?? b.attempt.started_at ?? b.attempt.created_date ?? 0).getTime() - new Date(a.attempt.submitted_at ?? a.attempt.started_at ?? a.attempt.created_date ?? 0).getTime()),
    [classDefinitionMap, courseLookupById, courseMap, latestAttemptsByQuiz, quizLookup]
  );

  const assessmentSummary = useMemo(() => {
    const submissions = assignmentSubmissionsQuery.data?.data?.content ?? [];
    const attempts = attemptQuery.data?.data?.content ?? [];

    const gradedSubmissions = submissions.filter(submission => submission.status === 'GRADED').length;
    const averageSubmissionScore =
      submissions.filter(submission => typeof submission.percentage === 'number').reduce((sum, submission) => sum + (submission.percentage ?? 0), 0) /
      Math.max(1, submissions.filter(submission => typeof submission.percentage === 'number').length);
    const passedAttempts = attempts.filter(attempt => attempt.is_passed).length;
    const averageAttemptScore =
      attempts.filter(attempt => typeof attempt.percentage === 'number').reduce((sum, attempt) => sum + (attempt.percentage ?? 0), 0) /
      Math.max(1, attempts.filter(attempt => typeof attempt.percentage === 'number').length);

    return {
      submissionCount: submissions.length,
      gradedSubmissions,
      averageSubmissionScore: Math.round(averageSubmissionScore || 0),
      attemptCount: attempts.length,
      passedAttempts,
      averageAttemptScore: Math.round(averageAttemptScore || 0),
    };
  }, [assignmentSubmissionsQuery.data, attemptQuery.data]);

  const isLoading =
    overviewQuery.isLoading ||
    scheduleQuery.isLoading ||
    activeClassDefinitionsQuery.isLoading ||
    assignmentSubmissionsQuery.isLoading ||
    attemptQuery.isLoading ||
    assignmentLookupQuery.isLoading ||
    quizLookupQuery.isLoading;

  if (!studentUuid) {
    return (
      <div className='mx-auto max-w-7xl p-4 sm:p-6'>
        <EmptyState
          icon={GraduationCap}
          title='Student analytics is unavailable'
          description='A student profile is required before analytics can be displayed.'
          variant='card'
        />
      </div>
    );
  }


  {
    isLoading && (
      <div className='text-muted-foreground mt-4 text-sm'>Loading analytics data…</div>
    )
  }

  return (
    <div className='min-h-screen py-4 sm:py-6 px-2 sm:px-4'>
      <div className='space-y-2 mb-4'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h1 className="text-lg font-bold leading-tight text-foreground sm:text-xl lg:text-2xl">
              {student?.full_name ?? 'Student'}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              Overview of sessions, enrollment progress, and assessment performance.
            </p>
          </div>

          <div className='flex flex-wrap gap-2 text-sm'>
            <Badge variant='outline'>{courseEnrollmentRows.length} courses</Badge>
            <Badge variant='outline'>{classEnrollmentRows.length} classes</Badge>
            <Badge variant='outline'>{sessionSummary.total} sessions</Badge>
          </div>
        </div>
      </div>

      <TabNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'Overview' && (
        <div className='space-y-4 sm:space-y-5'>
          <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            <MetricCard
              label='Total Sessions'
              value={metricValue(sessionSummary.total)}
              subtext='Scheduled sessions in scope'
              icon={<Layers3 className='h-5 w-5' />}
            />
            <MetricCard
              label='Sessions Completed'
              value={metricValue(sessionSummary.completed)}
              subtext={`${sessionSummary.completionRate}% completion rate`}
              icon={<CheckCircle2 className='h-5 w-5' />}
            />
            <MetricCard
              label='Training Hours Taken'
              value={sessionSummary.trainingHoursTaken.toFixed(1)}
              subtext={`${sessionSummary.totalTrainingHours.toFixed(1)}h scheduled`}
              icon={<Clock3 className='h-5 w-5' />}
            />
            <MetricCard
              label='Completion Rate'
              value={formatPercent(sessionSummary.completionRate)}
              subtext={`${sessionSummary.attendanceRate}% attendance rate`}
              icon={<TrendingUp className='h-5 w-5' />}
            />
          </div>

          <div className='grid gap-4 lg:grid-cols-3'>
            <SectionCard
              title="Status Breakdown"
              description="Upcoming, ongoing, and completed sessions in the selected range."
            >
              <div className="space-y-5">
                <DonutChart breakdown={statusRows} />

                <div className="space-y-2">
                  {statusRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`h-2.5 w-2.5 rounded-full shrink-0 ${row.color.replace(
                            "text-",
                            "bg-"
                          )}`}
                        />

                        <span className="truncate text-sm text-muted-foreground">
                          {row.label}
                        </span>
                      </div>

                      <span className="shrink-0 text-sm font-semibold text-foreground">
                        {metricValue(row.value)}{" "}
                        <span className="font-normal text-muted-foreground">
                          ({row.pct}%)
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title='Session Performance Summary'
              description='A quick view of how consistently the student is progressing.'
            >
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-1'>
                <div className='bg-muted/40 rounded-xl p-3'>
                  <p className='text-muted-foreground text-xs uppercase tracking-wide'>Total scheduled</p>
                  <p className='text-foreground mt-1 text-2xl font-semibold'>
                    {metricValue(sessionSummary.total)}
                  </p>
                </div>
                <div className='bg-muted/40 rounded-xl p-3'>
                  <p className='text-muted-foreground text-xs uppercase tracking-wide'>Currently ongoing</p>
                  <p className='text-foreground mt-1 text-2xl font-semibold'>
                    {metricValue(sessionSummary.ongoing)}
                  </p>
                </div>
                <div className='bg-muted/40 rounded-xl p-3'>
                  <p className='text-muted-foreground text-xs uppercase tracking-wide'>Marked attended</p>
                  <p className='text-foreground mt-1 text-2xl font-semibold'>
                    {metricValue(sessionSummary.attended)}
                  </p>
                </div>
                <div className='bg-muted/40 rounded-xl p-3'>
                  <p className='text-muted-foreground text-xs uppercase tracking-wide'>Last session</p>
                  <p className='text-foreground mt-1 text-sm font-medium'>
                    {formatDateTime(sessionSummary.latestSession)}
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title='Enrollment Snapshot'
              description='Current progress across courses and class enrollments.'
            >
              <div className='space-y-3'>
                <div className='bg-muted/40 rounded-xl p-3'>
                  <p className='text-muted-foreground text-xs uppercase tracking-wide'>Courses</p>
                  <p className='text-foreground mt-1 text-2xl font-semibold'>
                    {metricValue(courseProgressStats.total)}
                  </p>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    {courseProgressStats.completed} completed, {courseProgressStats.active} active
                  </p>
                </div>
                <div className='bg-muted/40 rounded-xl p-3'>
                  <p className='text-muted-foreground text-xs uppercase tracking-wide'>Average progress</p>
                  <p className='text-foreground mt-1 text-2xl font-semibold'>
                    {formatPercent(courseProgressStats.averageProgress)}
                  </p>
                </div>
                <div className='bg-muted/40 rounded-xl p-3'>
                  <p className='text-muted-foreground text-xs uppercase tracking-wide'>Class enrollments</p>
                  <p className='text-foreground mt-1 text-2xl font-semibold'>
                    {metricValue(classEnrollmentRows.length)}
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {activeTab === 'Enrollments' && (
        <div className='space-y-4 sm:space-y-5'>
          <SectionCard
            title='Enrolled Courses'
            description='Course-level enrollment summary and progress.'
          >
            <div className='overflow-x-auto'>
              <table className='w-full min-w-[760px] text-sm'>
                <thead>
                  <tr className='text-muted-foreground border-b border-border text-left text-xs uppercase tracking-wide'>
                    <th className='py-3 pr-4'>Course</th>
                    <th className='py-3 pr-4'>Status</th>
                    <th className='py-3 pr-4'>Progress</th>
                    <th className='py-3 pr-4'>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {courseEnrollmentRows.map(row => (
                    <tr key={`${row.course_uuid}-${row.enrollment_uuid ?? row.updated_date ?? ''}`} className='border-border border-b last:border-b-0'>
                      <td className='text-foreground py-3 pr-4 font-medium'>
                        {row.course_name ?? courseMap[row.course_uuid]?.name ?? '—'}
                      </td>
                      <td className='py-3 pr-4'>
                        <Badge variant={row.enrollment_status === 'COMPLETED' ? 'success' : 'secondary'}>
                          {formatStatusLabel(row.enrollment_status)}
                        </Badge>
                      </td>
                      <td className='text-muted-foreground py-3 pr-4'>
                        {formatPercent(row.progress_percentage)}
                      </td>
                      <td className='text-muted-foreground py-3 pr-4'>
                        {formatDateTime(row.updated_date)}
                      </td>
                    </tr>
                  ))}

                  {courseEnrollmentRows.length === 0 && (
                    <tr>
                      <td colSpan={4} className='py-8'>
                        <EmptyState
                          icon={BookOpen}
                          title='No course enrollments found'
                          description='The student has not been enrolled in any courses yet.'
                          variant='compact'
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard
            title="Enrolled Classes"
            description="Class-level schedule details with start and completion timestamps."
          >
            <div className="overflow-hidden rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[220px]">Course</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {groupedSchedules.map(group => (
                    <Fragment key={group.classUuid}>
                      <TableRow className="hover:bg-muted/40">
                        <TableCell className="font-medium align-top max-w-[240px]">
                          <div className="min-w-0">
                            <div className="line-clamp-2 font-medium leading-snug">
                              {group.parentName ?? "—"}
                            </div>

                            {group.parentType && (
                              <div className="line-clamp-1 text-xs text-muted-foreground">
                                {group.parentType}
                              </div>
                            )}
                          </div>
                        </TableCell>


                        <TableCell className="max-w-[360px]">
                          <button
                            onClick={() => toggleClass(group.classUuid)}
                            className="flex w-full min-w-0 items-start gap-3 rounded-md p-1 text-left transition-colors hover:text-primary"
                          >
                            <ChevronRight
                              className={cn(
                                "mt-0.5 h-4 w-4 shrink-0 transition-transform",
                                expandedClasses.has(group.classUuid) && "rotate-90"
                              )}
                            />

                            {/* IMPORTANT: min-w-0 enables truncation inside flex */}
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">
                                {group.className}
                              </div>

                              <div className="mt-1 truncate text-xs text-muted-foreground">
                                {group.completed} of {group.total} sessions completed
                              </div>
                            </div>
                          </button>
                        </TableCell>

                        <TableCell>
                          <Badge>{group.status}</Badge>
                        </TableCell>

                        <TableCell>
                          <p className='text-xs' >
                            {formatDateTime(group.startedAt)}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className='text-xs' >
                            {formatDateTime(group.completedAt)}
                          </p>
                        </TableCell>

                        <TableCell className="text-right font-medium">
                          {group.completed}/{group.total}
                        </TableCell>
                      </TableRow>

                      {expandedClasses.has(group.classUuid) &&
                        group.sessions.map(session => {
                          const completedAt =
                            session.scheduling_status === "COMPLETED"
                              ? session.end_time ?? session.attendance_marked_at
                              : session.attendance_marked_at;

                          return (
                            <TableRow
                              key={session.enrollment_uuid}
                              className="bg-muted/30 hover:bg-muted/50"
                            >
                              <TableCell />

                              <TableCell className="pl-10">
                                <div className="flex items-center gap-3">
                                  <div className="h-px w-2 bg-border" />

                                  <div>
                                    <p className="text-sm font-medium">
                                      Session
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                      {formatDateTime(session.start_time)}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <Badge
                                  variant={getSessionBadgeVariant(session)}
                                >
                                  {getSessionLabel(session)}
                                </Badge>
                              </TableCell>

                              <TableCell>
                                {formatDateTime(session.start_time)}
                              </TableCell>

                              <TableCell>
                                {formatDateTime(completedAt)}
                              </TableCell>

                              <TableCell className="text-right">
                                {formatDurationMinutes(
                                  session.duration_minutes
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </Fragment>
                  ))}

                  {groupedSchedules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48">
                        <EmptyState
                          icon={Layers3}
                          title="No class enrollments found"
                          description="The student does not have any scheduled class activity in the selected range."
                          variant="compact"
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </div>
      )}

      {activeTab === 'Assessments' && (
        <div className='space-y-4 sm:space-y-5'>
          <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-6'>
            <MetricCard
              label='Assignment submissions'
              value={metricValue(assessmentSummary.submissionCount)}
              subtext={`${assessmentSummary.gradedSubmissions} graded`}
              icon={<ListChecks className='h-5 w-5' />}
            />
            <MetricCard
              label='Avg submission score'
              value={formatPercent(assessmentSummary.averageSubmissionScore)}
              subtext='Across submitted assignments'
              icon={<BarChart3 className='h-5 w-5' />}
            />
            <MetricCard
              label='Quiz attempts'
              value={metricValue(assessmentSummary.attemptCount)}
              subtext={`${assessmentSummary.passedAttempts} passed`}
              icon={<PlayCircle className='h-5 w-5' />}
            />
            <MetricCard
              label='Avg quiz score'
              value={formatPercent(assessmentSummary.averageAttemptScore)}
              subtext='Across attempts in scope'
              icon={<TrendingUp className='h-5 w-5' />}
            />
            <MetricCard
              label='Assignments found'
              value={metricValue(assignmentRows.length)}
              subtext='Latest submission per assignment'
              icon={<BookOpen className='h-5 w-5' />}
            />
            <MetricCard
              label='Quizzes found'
              value={metricValue(quizRows.length)}
              subtext='Latest attempt per quiz'
              icon={<GraduationCap className='h-5 w-5' />}
            />
          </div>

          <SectionCard
            title='Assignment Report'
            description='Latest assignment submissions for the student.'
          >
            <div className='overflow-x-auto'>
              <table className='w-full min-w-[980px] text-sm'>
                <thead>
                  <tr className='text-muted-foreground border-b border-border text-left text-xs uppercase tracking-wide'>
                    <th className='py-3 pr-4'>Assignment</th>
                    <th className='py-3 pr-4'>Course</th>
                    <th className='py-3 pr-4'>Class</th>
                    <th className='py-3 pr-4'>Status</th>
                    <th className='py-3 pr-4'>Score</th>
                    <th className='py-3 pr-4'>Submitted At</th>
                    <th className='py-3 pr-4'>Graded At</th>
                  </tr>
                </thead>
                <tbody>
                  {assignmentRows.map(({ submission, assignment, courseName, className }) => (
                    <tr key={submission.uuid ?? `${submission.assignment_uuid}-${submission.submitted_at ?? ''}`} className='border-border border-b last:border-b-0'>
                      <td className='text-foreground py-3 pr-4 font-medium'>
                        {assignment?.title ?? submission.assignment_uuid}
                      </td>
                      <td className='text-muted-foreground py-3 pr-4'>{courseName}</td>
                      <td className='text-muted-foreground py-3 pr-4'>{className}</td>
                      <td className='py-3 pr-4'>
                        <Badge variant={getAssessmentBadgeVariant(submission.status)}>
                          {formatStatusLabel(submission.status)}
                        </Badge>
                      </td>
                      <td className='text-muted-foreground py-3 pr-4'>
                        {submission.percentage !== undefined && submission.percentage !== null
                          ? `${Math.round(submission.percentage)}%`
                          : submission.score !== undefined && submission.max_score !== undefined
                            ? `${submission.score}/${submission.max_score}`
                            : '—'}
                      </td>
                      <td className='text-muted-foreground py-3 pr-4'>{formatDateTime(submission.submitted_at)}</td>
                      <td className='text-muted-foreground py-3 pr-4'>{formatDateTime(submission.graded_at)}</td>
                    </tr>
                  ))}

                  {assignmentRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className='py-8'>
                        <EmptyState
                          icon={BookOpen}
                          title='No assignment submissions found'
                          description='The student has not submitted any assignments in the selected scope.'
                          variant='compact'
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title='Quiz Report' description='Latest quiz attempts for the student.'>
            <div className='overflow-x-auto'>
              <table className='w-full min-w-[980px] text-sm'>
                <thead>
                  <tr className='text-muted-foreground border-b border-border text-left text-xs uppercase tracking-wide'>
                    <th className='py-3 pr-4'>Quiz</th>
                    <th className='py-3 pr-4'>Course</th>
                    <th className='py-3 pr-4'>Class</th>
                    <th className='py-3 pr-4'>Status</th>
                    <th className='py-3 pr-4'>Score</th>
                    <th className='py-3 pr-4'>Started At</th>
                    <th className='py-3 pr-4'>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {quizRows.map(({ attempt, quiz, courseName, className }) => (
                    <tr key={attempt.uuid ?? `${attempt.quiz_uuid}-${attempt.started_at ?? ''}`} className='border-border border-b last:border-b-0'>
                      <td className='text-foreground py-3 pr-4 font-medium'>{quiz?.title ?? attempt.quiz_uuid}</td>
                      <td className='text-muted-foreground py-3 pr-4'>{courseName}</td>
                      <td className='text-muted-foreground py-3 pr-4'>{className}</td>
                      <td className='py-3 pr-4'>
                        <Badge variant={getAssessmentBadgeVariant(attempt.status)}>
                          {formatStatusLabel(attempt.status)}
                        </Badge>
                      </td>
                      <td className='text-muted-foreground py-3 pr-4'>
                        {attempt.percentage !== undefined && attempt.percentage !== null
                          ? `${Math.round(attempt.percentage)}%`
                          : attempt.score !== undefined && attempt.max_score !== undefined
                            ? `${attempt.score}/${attempt.max_score}`
                            : '—'}
                      </td>
                      <td className='text-muted-foreground py-3 pr-4'>{formatDateTime(attempt.started_at)}</td>
                      <td className='text-muted-foreground py-3 pr-4'>{formatDateTime(attempt.submitted_at)}</td>
                    </tr>
                  ))}

                  {quizRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className='py-8'>
                        <EmptyState
                          icon={GraduationCap}
                          title='No quiz attempts found'
                          description='The student has not completed any quiz attempts in the selected scope.'
                          variant='compact'
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}