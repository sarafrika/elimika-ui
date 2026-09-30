'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, ListChecks, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
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
import { isForbidden, retryUnlessClientOrSearchError } from '@/lib/api-errors';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getCoursePrerequisitesOptions,
  getCoursePrerequisitesQueryKey,
  getPublishedCoursesOptions,
  replaceCoursePrerequisitesMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { CoursePrerequisite, GetPublishedCoursesResponse } from '@/services/client/types.gen';

type PrerequisiteRow = {
  courseUuid: string;
  name: string;
  isMandatory: boolean;
};

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
  courseUuid,
  isLive,
}: {
  courseUuid: string;
  /** Published and admin-approved: edits go to the draft for review. */
  isLive: boolean;
}) {
  const queryClient = useQueryClient();
  const headingId = useId();
  const [rows, setRows] = useState<PrerequisiteRow[] | null>(null);
  const [submittedForReview, setSubmittedForReview] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const query = useQuery({
    ...getCoursePrerequisitesOptions({ path: { uuid: courseUuid } }),
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.entity,
    retry: retryUnlessClientOrSearchError,
  });
  const mutation = useMutation(replaceCoursePrerequisitesMutation());

  const serverRows = toRows(query.data?.data);
  const current = rows ?? serverRows;
  const dirty = rows !== null;

  const update = (next: PrerequisiteRow[]) => {
    setRows(next);
    setSaveError(null);
  };

  const save = () => {
    setSaveError(null);
    mutation.mutate(
      {
        path: { uuid: courseUuid },
        body: {
          prerequisites: current.map(row => ({
            prerequisite_course_uuid: row.courseUuid,
            is_mandatory: row.isMandatory,
          })),
        },
      },
      {
        onSuccess: response => {
          const saved = response?.data ?? [];
          const wentToDraft =
            saved.some(item => item.course_uuid && item.course_uuid !== courseUuid) ||
            (saved.length === 0 && isLive);
          if (wentToDraft) {
            // The live list is unchanged until review; keep showing what was submitted.
            setRows(toRows(saved));
            setSubmittedForReview(true);
            toast.success('Submitted for review');
          } else {
            setRows(null);
            setSubmittedForReview(false);
            toast.success('Prerequisites saved');
          }
          void queryClient.invalidateQueries({
            queryKey: getCoursePrerequisitesQueryKey({ path: { uuid: courseUuid } }),
          });
        },
        onError: error => {
          const message = getErrorMessage(error, 'Could not save the prerequisites.');
          setSaveError(message);
          toast.error(message);
        },
      }
    );
  };

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
              Learners keep seeing the current prerequisites until an admin approves this
              change.
            </AlertDescription>
          </Alert>
        ) : null}

        {query.isLoading ? (
          <div className='space-y-2' aria-busy='true'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
        ) : query.isError ? (
          <EmptyState
            variant='compact'
            title={
              isForbidden(query.error)
                ? 'Only the course owner can manage prerequisites'
                : 'Could not load the prerequisites'
            }
            description={getErrorMessage(query.error, 'Try again in a moment.')}
            action={
              <Button variant='outline' size='sm' onClick={() => void query.refetch()}>
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
                value=''
                onChange={(value, option) => {
                  if (!value || !option) return;
                  if (current.some(row => row.courseUuid === value)) return;
                  update([...current, { courseUuid: value, name: option.label, isMandatory: true }]);
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

            <div className='flex flex-wrap justify-end gap-2'>
              {dirty ? (
                <Button
                  variant='ghost'
                  onClick={() => {
                    setRows(null);
                    setSaveError(null);
                    setSubmittedForReview(false);
                  }}
                  disabled={mutation.isPending}
                >
                  Discard changes
                </Button>
              ) : null}
              <Button onClick={save} disabled={!dirty || mutation.isPending}>
                {mutation.isPending ? <Spinner /> : null}
                {isLive ? 'Submit for review' : 'Save prerequisites'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PrerequisiteRowItem({
  row,
  onToggle,
  onRemove,
}: {
  row: PrerequisiteRow;
  onToggle: (isMandatory: boolean) => void;
  onRemove: () => void;
}) {
  const switchId = useId();
  return (
    <li className='flex flex-wrap items-center gap-3 px-3 py-2.5'>
      <span className='min-w-0 flex-1 truncate text-sm font-medium'>{row.name}</span>
      <div className='flex items-center gap-2'>
        <Switch id={switchId} checked={row.isMandatory} onCheckedChange={onToggle} />
        <Label htmlFor={switchId} className='text-muted-foreground w-24 text-xs font-normal'>
          {row.isMandatory ? 'Required' : 'Recommended'}
        </Label>
      </div>
      <Button
        variant='ghost'
        size='icon'
        className='size-8'
        onClick={onRemove}
        aria-label={`Remove ${row.name}`}
      >
        <Trash2 className='size-4' />
      </Button>
    </li>
  );
}
