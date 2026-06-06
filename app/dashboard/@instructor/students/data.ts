import { Student } from '@/services/client';
import { useMemo } from "react";
import { useUserProfile } from "../../../../context/profile-context";
import { useCoursesMap } from "../../../../hooks/use-courses-map";
import useInstructorClassesWithDetails from "../../../../hooks/use-instructor-classes";
import { useStudentMap } from "../../../../hooks/use-student-map";
import { RecentActivity } from "./types";

export const recentActivities: RecentActivity[] = [
  {
    id: "1",
    type: "completion",
    student: "Jane Smith",
    action: "completed",
    course: "Digital Marketing",
    time: "2 hours ago",
  },
  {
    id: "2",
    type: "assignment",
    student: "Brian Kim",
    action: "submitted assignment",
    time: "5 hours ago",
  },
  {
    id: "3",
    type: "join",
    student: "Emily Wang",
    action: "joined",
    course: "Graphic Design",
    time: "1 day ago",
  },
];

export function useInstructorStudentsData() {
  const profile = useUserProfile();
  const instructor = profile?.instructor;
  const { courseMap } = useCoursesMap();
  const { studentMap } = useStudentMap();

  const { classes } = useInstructorClassesWithDetails(
    instructor?.uuid as string
  );

  const instructorCourseUuids = useMemo(() => {
    const set = new Set<string>();
    classes?.forEach((c: any) => c?.course_uuid && set.add(c.course_uuid));
    return Array.from(set);
  }, [classes]);

  const instructorCourses = useMemo(() => {
    return instructorCourseUuids
      .map((uuid) => courseMap?.[uuid])
      .filter(Boolean);
  }, [instructorCourseUuids, courseMap]);

  const courseTabs = useMemo(() => {
    return [
      { id: "all", label: "All" },
      ...instructorCourses.map((c: any) => ({
        id: c.uuid,
        label: c.name,
        thumbnail_url: c?.thumbnail_url,
      })),
    ];
  }, [instructorCourses]);

  const students = useMemo(() => {
    const map = new Map<string, {
      student: Student;
      classes: Set<any>;
      courses: Set<any>;
    }>();

    classes?.forEach((cls: any) => {
      const course = courseMap?.[cls.course_uuid];

      (cls.enrollment ?? []).forEach((e: any) => {
        if (!e?.student_uuid) return;

        if (!map.has(e.student_uuid)) {
          map.set(e.student_uuid, {
            student: studentMap?.[e.student_uuid] as Student,
            classes: new Set(),
            courses: new Set(),
          });
        }

        const entry = map.get(e.student_uuid);

        entry?.classes.add(cls);
        if (course) entry?.courses.add(course);
      });
    });

    return Array.from(map.values()).map((v) => ({
      student: v.student,
      classes: Array.from(v.classes),
      courses: Array.from(v.courses),
    }));
  }, [classes, courseMap, studentMap]);

  return {
    classes,
    students,
    courses: instructorCourses,
    courseTabs,
    recentActivities: [],
  };
}