'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../../../../components/ui/sheet';
import Spinner from '../../../../components/ui/spinner';
import { Switch } from '../../../../components/ui/switch';
import { useCourseCreator } from '../../../../context/course-creator-context';
import {
  addCourseAssessmentMutation,
  deleteCourseAssessmentMutation,
  deleteLineItemMutation,
  getCourseAssessmentsOptions,
  getLineItemsOptions,
  getLineItemsQueryKey,
  searchAssessmentRubricsOptions,
  updateCourseAssessmentMutation,
} from '../../../../services/client/@tanstack/react-query.gen';
import type {
  AssessmentRubric,
  CourseAssessment,
  CourseAssessmentLineItem,
  ResponseDtoVoid,
} from '../../../../services/client/types.gen';
import { useRubricsData } from '../rubrics/rubric-chaining';
import { CATEGORY_META, LinkItemsModal, TaskItemType } from './assesment-link-items';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CourseAssessmentStructureProps = {
  courseUuid: string;
  createdBy: string;
};

type Assessment = CourseAssessment & { uuid: string };

type AssessmentFormValues = {
  title: string;
  description: string;
  rubric_uuid: string;
  weight_percentage: number | '';
  is_required: boolean;
  assessment_type: string;
  is_major_assessment: boolean;
};

const ASSESSMENT_TYPES = [
  'Attendance',
  'Diagnostic/Entry',
  'Continuous Diagnostic',
  'Formative (theory)',
  'Formative (practical)',
  'Summative',
  'Project',
  'Exam',
  'Other',
] as const;

const DEFAULT_FORM: AssessmentFormValues = {
  title: '',
  description: '',
  rubric_uuid: '',
  weight_percentage: '',
  is_required: true,
  assessment_type: '',
  is_major_assessment: false,
};

const getErrorMessage = (error: unknown, fallback: string) =>
  (error as ResponseDtoVoid | undefined)?.message ||
  (error instanceof Error ? error.message : fallback);

// ─── Badge helper ─────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  Attendance: 'bg-muted text-muted-foreground',
  'Diagnostic/Entry': 'bg-secondary text-secondary-foreground',
  'Continuous Diagnostic': 'bg-accent text-accent-foreground',
  'Formative (theory)': 'bg-primary/10 text-primary',
  'Formative (practical)': 'bg-primary/20 text-primary',
  Summative: 'bg-destructive/10 text-destructive',
  Project: 'bg-accent/60 text-accent-foreground',
  Exam: 'bg-destructive/20 text-destructive',
  Other: 'bg-muted text-muted-foreground',
};

function TypeBadge({ type }: { type: string }) {
  const cls = TYPE_COLORS[type] ?? TYPE_COLORS['Other'];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {type}
    </span>
  );
}

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
    enabled: !!assessmentUuid,
  });

  // Handle both { data: { content: [] } } and { data: [] } response shapes
  const lineItems: CourseAssessmentLineItem[] = Array.isArray(data?.data) ? data.data : [];

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
    return <Spinner className='h-3 w-3' />;
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

// ─── Assessment Sheet ─────────────────────────────────────────────────────────

type ModalMode = 'add' | 'edit';

type AssessmentSheetProps = {
  open: boolean;
  mode: ModalMode;
  initial?: Assessment;
  courseUuid: string;
  createdBy: string;
  onClose: () => void;
  onSuccess: () => void;
};

function AssessmentSheet({
  open,
  mode,
  initial,
  courseUuid,
  createdBy,
  onClose,
  onSuccess,
}: AssessmentSheetProps) {
  const toFormValues = (assessment?: Assessment): AssessmentFormValues => {
    if (!assessment) return DEFAULT_FORM;

    return {
      title: assessment.title,
      description: assessment.description ?? '',
      rubric_uuid: assessment.rubric_uuid ?? '',
      weight_percentage: assessment.weight_percentage,
      is_required: assessment.is_required ?? false,
      assessment_type: '',
      is_major_assessment: assessment.is_major_assessment ?? false,
    };
  };

  const [form, setForm] = useState<AssessmentFormValues>(() => toFormValues(initial));

  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setForm(toFormValues(initial));
  }

  const [errors, setErrors] = useState<Partial<Record<keyof AssessmentFormValues, string>>>({});
  const creator = useCourseCreator();

  const { data: searchRubs, isLoading: isLoadingRubrics } = useQuery({
    ...searchAssessmentRubricsOptions({
      query: {
        pageable: {},
        searchParams: { course_creator_uuid_eq: creator?.profile?.uuid as string },
      },
    }),
    enabled: !!creator?.profile?.uuid,
  });

  const rubrics: AssessmentRubric[] = searchRubs?.data?.content ?? [];
  const selectedRubric = rubrics.find(r => r.uuid === form.rubric_uuid);

  const createMut = useMutation(addCourseAssessmentMutation());
  const updateMut = useMutation(updateCourseAssessmentMutation());
  const isSaving = createMut.isPending || updateMut.isPending;

  function set<K extends keyof AssessmentFormValues>(key: K, value: AssessmentFormValues[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (
      form.weight_percentage === '' ||
      Number(form.weight_percentage) < 0 ||
      Number(form.weight_percentage) > 100
    ) {
      newErrors.weight_percentage = 'Weight must be between 0 and 100';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const body = {
      title: form.title.trim(),
      description: form.description.trim(),
      rubric_uuid: '',
      weight_percentage: Number(form.weight_percentage),
      is_required: form.is_required,
      assessment_type: 'course_template',
      is_major_assessment: form.is_major_assessment,
    };

    if (mode === 'add') {
      createMut.mutate(
        {
          path: { courseUuid },
          body: { ...body, course_uuid: courseUuid, created_by: createdBy } as never,
        },
        {
          onSuccess: () => {
            toast.success('Assessment created successfully!');

            setForm(DEFAULT_FORM);
            setErrors({});

            onSuccess();
          },
          onError: err => toast.error(getErrorMessage(err, 'Failed to create assessment')),
        }
      );
    } else if (initial) {
      updateMut.mutate(
        {
          path: { courseUuid, assessmentUuid: initial.uuid },
          body: {
            ...body,
            uuid: initial.uuid,
            course_uuid: courseUuid,
            updated_by: createdBy,
          } as never,
        },
        {
          onSuccess: () => {
            toast.success('Assessment updated successfully!');
            onSuccess();
          },
          onError: err => toast.error(getErrorMessage(err, 'Failed to update assessment')),
        }
      );
    }
  }

  return (
    <Sheet open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <SheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[650px]' side='right'>
        <SheetHeader className='border-b px-6 py-5'>
          <SheetTitle>{mode === 'add' ? 'Add Assessment' : 'Edit Assessment'}</SheetTitle>
          <SheetDescription>
            {mode === 'add'
              ? 'Define a new assessment component for this course'
              : 'Update the assessment component details'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-y-auto px-6 py-6'>
          <div className='flex flex-col gap-5'>
            {/* Title */}
            <div className='flex flex-col gap-1.5'>
              <Label className='text-sm font-medium'>
                Component Title <span className='text-destructive'>*</span>
              </Label>
              <Input
                placeholder='e.g. Weekly Quizzes'
                value={form.title}
                onChange={e => set('title', e.target.value)}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && <p className='text-destructive text-xs'>{errors.title}</p>}
            </div>

            {/* Description */}
            <div className='flex flex-col gap-1.5'>
              <Label className='text-sm font-medium'>Description</Label>
              <textarea
                placeholder='Brief description of the assessment component...'
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={3}
                className='border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none'
              />
            </div>

            {/* Type + Weight */}
            <div className='flex'>
              {/* <div className='flex flex-1 flex-col gap-1.5'>
                <Label className='text-sm font-medium'>
                  Assessment Type <span className='text-destructive'>*</span>
                </Label>
                <Select value={form.assessment_type} onValueChange={v => set('assessment_type', v)}>
                  <SelectTrigger className={errors.assessment_type ? 'border-destructive' : ''}>
                    <SelectValue placeholder='Select type' />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSESSMENT_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.assessment_type && (
                  <p className='text-destructive text-xs'>{errors.assessment_type}</p>
                )}
              </div> */}

              <div className='flex flex-1 flex-col gap-1.5'>
                <Label className='text-sm font-medium'>
                  Weight (%) <span className='text-destructive'>*</span>
                </Label>
                <Input
                  type='number'
                  min={0}
                  max={100}
                  placeholder='e.g. 25'
                  value={form.weight_percentage}
                  onChange={e =>
                    set('weight_percentage', e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className={errors.weight_percentage ? 'border-destructive' : ''}
                />
                {errors.weight_percentage && (
                  <p className='text-destructive text-xs'>{errors.weight_percentage}</p>
                )}
              </div>
            </div>

            {/* Rubric */}
            {/* <div className='flex flex-col gap-1.5'>
              <Label className='text-sm font-medium'>Rubric (optional)</Label>
              <p className='text-muted-foreground text-xs'>
                Associate a grading rubric with this assessment
              </p>
              {isLoadingRubrics ? (
                <div className='flex items-center gap-2 py-2'>
                  <Spinner className='h-4 w-4' />
                  <span className='text-muted-foreground text-xs'>Loading rubrics...</span>
                </div>
              ) : (
                <>
                  <Select
                    value={form.rubric_uuid || '__none__'}
                    onValueChange={v => set('rubric_uuid', v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select a rubric (optional)' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='__none__'>
                        <span className='text-muted-foreground'>None</span>
                      </SelectItem>
                      {rubrics.map((r: unknown) => (
                        <SelectItem key={r.uuid} value={r.uuid}>
                          <div className='flex flex-col'>
                            <span className='font-medium'>{r.title}</span>
                            {r.description && (
                              <span className='text-muted-foreground line-clamp-1 text-xs'>
                                {r.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedRubric ? (
                    <div className='bg-muted/50 mt-1 flex items-start justify-between gap-2 rounded-lg border px-3 py-2'>
                      <div className='min-w-0'>
                        <p className='text-foreground truncate text-xs font-semibold'>
                          {selectedRubric.title}
                        </p>
                        {selectedRubric.description && (
                          <p className='text-muted-foreground mt-0.5 line-clamp-2 text-xs'>
                            {selectedRubric.description}
                          </p>
                        )}
                      </div>
                      <button
                        type='button'
                        onClick={() => set('rubric_uuid', '')}
                        className='text-muted-foreground hover:text-foreground hover:bg-muted mt-0.5 shrink-0 rounded p-0.5 transition-colors'
                        title='Clear rubric'
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className='bg-warning/20 border-warning/40 flex flex-col gap-3 rounded-lg border p-4'>
                      <div className='flex items-start gap-2'>
                        <AlertTriangle className='text-warning-foreground mt-0.5 h-4 w-4 shrink-0' />
                        <div className='text-sm'>
                          <p className='text-warning-foreground font-medium'>No rubric selected</p>
                          <p className='text-warning-foreground/80 text-xs'>
                            If none of the available rubrics fit, you can create a new one.
                          </p>
                        </div>
                      </div>
                      <Link href='/dashboard/rubrics' target='_blank'>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          className='border-warning text-warning-foreground hover:bg-warning/100 w-fit self-center'
                          onClick={onClose}
                        >
                          Create New Rubric
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div> */}

            {/* Toggles */}
            <div className='bg-muted/40 flex flex-col gap-4 rounded-xl border p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-foreground text-sm font-medium'>Required Assessment</p>
                  <p className='text-muted-foreground text-xs'>
                    Students must complete this assessment
                  </p>
                </div>
                <Switch checked={form.is_required} onCheckedChange={v => set('is_required', v)} />
              </div>
              <div className='flex items-center justify-between border-t pt-4'>
                <div>
                  <p className='text-foreground text-sm font-medium'>Major Assessment</p>
                  <p className='text-muted-foreground text-xs'>Mark as a high-stakes assessment</p>
                </div>
                <Switch
                  checked={form.is_major_assessment}
                  onCheckedChange={v => set('is_major_assessment', v)}
                />
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className='border-t px-6 py-4'>
          <Button variant='outline' onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving} className='min-w-[120px]'>
            {isSaving ? (
              <>
                <Spinner className='mr-2 h-4 w-4' />
                Saving...
              </>
            ) : (
              <>
                <Save size={15} className='mr-2' />
                {mode === 'add' ? 'Add Assessment' : 'Save Changes'}
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Delete Confirm Sheet ─────────────────────────────────────────────────────

type DeleteConfirmSheetProps = {
  open: boolean;
  assessment: Assessment | undefined;
  courseUuid: string;
  onClose: () => void;
  onSuccess: () => void;
};

function DeleteConfirmSheet({
  open,
  assessment,
  courseUuid,
  onClose,
  onSuccess,
}: DeleteConfirmSheetProps) {
  const deleteMut = useMutation(deleteCourseAssessmentMutation());

  function handleDelete() {
    if (!assessment) return;
    deleteMut.mutate({ path: { courseUuid, assessmentUuid: assessment.uuid } } as never, {
      onSuccess: () => {
        toast.success('Assessment deleted successfully');
        onSuccess();
      },
      onError: err => toast.error(getErrorMessage(err, 'Failed to delete assessment')),
    });
  }

  return (
    <Sheet open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <SheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-sm' side='right'>
        <SheetHeader className='border-b px-6 py-5'>
          <SheetTitle>Delete Assessment</SheetTitle>
          <SheetDescription>This action cannot be undone.</SheetDescription>
        </SheetHeader>
        <div className='flex flex-1 flex-col items-start gap-4 px-6 py-6'>
          <div className='bg-destructive/10 flex h-12 w-12 items-center justify-center rounded-full'>
            <AlertTriangle size={22} className='text-destructive' />
          </div>
          <p className='text-muted-foreground text-sm'>
            Are you sure you want to delete{' '}
            <span className='text-foreground font-semibold'>{assessment?.title}</span>? This cannot
            be undone.
          </p>
        </div>
        <SheetFooter className='border-t px-6 py-4'>
          <Button variant='outline' onClick={onClose} disabled={deleteMut.isPending}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={handleDelete}
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
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const CourseAssessmentStructure = ({
  courseUuid,
  createdBy,
}: CourseAssessmentStructureProps) => {
  const qc = useQueryClient();
  const creator = useCourseCreator();

  const { data: assessmentsData, isLoading } = useQuery({
    ...getCourseAssessmentsOptions({ path: { courseUuid }, query: { pageable: {} } }),
    enabled: !!courseUuid,
  });
  const assessments: Assessment[] = (assessmentsData?.data?.content ?? []).filter(
    (assessment): assessment is Assessment => Boolean(assessment.uuid)
  );

  const { rubrics } = useRubricsData(creator?.data?.profile?.uuid as string);
  const filteredRubrics = rubrics.filter(rubric =>
    assessments.some(a => a.rubric_uuid === rubric.uuid)
  );

  const totalWeight = assessments.reduce((sum, a) => sum + (a.weight_percentage ?? 0), 0);

  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | undefined>(undefined);
  const [deletingAssessment, setDeletingAssessment] = useState<Assessment | undefined>(undefined);
  const [linkModalTarget, setLinkModalTarget] = useState<Assessment | null>(null);

  function openAdd() {
    setEditingAssessment(undefined);
    setModalMode('add');
  }
  function openEdit(a: Assessment) {
    setEditingAssessment(a);
    setModalMode('edit');
  }
  function closeModal() {
    setModalMode(null);
    setEditingAssessment(undefined);
  }

  function onMutationSuccess() {
    qc.invalidateQueries({
      queryKey: getCourseAssessmentsOptions({ path: { courseUuid }, query: { pageable: {} } })
        .queryKey,
    });
    closeModal();
    setDeletingAssessment(undefined);
  }

  return (
    <>
      <div className='bg-card rounded-xl border shadow-sm'>
        {/* Header */}
        <div className='flex flex-col gap-1 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h3 className='text-foreground text-lg font-bold'>
              Overall Course Assessment Structure
            </h3>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              Define the assessment components and their weights (total: 100%)
            </p>
          </div>
          <Button onClick={openAdd} size='sm' className='mt-3 gap-2 sm:mt-0'>
            <Plus size={15} />
            Add Assessment
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className='flex items-center justify-center py-16'>
            <Spinner className='h-6 w-6' />
          </div>
        ) : assessments.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
            <div className='bg-muted rounded-full p-4'>
              <Plus size={24} className='text-muted-foreground' />
            </div>
            <p className='text-foreground font-medium'>No assessments yet</p>
            <p className='text-muted-foreground max-w-xs text-sm'>
              Add assessment components to define the grading structure for this course.
            </p>
            <Button onClick={openAdd} size='sm' variant='outline' className='mt-1 gap-2'>
              <Plus size={14} />
              Add First Assessment
            </Button>
          </div>
        ) : (
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
                  {/* <th className='text-foreground px-4 py-3 text-left font-semibold'>Type</th> */}
                  <th className='text-foreground px-4 py-3 text-right font-semibold'>Actions</th>
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

                    {/* Type */}
                    {/* <td className='px-4 py-4'>
                      <div className='flex flex-col items-start gap-1'>
                        <TypeBadge type={a.assessment_type} />
                        {a.rubric_uuid === null && (
                          <div className='flex items-center gap-2'>
                            <span className='bg-destructive/10 text-destructive rounded-md px-2 py-0.5 text-xs font-medium'>
                              No rubric
                            </span>
                            <button
                              onClick={() => openEdit(a)}
                              className='text-destructive hover:text-destructive/80 text-xs font-medium underline underline-offset-2 transition-colors'
                            >
                              Add rubric
                            </button>
                          </div>
                        )}
                      </div>
                    </td> */}

                    {/* Actions */}
                    <td className='px-4 py-4'>
                      <div className='flex items-center justify-end gap-1'>
                        <button
                          onClick={() => openEdit(a)}
                          className='text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-1.5 transition-colors'
                          title='Edit assessment'
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeletingAssessment(a)}
                          className='text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg p-1.5 transition-colors'
                          title='Delete assessment'
                        >
                          <Trash2 size={15} />
                        </button>
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
                  <td className='px-4 py-3' />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {!isLoading && assessments.length > 0 && totalWeight !== 100 && (
          <div
            className={`flex items-center gap-2 border-t px-6 py-3 text-sm font-medium ${totalWeight > 100 ? 'bg-destructive/5 text-destructive' : 'bg-primary/15 text-primary'}`}
          >
            <AlertTriangle size={14} />
            {totalWeight > 100
              ? `Total weight exceeds 100% by ${totalWeight - 100}%. Please adjust.`
              : `Total weight is ${totalWeight}%. ${100 - totalWeight}% remaining to allocate.`}
          </div>
        )}
      </div>

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

      {/* Course Rubrics */}
      {/* <div className='bg-card mt-10'>
        <div className='flex flex-col gap-1 px-6 pt-6 sm:flex-row sm:items-center sm:justify-between'>
          <h3 className='text-foreground text-lg font-bold'>Course Rubrics</h3>
        </div>

        <div className='flex flex-col'>
          {filteredRubrics.map(rubric => {
            const sortedLevels = [...(rubric.scoringLevels ?? [])].sort(
              (a: unknown, b: unknown) => (a.level_order ?? 0) - (b.level_order ?? 0)
            );
            const sortedCriteria = [...(rubric.criteria ?? [])].sort(
              (a: unknown, b: unknown) => (a.display_order ?? 0) - (b.display_order ?? 0)
            );
            const matrixCells: Record<string, unknown> = {};
            sortedCriteria.forEach((crit: unknown) => {
              (crit.scoring ?? []).forEach((cell: unknown) => {
                matrixCells[`${crit.uuid}_${cell.rubric_scoring_level_uuid}`] = cell;
              });
            });

            return (
              <div key={rubric.uuid} className='bg-card mx-2 my-4 overflow-hidden rounded-xl border pb-3 shadow-sm'>
                <div className='px-6 py-5'>
                  <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                    <div className='flex flex-col gap-1.5'>
                      <h4 className='text-foreground text-base font-bold'>{rubric.title || 'Untitled Rubric'}</h4>
                      {rubric.description && (
                        <p className='text-muted-foreground line-clamp-2 max-w-2xl text-sm'>{rubric.description}</p>
                      )}
                      <div className='text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-xs'>
                        {rubric.rubric_type && (
                          <span className='flex items-center gap-1'>
                            <span className='bg-success h-2 w-2 rounded-full' />
                            Type: <span className='text-foreground font-medium'>{rubric.rubric_type}</span>
                          </span>
                        )}
                        {rubric.rubric_category && (
                          <span className='flex items-center gap-1'>
                            Category: <span className='text-foreground font-medium'>{rubric.rubric_category}</span>
                          </span>
                        )}
                        <span className='flex items-center gap-1'>
                          {rubric.is_public
                            ? <><Globe size={12} /><span className='text-foreground font-medium'>Public</span></>
                            : <><LockIcon size={12} /><span className='text-foreground font-medium'>Private</span></>}
                        </span>
                        {rubric.total_weight != null && (
                          <span>Weight: <span className='text-foreground font-medium'>{rubric.total_weight}</span></span>
                        )}
                        {rubric.min_passing_score != null && (
                          <span>Min pass: <span className='text-foreground font-medium'>{rubric.min_passing_score}</span></span>
                        )}
                      </div>
                    </div>
                    <div className='flex shrink-0 items-center gap-2'>
                      <Link href='/dashboard/rubrics' target='_blank'>
                        <Button type='button' variant='outline' size='sm' className='w-fit self-center'>
                          <Edit2 size={13} /> Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {sortedCriteria.length === 0 ? (
                  <div className='text-muted-foreground border-t px-6 py-4 text-xs italic'>No criteria added yet.</div>
                ) : (
                  <div className='overflow-x-auto border-t'>
                    <table className='w-full text-sm'>
                      <thead>
                        <tr className='bg-muted/40 border-b'>
                          <th className='text-foreground min-w-[200px] px-4 py-2.5 text-left text-xs font-semibold'>Criteria</th>
                          {sortedLevels.map((level: unknown) => (
                            <th
                              key={level.uuid}
                              className='text-foreground min-w-[130px] border-l px-3 py-2.5 text-center text-xs font-semibold'
                              style={level.color_code ? { backgroundColor: level.color_code + '22' } : undefined}
                            >
                              {level.name || level.description}
                              {level.points != null && (
                                <span className='text-muted-foreground ml-1 font-normal'>({level.points} pts)</span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className='divide-y'>
                        {sortedCriteria.map((crit: unknown) => (
                          <tr key={crit.uuid} className='hover:bg-muted/20 transition-colors'>
                            <td className='px-4 py-3 align-top'>
                              <p className='text-foreground text-xs font-medium'>{crit.component_name}</p>
                              {crit.description && (
                                <p className='text-muted-foreground mt-0.5 whitespace-pre-wrap text-xs'>{crit.description}</p>
                              )}
                            </td>
                            {sortedLevels.map((level: unknown) => {
                              const cell = matrixCells[`${crit.uuid}_${level.uuid}`] ?? null;
                              return (
                                <td key={level.uuid} className='border-l px-3 py-3 align-top text-xs'>
                                  {cell ? (
                                    <div className='text-muted-foreground whitespace-pre-wrap'>
                                      {cell.description || <span className='italic'>No description</span>}
                                      {cell.points != null && (
                                        <p className='text-foreground mt-1 font-medium'>{cell.points} pts</p>
                                      )}
                                    </div>
                                  ) : (
                                    <span className='text-muted-foreground'>—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div> */}

      <AssessmentSheet
        open={!!modalMode}
        mode={modalMode ?? 'add'}
        initial={editingAssessment}
        courseUuid={courseUuid}
        createdBy={createdBy}
        onClose={closeModal}
        onSuccess={onMutationSuccess}
      />

      <DeleteConfirmSheet
        open={!!deletingAssessment}
        assessment={deletingAssessment}
        courseUuid={courseUuid}
        onClose={() => setDeletingAssessment(undefined)}
        onSuccess={onMutationSuccess}
      />
    </>
  );
};
