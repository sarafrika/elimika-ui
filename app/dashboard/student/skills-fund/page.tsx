'use client';

import { useUserProfile } from '@/context/profile-context';
import { useStudent } from '@/context/student-context';
import { SkillsFundHubPage } from '@/src/features/dashboard/skills-fund/SkillsFundHubPage';

export default function StudentSkillsFundPage() {
  const student = useStudent();
  const profile = useUserProfile();

  const profileName =
    student?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.full_name ||
    'Sarah Otieno';

  return <SkillsFundHubPage role='student' profileName={profileName} />;
}
