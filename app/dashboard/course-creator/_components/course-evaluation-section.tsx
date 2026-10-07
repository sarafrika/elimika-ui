'use client';

import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getCourseAssessmentsOptions,
  getCourseEvaluationPlanOptions,
  getCourseEvaluationPlanQueryKey,
  getLineItemsQueryKey,
  searchAssessmentRubricsOptions,
  updateCourseEvaluationPlanMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  CourseAssessment,
  CourseAssessmentLineItem,
  Lesson,
} from '@/services/client/types.gen';
import { EvaluationRubricPicker } from './evaluation-rubric-picker';
import { EvaluationRubricPreview } from './evaluation-rubric-preview';

type Props = {
  courseUuid: string;
  courseCreatorUuid?: string;
  lessons: Array<Lesson & { uuid: string }>;
  lessonsLoading: boolean;
  lessonsError?: unknown;
  onRetryLessons?: () => void;
};

type SavedAssessment = CourseAssessment & { uuid: string };
const cellKey = (lessonUuid: string, assessmentUuid: string) => `${lessonUuid}:${assessmentUuid}`;

export function CourseEvaluationSection(props: Props) {
  if (!props.courseUuid)
    return <EmptyState variant='compact' title='Save the course to configure evaluation' />;
  return <SavedCourseEvaluationSection key={props.courseUuid} {...props} />;
}

function SavedCourseEvaluationSection({
  courseUuid,
  courseCreatorUuid,
  lessons,
  lessonsLoading,
  lessonsError,
  onRetryLessons,
}: Props) {
  const queryClient = useQueryClient();
  const planOptions = { path: { courseUuid } };
  const assessmentQuery = useQuery({
    ...getCourseAssessmentsOptions({ path: { courseUuid }, query: { pageable: {} } }),
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.entity,
  });
  const planQuery = useQuery({
    ...getCourseEvaluationPlanOptions(planOptions),
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.entity,
  });
  const assessmentsFailed =
    assessmentQuery.isError ||
    Boolean(assessmentQuery.data?.error) ||
    assessmentQuery.data?.success === false;
  const planFailed =
    planQuery.isError || Boolean(planQuery.data?.error) || planQuery.data?.success === false;
  const assessments = useMemo(
    () =>
      assessmentsFailed
        ? []
        : (assessmentQuery.data?.data?.content ?? []).filter((item): item is SavedAssessment =>
            Boolean(item.uuid)
          ),
    [assessmentQuery.data, assessmentsFailed]
  );
  const plan = planFailed ? undefined : planQuery.data?.data;
  const cells = useMemo(() => {
    const result = new Map<string, CourseAssessmentLineItem>();
    plan?.lessons?.forEach(lesson => {
      if (!lesson.lesson_uuid) return;
      const lessonUuid = lesson.lesson_uuid;
      lesson.cells?.forEach((cell, index) => {
        if (!cell) return;
        const assessmentUuid =
          cell.course_assessment_uuid || plan.components?.[index]?.assessment_uuid;
        if (assessmentUuid) result.set(cellKey(lessonUuid, assessmentUuid), cell);
      });
    });
    return result;
  }, [plan]);
  const orderedLessons = useMemo(
    () => [...lessons].sort((a, b) => (a.lesson_number ?? 0) - (b.lesson_number ?? 0)),
    [lessons]
  );
  const rubricIds = useMemo(() => {
    const ids = new Set<string>();
    assessments.forEach(component => {
      if (component.rubric_uuid) ids.add(component.rubric_uuid);
      lessons.forEach(lesson => {
        const rubricUuid = cells.get(cellKey(lesson.uuid, component.uuid))?.rubric_uuid;
        if (rubricUuid) ids.add(rubricUuid);
      });
    });
    return [...ids].sort();
  }, [assessments, lessons, cells]);
  const titlesQuery = useQuery({
    ...searchAssessmentRubricsOptions({
      query: {
        searchParams: { uuid_in: rubricIds.join(',') },
        pageable: { page: 0, size: Math.max(1, rubricIds.length) },
      },
    }),
    enabled: rubricIds.length > 0,
    staleTime: STALE_TIMES.entity,
  });
  const [chosenTitles, setChosenTitles] = useState<Map<string, string>>(new Map());
  const titlesFailed =
    titlesQuery.isError || Boolean(titlesQuery.data?.error) || titlesQuery.data?.success === false;
  const rubricTitles = useMemo(() => {
    const titles = new Map<string, string>();
    if (!titlesFailed)
      titlesQuery.data?.data?.content?.forEach(rubric => {
        if (rubric.uuid) titles.set(rubric.uuid, rubric.title);
      });
    chosenTitles.forEach((title, uuid) => titles.set(uuid, title));
    return titles;
  }, [titlesQuery.data, titlesFailed, chosenTitles]);
  const [previewUuid, setPreviewUuid] = useState<string | null>(null);
  const [viewRubricUuid, setViewRubricUuid] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const saveLock = useRef(false);
  const update = useMutation(updateCourseEvaluationPlanMutation());
  const loading = lessonsLoading || assessmentQuery.isLoading || planQuery.isLoading;
  const failed = assessmentsFailed || planFailed || Boolean(lessonsError);
  const disabled = loading || Boolean(failed) || Boolean(savingKey);

  async function saveCell(
    lessonUuid: string,
    component: SavedAssessment,
    enabled: boolean,
    rubricUuid = ''
  ) {
    if (disabled || saveLock.current) return;
    const key = cellKey(lessonUuid, component.uuid);
    const existing = cells.get(key);
    const wasEnabled = Boolean(existing && existing.active !== false);
    if (enabled === wasEnabled && (!enabled || rubricUuid === (existing?.rubric_uuid ?? '')))
      return;
    saveLock.current = true;
    setSavingKey(key);
    try {
      const result = await update.mutateAsync({
        path: { courseUuid },
        body: {
          cells: [
            {
              lesson_uuid: lessonUuid,
              assessment_uuid: component.uuid,
              enabled,
              ...(enabled
                ? {
                    ...(rubricUuid ? { rubric_uuid: rubricUuid } : {}),
                    ...(existing?.quiz_uuid ? { quiz_uuid: existing.quiz_uuid } : {}),
                    ...(existing?.assignment_uuid
                      ? { assignment_uuid: existing.assignment_uuid }
                      : {}),
                  }
                : {}),
            },
          ],
        },
      });
      if (result.error || result.success === false)
        throw new Error(getErrorMessage(result, 'Unable to save evaluation plan'));
      if (result.data)
        queryClient.setQueryData(getCourseEvaluationPlanQueryKey(planOptions), result);
      else
        await queryClient.invalidateQueries({
          queryKey: getCourseEvaluationPlanQueryKey(planOptions),
        });
      void queryClient.invalidateQueries({
        queryKey: getLineItemsQueryKey({ path: { courseUuid, assessmentUuid: component.uuid } }),
      });
      toast.success('Lesson evaluation saved');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save evaluation plan'));
    } finally {
      saveLock.current = false;
      setSavingKey(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Evaluation criteria per lesson</CardTitle>
          <CardDescription>
            Check Include to associate a lesson with an assessment component. Select its grading
            rubric if needed. Changes save automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {failed ? (
            <EmptyState
              title='Could not load evaluation criteria'
              description={getErrorMessage(
                assessmentsFailed
                  ? (assessmentQuery.error ?? assessmentQuery.data)
                  : planFailed
                    ? (planQuery.error ?? planQuery.data)
                    : lessonsError,
                'Could not load lessons.'
              )}
              action={
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    onRetryLessons?.();
                    void assessmentQuery.refetch();
                    void planQuery.refetch();
                  }}
                >
                  Retry
                </Button>
              }
            />
          ) : loading ? (
            <Skeleton className='h-64 w-full' />
          ) : assessments.length === 0 ? (
            <EmptyState
              variant='compact'
              title='Add assessment components first'
              description='Add components in the Assessment tab to associate them with lessons.'
            />
          ) : (
            <>
              <div className='border-border overflow-hidden rounded-md border'>
                <Table className='min-w-[720px]'>
                  <TableHeader>
                    <TableRow className='bg-muted/60'>
                      <TableHead className='w-24 px-3 py-2'>Lesson</TableHead>
                      <TableHead className='min-w-44 px-3 py-2'>Lesson title</TableHead>
                      {assessments.map(component => (
                        <TableHead
                          key={component.uuid}
                          className='min-w-64 border-l px-3 py-2 align-top whitespace-normal'
                        >
                          <div className='font-semibold'>
                            {component.title || 'Untitled component'}
                          </div>
                          <p className='text-muted-foreground text-xs'>
                            {component.weight_percentage}%
                          </p>
                          {component.rubric_uuid && (
                            <Button
                              type='button'
                              variant='link'
                              className='h-auto p-0 text-xs'
                              onClick={() => setPreviewUuid(component.rubric_uuid ?? null)}
                            >
                              {rubricTitles.get(component.rubric_uuid) || 'View component rubric'}
                            </Button>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderedLessons.map((lesson, index) => (
                      <TableRow key={lesson.uuid}>
                        <TableCell className='bg-muted/30 px-3 py-2 align-top font-medium'>
                          Lesson {lesson.lesson_number ?? index + 1}
                        </TableCell>
                        <TableCell className='text-muted-foreground px-3 py-2 align-top whitespace-normal'>
                          {lesson.title || 'Untitled lesson'}
                        </TableCell>
                        {assessments.map(component => {
                          const key = cellKey(lesson.uuid, component.uuid);
                          const cell = cells.get(key);
                          const enabled = Boolean(cell && cell.active !== false);
                          const label = `${lesson.title || `Lesson ${index + 1}`} — ${component.title}`;
                          return (
                            <TableCell
                              key={component.uuid}
                              className='space-y-2 border-l px-3 py-2 align-top whitespace-normal'
                            >
                              <div className='flex items-center gap-2'>
                                <Checkbox
                                  id={`include-${key}`}
                                  checked={enabled}
                                  disabled={disabled}
                                  onCheckedChange={checked =>
                                    void saveCell(
                                      lesson.uuid,
                                      component,
                                      checked === true,
                                      cell?.rubric_uuid ?? ''
                                    )
                                  }
                                  aria-label={`Include ${label}`}
                                />
                                <Label htmlFor={`include-${key}`}>Include</Label>
                                {savingKey === key && <Spinner className='size-4' />}
                              </div>
                              <EvaluationRubricPicker
                                creatorUuid={courseCreatorUuid}
                                value={enabled ? cell?.rubric_uuid : undefined}
                                title={rubricTitles.get(cell?.rubric_uuid ?? '')}
                                label={label}
                                emptyLabel={
                                  enabled
                                    ? component.rubric_uuid
                                      ? 'Use component rubric'
                                      : 'No rubric'
                                    : 'None'
                                }
                                disabled={disabled}
                                saving={savingKey === key}
                                onChange={rubric => {
                                  if (rubric)
                                    setChosenTitles(previous =>
                                      new Map(previous).set(rubric.uuid, rubric.title)
                                    );
                                  void saveCell(
                                    lesson.uuid,
                                    component,
                                    Boolean(rubric) || enabled,
                                    rubric?.uuid ?? ''
                                  );
                                }}
                                onPreview={setPreviewUuid}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {lessons.length === 0 && (
                <EmptyState
                  variant='compact'
                  title='Add lessons first'
                  description='Add lessons in Lesson content to associate them with assessment components.'
                />
              )}
            </>
          )}
          <Button asChild variant='outline' size='sm' className='w-fit'>
            <Link
              href='/dashboard/course-creator/rubrics'
              target='_blank'
              rel='noopener noreferrer'
            >
              Manage rubrics
            </Link>
          </Button>
        </CardContent>
      </Card>
      {!failed && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Course rubrics</CardTitle>
            <CardDescription>
              View the criteria and scoring levels for a rubric used by an assessment component or
              lesson.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {rubricIds.length === 0 ? (
              <EmptyState variant='compact' title='No rubrics associated yet' />
            ) : (
              <>
                {titlesFailed && (
                  <EmptyState
                    variant='compact'
                    title='Could not load rubric names'
                    description={getErrorMessage(
                      titlesQuery.error ?? titlesQuery.data,
                      'Unable to load rubric names'
                    )}
                    action={
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => void titlesQuery.refetch()}
                      >
                        Retry
                      </Button>
                    }
                  />
                )}
                <div className='flex max-w-xl flex-wrap items-end gap-2'>
                  <div className='grid min-w-0 flex-1 gap-1.5'>
                    <Label htmlFor='course-associated-rubric'>Associated rubric</Label>
                    <Select
                      value={rubricIds.includes(viewRubricUuid) ? viewRubricUuid : ''}
                      onValueChange={value => {
                        setViewRubricUuid(value);
                        setPreviewUuid(value);
                      }}
                    >
                      <SelectTrigger id='course-associated-rubric' className='w-full'>
                        <SelectValue placeholder='Select a course rubric' />
                      </SelectTrigger>
                      <SelectContent>
                        {rubricIds.map((id, index) => (
                          <SelectItem key={id} value={id}>
                            {rubricTitles.get(id) || `Associated rubric ${index + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type='button'
                    variant='outline'
                    disabled={!rubricIds.includes(viewRubricUuid)}
                    onClick={() => setPreviewUuid(viewRubricUuid)}
                  >
                    View rubric
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
      <Sheet
        open={Boolean(previewUuid)}
        onOpenChange={open => {
          if (!open) setPreviewUuid(null);
        }}
      >
        <SheetContent className='w-full overflow-y-auto sm:max-w-4xl'>
          <SheetHeader>
            <SheetTitle>Rubric details</SheetTitle>
            <SheetDescription>Review the evaluation criteria and scoring levels.</SheetDescription>
          </SheetHeader>
          <div className='p-4'>
            {previewUuid && <EvaluationRubricPreview key={previewUuid} rubricUuid={previewUuid} />}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
