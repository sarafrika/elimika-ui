'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import {
    createTrainingProgramMutation,
    getAllTrainingProgramsQueryKey,
    publishProgramMutation,
    updateTrainingProgramMutation,
} from '@/services/client/@tanstack/react-query.gen';

import { X } from 'lucide-react';
import { toast } from 'sonner';
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
    const creator = useCourseCreator();
    const [step, setStep] = useState(1);
    const [programUuid, setProgramUuid] = useState<string | null>(
        editingProgram?.uuid || null
    );

    const [latestProgramData, setLatestProgramData] = useState(editingProgram || null);

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
        status: 'draft',
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
            status: editingProgram.status ?? 'draft',
            active: editingProgram.active ?? false,
        });

        setLatestProgramData(editingProgram);
        setProgramUuid(editingProgram.uuid);
    }, [editingProgram, creator?.profile?.uuid]);

    const createProgramMut = useMutation(createTrainingProgramMutation());
    const updateProgramMut = useMutation(updateTrainingProgramMutation());
    const publishProgramMut = useMutation(publishProgramMutation());

    const handleStep1Submit = (data: any) => {
        setFormData(data);

        if (editingProgram || programUuid) {
            // UPDATE existing program
            updateProgramMut.mutate(
                {
                    body: data,
                    path: { uuid: programUuid as string },
                },
                {
                    onSuccess: (response) => {
                        qc.invalidateQueries({
                            queryKey: getAllTrainingProgramsQueryKey({
                                query: { pageable: {} },
                            }),
                        });

                        toast.success(response?.message || 'Program updated successfully');

                        setLatestProgramData({
                            ...latestProgramData,
                            ...data,
                            uuid: programUuid,
                        });

                        setStep(2);
                    },
                    onError: (error: any) => {
                        toast.error(error?.message || 'Failed to update program');
                    },
                }
            );
        } else {
            createProgramMut.mutate(
                { body: data },
                {
                    onSuccess: (response) => {
                        toast.success('Program created successfully');

                        const newProgramUuid = response?.data?.uuid || response?.uuid;

                        if (!newProgramUuid) {
                            toast.error('Program created but UUID not returned');
                            return;
                        }

                        setProgramUuid(newProgramUuid);

                        setLatestProgramData({
                            ...data,
                            uuid: newProgramUuid,
                        });

                        qc.invalidateQueries({
                            queryKey: getAllTrainingProgramsQueryKey({
                                query: { pageable: {} },
                            }),
                        });

                        setStep(2);
                    },
                    onError: (error: any) => {
                        toast.error(error?.message || 'Failed to create program');
                    },
                }
            );
        }
    };

    const handlePublish = () => {
        if (!programUuid) {
            toast.error('No program UUID found');
            return;
        }

        updateProgramMut.mutate(
            {
                body: {
                    ...latestProgramData,
                    status: 'published',
                },
                path: { uuid: programUuid },
            },
            {
                onSuccess: (data) => {
                    qc.invalidateQueries({
                        queryKey: getAllTrainingProgramsQueryKey({
                            query: { pageable: {} },
                        }),
                    });
                    toast.success(data?.message || 'Program published successfully');
                    onComplete?.();
                },
                onError: (error: any) => {
                    toast.error(error?.message || 'Failed to publish program');
                },
            }
        );
    };

    const handleSaveDraft = () => {
        if (!programUuid) {
            toast.error('No program to save');
            return;
        }

        updateProgramMut.mutate(
            {
                body: {
                    ...latestProgramData,
                    status: 'DRAFT',
                },
                path: { uuid: programUuid },
            },
            {
                onSuccess: (data) => {
                    qc.invalidateQueries({
                        queryKey: getAllTrainingProgramsQueryKey({
                            query: { pageable: {} },
                        }),
                    });
                    toast.success(data?.message || 'Draft saved successfully');
                    onComplete?.();
                },
                onError: (error: any) => {
                    toast.error(error?.message || 'Failed to save draft');
                },
            }
        );
    };

    return (
        <div className='p-6'>
            <div className='mb-6 flex items-end justify-end'>
                <Button type='button' variant={'ghost'} onClick={onCancel}>
                    <X />
                </Button>
            </div>

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
                            <div className='font-medium text-foreground'>Basic Information</div>
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
                            <div className='font-medium text-foreground'>Courses & Requirements</div>
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
                        initialData={latestProgramData || formData}
                        onSubmit={handleStep1Submit}
                        onCancel={onCancel}
                        isLoading={createProgramMut.isPending || updateProgramMut.isPending}
                        isEditing={!!(editingProgram || programUuid)}
                    />
                )}

                {step === 2 &&
                    (programUuid ? (
                        <ProgramCourseManagement
                            programUuid={programUuid}
                            onPublish={handlePublish}
                            onSaveDraft={handleSaveDraft}
                            onBack={() => setStep(1)}
                            isPublishing={updateProgramMut.isPending}
                            editingProgram={latestProgramData}
                        />
                    ) : (
                        <div className='rounded-lg border border-border bg-card p-8 text-center'>
                            <div className='text-muted-foreground'>
                                <p className='mb-2 text-lg font-semibold'>Program UUID not found</p>
                                <p className='text-sm'>
                                    Please go back and try again, or contact support if the issue
                                    persists.
                                </p>
                                <Button
                                    onClick={() => setStep(1)}
                                    className='mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90'
                                >
                                    Go Back
                                </Button>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default CreateProgramWizard;