'use client';

import { AsyncSection } from '@/components/data/async-section';
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
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Pencil, Plus, Save, Trash2 } from 'lucide-react';
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
import Spinner from '../../../../components/ui/spinner';
import {
  addCourseAssessmentMutation,
  deleteCourseAssessmentMutation,
  getCourseAssessmentsInfiniteOptions,
  getCourseAssessmentsInfiniteQueryKey,
  getCourseAssessmentsQueryKey,
  getCourseEvaluationPlanQueryKey,
  searchAssessmentRubricsOptions,
  updateCourseAssessmentMutation,
} from '../../../../services/client/@tanstack/react-query.gen';
import type {
  CourseAssessment,
  CourseAssessmentWritable,
} from '../../../../services/client/types.gen';
import { ASSESSMENT_TYPES } from '../rubrics/rubric-manager';
import { LinkItemsModal } from './assesment-link-items';
import { AssessmentLinkedTasks } from './assessment-linked-tasks';
import { CoursePassMarkForm } from './course-pass-mark-form';
import { EvaluationRubricPicker } from './evaluation-rubric-picker';
import { EvaluationRubricPreview } from './evaluation-rubric-preview';

// ─── Types ────────────────────────────────────────────────────────────────────

type CourseAssessmentStructureProps = {
  courseUuid: string;
  createdBy: string;
};

type Assessment = CourseAssessment & { uuid: string };

const STRUCTURE_COLUMNS = [
  'Code',
  'Title',
  'Weight',
  'Gate % (Pass mark)',
  'Scoring',
  'Linked tasks',
  'Selection',
  'Attempt',
  'Actions',
];

function StructureHeader() {
  return (
    <thead>
      <tr className='bg-muted/40 divide-x border-b'>
        {STRUCTURE_COLUMNS.map(column => (
          <th scope='col' key={column} className='px-3 py-4 text-left font-semibold'>
            {column}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function UnavailableCell() {
  return (
    <td className='text-muted-foreground px-3 py-4'>
      <span aria-label='Not available'>—</span>
    </td>
  );
}

type AssessmentDraft = {
  id: string;
  original?: Assessment;
  title: string;
  assessment_type: string;
  description: string;
  weight_percentage: number | '';
  per_lesson: boolean;
  rubric_uuid: string | null;
  rubricTitle?: string;
  sync_class_attendance: boolean;
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
    per_lesson: assessment ? assessment.per_lesson === true : true,
    rubric_uuid: assessment?.rubric_uuid ?? null,
    sync_class_attendance: assessment?.sync_class_attendance ?? false,
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
  rubricTitles,
  onPreview,
  onManageTasks,
}: CourseAssessmentStructureProps & {
  assessments: Assessment[];
  editing: boolean;
  onCancel: () => void;
  onRefresh: () => Promise<void>;
  onSaved: () => void;
  disabled: boolean;
  rubricTitles: Map<string, string>;
  onPreview: (uuid: string) => void;
  onManageTasks: (assessment: Assessment) => void;
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
          rubric_uuid: draft.rubric_uuid,
          sync_class_attendance: draft.sync_class_attendance,
          per_lesson: draft.per_lesson,
        };
        if (
          draft.original &&
          body.title === draft.original.title &&
          body.assessment_type === draft.original.assessment_type &&
          body.description === (draft.original.description ?? '') &&
          body.weight_percentage === draft.original.weight_percentage &&
          body.per_lesson === (draft.original.per_lesson ?? false) &&
          body.rubric_uuid === (draft.original.rubric_uuid ?? null) &&
          body.sync_class_attendance === (draft.original.sync_class_attendance ?? false)
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
        <div className='overflow-x-auto rounded-md border'>
          <table className='w-full min-w-[1360px] text-sm'>
            <caption className='sr-only'>Course assessment components</caption>
            <StructureHeader />
            <tbody className='divide-y'>
              {drafts.map((draft, index) => {
                const rowErrors = errors[draft.id];
                const rowDisabled = isSaving || disabled || draft.savedWithoutId;
                return (
                  <tr key={draft.id} className='divide-x align-top'>
                    <UnavailableCell />
                    <td className='min-w-64 space-y-2 px-3 py-4'>
                      <Input
                        value={draft.title}
                        disabled={rowDisabled}
                        aria-label={`Assessment ${index + 1} title`}
                        aria-invalid={Boolean(rowErrors?.title)}
                        placeholder='Component title'
                        onChange={event => patchDraft(draft.id, { title: event.target.value })}
                      />
                      {rowErrors?.title && (
                        <p role='alert' className='text-destructive text-xs'>
                          {rowErrors.title}
                        </p>
                      )}
                      <details open={!draft.assessment_type || Boolean(rowErrors?.assessment_type)}>
                        <summary className='text-muted-foreground cursor-pointer text-xs'>
                          Component details
                        </summary>
                        <div className='space-y-3 pt-3'>
                          <Select
                            value={draft.assessment_type}
                            disabled={rowDisabled}
                            onValueChange={value =>
                              patchDraft(draft.id, { assessment_type: value })
                            }
                          >
                            <SelectTrigger
                              className='w-full'
                              aria-label={`Assessment ${index + 1} type`}
                              aria-invalid={Boolean(rowErrors?.assessment_type)}
                            >
                              <SelectValue placeholder='Select type' />
                            </SelectTrigger>
                            <SelectContent>
                              {draft.assessment_type &&
                                !ASSESSMENT_TYPES.includes(draft.assessment_type) && (
                                  <SelectItem value={draft.assessment_type}>
                                    {draft.assessment_type}
                                  </SelectItem>
                                )}
                              {ASSESSMENT_TYPES.map(type => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {rowErrors?.assessment_type && (
                            <p role='alert' className='text-destructive text-xs'>
                              {rowErrors.assessment_type}
                            </p>
                          )}
                          <Textarea
                            rows={2}
                            value={draft.description}
                            disabled={rowDisabled}
                            aria-label={`Assessment ${index + 1} description`}
                            placeholder='What is assessed and how.'
                            onChange={event =>
                              patchDraft(draft.id, { description: event.target.value })
                            }
                          />
                          <div className='flex items-center gap-2'>
                            <Checkbox
                              id={`${draft.id}-per-lesson`}
                              checked={draft.per_lesson}
                              disabled={rowDisabled}
                              onCheckedChange={checked =>
                                patchDraft(draft.id, { per_lesson: checked === true })
                              }
                            />
                            <Label htmlFor={`${draft.id}-per-lesson`}>Grade per lesson</Label>
                          </div>
                        </div>
                      </details>
                      {draft.savedWithoutId && (
                        <p className='text-muted-foreground text-xs'>
                          Saved. Reopen the editor to change this component.
                        </p>
                      )}
                    </td>
                    <td className='w-32 px-3 py-4'>
                      <div className='flex items-center gap-1'>
                        <Input
                          type='number'
                          min={0}
                          max={100}
                          step='any'
                          value={draft.weight_percentage}
                          disabled={rowDisabled}
                          aria-label={`Assessment ${index + 1} weight (%)`}
                          aria-invalid={Boolean(rowErrors?.weight_percentage)}
                          placeholder='Weight'
                          onChange={event =>
                            patchDraft(draft.id, {
                              weight_percentage:
                                event.target.value === '' ? '' : Number(event.target.value),
                            })
                          }
                        />
                        <span className='text-muted-foreground'>%</span>
                      </div>
                      {rowErrors?.weight_percentage && (
                        <p role='alert' className='text-destructive mt-1 text-xs'>
                          {rowErrors.weight_percentage}
                        </p>
                      )}
                    </td>
                    <UnavailableCell />
                    <td className='min-w-64 space-y-3 px-3 py-4'>
                      <EvaluationRubricPicker
                        creatorUuid={createdBy}
                        value={draft.rubric_uuid}
                        title={draft.rubricTitle ?? rubricTitles.get(draft.rubric_uuid ?? '')}
                        label={`Scoring rubric for assessment ${index + 1}`}
                        emptyLabel='None / select rubric'
                        disabled={rowDisabled}
                        onPreview={onPreview}
                        onChange={rubric =>
                          patchDraft(draft.id, {
                            rubric_uuid: rubric?.uuid ?? null,
                            rubricTitle: rubric?.title,
                          })
                        }
                      />
                    </td>
                    <td className='px-3 py-4'>
                      {draft.original ? (
                        <AssessmentLinkedTasks
                          courseUuid={courseUuid}
                          assessmentUuid={draft.original.uuid}
                          assessmentTitle={draft.title}
                          disabled={rowDisabled}
                          onManage={() => draft.original && onManageTasks(draft.original)}
                        />
                      ) : (
                        <p className='text-muted-foreground text-xs'>
                          Save this assessment to link tasks.
                        </p>
                      )}
                    </td>
                    <UnavailableCell />
                    <UnavailableCell />
                    <td className='px-3 py-4'>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        disabled={rowDisabled}
                        aria-label={`Remove assessment ${index + 1}`}
                        onClick={() => removeDraft(draft)}
                      >
                        <Trash2 className='text-destructive size-4' />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className='bg-muted/40 divide-x border-t font-semibold'>
                <td />
                <td className='px-3 py-3'>Total</td>
                <td className={`px-3 py-3 ${hasValidTotal ? 'text-success' : 'text-destructive'}`}>
                  {totalWeight}%
                </td>
                <td colSpan={6} />
              </tr>
            </tfoot>
          </table>
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
  const rubricIds = useMemo(
    () =>
      [
        ...new Set(assessments.flatMap(item => (item.rubric_uuid ? [item.rubric_uuid] : []))),
      ].sort(),
    [assessments]
  );
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
  const rubricTitles = useMemo(() => {
    const titles = new Map<string, string>();
    if (!titlesQuery.data?.error && titlesQuery.data?.success !== false) {
      titlesQuery.data?.data?.content?.forEach(rubric => {
        if (rubric.uuid) titles.set(rubric.uuid, rubric.title);
      });
    }
    return titles;
  }, [titlesQuery.data]);
  const [previewUuid, setPreviewUuid] = useState<string | null>(null);
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
      <Card className='min-w-0 gap-0 overflow-hidden py-0'>
        <CoursePassMarkForm courseUuid={courseUuid} compact />
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
            rubricTitles={rubricTitles}
            onPreview={setPreviewUuid}
            onManageTasks={setLinkModalTarget}
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
                <table className='w-full min-w-[1360px] text-sm'>
                  <caption className='sr-only'>Course assessment components</caption>
                  <StructureHeader />
                  <tbody className='divide-y'>
                    {assessments.map(a => (
                      <tr key={a.uuid} className='hover:bg-muted/30 divide-x transition-colors'>
                        <UnavailableCell />
                        <td className='min-w-64 px-3 py-4'>
                          <p className='font-medium'>{a.title}</p>
                          {a.description && (
                            <p className='text-muted-foreground mt-1 text-xs'>{a.description}</p>
                          )}
                        </td>
                        <td className='px-3 py-4 font-medium'>{a.weight_percentage}%</td>
                        <UnavailableCell />
                        <td className='min-w-56 px-3 py-4'>
                          {a.rubric_uuid ? (
                            <Button
                              type='button'
                              variant='link'
                              className='h-auto max-w-72 p-0 text-left whitespace-normal'
                              onClick={() => setPreviewUuid(a.rubric_uuid ?? null)}
                            >
                              {rubricTitles.get(a.rubric_uuid) || 'View selected rubric'}
                            </Button>
                          ) : !a.sync_class_attendance ? (
                            <span className='text-muted-foreground'>None</span>
                          ) : null}
                          {a.sync_class_attendance && <p className='mt-1'>Verified attendance</p>}
                        </td>
                        <td className='px-3 py-4'>
                          <AssessmentLinkedTasks
                            courseUuid={courseUuid}
                            assessmentUuid={a.uuid}
                            assessmentTitle={a.title}
                            onManage={() => setLinkModalTarget(a)}
                          />
                        </td>
                        <UnavailableCell />
                        <UnavailableCell />
                        <td className='px-3 py-4'>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            onClick={() => setDeletingAssessment(a)}
                            className='text-muted-foreground hover:text-destructive'
                            aria-label={`Delete ${a.title}`}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className='bg-muted/40 divide-x border-t font-bold'>
                      <td />
                      <td className='px-3 py-3'>Total</td>
                      <td
                        className={`px-3 py-3 ${totalWeight === 100 ? 'text-success' : 'text-destructive'}`}
                      >
                        {totalWeight}%
                      </td>
                      <td colSpan={6} />
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

      <Dialog open={Boolean(previewUuid)} onOpenChange={open => !open && setPreviewUuid(null)}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-4xl'>
          <DialogHeader>
            <DialogTitle>Scoring rubric</DialogTitle>
            <DialogDescription>Review the grading criteria for this assessment.</DialogDescription>
          </DialogHeader>
          {previewUuid && <EvaluationRubricPreview rubricUuid={previewUuid} />}
        </DialogContent>
      </Dialog>
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
