'use client';

import {
  SharedMySkillsPage,
  type SharedMySkillsProfile,
  type SharedOpportunity,
} from '@/app/dashboard/_components/my-skills';
import { useVerifiedSkillsContent } from '@/app/dashboard/_components/my-skills/verified-skills/live-data';
import { useInstructor } from '@/context/instructor-context';
import { useUserProfile } from '@/context/profile-context';
import { useMultipleClassDetails } from '@/hooks/use-class-multiple-details';
import type { StudentSchedule } from '@/services/client';
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
  return names || String(value.name ?? 'Instructor Profile');
};

export default function InstructorMySkillsPage() {
  const user = useUserProfile();
  const instructorContext = useInstructor();
  const instructor = user?.instructor ?? instructorContext;
  const verifiedSkillsContent = useVerifiedSkillsContent('instructor');

  const studentSearchQuery = useQuery({
    ...searchStudentsOptions({
      query: {
        pageable: {},
        searchParams: { user_uuid_eq: instructor?.user_uuid as string },
      },
    }),
    enabled: !!instructor?.user_uuid,
  });

  const studentInfo = studentSearchQuery.data?.content?.[0] as { uuid?: string } | undefined;

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
        id: detail?.class?.uuid ?? `instructor-opportunity-${index}`,
        title: detail?.course?.name ?? 'Recommended Course',
        provider: detail?.class?.title ?? 'Elimika',
        mode: detail?.course?.category_names?.join(', ') || 'Hybrid',
        match: Math.max(70, 88 - index * 6),
        status: detail?.course?.status,
      })),
    [classDetails]
  );

  const profile: SharedMySkillsProfile = {
    name: getProfileString(user, ['full_name', 'display_name']) ?? getProfileName(user),
    title:
      getProfileString(instructor, ['professional_headline', 'headline', 'title']) ??
      getProfileString(user, ['professional_headline', 'headline', 'title']) ??
      'Instructor Skills Wallet',
    location:
      getProfileString(instructor, ['location', 'formatted_location', 'country']) ??
      getProfileString(user, ['location', 'formatted_location', 'country']) ??
      'Training profile',
    avatarUrl: getProfileString(user, ['profile_image', 'profile_image_url', 'avatar_url']),
    email: getProfileString(user, ['email', 'contact_email']),
    phone: getProfileString(user, ['phone_number', 'phone', 'contact_phone']),
    website: getProfileString(instructor, ['website']) ?? getProfileString(user, ['website']),
    joinedLabel:
      (getProfileString(user, ['created_date']) ?? getProfileString(instructor, ['created_date']))
        ? `Joined ${new Date(
            (getProfileString(user, ['created_date']) ??
              getProfileString(instructor, ['created_date'])) as string
          ).toLocaleDateString()}`
        : undefined,
  };

  return (
    <SharedMySkillsPage
      profile={profile}
      content={verifiedSkillsContent}
      opportunities={opportunities}
      isLoading={verifiedSkillsContent.isLoading || classDetailsQuery.isLoading}
      actionLabel='Share Profile'
    />
  );
}
