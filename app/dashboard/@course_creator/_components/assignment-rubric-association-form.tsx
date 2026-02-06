'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
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

export type AssignmentRubricAssociationFormProps = {
    courseUuid: string;
    associatedBy: string;
};

const USAGE_CONTEXT = 'assignment_assessment';

export const AssignmentRubricAssociationForm = ({
    courseUuid,
    associatedBy,
}: AssignmentRubricAssociationFormProps) => {
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

    const associateRubricMut = useMutation(associateRubricMutation());
    const dissociateRubricMut = useMutation(dissociateRubricMutation());

    // Get the existing associated rubric for assignments
    const existingRubric = courseRubrics?.data?.content?.find(
        (rubric: any) => rubric.usage_context === USAGE_CONTEXT
    );

    // Pre-fill form with existing rubric data
    useEffect(() => {
        if (existingRubric) {
            setSelectedRubricUuid(existingRubric.rubric_uuid);
            setIsPrimaryRubric(existingRubric.is_primary_rubric || false);
        }
    }, [existingRubric]);

    const handleSaveRubric = async () => {
        if (!selectedRubricUuid) {
            toast.error('Please select a rubric');
            return;
        }

        // If there's an existing rubric and it's different, dissociate it first
        if (existingRubric && existingRubric.rubric_uuid !== selectedRubricUuid) {
            try {
                await dissociateRubricMut.mutateAsync({
                    path: { courseUuid, rubricUuid: existingRubric.rubric_uuid },
                });
            } catch (err: any) {
                toast.error(err?.message || 'Failed to remove previous rubric');
                return;
            }
        }

        // Associate the new rubric (or update if it's the same)
        associateRubricMut.mutate(
            {
                body: {
                    course_uuid: courseUuid,
                    rubric_uuid: selectedRubricUuid,
                    associated_by: associatedBy,
                    is_primary_rubric: isPrimaryRubric,
                    usage_context: USAGE_CONTEXT,
                },
                path: { courseUuid },
            },
            {
                onSuccess: () => {
                    qc.invalidateQueries({
                        queryKey: getCourseRubricsQueryKey({
                            path: { courseUuid },
                            query: { pageable: {} },
                        }),
                    });

                    toast.success(
                        existingRubric
                            ? 'Rubric updated successfully!'
                            : 'Rubric associated successfully!'
                    );
                },
                onError: (err: any) => {
                    toast.error(err?.message || 'Failed to save rubric');
                },
            }
        );
    };

    const selectedRubricDetails = allRubrics?.data?.content?.find(
        (r: any) => r.uuid === selectedRubricUuid
    );

    const isLoading = isLoadingAllRubrics || isLoadingCourseRubrics;
    const isSaving = associateRubricMut.isPending || dissociateRubricMut.isPending;

    return (
        <div className='bg-card rounded-xl border p-6 shadow-sm'>
            <div className='mb-6 flex items-center justify-between border-b pb-4'>
                <div>
                    <h3 className='text-foreground text-lg font-bold'>
                        Assignment Rubric
                    </h3>
                    <p className='text-muted-foreground mt-1 text-sm'>
                        Associate a rubric for homework/assignment assessments
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className='flex items-center justify-center py-10'>
                    <Spinner className='h-6 w-6' />
                </div>
            ) : (
                <div className='flex flex-col gap-6'>
                    {/* Usage Context - Disabled Input */}
                    <div className='flex flex-col gap-2'>
                        <Label className='text-foreground text-sm font-medium'>
                            Usage Context
                        </Label>
                        <Input
                            value='HOMEWORK / ASSIGNMENT'
                            disabled
                            className='bg-muted cursor-not-allowed font-medium'
                        />
                        <p className='text-muted-foreground text-xs'>
                            This rubric will be used for assignment assessments
                        </p>
                    </div>

                    <Separator />

                    {/* Select Rubric */}
                    <div className='flex flex-col gap-2'>
                        <Label className='text-foreground text-sm font-medium'>
                            Select Rubric
                        </Label>
                        <p className='text-muted-foreground text-xs'>
                            Choose a rubric to use for assignment assessments
                        </p>

                        <Select
                            value={selectedRubricUuid}
                            onValueChange={setSelectedRubricUuid}
                        >
                            <SelectTrigger className='w-full'>
                                <SelectValue placeholder='Select a rubric' />
                            </SelectTrigger>

                            <SelectContent>
                                {allRubrics?.data?.content?.length ? (
                                    allRubrics.data.content.map((rubric: any) => (
                                        <SelectItem key={rubric.uuid} value={rubric.uuid}>
                                            <div className='flex flex-col'>
                                                <span className='font-medium'>{rubric.title}</span>
                                            </div>
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className='text-muted-foreground px-3 py-2 text-center text-sm'>
                                        No rubrics available
                                    </div>
                                )}
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

                    {/* Summary Section */}
                    {selectedRubricDetails && (
                        <>
                            <Separator />
                            <div className='bg-muted/50 rounded-lg border p-4'>
                                <h4 className='text-foreground mb-2 text-sm font-semibold'>
                                    Rubric Details
                                </h4>
                                <ul className='text-muted-foreground space-y-1 text-sm'>
                                    <li>
                                        <strong>Rubric:</strong> {selectedRubricDetails.title}
                                    </li>
                                    <li>
                                        <strong>Usage:</strong> Homework / Assignment Assessment
                                    </li>
                                    <li>
                                        <strong>Primary:</strong> {isPrimaryRubric ? 'Yes' : 'No'}
                                    </li>
                                </ul>
                            </div>
                        </>
                    )}

                    <Button
                        size='default'
                        onClick={handleSaveRubric}
                        disabled={isSaving || !selectedRubricUuid}
                        className='w-full'
                    >
                        {isSaving ? (
                            <>
                                <Spinner className='mr-2 h-4 w-4' />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} className='mr-2' />
                                {existingRubric ? 'Update Rubric' : 'Save Rubric'}
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
};