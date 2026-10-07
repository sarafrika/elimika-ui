'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useCoursesByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import {
  associateRubricMutation,
  updateAssociationMutation,
  dissociateRubricByContextMutation,
  getRubricsByContextOptions,
  getRubricsByContextQueryKey,
  getCourseRubricsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import {
  EvaluationRubricPicker,
  type SavedEvaluationRubric,
} from '../../../_components/evaluation-rubric-picker';
import { EvaluationRubricPreview } from '../../../_components/evaluation-rubric-preview';
import { persistEvaluationAssociation } from '../../../_components/course-evaluation-utils';
import type { ProgramFormValues } from '../program-schema';

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
  return (
    <section className='space-y-4' aria-label='Program evaluation'>
      <h3 className='text-sm font-medium'>Evaluation per course</h3>
      <p className='text-muted-foreground text-sm'>
        Select each course and attach its evaluation rubric. Changes are saved to this program
        immediately.
      </p>
      {!courseUuid ? (
        <EmptyState
          variant='compact'
          title='No courses selected'
          description='Add courses in step 2 to attach their evaluations.'
        />
      ) : (
        <>
          <div className='max-w-lg space-y-2'>
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
