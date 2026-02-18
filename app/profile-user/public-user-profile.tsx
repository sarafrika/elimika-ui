'use client';

import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import {
  getUserByUuidOptions,
  searchCourseCreatorsOptions,
  searchInstructorsOptions,
  searchStudentsOptions,
} from '../../services/client/@tanstack/react-query.gen';
import { creatorTabs } from '../dashboard/_profile-components/course-creator-tab';
import { instructorTabs } from '../dashboard/_profile-components/instructors-tab';
import { ProfilePage } from '../dashboard/_profile-components/profile-page';
import { studentTabs } from '../dashboard/_profile-components/students-tab';
import {
  SharedUserProfile,
  TabDefinition,
  UserDomain,
} from '../dashboard/_profile-components/types';

const TAB_REGISTRY: Record<UserDomain, TabDefinition[]> = {
  instructor: instructorTabs,
  course_creator: creatorTabs,
  student: studentTabs,
  admin: instructorTabs,
  organization: instructorTabs,
};

function normalisePublicProfile(user: any, domain: UserDomain): SharedUserProfile {
  const baseProfile = {
    user_uuid: user.uuid,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone_number,
    dob: user.dob,
    avatar_url: user.profile_image_url,
    profile_image_url: user.profile_image_url,
    is_online: false,
    gender: user.gender,
    active: user.active,
    username: user.username,
  };

  switch (domain) {
    case 'instructor': {
      const instructor = user.instructor;
      if (!instructor) {
        return { ...baseProfile, uuid: user.uuid };
      }
      return {
        ...baseProfile,
        uuid: instructor.uuid,
        website: instructor.website,
        bio: instructor.bio,
        address: instructor.formatted_location,
        latitude: instructor.latitude,
        longitude: instructor.longitude,
        professional_headline: instructor.professional_headline,
        admin_verified: instructor.admin_verified,
        is_profile_complete: instructor.is_profile_complete,
      };
    }

    case 'student': {
      const student = user.student;
      if (!student) {
        return { ...baseProfile, uuid: user.uuid };
      }
      return {
        ...baseProfile,
        uuid: student.uuid,
        bio: student.bio,
        address: student.formatted_location || '',
        latitude: student.latitude,
        longitude: student.longitude,
        professional_headline: student.professional_headline,
        admin_verified: student.admin_verified,
        is_profile_complete: student.is_profile_complete,
        student_profile: student,
      };
    }

    case 'course_creator': {
      const creator = user.courseCreator;
      if (!creator) {
        return { ...baseProfile, uuid: user.uuid };
      }
      return {
        ...baseProfile,
        uuid: creator.uuid,
        bio: creator.bio,
        website: creator.website,
        address: creator.address || creator.formatted_location || '',
        latitude: creator.latitude,
        longitude: creator.longitude,
        professional_headline: creator.professional_headline,
        admin_verified: creator.admin_verified,
        is_profile_complete: creator.is_profile_complete,
      };
    }

    case 'admin': {
      const admin = user.admin;
      if (!admin) {
        return { ...baseProfile, uuid: user.uuid };
      }
      return {
        ...baseProfile,
        uuid: admin.uuid,
        address: admin.formatted_location || '',
        latitude: admin.latitude,
        longitude: admin.longitude,
        professional_headline: admin.professional_headline,
        admin_verified: admin.admin_verified,
        is_profile_complete: admin.is_profile_complete,
      };
    }

    case 'organization': {
      const org = user.organization || user.organisation;
      if (!org) {
        return { ...baseProfile, uuid: user.uuid };
      }
      return {
        ...baseProfile,
        uuid: org.uuid,
        full_name: org.org_name || org.full_name || user.full_name,
        address: org.formatted_location || '',
        latitude: org.latitude,
        longitude: org.longitude,
        admin_verified: org.admin_verified,
      };
    }

    default:
      return { ...baseProfile, uuid: user.uuid };
  }
}

function DomainBadge({ domain, profile }: { domain: UserDomain; profile: SharedUserProfile }) {
  if (domain === 'instructor' && profile.admin_verified) {
    return (
      <Badge
        variant='outline'
        className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
      >
        ✓ Verified Instructor
      </Badge>
    );
  }
  if (domain === 'student' && profile.active) {
    return (
      <Badge
        variant='outline'
        className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
      >
        ✓ Active Student
      </Badge>
    );
  }
  if (domain === 'course_creator') {
    return (
      <Badge
        variant='outline'
        className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
      >
        ✓ Course Creator
      </Badge>
    );
  }
  if (domain === 'admin' && profile.admin_verified) {
    return (
      <Badge
        variant='outline'
        className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
      >
        ✓ Verified Admin
      </Badge>
    );
  }
  if (domain === 'organization' && profile.admin_verified) {
    return (
      <Badge
        variant='outline'
        className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
      >
        ✓ Verified Organization
      </Badge>
    );
  }
  return null;
}

export default function PublicUserProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const userId = params.id as string;
  const domain = (searchParams.get('domain') || 'instructor') as UserDomain;

  const {
    data: userData,
    isLoading,
    error,
  } = useQuery({
    ...getUserByUuidOptions({ path: { uuid: userId } }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: instructorData } = useQuery({
    ...searchInstructorsOptions({
      query: {
        pageable: {},
        searchParams: {
          user_uuid_eq: userId,
        },
      },
    }),
    enabled: domain === 'instructor' && !!userId,
  });
  const instructor = instructorData?.data?.content?.[0];

  const { data: creatorData } = useQuery({
    ...searchCourseCreatorsOptions({
      query: {
        pageable: {},
        searchParams: {
          user_uuid_eq: userId,
        },
      },
    }),
    enabled: domain === 'course_creator' && !!userId,
  });
  const course_creator = creatorData?.data?.content?.[0];

  const { data: studentData } = useQuery({
    ...searchStudentsOptions({
      query: {
        pageable: {},
        searchParams: {
          user_uuid_eq: userId,
        },
      },
    }),
    enabled: domain === 'student' && !!userId,
  });
  const student = studentData?.data?.content?.[0];

  const user = {
    ...userData?.data,
    student,
    instructor,
    courseCreator: course_creator,
    course_creator,
  };

  const profile = useMemo(
    () => (user ? normalisePublicProfile(user, domain) : null),
    [user, domain]
  );

  const tabs = TAB_REGISTRY[domain] || [];

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center py-20'>
        <p className='text-destructive text-sm'>Failed to load profile</p>
      </div>
    );
  }

  if (isLoading || !profile) {
    return (
      <ProfilePage tabs={tabs} profile={{ uuid: '', user_uuid: '', full_name: '' }} isLoading />
    );
  }

  return (
    <ProfilePage
      tabs={tabs}
      profile={profile}
      headerBadge={<DomainBadge domain={domain} profile={profile} />}
      isPublic={true}
    />
  );
}
