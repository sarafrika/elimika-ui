'use client';

import { AsyncSection } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Spinner from '../../../../components/ui/spinner';
import {
  addCourseAssessmentMutation,
  deleteCourseAssessmentMutation,
  deleteLineItemMutation,
  getCourseAssessmentsInfiniteOptions,
  getCourseAssessmentsInfiniteQueryKey,
  getCourseAssessmentsQueryKey,
  getCourseEvaluationPlanQueryKey,
  getLineItemsOptions,
  getLineItemsQueryKey,
  updateCourseAssessmentMutation,
} from '../../../../services/client/@tanstack/react-query.gen';
import type {
  CourseAssessment,
  CourseAssessmentLineItem,
  CourseAssessmentWritable,
} from '../../../../services/client/types.gen';
import { ASSESSMENT_TYPES } from '../rubrics/rubric-manager';
import { CATEGORY_META, LinkItemsModal, TaskItemType } from './assesment-link-items';
import { CourseGradeBandsForm } from './course-grade-bands-form';
import { CoursePassMarkForm } from './course-pass-mark-form';

// ─── Types ────────────────────────────────────────────────────────────────────

type CourseAssessmentStructureProps = {
  courseUuid: string;
  createdBy: string;
};

type Assessment = CourseAssessment & { uuid: string };

// ─── Per-row line items component ─────────────────────────────────────────────
// Each assessment row fetches its own line items independently so the list
// updates live after link / unlink actions without any parent state.

function AssessmentLineItems({
  courseUuid,
  assessmentUuid,
}: {
  courseUuid: string;
  assessmentUuid: string;
}) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    ...getLineItemsOptions({ path: { courseUuid, assessmentUuid } }),
    enabled: Boolean(courseUuid && assessmentUuid),
    staleTime: STALE_TIMES.entity,
  });

  const lineItems: CourseAssessmentLineItem[] =
    data?.error || data?.success === false || !Array.isArray(data?.data) ? [] : data.data;

  const deleteLineItemMut = useMutation(deleteLineItemMutation());

  function handleRemove(lineItemUuid: string) {
    deleteLineItemMut.mutate(
      { path: { courseUuid, assessmentUuid, lineItemUuid } },
      {
        onSuccess: () => {
          toast.success('Item removed.');
          qc.invalidateQueries({
            queryKey: getLineItemsQueryKey({ path: { courseUuid, assessmentUuid } }),
          });
        },
        onError: err => toast.error(getErrorMessage(err, 'Failed to remove item.')),
      }
    );
  }

  if (isLoading) {
    return <Skeleton className='h-5 w-24 rounded-full' />;
  }

  if (lineItems.length === 0) return null;

  return (
    <>
      {lineItems.map(li => {
        const itemType = (li.item_type?.toLowerCase() ?? 'assignment') as TaskItemType;
        const meta = CATEGORY_META[itemType] ?? CATEGORY_META['assignment'];
        const Icon = meta.icon;

        return (
          <span
            key={li.uuid}
            className={`group flex w-max max-w-[200px] items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.color}`}
          >
            <Icon size={11} className='shrink-0' />
            <span className='truncate'>{li.title}</span>
            {/* ×  remove button — visible on hover */}
            <button
              type='button'
              title='Remove this item'
              disabled={deleteLineItemMut.isPending}
              onClick={() => li.uuid && handleRemove(li.uuid)}
              className='hover:text-destructive ml-0.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed'
            >
              {deleteLineItemMut.isPending ? <Spinner className='h-2.5 w-2.5' /> : <X size={10} />}
            </button>
          </span>
        );
      })}
    </>
  );
}

type AssessmentDraft = {
  id: string;
  original?: Assessment;
  title: string;
  assessment_type: string;
  description: string;
  weight_percentage: number | '';
  savedWithoutId?: boolean;
};

type DraftErrors = Partial<Record<'title' | 'assessment_type' | 'weight_percentage', string>>;

function newAssessmentDraft(assessment?: Assessment): AssessmentDraft {
  return {
    id: assessment?.uuid ?? crypto.randomUUID(),
    original: assessment,
    title: assessment?.title ?? '',
    assessment_type: assessment?.assessment_type ?? '',
    description: assessment?.description ?? '',
    weight_percentage: assessment?.weight_percentage ?? '',
  };
}

function AssessmentBatchEditor({
  courseUuid,
  createdBy,
  assessments,
  editing,
  onCancel,
  onRefresh,
  onSaved,
  disabled,
}: CourseAssessmentStructureProps & {
  assessments: Assessment[];
  editing: boolean;
  onCancel: () => void;
  onRefresh: () => Promise<void>;
  onSaved: () => void;
  disabled: boolean;
}) {
  const [drafts, setDrafts] = useState<AssessmentDraft[]>(() =>
    editing ? assessments.map(newAssessmentDraft) : [newAssessmentDraft()]
  );
  const [removed, setRemoved] = useState<Assessment[]>([]);
  const [errors, setErrors] = useState<Record<string, DraftErrors>>({});
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);
  const createMut = useMutation(addCourseAssessmentMutation());
  const updateMut = useMutation(updateCourseAssessmentMutation());
  const deleteMut = useMutation(deleteCourseAssessmentMutation());

  const draftUuids = new Set([
    ...drafts.flatMap(draft => (draft.original ? [draft.original.uuid] : [])),
    ...removed.map(assessment => assessment.uuid),
  ]);
  const savedWeight = editing
    ? 0
    : assessments.reduce(
        (sum, assessment) =>
          sum + (draftUuids.has(assessment.uuid) ? 0 : assessment.weight_percentage),
        0
      );
  const totalWeight = Number(
    (
      savedWeight +
      drafts.reduce(
        (sum, draft) =>
          sum + (!editing && draft.savedWithoutId ? 0 : Number(draft.weight_percentage)),
        0
      )
    ).toFixed(2)
  );
  const hasValidTotal = Math.abs(totalWeight - 100) < 0.001;

  function patchDraft(id: string, patch: Partial<AssessmentDraft>) {
    setDrafts(current => current.map(draft => (draft.id === id ? { ...draft, ...patch } : draft)));
    setErrors(current => ({ ...current, [id]: {} }));
    setSaveError('');
  }

  function removeDraft(draft: AssessmentDraft) {
    const original = draft.original;
    if (original) setRemoved(current => [...current, original]);
    setDrafts(current => current.filter(item => item.id !== draft.id));
    setSaveError('');
  }

  async function saveAll() {
    if (saving.current || disabled || !courseUuid) return;
    const nextErrors: Record<string, DraftErrors> = {};
    for (const draft of drafts) {
      const rowErrors: DraftErrors = {};
      if (!draft.title.trim()) rowErrors.title = 'Title is required.';
      if (!draft.assessment_type) rowErrors.assessment_type = 'Select an assessment type.';
      if (
        draft.weight_percentage === '' ||
        !Number.isFinite(draft.weight_percentage) ||
        draft.weight_percentage < 0 ||
        draft.weight_percentage > 100
      )
        rowErrors.weight_percentage = 'Enter a weight between 0 and 100.';
      if (Object.keys(rowErrors).length) nextErrors[draft.id] = rowErrors;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    if (!hasValidTotal) {
      setSaveError('The total weight of all course assessments must be 100%.');
      return;
    }
    if (drafts.length === 0) return;

    saving.current = true;
    setIsSaving(true);
    setSaveError('');
    let failed = false;
    let changed = false;
    const failures: string[] = [];
    try {
      // Remove staged deletions and reduce weights before increasing other components.
      for (const assessment of removed) {
        try {
          const result = await deleteMut.mutateAsync({
            path: { courseUuid, assessmentUuid: assessment.uuid },
          });
          if (
            result &&
            typeof result === 'object' &&
            (('error' in result && result.error) ||
              ('success' in result && result.success === false))
          )
            throw new Error(getErrorMessage(result, 'Failed to delete assessment.'));
          changed = true;
          setRemoved(current => current.filter(item => item.uuid !== assessment.uuid));
        } catch (error) {
          failures.push(
            `${assessment.title}: ${getErrorMessage(error, 'Failed to delete assessment.')}`
          );
        }
      }
      const orderedDrafts = [...drafts].sort((a, b) => {
        const deltaA = Number(a.weight_percentage) - (a.original?.weight_percentage ?? 0);
        const deltaB = Number(b.weight_percentage) - (b.original?.weight_percentage ?? 0);
        return deltaA - deltaB;
      });
      for (const draft of orderedDrafts) {
        if (draft.savedWithoutId) continue;
        const body: CourseAssessmentWritable = {
          course_uuid: courseUuid,
          title: draft.title.trim(),
          assessment_type: draft.assessment_type,
          description: draft.description.trim(),
          weight_percentage: Number(draft.weight_percentage),
          is_required: draft.original?.is_required ?? true,
          aggregation_strategy: draft.original?.aggregation_strategy,
          rubric_uuid: draft.original?.rubric_uuid,
          sync_class_attendance: draft.original?.sync_class_attendance,
          per_lesson: draft.original?.per_lesson,
          program_assessment_uuid: draft.original?.program_assessment_uuid,
        };
        if (
          draft.original &&
          body.title === draft.original.title &&
          body.assessment_type === draft.original.assessment_type &&
          body.description === (draft.original.description ?? '') &&
          body.weight_percentage === draft.original.weight_percentage
        )
          continue;
        try {
          const result = draft.original
            ? await updateMut.mutateAsync({
                path: { courseUuid, assessmentUuid: draft.original.uuid },
                body,
              })
            : await createMut.mutateAsync({
                path: { courseUuid },
                body,
              });
          if (result.error || result.success === false)
            throw new Error(getErrorMessage(result, 'Failed to save assessment.'));
          changed = true;
          const uuid = result.data?.uuid ?? draft.original?.uuid;
          // Keep successful creates marked as saved even if an API response omits its id.
          // A retry must never POST the same row twice.
          setDrafts(current =>
            current.map(item =>
              item.id === draft.id
                ? {
                    ...item,
                    original: uuid ? { ...body, ...result.data, uuid } : undefined,
                    savedWithoutId: !uuid,
                  }
                : item
            )
          );
        } catch (error) {
          failures.push(`${draft.title}: ${getErrorMessage(error, 'Failed to save assessment.')}`);
        }
      }
      failed = failures.length > 0;
      if (failed) {
        setSaveError(
          `Some changes could not be saved. Your remaining changes are ready to retry. ${failures.join(' ')}`
        );
        toast.error('Some assessment changes could not be saved.');
      } else {
        toast.success(
          editing ? 'Assessments updated successfully.' : 'Assessments added successfully.'
        );
        setRemoved([]);
        setErrors({});
      }
    } finally {
      try {
        if (changed) await onRefresh();
      } finally {
        saving.current = false;
        setIsSaving(false);
      }
      if (!failed) {
        setDrafts([newAssessmentDraft()]);
        onSaved();
      }
    }
  }

  return (
    <CardContent className='flex flex-col gap-3 border-b py-5'>
      <div className='space-y-1'>
        <h4 className='text-foreground text-sm font-semibold'>
          {editing ? 'Edit all assessments' : 'Add assessments'}
        </h4>
        <p className='text-muted-foreground text-xs'>
          {editing
            ? 'Update the components below, then save all changes. Removing a saved component deletes it when you save.'
            : 'Enter one or more components, then add them all together.'}
        </p>
      </div>
      <fieldset disabled={isSaving} className='flex min-w-0 flex-col gap-3'>
        {drafts.length === 0 && (
          <EmptyState
            variant='compact'
            title='No assessment rows'
            description='Add a row to define an assessment component.'
          />
        )}
        {drafts.map((draft, index) => {
          const rowErrors = errors[draft.id];
          return (
            <fieldset
              key={draft.id}
              disabled={disabled || draft.savedWithoutId}
              className='border-border grid min-w-0 gap-2 rounded-md border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_110px_auto]'
            >
              <legend className='text-muted-foreground px-1 text-xs'>Assessment {index + 1}</legend>
              <div className='min-w-0 space-y-1'>
                <Input
                  value={draft.title}
                  aria-label={`Assessment ${index + 1} title`}
                  aria-invalid={Boolean(rowErrors?.title)}
                  aria-describedby={rowErrors?.title ? `${draft.id}-title-error` : undefined}
                  placeholder='e.g. Final practical'
                  onChange={event => patchDraft(draft.id, { title: event.target.value })}
                />
                {rowErrors?.title && (
                  <p id={`${draft.id}-title-error`} className='text-destructive text-xs'>
                    {rowErrors.title}
                  </p>
                )}
              </div>
              <div className='min-w-0 space-y-1'>
                <Select
                  value={draft.assessment_type}
                  onValueChange={value => patchDraft(draft.id, { assessment_type: value })}
                  disabled={isSaving || disabled || draft.savedWithoutId}
                >
                  <SelectTrigger
                    className='w-full'
                    aria-label={`Assessment ${index + 1} type`}
                    aria-invalid={Boolean(rowErrors?.assessment_type)}
                    aria-describedby={
                      rowErrors?.assessment_type ? `${draft.id}-type-error` : undefined
                    }
                  >
                    <SelectValue placeholder='Select type' />
                  </SelectTrigger>
                  <SelectContent>
                    {draft.assessment_type && !ASSESSMENT_TYPES.includes(draft.assessment_type) && (
                      <SelectItem value={draft.assessment_type}>{draft.assessment_type}</SelectItem>
                    )}
                    {ASSESSMENT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {rowErrors?.assessment_type && (
                  <p id={`${draft.id}-type-error`} className='text-destructive text-xs'>
                    {rowErrors.assessment_type}
                  </p>
                )}
              </div>
              <div className='space-y-1'>
                <div className='flex items-center gap-1.5'>
                  <Input
                    type='number'
                    min={0}
                    max={100}
                    step='any'
                    value={draft.weight_percentage}
                    aria-label={`Assessment ${index + 1} weight (%)`}
                    aria-invalid={Boolean(rowErrors?.weight_percentage)}
                    aria-describedby={
                      rowErrors?.weight_percentage ? `${draft.id}-weight-error` : undefined
                    }
                    placeholder='Weight'
                    onChange={event =>
                      patchDraft(draft.id, {
                        weight_percentage:
                          event.target.value === '' ? '' : Number(event.target.value),
                      })
                    }
                  />
                  <span className='text-muted-foreground text-xs'>%</span>
                </div>
                {rowErrors?.weight_percentage && (
                  <p id={`${draft.id}-weight-error`} className='text-destructive text-xs'>
                    {rowErrors.weight_percentage}
                  </p>
                )}
              </div>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                aria-label={`Remove assessment ${index + 1}`}
                onClick={() => removeDraft(draft)}
              >
                <Trash2 className='text-destructive h-4 w-4' />
              </Button>
              <Textarea
                rows={2}
                className='sm:col-span-4'
                value={draft.description}
                aria-label={`Assessment ${index + 1} description`}
                placeholder='What is assessed and how.'
                onChange={event => patchDraft(draft.id, { description: event.target.value })}
              />
              {draft.savedWithoutId && (
                <p className='text-muted-foreground text-xs sm:col-span-4'>
                  Saved. Reopen the editor to change this component.
                </p>
              )}
            </fieldset>
          );
        })}
        <div className='border-border bg-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2'>
          <span className='text-muted-foreground text-sm'>Total course weight</span>
          <Badge
            variant={hasValidTotal ? 'default' : 'outline'}
            className={hasValidTotal ? '' : 'border-destructive text-destructive'}
            aria-live='polite'
          >
            {totalWeight}% {hasValidTotal ? '' : '— must be 100%'}
          </Badge>
        </div>
        {removed.length > 0 && (
          <p className='text-destructive text-xs'>
            {removed.length} saved assessment(s) will be deleted when you save.
          </p>
        )}
        {saveError && (
          <p role='alert' className='text-destructive text-sm'>
            {saveError}
          </p>
        )}
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={disabled}
            onClick={() => setDrafts(current => [...current, newAssessmentDraft()])}
            className='gap-2'
          >
            <Plus size={14} />
            Add another assessment
          </Button>
          <div className='flex items-center gap-2'>
            <Button type='button' variant='outline' size='sm' onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type='button'
              size='sm'
              disabled={isSaving || disabled || drafts.length === 0 || !courseUuid}
              onClick={saveAll}
              className='gap-2'
            >
              {isSaving ? <Spinner className='h-4 w-4' /> : <Save size={14} />}
              {isSaving ? 'Saving...' : editing ? 'Save all changes' : 'Add all assessments'}
            </Button>
          </div>
        </div>
      </fieldset>
    </CardContent>
  );
}

// ─── Delete confirmation modal ────────────────────────────────────────────────

type DeleteConfirmModalProps = {
  open: boolean;
  assessment: Assessment | undefined;
  courseUuid: string;
  onClose: () => void;
  onSuccess: () => void;
};

function DeleteConfirmModal({
  open,
  assessment,
  courseUuid,
  onClose,
  onSuccess,
}: DeleteConfirmModalProps) {
  const deleteMut = useMutation(deleteCourseAssessmentMutation());

  function handleDelete() {
    if (!assessment || !courseUuid || deleteMut.isPending) return;
    deleteMut.mutate(
      { path: { courseUuid, assessmentUuid: assessment.uuid } },
      {
        onSuccess: result => {
          if (
            result &&
            typeof result === 'object' &&
            (('error' in result && result.error) ||
              ('success' in result && result.success === false))
          ) {
            toast.error(getErrorMessage(result, 'Failed to delete assessment'));
            return;
          }
          toast.success('Assessment deleted successfully');
          onSuccess();
        },
        onError: err => toast.error(getErrorMessage(err, 'Failed to delete assessment')),
      }
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={isOpen => !isOpen && !deleteMut.isPending && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete assessment?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{' '}
            <span className='text-foreground font-semibold'>{assessment?.title}</span>? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button type='button' variant='outline' disabled={deleteMut.isPending}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type='button'
              variant='destructive'
              onClick={event => {
                event.preventDefault();
                handleDelete();
              }}
              disabled={deleteMut.isPending}
              className='min-w-[100px]'
            >
              {deleteMut.isPending ? (
                <>
                  <Spinner className='mr-2 h-4 w-4' />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const CourseAssessmentStructure = ({
  courseUuid,
  createdBy,
}: CourseAssessmentStructureProps) => {
  const qc = useQueryClient();

  const {
    data: assessmentsData,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    ...getCourseAssessmentsInfiniteOptions({ path: { courseUuid }, query: { pageable: {} } }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      if (lastPage.error || lastPage.success === false) return undefined;
      const metadata = lastPage.data?.metadata;
      const page = metadata?.pageNumber ?? (typeof lastPageParam === 'number' ? lastPageParam : 0);
      if (metadata?.hasNext || page + 1 < (metadata?.totalPages ?? 0)) return page + 1;
      return undefined;
    },
    enabled: Boolean(courseUuid),
    staleTime: STALE_TIMES.entity,
  });
  // Load each actual page so central editing and weight totals include every component.
  useEffect(() => {
    if (courseUuid && hasNextPage && !isFetchingNextPage && !isError) void fetchNextPage();
  }, [courseUuid, hasNextPage, isFetchingNextPage, isError, fetchNextPage]);
  const loadingAssessments = isLoading || hasNextPage || isFetchingNextPage;
  const assessments = useMemo(
    () =>
      (assessmentsData?.pages ?? [])
        .flatMap(page => (page.error || page.success === false ? [] : (page.data?.content ?? [])))
        .filter((assessment): assessment is Assessment => Boolean(assessment.uuid)),
    [assessmentsData]
  );
  const totalWeight = Number(
    assessments.reduce((sum, a) => sum + a.weight_percentage, 0).toFixed(2)
  );
  const [mode, setMode] = useState<'add' | 'edit' | null>(null);
  const [deletingAssessment, setDeletingAssessment] = useState<Assessment | undefined>(undefined);
  const [linkModalTarget, setLinkModalTarget] = useState<Assessment | null>(null);

  async function refreshAssessments() {
    await Promise.all([
      qc.invalidateQueries({
        queryKey: getCourseAssessmentsInfiniteQueryKey({
          path: { courseUuid },
          query: { pageable: {} },
        }),
      }),
      qc.invalidateQueries({
        queryKey: getCourseAssessmentsQueryKey({ path: { courseUuid }, query: { pageable: {} } }),
      }),
      qc.invalidateQueries({
        queryKey: getCourseEvaluationPlanQueryKey({ path: { courseUuid } }),
      }),
    ]);
  }

  function onMutationSuccess() {
    void refreshAssessments();
    setDeletingAssessment(undefined);
  }

  const loadError = isError
    ? error
    : assessmentsData?.pages.find(page => page.error || page.success === false);

  return (
    <>
      <div className='mb-4'>
        <div className='flex flex-col gap-4'>
          <CoursePassMarkForm courseUuid={courseUuid} />
          <CourseGradeBandsForm courseUuid={courseUuid} />
        </div>
      </div>

      <Card className='gap-0 py-0'>
        {/* Header */}
        <div className='flex flex-col gap-1 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h3 className='text-foreground text-[16px] font-bold'>
              Overall Course Assessment Structure
            </h3>
            <p className='text-muted-foreground mt-0.5 text-[13px]'>
              Define the assessment components and their weights (total: 100%)
            </p>
          </div>
          {!mode && (
            <div className='mt-3 flex flex-wrap items-center gap-2 sm:mt-0'>
              <Button
                type='button'
                onClick={() => setMode('edit')}
                size='sm'
                variant='outline'
                disabled={loadingAssessments || Boolean(loadError) || assessments.length === 0}
                className='gap-2'
              >
                <Pencil size={15} />
                Edit assessments
              </Button>
              <Button
                type='button'
                onClick={() => setMode('add')}
                size='sm'
                disabled={loadingAssessments || Boolean(loadError) || !courseUuid}
                className='gap-2'
              >
                <Plus size={15} />
                Add assessments
              </Button>
            </div>
          )}
        </div>

        {mode ? (
          <AssessmentBatchEditor
            key={`${courseUuid}-${mode}`}
            courseUuid={courseUuid}
            createdBy={createdBy}
            assessments={assessments}
            editing={mode === 'edit'}
            onCancel={() => setMode(null)}
            onRefresh={refreshAssessments}
            onSaved={() => setMode(null)}
            disabled={loadingAssessments || Boolean(loadError)}
          />
        ) : (
          <CardContent className='px-0'>
            {/* Table — degrades independently (skeleton / error / empty are local) */}
            <AsyncSection
              loading={loadingAssessments}
              error={loadError}
              empty={assessments.length === 0}
              onRetry={refetch}
              className='m-6'
              skeleton={
                <div className='divide-y'>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className='flex items-center justify-between gap-4 px-6 py-4'>
                      <div className='flex-1 space-y-2'>
                        <Skeleton className='h-4 w-1/3' />
                        <Skeleton className='h-3 w-1/2' />
                      </div>
                      <Skeleton className='h-4 w-20' />
                      <Skeleton className='h-8 w-16' />
                    </div>
                  ))}
                </div>
              }
              emptyState={
                <EmptyState
                  icon={Plus}
                  variant='plain'
                  title='No assessments yet'
                  description='Add assessment components to define the grading structure for this course.'
                  action={
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => setMode('add')}
                      disabled={loadingAssessments || Boolean(loadError) || !courseUuid}
                    >
                      <Plus size={14} className='mr-2' />
                      Add first assessment
                    </Button>
                  }
                />
              }
            >
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='bg-muted/40 border-b'>
                      <th className='text-foreground px-6 py-3 text-left font-semibold'>
                        Component Title
                      </th>
                      <th className='text-foreground px-4 py-3 text-left font-semibold'>
                        Weight (Score Range)
                      </th>
                      <th className='text-foreground px-4 py-3 text-left font-semibold'>
                        Linked Tasks
                      </th>
                      <th className='text-foreground px-4 py-3 text-right font-semibold'>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className='divide-y'>
                    {assessments.map(a => (
                      <tr key={a.uuid} className='hover:bg-muted/30 transition-colors'>
                        {/* Title */}
                        <td className='px-6 py-4'>
                          <p className='text-foreground font-medium'>{a.title}</p>
                          {a.description && (
                            <p className='text-muted-foreground mt-0.5 line-clamp-1 text-xs'>
                              {a.description}
                            </p>
                          )}
                          {a.is_major_assessment && (
                            <span className='bg-primary/15 text-primary mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold'>
                              Major
                            </span>
                          )}
                        </td>

                        {/* Weight */}
                        <td className='px-4 py-4'>
                          <div className='flex flex-col gap-1'>
                            <span className='text-foreground font-semibold'>
                              {a.weight_percentage}% (0–{a.weight_percentage})
                            </span>
                            <span
                              className={`inline-flex max-w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                a.is_required
                                  ? 'bg-success/10 text-success/70'
                                  : 'bg-muted-foreground/10 text-muted-foreground'
                              }`}
                            >
                              {a.is_required ? 'Required' : 'Not required'}
                            </span>
                          </div>
                        </td>

                        {/* Linked tasks — self-fetching per row */}
                        <td className='px-4 py-4'>
                          <div className='flex flex-col gap-1.5'>
                            <AssessmentLineItems courseUuid={courseUuid} assessmentUuid={a.uuid} />
                            <button
                              type='button'
                              onClick={() => setLinkModalTarget(a)}
                              className='text-muted-foreground hover:text-foreground hover:bg-muted flex w-max items-center gap-1.5 rounded-full border border-dashed px-2.5 py-1 text-xs transition-colors'
                            >
                              <Plus size={11} />
                              Link items
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className='px-4 py-4'>
                          <div className='flex items-center justify-end gap-1'>
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              onClick={() => setDeletingAssessment(a)}
                              className='text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                              aria-label={`Delete ${a.title}`}
                            >
                              <Trash2 size={15} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot>
                    <tr className='bg-muted/40 border-t'>
                      <td className='text-foreground px-6 py-3 font-bold'>Total</td>
                      <td
                        className={`px-4 py-3 text-left font-bold ${totalWeight === 100 ? 'text-success' : totalWeight > 100 ? 'text-destructive' : 'text-warning'}`}
                      >
                        {totalWeight}%
                      </td>
                      <td className='px-4 py-3' />
                      <td className='px-4 py-3' />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </AsyncSection>

            {!loadingAssessments && assessments.length > 0 && totalWeight !== 100 && (
              <div
                className={`flex items-center gap-2 border-t px-6 py-3 text-sm font-medium ${totalWeight > 100 ? 'bg-destructive/5 text-destructive' : 'bg-primary/15 text-primary'}`}
              >
                <AlertTriangle size={14} />
                {totalWeight > 100
                  ? `Total weight exceeds 100% by ${totalWeight - 100}%. Please adjust.`
                  : `Total weight is ${totalWeight}%. ${100 - totalWeight}% remaining to allocate.`}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Link items modal */}
      {linkModalTarget && (
        <LinkItemsModal
          open={!!linkModalTarget}
          onClose={() => setLinkModalTarget(null)}
          courseUuid={courseUuid}
          assessmentUuid={linkModalTarget.uuid}
          linkedItems={[]}
          onSuccess={() => setLinkModalTarget(null)}
        />
      )}

      <DeleteConfirmModal
        open={!!deletingAssessment}
        assessment={deletingAssessment}
        courseUuid={courseUuid}
        onClose={() => setDeletingAssessment(undefined)}
        onSuccess={onMutationSuccess}
      />
    </>
  );
};
