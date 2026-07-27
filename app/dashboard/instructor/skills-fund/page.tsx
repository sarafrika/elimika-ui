'use client';

import { useInstructor } from '@/context/instructor-context';
import { useUserProfile } from '@/context/profile-context';
import { SkillsFundHubPage } from '@/src/features/dashboard/skills-fund/SkillsFundHubPage';

export default function InstructorSkillsFundPage() {
  const instructor = useInstructor();
  const profile = useUserProfile();

  const profileName =
    instructor?.full_name ||
    profile?.instructor?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.full_name ||
    'Sarah Otieno';

  return <SkillsFundHubPage role='instructor' profileName={profileName} />;
}
