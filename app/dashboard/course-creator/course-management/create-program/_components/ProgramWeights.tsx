'use client';

import { StatCard } from '@/components/data-display';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCoursesByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import { getCourseAssessmentsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQueries } from '@tanstack/react-query';
import { BookOpen, GraduationCap, Target, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { ProgramFormValues } from '../program-schema';
import { formatMark, tryLearners } from '../program-try-learner';
import { ProgramTextField } from './ProgramFields';

const MAX_COURSES_WITH_COMPONENTS = 40;
const COURSE_GRADING_HREF = '/dashboard/course-creator/course-management/create-new-course?id=';
const GRID =
  'grid grid-cols-[minmax(0,2.4fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.9fr)] gap-2.5';

const RESULT_TONE = {
  Passed: 'bg-primary/10 text-primary',
  Failed: 'bg-destructive/10 text-destructive',
  'In progress': 'bg-muted text-foreground/80',
} as const;

/** Pass rule and the share of the program mark each mandatory course carries. */
export function ProgramWeights() {
  const { control, setValue, formState } = useFormContext<ProgramFormValues>();
  const courses = useWatch({ control, name: 'courses' });
  const passMarkValue = useWatch({ control, name: 'passMark' });
  const courseIds = useMemo(() => courses.map(course => course.courseUuid), [courses]);
  const { courseMap } = useCoursesByIds(courseIds);
  // A program holds a handful of courses; the cap keeps a pathological one from fanning out.
  const components = useQueries({
    queries: courseIds.slice(0, MAX_COURSES_WITH_COMPONENTS).map(courseUuid => ({
      ...getCourseAssessmentsOptions({ path: { courseUuid }, query: { pageable: { size: 50 } } }),
      staleTime: STALE_TIMES.entity,
    })),
  });
  const [sample, setSample] = useState(0);

  const mandatory = courses.filter(course => course.isRequired);
  const total = mandatory.reduce((sum, course) => sum + (Number(course.weightPercentage) || 0), 0);
  const rounded = Math.round(total * 100) / 100;
  const anyWeighted = mandatory.some(course => course.weightPercentage.trim() !== '');
  const balanced = Math.round(total * 100) === 10000;
  // A failed save leaves the total error behind; it no longer applies once weights balance.
  const coursesError = balanced
    ? undefined
    : (formState.errors.courses?.root?.message ?? formState.errors.courses?.message);
  const passMark = String(passMarkValue ?? '').trim();
  const passNumber = passMark === '' ? Number.NaN : Number(passMark);

  const parts = courseIds.map((_, index) =>
    (components[index]?.data?.data?.content ?? []).map(component => ({
      title: component.title,
      weight: Number(component.weight_percentage ?? 0),
    }))
  );
  const componentTotals = parts.map(list => list.reduce((sum, part) => sum + part.weight, 0));
  const offCourses = parts.filter(
    (list, index) => list.length > 0 && Math.round(componentTotals[index] ?? 0) !== 100
  ).length;

  const samples = useMemo(
    () =>
      tryLearners(
        courses
          .filter(course => course.isRequired)
          .map(course => ({
            name: courseMap[course.courseUuid]?.name ?? 'Course',
            weight: Number(course.weightPercentage) || 0,
            passMark: Number(courseMap[course.courseUuid]?.pass_mark ?? 50),
          })),
        Number.isFinite(passNumber) ? passNumber : 0
      ),
    [courses, courseMap, passNumber]
  );
  const tried = samples[Math.min(sample, samples.length - 1)];

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

  const totalNote = !anyWeighted
    ? "You can leave weights empty while drafting; the program can't be published until mandatory weights total 100%."
    : balanced
      ? 'Ready. Mandatory weights total exactly 100%.'
      : `${total < 100 ? `Add ${Math.round((100 - total) * 100) / 100}% more.` : `Remove ${Math.round((total - 100) * 100) / 100}%.`} Mandatory weights must total exactly 100% before you can continue.`;

  return (
    <section className='flex flex-col gap-5' aria-label='Pass rule and course weights'>
      <div className='grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5'>
        <StatCard
          label='Mandatory courses'
          value={mandatory.length}
          hint={`${courses.length - mandatory.length} optional`}
          icon={BookOpen}
        />
        <StatCard
          label='Weights set'
          value={<span className='font-mono'>{rounded}%</span>}
          hint='of 100%'
          icon={Target}
          tone={balanced ? 'info' : 'warning'}
        />
        <StatCard
          label='Program pass mark'
          value={<span className='font-mono'>{passMark === '' ? '—' : `${passMark}%`}</span>}
          icon={GraduationCap}
        />
        <StatCard
          label='Components not at 100%'
          value={offCourses}
          hint={offCourses === 1 ? 'course' : 'courses'}
          icon={TriangleAlert}
          tone={offCourses > 0 ? 'warning' : 'info'}
        />
      </div>

      <div className='flex flex-wrap items-start gap-3.5'>
        <div className='bg-card flex min-w-0 flex-[2_1_640px] flex-col gap-4 rounded-2xl border p-5'>
          <div className='flex flex-wrap items-end gap-3.5'>
            <ProgramTextField
              name='passMark'
              label='Program pass mark (%)'
              type='number'
              min={0}
              max={100}
              placeholder='e.g. 50'
              className='w-48'
            />
            <p className='text-muted-foreground flex-[1_1_260px] pb-2.5 text-sm'>
              A learner passes with at least this mark and every mandatory course passed.
            </p>
          </div>

          <div className='flex flex-col gap-2.5 border-t pt-3.5'>
            {courses.length === 0 ? (
              <p className='text-muted-foreground text-sm'>Add courses to the program first.</p>
            ) : (
              <div className='overflow-x-auto'>
                <div className='flex min-w-[640px] flex-col gap-2.5'>
                  <div className={cn(GRID, 'text-muted-foreground text-xs font-semibold')}>
                    <span>Course</span>
                    <span>Counts towards the mark</span>
                    <span>Weight %</span>
                    <span>Course pass mark</span>
                  </div>
                  {courses.map((row, index) => {
                    const course = courseMap[row.courseUuid];
                    const name = course?.name ?? 'Course';
                    const list = parts[index] ?? [];
                    const componentTotal = componentTotals[index] ?? 0;
                    const weightError =
                      formState.errors.courses?.[index]?.weightPercentage?.message;
                    return (
                      <div
                        key={row.courseUuid}
                        data-testid='weight-row'
                        className={cn(GRID, 'border-muted items-center border-t pt-2.5')}
                      >
                        <div className='flex min-w-0 flex-col gap-0.5'>
                          <span className='text-sm font-semibold'>
                            {name}{' '}
                            {course?.course_code && (
                              <span className='text-muted-foreground font-mono text-xs font-normal'>
                                {course.course_code}
                              </span>
                            )}
                          </span>
                          <span className='text-muted-foreground text-xs'>
                            {list.length === 0
                              ? 'No graded components yet'
                              : `Components: ${list.map(part => `${part.title} ${part.weight}`).join(' · ')}`}
                          </span>
                          {list.length > 0 && Math.round(componentTotal) !== 100 && (
                            <Link
                              href={`${COURSE_GRADING_HREF}${encodeURIComponent(row.courseUuid)}`}
                              className='text-warning text-xs font-semibold underline-offset-2 hover:underline'
                            >
                              Components total {Math.round(componentTotal * 100) / 100}%. Open the
                              course&apos;s grading to fix it
                            </Link>
                          )}
                        </div>
                        <Select
                          value={row.isRequired ? 'mandatory' : 'optional'}
                          onValueChange={value => {
                            setValue(`courses.${index}.isRequired`, value === 'mandatory', {
                              shouldDirty: true,
                            });
                            if (value !== 'mandatory')
                              setValue(`courses.${index}.weightPercentage`, '', {
                                shouldDirty: true,
                              });
                          }}
                        >
                          <SelectTrigger
                            className='h-11 w-full'
                            aria-label={`Counts towards the mark for ${name}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='mandatory'>Mandatory</SelectItem>
                            <SelectItem value='optional'>Optional</SelectItem>
                          </SelectContent>
                        </Select>
                        {row.isRequired ? (
                          <div className='space-y-1'>
                            <Input
                              aria-label={`Weight for ${name}`}
                              inputMode='decimal'
                              className='h-11 font-mono'
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
                          <span className='text-muted-foreground text-sm'>Doesn&apos;t count</span>
                        )}
                        <span className='text-foreground/80 font-mono text-sm'>
                          {course?.pass_mark == null ? '—' : `${Number(course.pass_mark)}%`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className='flex flex-col gap-2 border-t pt-3.5'>
            <div className='flex flex-wrap items-center justify-between gap-2.5'>
              <span className='text-sm font-semibold'>
                Mandatory weights: <span className='font-mono'>{rounded}</span> of 100%
              </span>
              <Button
                type='button'
                variant='outline'
                onClick={splitEvenly}
                disabled={!mandatory.length}
              >
                Split evenly
              </Button>
            </div>
            <div
              role='progressbar'
              aria-label='Mandatory weights total'
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={rounded}
              className='bg-muted h-2 overflow-hidden rounded-full'
            >
              <div
                className={balanced ? 'bg-primary h-full' : 'bg-warning h-full'}
                style={{ width: `${Math.min(total, 100)}%` }}
              />
            </div>
            <p
              role={anyWeighted && !balanced ? 'alert' : 'status'}
              className={cn(
                'text-sm',
                balanced ? 'text-primary' : anyWeighted ? 'text-warning' : 'text-muted-foreground'
              )}
            >
              {totalNote}
            </p>
            {coursesError && <p className='text-destructive text-sm'>{coursesError}</p>}
          </div>
        </div>

        <aside
          aria-label='Try a learner'
          className='bg-card flex flex-[1_1_320px] flex-col gap-3 rounded-2xl border p-5'
        >
          <h3 className='text-base font-semibold'>Try a learner</h3>
          <p className='text-muted-foreground text-sm'>
            Sample course finals run through these weights and the pass rule.
          </p>
          {!tried ? (
            <p className='text-muted-foreground text-sm'>
              Give mandatory courses a weight to try a learner.
            </p>
          ) : (
            <>
              <div role='group' aria-label='Sample learner' className='flex flex-wrap gap-2'>
                {samples.map((entry, index) => (
                  <Button
                    key={entry.label}
                    type='button'
                    variant={entry === tried ? 'default' : 'outline'}
                    aria-pressed={entry === tried}
                    className='rounded-full'
                    onClick={() => setSample(index)}
                  >
                    {entry.label}
                  </Button>
                ))}
              </div>
              <div
                data-testid='try-learner'
                className='flex flex-col gap-1.5 rounded-xl border p-3.5'
              >
                <span className='text-muted-foreground text-xs'>
                  Program mark · {tried.provisional ? 'provisional' : 'final'}
                </span>
                <div className='flex flex-wrap items-center gap-2.5'>
                  <span className='font-mono text-[26px] font-bold'>{formatMark(tried.mark)}</span>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-semibold',
                      RESULT_TONE[tried.result]
                    )}
                  >
                    {tried.result}
                  </span>
                </div>
                <span className='text-foreground/80 text-sm'>{tried.why}</span>
              </div>
            </>
          )}
          <p className='text-muted-foreground text-xs'>
            Until every mandatory course has a result, the mark only counts the courses that do and
            is shown as provisional.
          </p>
        </aside>
      </div>
    </section>
  );
}
