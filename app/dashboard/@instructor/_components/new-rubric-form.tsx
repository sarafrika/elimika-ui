'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import Spinner from '@/components/ui/spinner';
import { useInstructor } from '@/context/instructor-context';
import { addRubricCriterionMutation, addRubricScoringMutation, createAssessmentRubricMutation, getAllGradingLevelsOptions, getRubricCriteriaQueryKey, getRubricScoringQueryKey, searchAssessmentRubricsQueryKey, updateAssessmentRubricMutation, updateRubricCriterionMutation, updateRubricScoringMutation } from '@/services/client/@tanstack/react-query.gen';
import { StatusEnum } from '@/services/client/types.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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

export const rubricDetailsSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    type: z.nativeEnum(RubricType),
    visibility: z.nativeEnum(Visibility),
});

export type RubricDetailsFormValues = z.infer<typeof rubricDetailsSchema>;


export function RubricDetailsForm({
    onSuccess,
    defaultValues,
    rubricId,
    onCancel,
    className
}: {
    rubricId?: string;
    defaultValues?: RubricDetailsFormValues;
    onSuccess: () => void;
    onCancel: () => void;
    className: any
}) {
    const form = useForm<RubricDetailsFormValues>({
        resolver: zodResolver(rubricDetailsSchema),
        defaultValues,
    });

    const qc = useQueryClient()
    const instructor = useInstructor()

    const createRubric = useMutation(createAssessmentRubricMutation());
    const updateRubric = useMutation(updateAssessmentRubricMutation());

    const handleSubmit = async (values: RubricDetailsFormValues) => {
        const payload = {
            ...values,
            rubric_type: values.type,
            instructor_uuid: instructor?.uuid as string,
            is_public: values.visibility === "Public",
            status: StatusEnum.DRAFT,
            rubric_category: `${values.type} Assessment`,
            // additional defaults
        };

        if (rubricId) {
            updateRubric.mutate({ path: { uuid: rubricId }, body: payload }, {
                onSuccess: (data) => {
                    qc.invalidateQueries({ queryKey: searchAssessmentRubricsQueryKey({ query: { pageable: {}, searchParams: { instructor_uuid_eq: instructor?.uuid as string, } } }) })
                    toast.success(data?.message)
                    onCancel()
                    onSuccess()
                }
            })
        } else {
            createRubric.mutate({ body: payload }, {
                onSuccess: (data) => {
                    qc.invalidateQueries({ queryKey: searchAssessmentRubricsQueryKey({ query: { pageable: {}, searchParams: { instructor_uuid_eq: instructor?.uuid as string, } } }) })
                    toast.success(data?.message)
                    onCancel()
                    onSuccess()
                }
            })
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-8 ${className}`}>
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

                <div className="flex justify-end gap-2 pt-6">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        className="min-w-[120px] flex items-center justify-center gap-2"
                        disabled={createRubric.isPending || updateRubric.isPending}
                    >
                        {(createRubric.isPending || updateRubric.isPending) && (
                            <Spinner />
                        )}
                        {defaultValues ? 'Update Rubric' : 'Create Rubric'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

export const rubricCriteriaSchema = z.object({
    name: z.string().min(1),
    uuid: z.string().optional(),
});

export type RubricCriteriaFormValues = z.infer<typeof rubricCriteriaSchema>;

export function RubricCriteriaForm({
    rubricId,
    defaultValues,
    criterionId,
    onSuccess,
    onCancel,
    className
}: {
    rubricId: string;
    defaultValues?: RubricCriteriaFormValues;
    onSuccess: () => void;
    onCancel: () => void;
    criterionId: string;
    className: any
}) {
    const form = useForm<RubricCriteriaFormValues>({
        resolver: zodResolver(rubricCriteriaSchema),
        defaultValues,
    });

    const qc = useQueryClient()
    const createRubricCriteria = useMutation(addRubricCriterionMutation())
    const updateRubricCriteria = useMutation(updateRubricCriterionMutation())

    const handleSubmit = (values: RubricCriteriaFormValues) => {
        const payload = {
            rubric_uuid: rubricId,
            component_name: values.name,
            criteria_category: values.name,
            display_order: 1,
            weight: 1
            // other metadata
        };

        if (rubricId && criterionId) {
            updateRubricCriteria.mutate({ path: { rubricUuid: rubricId, criteriaUuid: criterionId }, body: payload }, {
                onSuccess: (data) => {
                    qc.invalidateQueries({ queryKey: getRubricCriteriaQueryKey({ path: { rubricUuid: rubricId }, query: { pageable: {} } }) })
                    toast.success(data?.message)
                    onCancel()
                    onSuccess()
                }
            })
        } else {
            createRubricCriteria.mutate({ path: { rubricUuid: rubricId }, body: payload }, {
                onSuccess: (data) => {
                    qc.invalidateQueries({ queryKey: getRubricCriteriaQueryKey({ path: { rubricUuid: rubricId }, query: { pageable: {} } }) })
                    toast.success(data?.message)
                    onCancel()
                    onSuccess()
                }
            })
        }

    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-8 ${className}`}>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Assessment Component Title</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter rubric title" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-6">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        className="min-w-[120px] flex items-center justify-center gap-2"
                        disabled={createRubricCriteria.isPending || updateRubricCriteria.isPending}
                    >
                        {(createRubricCriteria.isPending || updateRubricCriteria.isPending) && (
                            <Spinner />
                        )}
                        {defaultValues ? 'Update Criteria' : 'Create Criteria'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}


export const rubricScoringSchema = z.object({
    grading_level_uuid: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    points: z.number().min(0),
    scoring_uuid: z.string().optional(), // optional for update
});

export type RubricScoringFormValues = z.infer<typeof rubricScoringSchema>;

export function RubricScoringForm({
    rubricId,
    criterionId,
    scoringId,
    defaultValues,
    onSuccess,
    onCancel,
    className
}: {
    rubricId: string;
    criterionId: string;
    scoringId: string;
    defaultValues?: RubricScoringFormValues;
    onSuccess: () => void;
    onCancel: () => void;
    className: any
}) {
    const form = useForm<RubricScoringFormValues>({
        resolver: zodResolver(rubricScoringSchema),
        defaultValues,
    });

    const { setValue, register } = form;

    const qc = useQueryClient()
    const { data: gradingLevels } = useQuery(getAllGradingLevelsOptions({ query: { pageable: {} } }));

    const createRubricScores = useMutation(addRubricScoringMutation())
    const updateRubricScores = useMutation(updateRubricScoringMutation())

    const handleSubmit = async (values: RubricScoringFormValues) => {
        const payload = {
            criteria_uuid: criterionId,
            grading_level_uuid: values.grading_level_uuid,
            score_range: `${values.points} points`,
            description: values.description || '',
            performance_expectation: values.name,
            // additional scoring info
        };

        if (rubricId && criterionId && scoringId) {
            updateRubricScores.mutate({ path: { rubricUuid: rubricId, criteriaUuid: criterionId, scoringUuid: scoringId }, body: payload }, {
                onSuccess: (data) => {
                    qc.invalidateQueries({ queryKey: getRubricScoringQueryKey({ path: { rubricUuid: rubricId, criteriaUuid: criterionId }, query: { pageable: {} } }) })
                    toast.success(data?.message)
                    onCancel()
                    onSuccess()
                }
            })
        } else {
            createRubricScores.mutate({ path: { rubricUuid: rubricId, criteriaUuid: criterionId }, body: payload }, {
                onSuccess: (data) => {
                    qc.invalidateQueries({ queryKey: getRubricScoringQueryKey({ path: { rubricUuid: rubricId, criteriaUuid: criterionId }, query: { pageable: {} } }) })
                    toast.success(data?.message)
                    onCancel()
                    onSuccess()
                }
            })
        }

    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-8 ${className}`}>
                {/* Grading Level Dropdown */}
                <FormField
                    control={form.control}
                    name="grading_level_uuid"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Select Grading Level</FormLabel>
                            <Select
                                onValueChange={(value) => {
                                    const selected = gradingLevels?.data?.content?.find(
                                        (level) => level.uuid === value
                                    );

                                    if (selected) {
                                        setValue('grading_level_uuid', selected.uuid as string);
                                        setValue('name', selected.name);
                                        setValue('points', selected.points);
                                    } else {
                                        setValue('grading_level_uuid', '');
                                        setValue('name', '');
                                        setValue('points', 0);
                                    }
                                }}
                                value={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose grading level" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {gradingLevels?.data?.content?.map((level) => (
                                        <SelectItem key={level.uuid} value={level.uuid as string}>
                                            {level.points} - {level.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Auto-filled Grading Name */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Grading Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Auto-filled name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Optional Description */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Input placeholder="Optional description" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Auto-filled Grading Point */}
                <FormField
                    control={form.control}
                    name="points"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Points</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Auto-filled points" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-6">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        className="min-w-[120px] flex items-center justify-center gap-2"
                        disabled={createRubricScores.isPending || updateRubricScores.isPending}
                    >
                        {(createRubricScores.isPending || updateRubricScores.isPending) && (
                            <Spinner />
                        )}
                        {defaultValues ? 'Update Scoring' : 'Create Scoring'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}


export function RubricDialog({
    open,
    setOpen,
    editingRubric,
    editingRubricId,
    onSubmitSuccess,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    editingRubric?: any; // Replace with correct type
    editingRubricId?: string;
    onSubmitSuccess: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="flex max-w-6xl flex-col p-0">
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle className="text-xl">
                        {editingRubricId ? 'Edit Rubric' : 'Add New Rubric'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm">
                        {editingRubric
                            ? "Update the existing rubric's title, description, and grading criteria."
                            : "Create a new rubric by providing its title, description, and grading criteria."}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[calc(90vh-8rem)]">
                    <RubricDetailsForm
                        onCancel={() => setOpen(false)}
                        defaultValues={editingRubric}
                        className="px-6 pb-6"
                        rubricId={editingRubricId ?? ''}
                        onSuccess={onSubmitSuccess} />
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

export function CriteriaDialog({
    open,
    setOpen,
    rubricId,
    criterionId,
    defaultValues,
    onSuccess,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    rubricId: string;
    criterionId?: string;
    defaultValues?: any;
    onSuccess: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="flex max-w-4xl flex-col p-0">
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle className="text-xl">
                        {criterionId ? 'Edit Criterion' : 'Add New Criterion'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm">
                        {criterionId
                            ? 'Modify an existing assessment criterion for this rubric.'
                            : 'Add a new criterion to this rubric, including the grading components.'}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[calc(90vh-8rem)]">
                    <RubricCriteriaForm
                        rubricId={rubricId}
                        criterionId={criterionId ?? ''}
                        className="px-6 pb-6"
                        defaultValues={defaultValues}
                        onCancel={() => setOpen(false)}
                        onSuccess={onSuccess}
                    />
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}


export function ScoringDialog({
    open,
    setOpen,
    rubricId,
    criterionId,
    scoringId,
    defaultValues,
    onSuccess,
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    rubricId: string;
    criterionId: string;
    scoringId?: string;
    defaultValues?: any;
    onSuccess: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="flex max-w-xl flex-col p-0">
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle className="text-xl">
                        {scoringId ? 'Edit Scoring' : 'Add New Scoring'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm">
                        {scoringId
                            ? 'Update the grading level and expectations for this scoring entry.'
                            : 'Define a new scoring entry for this criterion.'}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[calc(90vh-8rem)]">
                    <RubricScoringForm
                        rubricId={rubricId}
                        criterionId={criterionId}
                        scoringId={scoringId || ""}
                        className="px-6 pb-6"
                        defaultValues={defaultValues}
                        onCancel={() => setOpen(false)}
                        onSuccess={onSuccess}
                    />
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

