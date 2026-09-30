import type { SkillRecord } from '@/app/dashboard/student/skills-wallet/_components/SkillsWalletShared';
import type {
  CourseCreatorSkill,
  InstructorSkill,
  ProficiencyLevelEnum,
  ProficiencyLevelEnum2,
} from '@/services/client/types.gen';

// The two profile APIs use different enum casing.
export const SKILL_PROFICIENCY: ReadonlyArray<{
  label: string;
  instructor: ProficiencyLevelEnum;
  courseCreator: ProficiencyLevelEnum2;
  percentage: number;
}> = [
  { label: 'Beginner', instructor: 'BEGINNER', courseCreator: 'beginner', percentage: 25 },
  {
    label: 'Intermediate',
    instructor: 'INTERMEDIATE',
    courseCreator: 'intermediate',
    percentage: 50,
  },
  { label: 'Advanced', instructor: 'ADVANCED', courseCreator: 'advanced', percentage: 75 },
  { label: 'Expert', instructor: 'EXPERT', courseCreator: 'expert', percentage: 100 },
];

export type SkillProfileRole = 'instructor' | 'course_creator';

export function toWalletSkill(skill: InstructorSkill | CourseCreatorSkill): SkillRecord {
  const proficiency = SKILL_PROFICIENCY.find(
    option =>
      option.instructor === skill.proficiency_level ||
      option.courseCreator === skill.proficiency_level
  );
  return {
    id: skill.uuid || skill.skill_name,
    name: skill.skill_name,
    level: proficiency?.label ?? 'Unspecified',
    proficiency_pct: proficiency?.percentage ?? 0,
    category: '',
    last_used: null,
    last_assessed: skill.updated_date ? new Date(skill.updated_date).toLocaleDateString() : '—',
    icon_key: 'Sparkles',
  };
}
