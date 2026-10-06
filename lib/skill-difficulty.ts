import { ProficiencyLevelEnum, type DifficultyLevel } from '@/services/client/types.gen';

export function toSkillProficiency(value: string | undefined): ProficiencyLevelEnum | undefined {
  const normalized = value?.trim().toLowerCase();
  return Object.values(ProficiencyLevelEnum).find(level => level === normalized);
}

// Skill endpoints accept proficiency names, while course difficulty accepts UUIDs.
export function skillDifficultyOptions(levels: readonly DifficultyLevel[]) {
  const seen = new Set<ProficiencyLevelEnum>();
  return [...levels]
    .sort((a, b) => a.level_order - b.level_order)
    .flatMap(level => {
      const value = toSkillProficiency(level.name);
      if (!value || seen.has(value)) return [];
      seen.add(value);
      return [{ value, label: level.display_name || level.name }];
    });
}
