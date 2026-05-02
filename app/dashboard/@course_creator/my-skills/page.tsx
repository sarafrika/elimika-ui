'use client';

import {
  SharedMySkillsPage,
  type SharedMySkillsProfile,
  type SharedOpportunity,
} from '@/app/dashboard/_components/my-skills';
import { useVerifiedSkillsContent } from '@/app/dashboard/_components/my-skills/verified-skills/live-data';
import { useProfileShareUrl } from '@/app/dashboard/_components/my-skills/use-profile-share-url';
import { useCourseCreator } from '@/context/course-creator-context';
import { useUserProfile } from '@/context/profile-context';
import { useMultipleClassDetails } from '@/hooks/use-class-multiple-details';
import type { Student, StudentSchedule } from '@/services/client';
import {
  getStudentScheduleOptions,
  searchStudentsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

type MultipleClassDetail = NonNullable<ReturnType<typeof useMultipleClassDetails>['data']>[number];

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
  const verifiedSkillsContent = useVerifiedSkillsContent('course_creator');
  const shareUrl = useProfileShareUrl(user?.uuid ?? creatorProfile?.user_uuid, 'course_creator');

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
      content={verifiedSkillsContent}
      opportunities={opportunities}
      isLoading={verifiedSkillsContent.isLoading || classDetailsQuery.isLoading}
      shareUrl={shareUrl}
    />
  );
}
