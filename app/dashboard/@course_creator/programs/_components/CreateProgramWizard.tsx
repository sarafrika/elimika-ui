'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import {
    createTrainingProgramMutation,
    publishProgramMutation,
    searchTrainingProgramsQueryKey,
    updateTrainingProgramMutation
} from '@/services/client/@tanstack/react-query.gen';

import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../../../components/ui/button';
import ProgramBasicInfo from './ProgramBasicInfo';
import ProgramCourseManagement from './ProgramCourseManagement';

const CreateProgramWizard = ({
    editingProgram,
    onComplete,
    onCancel,
    creator
}: any) => {
    const qc = useQueryClient();
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
        program_type: 'program',
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
            program_type: editingProgram.program_type ?? 'program',
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
                            queryKey: searchTrainingProgramsQueryKey({
                                query: { pageable: {}, searchParams: { course_creator_uuid_eq: creator?.profile?.uuid } },
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
                            queryKey: searchTrainingProgramsQueryKey({
                                query: { pageable: {}, searchParams: { course_creator_uuid_eq: creator?.profile?.uuid } },
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
                        queryKey: searchTrainingProgramsQueryKey({
                            query: { pageable: {}, searchParams: { course_creator_uuid_eq: creator?.profile?.uuid } },
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
                        queryKey: searchTrainingProgramsQueryKey({
                            query: { pageable: {}, searchParams: { course_creator_uuid_eq: creator?.profile?.uuid } },
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
        <div className=''>
            <div className='mb-4 flex items-end justify-end md:mb-6'>
                <Button type='button' variant={'ghost'} onClick={onCancel} className='h-8 w-8 p-0 md:h-10 md:w-10'>
                    <X className='h-4 w-4 md:h-5 md:w-5' />
                </Button>
            </div>

            <div className='mb-6 md:mb-8'>
                <div className='flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between'>
                    {/* Step 1 */}
                    <div className='flex w-full items-center gap-3 md:w-auto md:gap-4'>
                        <div
                            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold md:h-10 md:w-10 md:text-base ${step >= 1
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                                }`}
                        >
                            {step > 1 ? '✓' : '1'}
                        </div>
                        <div className='min-w-0 flex-1'>
                            <div className='truncate text-sm font-medium text-foreground md:text-base'>
                                Basic Information
                            </div>
                            <div className='truncate text-xs text-muted-foreground md:text-sm'>
                                Program details and settings
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar - Hidden on mobile */}
                    <div className='hidden h-0.5 w-16 bg-muted md:block lg:w-24'>
                        <div
                            className={`h-full transition-all ${step >= 2 ? 'bg-primary' : 'bg-muted'
                                }`}
                        />
                    </div>

                    {/* Step 2 */}
                    <div className='flex w-full items-center gap-3 md:w-auto md:gap-4'>
                        <div
                            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold md:h-10 md:w-10 md:text-base ${step >= 2
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                                }`}
                        >
                            2
                        </div>
                        <div className='min-w-0 flex-1'>
                            <div className='truncate text-sm font-medium text-foreground md:text-base'>
                                Courses & Requirements
                            </div>
                            <div className='truncate text-xs text-muted-foreground md:text-sm'>
                                Add courses and set requirements
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Progress Indicator */}
                <div className='mt-3 flex gap-1 md:hidden'>
                    <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                    <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
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
                        <div className='rounded-lg border border-border bg-card p-6 text-center md:p-8'>
                            <div className='text-muted-foreground'>
                                <p className='mb-2 text-base font-semibold md:text-lg'>Program UUID not found</p>
                                <p className='text-xs md:text-sm'>
                                    Please go back and try again, or contact support if the issue
                                    persists.
                                </p>
                                <Button
                                    onClick={() => setStep(1)}
                                    className='mt-3 w-full rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 md:mt-4 md:w-auto md:text-base'
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