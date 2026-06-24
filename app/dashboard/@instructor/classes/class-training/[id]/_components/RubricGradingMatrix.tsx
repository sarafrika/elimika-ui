"use client";

import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { useMemo, useState } from 'react';

// ════════════════════════════════════════════════════════════════════════
// Types — shaped to match the rubricMatrices[uuid] object as it comes back
// from the API (rubric + criteria[] + scoring_levels[] + matrix_cells{}).
// ════════════════════════════════════════════════════════════════════════

export type RubricCriteria = {
    uuid: string;
    component_name: string;
    description?: string | null;
    criteria_number?: string;
    display_order?: number;
    is_primary_criteria?: boolean;
    weight_suggestion?: string | null;
    criteria_category?: string;
};

export type RubricScoringLevel = {
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

export type RubricMatrixCell = {
    criteria_uuid?: string;
    scoring_level_uuid?: string;
    description?: string | null;
    [key: string]: unknown;
};

export type RubricInfo = {
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

export type RubricMatrix = {
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

// Selections the instructor has made so far: one chosen scoring-level uuid
// per criteria uuid. Lives in the parent (e.g. per-student grading state)
// so it can be persisted/submitted; this component is controlled.
export type RubricGradeSelections = Record<string, string>;

const cellKey = (criteriaUuid: string, levelUuid: string) => `${criteriaUuid}_${levelUuid}`;

// Map a level's css_color_class / color_code to a safe, theme-friendly
// accent. Falls back to primary if the rubric didn't define a color.
function getLevelAccentClasses(level: RubricScoringLevel, isSelected: boolean) {
    if (isSelected) {
        if (level.is_passing === false) {
            return 'border-destructive bg-destructive/10 text-destructive ring-1 ring-destructive/40';
        }
        return 'border-primary bg-primary/10 text-primary ring-1 ring-primary/40';
    }
    return 'border-border/70 bg-background hover:border-primary/40 hover:bg-muted/50';
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
}: {
    matrix: RubricMatrix;
    selections: RubricGradeSelections;
    onChange?: (criteriaUuid: string, levelUuid: string) => void;
    readOnly?: boolean;
}) {
    const sortedCriteria = useMemo(
        () =>
            [...matrix.criteria].sort(
                (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
            ),
        [matrix.criteria]
    );

    const sortedLevels = useMemo(
        () =>
            [...matrix.scoring_levels].sort(
                (a, b) => (b.points ?? 0) - (a.points ?? 0) // highest points first, left to right
            ),
        [matrix.scoring_levels]
    );

    const { totalScore, maxScore, percentage, isPassing } = useMemo(() => {
        let earned = 0;
        let possible = 0;

        sortedCriteria.forEach(criteria => {
            const levelUuid = selections[criteria.uuid];
            const level = sortedLevels.find(l => l.uuid === levelUuid);
            possible += sortedLevels[0]?.points ?? 0; // top level = max points per criterion
            if (level) earned += level.points;
        });

        const pct = possible > 0 ? Math.round((earned / possible) * 100) : 0;
        const passingThreshold = matrix.rubric.min_passing_score ?? 0;
        const scaledMax = matrix.rubric.max_score ?? possible;
        const scaledEarned = possible > 0 ? (earned / possible) * scaledMax : 0;

        return {
            totalScore: Math.round(scaledEarned),
            maxScore: scaledMax,
            percentage: pct,
            isPassing: scaledEarned >= passingThreshold,
        };
    }, [selections, sortedCriteria, sortedLevels, matrix.rubric.min_passing_score, matrix.rubric.max_score]);

    const allRowsGraded = sortedCriteria.every(c => !!selections[c.uuid]);

    if (sortedCriteria.length === 0 || sortedLevels.length === 0) {
        return (
            <p className="text-muted-foreground text-xs">
                This rubric has no criteria or scoring levels configured yet.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {/* ── Score summary ── */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                        {totalScore} / {maxScore} pts
                    </span>
                    <span className="text-muted-foreground text-xs">({percentage}%)</span>
                </div>

                {allRowsGraded ? (
                    <Badge variant={isPassing ? 'success' : 'destructive'}>
                        {isPassing ? 'Passing' : 'Below passing'}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground text-[11px]">
                        {sortedCriteria.filter(c => selections[c.uuid]).length}/{sortedCriteria.length} criteria graded
                    </span>
                )}
            </div>

            {/* ── Grading grid ── */}
            <div className="w-full overflow-x-auto">
                <div className="min-w-[640px]">
                    <table className="w-full min-w-[640px] border-collapse text-left">
                        <thead>
                            <tr className="bg-muted/40">
                                <th className="sticky left-0 z-10 min-w-[180px] border-b border-border/70 bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground">
                                    Criteria
                                </th>
                                {sortedLevels.map(level => (
                                    <th
                                        key={level.uuid}
                                        className="border-b border-border/70 px-3 py-2 text-xs font-semibold text-foreground"
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <span>{level.name}</span>
                                            <span className="text-muted-foreground text-[10px] font-normal">
                                                {level.points} pts
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {sortedCriteria.map((criteria, rowIdx) => {
                                const selectedLevelUuid = selections[criteria.uuid];

                                return (
                                    <tr
                                        key={criteria.uuid}
                                        className={rowIdx % 2 === 1 ? 'bg-muted/10' : undefined}
                                    >
                                        <td className="sticky left-0 z-10 min-w-[180px] border-b border-border/50 bg-background px-3 py-2 align-top">
                                            <p className="text-xs font-medium text-foreground">{criteria.component_name}</p>
                                            {criteria.description ? (
                                                <p className="text-muted-foreground mt-0.5 text-[11px]">{criteria.description}</p>
                                            ) : null}
                                            {criteria.weight_suggestion ? (
                                                <span className="text-muted-foreground mt-1 inline-block text-[10px] italic">
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
                                                    className="border-b border-border/50 px-2 py-2 align-top"
                                                >
                                                    <button
                                                        type="button"
                                                        disabled={readOnly}
                                                        onClick={() => !readOnly && onChange?.(criteria.uuid, level.uuid)}
                                                        aria-pressed={isSelected}
                                                        className={`flex w-full flex-col items-start gap-1 rounded-md border px-2.5 py-2 text-left text-[11px] transition disabled:cursor-default ${getLevelAccentClasses(level, isSelected)}`}
                                                    >
                                                        <span className="flex w-full items-center justify-between gap-1">
                                                            <span className="font-medium">
                                                                {level.performance_indicator || level.name}
                                                            </span>
                                                            {isSelected ? (
                                                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                                            ) : null}
                                                        </span>
                                                        {cell?.description ? (
                                                            <span className="text-muted-foreground leading-snug">
                                                                {cell.description}
                                                            </span>
                                                        ) : null}
                                                    </button>
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
        <div className="space-y-2">
            <p className="text-muted-foreground text-xs">
                {matrix.criteria.length} criteria · {matrix.scoring_levels.length} scoring levels
            </p>

            <div className="flex flex-wrap gap-1.5">
                {sortedLevels.map(level => (
                    <span
                        key={level.uuid}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${level.is_passing === false
                            ? 'border-destructive/30 bg-destructive/5 text-destructive'
                            : 'border-primary/20 bg-primary/5 text-primary'
                            }`}
                    >
                        {level.name}
                        <span className="text-muted-foreground">{level.points}pts</span>
                    </span>
                ))}
            </div>

            <div className="space-y-1.5">
                {[...matrix.criteria]
                    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                    .slice(0, 3)
                    .map(criteria => (
                        <div key={criteria.uuid}>
                            <p className="text-xs font-medium">{criteria.component_name}</p>
                            <p className="text-muted-foreground text-[11px]">
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