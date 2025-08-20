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
import { addRubricCriterionMutation, addRubricScoringMutation, createAssessmentRubricMutation, getAllGradingLevelsOptions, updateAssessmentRubricMutation, updateRubricCriterionMutation, updateRubricScoringMutation } from '@/services/client/@tanstack/react-query.gen';
import { StatusEnum, WeightUnitEnum } from '@/services/client/types.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
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
};

export const ComponentBlock = ({ index, remove, isOnlyOne }: ComponentBlockProps) => {
    const { register, control } = useFormContext();
    const { data: gradingLevels } = useQuery(getAllGradingLevelsOptions({ query: { pageable: {} } }))

    const { fields, append, remove: removeGrading } = useFieldArray({
        control,
        name: `components.${index}.grading`,
    });

    return (
        <div className="border border-gray-300 p-2 rounded space-y-4">
            {/* Component Name */}
            <Input
                placeholder="Assessment Component Name"
                {...register(`components.${index}.name`)}
            />

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
                                    {...register(
                                        `components.${index}.grading.${gradingIndex}.name`
                                    )}
                                    placeholder="Name"
                                />
                            </td>
                            <td className="p-1.5">
                                <Input
                                    {...register(
                                        `components.${index}.grading.${gradingIndex}.description`
                                    )}
                                    placeholder="Description"
                                />
                            </td>
                            {/* <td className="p-1.5">
                                <Input
                                    type="number"
                                    {...register(
                                        `components.${index}.grading.${gradingIndex}.points`,
                                        { valueAsNumber: true }
                                    )}
                                />
                            </td> */}
                            <td className="p-1.5">
                                <select
                                    {...register(`components.${index}.grading.${gradingIndex}.gradingLevelUuid`)}
                                    className="border border-gray-300 rounded px-2 py-1 w-full"
                                >
                                    <option value="">Select Grading Level</option>
                                    {gradingLevels?.data?.content?.map((level) => (
                                        <option key={level.uuid} value={level.uuid}>
                                            {level.grade_display}
                                        </option>
                                    ))}
                                </select>
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

            <Button
                type="button"
                variant="outline"
                onClick={() =>
                    append({ name: '', description: '', points: 0 })
                }
            >
                <PlusCircle className="mr-2 w-4 h-4" />
                Add Grading Criterion
            </Button>

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
            grading: z.array(
                z.object({
                    name: z.string().min(1, 'Grading name is required'),
                    description: z.string().optional(),
                    points: z.number().min(0, 'Points must be positive'),
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
                    grading: [{ name: '', description: '', points: 0 }],
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
                            toast.success("Rubric updated successfully");
                            onSubmitSuccess?.();
                            onCancel();
                        },
                        onError: () => {
                            toast.error("Failed to update rubric");
                        }
                    }
                );
            } else {
                createRubric.mutate(
                    { body: rubricBody },
                    {
                        onSuccess: (data) => {
                            const rubricUuid = data?.data?.uuid as string
                            // toast.success("Rubric created successfully");

                            console.log("Components?>>>>all", values?.components);

                            console.log("Components?>>>>first", values?.components[0]);

                            const rubricComponentBody = {
                                rubric_uuid: rubricUuid,
                                component_name: values.components[0]?.name || "",
                                description: "Technical proficiency and skill execution in performance",
                                display_order: 1,
                                weight: 25,
                                created_by: "instructor@sarafrika.com",
                                updated_by: "instructor@sarafrika.com",
                                criteria_category: "Performance Component",
                                is_primary_criteria: true,
                                weight_suggestion: "High Priority",
                                criteria_number: "Criteria 1"
                            }

                            createRubricComponent.mutate({ path: { rubricUuid }, body: rubricComponentBody }, {
                                onSuccess: (data) => {
                                    const rubricUuid = data?.data?.rubric_uuid;
                                    const criteriaUuid = data?.data?.uuid as string;

                                    const rubricScoringBody = {
                                        criteria_uuid: criteriaUuid as string,
                                        grading_level_uuid: "457a3055-ee0d-4eed-8960-39ac9092f784",
                                        description: "Highly confident and fluent techniques given consistently throughout",
                                        created_by: "instructor@sarafrika.com",
                                        updated_by: "instructor@sarafrika.com",
                                        performance_expectation: "Exceptional Performance",
                                        score_range: "5 points",
                                        is_passing_level: true,
                                        feedback_category: "Excellence"
                                    }

                                    createRubricScores.mutate({ path: { rubricUuid: rubricUuid as string, criteriaUuid: criteriaUuid as string }, body: rubricScoringBody as any }, {
                                        onSuccess: () => {
                                            toast.success("Rubric created successfully");
                                            onSubmitSuccess?.();
                                            onCancel();
                                        }
                                    })
                                }
                            })

                        },
                        onError: () => toast.error("Failed to create rubric")
                    }
                );
            }
        } catch (error) {
            console.error(error);
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
                        />
                    ))}

                    {/* Add New Component */}
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                            appendComponent({
                                name: '',
                                grading: [{ name: '', description: '', points: 0 }],
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
