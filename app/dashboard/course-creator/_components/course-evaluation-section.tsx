'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { STALE_TIMES } from '@/lib/query-client';
import {
  associateRubricMutation,
  dissociateRubricByContextMutation,
  getCourseAssessmentsOptions,
  getCourseAssessmentsQueryKey,
  getCourseRubricsInfiniteOptions,
  getCourseRubricsQueryKey,
  searchAssessmentRubricsOptions,
  updateAssociationMutation,
  updateCourseAssessmentMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  CourseAssessment,
  CourseRubricAssociation,
  Lesson,
} from '@/services/client/types.gen';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  assertEvaluationResponse,
  COURSE_EVALUATION_CONTEXT,
  getCourseEvaluationAssociation,
  lessonEvaluationContext,
  nextEvaluationPage,
  persistEvaluationAssociation,
  resolveEvaluationRubric,
} from './course-evaluation-utils';
import { EvaluationRubricPicker, type SavedEvaluationRubric } from './evaluation-rubric-picker';
import { EvaluationRubricPreview } from './evaluation-rubric-preview';

type Props = {
  courseUuid: string;
  courseCreatorUuid?: string;
  associatedBy?: string;
  lessons: Array<Lesson & { uuid: string }>;
  lessonsLoading: boolean;
  lessonsError?: boolean;
  onRetryLessons?: () => void;
};

type SavedAssessment = CourseAssessment & { uuid: string };

export function CourseEvaluationSection({
  courseUuid,
  courseCreatorUuid,
  associatedBy,
  lessons,
  lessonsLoading,
  lessonsError,
  onRetryLessons,
}: Props) {
  const queryClient = useQueryClient();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const saveLock = useRef(false);
  const [previewUuid, setPreviewUuid] = useState<string | null>(null);
  const [viewRubricUuid, setViewRubricUuid] = useState('');
  const [chosenRubrics, setChosenRubrics] = useState<Map<string, SavedEvaluationRubric>>(new Map());
  const assessmentQuery = useQuery({
    ...getCourseAssessmentsOptions({ path: { courseUuid }, query: { pageable: {} } }),
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.entity,
  });
  const associationQuery = useInfiniteQuery({
    ...getCourseRubricsInfiniteOptions({
      path: { courseUuid },
      query: { pageable: { page: 0, size: 100 } },
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.error || lastPage.success === false) return undefined;
      const next = nextEvaluationPage(lastPage.data?.metadata, pages.length - 1);
      return next === undefined
        ? undefined
        : { path: { courseUuid }, query: { pageable: { page: next, size: 100 } } };
    },
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.entity,
  });
  // The matrix needs all of this course's mappings before a cell can safely be edited.
  useEffect(() => {
    if (associationQuery.hasNextPage && !associationQuery.isFetching && !associationQuery.isError) {
      void associationQuery.fetchNextPage();
    }
  }, [
    associationQuery.hasNextPage,
    associationQuery.isFetching,
    associationQuery.isError,
    associationQuery.fetchNextPage,
  ]);

  const assessmentsFailed =
    assessmentQuery.isError ||
    Boolean(assessmentQuery.data?.error) ||
    assessmentQuery.data?.success === false;
  const associationsFailed =
    associationQuery.isError ||
    Boolean(associationQuery.data?.pages.some(page => page.error || page.success === false));
  const assessments = useMemo(
    () =>
      assessmentsFailed
        ? []
        : (assessmentQuery.data?.data?.content ?? []).filter((item): item is SavedAssessment =>
            Boolean(item.uuid)
          ),
    [assessmentQuery.data, assessmentsFailed]
  );
  const associations = useMemo(
    () =>
      associationsFailed
        ? []
        : (associationQuery.data?.pages.flatMap(page => page.data?.content ?? []) ?? []),
    [associationQuery.data, associationsFailed]
  );
  const associationsByContext = useMemo(
    () => new Map(associations.map(item => [item.usage_context, item])),
    [associations]
  );
  const courseAssociation = getCourseEvaluationAssociation(associations);
  const orderedLessons = useMemo(
    () => [...lessons].sort((a, b) => (a.lesson_number ?? 0) - (b.lesson_number ?? 0)),
    [lessons]
  );
  const rubricIds = useMemo(
    () =>
      [
        ...new Set([
          ...associations.map(item => item.rubric_uuid),
          ...assessments.map(item => item.rubric_uuid).filter((id): id is string => Boolean(id)),
        ]),
      ].sort(),
    [associations, assessments]
  );
  const rubricTitlesQuery = useQuery({
    ...searchAssessmentRubricsOptions({
      query: {
        searchParams: { uuid_in: rubricIds.join(',') },
        pageable: { page: 0, size: Math.max(1, rubricIds.length) },
      },
    }),
    enabled: rubricIds.length > 0,
    staleTime: STALE_TIMES.entity,
  });
  const titlesFailed =
    rubricTitlesQuery.isError ||
    Boolean(rubricTitlesQuery.data?.error) ||
    rubricTitlesQuery.data?.success === false;
  const rubricTitles = useMemo(() => {
    const titles = new Map<string, string>();
    if (!titlesFailed)
      rubricTitlesQuery.data?.data?.content?.forEach(rubric => {
        if (rubric.uuid) titles.set(rubric.uuid, rubric.title);
      });
    chosenRubrics.forEach(rubric => titles.set(rubric.uuid, rubric.title));
    return titles;
  }, [rubricTitlesQuery.data, titlesFailed, chosenRubrics]);

  const associate = useMutation(associateRubricMutation());
  const updateAssociation = useMutation(updateAssociationMutation());
  const dissociate = useMutation(dissociateRubricByContextMutation());
  const updateAssessment = useMutation(updateCourseAssessmentMutation());
  const loading =
    lessonsLoading ||
    assessmentQuery.isLoading ||
    associationQuery.isLoading ||
    associationQuery.hasNextPage;
  const failed = assessmentsFailed || associationsFailed || lessonsError;
  const disabled = Boolean(savingKey) || loading || failed;

  function rememberRubric(rubric: SavedEvaluationRubric | null) {
    if (rubric) setChosenRubrics(previous => new Map(previous).set(rubric.uuid, rubric));
  }

  async function save(key: string, action: () => Promise<void>) {
    if (saveLock.current || disabled) return;
    saveLock.current = true;
    setSavingKey(key);
    try {
      await action();
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getCourseAssessmentsQueryKey({ path: { courseUuid }, query: { pageable: {} } }),
        }),
        queryClient.invalidateQueries({
          queryKey: getCourseRubricsQueryKey({ path: { courseUuid }, query: { pageable: {} } }),
        }),
      ]);
      toast.success('Evaluation rubric saved.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to save the rubric. Please try again.'
      );
    } finally {
      saveLock.current = false;
      setSavingKey(null);
    }
  }

  async function saveAssociation(
    context: string,
    existing: CourseRubricAssociation | undefined,
    rubric: SavedEvaluationRubric | null,
    primary = false
  ) {
    rememberRubric(rubric);
    if (existing?.rubric_uuid === rubric?.uuid || (!existing && !rubric)) return;
    await save(context, () =>
      persistEvaluationAssociation(
        {
          courseUuid,
          associatedBy,
          context,
          existing,
          rubricUuid: rubric?.uuid ?? null,
          primary,
        },
        {
          associate: input => associate.mutateAsync(input),
          update: input => updateAssociation.mutateAsync(input),
          remove: input => dissociate.mutateAsync(input),
        }
      )
    );
  }

  async function saveComponent(assessment: SavedAssessment, rubric: SavedEvaluationRubric | null) {
    rememberRubric(rubric);
    if ((assessment.rubric_uuid || null) === (rubric?.uuid ?? null)) return;
    await save(assessment.uuid, async () => {
      assertEvaluationResponse(
        await updateAssessment.mutateAsync({
          path: { courseUuid, assessmentUuid: assessment.uuid },
          body: {
            course_uuid: courseUuid,
            assessment_type: assessment.assessment_type,
            title: assessment.title,
            description: assessment.description,
            weight_percentage: assessment.weight_percentage,
            aggregation_strategy: assessment.aggregation_strategy,
            sync_class_attendance: assessment.sync_class_attendance,
            is_required: assessment.is_required,
            rubric_uuid: rubric?.uuid ?? null,
          },
        })
      );
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Evaluation criteria per lesson</CardTitle>
          <CardDescription>
            Set one rubric for the whole course per assessment component, or pick a different rubric
            for each lesson. Selections save automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          {failed ? (
            <EmptyState
              title='Could not load evaluation criteria'
              description='Reload the lessons, course assessments, and rubric associations to continue.'
              action={
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    onRetryLessons?.();
                    void assessmentQuery.refetch();
                    void associationQuery.refetch();
                  }}
                >
                  Retry
                </Button>
              }
            />
          ) : loading ? (
            <Skeleton className='h-64 w-full' />
          ) : (
            <>
              <div className='grid max-w-sm gap-1.5'>
                <Label>Course rubric</Label>
                <EvaluationRubricPicker
                  creatorUuid={courseCreatorUuid}
                  value={courseAssociation?.rubric_uuid}
                  title={rubricTitles.get(courseAssociation?.rubric_uuid ?? '')}
                  label='Course rubric'
                  disabled={disabled}
                  saving={savingKey === COURSE_EVALUATION_CONTEXT}
                  onChange={rubric =>
                    void saveAssociation(COURSE_EVALUATION_CONTEXT, courseAssociation, rubric, true)
                  }
                  onPreview={setPreviewUuid}
                />
                <p className='text-muted-foreground text-xs'>
                  Used when no assessment or lesson rubric is selected.
                </p>
              </div>
              {assessments.length === 0 ? (
                <EmptyState
                  variant='compact'
                  title='Add assessment components first'
                  description='Use the Assessment tab to add components such as Attendance, Practical assignments, Quiz assignments, or Performance.'
                />
              ) : (
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
                            <div className='mt-2 grid gap-1 font-normal'>
                              <span className='text-muted-foreground text-xs'>
                                Whole-course rubric
                              </span>
                              <EvaluationRubricPicker
                                creatorUuid={courseCreatorUuid}
                                value={component.rubric_uuid}
                                title={rubricTitles.get(component.rubric_uuid ?? '')}
                                label={`${component.title} — whole course`}
                                emptyLabel='Choose per lesson'
                                disabled={disabled}
                                saving={savingKey === component.uuid}
                                onChange={rubric => void saveComponent(component, rubric)}
                                onPreview={setPreviewUuid}
                              />
                            </div>
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
                            const context = lessonEvaluationContext(component.uuid, lesson.uuid);
                            const association = associationsByContext.get(context);
                            const effectiveRubric = resolveEvaluationRubric(
                              component.rubric_uuid,
                              association?.rubric_uuid,
                              courseAssociation?.rubric_uuid
                            );
                            return (
                              <TableCell
                                key={component.uuid}
                                className='border-l px-3 py-2 align-top whitespace-normal'
                              >
                                {component.rubric_uuid ? (
                                  <div className='space-y-1'>
                                    <p className='text-muted-foreground text-xs'>
                                      Uses whole-course rubric
                                    </p>
                                    <Button
                                      type='button'
                                      variant='link'
                                      className='h-auto max-w-full justify-start p-0 text-left whitespace-normal'
                                      onClick={() => setPreviewUuid(component.rubric_uuid ?? null)}
                                    >
                                      {rubricTitles.get(component.rubric_uuid) || 'View rubric'}
                                    </Button>
                                  </div>
                                ) : (
                                  <div className='space-y-1'>
                                    <EvaluationRubricPicker
                                      creatorUuid={courseCreatorUuid}
                                      value={association?.rubric_uuid}
                                      title={rubricTitles.get(association?.rubric_uuid ?? '')}
                                      label={`${lesson.title || `Lesson ${index + 1}`} — ${component.title}`}
                                      emptyLabel={
                                        courseAssociation ? 'Use course rubric' : 'Select rubric'
                                      }
                                      disabled={disabled}
                                      saving={savingKey === context}
                                      onChange={rubric =>
                                        void saveAssociation(context, association, rubric)
                                      }
                                      onPreview={setPreviewUuid}
                                    />
                                    {!association && effectiveRubric && (
                                      <Button
                                        type='button'
                                        variant='link'
                                        className='h-auto p-0 text-xs'
                                        onClick={() => setPreviewUuid(effectiveRubric)}
                                      >
                                        View inherited course rubric
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {assessments.length > 0 && lessons.length === 0 && (
                <EmptyState
                  variant='compact'
                  title='Add lessons first'
                  description='Whole-course rubrics are ready. Add lessons in Lesson content to attach individual lesson rubrics.'
                />
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
            </>
          )}
        </CardContent>
      </Card>
      {!failed && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Course rubrics</CardTitle>
            <CardDescription>
              Select a rubric associated with this course to see its criteria and scoring levels.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {rubricIds.length === 0 ? (
              <EmptyState
                variant='compact'
                title='No rubrics associated yet'
                description='Attach a rubric to the course, an assessment component, or a lesson above.'
              />
            ) : (
              <>
                {titlesFailed && (
                  <EmptyState
                    variant='compact'
                    title='Could not load rubric names'
                    action={
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        onClick={() => void rubricTitlesQuery.refetch()}
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
