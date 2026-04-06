'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import type { UserProfileType } from '@/lib/types';
import type { CourseCreator, Organisation, Student } from '@/services/client/types.gen';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { creatorTabs } from './course-creator-tab';
import { instructorTabs } from './instructors-tab';
import { ProfilePage } from './profile-page';
import { studentTabs } from './students-tab';
import type { SharedUserProfile, TabDefinition, UserDomain } from './types';

const TAB_REGISTRY: Record<UserDomain, TabDefinition[]> = {
  instructor: instructorTabs,
  course_creator: creatorTabs,
  student: studentTabs,
  admin: instructorTabs, // placeholder — create adminTabs when ready
  organization: instructorTabs, // placeholder — create organisationTabs when ready
};

function normalizeDob(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return undefined;
}

type UserProfileContextValue = ReturnType<typeof useUserProfile>;
type LocationProfileFields = {
  formatted_location?: string;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

type StudentProfile = Student &
  LocationProfileFields & {
    professional_headline?: string;
    admin_verified?: boolean;
    is_profile_complete?: boolean;
  };

type AdminProfile = LocationProfileFields & {
  uuid?: string;
  user_uuid?: string;
  full_name?: string;
  professional_headline?: string;
  admin_verified?: boolean;
  is_profile_complete?: boolean;
};

type OrganizationProfile = Organisation & {
  user_uuid?: string;
  org_name?: string;
  full_name?: string;
  formatted_location?: string;
};

type RawProfileUser = UserProfileType & {
  avatar_url?: string;
  admin?: AdminProfile;
  organization?: OrganizationProfile;
  student?: StudentProfile;
  courseCreator?: CourseCreator & LocationProfileFields;
  organizations?: OrganizationProfile[];
};

function getLocationProfileFields(value: unknown): LocationProfileFields | null {
  return value && typeof value === 'object' ? (value as LocationProfileFields) : null;
}

// Profile normaliser
function normaliseProfile(
  domain: UserDomain,
  user: ReturnType<typeof useUserProfile>
): SharedUserProfile | null {
  const rawUser = user as Partial<RawProfileUser> | null;

  switch (domain) {
    case 'instructor': {
      const p = rawUser?.instructor;

      if (!p) return null;
      return {
        uuid: p.uuid ?? rawUser?.uuid ?? '',
        active: rawUser?.active,
        user_uuid: p.user_uuid ?? rawUser?.uuid ?? '',
        full_name: p.full_name ?? rawUser?.full_name ?? '',
        email: rawUser?.email,
        phone: rawUser?.phone_number,
        website: p.website,
        dob: normalizeDob(rawUser?.dob),
        bio: p.bio,
        avatar_url: rawUser?.profile_image_url,
        profile_image_url: rawUser?.profile_image_url,
        is_online: true,
        address: p.formatted_location,
        latitude: p.latitude,
        longitude: p.longitude,
        professional_headline: p.professional_headline,
        admin_verified: p.admin_verified,
        is_profile_complete: p.is_profile_complete,
        gender: rawUser?.gender,
        user_no: rawUser?.user_no,
      };
    }

    case 'student': {
      const p = rawUser?.student;

      if (!p) return null;
      return {
        uuid: p.uuid ?? rawUser?.uuid ?? '',
        active: rawUser?.active,
        user_uuid: p.user_uuid ?? rawUser?.uuid ?? '',
        full_name: p.full_name ?? rawUser?.full_name ?? '',
        email: rawUser?.email,
        phone: rawUser?.phone_number,
        dob: normalizeDob(rawUser?.dob),
        avatar_url: rawUser?.avatar_url ?? rawUser?.profile_image_url,
        profile_image_url: rawUser?.profile_image_url,
        is_online: false,
        address: p.formatted_location || p.address || '',
        latitude: p.latitude,
        longitude: p.longitude,
        bio: p.bio,
        professional_headline: p.professional_headline,
        admin_verified: p.admin_verified,
        is_profile_complete: p.is_profile_complete,
        gender: rawUser?.gender,
        student_profile: p,
        user_no: rawUser?.user_no,
        demographic_tag: p.demographic_tag,
      };
    }

    case 'admin': {
      const p = rawUser?.admin;
      if (!p) return null;
      return {
        uuid: p.uuid ?? rawUser?.uuid ?? '',
        active: rawUser?.active,
        user_uuid: p.user_uuid ?? rawUser?.uuid ?? '',
        full_name: p.full_name ?? rawUser?.full_name ?? '',
        email: rawUser?.email,
        phone: rawUser?.phone_number,
        avatar_url: rawUser?.avatar_url ?? rawUser?.profile_image_url,
        profile_image_url: rawUser?.profile_image_url,
        address: p.formatted_location || '',
        latitude: p.latitude,
        longitude: p.longitude,
        professional_headline: p.professional_headline,
        admin_verified: p.admin_verified,
        is_profile_complete: p.is_profile_complete,
        gender: rawUser?.gender,
        user_no: rawUser?.user_no,
      };
    }

    case 'course_creator': {
      const p = rawUser?.courseCreator;
      const location = getLocationProfileFields(p);

      if (!p) return null;
      return {
        uuid: p.uuid ?? rawUser?.uuid ?? '',
        active: rawUser?.active,
        user_uuid: p.user_uuid ?? rawUser?.uuid ?? '',
        full_name: p.full_name ?? rawUser?.full_name ?? '',
        email: rawUser?.email,
        phone: rawUser?.phone_number,
        avatar_url: rawUser?.profile_image_url,
        bio: p.bio,
        dob: normalizeDob(rawUser?.dob),
        address: location?.formatted_location || location?.location || location?.address || '',
        latitude: location?.latitude,
        longitude: location?.longitude,
        profile_image_url: rawUser?.profile_image_url,
        username: rawUser?.username,
        website: p.website,
        professional_headline: p.professional_headline,
        is_profile_complete: p.is_profile_complete,
        is_online: true,
        gender: rawUser?.gender,
        user_no: rawUser?.user_no,
      };
    }

    case 'organization': {
      const organizations = rawUser?.organizations;
      const p = Array.isArray(organizations) ? organizations[0] : rawUser?.organization;
      if (!p) return null;
      return {
        uuid: p.uuid ?? rawUser?.uuid ?? '',
        active: rawUser?.active,
        user_uuid: p.user_uuid ?? rawUser?.uuid ?? '',
        full_name: p.org_name ?? p.full_name ?? '',
        email: rawUser?.email,
        dob: normalizeDob(rawUser?.dob),
        phone: rawUser?.phone_number,
        avatar_url: rawUser?.avatar_url ?? rawUser?.profile_image_url,
        address: p.formatted_location || '',
        gender: rawUser?.gender,
        user_no: rawUser?.user_no,
      };
    }
  }
}

function DomainBadge({
  domain,
  user,
}: {
  domain: UserDomain;
  user: ReturnType<typeof useUserProfile>;
}) {
  const rawUser = user as Partial<RawProfileUser> | null;

  if (domain === 'instructor' && user?.instructor?.admin_verified) {
    return (
      <Badge
        variant='outline'
        className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
      >
        ✓ Verified Instructor
      </Badge>
    );
  }
  if (domain === 'admin' && rawUser?.admin?.admin_verified) {
    return (
      <Badge
        variant='outline'
        className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
      >
        ✓ Verified Admin
      </Badge>
    );
  }
  if (domain === 'course_creator') {
    return (
      <Badge
        variant='outline'
        className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
      >
        ✓ Verified Course Creator
      </Badge>
    );
  }
  if (domain === 'student' && user?.active) {
    return (
      <Badge
        variant='outline'
        className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
      >
        ✓ Active Student
      </Badge>
    );
  }
  const organizationRecord = Array.isArray(rawUser?.organizations)
    ? rawUser.organizations[0]
    : rawUser?.organization;
  if (domain === 'organization' && organizationRecord?.admin_verified) {
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

export default function UserProfilePage() {
  const user = useUserProfile();
  const userDomain = useUserDomain();

  const domain = userDomain?.activeDomain as UserDomain | undefined;

  const profile = useMemo(() => (domain ? normaliseProfile(domain, user) : null), [domain, user]);

  const tabs = domain && TAB_REGISTRY[domain] ? TAB_REGISTRY[domain] : [];

  if (!domain) {
    return null;
  }

  if (!profile) {
    return (
      <ProfilePage tabs={tabs} profile={{ uuid: '', user_uuid: '', full_name: '' }} isLoading />
    );
  }

  return (
    <ProfilePage
      tabs={tabs}
      profile={profile}
      domain={domain}
      profileSource={user}
      headerBadge={<DomainBadge domain={domain} user={user} />}
    />
  );
}
