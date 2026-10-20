'use client';

import { Button } from '@/components/ui/button';
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
import { useCoursesByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import {
  associateRubricMutation,
  dissociateRubricByContextMutation,
  getCourseRubricsQueryKey,
  getRubricsByContextOptions,
  getRubricsByContextQueryKey,
  updateAssociationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { persistEvaluationAssociation } from '../../../_components/course-evaluation-utils';
import {
  EvaluationRubricPicker,
  type SavedEvaluationRubric,
} from '../../../_components/evaluation-rubric-picker';
import { EvaluationRubricPreview } from '../../../_components/evaluation-rubric-preview';
import type { ProgramFormValues } from '../program-schema';
import { ProgramCourseEvaluations } from './ProgramCourseEvaluations';

export function ProgramEvaluation({
  programUuid,
  creatorUuid,
  associatedBy,
  onPendingChange,
}: {
  programUuid: string;
  creatorUuid: string;
  associatedBy?: string;
  onPendingChange: (pending: boolean) => void;
}) {
  const { control } = useFormContext<ProgramFormValues>();
  const courses = useWatch({ control, name: 'courses' });
  const courseIds = useMemo(() => courses.map(course => course.courseUuid), [courses]);
  const { courseMap } = useCoursesByIds(courseIds);
  const [chosenCourse, setChosenCourse] = useState('');
  const courseUuid = courseIds.includes(chosenCourse) ? chosenCourse : courseIds[0];


  // - recheck the programEvaluation for different courses in the program and allow users to see details of quizzes and assignments
  // whenn i hover a quiz/assignment, dont show a background effect
  // in the details sheet, rubrics is not showing properly.... you are to show the matrix of the scoring level and criteria of the rubrics. if there are no rubrics attached, no need to show the rubric section at all
  // for quiz questions, there is a way the quiz questions is shown to instructors when they are trying to schedule a quiz in the training dashboard section, use the same template to show quiz on this page



  // i see that the course-management (create program, create courses) was kept under the /courses folder for course-creators
  // is it possible to move those files to course-management, and update all the routes such that it points to my-courses tab (which is course-managemen?)
  // after the update, do not run build, typecheck or lint

  return (
    <section className='space-y-4' aria-label='Program evaluation'>
      <h3 className='text-sm font-medium'>Evaluation per course</h3>
      <p className='text-muted-foreground text-sm'>
        Review each course's lesson assignments and quizzes.
      </p>
      {!courseUuid ? (
        <EmptyState
          variant='compact'
          title='No courses selected'
          description='Add courses in step 2 to attach their evaluations.'
        />
      ) : (
        <>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='program-evaluation-course'>Course to evaluate</Label>
              <Select value={courseUuid} onValueChange={setChosenCourse}>
                <SelectTrigger id='program-evaluation-course' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {courseIds.map((uuid, index) => (
                    <SelectItem key={uuid} value={uuid}>
                      {courseMap[uuid]?.name ?? `Course ${index + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <CourseProgramEvaluation
              key={courseUuid}
              courseUuid={courseUuid}
              programUuid={programUuid}
              creatorUuid={creatorUuid}
              associatedBy={associatedBy}
              onPendingChange={onPendingChange}
            />
          </div>
          <ProgramCourseEvaluations
            key={courseUuid}
            courseUuid={courseUuid}
            courseTitle={
              courseMap[courseUuid]?.name ?? `Course ${courseIds.indexOf(courseUuid) + 1}`
            }
          />
        </>
      )}
    </section>
  );
}

function CourseProgramEvaluation({
  courseUuid,
  programUuid,
  creatorUuid,
  associatedBy,
  onPendingChange,
}: {
  courseUuid: string;
  programUuid: string;
  creatorUuid: string;
  associatedBy?: string;
  onPendingChange: (pending: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const context = `program:${programUuid}:evaluation`;
  const options = { path: { courseUuid, context }, query: { pageable: { page: 0, size: 20 } } };
  const query = useQuery({
    ...getRubricsByContextOptions(options),
    enabled: Boolean(courseUuid && programUuid),
    staleTime: STALE_TIMES.entity,
  });
  const associate = useMutation(associateRubricMutation());
  const update = useMutation(updateAssociationMutation());
  const remove = useMutation(dissociateRubricByContextMutation());
  const [selected, setSelected] = useState<SavedEvaluationRubric | null>(null);
  const [previewUuid, setPreviewUuid] = useState<string | null>(null);
  const failed = query.isError || Boolean(query.data?.error) || query.data?.success === false;
  const existing = failed
    ? undefined
    : query.data?.data?.content?.find(
      row => row.usage_context === context && row.course_uuid === courseUuid
    );
  const save = useMutation({
    mutationFn: async (rubric: SavedEvaluationRubric | null) => {
      await persistEvaluationAssociation(
        { courseUuid, context, associatedBy, existing, rubricUuid: rubric?.uuid ?? null },
        {
          associate: input => associate.mutateAsync(input),
          update: input => update.mutateAsync(input),
          remove: input => remove.mutateAsync(input),
        }
      );
      setSelected(rubric);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getRubricsByContextQueryKey(options) }),
        queryClient.invalidateQueries({
          queryKey: [
            {
              _id: getCourseRubricsQueryKey({ path: { courseUuid }, query: { pageable: {} } })[0]
                ._id,
            },
          ],
        }),
      ]);
    },
    onError: error =>
      toast.error(error instanceof Error ? error.message : 'Unable to attach evaluation'),
    onSuccess: () => toast.success('Course evaluation saved'),
  });
  useEffect(() => {
    onPendingChange(save.isPending);
    return () => onPendingChange(false);
  }, [save.isPending, onPendingChange]);
  if (query.isLoading) return <Skeleton className='h-16 max-w-lg' />;
  if (failed)
    return (
      <EmptyState
        variant='compact'
        title='Unable to load course evaluation'
        action={
          <Button type='button' variant='outline' onClick={() => void query.refetch()}>
            Try again
          </Button>
        }
      />
    );
  return (
    <>
      <div className='max-w-lg space-y-2'>
        <Label>Evaluation rubric</Label>
        <EvaluationRubricPicker
          creatorUuid={creatorUuid}
          value={existing?.rubric_uuid}
          title={selected?.uuid === existing?.rubric_uuid ? selected?.title : undefined}
          label='Course evaluation rubric'
          saving={save.isPending}
          disabled={save.isPending || query.isFetching}
          onChange={rubric => save.mutate(rubric)}
          onPreview={setPreviewUuid}
        />
      </div>
      <Sheet
        open={Boolean(previewUuid)}
        onOpenChange={open => {
          if (!open) setPreviewUuid(null);
        }}
      >
        <SheetContent className='w-full overflow-y-auto sm:max-w-4xl'>
          <SheetHeader>
            <SheetTitle>Evaluation rubric</SheetTitle>
            <SheetDescription>Review the criteria and scoring levels.</SheetDescription>
          </SheetHeader>
          <div className='p-4'>
            {previewUuid && <EvaluationRubricPreview rubricUuid={previewUuid} />}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
