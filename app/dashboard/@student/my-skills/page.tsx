'use client';

import {
  SharedMySkillsPage,
  type SharedMySkillsProfile,
  type SharedOpportunity,
} from '@/app/dashboard/_components/my-skills';
import { useVerifiedSkillsContent } from '@/app/dashboard/_components/my-skills/verified-skills/live-data';
import { useUserProfile } from '@/context/profile-context';
import { useStudent } from '@/context/student-context';
import {
  getClassDefinitionOptions,
  getCourseByUuidOptions,
  getStudentCertificatesOptions,
  getStudentScheduleOptions,
  getTrainingProgramByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  ClassDefinition,
  Course,
  StudentSchedule,
  TrainingProgram,
} from '@/services/client/types.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

type CourseOrProgram = Course | TrainingProgram;

const stripHtml = (value?: string) => (value ? value.replace(/<[^>]+>/g, '').trim() : '');

const truncateText = (value?: string, length = 72) => {
  if (!value) return '';
  return value.length > length ? `${value.slice(0, length).trim()}...` : value;
};

const getProfileString = (profile: unknown, keys: string[]) => {
  const value = (profile ?? {}) as Record<string, unknown>;
  const match = keys.map(key => value[key]).find(item => typeof item === 'string' && item);
  return typeof match === 'string' ? match : undefined;
};

const getName = (item?: CourseOrProgram) =>
  !item ? 'Verified Skill' : 'name' in item ? item.name : item.title;

const getProfileName = (profile: unknown) => {
  const value = (profile ?? {}) as Record<string, unknown>;
  const names = [value.first_name, value.last_name].filter(Boolean).join(' ');
  return names || String(value.name ?? 'Student Profile');
};

export default function StudentMySkillsPage() {
  const user = useUserProfile();
  const studentContext = useStudent();
  const student = user?.student ?? studentContext;

  const certificatesQuery = useQuery({
    ...getStudentCertificatesOptions({ path: { studentUuid: student?.uuid as string } }),
    enabled: !!student?.uuid,
  });
  const verifiedSkillsContent = useVerifiedSkillsContent('student');

  const enrollmentsQuery = useQuery({
    ...getStudentScheduleOptions({
      path: { studentUuid: student?.uuid as string },
      query: { start: new Date('2026-01-01'), end: new Date('2027-12-31') },
    }),
    enabled: !!student?.uuid,
  });

  const enrollments = (enrollmentsQuery.data?.data ?? []) as StudentSchedule[];

  const uniqueEnrollments = useMemo(() => {
    const map = new Map<string, StudentSchedule>();
    enrollments.forEach(enrollment => {
      if (enrollment.class_definition_uuid && !map.has(enrollment.class_definition_uuid)) {
        map.set(enrollment.class_definition_uuid, enrollment);
      }
    });
    return Array.from(map.values());
  }, [enrollments]);

  const classDefinitionUuids = useMemo(
    () =>
      Array.from(
        new Set(
          uniqueEnrollments
            .map(enrollment => enrollment.class_definition_uuid)
            .filter((uuid): uuid is string => Boolean(uuid))
        )
      ),
    [uniqueEnrollments]
  );

  const classDefinitionQueries = useQueries({
    queries: classDefinitionUuids.map(uuid => ({
      ...getClassDefinitionOptions({ path: { uuid } }),
      enabled: !!uuid,
    })),
  });

  const classDefinitionsMap = useMemo(() => {
    const map = new Map<string, ClassDefinition>();
    classDefinitionQueries.forEach((query, index) => {
      const classDefinition = query.data?.data?.class_definition;
      const uuid = classDefinitionUuids[index];
      if (classDefinition && uuid) map.set(uuid, classDefinition);
    });
    return map;
  }, [classDefinitionQueries, classDefinitionUuids]);

  const { courseUuids, programUuids } = useMemo(() => {
    const courses = new Set<string>();
    const programs = new Set<string>();

    (certificatesQuery.data?.data ?? []).forEach(certificate => {
      if (certificate.course_uuid) courses.add(certificate.course_uuid);
      if (certificate.program_uuid) programs.add(certificate.program_uuid);
    });

    uniqueEnrollments.forEach(enrollment => {
      const classDefinition = enrollment.class_definition_uuid
        ? classDefinitionsMap.get(enrollment.class_definition_uuid)
        : undefined;
      if (classDefinition?.course_uuid) courses.add(classDefinition.course_uuid);
      if (classDefinition?.program_uuid) programs.add(classDefinition.program_uuid);
    });

    return { courseUuids: Array.from(courses), programUuids: Array.from(programs) };
  }, [certificatesQuery.data?.data, classDefinitionsMap, uniqueEnrollments]);

  const courseQueries = useQueries({
    queries: courseUuids.map(uuid => ({
      ...getCourseByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
    })),
  });
  const programQueries = useQueries({
    queries: programUuids.map(uuid => ({
      ...getTrainingProgramByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
    })),
  });

  const coursesMap = useMemo(() => {
    const map = new Map<string, Course>();
    courseQueries.forEach((query, index) => {
      const uuid = courseUuids[index];
      if (query.data?.data && uuid) map.set(uuid, query.data.data);
    });
    return map;
  }, [courseQueries, courseUuids]);

  const programsMap = useMemo(() => {
    const map = new Map<string, TrainingProgram>();
    programQueries.forEach((query, index) => {
      const uuid = programUuids[index];
      if (query.data?.data && uuid) map.set(uuid, query.data.data);
    });
    return map;
  }, [programQueries, programUuids]);

  const opportunities = useMemo<SharedOpportunity[]>(
    () =>
      uniqueEnrollments.slice(0, 3).map((enrollment, index) => {
        const classDefinition = enrollment.class_definition_uuid
          ? classDefinitionsMap.get(enrollment.class_definition_uuid)
          : undefined;
        const course = classDefinition?.course_uuid
          ? coursesMap.get(classDefinition.course_uuid)
          : undefined;
        const program = classDefinition?.program_uuid
          ? programsMap.get(classDefinition.program_uuid)
          : undefined;
        const item = course ?? program;

        return {
          id: enrollment.enrollment_uuid ?? `student-opportunity-${index}`,
          title: getName(item) || enrollment.title || 'Learning Opportunity',
          provider:
            classDefinition?.title ?? truncateText(stripHtml(item?.description), 36) ?? 'Elimika',
          mode: String(enrollment.location_type ?? 'Hybrid'),
          match: Math.max(72, 96 - index * 7),
          status: String(enrollment.enrollment_status ?? 'Active'),
          href: classDefinition?.course_uuid
            ? `/dashboard/courses/${classDefinition.course_uuid}`
            : undefined,
        };
      }),
    [classDefinitionsMap, coursesMap, programsMap, uniqueEnrollments]
  );

  const profile: SharedMySkillsProfile = {
    name: getProfileString(user, ['full_name', 'display_name']) ?? getProfileName(user),
    title:
      getProfileString(student, ['professional_headline', 'headline', 'title']) ??
      getProfileString(user, ['professional_headline', 'headline', 'title']) ??
      'Verified Learning Profile',
    location:
      getProfileString(student, ['location', 'formatted_location', 'country']) ??
      getProfileString(user, ['location', 'formatted_location', 'country']) ??
      'Learning profile',
    avatarUrl: getProfileString(user, ['profile_image', 'profile_image_url', 'avatar_url']),
    email: getProfileString(user, ['email', 'contact_email']),
    phone: getProfileString(user, ['phone_number', 'phone', 'contact_phone']),
    website: getProfileString(student, ['website']) ?? getProfileString(user, ['website']),
    joinedLabel:
      (getProfileString(user, ['created_date']) ?? getProfileString(student, ['created_date']))
        ? `Joined ${new Date(
            (getProfileString(user, ['created_date']) ??
              getProfileString(student, ['created_date'])) as string
          ).toLocaleDateString()}`
        : undefined,
  };

  const isLoading =
    certificatesQuery.isLoading ||
    enrollmentsQuery.isLoading ||
    classDefinitionQueries.some(query => query.isLoading) ||
    courseQueries.some(query => query.isLoading) ||
    programQueries.some(query => query.isLoading);

  return (
    <SharedMySkillsPage
      profile={profile}
      content={verifiedSkillsContent}
      opportunities={opportunities}
      isLoading={verifiedSkillsContent.isLoading || isLoading}
      actionLabel='Share Profile'
    />
  );
}
