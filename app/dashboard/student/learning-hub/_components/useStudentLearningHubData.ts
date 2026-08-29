// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import {
  getAssignmentByUuidOptions,
  getAssignmentSchedulesOptions,
  getAssignmentSubmissionsOptions,
  getEnrollmentOverviewForStudentOptions,
  getInstructorByUuidOptions,
  getPublishedCoursesOptions,
  getScheduledInstanceEnrollmentsForStudentOptions,
  getStudentCertificatesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Assignment,
  AssignmentSubmission,
  Certificate,
  Instructor,
  ScheduledInstance,
  StudentClassEnrollmentSummary,
  StudentCourseEnrollmentSummary,
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

export type LearningHubClass = {
  id: string;
  title: string;
  courseName: string;
  statusLabel: string;
  scheduleLabel: string;
  progress: number;
  ctaLabel: string;
  href: string;
  bannerUrl?: string;
  accent: 'blue' | 'green' | 'slate';
  lessonId?: string;
  contentId?: string;
  lastLessonId?: string;
  nextLessonId?: string;
};

export type LearningHubActiveCourse = {
  id: string;
  title: string;
  category: string;
  level: string;
  duration: string;
  classCount: number;
  href: string;
};

export type LearningHubLiveClass = {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  instructor: string;
  locationLabel: string;
  href: string;
  lessonId?: string;
  contentId?: string;
  lastLessonId?: string;
  nextLessonId?: string;
  startTime: string | Date
};

export type LearningHubNextClass = LearningHubUpcomingClass & {
  instructor: string;
};

export type LearningHubUpcomingClass = {
  id: string;
  title: string;
  courseName: string;
  dateLabel: string;
  timeLabel: string;
  locationLabel: string;
  href: string;
  startMs?: number;
  lessonId?: string;
  contentId?: string;
  lastLessonId?: string;
  nextLessonId?: string;
  startTime: string | Date
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

export type LearningHubData = {
  studentName: string;
  firstName: string;
  stats: LearningHubStat[];
  courseEnrollments: LearningHubCourseEnrollment[];
  classEnrollments: LearningHubClassEnrollment[];
  certificates: Certificate[];
  courseEnrollmentCount: number;
  classEnrollmentCount: number;
  activeCourses: LearningHubActiveCourse[];
  continueLearning: LearningHubClass[];
  liveClasses: LearningHubLiveClass[];
  upcomingClasses: LearningHubUpcomingClass[];
  nextClass: LearningHubNextClass | null;
  assignments: LearningHubAssignment[];
  recommendedCourses: LearningHubRecommendedCourse[];
  invite: LearningHubInvite | null;
  loading: boolean;
};

export type LearningHubCourseEnrollment = StudentCourseEnrollmentSummary & {
  id: string;
  statusLabel: string;
  progressLabel: string;
  updatedLabel: string;
  href: string;
  ctaLabel: string;
  tone: 'blue' | 'green' | 'slate';
};

export type LearningHubClassEnrollment = StudentClassEnrollmentSummary & {
  id: string;
  statusLabel: string;
  sessionCountLabel: string;
  latestActivityLabel: string;
  latestStartLabel: string;
  href: string;
  tone: 'blue' | 'green' | 'slate';
  lessonId?: string;
  contentId?: string;
  lastLessonId?: string;
  nextLessonId?: string;
};

const MOCK_RECOMMENDED_COURSES: LearningHubRecommendedCourse[] = [
  // { id: 'seo', title: 'SEO Essentials', level: 'Beginner', duration: '6 h' },
  // { id: 'excel', title: 'Advanced Excel Analysis', level: 'Intermediate', duration: '5 h' },
  // { id: 'product-design', title: 'Product Design Foundations', level: 'Beginner', duration: '4 h' },
  // {
  //   id: 'data-visualization',
  //   title: 'Data Visualization Studio',
  //   level: 'Intermediate',
  //   duration: '7 h',
  // },
  // { id: 'copywriting', title: 'Copywriting for Creators', level: 'Beginner', duration: '3 h' },
  // {
  //   id: 'project-management',
  //   title: 'Project Management Essentials',
  //   level: 'Intermediate',
  //   duration: '8 h',
  // },
];

const MOCK_INVITE: LearningHubInvite = {
  id: 'mock-vocal-training-level-2',
  title: 'Vocal Training Level 2',
  subtitle: 'Vocal Performance Practice',
  timeLabel: '10:00 AM - 11:00 AM',
  href: '/dashboard/student/schedule',
};

function buildClassLearningHref(
  classUuid: string,
  route?: {
    contentId?: string;
    lessonId?: string;
  }
) {
  const params = new URLSearchParams();

  if (route?.lessonId) params.set('lesson', route.lessonId);
  if (route?.contentId) params.set('content', route.contentId);

  const query = params.toString();

  return query
    ? `/dashboard/student/learning-hub/classes/${classUuid}?${query}`
    : `/dashboard/student/learning-hub/classes/${classUuid}`;
}

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

const stripHtml = (value?: string | null) =>
  value
    ?.replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() ?? '';

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

const getClassStatusLabel = (
  startValue?: Date | string | null,
  endValue?: Date | string | null
) => {
  const start = startValue ? new Date(startValue) : null;
  const end = endValue ? new Date(endValue) : null;
  const now = Date.now();

  if (!start || Number.isNaN(start.getTime()) || !end || Number.isNaN(end.getTime())) {
    return 'Upcoming';
  }

  if (now < start.getTime()) return 'Upcoming';
  if (now > end.getTime()) return 'Completed';

  return 'In progress';
};

const getCourseStatusLabel = (status?: string | null, progress?: number | null) => {
  const normalized = String(status ?? '').trim().toLowerCase();

  if (normalized === 'completed' || normalized === 'completed_course') return 'Completed';
  if (normalized === 'cancelled' || normalized === 'dropped') return 'Cancelled';
  if (normalized === 'waitlisted') return 'Waiting list';
  if ((progress ?? 0) >= 100) return 'Completed';
  if ((progress ?? 0) > 0) return 'In progress';

  return 'Not started';
};

const getClassEnrollmentStatusLabel = (status?: string | null, latestStart?: Date | string | null) => {
  const normalized = String(status ?? '').trim().toLowerCase();

  if (normalized === 'attended' || normalized === 'completed') return 'Completed';
  if (normalized === 'cancelled') return 'Cancelled';
  if (normalized === 'waitlisted') return 'Waiting list';
  if (latestStart) return getClassStatusLabel(latestStart, latestStart);

  return 'Enrolled';
};

export function useStudentLearningHubData(): LearningHubData {
  const profile = useUserProfile();
  const student = profile?.student;

  const { classDefinitions, loading: classDefinitionsLoading } = useStudentClassDefinitions(
    student ?? undefined
  );

  const classLearningRoutes = useMemo(() => {
    const routes = new Map<
      string,
      {
        contentId?: string;
        lessonId?: string;
        lastLessonId?: string;
        nextLessonId?: string;
      }
    >();

    classDefinitions.forEach(classInfo => {
      const lessons = [...(classInfo.lessons ?? [])].filter(lesson => Boolean(lesson?.uuid));

      lessons.sort((left, right) => {
        const leftOrder = left.lesson_sequence ?? left.lesson_number ?? 0;
        const rightOrder = right.lesson_sequence ?? right.lesson_number ?? 0;
        return leftOrder - rightOrder;
      });

      const firstLesson = lessons[0];

      routes.set(classInfo.uuid, {
        lessonId: firstLesson?.uuid,
        // Future progress tracking can fill these from last/next treated lesson data.
        contentId: undefined,
        lastLessonId: undefined,
        nextLessonId: undefined,
      });
    });

    return routes;
  }, [classDefinitions]);

  const {
    data: studentScheduledInstanceEnrollmentsResponse,
    isLoading: scheduledInstanceEnrollmentsLoading,
  } = useQuery({
    ...getScheduledInstanceEnrollmentsForStudentOptions({
      path: { studentUuid: student?.uuid as string },
      query: { pageable: { size: 1000 } },
    }),
    enabled: Boolean(student?.uuid),
  });

  const { data: studentCertificatesResponse, isLoading: certificatesLoading } = useQuery({
    ...getStudentCertificatesOptions({ path: { studentUuid: student?.uuid as string } }),
    enabled: Boolean(student?.uuid),
  });

  const {
    data: enrollmentOverviewResponse,
    isLoading: enrollmentOverviewLoading,
  } = useQuery({
    ...getEnrollmentOverviewForStudentOptions({
      path: { studentUuid: student?.uuid as string },
      query: { pageable: { page: 0, size: 24 } },
    }),
    enabled: Boolean(student?.uuid),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
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
      assignmentScheduleQueries.flatMap((query, index) => {
        const classInfo = classDefinitions[index];

        if (!classInfo) return [];

        return (query.data?.data ?? []).map(schedule => ({
          schedule,
          classInfo,
        }));
      }),
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
  const scheduledInstanceEnrollments =
    studentScheduledInstanceEnrollmentsResponse?.data?.content ?? [];
  const courseEnrollmentSummaries =
    enrollmentOverviewResponse?.data?.course_enrollments?.content ?? [];
  const classEnrollmentSummaries =
    enrollmentOverviewResponse?.data?.class_enrollments?.content ?? [];
  const courseEnrollmentCount =
    Number(enrollmentOverviewResponse?.data?.course_enrollments?.metadata?.totalElements ?? 0);
  const classEnrollmentCount =
    Number(enrollmentOverviewResponse?.data?.class_enrollments?.metadata?.totalElements ?? 0);




  const enrolledScheduledInstanceUuids = useMemo(
    () =>
      new Set(
        scheduledInstanceEnrollments
          .map(enrollment => enrollment.scheduled_instance_uuid)
          .filter((value): value is string => Boolean(value))
      ),
    [scheduledInstanceEnrollments]
  );

  const studentScheduledInstances = useMemo(() => {
    return classDefinitions.flatMap(classInfo => {
      const classDetails = classInfo.classDetails;
      const course = classInfo.course;
      const classTitle = classDetails?.title ?? course?.name ?? 'Untitled class';
      const route = classLearningRoutes.get(classInfo.uuid);

      return (classInfo.schedules ?? [])
        .filter((schedule): schedule is ScheduledInstance => Boolean(schedule?.uuid))
        .filter(schedule => enrolledScheduledInstanceUuids.has(schedule.uuid as string))
        .map(schedule => ({
          ...schedule,
          classDefinitionUuid: classInfo.uuid,
          classTitle,
          courseName: course?.name ?? 'Standalone class',
          instructorUuid: schedule.instructor_uuid || classDetails?.default_instructor_uuid || '',
          locationLabel:
            schedule.location_name ??
            classDetails?.location_name ??
            classDetails?.title ??
            'Location pending',
          href: schedule.uuid
            ? buildClassLearningHref(classInfo.uuid, route)
            : '/dashboard/student/learning-hub',
          lessonId: route?.lessonId,
          contentId: route?.contentId,
          lastLessonId: route?.lastLessonId,
          nextLessonId: route?.nextLessonId,
        }));
    });
  }, [classDefinitions, classLearningRoutes, enrolledScheduledInstanceUuids]);

  const activeCourses = useMemo<LearningHubActiveCourse[]>(() => {
    const courseGroups = new Map<
      string,
      {
        category: string;
        classCount: number;
        duration: string;
        href: string;
        level: string;
        title: string;
      }
    >();

    classDefinitions.forEach(item => {
      const course = item.course;
      const courseUuid = course?.uuid;

      if (!courseUuid || courseGroups.has(courseUuid)) {
        if (courseUuid && courseGroups.has(courseUuid)) {
          const current = courseGroups.get(courseUuid);
          if (current) {
            current.classCount += 1;
          }
        }
        return;
      }

      const durationMinutes =
        (course?.duration_hours ?? 0) * 60 + (course?.duration_minutes ?? 0);

      courseGroups.set(courseUuid, {
        title: course?.name ?? 'Untitled course',
        category: course?.category ?? 'General',
        level: (course?.duration_hours ?? 0) >= 8 ? 'Intermediate' : 'Beginner',
        duration: formatHours(durationMinutes),
        classCount: 1,
        href: `/dashboard/student/courses/${courseUuid}`,
      });
    });

    return Array.from(courseGroups.entries()).map(([id, course]) => ({
      id,
      title: course.title,
      category: course.category,
      level: course.level,
      duration: course.duration,
      classCount: course.classCount,
      href: course.href,
    }));
  }, [classDefinitions]);

  const courseEnrollments = useMemo<LearningHubCourseEnrollment[]>(
    () =>
      courseEnrollmentSummaries.map((item, index) => {
        const progress = Math.min(100, Math.max(0, Math.round(item.progress_percentage ?? 0)));

        return {
          ...item,
          id: item.course_uuid,
          statusLabel: getCourseStatusLabel(item.enrollment_status, progress),
          progressLabel: `${progress}%`,
          updatedLabel: item.updated_date ? formatDate(item.updated_date) : 'Recently updated',
          href: `/dashboard/student/courses/${item.course_uuid}`,
          ctaLabel:
            progress >= 100
              ? 'Review course'
              : progress > 0
                ? 'Continue learning'
                : 'Start course',
          tone: index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'slate' : 'green',
        };
      }),
    [courseEnrollmentSummaries]
  );

  const classEnrollments = useMemo<LearningHubClassEnrollment[]>(
    () =>
      classEnrollmentSummaries.map((item, index) => {
        const latestStart = item.latest_scheduled_instance_start_time ?? null;
        const statusLabel = getClassEnrollmentStatusLabel(item.latest_enrollment_status, latestStart);
        const route = classLearningRoutes.get(item.class_definition_uuid);

        return {
          ...item,
          id: item.class_definition_uuid,
          statusLabel,
          sessionCountLabel:
            item.scheduled_instance_count === 1
              ? '1 scheduled session'
              : `${item.scheduled_instance_count ?? 0} scheduled sessions`,
          latestActivityLabel: item.latest_activity_date
            ? `Updated ${formatDate(item.latest_activity_date)}`
            : 'No recent activity',
          latestStartLabel: latestStart ? `Starts ${formatDate(latestStart)}` : 'Start time pending',
          href: buildClassLearningHref(item.class_definition_uuid, route),
          tone: index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'slate' : 'green',
          lessonId: route?.lessonId,
          contentId: route?.contentId,
          lastLessonId: route?.lastLessonId,
          nextLessonId: route?.nextLessonId,
        };
      }),
    [classEnrollmentSummaries, classLearningRoutes]
  );

  const instructorUuids = useMemo(
    () =>
      Array.from(
        new Set(
          studentScheduledInstances
            .map(instance => instance.instructorUuid)
            .filter((value): value is string => Boolean(value))
        )
      ),
    [studentScheduledInstances]
  );

  const instructorQueries = useQueries({
    queries: instructorUuids.map(uuid => ({
      ...getInstructorByUuidOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const instructorMap = useMemo(() => {
    const map = new Map<string, Instructor>();

    instructorQueries.forEach((query, index) => {
      const instructor = query.data?.data;
      const uuid = instructorUuids[index];

      if (uuid && instructor) {
        map.set(uuid, instructor);
      }
    });

    return map;
  }, [instructorQueries, instructorUuids]);

  const certificateMap = useMemo(() => {
    const map = new Map<string, number>();

    certificates.forEach(item => {
      if (item.course_uuid && item.is_valid && typeof item.final_grade === 'number') {
        map.set(item.course_uuid, Math.round(item.final_grade));
      }
    });

    return map;
  }, [certificates]);

  const continueLearning = useMemo<LearningHubClass[]>(() => {
    return classDefinitions.map((item, index) => {
      const course = item?.course;
      const classDetails = item?.classDetails;
      const route = classLearningRoutes.get(item.uuid);

      const rawProgress = course?.uuid ? item?.classDetails?.class_progress_percentage : 0;

      const progress = Math.min(100, Math.max(0, Math.round(rawProgress ?? 0)));

      const scheduleCount = item.schedules?.length ?? 0;

      const statusLabel =
        progress === 0
          ? `Not started ${progress}%`
          : progress === 100
            ? `Completed ${progress}%`
            : `In progress ${progress}%`;

      const isCompleted = progress === 100;

      return {
        id: item.uuid,
        title: classDetails?.title ?? '',
        courseName: course?.name ?? '',

        statusLabel,

        scheduleLabel:
          scheduleCount === 1 ? '1 scheduled session' : `${scheduleCount} scheduled sessions`,

        progress,
        isCompleted,

        ctaLabel: isCompleted ? 'Class completed' : progress > 0 ? 'Resume class' : 'Start class',

        href: buildClassLearningHref(item.uuid, route),
        bannerUrl: item?.classDetails?.thumbnail_url ?? '',

        accent: index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'slate' : 'green',
        lessonId: route?.lessonId,
        contentId: route?.contentId,
        lastLessonId: route?.lastLessonId,
        nextLessonId: route?.nextLessonId,
      };
    });
  }, [certificateMap, classDefinitions, classLearningRoutes]);

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const TWO_WEEKS_MS = 30 * ONE_DAY_MS;
  const now = Date.now();

  const upcomingClasses = useMemo(
    () =>
      [...studentScheduledInstances]
        .filter(item => {
          const start = item.start_time ? new Date(item.start_time) : null;

          if (!start) return false;

          const diff = start.getTime() - now;

          // classes happening within the next 14 days
          return diff >= 0 && diff <= TWO_WEEKS_MS;
        })
        .sort(
          (a, b) => new Date(a.start_time ?? 0).getTime() - new Date(b.start_time ?? 0).getTime()
        ),
    [now, studentScheduledInstances]
  );

  const nextClass = useMemo<LearningHubNextClass | null>(() => {
    const item = upcomingClasses[0];

    if (!item) {
      return null;
    }

    const start = item.start_time ? new Date(item.start_time) : null;
    const end = item.end_time ? new Date(item.end_time) : null;

    const instructor = instructorMap.get(item.instructorUuid);

    return {
      id: item.uuid ?? item.classDefinitionUuid,
      title: item.classTitle ?? '',
      dateLabel: formatDate(start, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      courseName: item.courseName,
      timeLabel: `${formatTime(start)} - ${formatTime(end)}`,
      locationLabel: item.locationLabel,
      href: item.href,
      instructor: instructor?.full_name ?? 'Instructor',
      startMs: start?.getTime(),
      startTime: item.start_time
    };
  }, [instructorMap, upcomingClasses]);

  const liveClasses = useMemo<LearningHubLiveClass[]>(
    () =>
      upcomingClasses
        .filter(item => {
          const start = item.start_time ? new Date(item.start_time) : null;

          if (!start) return false;

          const diff = start.getTime() - now;

          return diff >= 0 && diff <= ONE_DAY_MS;
        })
        .map(item => {
          const start = item.start_time ? new Date(item.start_time) : null;
          const end = item.end_time ? new Date(item.end_time) : null;
          const instructor = instructorMap.get(item.instructorUuid);
          const route = classLearningRoutes.get(item.classDefinitionUuid ?? item.uuid ?? '');

          return {
            id: item.uuid ?? item.classDefinitionUuid,
            title: item.title ?? item.classTitle ?? 'Upcoming live class',
            dateLabel: formatDate(start, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            timeLabel: `${formatTime(start)} - ${formatTime(end)}`,
            instructor: instructor?.full_name ?? 'Instructor',
            locationLabel: item.locationLabel,
            href: buildClassLearningHref(item.classDefinitionUuid ?? item.uuid ?? '', route),
            lessonId: route?.lessonId,
            contentId: route?.contentId,
            lastLessonId: route?.lastLessonId,
            nextLessonId: route?.nextLessonId,
          };
        }),
    [classLearningRoutes, instructorMap, now, upcomingClasses]
  );

  const upcomingClassesList = useMemo<LearningHubUpcomingClass[]>(
    () =>
      upcomingClasses
        .map(item => {
          const start = item.start_time ? new Date(item.start_time) : null;
          const end = item.end_time ? new Date(item.end_time) : null;
          const startMs = start?.getTime();
          const route = classLearningRoutes.get(item.classDefinitionUuid ?? item.uuid ?? '');

          return {
            id: item.uuid ?? item.classDefinitionUuid,
            title: item.classTitle ?? '',
            courseName: item.courseName,
            dateLabel: formatDate(start, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            timeLabel: `${formatTime(start)} - ${formatTime(end)}`,
            locationLabel: item.locationLabel,
            href: buildClassLearningHref(item.classDefinitionUuid ?? item.uuid ?? '', route),
            startMs: typeof startMs === 'number' && !Number.isNaN(startMs) ? startMs : undefined,
            lessonId: route?.lessonId,
            contentId: route?.contentId,
            lastLessonId: route?.lastLessonId,
            nextLessonId: route?.nextLessonId,
            startTime: item.start_time
          };
        }),
    [classLearningRoutes, upcomingClasses]
  );

  const assignments = useMemo<LearningHubAssignment[]>(() => {
    const rows = assignmentSchedules
      .map(item => {
        const assignmentUuid = item.schedule.assignment_uuid;
        if (!assignmentUuid) return null;

        const assignment = assignmentsMap.get(assignmentUuid);
        if (!assignment) return null;

        const enrollmentUuids = new Set(
          item.classInfo.classEnrollments
            .map(enrollment => enrollment.enrollment_uuid)
            .filter(Boolean)
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
          href: '/dashboard/student/assignment',
          dueTime: dueDate ? new Date(dueDate).getTime() : Number.MAX_SAFE_INTEGER,
        };
      })
      .filter((value): value is LearningHubAssignment & { dueTime: number } => Boolean(value))
      .sort((a, b) => a.dueTime - b.dueTime)
      .slice(0, 3)
      .map(({ dueTime: _dueTime, ...assignment }) => assignment);

    return rows.length > 0 ? rows : [];
  }, [assignmentSchedules, assignmentsMap, submissionsMap]);

  const enrolledCourseIds = new Set(
    classDefinitions.map(item => item.course?.uuid).filter(Boolean)
  );

  const recommendedCourses = useMemo(() => {
    return publishedCourses
      .filter(course => course?.name && !enrolledCourseIds.has(course.uuid))
      .slice(0, 6)
      .map(course => ({
        id: course.uuid ?? course.name,
        title: course.name,
        level: (course.duration_hours ?? 0) >= 5 ? 'Intermediate' : 'Beginner',
        duration: formatHours((course.duration_hours ?? 0) * 60 + (course.duration_minutes ?? 0)),
      }));
  }, [publishedCourses, enrolledCourseIds]);

  const invite = useMemo<LearningHubInvite | null>(() => {
    const item = upcomingClassesList[1] ?? upcomingClassesList[0];
    if (!item) return MOCK_INVITE;

    return {
      id: item.id ?? 'invite-session',
      title: item.title ?? 'Vocal Training Level 2',
      subtitle: item.locationLabel ?? 'Vocal Performance Practice',
      timeLabel: `${item.dateLabel} · ${item.timeLabel}`,
      href: item.href ?? '/dashboard/student/schedule',
    };
  }, [upcomingClassesList]);

  const weeklyMinutes = upcomingClasses
    .slice(0, 7)
    .reduce((sum, item) => sum + toMinutes(item.duration_minutes), 0);

  const activeClassesCount = activeCourses.length;
  const assignmentsDueCount = assignments.length;
  const overallProgress =
    continueLearning.length > 0
      ? Math.round(
        continueLearning.reduce((sum, item) => sum + item.progress, 0) / continueLearning.length
      )
      : 0;

  const stats: LearningHubStat[] = [
    {
      id: 'active-classes',
      value: String(activeClassesCount),
      label: 'Active Courses',
      tone: 'blue',
    },
    {
      id: 'weekly-learning-time',
      value: formatHours(weeklyMinutes || 0),
      label: 'Weekly Learning Time',
      tone: 'green',
    },
    {
      id: 'assignments-due',
      value: String(assignmentsDueCount),
      label: 'Assignments Due',
      tone: 'red',
    },
    {
      id: 'overall-progress',
      value: `${overallProgress}%`,
      label: 'Overall Progress',
      tone: 'orange',
    },
  ];

  return {
    studentName:
      profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : '',
    firstName: profile?.first_name ?? '',
    stats,
    courseEnrollments,
    classEnrollments,
    certificates,
    courseEnrollmentCount: courseEnrollmentCount || courseEnrollments.length,
    classEnrollmentCount: classEnrollmentCount || classEnrollments.length,
    activeCourses,
    continueLearning,
    liveClasses,
    upcomingClasses: upcomingClassesList,
    nextClass,
    assignments,
    recommendedCourses,
    invite,
    loading:
      classDefinitionsLoading ||
      scheduledInstanceEnrollmentsLoading ||
      certificatesLoading ||
      enrollmentOverviewLoading ||
      publishedCoursesLoading ||
      instructorQueries.some(query => query.isLoading) ||
      assignmentScheduleQueries.some(query => query.isLoading) ||
      assignmentQueries.some(query => query.isLoading) ||
      assignmentSubmissionsQueries.some(query => query.isLoading),
  };
}
