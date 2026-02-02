'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Label } from '../../../../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../../components/ui/select';
import { Separator } from '../../../../components/ui/separator';
import Spinner from '../../../../components/ui/spinner';
import { Switch } from '../../../../components/ui/switch';
import {
    associateRubricMutation,
    dissociateRubricMutation,
    getAllAssessmentRubricsOptions,
    getCourseRubricsOptions,
    getCourseRubricsQueryKey,
} from '../../../../services/client/@tanstack/react-query.gen';

export type RubricAssociationFormProps = {
    courseUuid: string;
    associatedBy: string;
};

const USAGE_CONTEXTS = [
    'final_assessment',
    'midterm_assessment',
    'project_assessment',
    'homework_assessment',
    'quiz_assessment',
];

export const RubricAssociationForm = ({
    courseUuid,
    associatedBy,
}: RubricAssociationFormProps) => {
    const qc = useQueryClient();

    const { data: allRubrics, isLoading: isLoadingAllRubrics } = useQuery(
        getAllAssessmentRubricsOptions({ query: { pageable: {} } })
    );

    const { data: courseRubrics, isLoading: isLoadingCourseRubrics } = useQuery({
        ...getCourseRubricsOptions({
            path: { courseUuid },
            query: { pageable: {} },
        }),
    });

    const [selectedRubricUuid, setSelectedRubricUuid] = useState<string>('');
    const [isPrimaryRubric, setIsPrimaryRubric] = useState(false);
    const [usageContext, setUsageContext] = useState<string>('');

    const associateRubricMut = useMutation(associateRubricMutation());
    const dissociateRubricMut = useMutation(dissociateRubricMutation());

    const handleAssociateRubric = async () => {
        if (!selectedRubricUuid || !usageContext) {
            toast.error('Please select a rubric and usage context');
            return;
        }

        associateRubricMut.mutate(
            {
                body: {
                    course_uuid: courseUuid,
                    rubric_uuid: selectedRubricUuid,
                    associated_by: associatedBy,
                    is_primary_rubric: isPrimaryRubric,
                    usage_context: usageContext,
                },
                path: { courseUuid },
            },
            {
                onSuccess: () => {
                    // Reset form
                    setSelectedRubricUuid('');
                    setIsPrimaryRubric(false);
                    setUsageContext('');

                    qc.invalidateQueries({
                        queryKey: getCourseRubricsQueryKey({ path: { courseUuid: courseUuid as string }, query: { pageable: {} } }),
                    });

                    toast.success('Rubric associated successfully!');

                },
                onError: (err: any) => {
                    toast.error(err?.message || 'Failed to associate rubric');
                },
            }
        );
    };

    const handleDissociateRubric = async (rubricUuid: string) => {
        if (!confirm('Are you sure you want to remove this rubric association?')) {
            return;
        }

        dissociateRubricMut.mutate(
            {
                path: { courseUuid, rubricUuid },
            },
            {
                onSuccess: () => {
                    toast.success('Rubric association removed successfully');

                    // Refetch course rubrics
                    qc.invalidateQueries({
                        queryKey: ['getCourseRubrics', { path: { courseUuid } }],
                    });
                },
                onError: (err: any) => {
                    toast.error(err?.message || 'Failed to remove rubric association');
                },
            }
        );
    };

    const availableRubrics = allRubrics?.data?.content?.filter(
        (rubric: any) =>
            !courseRubrics?.data?.content?.some(
                (courseRubric: any) => courseRubric.rubric_uuid === rubric.uuid
            )
    );

    return (
        <div className='grid grid-cols-3 gap-6'>
            {/* Associated Rubrics List */}
            <div className='bg-card rounded-xl border p-4 shadow-sm'>
                <h3 className='text-foreground mb-4 text-lg font-semibold'>Associated Rubrics</h3>

                {isLoadingCourseRubrics ? (
                    <div className='flex items-center justify-center py-10'>
                        <Spinner className='h-6 w-6' />
                    </div>
                ) : courseRubrics?.data?.content?.length ? (
                    <ul className='flex flex-col gap-2 space-y-2'>
                        {courseRubrics.data.content.map((courseRubric: any) => (
                            <li
                                key={courseRubric.uuid}
                                className='flex flex-col gap-2 rounded-lg border-2 border-transparent bg-primary/5 px-3 py-2.5 text-sm transition-all duration-200'
                            >
                                <div className='flex items-start justify-between'>
                                    <div className='flex-1'>
                                        <p className='font-medium text-foreground'>
                                            {courseRubric.rubric_title || 'Untitled Rubric'}
                                        </p>
                                        <p className='text-muted-foreground text-xs'>
                                            {courseRubric.usage_context?.replace(/_/g, ' ')}
                                        </p>
                                        {courseRubric.is_primary_rubric && (
                                            <span className='bg-primary text-primary-foreground mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium'>
                                                PRIMARY
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDissociateRubric(courseRubric.rubric_uuid)}
                                        disabled={dissociateRubricMut.isPending}
                                        className='text-destructive hover:text-destructive/80 transition-colors'
                                        title='Remove association'
                                    >
                                        {dissociateRubricMut.isPending ? (
                                            <Spinner className='h-4 w-4' />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className='text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center text-sm'>
                        <p>No rubrics associated yet</p>
                        <p className='mt-1'>Add a rubric to get started</p>
                    </div>
                )}
            </div>

            {/* Association Form */}
            <div className='bg-card col-span-2 space-y-6 rounded-xl border p-6 shadow-sm'>
                <div className='flex items-center justify-between gap-4 border-b pb-4'>
                    <h3 className='text-foreground text-lg font-bold uppercase'>
                        ASSOCIATE RUBRIC WITH COURSE
                    </h3>
                </div>

                <div className='flex flex-col gap-6'>
                    {/* Select Rubric */}
                    <div className='flex flex-col gap-2'>
                        <Label className='text-foreground text-sm font-medium'>Select Rubric</Label>
                        <p className='text-muted-foreground text-xs'>
                            Choose a rubric to associate with this course
                        </p>

                        {isLoadingAllRubrics ? (
                            <div className='flex items-center justify-center py-4'>
                                <Spinner className='h-5 w-5' />
                            </div>
                        ) : (
                            <Select
                                value={selectedRubricUuid}
                                onValueChange={setSelectedRubricUuid}
                            >
                                <SelectTrigger className='w-full'>
                                    <SelectValue placeholder='Select a rubric' />
                                </SelectTrigger>

                                <SelectContent>
                                    {availableRubrics?.length ? (
                                        availableRubrics.map((rubric: any) => (
                                            <>
                                                <SelectItem key={rubric.uuid} value={rubric.uuid}>
                                                    <div className='flex flex-col'>
                                                        <span className='font-medium'>{rubric.title}</span>
                                                        {/* {rubric.description && (
                                                        <span className='text-muted-foreground text-xs'>
                                                            {rubric.description}
                                                        </span>
                                                    )} */}
                                                    </div>

                                                </SelectItem>
                                            </>
                                        ))
                                    ) : (
                                        <div className='text-muted-foreground px-3 py-2 text-center text-sm'>
                                            {allRubrics?.data?.content?.length
                                                ? 'All rubrics are already associated'
                                                : 'No rubrics available'}
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <Separator />

                    {/* Usage Context */}
                    <div className='flex flex-col gap-2'>
                        <Label className='text-foreground text-sm font-medium'>Usage Context</Label>
                        <p className='text-muted-foreground text-xs'>
                            Specify when this rubric will be used
                        </p>

                        <Select value={usageContext} onValueChange={setUsageContext}>
                            <SelectTrigger className='w-full'>
                                <SelectValue placeholder='Select usage context' />
                            </SelectTrigger>

                            <SelectContent>
                                {USAGE_CONTEXTS.map(context => (
                                    <SelectItem key={context} value={context}>
                                        {context.replace(/_/g, ' ').toUpperCase()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    {/* Primary Rubric Toggle */}
                    <div className='flex flex-col gap-2'>
                        <div className='flex items-center gap-3'>
                            <Switch
                                checked={isPrimaryRubric}
                                onCheckedChange={setIsPrimaryRubric}
                            />
                            <Label className='text-foreground text-sm font-medium'>
                                Set as Primary Rubric
                            </Label>
                        </div>
                        <p className='text-muted-foreground text-xs'>
                            The primary rubric will be used as the default for this course
                        </p>
                    </div>

                    <Separator />

                    {/* Summary Section */}
                    {selectedRubricUuid && usageContext && (
                        <div className='bg-muted/50 rounded-lg border p-4'>
                            <h4 className='text-foreground mb-2 text-sm font-semibold'>
                                Association Summary
                            </h4>
                            <ul className='text-muted-foreground space-y-1 text-sm'>
                                <li>
                                    <strong>Rubric:</strong>{' '}
                                    {
                                        allRubrics?.data?.content?.find(
                                            (r: any) => r.uuid === selectedRubricUuid
                                        )?.title
                                    }
                                </li>
                                <li>
                                    <strong>Usage:</strong>{' '}
                                    {usageContext.replace(/_/g, ' ').toUpperCase()}
                                </li>
                                <li>
                                    <strong>Primary:</strong> {isPrimaryRubric ? 'Yes' : 'No'}
                                </li>
                            </ul>
                        </div>
                    )}


                    <Button
                        size='sm'
                        onClick={handleAssociateRubric}
                        disabled={associateRubricMut.isPending || !selectedRubricUuid || !usageContext}
                    >
                        {associateRubricMut.isPending ? (
                            <>
                                <Spinner className='mr-2 h-4 w-4' />
                                Associating...
                            </>
                        ) : (
                            <>
                                <PlusCircle size={16} />
                                Associate Rubric
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};