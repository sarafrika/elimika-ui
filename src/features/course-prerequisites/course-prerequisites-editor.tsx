'use client';

import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, ListChecks, Trash2 } from 'lucide-react';
import { type Ref, type RefObject, useId, useImperativeHandle, useState } from 'react';
import { toast } from 'sonner';
import { EntityCombobox, type EntityOption } from '@/components/search/entity-combobox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { isForbidden } from '@/lib/api-errors';
import { getErrorMessage } from '@/lib/error-utils';
import type { CoursePrerequisiteDraft, CourseSetupDrafts, CourseSetupSectionRef } from '@/lib/course-setup';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getCoursePrerequisitesOptions,
  getCoursePrerequisitesQueryKey,
  getPublishedCoursesOptions,
  replaceCoursePrerequisitesMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { CoursePrerequisite, GetPublishedCoursesResponse } from '@/services/client/types.gen';

type PrerequisiteRow = CoursePrerequisiteDraft;

function toRows(items: readonly CoursePrerequisite[] | undefined): PrerequisiteRow[] {
  return (items ?? [])
    .filter((item): item is CoursePrerequisite & { prerequisite_course_uuid: string } =>
      Boolean(item.prerequisite_course_uuid)
    )
    .map(item => ({
      courseUuid: item.prerequisite_course_uuid,
      name: item.prerequisite_course_name ?? 'Course',
      isMandatory: item.is_mandatory !== false,
    }));
}

/**
 * Owner-only editor for the courses a learner should take first
 * (`GET/PUT /api/v1/courses/{uuid}/prerequisites`). The PUT replaces the whole list.
 *
 * On a live, approved course the API writes to the course's shadow draft and submits it
 * for review, answering with the draft's rows (`course_uuid` is the draft). The live
 * course keeps its prerequisites until an admin approves, so the editor keeps showing
 * what was submitted and says so.
 */
export function CoursePrerequisitesEditor({
  courseUuid = '',
  isLive = false,
  saveRef,
  draftsRef,
  isSaving = false,
}: {
  courseUuid?: string;
  /** Published and admin-approved: edits go to the draft for review. */
  isLive?: boolean;
  saveRef?: Ref<CourseSetupSectionRef>;
  draftsRef?: RefObject<CourseSetupDrafts>;
  isSaving?: boolean;
}) {
  const queryClient = useQueryClient();
  const headingId = useId();
  const [rows, setLocalRows] = useState<PrerequisiteRow[] | null>(() => draftsRef?.current.prerequisites ?? null);
  const setRows = (next: PrerequisiteRow[] | null) => {
    setLocalRows(next);
    if (draftsRef) draftsRef.current.prerequisites = next;
  };
  const [submittedForReview, setSubmittedForReview] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const query = useQuery({
    ...(courseUuid
      ? getCoursePrerequisitesOptions({ path: { uuid: courseUuid } })
      : { queryKey: getCoursePrerequisitesQueryKey({ path: { uuid: '' } }), queryFn: skipToken }),
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.entity,
  });
  const mutation = useMutation(replaceCoursePrerequisitesMutation());
  const busy = isSaving || mutation.isPending;
  const responseError = query.data?.error || query.data?.success === false
    ? new Error(query.data.message || 'Could not load the prerequisites.')
    : null;

  const serverRows = toRows(responseError ? undefined : query.data?.data);
  const current = rows ?? serverRows;
  const dirty = rows !== null;

  const update = (next: PrerequisiteRow[]) => {
    setRows(next);
    setSaveError(null);
    setSubmittedForReview(false);
  };

  const save = async (uuid: string, queued = false) => {
    if (!uuid) return;
    setSaveError(null);
    try {
      const response = await mutation.mutateAsync({
        path: { uuid },
        body: {
          prerequisites: current.map(row => ({
            prerequisite_course_uuid: row.courseUuid,
            is_mandatory: row.isMandatory,
          })),
        },
      });
      if (response.error || response.success === false) {
        throw new Error(response.message || 'Could not save the prerequisites.');
      }
      const saved = response.data ?? [];
      const wentToDraft =
        saved.some(item => item.course_uuid && item.course_uuid !== uuid) ||
        (saved.length === 0 && isLive);
      if (wentToDraft) {
        // Keep the submitted draft visible until review.
        setRows(toRows(saved));
        setSubmittedForReview(true);
        if (!queued) toast.success('Submitted for review');
      } else {
        setRows(null);
        setSubmittedForReview(false);
        queryClient.setQueryData(getCoursePrerequisitesQueryKey({ path: { uuid } }), response);
        if (!queued) toast.success('Prerequisites saved');
      }
      if (draftsRef) draftsRef.current.prerequisites = null;
      void queryClient.invalidateQueries({
        queryKey: getCoursePrerequisitesQueryKey({ path: { uuid } }),
      });
    } catch (error) {
      const message = getErrorMessage(error, 'Could not save the prerequisites.');
      setSaveError(message);
      if (!queued) toast.error(message);
      throw error;
    }
  };

  useImperativeHandle(saveRef, () => ({
    savePending: async uuid => {
      if (rows !== null && !submittedForReview) await save(uuid, true);
    },
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle id={headingId} className='flex items-center gap-2 text-lg'>
          <ListChecks className='text-primary size-5' aria-hidden />
          Prerequisites
        </CardTitle>
        <CardDescription>
          Courses a learner should complete before this one. Required ones are shown as
          &ldquo;Complete X first&rdquo;; recommended ones as a suggestion.
          {isLive ? ' This course is live, so changes are submitted for review.' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {submittedForReview ? (
          <Alert>
            <ClipboardCheck className='size-4' />
            <AlertTitle>Submitted for review</AlertTitle>
            <AlertDescription>
              Learners keep seeing the current prerequisites until an admin approves this change.
            </AlertDescription>
          </Alert>
        ) : null}

        {query.isLoading ? (
          <div className='space-y-2' aria-busy='true'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
        ) : query.isError || responseError ? (
          <EmptyState
            variant='compact'
            title={
              isForbidden(query.error)
                ? 'Only the course owner can manage prerequisites'
                : 'Could not load the prerequisites'
            }
            description={getErrorMessage(query.error ?? responseError, 'Try again in a moment.')}
            action={
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => void query.refetch()}
              >
                Try again
              </Button>
            }
          />
        ) : (
          <>
            {current.length === 0 ? (
              <EmptyState
                variant='compact'
                title='No prerequisites'
                description='Anyone can start this course. Add a course below if learners should take it first.'
              />
            ) : (
              <ul className='divide-border divide-y rounded-lg border'>
                {current.map(row => (
                  <PrerequisiteRowItem
                    key={row.courseUuid}
                    row={row}
                    disabled={busy}
                    onToggle={isMandatory =>
                      update(
                        current.map(item =>
                          item.courseUuid === row.courseUuid ? { ...item, isMandatory } : item
                        )
                      )
                    }
                    onRemove={() =>
                      update(current.filter(item => item.courseUuid !== row.courseUuid))
                    }
                  />
                ))}
              </ul>
            )}

            <div className='space-y-1.5'>
              <Label>Add a prerequisite course</Label>
              <EntityCombobox
                disabled={busy}
                value=''
                onChange={(value, option) => {
                  if (!value || !option) return;
                  if (current.some(row => row.courseUuid === value)) return;
                  update([
                    ...current,
                    { courseUuid: value, name: option.label, isMandatory: true },
                  ]);
                }}
                queryOptions={q =>
                  getPublishedCoursesOptions({
                    query: { ...(q ? { q } : {}), pageable: { page: 0, size: 20 } },
                  })
                }
                toOptions={(data: GetPublishedCoursesResponse) =>
                  (data.data?.content ?? [])
                    .filter(course => Boolean(course.uuid && course.name))
                    .map(
                      (course): EntityOption => ({
                        value: course.uuid ?? '',
                        label: course.name ?? '',
                        disabled:
                          course.uuid === courseUuid ||
                          current.some(row => row.courseUuid === course.uuid),
                      })
                    )
                }
                placeholder='Search published courses…'
                searchPlaceholder='Search courses…'
                emptyText='No published course matches'
                aria-label='Add a prerequisite course'
              />
            </div>

            {saveError ? (
              <p className='text-destructive text-sm' role='alert'>
                {saveError}
              </p>
            ) : null}

            {!courseUuid && dirty ? (
              <p className='text-muted-foreground flex items-center gap-2 text-sm' role='status'>
                {isSaving ? <Spinner /> : null}
                Prerequisites will be saved after the course is created.
              </p>
            ) : null}
            <div className='flex flex-wrap justify-end gap-2'>
              {dirty ? (
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => {
                    setRows(null);
                    setSaveError(null);
                    setSubmittedForReview(false);
                  }}
                  disabled={busy}
                >
                  Discard changes
                </Button>
              ) : null}
              {courseUuid ? (
                <Button
                  type='button'
                  onClick={() => void save(courseUuid).catch(() => undefined)}
                  disabled={!dirty || busy}
                >
                  {mutation.isPending ? <Spinner /> : null}
                  {isLive ? 'Submit for review' : 'Save prerequisites'}
                </Button>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PrerequisiteRowItem({
  row,
  disabled,
  onToggle,
  onRemove,
}: {
  row: PrerequisiteRow;
  disabled: boolean;
  onToggle: (isMandatory: boolean) => void;
  onRemove: () => void;
}) {
  const switchId = useId();
  return (
    <li className='flex flex-wrap items-center gap-3 px-3 py-2.5'>
      <span className='min-w-0 flex-1 truncate text-sm font-medium'>{row.name}</span>
      <div className='flex items-center gap-2'>
        <Switch id={switchId} checked={row.isMandatory} onCheckedChange={onToggle} disabled={disabled} />
        <Label htmlFor={switchId} className='text-muted-foreground w-24 text-xs font-normal'>
          {row.isMandatory ? 'Required' : 'Recommended'}
        </Label>
      </div>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='size-8'
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${row.name}`}
      >
        <Trash2 className='size-4' />
      </Button>
    </li>
  );
}
