'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { STALE_TIMES } from '@/lib/query-client';
import { getRubricMatrixOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export function EvaluationRubricPreview({ rubricUuid }: { rubricUuid: string }) {
  const query = useQuery({
    ...getRubricMatrixOptions({ path: { rubricUuid } }),
    enabled: Boolean(rubricUuid),
    staleTime: STALE_TIMES.entity,
  });
  const failed = query.isError || Boolean(query.data?.error) || query.data?.success === false;
  const matrix = failed ? undefined : query.data?.data;
  const criteria = useMemo(
    () => [...(matrix?.criteria ?? [])].sort((a, b) => a.display_order - b.display_order),
    [matrix?.criteria]
  );
  const levels = useMemo(
    () => [...(matrix?.scoring_levels ?? [])].sort((a, b) => a.level_order - b.level_order),
    [matrix?.scoring_levels]
  );
  if (query.isLoading) return <Skeleton className='h-64 w-full' />;
  if (failed) {
    return (
      <EmptyState
        title='Could not load this rubric'
        description='Try loading the rubric again.'
        action={
          <Button type='button' variant='outline' onClick={() => void query.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }
  if (!matrix) return <EmptyState title='Rubric unavailable' />;

  return (
    <div className='min-w-0 space-y-4'>
      <div className='space-y-2'>
        <h3 className='text-lg font-semibold'>{matrix.rubric.title}</h3>
        {matrix.rubric.description && (
          <p className='text-muted-foreground text-sm'>{matrix.rubric.description}</p>
        )}
        <div className='flex flex-wrap gap-2'>
          <Badge variant='secondary'>{matrix.rubric.rubric_type}</Badge>
          {matrix.rubric.max_score != null && (
            <Badge variant='outline'>Max score: {matrix.rubric.max_score}</Badge>
          )}
          {matrix.rubric.min_passing_score != null && (
            <Badge variant='outline'>Pass score: {matrix.rubric.min_passing_score}</Badge>
          )}
        </div>
      </div>
      {criteria.length === 0 ? (
        <EmptyState
          variant='compact'
          title='No criteria yet'
          description='This rubric has no evaluation criteria.'
        />
      ) : levels.length === 0 ? (
        <EmptyState
          variant='compact'
          title='No scoring levels yet'
          description='This rubric has no scoring levels to display in its matrix.'
        />
      ) : (
        <div className='overflow-hidden rounded-lg border'>
          <Table aria-label={`${matrix.rubric.title} scoring matrix`}>
            <TableHeader className='bg-muted/40'>
              <TableRow className='hover:bg-transparent'>
                <TableHead scope='col' className='min-w-48 border-r p-3'>
                  Criteria
                </TableHead>
                {levels.map(level => (
                  <TableHead
                    key={level.uuid ?? level.level_order}
                    scope='col'
                    className='min-w-40 border-r p-3 align-top whitespace-normal last:border-r-0'
                  >
                    {level.name}
                    <span className='text-muted-foreground block text-xs'>
                      {level.points} points
                    </span>
                    {level.description && (
                      <p className='text-muted-foreground mt-1 text-xs font-normal whitespace-pre-wrap'>
                        {level.description}
                      </p>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {criteria.map(criterion => (
                <TableRow
                  key={criterion.uuid ?? criterion.display_order}
                  className='hover:bg-transparent'
                >
                  <TableHead scope='row' className='border-r p-3 align-top whitespace-normal'>
                    <p className='font-medium'>{criterion.component_name}</p>
                    {criterion.description && (
                      <p className='text-muted-foreground mt-1 text-xs'>{criterion.description}</p>
                    )}
                  </TableHead>
                  {levels.map(level => (
                    <TableCell
                      key={level.uuid ?? level.level_order}
                      className='border-r p-3 align-top whitespace-pre-wrap last:border-r-0'
                    >
                      {matrix.matrix_cells[`${criterion.uuid}_${level.uuid}`]?.description ||
                        'No description'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
