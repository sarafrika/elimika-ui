'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import Spinner from '../../../../components/ui/spinner';
import { Switch } from '../../../../components/ui/switch';
import {
  addCourseAssessmentMutation,
  deleteCourseAssessmentMutation,
  getAllAssessmentRubricsOptions,
  getCourseAssessmentsOptions,
  updateCourseAssessmentMutation
} from '../../../../services/client/@tanstack/react-query.gen';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CourseAssessmentStructureProps = {
  courseUuid: string;
  createdBy: string;
};

type Assessment = {
  uuid: string;
  title: string;
  description?: string;
  rubric_uuid?: string;
  weight_percentage: number;
  is_required: boolean;
  assessment_type: string;
  is_major_assessment: boolean;
  course_uuid: string;
  created_date?: string;
  created_by?: string;
  updated_date?: string;
  updated_by?: string;
  assessment_category?: string;
  weight_display?: string;
  contribution_level?: string;
};

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

// ─── Badge helper ─────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  'Attendance': 'bg-muted text-muted-foreground',
  'Diagnostic/Entry': 'bg-secondary text-secondary-foreground',
  'Continuous Diagnostic': 'bg-accent text-accent-foreground',
  'Formative (theory)': 'bg-primary/10 text-primary',
  'Formative (practical)': 'bg-primary/20 text-primary',
  'Summative': 'bg-destructive/10 text-destructive',
  'Project': 'bg-accent/60 text-accent-foreground',
  'Exam': 'bg-destructive/20 text-destructive',
  'Other': 'bg-muted text-muted-foreground',
};

function TypeBadge({ type }: { type: string }) {
  const cls = TYPE_COLORS[type] ?? TYPE_COLORS['Other'];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {type}
    </span>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type ModalMode = 'add' | 'edit';

type AssessmentModalProps = {
  mode: ModalMode;
  initial?: Assessment;
  courseUuid: string;
  createdBy: string;
  onClose: () => void;
  onSuccess: () => void;
};

function AssessmentModal({
  mode,
  initial,
  courseUuid,
  createdBy,
  onClose,
  onSuccess,
}: AssessmentModalProps) {
  const [form, setForm] = useState<AssessmentFormValues>(() =>
    initial
      ? {
        title: initial.title,
        description: initial.description ?? '',
        rubric_uuid: initial.rubric_uuid ?? '',
        weight_percentage: initial.weight_percentage,
        is_required: initial.is_required,
        assessment_type: initial.assessment_type,
        is_major_assessment: initial.is_major_assessment,
      }
      : DEFAULT_FORM
  );

  const [errors, setErrors] = useState<Partial<Record<keyof AssessmentFormValues, string>>>({});

  const { data: allRubrics, isLoading: isLoadingRubrics } = useQuery(
    getAllAssessmentRubricsOptions({ query: { pageable: {} } })
  );
  const rubrics: any[] = allRubrics?.data?.content ?? [];
  const selectedRubric = rubrics.find((r: any) => r.uuid === form.rubric_uuid)

  const createMut = useMutation(addCourseAssessmentMutation());
  const updateMut = useMutation(updateCourseAssessmentMutation());

  const isSaving = createMut.isPending || updateMut.isPending;

  function set<K extends keyof AssessmentFormValues>(key: K, value: AssessmentFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.assessment_type) newErrors.assessment_type = 'Assessment type is required';
    if (form.weight_percentage === '' || Number(form.weight_percentage) < 0 || Number(form.weight_percentage) > 100) {
      newErrors.weight_percentage = 'Weight must be between 0 and 100';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    const body = {
      title: form.title.trim(),
      description: form.description.trim(),
      rubric_uuid: form.rubric_uuid || undefined,
      weight_percentage: Number(form.weight_percentage),
      is_required: form.is_required,
      assessment_type: form.assessment_type,
      is_major_assessment: form.is_major_assessment,
    };

    if (mode === 'add') {
      createMut.mutate(
        {
          path: { courseUuid },
          body: { ...body, course_uuid: courseUuid, created_by: createdBy } as any,
        },
        {
          onSuccess: () => {
            toast.success('Assessment created successfully!');
            onSuccess();
          },
          onError: (err: any) => {
            toast.error(err?.message || 'Failed to create assessment');
          },
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
          } as any,
        },
        {
          onSuccess: () => {
            toast.success('Assessment updated successfully!');
            onSuccess();
          },
          onError: (err: any) => {
            toast.error(err?.message || 'Failed to update assessment');
          },
        }
      );
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/50 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* Panel */}
      <div className='relative z-10 w-full max-w-lg rounded-2xl border bg-card shadow-2xl'>
        {/* Header */}
        <div className='flex items-center justify-between border-b px-6 py-4'>
          <div>
            <h2 className='text-foreground text-lg font-bold'>
              {mode === 'add' ? 'Add Assessment' : 'Edit Assessment'}
            </h2>
            <p className='text-muted-foreground mt-0.5 text-xs'>
              {mode === 'add'
                ? 'Define a new assessment component for this course'
                : 'Update the assessment component details'}
            </p>
          </div>
          <button
            onClick={onClose}
            className='text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors hover:bg-muted'
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className='flex flex-col gap-5 overflow-y-auto p-6' style={{ maxHeight: '70vh' }}>
          {/* Title */}
          <div className='flex flex-col gap-1.5'>
            <Label className='text-sm font-medium'>
              Title <span className='text-destructive'>*</span>
            </Label>
            <Input
              placeholder='e.g. Weekly Quizzes'
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
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
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className='border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 resize-none'
            />
          </div>

          {/* Assessment Type */}
          <div className='flex flex-col gap-1.5'>
            <Label className='text-sm font-medium'>
              Assessment Type <span className='text-destructive'>*</span>
            </Label>
            <Select value={form.assessment_type} onValueChange={(v) => set('assessment_type', v)}>
              <SelectTrigger className={errors.assessment_type ? 'border-destructive' : ''}>
                <SelectValue placeholder='Select assessment type' />
              </SelectTrigger>
              <SelectContent>
                {ASSESSMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assessment_type && (
              <p className='text-destructive text-xs'>{errors.assessment_type}</p>
            )}
          </div>

          {/* Weight */}
          <div className='flex flex-col gap-1.5'>
            <Label className='text-sm font-medium'>
              Weight Percentage (%) <span className='text-destructive'>*</span>
            </Label>
            <Input
              type='number'
              min={0}
              max={100}
              placeholder='e.g. 25'
              value={form.weight_percentage}
              onChange={(e) =>
                set(
                  'weight_percentage',
                  e.target.value === '' ? '' : Number(e.target.value)
                )
              }
              className={errors.weight_percentage ? 'border-destructive' : ''}
            />
            {errors.weight_percentage && (
              <p className='text-destructive text-xs'>{errors.weight_percentage}</p>
            )}
          </div>

          {/* Rubric (optional) */}
          <div className='flex flex-col gap-1.5'>
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
              <Select
                value={form.rubric_uuid || '__none__'}
                onValueChange={(v) => set('rubric_uuid', v === '__none__' ? '' : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a rubric (optional)">
                    {selectedRubric?.title}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-muted-foreground">None</span>
                  </SelectItem>

                  {rubrics.length > 0 ? (
                    rubrics.map((r: any) => (
                      <SelectItem key={r.uuid} value={r.uuid}>
                        <div className="flex flex-col">
                          <span className="font-medium">{r.title}</span>
                          {r.description && (
                            <span className="text-muted-foreground text-xs line-clamp-1">
                              {r.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="text-muted-foreground px-3 py-2 text-center text-xs">
                      No rubrics available
                    </div>
                  )}
                </SelectContent>
              </Select>

            )}
            {/* Selected rubric detail chip */}
            {selectedRubric && (
              <div className='bg-muted/50 mt-1 flex items-start justify-between gap-2 rounded-lg border px-3 py-2'>
                <div className='min-w-0'>
                  <p className='text-foreground truncate text-xs font-semibold'>{selectedRubric.title}</p>
                  {selectedRubric.description && (
                    <p className='text-muted-foreground mt-0.5 line-clamp-2 text-xs'>
                      {selectedRubric.description}
                    </p>
                  )}

                </div>
                <button
                  type='button'
                  onClick={() => set('rubric_uuid', '')}
                  className='text-muted-foreground hover:text-foreground mt-0.5 shrink-0 rounded p-0.5 transition-colors hover:bg-muted'
                  title='Clear rubric'
                >
                  <X size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className='bg-muted/40 flex flex-col gap-4 rounded-xl border p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-foreground text-sm font-medium'>Required Assessment</p>
                <p className='text-muted-foreground text-xs'>Students must complete this assessment</p>
              </div>
              <Switch
                checked={form.is_required}
                onCheckedChange={(v) => set('is_required', v)}
              />
            </div>
            <div className='border-t pt-4 flex items-center justify-between'>
              <div>
                <p className='text-foreground text-sm font-medium'>Major Assessment</p>
                <p className='text-muted-foreground text-xs'>Mark as a high-stakes assessment</p>
              </div>
              <Switch
                checked={form.is_major_assessment}
                onCheckedChange={(v) => set('is_major_assessment', v)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-end gap-3 border-t px-6 py-4'>
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
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

type DeleteConfirmProps = {
  assessment: Assessment;
  courseUuid: string;
  onClose: () => void;
  onSuccess: () => void;
};

function DeleteConfirmModal({ assessment, courseUuid, onClose, onSuccess }: DeleteConfirmProps) {
  const deleteMut = useMutation(deleteCourseAssessmentMutation());

  function handleDelete() {
    deleteMut.mutate(
      { path: { courseUuid, assessmentUuid: assessment.uuid } } as any,
      {
        onSuccess: () => {
          toast.success('Assessment deleted successfully');
          onSuccess();
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Failed to delete assessment');
        },
      }
    );
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/50 backdrop-blur-sm' onClick={onClose} />
      <div className='relative z-10 w-full max-w-sm rounded-2xl border bg-card p-6 shadow-2xl'>
        <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10'>
          <AlertTriangle size={22} className='text-destructive' />
        </div>
        <h3 className='text-foreground mb-1 text-base font-bold'>Delete Assessment</h3>
        <p className='text-muted-foreground mb-6 text-sm'>
          Are you sure you want to delete{' '}
          <span className='text-foreground font-semibold'>{assessment.title}</span>? This action
          cannot be undone.
        </p>
        <div className='flex gap-3'>
          <Button variant='outline' className='flex-1' onClick={onClose} disabled={deleteMut.isPending}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            className='flex-1'
            onClick={handleDelete}
            disabled={deleteMut.isPending}
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
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const CourseAssessmentStructure = ({
  courseUuid,
  createdBy,
}: CourseAssessmentStructureProps) => {
  const qc = useQueryClient();

  const { data: assessmentsData, isLoading } = useQuery({
    ...getCourseAssessmentsOptions({ path: { courseUuid }, query: { pageable: {} } }),
    enabled: !!courseUuid,
  });

  const assessments: Assessment[] = assessmentsData?.data?.content ?? [];

  const totalWeight = assessments.reduce((sum, a) => sum + (a.weight_percentage ?? 0), 0);

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | undefined>(undefined);
  const [deletingAssessment, setDeletingAssessment] = useState<Assessment | undefined>(undefined);

  function openAdd() {
    setEditingAssessment(undefined);
    setModalMode('add');
  }

  function openEdit(a: Assessment) {
    setEditingAssessment(a);
    setModalMode('edit');
  }

  function openDelete(a: Assessment) {
    setDeletingAssessment(a);
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
                <tr className='border-b bg-muted/40'>
                  <th className='px-6 py-3 text-left font-semibold text-foreground'>
                    Component Title
                  </th>
                  <th className='px-4 py-3 text-left font-semibold text-foreground'>Type</th>
                  <th className='px-4 py-3 text-right font-semibold text-foreground'>Weight</th>
                  <th className='px-4 py-3 text-right font-semibold text-foreground'>
                    Score Range
                  </th>
                  <th className='px-4 py-3 text-center font-semibold text-foreground'>Required</th>
                  <th className='px-4 py-3 text-right font-semibold text-foreground'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {assessments.map((a) => (
                  <tr key={a.uuid} className='hover:bg-muted/30 transition-colors'>
                    <td className='px-6 py-4'>
                      <div>
                        <p className='text-foreground font-medium'>{a.title}</p>
                        {a.description && (
                          <p className='text-muted-foreground mt-0.5 text-xs line-clamp-1'>
                            {a.description}
                          </p>
                        )}
                        {a.is_major_assessment && (
                          <span className="mt-1 inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            Major
                          </span>
                        )}
                      </div>
                    </td>
                    <td className='px-4 py-4'>
                      <TypeBadge type={a.assessment_type} />
                    </td>
                    <td className='px-4 py-4 text-right font-semibold text-foreground'>
                      {a.weight_percentage}%
                    </td>
                    <td className='px-4 py-4 text-right font-semibold text-foreground'>
                      0–{a.weight_percentage}
                    </td>
                    <td className='px-4 py-4 text-center'>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${a.is_required
                          ? 'bg-success/10 text-success/70'
                          : 'bg-muted-foreground/10 text-muted-foreground'
                          }`}
                      >
                        {a.is_required ? 'Yes' : 'No'}
                      </span>
                    </td>
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
                          onClick={() => openDelete(a)}
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
              {/* Total row */}
              <tfoot>
                <tr className='border-t bg-muted/40'>
                  <td className='px-6 py-3 font-bold text-foreground'>Total</td>
                  <td className='px-4 py-3' />
                  <td
                    className={`px-4 py-3 text-right font-bold ${totalWeight === 100
                      ? 'text-green-600'
                      : totalWeight > 100
                        ? 'text-destructive'
                        : 'text-amber-600'
                      }`}
                  >
                    {totalWeight}%
                  </td>
                  <td className='px-4 py-3 text-right font-bold text-foreground'>
                    {totalWeight}
                  </td>
                  <td className='px-4 py-3' />
                  <td className='px-4 py-3' />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Weight warning */}
        {!isLoading && assessments.length > 0 && totalWeight !== 100 && (
          <div
            className={`flex items-center gap-2 border-t px-6 py-3 text-sm font-medium ${totalWeight > 100
              ? 'bg-destructive/5 text-destructive'
              : 'bg-primary/15 text-primary'
              }`}
          >
            <AlertTriangle size={14} />
            {totalWeight > 100
              ? `Total weight exceeds 100% by ${totalWeight - 100}%. Please adjust.`
              : `Total weight is ${totalWeight}%. ${100 - totalWeight}% remaining to allocate.`}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalMode && (
        <AssessmentModal
          mode={modalMode}
          initial={editingAssessment}
          courseUuid={courseUuid}
          createdBy={createdBy}
          onClose={closeModal}
          onSuccess={onMutationSuccess}
        />
      )}

      {/* Delete Confirm Modal */}
      {deletingAssessment && (
        <DeleteConfirmModal
          assessment={deletingAssessment}
          courseUuid={courseUuid}
          onClose={() => setDeletingAssessment(undefined)}
          onSuccess={onMutationSuccess}
        />
      )}
    </>
  );
};