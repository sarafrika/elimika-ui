'use client';

import { useInstructor } from '@/context/instructor-context';
import { useUserProfile } from '@/context/profile-context';
import { InstructorOverviewPage } from './InstructorOverviewPage';

export function InstructorOverviewRoute() {
  const instructor = useInstructor();
  const profile = useUserProfile();

  const fullName =
    instructor?.full_name ||
    profile?.instructor?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.full_name ||
    'Emma';

  const firstName = fullName.split(' ')[0] || 'Emma';

  return <InstructorOverviewPage firstName={firstName} />;
}
