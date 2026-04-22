'use client';

import {
  SharedMySkillsPage,
  type SharedCredentialSummary,
  type SharedMySkillsProfile,
  type SharedOpportunity,
  type SharedSkill,
  type SharedTimelineItem,
} from '@/app/dashboard/_components/my-skills';
import { useCourseCreator } from '@/context/course-creator-context';
import { useUserProfile } from '@/context/profile-context';
import { useMultipleClassDetails } from '@/hooks/use-class-multiple-details';
import type { CourseCreatorSkill, Student, StudentSchedule } from '@/services/client';
import {
  getCourseCreatorSkillsOptions,
  getStudentScheduleOptions,
  searchStudentsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { Award, BookOpenCheck, GraduationCap } from 'lucide-react';
import { useMemo } from 'react';

const proficiencyScoreMap: Record<string, number> = {
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  expert: 100,
};

type MultipleClassDetail = NonNullable<ReturnType<typeof useMultipleClassDetails>['data']>[number];

const titleCase = (value?: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : 'Beginner';

const getProfileString = (profile: unknown, keys: string[]) => {
  const value = (profile ?? {}) as Record<string, unknown>;
  const match = keys.map(key => value[key]).find(item => typeof item === 'string' && item);
  return typeof match === 'string' ? match : undefined;
};

const getProfileName = (profile: unknown) => {
  const value = (profile ?? {}) as Record<string, unknown>;
  const names = [value.first_name, value.last_name].filter(Boolean).join(' ');
  return names || String(value.name ?? 'Course Creator Profile');
};

export default function CourseCreatorMySkillsPage() {
  const user = useUserProfile();
  const creator = useCourseCreator();
  const creatorProfile = user?.courseCreator ?? creator?.profile;
  const creatorUuid = creatorProfile?.uuid as string;

  const skillsQuery = useQuery({
    ...getCourseCreatorSkillsOptions({
      path: { courseCreatorUuid: creatorUuid },
      query: { pageable: {} },
    }),
    enabled: !!creatorUuid,
  });

  const studentSearchQuery = useQuery({
    ...searchStudentsOptions({
      query: {
        pageable: {},
        searchParams: { user_uuid_eq: creatorProfile?.user_uuid as string },
      },
    }),
    enabled: !!creatorProfile?.user_uuid,
  });

  const studentSearchResults = (studentSearchQuery.data?.content ?? []) as Student[];
  const studentInfo = studentSearchResults[0];

  const studentEnrollmentQuery = useQuery({
    ...getStudentScheduleOptions({
      path: { studentUuid: studentInfo?.uuid ?? '' },
      query: { start: new Date('2026-01-20'), end: new Date('2027-01-20') },
    }),
    enabled: !!studentInfo?.uuid,
  });

  const studentEnrollments: StudentSchedule[] = studentEnrollmentQuery.data?.data ?? [];
  const uniqueClassDefinitionUuids = useMemo(
    () =>
      Array.from(
        new Set(
          studentEnrollments
            .map(enrollment => enrollment.class_definition_uuid)
            .filter((uuid): uuid is string => Boolean(uuid))
        )
      ),
    [studentEnrollments]
  );

  const classDetailsQuery = useMultipleClassDetails(uniqueClassDefinitionUuids);
  const classDetails = (classDetailsQuery.data ?? []) as MultipleClassDetail[];
  const apiSkills: CourseCreatorSkill[] = skillsQuery.data?.data?.content ?? [];

  const skills = useMemo<SharedSkill[]>(
    () =>
      apiSkills.map((skill, index) => {
        const level = titleCase(skill.proficiency_level);
        return {
          id: skill.uuid ?? `course-creator-skill-${index}`,
          name: skill.skill_name,
          level,
          score: proficiencyScoreMap[skill.proficiency_level.toLowerCase()] ?? 0,
          category: 'Course Design',
          verified: true,
          version: level,
        };
      }),
    [apiSkills]
  );

  const opportunities = useMemo<SharedOpportunity[]>(
    () =>
      classDetails.slice(0, 3).map((detail, index) => ({
        id: detail?.class?.uuid ?? `course-creator-opportunity-${index}`,
        title: detail?.course?.name ?? 'Recommended Course',
        provider: detail?.class?.title ?? 'Elimika',
        mode: detail?.course?.category_names?.join(', ') || 'Remote',
        match: Math.max(68, 89 - index * 6),
        status: detail?.course?.status,
      })),
    [classDetails]
  );

  const summary: SharedCredentialSummary = {
    badgesEarned: skills.length,
    certificatesEarned: Math.round(skills.length / 2),
    shares: classDetails.length,
  };

  const timeline: SharedTimelineItem[] =
    skills.length > 0
      ? skills.slice(0, 4).map((skill, index) => ({
          id: `course-creator-timeline-${skill.id}`,
          title: skill.name,
          provider: index === 0 ? 'Google' : index === 1 ? 'Meta' : 'Coursera',
          description: `${skill.level} creator credential`,
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
            id: 'course-creator-empty-timeline',
            title: 'Skills wallet ready',
            provider: 'Elimika',
            description: 'Verified course design skills will appear in your wallet.',
            metric: '0%',
            icon: <BookOpenCheck className='size-4' />,
          },
        ];

  const profile: SharedMySkillsProfile = {
    name: getProfileString(user, ['full_name', 'display_name']) ?? getProfileName(user),
    title:
      getProfileString(creatorProfile, ['professional_headline', 'headline', 'title']) ??
      getProfileString(user, ['professional_headline', 'headline', 'title']) ??
      'Course Creator Skills Wallet',
    location:
      getProfileString(creatorProfile, ['location', 'formatted_location', 'country']) ??
      getProfileString(user, ['location', 'formatted_location', 'country']) ??
      'Course design profile',
    avatarUrl: getProfileString(user, ['profile_image', 'profile_image_url', 'avatar_url']),
    email: getProfileString(user, ['email', 'contact_email']),
    phone: getProfileString(user, ['phone_number', 'phone', 'contact_phone']),
    website: getProfileString(creatorProfile, ['website']) ?? getProfileString(user, ['website']),
    joinedLabel:
      (getProfileString(user, ['created_date']) ??
      getProfileString(creatorProfile, ['created_date']))
        ? `Joined ${new Date(
            (getProfileString(user, ['created_date']) ??
              getProfileString(creatorProfile, ['created_date'])) as string
          ).toLocaleDateString()}`
        : undefined,
  };

  return (
    <SharedMySkillsPage
      profile={profile}
      skills={skills}
      summary={summary}
      timeline={timeline}
      opportunities={opportunities}
      isLoading={skillsQuery.isLoading || classDetailsQuery.isLoading}
      actionLabel='Share Profile'
    />
  );
}
