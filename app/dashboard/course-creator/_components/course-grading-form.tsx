'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
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
  getCourseEvaluationPlanOptions,
  getCourseEvaluationPlanQueryKey,
  getLineItemsQueryKey,
  updateCourseEvaluationPlanMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { Component, CourseAssessmentLineItem, LessonRow } from '@/services/client/types.gen';
import { EvaluationRubricPicker } from './evaluation-rubric-picker';
import { EvaluationRubricPreview } from './evaluation-rubric-preview';

type CourseGradingFormProps = {
  courseUuid?: string;
  creatorUuid?: string;
  title?: string;
};

type PlanComponent = Component & { assessment_uuid: string; index: number };
type CellDraft = {
  lessonUuid: string;
  lessonTitle: string;
  component: PlanComponent;
  original?: CourseAssessmentLineItem;
  enabled: boolean;
  rubricUuid: string;
  rubricTitle?: string;
};

export default function CourseGradingForm({
  courseUuid,
  creatorUuid,
  title = 'Course grading plan',
}: CourseGradingFormProps) {
  if (!courseUuid)
    return <EmptyState variant='compact' title='Save the course to configure grading' />;
  return (
    <SavedCourseGradingForm
      key={courseUuid}
      courseUuid={courseUuid}
      creatorUuid={creatorUuid}
      title={title}
    />
  );
}

function SavedCourseGradingForm({
  courseUuid,
  creatorUuid,
  title,
}: {
  courseUuid: string;
  creatorUuid?: string;
  title: string;
}) {
  const queryClient = useQueryClient();
  const options = { path: { courseUuid } };
  const query = useQuery({
    ...getCourseEvaluationPlanOptions(options),
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.entity,
  });
  const failed = query.isError || Boolean(query.data?.error) || query.data?.success === false;
  const plan = failed ? undefined : query.data?.data;
  const components = useMemo(
    () =>
      (plan?.components ?? []).flatMap((component, index): PlanComponent[] =>
        component.assessment_uuid
          ? [{ ...component, assessment_uuid: component.assessment_uuid, index }]
          : []
      ),
    [plan?.components]
  );
  const lessons = useMemo(
    () =>
      (plan?.lessons ?? []).filter((lesson): lesson is LessonRow & { lesson_uuid: string } =>
        Boolean(lesson.lesson_uuid)
      ),
    [plan?.lessons]
  );
  const [draft, setDraft] = useState<CellDraft | null>(null);
  const [previewUuid, setPreviewUuid] = useState<string | null>(null);
  const update = useMutation(updateCourseEvaluationPlanMutation());
  const originalEnabled = Boolean(draft?.original && draft.original.active !== false);
  const changed = Boolean(
    draft &&
      (draft.enabled !== originalEnabled ||
        (draft.enabled && draft.rubricUuid !== (draft.original?.rubric_uuid ?? '')))
  );

  async function save() {
    if (!draft || !changed || update.isPending) return;
    try {
      const result = await update.mutateAsync({
        path: { courseUuid },
        body: {
          cells: [
            {
              lesson_uuid: draft.lessonUuid,
              assessment_uuid: draft.component.assessment_uuid,
              enabled: draft.enabled,
              ...(draft.enabled
                ? {
                    ...(draft.rubricUuid ? { rubric_uuid: draft.rubricUuid } : {}),
                    ...(draft.original?.quiz_uuid ? { quiz_uuid: draft.original.quiz_uuid } : {}),
                    ...(draft.original?.assignment_uuid
                      ? { assignment_uuid: draft.original.assignment_uuid }
                      : {}),
                  }
                : {}),
            },
          ],
        },
      });
      if (result.error || result.success === false)
        throw new Error(getErrorMessage(result, 'Unable to save evaluation plan'));
      if (result.data) queryClient.setQueryData(getCourseEvaluationPlanQueryKey(options), result);
      else
        await queryClient.invalidateQueries({ queryKey: getCourseEvaluationPlanQueryKey(options) });
      void queryClient.invalidateQueries({
        queryKey: getLineItemsQueryKey({
          path: { courseUuid, assessmentUuid: draft.component.assessment_uuid },
        }),
      });
      setDraft(null);
      setPreviewUuid(null);
      toast.success('Course evaluation plan saved');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save evaluation plan'));
    }
  }

  if (query.isLoading) return <Skeleton className='h-64 w-full' />;
  if (failed || !plan)
    return (
      <EmptyState
        variant='compact'
        title='Unable to load course evaluation plan'
        description={getErrorMessage(query.error ?? query.data, 'No evaluation plan was returned.')}
        action={
          <Button type='button' variant='outline' onClick={() => void query.refetch()}>
            Try again
          </Button>
        }
      />
    );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Select a lesson and assessment component to configure its grading.
          </CardDescription>
          <p className='text-sm'>
            Course pass mark:{' '}
            <span className='font-semibold'>
              {plan.pass_mark == null ? 'Not set' : `${plan.pass_mark}%`}
            </span>
          </p>
        </CardHeader>
        <CardContent>
          {components.length === 0 || lessons.length === 0 ? (
            <EmptyState
              variant='compact'
              title='No lesson grading cells yet'
              description='Add lessons and per-lesson assessment components to configure grading.'
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lesson</TableHead>
                  {components.map(component => (
                    <TableHead key={component.assessment_uuid} className='min-w-48'>
                      <span className='block'>{component.title || 'Untitled component'}</span>
                      <span className='text-muted-foreground text-xs'>
                        {component.weight_percentage ?? 0}%
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lessons.map(lesson => (
                  <TableRow key={lesson.lesson_uuid}>
                    <TableCell className='min-w-48 font-medium'>
                      {lesson.lesson_number != null && (
                        <span className='text-muted-foreground mr-2'>{lesson.lesson_number}.</span>
                      )}
                      {lesson.title || 'Untitled lesson'}
                    </TableCell>
                    {components.map(component => {
                      const cell = lesson.cells?.[component.index] ?? undefined;
                      const enabled = Boolean(cell && cell.active !== false);
                      return (
                        <TableCell key={component.assessment_uuid}>
                          <Button
                            type='button'
                            variant={enabled ? 'outline' : 'ghost'}
                            className='w-full'
                            disabled={update.isPending}
                            aria-label={`Edit ${lesson.title || 'lesson'} — ${component.title || 'assessment'}`}
                            onClick={() => {
                              setPreviewUuid(null);
                              setDraft({
                                lessonUuid: lesson.lesson_uuid,
                                lessonTitle: lesson.title || 'Untitled lesson',
                                component,
                                original: cell,
                                enabled,
                                rubricUuid: cell?.rubric_uuid ?? '',
                              });
                            }}
                          >
                            {enabled
                              ? cell?.rubric_uuid || component.rubric_uuid
                                ? 'Rubric assigned'
                                : 'Included'
                              : 'None'}
                          </Button>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Sheet
        open={Boolean(draft)}
        onOpenChange={open => {
          if (!open && !update.isPending) {
            setDraft(null);
            setPreviewUuid(null);
          }
        }}
      >
        <SheetContent className='w-full overflow-y-auto sm:max-w-2xl'>
          <SheetHeader>
            <SheetTitle>Edit lesson grading</SheetTitle>
            <SheetDescription>
              {draft?.lessonTitle} — {draft?.component.title}
            </SheetDescription>
          </SheetHeader>
          {draft && (
            <div className='space-y-6 p-4'>
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='include-lesson-grading'
                  checked={draft.enabled}
                  disabled={update.isPending}
                  onCheckedChange={checked => setDraft({ ...draft, enabled: checked === true })}
                />
                <Label htmlFor='include-lesson-grading'>
                  Include this lesson in the assessment component
                </Label>
              </div>
              {draft.enabled && (
                <div className='space-y-2'>
                  <Label>Grading rubric</Label>
                  <EvaluationRubricPicker
                    creatorUuid={creatorUuid}
                    value={draft.rubricUuid}
                    title={draft.rubricTitle}
                    label='Lesson grading rubric'
                    emptyLabel={draft.component.rubric_uuid ? 'Use component rubric' : 'No rubric'}
                    disabled={update.isPending}
                    onChange={rubric => {
                      setPreviewUuid(null);
                      setDraft({
                        ...draft,
                        rubricUuid: rubric?.uuid ?? '',
                        rubricTitle: rubric?.title,
                      });
                    }}
                    onPreview={setPreviewUuid}
                  />
                  <p className='text-muted-foreground text-sm'>
                    Leave blank to use the assessment component’s rubric, if one is configured.
                  </p>
                </div>
              )}
              <div className='flex gap-2'>
                <Button
                  type='button'
                  disabled={!changed || update.isPending}
                  onClick={() => void save()}
                >
                  {update.isPending && <Spinner className='size-4' />}
                  {update.isPending ? 'Saving…' : 'Save grading'}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  disabled={update.isPending}
                  onClick={() => setDraft(null)}
                >
                  Cancel
                </Button>
              </div>
              {draft.enabled && previewUuid && <EvaluationRubricPreview rubricUuid={previewUuid} />}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
