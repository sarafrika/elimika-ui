'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useCoursesByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import { getCourseAssessmentsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { ProgramFormValues } from '../program-schema';
import { ProgramTextField } from './ProgramFields';

const MAX_COURSES_WITH_COMPONENTS = 40;

/** Pass rule and the share of the programme mark each mandatory course carries. */
export function ProgramWeights() {
  const { control, setValue, formState } = useFormContext<ProgramFormValues>();
  const courses = useWatch({ control, name: 'courses' });
  const courseIds = useMemo(() => courses.map(course => course.courseUuid), [courses]);
  const { courseMap } = useCoursesByIds(courseIds);
  // A programme holds a handful of courses; the cap keeps a pathological one from fanning out.
  const components = useQueries({
    queries: courseIds.slice(0, MAX_COURSES_WITH_COMPONENTS).map(courseUuid => ({
      ...getCourseAssessmentsOptions({ path: { courseUuid }, query: { pageable: { size: 50 } } }),
      staleTime: STALE_TIMES.entity,
    })),
  });

  const mandatory = courses.filter(course => course.isRequired);
  const total = mandatory.reduce((sum, course) => sum + (Number(course.weightPercentage) || 0), 0);
  const rounded = Math.round(total * 100) / 100;
  const anyWeighted = mandatory.some(course => course.weightPercentage.trim() !== '');
  const balanced = Math.round(total * 100) === 10000;
  const coursesError = formState.errors.courses?.root?.message ?? formState.errors.courses?.message;

  const splitEvenly = () => {
    if (!mandatory.length) return;
    const share = Math.floor((100 / mandatory.length) * 100) / 100;
    let given = 0;
    courses.forEach((course, index) => {
      if (!course.isRequired) return;
      const last = given + share * 2 > 100.0001;
      const value = last ? Math.round((100 - given) * 100) / 100 : share;
      given += value;
      setValue(`courses.${index}.weightPercentage`, String(value), { shouldDirty: true });
    });
  };

  return (
    <section className='space-y-5' aria-label='Pass rule and course weights'>
      <Card className='gap-3 p-5'>
        <h3 className='text-base font-semibold'>Pass rule</h3>
        <div className='flex flex-wrap items-end gap-5'>
          <ProgramTextField
            name='passMark'
            label='Programme pass mark (%)'
            type='number'
            min={0}
            max={100}
            placeholder='e.g. 50'
            className='w-48'
          />
          <p className='text-muted-foreground max-w-xl flex-1 text-sm'>
            A learner passes when their{' '}
            <strong>weighted programme mark reaches the pass mark</strong> and they have{' '}
            <strong>passed every mandatory course</strong>. Until every mandatory course has a
            result, the mark is shown as provisional.
          </p>
        </div>
      </Card>

      <Card className='gap-4 p-5'>
        <div className='flex flex-wrap items-baseline justify-between gap-2'>
          <h3 className='text-base font-semibold'>Course weights</h3>
          <span className='text-muted-foreground text-sm'>
            Only mandatory courses carry weight. Optional courses show results but don&apos;t count.
          </span>
        </div>
        {courses.length === 0 ? (
          <p className='text-muted-foreground text-sm'>Add courses to the programme first.</p>
        ) : (
          <div className='overflow-x-auto rounded-md border'>
            <table className='w-full min-w-[820px] text-sm'>
              <thead className='bg-muted/50 text-left'>
                <tr>
                  <th className='px-3 py-2.5'>#</th>
                  <th className='px-3 py-2.5'>Course</th>
                  <th className='px-3 py-2.5'>Mandatory</th>
                  <th className='px-3 py-2.5'>Weight %</th>
                  <th className='px-3 py-2.5'>Course pass mark</th>
                  <th className='px-3 py-2.5'>How the course grades (set by its author)</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((row, index) => {
                  const course = courseMap[row.courseUuid];
                  const parts = (components[index]?.data?.data?.content ?? []).map(component => ({
                    title: component.title,
                    weight: Number(component.weight_percentage ?? 0),
                  }));
                  const componentTotal = parts.reduce((sum, part) => sum + part.weight, 0);
                  const weightError = formState.errors.courses?.[index]?.weightPercentage?.message;
                  return (
                    <tr key={row.courseUuid} className='border-t align-top'>
                      <td className='text-muted-foreground px-3 py-2.5'>{index + 1}</td>
                      <td className='px-3 py-2.5'>
                        <div className='font-medium'>{course?.name ?? 'Course'}</div>
                        {course?.course_code && (
                          <div className='text-muted-foreground font-mono text-xs'>
                            {course.course_code}
                          </div>
                        )}
                      </td>
                      <td className='px-3 py-2.5'>
                        <label className='flex min-h-10 cursor-pointer items-center gap-2'>
                          <Checkbox
                            checked={row.isRequired}
                            onCheckedChange={checked => {
                              setValue(`courses.${index}.isRequired`, checked === true, {
                                shouldDirty: true,
                              });
                              if (checked !== true)
                                setValue(`courses.${index}.weightPercentage`, '', {
                                  shouldDirty: true,
                                });
                            }}
                            aria-label={`${course?.name ?? 'Course'} is mandatory`}
                          />
                          {row.isRequired ? 'Yes' : 'Optional'}
                        </label>
                      </td>
                      <td className='px-3 py-2.5'>
                        {row.isRequired ? (
                          <div className='space-y-1'>
                            <Input
                              aria-label={`Weight for ${course?.name ?? 'course'}`}
                              inputMode='decimal'
                              className='w-24 font-mono'
                              value={row.weightPercentage}
                              aria-invalid={Boolean(weightError)}
                              onChange={event =>
                                setValue(`courses.${index}.weightPercentage`, event.target.value, {
                                  shouldDirty: true,
                                })
                              }
                            />
                            {weightError && (
                              <p className='text-destructive text-xs'>{weightError}</p>
                            )}
                          </div>
                        ) : (
                          <span className='text-muted-foreground'>Not weighted</span>
                        )}
                      </td>
                      <td className='px-3 py-2.5 font-mono'>
                        {course?.pass_mark == null ? '—' : `${Number(course.pass_mark)}%`}
                      </td>
                      <td className='text-muted-foreground px-3 py-2.5 text-xs'>
                        {parts.length === 0
                          ? 'No graded components yet'
                          : parts.map(part => `${part.title} ${part.weight}`).join(' · ')}
                        {parts.length > 0 && Math.round(componentTotal) !== 100 && (
                          <p className='text-warning mt-1'>
                            Course weights total {componentTotal}%. Ask the course author to fix
                            them.
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className='space-y-2'>
          <div className='flex justify-between text-sm font-medium'>
            <span>Mandatory weights total</span>
            <span className='font-mono'>{rounded}% of 100%</span>
          </div>
          <div
            role='progressbar'
            aria-label='Mandatory weights total'
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={rounded}
            className='bg-muted h-2.5 overflow-hidden rounded-full'
          >
            <div
              className={balanced ? 'bg-primary h-full' : 'bg-warning h-full'}
              style={{ width: `${Math.min(total, 100)}%` }}
            />
          </div>
          {anyWeighted && !balanced && (
            <p role='alert' className='text-warning text-sm'>
              {total < 100
                ? `Add ${Math.round((100 - total) * 100) / 100}% more.`
                : `Remove ${Math.round((total - 100) * 100) / 100}%.`}{' '}
              Mandatory weights must total exactly 100% before you can continue.
            </p>
          )}
          {!anyWeighted && (
            <p className='text-muted-foreground text-sm'>
              You can leave weights empty while drafting; the programme can&apos;t be published
              until they total 100%.
            </p>
          )}
          {coursesError && <p className='text-destructive text-sm'>{coursesError}</p>}
        </div>
        <div className='flex justify-end'>
          <Button
            type='button'
            variant='outline'
            onClick={splitEvenly}
            disabled={!mandatory.length}
          >
            Split evenly
          </Button>
        </div>
      </Card>
    </section>
  );
}
