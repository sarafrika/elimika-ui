'use client';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInstructor } from '@/context/instructor-context';
import { addRubricCriterionMutation, addRubricScoringMutation, createAssessmentRubricMutation, getAllGradingLevelsOptions, getRubricCriteriaQueryKey, getRubricScoringQueryKey, searchAssessmentRubricsQueryKey, updateAssessmentRubricMutation, updateRubricCriterionMutation, updateRubricScoringMutation } from '@/services/client/@tanstack/react-query.gen';
import { StatusEnum, WeightUnitEnum } from '@/services/client/types.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Trash, X } from 'lucide-react';
import { useEffect } from 'react';
import { useFieldArray, useForm, useFormContext } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import Spinner from '../../../../components/ui/spinner';

// RUBRICS
export enum RubricType {
    Assignment = 'Assignment',
    Exam = 'Exam',
    ClassAttendance = 'Class Attendance',
    Auditions = 'Auditions',
    Competition = 'Competition',
    Performance = 'Performance',
    Project = 'Project',
    Quiz = 'Quiz',
    Reading = 'Reading',
}

export enum Visibility {
    Public = 'Public',
    Private = 'Private',
}

type ComponentBlockProps = {
    index: number;
    remove: (index: number) => void;
    isOnlyOne: boolean;
    defaultValues?: RubricFormValues;
};


export const ComponentBlock = ({ index, remove, isOnlyOne, defaultValues }: ComponentBlockProps) => {
    const { register, control, setValue } = useFormContext();
    const { data: gradingLevels } = useQuery(getAllGradingLevelsOptions({ query: { pageable: {} } }));

    const { fields, append, remove: removeGrading } = useFieldArray({
        control,
        name: `components.${index}.grading`,
    });

    useEffect(() => {
        fields.forEach((_, gradingIndex) => {
            register(`components.${index}.grading.${gradingIndex}.points`);
            register(`components.${index}.grading.${gradingIndex}.uuid`);
        });
    }, [fields, index, register]);

    return (
        <div className="border border-gray-300 p-2 rounded space-y-4">
            {/* Component Name */}
            <Input
                placeholder="Assessment Component Name"
                {...register(`components.${index}.name`)}
            />

            {/* <Input type="hidden" {...register(`components.${index}.uuid`)} /> */}
            <Input type="hidden" {...register(`components.${index}.scoring_uuid`)} />
            {/* <Input type="hidden" {...register(`components.${index}.grading_level_uuid`)} /> */}


            {/* Grading Table */}
            <table className="w-full border text-sm">
                <thead>
                    <tr className="bg-gray-100 text-left">
                        <th className="p-1.5">Grading Name</th>
                        <th className="p-1.5">Description</th>
                        <th className="p-1.5">Points</th>
                        <th className="p-1.5"></th>
                    </tr>
                </thead>
                <tbody>
                    {fields.map((field, gradingIndex) => (
                        <tr key={field.id}>
                            <td className="p-1.5">
                                <Input
                                    {...register(`components.${index}.grading.${gradingIndex}.name`)}
                                    placeholder="Name"
                                />
                            </td>
                            <td className="p-1.5">
                                <Input
                                    {...register(`components.${index}.grading.${gradingIndex}.description`)}
                                    placeholder="Description"
                                />
                            </td>
                            <td className="p-1.5">
                                <div className="flex flex-col gap-1">
                                    {/* UUID Select */}
                                    <select
                                        className="border border-gray-300 rounded px-2 py-1 w-full"
                                        {...register(`components.${index}.grading.${gradingIndex}.uuid`)}
                                        onChange={(e) => {
                                            const selectedUuid = e.target.value;
                                            const selectedLevel = gradingLevels?.data?.content?.find(
                                                (level) => level.uuid === selectedUuid
                                            );

                                            if (selectedLevel) {
                                                // console.log('Selected Grading Level:', selectedLevel);

                                                setValue(`components.${index}.grading.${gradingIndex}.points`, selectedLevel.points);
                                                setValue(`components.${index}.grading.${gradingIndex}.uuid`, selectedLevel.uuid);
                                                setValue(`components.${index}.grading.${gradingIndex}.grading_level_uuid`, selectedLevel.uuid);
                                            } else {
                                                setValue(`components.${index}.grading.${gradingIndex}.points`, 0);
                                                setValue(`components.${index}.grading.${gradingIndex}.uuid`, '');
                                                setValue(`components.${index}.grading.${gradingIndex}.uuid`, '');
                                            }
                                        }}
                                    >
                                        <option value="">Select Grading Level</option>
                                        {gradingLevels?.data?.content?.map((level) => (
                                            <option key={level.uuid} value={level.uuid}>
                                                {level.points} - {level.name}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Hidden Inputs for tracking */}
                                    <Input
                                        type="hidden"
                                        {...register(`components.${index}.grading.${gradingIndex}.uuid`)}
                                    />
                                    <Input
                                        type="hidden"
                                        {...register(`components.${index}.grading.${gradingIndex}.points`, { valueAsNumber: true })}
                                    />
                                </div>
                            </td>
                            <td className="p-1.5">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => removeGrading(gradingIndex)}
                                    disabled={fields.length === 1}
                                >
                                    <X className="w-4 h-4 text-red-500" />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Add Grading Criterion */}
            <Button
                type="button"
                variant="outline"
                onClick={() =>
                    append({ name: '', description: '', points: 0, uuid: '' })
                }
            >
                <PlusCircle className="mr-2 w-4 h-4" />
                Add Grading Criterion
            </Button>

            {/* Remove Component */}
            <div className="text-right">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => remove(index)}
                    disabled={isOnlyOne}
                    className="text-red-600"
                >
                    <Trash className="w-4 h-4 text-red-500" />
                </Button>
            </div>
        </div>
    );
};

export const rubricFormSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    type: z.nativeEnum(RubricType),
    visibility: z.nativeEnum(Visibility),
    components: z.array(
        z.object({
            name: z.string().min(1, 'Component name is required'),
            uuid: z.string(),
            grading: z.array(
                z.object({
                    name: z.string().min(1, 'Grading name is required'),
                    description: z.string().optional(),
                    points: z.number().min(0, 'Points must be positive'),
                    uuid: z.string(),
                    scoring_uuid: z.string(),
                    grading_level_uuid: z.string()
                })
            ).min(1, 'Each component must have at least one grading criterion'),
        })
    ).min(1, 'At least one assessment component is required'),
});

export type RubricFormValues = z.infer<typeof rubricFormSchema>;

interface AddRubricFormProps {
    courseId: string;
    rubricId: string;
    onCancel: () => void;
    onSubmitSuccess?: () => void;
    className?: string;
    defaultValues?: RubricFormValues;
}

export function AddRubricForm({ courseId, rubricId, onCancel, onSubmitSuccess, className, defaultValues }: AddRubricFormProps) {
    const form = useForm<RubricFormValues>({
        resolver: zodResolver(rubricFormSchema),
        defaultValues: defaultValues ?? {
            title: '',
            description: '',
            type: RubricType.Assignment,
            visibility: Visibility.Public,
            components: [
                {
                    name: '',
                    uuid: '',
                    grading: [{ name: '', description: '', points: 0, uuid: '', grading_level_uuid: '', scoring_uuid: '' }],
                },
            ],
        },
    });

    useEffect(() => {
        if (defaultValues) {
            form.reset(defaultValues);
        }
    }, [defaultValues, form]);

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = form;

    const {
        fields: componentFields,
        append: appendComponent,
        remove: removeComponent,
    } = useFieldArray({
        control,
        name: 'components',
    });

    const instructor = useInstructor();
    const queryClient = useQueryClient()

    // MUTATIONS
    const createRubric = useMutation(createAssessmentRubricMutation());
    const createRubricComponent = useMutation(addRubricCriterionMutation())
    const createRubricScores = useMutation(addRubricScoringMutation())

    const updateRubric = useMutation(updateAssessmentRubricMutation());
    const updateRubricComponent = useMutation(updateRubricCriterionMutation())
    const updateRubricScores = useMutation(updateRubricScoringMutation())

    const createRubricIsPending = createRubric.isPending || createRubricComponent.isPending || createRubricScores.isPending;
    const updateRubricIsPending = updateRubric.isPending || updateRubricComponent.isPending || updateRubricScores.isPending;

    const onSubmit = async (values: RubricFormValues) => {
        try {
            const rubricBody = {
                title: values.title,
                description: values.description,
                course_uuid: courseId,
                rubric_type: values.type,
                instructor_uuid: instructor?.uuid as string,
                is_public: values.visibility === "Public",
                status: StatusEnum.DRAFT,
                active: false,
                total_weight: 100,
                weight_unit: WeightUnitEnum.PERCENTAGE,
                is_weighted: true,
                created_by: "instructor@sarafrika.com",
                updated_by: "instructor@sarafrika.com",
                rubric_category: `${values.type} Assessment`,
                is_published: true,
                assessment_scope: "Course-Specific",
                usage_status: "Active Public Rubric"
            };

            if (rubricId) {
                updateRubric.mutate(
                    {
                        path: { uuid: rubricId },
                        body: rubricBody
                    },
                    {
                        onSuccess: () => {
                            queryClient.invalidateQueries({
                                queryKey: searchAssessmentRubricsQueryKey({
                                    query: {
                                        searchParams: { instructor_uuid_eq: instructor?.uuid as string },
                                        pageable: {}
                                    }
                                })
                            });

                            const component = values.components[0];
                            const criterionId = component?.uuid;

                            const grading = component?.grading[0];
                            const gradingId = grading?.uuid;
                            const gradingLevelUuid = grading?.grading_level_uuid;

                            const rubricComponentBody = {
                                rubric_uuid: rubricId,
                                component_name: component?.name || "",
                                criteria_category: component?.name || "",
                                description: "",
                                display_order: 1,
                                criteria_number: "Criteria 1",
                                weight_suggestion: "High Priority",
                                is_primary_criteria: true,
                                weight: 25,
                                created_by: "instructor@sarafrika.com",
                                updated_by: "instructor@sarafrika.com",
                            };

                            updateRubricComponent.mutate(
                                {
                                    path: { rubricUuid: rubricId, criteriaUuid: criterionId as string },
                                    body: rubricComponentBody
                                },
                                {
                                    onSuccess: () => {
                                        queryClient.invalidateQueries({
                                            queryKey: getRubricCriteriaQueryKey({
                                                path: { rubricUuid: rubricId as string },
                                                query: { pageable: {} }
                                            })
                                        });

                                        const rubricScoringBody = {
                                            uuid: grading?.scoring_uuid,
                                            criteria_uuid: criterionId,
                                            grading_level_uuid: gradingLevelUuid,
                                            description: grading?.description,
                                            created_by: "instructor@sarafrika.com",
                                            updated_by: "instructor@sarafrika.com",
                                            score_range: `${grading?.points} points`,
                                            is_passing_level: true,
                                            performance_expectation: grading?.name,
                                            feedback_category: grading?.description,
                                        };

                                        updateRubricScores.mutate(
                                            {
                                                path: { rubricUuid: rubricId, criteriaUuid: criterionId as string, scoringUuid: grading?.scoring_uuid as string },
                                                body: rubricScoringBody as any
                                            },
                                            {
                                                onSuccess: () => {
                                                    queryClient.invalidateQueries({
                                                        queryKey: getRubricScoringQueryKey({
                                                            path: { rubricUuid: rubricId as string, criteriaUuid: criterionId as string },
                                                            query: { pageable: {} }
                                                        })
                                                    });

                                                    toast.success("Rubric updated successfully");
                                                    onSubmitSuccess?.();
                                                    onCancel();
                                                },
                                                onError: () => toast.error("Failed to update rubric scoring"),
                                            }
                                        );
                                    },
                                    onError: () => toast.error("Failed to update rubric component"),
                                }
                            );
                        },
                        onError: () => {
                            toast.error("Failed to update rubric");
                        }
                    }
                );
            } else {
                // Create logic remains unchanged
                createRubric.mutate(
                    { body: rubricBody },
                    {
                        onSuccess: (data) => {
                            const rubricUuid = data?.data?.uuid as string;
                            const component = values.components[0];
                            const grading = component?.grading[0];

                            const rubricComponentBody = {
                                rubric_uuid: rubricUuid,
                                component_name: component?.name || "",
                                criteria_category: component?.name || "",
                                description: "",
                                display_order: 1,
                                criteria_number: "Criteria 1",
                                weight_suggestion: "High Priority",
                                is_primary_criteria: true,
                                weight: 25,
                                created_by: "instructor@sarafrika.com",
                                updated_by: "instructor@sarafrika.com",
                            };

                            createRubricComponent.mutate(
                                { path: { rubricUuid }, body: rubricComponentBody },
                                {
                                    onSuccess: (data) => {
                                        const criteriaUuid = data?.data?.uuid as string;

                                        const rubricScoringBody = {
                                            criteria_uuid: criteriaUuid,
                                            grading_level_uuid: grading?.uuid,
                                            description: grading?.description,
                                            created_by: "instructor@sarafrika.com",
                                            updated_by: "instructor@sarafrika.com",
                                            score_range: `${grading?.points} points`,
                                            is_passing_level: true,
                                            performance_expectation: grading?.name,
                                            feedback_category: grading?.description,
                                        };

                                        createRubricScores.mutate(
                                            { path: { rubricUuid, criteriaUuid }, body: rubricScoringBody as any },
                                            {
                                                onSuccess: () => {
                                                    queryClient.invalidateQueries({
                                                        queryKey: searchAssessmentRubricsQueryKey({
                                                            query: {
                                                                searchParams: { instructor_uuid_eq: instructor?.uuid as string },
                                                                pageable: {}
                                                            }
                                                        })
                                                    });
                                                    toast.success("Rubric created successfully");
                                                    onSubmitSuccess?.();
                                                    onCancel();
                                                },
                                                onError: () => toast.error("Failed to create rubric scoring")
                                            }
                                        );
                                    },
                                    onError: () => toast.error("Failed to create rubric component"),
                                }
                            );
                        },
                        onError: () => toast.error("Failed to create rubric")
                    }
                );
            }
        } catch (error) {
            // console.error(error);
            toast.error("An unexpected error occurred");
        }
    };


    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-8 ${className}`}>
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Rubric Title</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter rubric title" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Input placeholder="Optional rubric description" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex flex-col sm:flex-row items-start gap-6">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem className="flex-1 w-full">
                                <FormLabel>Rubric Type</FormLabel>
                                <Select {...field} onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select rubric type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(RubricType).map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="visibility"
                        render={({ field }) => (
                            <FormItem className="w-full sm:w-[150px] flex-shrink-0">
                                <FormLabel>Rubric Visibility</FormLabel>
                                <Select {...field} onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select visibility" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(Visibility).map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Assessment Components</h3>

                    {componentFields.map((component, index) => (
                        <ComponentBlock
                            key={component.id}
                            index={index}
                            remove={removeComponent}
                            isOnlyOne={componentFields.length === 1}
                            defaultValues={defaultValues}
                        />
                    ))}

                    {/* Add New Component */}
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                            appendComponent({
                                name: '',
                                uuid: '',
                                grading: [{ name: '', description: '', points: 0, uuid: '', grading_level_uuid: '', scoring_uuid: '' }],
                            })
                        }
                    >
                        <PlusCircle className="mr-2 w-4 h-4" />
                        Add Assessment Component
                    </Button>
                </div>

                <div className="flex justify-end gap-2 pt-6">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        className="min-w-[120px] flex items-center justify-center gap-2"
                        disabled={createRubricIsPending || updateRubricIsPending}
                    >
                        {(createRubricIsPending || updateRubricIsPending) && (
                            <Spinner />
                        )}
                        {defaultValues ? 'Update Rubric' : 'Create Rubric'}
                    </Button>
                </div>

            </form>
        </Form>
    );
}
