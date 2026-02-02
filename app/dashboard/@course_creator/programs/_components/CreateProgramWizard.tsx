'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import {
    createTrainingProgramMutation,
    getAllTrainingProgramsQueryKey,
    publishProgramMutation,
    updateTrainingProgramMutation,
} from '@/services/client/@tanstack/react-query.gen';

import { Button } from '../../../../../components/ui/button';
import { useCourseCreator } from '../../../../../context/course-creator-context';
import ProgramBasicInfo from './ProgramBasicInfo';
import ProgramCourseManagement from './ProgramCourseManagement';

const CreateProgramWizard = ({
    editingProgram,
    onComplete,
    onCancel,
}: any) => {
    const qc = useQueryClient();
    const creator = useCourseCreator()
    const [step, setStep] = useState(1);
    const [programUuid, setProgramUuid] = useState<string | null>(
        editingProgram?.uuid || null
    );

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        objectives: '',
        prerequisites: '',
        class_limit: 50,
        price: 0,
        program_type: '',
        course_creator_uuid: creator?.profile?.uuid,
        category_uuid: '',
        total_duration_hours: 0,
        total_duration_minutes: 0,
        status: 'DRAFT',
        active: false,
    });

    useEffect(() => {
        if (!editingProgram) return;

        setFormData({
            title: editingProgram.title ?? '',
            description: editingProgram.description ?? '',
            objectives: editingProgram.objectives ?? '',
            prerequisites: editingProgram.prerequisites ?? '',
            class_limit: editingProgram.class_limit ?? 50,
            price: editingProgram.price ?? 0,
            program_type: editingProgram.program_type ?? '',
            course_creator_uuid: editingProgram.course_creator_uuid ?? creator?.profile?.uuid,
            category_uuid: editingProgram.category_uuid ?? '',
            total_duration_hours: editingProgram.total_duration_hours ?? 0,
            total_duration_minutes: editingProgram.total_duration_minutes ?? 0,
            status: editingProgram.status ?? 'DRAFT',
            active: editingProgram.active ?? false,
        });
    }, [editingProgram]);

    const createProgramMut = useMutation({
        ...createTrainingProgramMutation(),
        onSuccess: (data) => {
            const uuid = data?.data?.uuid || data?.uuid;

            if (uuid) {
                setProgramUuid(uuid);
                qc.invalidateQueries({
                    queryKey: getAllTrainingProgramsQueryKey({
                        query: { pageable: {} },
                    }),
                });
                setStep(2);
            } else {
            }

            qc.invalidateQueries({
                queryKey: getAllTrainingProgramsQueryKey({
                    query: { pageable: {} },
                }),
            });
        },
        onError: (error) => {
        },
    });

    const updateProgramMut = useMutation({
        ...updateTrainingProgramMutation(),
        onSuccess: () => {
            qc.invalidateQueries({
                queryKey: getAllTrainingProgramsQueryKey({
                    query: { pageable: {} },
                }),
            });
        },
    });

    const publishProgramMut = useMutation({
        ...publishProgramMutation(),
        onSuccess: () => {
            qc.invalidateQueries({
                queryKey: getAllTrainingProgramsQueryKey({
                    query: { pageable: {} },
                }),
            });
            onComplete();
        },
    });

    const handleStep1Submit = (data: any) => {
        setFormData(data);

        if (editingProgram) {
            updateProgramMut.mutate({
                body: data,
                path: { uuid: programUuid as string },
            });
            setStep(2);
        } else {
            createProgramMut.mutate({ body: data });
        }
    };

    const handlePublish = () => {
        if (!programUuid) return;
        publishProgramMut.mutate({ path: { uuid: programUuid } });
    };

    const handleSaveDraft = () => {
        onComplete();
    };

    return (
        <div className='p-6'>
            <div className='mb-8'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${step >= 1
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                                }`}
                        >
                            {step > 1 ? '✓' : '1'}
                        </div>
                        <div>
                            <div className='font-medium text-foreground'>
                                Basic Information
                            </div>
                            <div className='text-sm text-muted-foreground'>
                                Program details and settings
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className='h-0.5 w-24 bg-muted'>
                        <div
                            className={`h-full transition-all ${step >= 2 ? 'bg-primary' : 'bg-muted'
                                }`}
                        />
                    </div>

                    {/* Step 2 */}
                    <div className='flex items-center gap-4'>
                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${step >= 2
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                                }`}
                        >
                            2
                        </div>
                        <div>
                            <div className='font-medium text-foreground'>
                                Courses & Requirements
                            </div>
                            <div className='text-sm text-muted-foreground'>
                                Add courses and set requirements
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                {step === 1 && (
                    <ProgramBasicInfo
                        initialData={editingProgram || formData}
                        onSubmit={handleStep1Submit}
                        onCancel={onCancel}
                        isLoading={
                            createProgramMut.isPending ||
                            updateProgramMut.isPending
                        }
                        isEditing={!!editingProgram}
                    />
                )}

                {step === 2 && (
                    programUuid ? (
                        <ProgramCourseManagement
                            programUuid={programUuid}
                            onPublish={handlePublish}
                            onSaveDraft={handleSaveDraft}
                            onBack={() => setStep(1)}
                            isPublishing={publishProgramMut.isPending}
                            editingProgram={editingProgram}
                        />
                    ) : (
                        <div className="rounded-lg border border-border bg-card p-8 text-center">
                            <div className="text-muted-foreground">
                                <p className="mb-2 text-lg font-semibold">Program UUID not found</p>
                                <p className="text-sm">Please go back and try again, or contact support if the issue persists.</p>
                                <Button
                                    onClick={() => setStep(1)}
                                    className="mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                                >
                                    Go Back
                                </Button>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default CreateProgramWizard;
