import type { ProficiencyLevelEnum, ProficiencyLevelEnum2 } from '@/services/client/types.gen';

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
