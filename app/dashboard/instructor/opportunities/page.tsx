import { redirect } from 'next/navigation';
import {
  skillsMatchesHref,
  type SkillsMatchSearchParams,
} from '@/src/features/dashboard/lib/skills-matches-url';

export default async function InstructorFindWorkPage({
  searchParams,
}: {
  searchParams: Promise<SkillsMatchSearchParams>;
}) {
  redirect(skillsMatchesHref('jobs', await searchParams));
}
