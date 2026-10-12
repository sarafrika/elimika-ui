'use client';

import { Edit2, Globe, LockIcon, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Rubric } from './rubric-chaining';

const RUBRIC_AUTHOR_ONLY = 'Only the rubric’s author can change it';
type MatrixCells = Record<string, Rubric['criteria'][number]['scoring'][number]>;

export function RubricDetails({
  rubric,
  canEdit,
  isDeleting,
  onEdit,
  onDelete,
}: {
  rubric: Rubric;
  canEdit: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { sortedLevels, sortedCriteria, matrixCells } = useMemo(() => {
    const sortedLevels = [...rubric.scoringLevels].sort((a, b) => a.level_order - b.level_order);
    const sortedCriteria = [...rubric.criteria].sort((a, b) => a.display_order - b.display_order);
    const matrixCells: MatrixCells = {};
    sortedCriteria.forEach(crit => {
      crit.scoring.forEach(cell => {
        matrixCells[`${crit.uuid}_${cell.rubric_scoring_level_uuid}`] = cell;
      });
    });
    return { sortedLevels, sortedCriteria, matrixCells };
  }, [rubric.criteria, rubric.scoringLevels]);

  return (
    <Card className='gap-0 overflow-hidden py-0'>
      {/* ── Card header ── */}
      <div className='px-6 py-5'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          {/* Left: title + meta */}
          <div className='flex flex-col gap-1.5'>
            <h1 className='text-foreground text-2xl font-bold'>
              {rubric.title || 'Untitled Rubric'}
            </h1>
            {rubric.description && (
              <p className='text-muted-foreground max-w-2xl text-sm whitespace-pre-wrap'>
                {rubric.description}
              </p>
            )}
            <div className='text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-xs'>
              {rubric.rubric_type && (
                <span className='flex items-center gap-1'>
                  <span className='bg-success h-2 w-2 rounded-full' />
                  Type: <span className='text-foreground font-medium'>{rubric.rubric_type}</span>
                </span>
              )}
              {rubric.rubric_category && (
                <span className='flex items-center gap-1'>
                  Category:{' '}
                  <span className='text-foreground font-medium'>{rubric.rubric_category}</span>
                </span>
              )}
              <span className='flex items-center gap-1'>
                {rubric.is_public ? (
                  <>
                    <Globe size={12} /> <span className='text-foreground font-medium'>Public</span>
                  </>
                ) : (
                  <>
                    <LockIcon size={12} />{' '}
                    <span className='text-foreground font-medium'>Private</span>
                  </>
                )}
              </span>
              {rubric.total_weight != null && (
                <span>
                  Weight: <span className='text-foreground font-medium'>{rubric.total_weight}</span>
                </span>
              )}
              {rubric.min_passing_score != null && (
                <span>
                  Min pass:{' '}
                  <span className='text-foreground font-medium'>{rubric.min_passing_score}</span>
                </span>
              )}
            </div>
          </div>

          {/* Right: action buttons */}
          <div className='flex shrink-0 items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onEdit()}
              disabled={!canEdit}
              title={canEdit ? undefined : RUBRIC_AUTHOR_ONLY}
              className='gap-1.5'
            >
              <Edit2 size={13} /> Edit
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onDelete()}
              disabled={isDeleting || !canEdit}
              title={canEdit ? undefined : RUBRIC_AUTHOR_ONLY}
              className='text-destructive hover:bg-destructive hover:text-destructive-foreground gap-1.5'
            >
              <Trash2 size={13} /> Delete
            </Button>
          </div>
        </div>
      </div>

      {/* ── Criteria matrix ── */}
      {sortedCriteria.length === 0 ? (
        <div className='text-muted-foreground border-t px-6 py-4 text-xs italic'>
          No criteria added yet.
        </div>
      ) : (
        <div className='overflow-x-auto border-t'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='bg-muted/40 border-b'>
                <th className='text-foreground min-w-[200px] px-4 py-2.5 text-left text-xs font-semibold'>
                  Criteria
                </th>
                {sortedLevels.map(level => (
                  <th
                    key={level.uuid}
                    className='text-foreground min-w-[130px] border-l px-3 py-2.5 text-center text-xs font-semibold'
                    style={
                      level.color_code ? { backgroundColor: level.color_code + '22' } : undefined
                    }
                  >
                    <span>{level.name || level.description}</span>
                    {level.points != null && (
                      <span className='text-muted-foreground ml-1 font-normal'>
                        ({level.points} pts)
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='divide-y'>
              {sortedCriteria.map(crit => (
                <tr key={crit.uuid} className='hover:bg-muted/20 transition-colors'>
                  {/* Criterion name */}
                  <td className='px-4 py-3 align-top'>
                    <p className='text-foreground text-xs font-medium'>{crit.component_name}</p>
                    {crit.description && (
                      <p className='text-muted-foreground mt-0.5 text-xs whitespace-pre-wrap'>
                        {crit.description}
                      </p>
                    )}
                  </td>
                  {/* Scoring cells */}
                  {sortedLevels.map(level => {
                    const cell = matrixCells[`${crit.uuid}_${level.uuid}`] ?? null;
                    return (
                      <td key={level.uuid} className='border-l px-3 py-3 align-top text-xs'>
                        {cell ? (
                          <div className='text-muted-foreground whitespace-pre-wrap'>
                            {cell.description || <span className='italic'>No description</span>}
                            {cell.score_range != null && (
                              <p className='text-foreground mt-1 font-medium'>
                                {cell.score_range} pts
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className='text-muted-foreground'>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
