'use client';

import { Sparkles } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AssessmentResultRow, AssessmentRow } from './assessment-list-data';
import { summarizeAssessmentCompetencies } from './assessment-competencies';

const derivationSteps = [
  'Assessment',
  'Assessment criteria',
  'Competencies',
  'Verified result',
  'Learner Skills',
  'Skills Wallet',
];

export function AssessmentCompetenciesTab({
  rows,
  results,
  filters,
  isLoading,
  isError,
  hasFilters,
  onRetry,
}: {
  rows: AssessmentRow[];
  results: AssessmentResultRow[];
  filters: ReactNode;
  isLoading: boolean;
  isError: boolean;
  hasFilters: boolean;
  onRetry: () => void;
}) {
  const list = useMemo(() => summarizeAssessmentCompetencies(rows, results), [rows, results]);

  return (
    <section className='min-w-0 space-y-6' aria-label='Competency records'>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm'>How competencies are derived</CardTitle>
        </CardHeader>
        <CardContent className='text-muted-foreground overflow-x-auto pb-4 text-xs'>
          <ol
            className='flex min-w-max items-center gap-2 font-medium'
            aria-label='Competency derivation'
          >
            {derivationSteps.map((step, index) => (
              <li key={step} className='flex items-center gap-2'>
                <span className='bg-muted text-foreground rounded-full border px-3 py-1'>
                  {step}
                </span>
                {index < derivationSteps.length - 1 && <span aria-hidden='true'>→</span>}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {filters}

      <p className='text-muted-foreground text-xs'>
        Assessment titles are used as competency indicators. Achieved and Not Achieved use reported
        outcomes or configured quiz pass marks. Developing includes submitted work awaiting a
        confirmed outcome. Counts represent learner assessments; a learner can appear in multiple
        assessments.
      </p>

      <div className='border-border bg-card min-w-0 overflow-hidden rounded-xl border'>
        <Table className='min-w-[860px]' aria-label='Assessment competency attainment'>
          <TableHeader>
            <TableRow>
              <TableHead>Competency</TableHead>
              <TableHead className='text-right'>Learners Assessed</TableHead>
              <TableHead className='text-right'>Achieved</TableHead>
              <TableHead className='text-right'>Developing</TableHead>
              <TableHead className='text-right'>Not Achieved</TableHead>
              <TableHead className='min-w-[160px]'>Attainment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isError ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState
                    icon={Sparkles}
                    title='Unable to load competencies'
                    description='Try again to load assessment results.'
                    action={<Button onClick={onRetry}>Try again</Button>}
                  />
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div role='status' aria-label='Loading competencies' className='space-y-3 py-3'>
                    {Array.from({ length: 3 }, (_, index) => (
                      <Skeleton key={index} className='h-12 w-full' />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ) : list.length ? (
              list.map(record => {
                const pct = record.assessed
                  ? Math.round((record.achieved / record.assessed) * 100)
                  : 0;
                return (
                  <TableRow key={record.competency}>
                    <TableCell className='max-w-72 font-medium whitespace-normal'>
                      {record.competency}
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>{record.assessed}</TableCell>
                    <TableCell className='text-success text-right tabular-nums'>
                      {record.achieved}
                    </TableCell>
                    <TableCell className='text-warning-foreground text-right tabular-nums'>
                      {record.developing}
                    </TableCell>
                    <TableCell className='text-destructive text-right tabular-nums'>
                      {record.notAchieved}
                    </TableCell>
                    <TableCell>
                      <div className='space-y-1'>
                        <span className='text-muted-foreground text-xs'>{pct}% achieved</span>
                        <Progress
                          value={pct}
                          className='h-1.5'
                          aria-label={`${record.competency}: ${pct}% achieved`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState
                    icon={Sparkles}
                    title={hasFilters ? 'No competencies match' : 'No competencies available'}
                    description={
                      hasFilters
                        ? 'Adjust the assessment filters above.'
                        : 'Competency indicators will appear when assessments are issued.'
                    }
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
