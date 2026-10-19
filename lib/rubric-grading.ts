export type RubricGradeSelections = Record<string, string>;

type ScoringMatrix = {
  criteria: ReadonlyArray<{ uuid?: string }>;
  scoring_levels: ReadonlyArray<{ uuid?: string; points: number }>;
};

/** Each criterion contributes its selected level's points, scaled to the task maximum. */
export function calculateRubricGrade(
  matrix: ScoringMatrix,
  selections: RubricGradeSelections,
  maximum?: number
) {
  const { criteria, scoring_levels: levels } = matrix;
  const validLevels = levels.filter(level => Number.isFinite(level.points) && level.points >= 0);
  const highestPoints = validLevels.reduce((highest, level) => Math.max(highest, level.points), 0);
  const rawMaximum = highestPoints * criteria.length;
  const maxScore = maximum ?? rawMaximum;
  const isValid =
    criteria.length > 0 &&
    criteria.every(criterion => Boolean(criterion.uuid)) &&
    new Set(criteria.map(criterion => criterion.uuid)).size === criteria.length &&
    levels.length > 0 &&
    levels.length === validLevels.length &&
    levels.every(level => Boolean(level.uuid)) &&
    new Set(levels.map(level => level.uuid)).size === levels.length &&
    Number.isFinite(rawMaximum) &&
    rawMaximum > 0 &&
    Number.isFinite(maxScore) &&
    maxScore > 0;
  let rawScore = 0;
  let gradedCriteria = 0;
  for (const criterion of criteria) {
    const levelId = criterion.uuid ? selections[criterion.uuid] : undefined;
    const level = levelId ? validLevels.find(item => item.uuid === levelId) : undefined;
    if (level) {
      rawScore += level.points;
      gradedCriteria += 1;
    }
  }
  const ratio = isValid ? rawScore / rawMaximum : 0;
  return {
    isValid,
    rawScore,
    rawMaximum,
    maxScore,
    // Preserve fractional points while keeping floating-point artifacts out of saved grades.
    totalScore: isValid ? Math.min(maxScore, Math.round(ratio * maxScore * 100) / 100) : 0,
    percentage: Math.round(ratio * 100),
    gradedCriteria,
    allRowsGraded: isValid && gradedCriteria === criteria.length,
  };
}
