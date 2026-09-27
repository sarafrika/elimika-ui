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

export function EvaluationRubricPreview({ rubricUuid }: { rubricUuid: string }) {
  const query = useQuery({
    ...getRubricMatrixOptions({ path: { rubricUuid } }),
    enabled: Boolean(rubricUuid),
    staleTime: STALE_TIMES.entity,
  });
  if (query.isLoading) return <Skeleton className='h-64 w-full' />;
  if (query.isError || query.data?.error || query.data?.success === false) {
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
  const matrix = query.data?.data;
  if (!matrix) return <EmptyState title='Rubric unavailable' />;
  const criteria = [...matrix.criteria].sort((a, b) => a.display_order - b.display_order);
  const levels = [...matrix.scoring_levels].sort((a, b) => a.level_order - b.level_order);

  return (
    <div className='space-y-4'>
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
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='min-w-48'>Criteria</TableHead>
              {levels.map(level => (
                <TableHead
                  key={level.uuid ?? level.level_order}
                  className='min-w-40 whitespace-normal'
                >
                  {level.name}
                  <span className='text-muted-foreground block text-xs'>{level.points} points</span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {criteria.map(criterion => (
              <TableRow key={criterion.uuid ?? criterion.display_order}>
                <TableCell className='align-top whitespace-normal'>
                  <p className='font-medium'>{criterion.component_name}</p>
                  {criterion.description && (
                    <p className='text-muted-foreground mt-1 text-xs'>{criterion.description}</p>
                  )}
                </TableCell>
                {levels.map(level => (
                  <TableCell
                    key={level.uuid ?? level.level_order}
                    className='align-top whitespace-normal'
                  >
                    {matrix.matrix_cells[`${criterion.uuid}_${level.uuid}`]?.description ||
                      'No description'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
