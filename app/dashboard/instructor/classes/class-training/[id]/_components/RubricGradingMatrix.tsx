'use client';

import { CheckCircle2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { calculateRubricGrade, type RubricGradeSelections } from '@/lib/rubric-grading';

// ════════════════════════════════════════════════════════════════════════
// Types — shaped to match the rubricMatrices[uuid] object as it comes back
// from the API (rubric + criteria[] + scoring_levels[] + matrix_cells{}).
// ════════════════════════════════════════════════════════════════════════

type RubricCriteria = {
  uuid: string;
  component_name: string;
  description?: string | null;
  criteria_number?: string;
  display_order?: number;
  is_primary_criteria?: boolean;
  weight_suggestion?: string | null;
  criteria_category?: string;
};

type RubricScoringLevel = {
  uuid: string;
  name: string;
  display_name?: string;
  description?: string | null;
  performance_indicator?: string | null;
  points: number;
  level_order?: number;
  is_passing?: boolean;
  is_highest_level?: boolean;
  css_color_class?: string | null;
  color_code?: string | null;
};

type RubricMatrixCell = {
  criteria_uuid?: string;
  scoring_level_uuid?: string;
  description?: string | null;
  [key: string]: unknown;
};

type RubricInfo = {
  uuid: string;
  title: string;
  description?: string | null;
  max_score?: number;
  min_passing_score?: number;
  status?: string;
  rubric_type?: string;
  rubric_category?: string;
  weight_unit?: string;
  total_weight?: number;
};

type RubricMatrix = {
  rubric: RubricInfo;
  criteria: RubricCriteria[];
  scoring_levels: RubricScoringLevel[];
  matrix_cells: Record<string, RubricMatrixCell>;
  matrix_statistics?: {
    total_cells?: number;
    completed_cells?: number;
    completion_percentage?: number;
    max_possible_score?: number;
    weighted_max_score?: number;
  };
  expected_cell_count?: number;
  is_complete?: boolean;
};

const cellKey = (criteriaUuid: string, levelUuid: string) => `${criteriaUuid}_${levelUuid}`;

// Map a level's css_color_class / color_code to a safe, theme-friendly
// accent. Falls back to primary if the rubric didn't define a color.
// Labels keep the body text colour, hovered or not: the outline button's hover text is white, which
// vanished on these light cells, and brand-coloured text was too faint. Border, ring and tick mark the pick.
function getLevelAccentClasses(level: RubricScoringLevel, isSelected: boolean) {
  if (isSelected) {
    if (level.is_passing === false) {
      return 'border-destructive bg-destructive/10 text-foreground hover:bg-destructive/10 hover:text-foreground ring-1 ring-destructive/40';
    }
    return 'border-primary bg-primary/10 text-foreground hover:bg-primary/10 hover:text-foreground ring-1 ring-primary/40';
  }
  return 'border-border/70 bg-background text-foreground hover:border-primary/40 hover:bg-muted/50 hover:text-foreground';
}

// ════════════════════════════════════════════════════════════════════════
// Grading matrix: rows = criteria, columns = scoring levels.
// Click a cell to select that level for that row. Controlled component —
// pass `selections` + `onChange` from the parent (e.g. per-student grading
// state) so scores can be saved/submitted alongside the rest of the form.
// ════════════════════════════════════════════════════════════════════════

export function RubricGradingMatrix({
  matrix,
  selections,
  onChange,
  readOnly = false,
  showScoreSummary = true,
}: {
  matrix: RubricMatrix;
  selections: RubricGradeSelections;
  onChange?: (criteriaUuid: string, levelUuid: string) => void;
  readOnly?: boolean;
  showScoreSummary?: boolean;
}) {
  const sortedCriteria = useMemo(
    () => [...matrix.criteria].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    [matrix.criteria]
  );

  const sortedLevels = useMemo(
    () =>
      [...matrix.scoring_levels].sort(
        (a, b) => (b.points ?? 0) - (a.points ?? 0) // highest points first, left to right
      ),
    [matrix.scoring_levels]
  );

  const grade = useMemo(
    () => calculateRubricGrade(matrix, selections),
    [matrix, selections]
  );
  const { totalScore, maxScore, percentage, allRowsGraded } = grade;
  const rubricScore =
    grade.rawMaximum > 0
      ? (grade.rawScore / grade.rawMaximum) * (matrix.rubric.max_score ?? maxScore)
      : 0;
  const isPassing = rubricScore >= (matrix.rubric.min_passing_score ?? 0);

  if (sortedCriteria.length === 0 || sortedLevels.length === 0) {
    return (
      <p className='text-muted-foreground text-xs'>
        This rubric has no criteria or scoring levels configured yet.
      </p>
    );
  }

  return (
    <div className='space-y-3'>
      {/* ── Score summary ── */}
      {showScoreSummary && (
        <div
          className='border-border/70 bg-muted/30 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2'
          aria-live='polite'
        >
          <div className='flex items-center gap-2'>
            <span className='text-foreground text-sm font-semibold'>
              {totalScore} / {maxScore} pts
            </span>
            <span className='text-muted-foreground text-xs'>({percentage}%)</span>
          </div>

          {allRowsGraded ? (
            <Badge variant={isPassing ? 'success' : 'destructive'}>
              {isPassing ? 'Passing' : 'Below passing'}
            </Badge>
          ) : (
            <span className='text-muted-foreground text-[11px]'>
              {grade.gradedCriteria}/{sortedCriteria.length} criteria graded
            </span>
          )}
        </div>
      )}

      {/* ── Grading grid ── */}
      <div className='w-full max-w-full overflow-x-auto overflow-y-hidden'>
        <div className='min-w-max'>
          <table className='min-w-max border-collapse text-left'>
            <thead>
              <tr className='bg-muted/40'>
                <th className='border-border/70 bg-muted/40 text-foreground sticky left-0 z-10 min-w-[180px] border-b px-3 py-2 text-xs font-semibold'>
                  Criteria
                </th>
                {sortedLevels.map(level => (
                  <th
                    key={level.uuid}
                    className='border-border/70 text-foreground border-b px-3 py-2 text-xs font-semibold'
                  >
                    {/* Only the level's description heads its column; the cells below carry its points. */}
                    <span
                      data-part='level-description'
                      className='block max-w-[220px] min-w-[140px] text-[11px] leading-snug font-medium'
                    >
                      {level.description || level.performance_indicator || level.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sortedCriteria.map((criteria, rowIdx) => {
                const selectedLevelUuid = selections[criteria.uuid];

                return (
                  <tr key={criteria.uuid} className={rowIdx % 2 === 1 ? 'bg-muted/10' : undefined}>
                    <td className='border-border/50 bg-background sticky left-0 z-10 min-w-[180px] border-b px-3 py-2 align-top'>
                      <p className='text-foreground text-xs font-medium'>
                        {criteria.component_name}
                      </p>
                      {criteria.description ? (
                        <p className='text-muted-foreground mt-0.5 text-[11px]'>
                          {criteria.description}
                        </p>
                      ) : null}
                      {criteria.weight_suggestion ? (
                        <span className='text-muted-foreground mt-1 inline-block text-[10px] italic'>
                          {criteria.weight_suggestion}
                        </span>
                      ) : null}
                    </td>

                    {sortedLevels.map(level => {
                      const cell = matrix.matrix_cells[cellKey(criteria.uuid, level.uuid)];
                      const isSelected = selectedLevelUuid === level.uuid;

                      return (
                        <td
                          key={level.uuid}
                          className='border-border/50 h-px border-b px-2 py-2 align-top'
                        >
                          <Button
                            type='button'
                            variant='outline'
                            disabled={readOnly}
                            onClick={() => !readOnly && onChange?.(criteria.uuid, level.uuid)}
                            aria-pressed={isSelected}
                            aria-label={`${criteria.component_name}: ${level.name}, ${level.points} points`}
                            title={cell?.description || undefined}
                            className={`relative flex h-full min-h-14 w-full items-center justify-center gap-1 px-2.5 py-2 transition disabled:cursor-default ${getLevelAccentClasses(level, isSelected)}`}
                          >
                            {isSelected ? (
                              <CheckCircle2
                                aria-hidden
                                className={`absolute top-1.5 right-1.5 h-3.5 w-3.5 ${level.is_passing === false ? 'text-destructive' : 'text-primary'}`}
                              />
                            ) : null}
                            <span data-part='points' className='text-2xl leading-none font-bold'>
                              {level.points}
                            </span>
                            <span className='text-muted-foreground text-[10px]'>pts</span>
                          </Button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Compact read-only preview (used where the full grading grid is too much
// — e.g. inside the assessment list before an instructor opens grading).
// Keeps the original "rubric attached" summary but adds scoring levels.
// ════════════════════════════════════════════════════════════════════════

export function RubricSummaryPreview({ matrix }: { matrix: RubricMatrix }) {
  const sortedLevels = useMemo(
    () => [...matrix.scoring_levels].sort((a, b) => (b.points ?? 0) - (a.points ?? 0)),
    [matrix.scoring_levels]
  );

  return (
    <div className='space-y-2'>
      <p className='text-muted-foreground text-xs'>
        {matrix.criteria.length} criteria · {matrix.scoring_levels.length} scoring levels
      </p>

      <div className='flex flex-wrap gap-1.5'>
        {sortedLevels.map(level => (
          <span
            key={level.uuid}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
              level.is_passing === false
                ? 'border-destructive/30 bg-destructive/5 text-destructive'
                : 'border-primary/20 bg-primary/5 text-primary'
            }`}
          >
            {level.name}
            <span className='text-muted-foreground'>{level.points}pts</span>
          </span>
        ))}
      </div>

      <div className='space-y-1.5'>
        {[...matrix.criteria]
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
          .slice(0, 3)
          .map(criteria => (
            <div key={criteria.uuid}>
              <p className='text-xs font-medium'>{criteria.component_name}</p>
              <p className='text-muted-foreground text-[11px]'>
                {criteria.description || criteria.weight_suggestion || 'Criteria'}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Hook: simple controlled-selections state for one assessment's rubric.
// Optional convenience — parents can also manage selections themselves
// (e.g. as part of a larger per-student grading form) and skip this.
// ════════════════════════════════════════════════════════════════════════

export function useRubricGradeSelections(initial: RubricGradeSelections = {}) {
  const [selections, setSelections] = useState<RubricGradeSelections>(initial);

  const setSelection = (criteriaUuid: string, levelUuid: string) => {
    setSelections(prev => ({ ...prev, [criteriaUuid]: levelUuid }));
  };

  const reset = (next: RubricGradeSelections = {}) => setSelections(next);

  return { selections, setSelection, reset };
}
