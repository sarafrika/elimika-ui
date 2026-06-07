"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import { useUserProfile } from "../../../../context/profile-context";
import { useCoursesMap } from "../../../../hooks/use-courses-map";
import { useDifficultyLevels } from "../../../../hooks/use-difficultyLevels";
import useInstructorClassesWithDetails, {
  type InstructorClassWithDetails,
} from "../../../../hooks/use-instructor-classes";
import { useStudentMap } from "../../../../hooks/use-student-map";
import { useUsersMap } from "../../../../hooks/use-users-map";
import { getEnrollmentOverviewForStudentOptions } from "../../../../services/client/@tanstack/react-query.gen";
import type {
  Course,
  Enrollment,
  Student,
  StudentClassEnrollmentSummary,
  StudentCourseEnrollmentSummary,
  StudentEnrollmentOverview,
  User,
} from "@/services/client";

import type {
  CourseTab,
  FilterOption,
  RecentActivity,
  StudentRosterClass,
  StudentRosterEntry,
  StudentRosterStudent,
  StudentStatus,
} from "./types";
import {
  formatRelativeTime,
  formatStudentName,
  getStudentAvatarColor,
  getStudentInitials,
  getStudentProgress,
  normalizeStudentStatus,
} from "./types";

type StudentBuilder = {
  studentUuid: string;
  student: StudentRosterStudent;
  profile: Student | null;
  user: User | null;
  classes: Set<StudentRosterClass>;
  courses: Set<Course>;
  levels: Set<string>;
};

function toRosterClass(
  cls: InstructorClassWithDetails
): StudentRosterClass {
  return {
    uuid: cls.uuid,
    title: cls.title,
    course_uuid: cls.course_uuid,
    course: cls.course ?? null,
    enrollment: cls.enrollment ?? null,
  };
}

function getLatestDate(
  courseEnrollments: StudentCourseEnrollmentSummary[],
  classEnrollments: StudentClassEnrollmentSummary[]
) {
  const dates = [
    ...courseEnrollments.map((item) => item.updated_date).filter(Boolean),
    ...classEnrollments.map((item) => item.latest_activity_date).filter(Boolean),
  ] as Date[];

  if (dates.length === 0) return undefined;

  return dates.reduce((latest, current) =>
    current.getTime() > latest.getTime() ? current : latest
  );
}

function getLatestCourseEnrollment(
  courseEnrollments: StudentCourseEnrollmentSummary[]
) {
  return [...courseEnrollments].sort((a, b) => {
    const aDate = a.updated_date?.getTime() ?? 0;
    const bDate = b.updated_date?.getTime() ?? 0;
    return bDate - aDate;
  })[0];
}

function getStudentStatus(
  courseEnrollments: StudentCourseEnrollmentSummary[],
  classEnrollments: StudentClassEnrollmentSummary[],
  progress: number
): StudentStatus {
  const latestCourseStatus = getLatestCourseEnrollment(courseEnrollments)
    ?.enrollment_status;
  const latestClassStatus = [...classEnrollments]
    .sort((a, b) => {
      const aDate = a.latest_activity_date?.getTime() ?? 0;
      const bDate = b.latest_activity_date?.getTime() ?? 0;
      return bDate - aDate;
    })[0]?.latest_enrollment_status;

  const statusText = [latestCourseStatus, latestClassStatus]
    .filter(Boolean)
    .join(" ");

  return normalizeStudentStatus(statusText, progress);
}

function buildSearchIndex(
  studentName: string,
  email: string | undefined,
  classes: StudentRosterClass[],
  courses: Course[],
  levels: string[]
) {
  return [
    studentName,
    email,
    ...classes.map((item) => item.title),
    ...courses.map((item) => item.name),
    ...levels,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function useInstructorStudentsData() {
  const profile = useUserProfile();
  const instructor = profile?.instructor;

  const { courseMap, isLoading: courseIsLoading } = useCoursesMap();
  const { difficultyMap, isLoading: difficultyIsLoading } =
    useDifficultyLevels();
  const { studentMap, isLoading: studentIsLoading } = useStudentMap();
  const { userMap, isLoading: userIsLoading } = useUsersMap();

  const { classes, loading: classesLoading } = useInstructorClassesWithDetails(
    instructor?.uuid as string
  );

  const studentIds = useMemo(() => {
    const ids = new Set<string>();

    classes.forEach((cls) => {
      (cls.enrollment ?? []).forEach((enrollment: Enrollment) => {
        if (enrollment.student_uuid) {
          ids.add(enrollment.student_uuid);
        }
      });
    });

    return Array.from(ids);
  }, [classes]);

  const overviewQueries = useQueries({
    queries: studentIds.map((studentUuid) => ({
      ...getEnrollmentOverviewForStudentOptions({
        path: { studentUuid },
        query: { pageable: { page: 0, size: 1000 } },
      }),
      enabled: !!studentUuid,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    })),
  });

  const overviewMap = useMemo(() => {
    const map = new Map<string, StudentEnrollmentOverview>();

    studentIds.forEach((studentUuid, index) => {
      const overview = overviewQueries[index]?.data?.data;
      if (overview) {
        map.set(studentUuid, overview);
      }
    });

    return map;
  }, [overviewQueries, studentIds]);

  const students = useMemo<StudentRosterEntry[]>(() => {
    const roster = new Map<string, StudentBuilder>();

    classes.forEach((cls) => {
      const rosterClass = toRosterClass(cls);
      const course = rosterClass.course
        ?? (rosterClass.course_uuid ? courseMap?.[rosterClass.course_uuid] : undefined);

      (cls.enrollment ?? []).forEach((enrollment: Enrollment) => {
        const studentUuid = enrollment.student_uuid;
        if (!studentUuid) return;

        const profileStudent = studentMap?.[studentUuid] ?? null;
        const user = profileStudent?.user_uuid
          ? userMap?.[profileStudent.user_uuid] ?? null
          : null;
        const fullName = formatStudentName(user, profileStudent);

        if (!roster.has(studentUuid)) {
          roster.set(studentUuid, {
            studentUuid,
            profile: profileStudent,
            user,
            student: {
              uuid: profileStudent?.uuid ?? studentUuid,
              user_uuid: profileStudent?.user_uuid ?? user?.uuid ?? studentUuid,
              full_name: fullName,
              initials: getStudentInitials(fullName),
              avatarColor: getStudentAvatarColor(studentUuid),
              email: user?.email,
              joinedAt: profileStudent?.created_date,
            },
            classes: new Set(),
            courses: new Set(),
            levels: new Set(),
          });
        }

        const entry = roster.get(studentUuid);

        if (!entry) return;

        entry.profile = profileStudent;
        entry.user = user;
        entry.student = {
          ...entry.student,
          full_name: fullName,
          initials: getStudentInitials(fullName),
          email: user?.email,
          joinedAt: profileStudent?.created_date,
        };
        entry.classes.add(rosterClass);
        if (course) {
          entry.courses.add(course);
          if (course.difficulty_uuid) {
            const level = difficultyMap[course.difficulty_uuid];
            if (level) entry.levels.add(level);
          }
        }
      });
    });

    return Array.from(roster.values())
      .map((entry) => {
        const overview = overviewMap.get(entry.studentUuid);
        const courseEnrollments =
          overview?.course_enrollments?.content ?? [];
        const classEnrollments =
          overview?.class_enrollments?.content ?? [];
        const progress = getStudentProgress(courseEnrollments);
        const status = getStudentStatus(
          courseEnrollments,
          classEnrollments,
          progress
        );
        const latestActivityAt = getLatestDate(
          courseEnrollments,
          classEnrollments
        );

        return {
          student: entry.student,
          profile: entry.profile,
          user: entry.user,
          classes: Array.from(entry.classes),
          courses: Array.from(entry.courses),
          courseEnrollments,
          classEnrollments,
          status,
          progress,
          walletBalance: 0,
          levels: Array.from(entry.levels).sort((a, b) =>
            a.localeCompare(b)
          ),
          latestActivityAt,
          searchIndex: buildSearchIndex(
            entry.student.full_name,
            entry.student.email,
            Array.from(entry.classes),
            Array.from(entry.courses),
            Array.from(entry.levels)
          ),
        };
      })
      .sort((a, b) => {
        const aTime = a.latestActivityAt?.getTime() ?? 0;
        const bTime = b.latestActivityAt?.getTime() ?? 0;

        if (bTime !== aTime) return bTime - aTime;

        return a.student.full_name.localeCompare(b.student.full_name);
      });
  }, [classes, courseMap, difficultyMap, overviewMap, studentMap, userMap]);

  const uniqueCourses = useMemo<Course[]>(() => {
    return Array.from(
      new Map(
        classes
          .map((cls) =>
            cls.course ?? (cls.course_uuid ? courseMap?.[cls.course_uuid] : undefined)
          )
          .filter((course): course is Course => Boolean(course))
          .map((course) => [course.uuid ?? course.name, course])
      ).values()
    );
  }, [classes, courseMap]);

  const courseTabs = useMemo<CourseTab[]>(() => {
    return [
      { id: "all", label: "All" },
      ...uniqueCourses.map((course) => ({
        id: course.uuid ?? course.name,
        label: course.name,
        thumbnail_url: course.thumbnail_url,
      })),
    ];
  }, [uniqueCourses]);

  const filterOptions = useMemo<{
    classes: FilterOption[];
    statuses: FilterOption[];
    levels: FilterOption[];
  }>(() => {
    const classOptions = Array.from(
      new Map(
        students.flatMap((student) =>
          student.classes.flatMap((item) =>
            item.uuid ? ([[item.uuid, item] as const]) : []
          )
        )
      ).values()
    )
      .map((item) => ({
        value: item.uuid ?? item.title ?? "class",
        label: item.title ?? item.course?.name ?? "Class",
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const statusOptions = Array.from(
      new Set(students.map((student) => student.status))
    )
      .map((status) => ({
        value: status,
        label: status,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const levelOptions = Array.from(
      new Set(students.flatMap((student) => student.levels))
    )
      .map((level) => ({
        value: level,
        label: level,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return {
      classes: classOptions,
      statuses: statusOptions,
      levels: levelOptions,
    };
  }, [students]);

  const recentActivities = useMemo<RecentActivity[]>(() => {
    return students
      .filter((student) => student.latestActivityAt)
      .slice(0, 5)
      .map((student, index) => {
        const latestCourseEnrollment = [...student.courseEnrollments].sort(
          (a, b) =>
            (b.updated_date?.getTime() ?? 0) - (a.updated_date?.getTime() ?? 0)
        )[0];

        const action =
          student.status === "Graduated"
            ? "completed"
            : student.status === "On Hold"
              ? "updated"
              : "joined";

        const activityType =
          student.status === "Graduated"
            ? "completion"
            : student.status === "On Hold"
              ? "assignment"
              : "join";

        return {
          id: `${student.student.uuid}-${index}`,
          type: activityType,
          student: student.student.full_name,
          action,
          course:
            latestCourseEnrollment?.course_name ??
            student.courses[0]?.name ??
            undefined,
          time: formatRelativeTime(student.latestActivityAt),
          occurredAt: student.latestActivityAt,
        };
      });
  }, [students]);

  const loading =
    classesLoading ||
    courseIsLoading ||
    difficultyIsLoading ||
    studentIsLoading ||
    userIsLoading ||
    overviewQueries.some((query) => query.isPending);

  return {
    classes,
    students,
    courses: uniqueCourses,
    courseTabs,
    filterOptions,
    recentActivities,
    loading,
  };
}
