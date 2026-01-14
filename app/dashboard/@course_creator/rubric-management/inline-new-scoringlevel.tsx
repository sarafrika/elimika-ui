import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import {
    createRubricScoringLevelMutation,
    getRubricMatrixQueryKey,
    getScoringLevelsByRubricQueryKey,
    searchAssessmentRubricsQueryKey,
    updateScoringLevelMutation,
} from '@/services/client/@tanstack/react-query.gen';

import { useInstructor } from '@/context/instructor-context';
import { ScoringLevelFormValues, scoringLevelSchema } from '../_components/rubric-management-form';

type ScoringLevel = ScoringLevelFormValues & {
    uuid: string;
};

interface Props {
    rubricId: string;
    onClose: () => void;
    defaultValues?: ScoringLevel;
}

export default function InlineNewScoringLevel({
    rubricId,
    onClose,
    defaultValues,
}: Props) {
    const [editingLevel, setEditingLevel] = useState<ScoringLevel | null>(
        defaultValues ?? null
    );

    const form = useForm<ScoringLevelFormValues>({
        resolver: zodResolver(scoringLevelSchema),
        defaultValues: defaultValues ?? {
            name: '',
            description: '',
            points: undefined,
            level_order: undefined,
            color_code: '',
            is_passing: false,
            performance_indicator: '',
        },
    });

    const qc = useQueryClient();
    const instructor = useInstructor();

    const createLevel = useMutation(createRubricScoringLevelMutation());
    const updateLevel = useMutation(updateScoringLevelMutation());

    const handleSubmit = (values: ScoringLevelFormValues) => {
        const payload = {
            rubric_uuid: rubricId,
            name: values.name,
            description: values.description || '',
            points: values.points,
            level_order: values.level_order,
            color_code: values.color_code,
            is_passing: values.is_passing,
            dispay_name: `${values.name} (${values.points ?? 0} pts)`,
            performance_indicator: values.performance_indicator,
        };

        const onSuccess = (data: any) => {
            invalidateQueries();
            toast.success(data?.message);
            resetForm();
        };

        if (editingLevel?.uuid) {
            updateLevel.mutate(
                {
                    path: { rubricUuid: rubricId, levelUuid: editingLevel.uuid },
                    body: payload as any,
                },
                { onSuccess }
            );
        } else {
            createLevel.mutate(
                { path: { rubricUuid: rubricId }, body: payload as any },
                { onSuccess }
            );
        }
    };


    const resetForm = () => {
        form.reset();
        setEditingLevel(null);
        onClose();
    };

    const invalidateQueries = () => {
        qc.invalidateQueries({
            queryKey: searchAssessmentRubricsQueryKey({
                query: {
                    pageable: {},
                    searchParams: { instructor_uuid_eq: instructor?.uuid as string },
                },
            }),
        });

        qc.invalidateQueries({
            queryKey: getScoringLevelsByRubricQueryKey({
                path: { rubricUuid: rubricId },
                query: { pageable: {} },
            }),
        });

        qc.invalidateQueries({
            queryKey: getRubricMatrixQueryKey({
                path: { rubricUuid: rubricId },
            }),
        });
    };


    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="flex flex-col gap-6 rounded-lg border bg-muted/50 p-4 max-w-2xl"
            >
                {/* Passing */}
                <FormField
                    control={form.control}
                    name="is_passing"
                    render={({ field }) => (
                        <FormItem className="flex items-start space-x-3">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="leading-none">
                                <FormLabel>Passing Level</FormLabel>
                                <FormDescription>
                                    Marks this scoring level as passing.
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />

                {/* Order */}
                <FormField
                    control={form.control}
                    name="level_order"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Display Order</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {/* Color */}
                <FormField
                    control={form.control}
                    name="color_code"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Color Code</FormLabel>
                            <div className="flex items-center gap-4">
                                <FormControl>
                                    <Input type="color" {...field} className="h-10 w-10 p-0" />
                                </FormControl>
                                <span className="text-muted-foreground font-mono text-sm">
                                    {field.value?.toUpperCase()}
                                </span>
                            </div>
                        </FormItem>
                    )}
                />

                {/* Name */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Scoring Level Name</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {/* Description */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {/* Points */}
                <FormField
                    control={form.control}
                    name="points"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Points</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {/* Performance Indicator */}
                <FormField
                    control={form.control}
                    name="performance_indicator"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Performance Indicator</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {/* Actions */}
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        disabled={createLevel.isPending || updateLevel.isPending}
                    >
                        {editingLevel
                            ? updateLevel.isPending
                                ? 'Updating...'
                                : 'Update Scoring Level'
                            : createLevel.isPending
                                ? 'Creating...'
                                : 'Create Scoring Level'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
