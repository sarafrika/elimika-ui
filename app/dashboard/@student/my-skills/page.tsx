'use client';

import {
  SharedMySkillsPage,
  type SharedCredentialSummary,
  type SharedMySkillsProfile,
  type SharedOpportunity,
  type SharedSkill,
  type SharedTimelineItem,
} from '@/app/dashboard/_components/my-skills';
import { useStudent } from '@/context/student-context';
import {
  getClassDefinitionOptions,
  getCourseByUuidOptions,
  getStudentCertificatesOptions,
  getStudentScheduleOptions,
  getTrainingProgramByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  Certificate,
  ClassDefinition,
  Course,
  StudentSchedule,
  TrainingProgram,
} from '@/services/client/types.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Award, BookOpenCheck, GraduationCap } from 'lucide-react';
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

const getCategory = (item?: CourseOrProgram) =>
  item && 'category_names' in item ? item.category_names?.[0] || 'General' : 'General';

const getLevel = (score?: number) =>
  score && score >= 90 ? 'Advanced' : score && score >= 75 ? 'Intermediate' : 'Beginner';

const getProfileName = (profile: unknown) => {
  const value = (profile ?? {}) as Record<string, unknown>;
  const names = [value.first_name, value.last_name].filter(Boolean).join(' ');
  return names || String(value.name ?? 'Student Profile');
};

export default function StudentMySkillsPage() {
  const student = useStudent();

  const certificatesQuery = useQuery({
    ...getStudentCertificatesOptions({ path: { studentUuid: student?.uuid as string } }),
    enabled: !!student?.uuid,
  });

  const enrollmentsQuery = useQuery({
    ...getStudentScheduleOptions({
      path: { studentUuid: student?.uuid as string },
      query: { start: new Date('2026-01-01'), end: new Date('2027-12-31') },
    }),
    enabled: !!student?.uuid,
  });

  const certificates = (certificatesQuery.data?.data ?? []) as Certificate[];
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

    certificates.forEach(certificate => {
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
  }, [certificates, classDefinitionsMap, uniqueEnrollments]);

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

  const skills = useMemo<SharedSkill[]>(
    () =>
      certificates
        .filter(certificate => certificate.is_valid)
        .map((certificate, index) => {
          const item = certificate.course_uuid
            ? coursesMap.get(certificate.course_uuid)
            : certificate.program_uuid
              ? programsMap.get(certificate.program_uuid)
              : undefined;
          const score = Math.round(certificate.final_grade ?? 0);

          return {
            id: certificate.uuid ?? `student-skill-${index}`,
            name: getName(item),
            level: getLevel(score),
            score,
            category: getCategory(item),
            verified: certificate.is_valid,
            version: certificate.grade_letter ? `Grade ${certificate.grade_letter}` : 'Verified',
          };
        }),
    [certificates, coursesMap, programsMap]
  );

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

  const summary: SharedCredentialSummary = {
    badgesEarned: skills.length,
    certificatesEarned: certificates.filter(certificate => certificate.is_valid).length,
    shares: Math.max(0, uniqueEnrollments.length),
  };

  const timeline: SharedTimelineItem[] =
    skills.length > 0
      ? skills.slice(0, 4).map((skill, index) => ({
          id: `student-timeline-${skill.id}`,
          title: skill.name,
          provider: index === 0 ? 'Google' : index === 1 ? 'Meta' : 'Coursera',
          description: `${skill.level} credential in ${skill.category ?? 'General'}`,
          metric: `${skill.score}%`,
          icon:
            index === 0 ? (
              <Award className='size-4' />
            ) : index === 1 ? (
              <GraduationCap className='size-4' />
            ) : (
              <BookOpenCheck className='size-4' />
            ),
        }))
      : [
          {
            id: 'student-empty-timeline',
            title: 'Start learning',
            provider: 'Elimika',
            description: 'Complete courses to build your verified skills wallet.',
            metric: '0%',
            icon: <BookOpenCheck className='size-4' />,
          },
        ];

  const profile: SharedMySkillsProfile = {
    name: getProfileName(student),
    title:
      getProfileString(student, ['professional_headline', 'headline', 'title']) ??
      'Verified Learning Profile',
    location:
      getProfileString(student, ['location', 'formatted_location', 'country']) ??
      'Learning profile',
    email: getProfileString(student, ['email', 'contact_email']),
    phone: getProfileString(student, ['phone_number', 'phone', 'contact_phone']),
    joinedLabel: getProfileString(student, ['created_date'])
      ? `Joined ${new Date(getProfileString(student, ['created_date']) as string).toLocaleDateString()}`
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
      skills={skills}
      summary={summary}
      timeline={timeline}
      opportunities={opportunities}
      isLoading={isLoading}
      actionLabel='Share Profile'
    />
  );
}
