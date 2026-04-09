import {
  RequirementTypeEnum as RequirementTypeValues,
  type Course,
  type ProgramRequirement,
  type RequirementTypeEnum,
} from '@/services/client/types.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';
import { Textarea } from '../../../../../components/ui/textarea';
import {
  addProgramCourseMutation,
  addProgramRequirementMutation,
  deleteProgramRequirementMutation,
  getAllCoursesOptions,
  getProgramCoursesOptions,
  getProgramCoursesQueryKey,
  getProgramRequirementsOptions,
  getProgramRequirementsQueryKey,
  removeProgramCourseMutation,
  updateProgramRequirementMutation,
} from '../../../../../services/client/@tanstack/react-query.gen';

type ProgramCourseManagementProps = {
  programUuid: string;
  onSaveDraft: () => void;
  onBack: () => void;
  onPublish?: () => void;
  isPublishing?: boolean;
  editingProgram?: {
    status?: string;
  };
};

type ProgramRequirementFormState = {
  requirement_type: RequirementTypeEnum;
  requirement_text: string;
  is_mandatory: boolean;
};

type ProgramCoursePreview = Course & {
  is_required?: boolean;
};

const normalizeRequirementType = (value: string | null | undefined): RequirementTypeEnum => {
  const normalized = value?.toUpperCase();

  switch (normalized) {
    case RequirementTypeValues.STUDENT:
      return RequirementTypeValues.STUDENT;
    case RequirementTypeValues.INSTRUCTOR:
      return RequirementTypeValues.INSTRUCTOR;
    case RequirementTypeValues.TRAINING_CENTER:
      return RequirementTypeValues.TRAINING_CENTER;
    default:
      return RequirementTypeValues.STUDENT;
  }
};

const ProgramCourseManagement = ({
  programUuid,
  onSaveDraft,
  onBack,
}: ProgramCourseManagementProps) => {
  const qc = useQueryClient();

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editingRequirementUuid, setEditingRequirementUuid] = useState<string | null>(null);

  const [newRequirement, setNewRequirement] = useState<ProgramRequirementFormState>({
    requirement_type: RequirementTypeValues.STUDENT,
    requirement_text: '',
    is_mandatory: true,
  });

  const { data: allCoursesData } = useQuery({
    ...getAllCoursesOptions({ query: { pageable: {} } }),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const { data: programCourses } = useQuery({
    ...getProgramCoursesOptions({ path: { programUuid } }),
    enabled: !!programUuid,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const { data: programRequirements } = useQuery({
    ...getProgramRequirementsOptions({
      path: { programUuid },
      query: { pageable: {} },
    }),
    enabled: !!programUuid,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const addCourseMut = useMutation({
    ...addProgramCourseMutation(),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: getProgramCoursesQueryKey({
          path: { programUuid },
        }),
      });
      setShowCourseModal(false);
      setSelectedCourse(null);
    },
  });

  const removeCourseMut = useMutation({
    ...removeProgramCourseMutation(),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: getProgramCoursesQueryKey({
          path: { programUuid },
        }),
      });
    },
  });

  const addRequirementMut = useMutation({
    ...addProgramRequirementMutation(),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: getProgramRequirementsQueryKey({
          path: { programUuid },
          query: { pageable: {} },
        }),
      });

      setShowRequirementModal(false);
      setNewRequirement({
        requirement_type: RequirementTypeValues.STUDENT,
        requirement_text: '',
        is_mandatory: true,
      });
      setEditingRequirementUuid(null);
    },
  });

  const updateRequirementMut = useMutation({
    ...updateProgramRequirementMutation(),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: getProgramRequirementsQueryKey({
          path: { programUuid },
          query: { pageable: {} },
        }),
      });

      setShowRequirementModal(false);
      setEditingRequirementUuid(null);
      setNewRequirement({
        requirement_type: RequirementTypeValues.STUDENT,
        requirement_text: '',
        is_mandatory: true,
      });
    },
  });

  const removeRequirementMut = useMutation({
    ...deleteProgramRequirementMutation(),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: getProgramRequirementsQueryKey({
          path: { programUuid },
          query: { pageable: {} },
        }),
      });
    },
  });

  const allCourses = allCoursesData?.data?.content || [];
  const assignedCourseUuids = programCourses?.data?.map(pc => pc.uuid) || [];
  const availableCourses = allCourses.filter(c => !assignedCourseUuids.includes(c.uuid));
  const programCourseList: ProgramCoursePreview[] = programCourses?.data ?? [];

  const handleAddCourse = () => {
    if (!selectedCourse?.uuid) return;

    addCourseMut.mutate({
      body: {
        program_uuid: programUuid,
        course_uuid: selectedCourse.uuid,
        sequence_order: (programCourses?.data?.length || 0) + 1,
        is_required: true,
        association_category: 'Required Course',
        has_prerequisites: false,
      },
      path: { programUuid },
    });
  };

  const handleRemoveCourse = (courseUuid: string) => {
    removeCourseMut.mutate({
      path: { programUuid, courseUuid },
    });
  };

  const resetRequirementForm = () => {
    setEditingRequirementUuid(null);
    setNewRequirement({
      requirement_type: RequirementTypeValues.STUDENT,
      requirement_text: '',
      is_mandatory: true,
    });
  };

  const handleAddRequirement = () => {
    if (!newRequirement.requirement_text.trim()) return;

    if (editingRequirementUuid) {
      updateRequirementMut.mutate({
        path: {
          programUuid,
          requirementUuid: editingRequirementUuid,
        },
        body: {
          uuid: editingRequirementUuid,
          program_uuid: programUuid,
          requirement_type: newRequirement.requirement_type as ProgramRequirement['requirement_type'],
          requirement_text: newRequirement.requirement_text,
          is_mandatory: newRequirement.is_mandatory,
          requirement_category: newRequirement.is_mandatory
            ? 'Mandatory Requirement'
            : 'Optional Requirement',
          is_optional: !newRequirement.is_mandatory,
        } as ProgramRequirement,
      });
      return;
    }

    addRequirementMut.mutate({
      body: {
        program_uuid: programUuid,
        requirement_type: newRequirement.requirement_type as ProgramRequirement['requirement_type'],
        requirement_text: newRequirement.requirement_text,
        is_mandatory: newRequirement.is_mandatory,
        requirement_category: newRequirement.is_mandatory
          ? 'Mandatory Requirement'
          : 'Optional Requirement',
        is_optional: !newRequirement.is_mandatory,
      },
      path: { programUuid },
    });
  };

  const handleRemoveRequirement = (reqUuid: string) => {
    removeRequirementMut.mutate({
      path: {
        programUuid,
        requirementUuid: reqUuid,
      },
    });
  };

  const handleEditRequirement = (requirement: ProgramRequirement) => {
    setEditingRequirementUuid(requirement.uuid ?? null);
    setNewRequirement({
      requirement_type:
        normalizeRequirementType(requirement.requirement_type) as ProgramRequirementFormState['requirement_type'],
      requirement_text: requirement.requirement_text || '',
      is_mandatory: requirement.is_mandatory ?? !requirement.is_optional,
    });
    setShowRequirementModal(true);
  };

  return (
    <div className='space-y-6'>
      <div className='border-border bg-background rounded-lg border p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <div>
            <h3 className='text-foreground text-lg font-semibold'>Program Courses</h3>
            <p className='text-muted-foreground text-sm'>Add courses to your training program</p>
          </div>
          <Button
            onClick={() => setShowCourseModal(true)}
            className='bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium'
          >
            <PlusCircle /> Add Course
          </Button>
        </div>

        <div className='space-y-3'>
          {programCourseList.length === 0 ? (
            <div className='border-border rounded-lg border-2 border-dashed py-8 text-center'>
              <div className='mb-2 text-3xl'>📖</div>
              <p className='text-muted-foreground'>No courses added yet</p>
              <p className='text-muted-foreground text-sm'>
                Click &quot;Add Course&quot; to get started
              </p>
            </div>
          ) : (
            programCourseList.map((course, index) => (
              <div
                key={course.uuid}
                className='border-border bg-muted flex items-center justify-between rounded-lg border p-4'
              >
                <div className='flex items-center gap-4'>
                  <div className='bg-primary/5 text-primary flex h-10 w-10 items-center justify-center rounded-lg font-semibold'>
                    {index + 1}
                  </div>
                  <div>
                    <div className='text-foreground font-medium'>{course.name || 'Course'}</div>
                    {course.is_required && (
                      <span className='bg-destructive/10 text-destructive mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium'>
                        Required
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => course.uuid && handleRemoveCourse(course.uuid)}
                  disabled={removeCourseMut.isPending}
                  className='bg-destructive/10 text-destructive hover:bg-destructive/20 rounded px-3 py-1 text-sm font-medium'
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Requirements */}
      <div className='border-border bg-background rounded-lg border p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <div>
            <h3 className='text-foreground text-lg font-semibold'>Program Requirements</h3>
            <p className='text-muted-foreground text-sm'>Set prerequisites and requirements</p>
          </div>
          <Button
            onClick={() => {
              resetRequirementForm();
              setShowRequirementModal(true);
            }}
            className='bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium'
          >
            <PlusCircle /> Add Requirement
          </Button>
        </div>

        <div className='space-y-3'>
          {!programRequirements || programRequirements?.data?.content?.length === 0 ? (
            <div className='border-border rounded-lg border-2 border-dashed py-8 text-center'>
              <div className='mb-2 text-3xl'>📖</div>
              <p className='text-muted-foreground'>No requirements added yet</p>
              <p className='text-muted-foreground text-sm'>
                Click &quot;Add Requirement&quot; to get started
              </p>
            </div>
          ) : (
            programRequirements?.data?.content?.map((req, index) => (
              <div
                key={req.uuid}
                className='border-border bg-muted flex items-center justify-between rounded-lg border p-4'
              >
                <div className='flex items-center gap-4'>
                  <div className='bg-primary/5 text-primary flex h-10 w-10 items-center justify-center rounded-lg font-semibold'>
                    {index + 1}
                  </div>
                  <div>
                    <div className='text-foreground font-medium'>{req.requirement_text}</div>
                    <div className='text-muted-foreground text-sm'>{req.requirement_category}</div>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    onClick={() => handleEditRequirement(req)}
                    disabled={updateRequirementMut.isPending}
                    className='rounded px-3 py-1 text-sm font-medium'
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => req.uuid && handleRemoveRequirement(req.uuid)}
                    disabled={removeRequirementMut.isPending}
                    className='bg-destructive/10 text-destructive hover:bg-destructive/20 rounded px-3 py-1 text-sm font-medium'
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className='border-border flex justify-between border-t pt-6'>
        <Button
          onClick={onBack}
          variant={'ghost'}
          className='border-border text-foreground hover:bg-muted rounded-lg border px-6 py-2 font-medium'
        >
          ← Back
        </Button>
        <div className='flex gap-3'>
          <Button
            onClick={onSaveDraft}
            variant={'ghost'}
            className='border-border text-foreground hover:bg-muted rounded-lg border px-6 py-2 font-medium'
          >
            Save
          </Button>
          {/* <Button
                        onClick={onPublish}
                        disabled={
                            isPublishing ||
                            editingProgram?.status === 'published'
                        }
                        className='rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
                    >
                        {isPublishing
                            ? 'Publishing...'
                            : 'Publish Program'}
                    </Button> */}
        </div>
      </div>

      {/* Add Course Modal */}
      <Dialog open={showCourseModal} onOpenChange={setShowCourseModal}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Add Course to Program</DialogTitle>
          </DialogHeader>

          <div className='mb-6 max-h-96 space-y-2 overflow-y-auto'>
            {availableCourses.length === 0 ? (
              <p className='text-muted-foreground text-center'>No available courses to add</p>
            ) : (
              availableCourses.map(course => (
                <div
                  key={course.uuid}
                  onClick={() => setSelectedCourse(course)}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${selectedCourse?.uuid === course.uuid
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-muted/80'
                    }`}
                >
                  <div className='font-medium'>{course.name}</div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className='gap-3'>
            <Button
              variant='ghost'
              onClick={() => {
                setShowCourseModal(false);
                setSelectedCourse(null);
              }}
            >
              Cancel
            </Button>

            <Button onClick={handleAddCourse} disabled={!selectedCourse || addCourseMut.isPending}>
              {addCourseMut.isPending ? 'Adding...' : 'Add Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Requirement Modal */}
      <Dialog open={showRequirementModal} onOpenChange={setShowRequirementModal}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {editingRequirementUuid ? 'Edit Requirement' : 'Add Requirement'}
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            <div>
              <Label className='mb-2 block text-sm font-medium'>Requirement Type</Label>
              <Select
                value={newRequirement.requirement_type}
                onValueChange={value =>
                  setNewRequirement(prev => ({
                    ...prev,
                    requirement_type: value as ProgramRequirementFormState['requirement_type'],
                  }))
                }
              >
                <SelectTrigger className='w-full rounded-lg'>
                  <SelectValue placeholder='Select requirement type' />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={RequirementTypeValues.STUDENT}>
                    Student Requirement
                  </SelectItem>
                  <SelectItem value={RequirementTypeValues.INSTRUCTOR}>
                    Instructor Requirement
                  </SelectItem>
                  <SelectItem value={RequirementTypeValues.TRAINING_CENTER}>
                    Training Center Requirement
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className='mb-2 block text-sm font-medium'>Requirement Description</Label>
              <Textarea
                value={newRequirement.requirement_text}
                onChange={e =>
                  setNewRequirement(prev => ({
                    ...prev,
                    requirement_text: e.target.value,
                  }))
                }
                rows={4}
                className='focus:border-primary w-full rounded-lg border px-4 py-2 focus:outline-none'
                placeholder='Describe the requirement...'
              />
            </div>

            <div className='flex items-center gap-2'>
              <Input
                type='checkbox'
                id='is_mandatory'
                checked={newRequirement.is_mandatory}
                onChange={e =>
                  setNewRequirement(prev => ({
                    ...prev,
                    is_mandatory: e.target.checked,
                  }))
                }
                className='border-muted text-primary focus:ring-primary h-4 w-4 rounded'
              />
              <Label htmlFor='is_mandatory' className='text-sm font-medium'>
                This is a mandatory requirement
              </Label>
            </div>
          </div>

          <DialogFooter className='gap-3'>
            <Button
              variant='ghost'
              onClick={() => {
                setShowRequirementModal(false);
                resetRequirementForm();
              }}
            >
              Cancel
            </Button>

            <Button
              variant='success'
              onClick={handleAddRequirement}
              disabled={
                !newRequirement.requirement_text.trim() ||
                addRequirementMut.isPending ||
                updateRequirementMut.isPending
              }
            >
              {editingRequirementUuid
                ? updateRequirementMut.isPending
                  ? 'Saving...'
                  : 'Save Changes'
                : addRequirementMut.isPending
                  ? 'Adding...'
                  : 'Add Requirement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProgramCourseManagement;
