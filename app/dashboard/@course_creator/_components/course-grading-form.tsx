'use client';

import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import Spinner from '../../../../components/ui/spinner';
import { Switch } from '../../../../components/ui/switch';
import { getCourseAssessmentsOptions } from '../../../../services/client/@tanstack/react-query.gen';

type CourseGradingFormProps = {
  courseUuid: string;
};

type Assessment = {
  uuid: string;
  title: string;
  description?: string;
  weight_percentage: number;
  is_required: boolean;
};

const DEFAULT_AUTO_PASS_RATE = 50;

export default function CourseGradingForm({ courseUuid }: CourseGradingFormProps) {
  const { data: assessmentsData, isLoading } = useQuery({
    ...getCourseAssessmentsOptions({ path: { courseUuid }, query: { pageable: {} } }),
    enabled: !!courseUuid,
  });

  const assessments: Assessment[] = assessmentsData?.data?.content ?? [];
  const totalWeight = assessments.reduce(
    (sum, assessment) => sum + (assessment.weight_percentage ?? 0),
    0
  );

  const calculatedFormula = useMemo(() => {
    if (assessments.length === 0) return '';

    return assessments
      .map(assessment => `(${assessment.title} × ${assessment.weight_percentage}%)`)
      .join(' + ');
  }, [assessments]);

  const calculatedPassMark = useMemo(() => {
    if (totalWeight <= 0) return 0;
    return Math.round((totalWeight * DEFAULT_AUTO_PASS_RATE) / 100);
  }, [totalWeight]);

  const [finalGradeFormula, setFinalGradeFormula] = useState('');
  const [useCalculatedPassMark, setUseCalculatedPassMark] = useState(true);
  const [manualPassMark, setManualPassMark] = useState('');

  useEffect(() => {
    if (!calculatedFormula) {
      setFinalGradeFormula('');
      return;
    }

    setFinalGradeFormula(previousFormula =>
      previousFormula.trim().length === 0 ? calculatedFormula : previousFormula
    );
  }, [calculatedFormula]);

  const resolvedPassMark = useCalculatedPassMark
    ? calculatedPassMark
    : manualPassMark === ''
      ? ''
      : Number(manualPassMark);

  return (
    <div className='space-y-6'>
      <div className='bg-card rounded-xl border shadow-sm'>
        <div className='flex flex-col gap-1 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h3 className='text-foreground text-lg font-bold'>Course Grading Components</h3>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              Review the weighted components that make up the final course grade.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-16'>
            <Spinner className='h-6 w-6' />
          </div>
        ) : assessments.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
            <div className='bg-muted rounded-full p-4'>
              <Plus size={24} className='text-muted-foreground' />
            </div>
            <p className='text-foreground font-medium'>No grading components yet</p>
            <p className='text-muted-foreground max-w-xs text-sm'>
              Add assessment structure items first to generate the course grading table.
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-muted/40 border-b'>
                  <th className='text-foreground px-6 py-3 text-left font-semibold'>
                    Component Title
                  </th>
                  <th className='text-foreground px-4 py-3 text-left font-semibold'>
                    Weight (%)
                  </th>
                </tr>
              </thead>

              <tbody className='divide-y'>
                {assessments.map(assessment => (
                  <tr key={assessment.uuid} className='hover:bg-muted/30 transition-colors'>
                    <td className='px-6 py-4'>
                      <p className='text-foreground font-medium'>{assessment.title}</p>
                      {assessment.description && (
                        <p className='text-muted-foreground mt-0.5 line-clamp-1 text-xs'>
                          {assessment.description}
                        </p>
                      )}
                    </td>

                    <td className='px-4 py-4'>
                      <div className='flex flex-col gap-1'>
                        <span className='text-foreground font-semibold'>
                          {assessment.weight_percentage}%
                        </span>
                        <span
                          className={`inline-flex max-w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${assessment.is_required
                            ? 'bg-success/10 text-success/70'
                            : 'bg-muted-foreground/10 text-muted-foreground'
                            }`}
                        >
                          {assessment.is_required ? 'Required' : 'Optional'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className='bg-muted/40 border-t'>
                  <td className='text-foreground px-6 py-3 font-bold'>Final Grade Formula
                  </td>
                  <td
                    className={`px-4 py-3 text-left font-bold ${totalWeight === 100 ? 'text-success' : totalWeight > 100 ? 'text-destructive' : 'text-primary'}`}
                  >
                    {totalWeight}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className='flex flex-col gap-4'>
        {/* <div className='bg-card rounded-xl border shadow-sm'>
          <div className='border-b px-6 py-5'>
            <div className='flex items-start gap-3'>
              <div className='bg-primary/10 text-primary rounded-full p-2'>
                <Calculator size={18} />
              </div>
              <div>
                <h3 className='text-foreground text-base font-bold'>Final Grade Formula</h3>
                <p className='text-muted-foreground mt-0.5 text-sm'>
                  Use the generated formula or adjust it to reflect how the final grade should be
                  computed.
                </p>
              </div>
            </div>
          </div>

          <div className='space-y-4 px-6 py-5'>


            {calculatedFormula && (
              <div className='bg-muted/40 rounded-lg border px-4 py-3'>
                <p className='text-foreground text-xs font-semibold uppercase tracking-wide'>
                  Generated from assessment structure
                </p>
                <p className='text-muted-foreground mt-1 text-sm'>{calculatedFormula}</p>
              </div>
            )}
          </div>
        </div> */}

        <div className='bg-card rounded-xl border shadow-sm'>
          <div className='border-b px-6 py-5'>
            <h3 className='text-foreground text-base font-bold'>Pass Mark</h3>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              Choose whether the pass mark should be calculated automatically or entered manually.
            </p>
          </div>

          <div className='space-y-5 px-6 py-5'>
            <div className='bg-muted/40 flex items-center justify-between rounded-xl border p-4'>
              <div className='space-y-1'>
                <p className='text-foreground text-sm font-medium'>Calculated pass mark</p>
                <p className='text-muted-foreground text-xs'>
                  Uses 50% of the total allocated grading weight.
                </p>
              </div>
              <Switch
                checked={useCalculatedPassMark}
                onCheckedChange={setUseCalculatedPassMark}
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='course-pass-mark'>
                {useCalculatedPassMark ? 'Calculated Pass Mark (%)' : 'Manual Pass Mark (%)'}
              </Label>
              <Input
                id='course-pass-mark'
                type='number'
                min={0}
                max={100}
                value={resolvedPassMark}
                onChange={event => setManualPassMark(event.target.value)}
                disabled={useCalculatedPassMark}
                placeholder='e.g. 50'
              />
            </div>

            <div className='bg-muted/40 rounded-lg border px-4 py-3'>
              <p className='text-foreground text-sm font-semibold'>
                Learners must score {resolvedPassMark || 0}% to pass this course.
              </p>
              <p className='text-muted-foreground mt-1 text-xs'>
                {useCalculatedPassMark
                  ? `Calculated from ${DEFAULT_AUTO_PASS_RATE}% of the current total grading weight (${totalWeight}%).`
                  : 'Manual pass mark is enabled. Enter the minimum score learners must achieve.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
