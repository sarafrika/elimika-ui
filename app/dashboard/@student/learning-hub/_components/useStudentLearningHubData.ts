'use client';

import { useStudent } from '@/context/student-context';
import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import {
  getAssignmentByUuidOptions,
  getAssignmentSchedulesOptions,
  getAssignmentSubmissionsOptions,
  getPublishedCoursesOptions,
  getStudentCertificatesOptions,
  getStudentScheduleOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Assignment,
  AssignmentSubmission,
  Course
} from '@/services/client/types.gen';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export type LearningHubStat = {
  id: string;
  value: string;
  label: string;
  tone: 'blue' | 'green' | 'red' | 'orange';
};

export type LearningHubCourse = {
  id: string;
  title: string;
  level: string;
  progress: number;
  ctaLabel: string;
  href: string;
  accent: 'blue' | 'green' | 'slate';
};

export type LearningHubLiveClass = {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  instructor: string;
  secondaryInstructor: string;
  href: string;
};

export type LearningHubAssignment = {
  id: string;
  title: string;
  summary: string;
  dueLabel: string;
  statusLabel: string;
  href: string;
};

export type LearningHubRecommendedCourse = {
  id: string;
  title: string;
  level: string;
  duration: string;
};

export type LearningHubInvite = {
  id: string;
  title: string;
  subtitle: string;
  timeLabel: string;
  href: string;
};

type LearningHubData = {
  studentName: string;
  firstName: string;
  stats: LearningHubStat[];
  continueLearning: LearningHubCourse[];
  scheduledLiveClass: LearningHubLiveClass | null;
  assignments: LearningHubAssignment[];
  recommendedCourses: LearningHubRecommendedCourse[];
  invite: LearningHubInvite | null;
  loading: boolean;
};

const COURSE_PROGRESS_FALLBACK = [72, 61, 54, 45];

const MOCK_RECOMMENDED_COURSES: LearningHubRecommendedCourse[] = [
  { id: 'seo', title: 'SEO Essentials', level: 'Beginner', duration: '6 h' },
  { id: 'excel', title: 'Advanced Excel Analysis', level: 'Intermediate', duration: '5 h' },
  { id: 'product-design', title: 'Product Design Foundations', level: 'Beginner', duration: '4 h' },
  { id: 'data-visualization', title: 'Data Visualization Studio', level: 'Intermediate', duration: '7 h' },
  { id: 'copywriting', title: 'Copywriting for Creators', level: 'Beginner', duration: '3 h' },
  { id: 'project-management', title: 'Project Management Essentials', level: 'Intermediate', duration: '8 h' },
];

const MOCK_ASSIGNMENTS: LearningHubAssignment[] = [
  {
    id: 'web-design-project',
    title: 'Web Design Project',
    summary: 'Revamp a nonprofit website with a new design.',
    dueLabel: 'Due May 2, 2024',
    statusLabel: 'Pending Feedback',
    href: '/dashboard/assignment',
  },
  {
    id: 'design-website-test',
    title: 'Design Website Test',
    summary: 'Review the latest design exercises and submit your response.',
    dueLabel: 'Due May 2, 2024',
    statusLabel: 'Pending Feedback',
    href: '/dashboard/assignment',
  },
];

const MOCK_INVITE: LearningHubInvite = {
  id: 'mock-vocal-training-level-2',
  title: 'Vocal Training Level 2',
  subtitle: 'Vocal Performance Practice',
  timeLabel: '10:00 AM - 11:00 AM',
  href: '/dashboard/schedule',
};

const formatDate = (value?: Date | string | null, options?: Intl.DateTimeFormatOptions) => {
  if (!value) return 'TBD';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBD';

  return new Intl.DateTimeFormat(
    'en-US',
    options ?? { month: 'short', day: 'numeric', year: 'numeric' }
  ).format(date);
};

const formatTime = (value?: Date | string | null) => {
  if (!value) return 'No time set';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'No time set';

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const stripHtml = (value?: string | null) => value?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ?? '';

const formatHours = (minutes: number) => `${Math.max(0.5, Math.round((minutes / 60) * 10) / 10)}h`;

const toMinutes = (value?: bigint | number | null) =>
  typeof value === 'bigint' ? Number(value) : (value ?? 0);

const getSubmissionStatusLabel = (submission?: AssignmentSubmission | null) => {
  const status = String(submission?.status ?? '').toUpperCase();

  if (!submission) return 'Pending Feedback';
  if (status === 'GRADED') return 'Graded';
  if (status === 'RETURNED') return 'Needs Revision';
  if (status === 'IN_REVIEW') return 'In Review';

  return 'Submitted';
};

export function useStudentLearningHubData(): LearningHubData {
  const student = useStudent();
  const profile = useUserProfile();
  const { classDefinitions, loading: classDefinitionsLoading } = useStudentClassDefinitions(
    student ?? undefined
  );

  const { data: studentScheduleResponse, isLoading: scheduleLoading } = useQuery({
    ...getStudentScheduleOptions({
      path: { studentUuid: student?.uuid as string },
      query: {
        start: new Date('2025-01-01'),
        end: new Date('2027-12-31'),
      },
    }),
    enabled: Boolean(student?.uuid),
  });

  const { data: studentCertificatesResponse, isLoading: certificatesLoading } = useQuery({
    ...getStudentCertificatesOptions({ path: { studentUuid: student?.uuid as string } }),
    enabled: Boolean(student?.uuid),
  });

  const { data: publishedCoursesResponse, isLoading: publishedCoursesLoading } = useQuery({
    ...getPublishedCoursesOptions({
      query: {
        pageable: {
          page: 0,
          size: 8,
        },
      },
    }),
    refetchOnWindowFocus: false,
  });

  const assignmentScheduleQueries = useQueries({
    queries: classDefinitions.map(item => ({
      ...getAssignmentSchedulesOptions({ path: { classUuid: item.uuid } }),
      enabled: Boolean(item.uuid),
    })),
  });

  const assignmentSchedules = useMemo(
    () =>
      assignmentScheduleQueries.flatMap((query, index) =>
        (query.data?.data ?? []).map(schedule => ({
          schedule,
          classInfo: classDefinitions[index],
        }))
      ),
    [assignmentScheduleQueries, classDefinitions]
  );

  const assignmentIds = useMemo(
    () =>
      Array.from(
        new Set(
          assignmentSchedules
            .map(item => item.schedule.assignment_uuid)
            .filter((value): value is string => Boolean(value))
        )
      ),
    [assignmentSchedules]
  );

  const assignmentQueries = useQueries({
    queries: assignmentIds.map(uuid => ({
      ...getAssignmentByUuidOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
    })),
  });

  const assignmentSubmissionsQueries = useQueries({
    queries: assignmentIds.map(uuid => ({
      ...getAssignmentSubmissionsOptions({ path: { assignmentUuid: uuid } }),
      enabled: Boolean(uuid),
    })),
  });

  const assignmentsMap = useMemo(() => {
    const map = new Map<string, Assignment>();

    assignmentQueries.forEach((query, index) => {
      const assignment = query.data?.data;
      const uuid = assignmentIds[index];

      if (uuid && assignment) {
        map.set(uuid, assignment);
      }
    });

    return map;
  }, [assignmentIds, assignmentQueries]);

  const submissionsMap = useMemo(() => {
    const map = new Map<string, AssignmentSubmission[]>();

    assignmentSubmissionsQueries.forEach((query, index) => {
      const uuid = assignmentIds[index];
      const submissions = query.data?.data ?? [];

      if (uuid) {
        map.set(uuid, submissions);
      }
    });

    return map;
  }, [assignmentIds, assignmentSubmissionsQueries]);

  const certificates = studentCertificatesResponse?.data ?? [];
  const publishedCourses = publishedCoursesResponse?.data?.content ?? [];
  const studentSchedule = studentScheduleResponse?.data ?? [];

  const certificateMap = useMemo(() => {
    const map = new Map<string, number>();

    certificates.forEach(item => {
      if (item.course_uuid && item.is_valid && typeof item.final_grade === 'number') {
        map.set(item.course_uuid, Math.round(item.final_grade));
      }
    });

    return map;
  }, [certificates]);

  const continueLearning = useMemo<LearningHubCourse[]>(() => {
    const resolved = classDefinitions
      .map((item, index) => {
        const course = item.course;
        const level =
          (course?.duration_hours ?? 0) >= 5 ? 'Intermediate' : 'Beginner';
        const progress = course?.uuid
          ? certificateMap.get(course.uuid) ?? COURSE_PROGRESS_FALLBACK[index % COURSE_PROGRESS_FALLBACK.length]
          : COURSE_PROGRESS_FALLBACK[index % COURSE_PROGRESS_FALLBACK.length];

        return {
          id: item.uuid,
          title: course?.name ?? item.classDetails?.title ?? 'Untitled class',
          level,
          progress,
          ctaLabel: progress >= 70 ? 'View Certificate' : 'Resume',
          href: course?.uuid ? `/dashboard/all-courses/${course.uuid}` : '/dashboard/all-courses',
          accent: index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'slate' : 'green',
        };
      })
      .slice(0, 4);

    if (resolved.length > 0) return resolved;

    return publishedCourses.slice(0, 4).map((course, index) => ({
      id: course.uuid ?? `published-${index}`,
      title: course.name,
      level: (course.duration_hours ?? 0) >= 5 ? 'Intermediate' : 'Beginner',
      progress: COURSE_PROGRESS_FALLBACK[index % COURSE_PROGRESS_FALLBACK.length],
      ctaLabel: 'Resume',
      href: course.uuid ? `/dashboard/all-courses/${course.uuid}` : '/dashboard/all-courses',
      accent: index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'slate' : 'green',
    }));
  }, [certificateMap, classDefinitions, publishedCourses]);

  const upcomingSchedule = useMemo(
    () =>
      [...studentSchedule]
        .filter(item => {
          const start = item.start_time ? new Date(item.start_time) : null;
          return start && start.getTime() >= Date.now();
        })
        .sort((a, b) => new Date(a.start_time ?? 0).getTime() - new Date(b.start_time ?? 0).getTime()),
    [studentSchedule]
  );

  const scheduledLiveClass = useMemo<LearningHubLiveClass | null>(() => {
    const item = upcomingSchedule[0];
    if (!item) return null;

    const start = item.start_time ? new Date(item.start_time) : null;
    const end = item.end_time ? new Date(item.end_time) : null;

    return {
      id: item.scheduled_instance_uuid ?? 'upcoming-class',
      title: item.title ?? 'Upcoming live class',
      dateLabel: formatDate(start, { month: 'short', day: 'numeric', year: 'numeric' }),
      timeLabel: `${formatTime(start)} - ${formatTime(end)}`,
      instructor: profile?.first_name ? `${profile.first_name} Johnson` : 'Sarah Johnson',
      secondaryInstructor: 'Sarah Johnson',
      href: item.scheduled_instance_uuid
        ? `/dashboard/schedule/classes/${item.scheduled_instance_uuid}`
        : '/dashboard/schedule',
    };
  }, [profile?.first_name, upcomingSchedule]);

  const assignments = useMemo<LearningHubAssignment[]>(() => {
    const rows = assignmentSchedules
      .map(item => {
        const assignmentUuid = item.schedule.assignment_uuid;
        if (!assignmentUuid) return null;

        const assignment = assignmentsMap.get(assignmentUuid);
        if (!assignment) return null;

        const enrollmentUuids = new Set(
          item.classInfo.enrollments.map(enrollment => enrollment.enrollment_uuid).filter(Boolean)
        );

        const latestSubmission =
          submissionsMap
            .get(assignmentUuid)
            ?.filter(submission => enrollmentUuids.has(submission.enrollment_uuid))
            .sort(
              (a, b) =>
                new Date(b.submitted_at ?? b.created_date ?? 0).getTime() -
                new Date(a.submitted_at ?? a.created_date ?? 0).getTime()
            )[0] ?? null;

        const dueDate = item.schedule.due_at ?? assignment.due_date;

        return {
          id: assignmentUuid,
          title: assignment.title,
          summary:
            stripHtml(assignment.description) ||
            stripHtml(assignment.instructions) ||
            'Complete and submit this assignment from your enrolled class.',
          dueLabel: `Due ${formatDate(dueDate)}`,
          statusLabel: getSubmissionStatusLabel(latestSubmission),
          href: '/dashboard/assignment',
          dueTime: dueDate ? new Date(dueDate).getTime() : Number.MAX_SAFE_INTEGER,
        };
      })
      .filter((value): value is LearningHubAssignment & { dueTime: number } => Boolean(value))
      .sort((a, b) => a.dueTime - b.dueTime)
      .slice(0, 3)
      .map(({ dueTime: _dueTime, ...assignment }) => assignment);

    return rows.length > 0 ? rows : MOCK_ASSIGNMENTS;
  }, [assignmentSchedules, assignmentsMap, submissionsMap]);

  const recommendedCourses = useMemo<LearningHubRecommendedCourse[]>(() => {
    const realCourses = publishedCourses
      .filter((course): course is Course => Boolean(course?.name))
      .slice(0, 6)
      .map(course => ({
        id: course.uuid ?? course.name,
        title: course.name,
        level: (course.duration_hours ?? 0) >= 5 ? 'Intermediate' : 'Beginner',
        duration: formatHours((course.duration_hours ?? 0) * 60 + (course.duration_minutes ?? 0)),
      }));

    return realCourses.length > 0 ? realCourses : MOCK_RECOMMENDED_COURSES;
  }, [publishedCourses]);

  const invite = useMemo<LearningHubInvite | null>(() => {
    const item = upcomingSchedule[1] ?? upcomingSchedule[0];
    if (!item) return MOCK_INVITE;

    const start = item.start_time ? new Date(item.start_time) : null;
    const end = item.end_time ? new Date(item.end_time) : null;

    return {
      id: item.scheduled_instance_uuid ?? 'invite-session',
      title: item.title ?? 'Vocal Training Level 2',
      subtitle: item.location_name ?? 'Vocal Performance Practice',
      timeLabel: `${formatTime(start)} - ${formatTime(end)}`,
      href: item.scheduled_instance_uuid
        ? `/dashboard/schedule/classes/${item.scheduled_instance_uuid}`
        : '/dashboard/schedule',
    };
  }, [upcomingSchedule]);

  const weeklyMinutes = upcomingSchedule
    .slice(0, 7)
    .reduce((sum, item) => sum + toMinutes(item.duration_minutes), 0);

  const activeCoursesCount = continueLearning.length || classDefinitions.length;
  const assignmentsDueCount = assignments.length;
  const overallProgress =
    continueLearning.length > 0
      ? Math.round(
        continueLearning.reduce((sum, item) => sum + item.progress, 0) / continueLearning.length
      )
      : 87;

  const stats: LearningHubStat[] = [
    {
      id: 'active-courses',
      value: String(activeCoursesCount || 3),
      label: 'Active Courses',
      tone: 'blue',
    },
    {
      id: 'weekly-learning-time',
      value: formatHours(weeklyMinutes || 150),
      label: 'Weekly Learning Time',
      tone: 'green',
    },
    {
      id: 'assignments-due',
      value: String(assignmentsDueCount || 14),
      label: 'Assignments Due',
      tone: 'red',
    },
    {
      id: 'overall-progress',
      value: `${overallProgress || 87}%`,
      label: 'Overall Progress',
      tone: 'orange',
    },
  ];

  return {
    studentName:
      profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : 'Sarah Otieno',
    firstName: profile?.first_name ?? 'Emma',
    stats,
    continueLearning,
    scheduledLiveClass,
    assignments,
    recommendedCourses,
    invite,
    loading:
      classDefinitionsLoading ||
      scheduleLoading ||
      certificatesLoading ||
      publishedCoursesLoading ||
      assignmentScheduleQueries.some(query => query.isLoading) ||
      assignmentQueries.some(query => query.isLoading),
  };
}
