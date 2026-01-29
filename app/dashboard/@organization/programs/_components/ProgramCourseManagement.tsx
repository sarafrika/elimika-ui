import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { useState } from 'react';

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
} from '../../../../../services/client/@tanstack/react-query.gen';

const ProgramCourseManagement = ({
    programUuid,
    onPublish,
    onSaveDraft,
    onBack,
    isPublishing,
    editingProgram,
}: any) => {
    const qc = useQueryClient();

    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showRequirementModal, setShowRequirementModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);

    const [newRequirement, setNewRequirement] = useState({
        requirement_type: 'STUDENT',
        requirement_text: '',
        is_mandatory: true,
    });

    /* =======================
       Queries
    ======================= */

    const { data: allCoursesData } = useQuery(
        getAllCoursesOptions({ query: { pageable: {} } })
    );

    const { data: programCourses } = useQuery({
        ...getProgramCoursesOptions({ path: { programUuid } }),
        enabled: !!programUuid,
    });

    const { data: programRequirements } = useQuery({
        ...getProgramRequirementsOptions({
            path: { programUuid },
            query: { pageable: {} },
        }),
        enabled: !!programUuid,
    });

    /* =======================
       Mutations
    ======================= */

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
                requirement_type: 'STUDENT',
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

    /* =======================
       Derived Data
    ======================= */

    const allCourses = allCoursesData?.data?.content || [];
    const assignedCourseUuids =
        programCourses?.data?.map((pc) => pc.uuid) || [];
    const availableCourses = allCourses.filter(
        (c) => !assignedCourseUuids.includes(c.uuid)
    );

    /* =======================
       Handlers
    ======================= */

    const handleAddCourse = () => {
        if (!selectedCourse) return;

        addCourseMut.mutate({
            body: {
                program_uuid: programUuid,
                course_uuid: selectedCourse.uuid,
                sequence_order:
                    (programCourses?.data?.length || 0) + 1,
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

    const handleAddRequirement = () => {
        if (!newRequirement.requirement_text.trim()) return;

        addRequirementMut.mutate({
            body: {
                program_uuid: programUuid,
                requirement_type: newRequirement.requirement_type,
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


    return (
        <div className='space-y-6'>
            <div className='rounded-lg border border-border bg-background p-6'>
                <div className='mb-4 flex items-center justify-between'>
                    <div>
                        <h3 className='text-lg font-semibold text-foreground'>
                            Program Courses
                        </h3>
                        <p className='text-sm text-muted-foreground'>
                            Add courses to your training program
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCourseModal(true)}
                        className='rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
                    >
                        + Add Course
                    </button>
                </div>

                <div className='space-y-3'>
                    {!programCourses ||
                        programCourses?.data?.length === 0 ? (
                        <div className='rounded-lg border-2 border-dashed border-border py-8 text-center'>
                            <div className='mb-2 text-3xl'>📖</div>
                            <p className='text-muted-foreground'>
                                No courses added yet
                            </p>
                            <p className='text-sm text-muted-foreground'>
                                Click &quot;Add Course&quot; to get started
                            </p>
                        </div>
                    ) : (
                        programCourses?.data?.map((course, index) => (
                            <div
                                key={course.uuid}
                                className='flex items-center justify-between rounded-lg border border-border bg-muted p-4'
                            >
                                <div className='flex items-center gap-4'>
                                    <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary'>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <div className='font-medium text-foreground'>
                                            {course.name || 'Course'}
                                        </div>
                                        {course.is_required && (
                                            <span className='mt-1 inline-block rounded bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive'>
                                                Required
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() =>
                                        handleRemoveCourse(course.uuid)
                                    }
                                    disabled={removeCourseMut.isPending}
                                    className='rounded bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive hover:bg-destructive/20'
                                >
                                    Remove
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Requirements */}
            <div className='rounded-lg border border-border bg-background p-6'>
                <div className='mb-4 flex items-center justify-between'>
                    <div>
                        <h3 className='text-lg font-semibold text-foreground'>
                            Program Requirements
                        </h3>
                        <p className='text-sm text-muted-foreground'>
                            Set prerequisites and requirements
                        </p>
                    </div>
                    <button
                        onClick={() => setShowRequirementModal(true)}
                        className='rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
                    >
                        + Add Requirement
                    </button>
                </div>

                <div className='space-y-3'>
                    {!programRequirements ||
                        programRequirements?.data?.content?.length ===
                        0 ? (
                        <div className='rounded-lg border-2 border-dashed border-border py-8 text-center'>
                            <div className='mb-2 text-3xl'>📖</div>
                            <p className='text-muted-foreground'>
                                No requirements added yet
                            </p>
                            <p className='text-sm text-muted-foreground'>
                                Click &quot;Add Requirement&quot; to get
                                started
                            </p>
                        </div>
                    ) : (
                        programRequirements?.data?.content?.map(
                            (req, index) => (
                                <div
                                    key={req.uuid}
                                    className='flex items-center justify-between rounded-lg border border-border bg-muted p-4'
                                >
                                    <div className='flex items-center gap-4'>
                                        <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary'>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className='font-medium text-foreground'>
                                                {req.requirement_text}
                                            </div>
                                            <div className='text-sm text-muted-foreground'>
                                                {req.requirement_category}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() =>
                                            handleRemoveRequirement(req.uuid)
                                        }
                                        disabled={removeRequirementMut.isPending}
                                        className='rounded bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive hover:bg-destructive/20'
                                    >
                                        Remove
                                    </button>
                                </div>
                            )
                        )
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className='flex justify-between border-t border-border pt-6'>
                <button
                    onClick={onBack}
                    className='rounded-lg border border-border px-6 py-2 font-medium text-foreground hover:bg-muted'
                >
                    ← Back
                </button>
                <div className='flex gap-3'>
                    <button
                        onClick={onSaveDraft}
                        className='rounded-lg border border-border px-6 py-2 font-medium text-foreground hover:bg-muted'
                    >
                        Save as Draft
                    </button>
                    <button
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
                    </button>
                </div>
            </div>

            {/* Add Course Modal */}
            {showCourseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay">
                    <div className="w-full max-w-2xl rounded-lg bg-surface p-6 shadow-xl">
                        <h3 className="mb-4 text-lg font-semibold text-on-surface">Add Course to Program</h3>

                        <div className="mb-6 max-h-96 space-y-2 overflow-y-auto">
                            {availableCourses.length === 0 ? (
                                <p className="text-center text-on-surface/60">No available courses to add</p>
                            ) : (
                                availableCourses.map((course) => (
                                    <div
                                        key={course.uuid}
                                        onClick={() => setSelectedCourse(course)}
                                        className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${selectedCourse?.uuid === course.uuid
                                            ? 'border-primary bg-primary/10'
                                            : 'border-muted hover:border-muted/80'
                                            }`}
                                    >
                                        <div className="font-medium text-on-surface">{course.name}</div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowCourseModal(false);
                                    setSelectedCourse(null);
                                }}
                                className="rounded-lg border border-muted px-4 py-2 font-medium text-on-surface hover:bg-surface/50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCourse}
                                className="rounded-lg bg-primary px-4 py-2 font-medium text-on-primary hover:bg-primary-hover disabled:opacity-50"
                                disabled={!selectedCourse || addCourseMut.isPending}
                            >
                                {addCourseMut.isPending ? 'Adding...' : 'Add Course'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Requirement Modal */}
            {showRequirementModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay">
                    <div className="w-full max-w-lg rounded-lg bg-surface p-6 shadow-xl">
                        <h3 className="mb-4 text-lg font-semibold text-on-surface">Add Requirement</h3>

                        <div className="mb-6 space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-on-surface/80">
                                    Requirement Type
                                </label>
                                <select
                                    value={newRequirement.requirement_type}
                                    onChange={(e) =>
                                        setNewRequirement((prev) => ({
                                            ...prev,
                                            requirement_type: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-muted px-4 py-2 focus:border-primary focus:outline-none"
                                >
                                    <option value="STUDENT">Student Requirement</option>
                                    <option value="TECHNICAL">Technical Requirement</option>
                                    <option value="ADMINISTRATIVE">Administrative Requirement</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-on-surface/80">
                                    Requirement Description
                                </label>
                                <textarea
                                    value={newRequirement.requirement_text}
                                    onChange={(e) =>
                                        setNewRequirement((prev) => ({
                                            ...prev,
                                            requirement_text: e.target.value,
                                        }))
                                    }
                                    rows={4}
                                    className="w-full rounded-lg border border-muted px-4 py-2 focus:border-primary focus:outline-none"
                                    placeholder="Describe the requirement..."
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_mandatory"
                                    checked={newRequirement.is_mandatory}
                                    onChange={(e) =>
                                        setNewRequirement((prev) => ({
                                            ...prev,
                                            is_mandatory: e.target.checked,
                                        }))
                                    }
                                    className="h-4 w-4 rounded border-muted text-primary focus:ring-primary"
                                />
                                <label htmlFor="is_mandatory" className="text-sm font-medium text-on-surface/80">
                                    This is a mandatory requirement
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowRequirementModal(false);
                                    setNewRequirement({
                                        requirement_type: 'STUDENT',
                                        requirement_text: '',
                                        is_mandatory: true,
                                    });
                                }}
                                className="rounded-lg border border-muted px-4 py-2 font-medium text-on-surface hover:bg-surface/50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddRequirement}
                                className="rounded-lg bg-success px-4 py-2 font-medium text-on-success hover:bg-success-hover disabled:opacity-50"
                                disabled={!newRequirement.requirement_text.trim() || addRequirementMut.isPending}
                            >
                                {addRequirementMut.isPending ? 'Adding...' : 'Add Requirement'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ProgramCourseManagement;
