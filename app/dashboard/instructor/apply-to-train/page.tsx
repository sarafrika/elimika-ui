import { redirect } from 'next/navigation';
import {
  skillsMatchesHref,
  type SkillsMatchSearchParams,
} from '@/src/features/dashboard/lib/skills-matches-url';

export default async function InstructorApplyToTrainPage({
  searchParams,
}: {
  searchParams: Promise<SkillsMatchSearchParams>;
}) {
  redirect(skillsMatchesHref('apply-to-train', await searchParams));
}
