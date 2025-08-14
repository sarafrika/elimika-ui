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
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, X } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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


const rubricFormSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    type: z.string().min(1, 'Rubric type is required'),
    grading: z.array(
        z.object({
            name: z.string().min(1, 'Grading item is required'),
            description: z.string().optional(), // new optional description
            points: z.number().min(0, 'Points must be positive'),
        })
    ).min(1, 'At least one grading item is required'),
    visibility: z.nativeEnum(Visibility, { required_error: 'Rubric visibility is required' }),
});


export type RubricFormValues = z.infer<typeof rubricFormSchema>;

interface AddRubricFormProps {
    onCancel: () => void;
    onSubmitSuccess?: (values: RubricFormValues) => void;
    defaultValues?: RubricFormValues;
    className?: string;
}

export function AddRubricForm({
    onCancel,
    onSubmitSuccess,
    defaultValues,
    className = '',
}: AddRubricFormProps) {
    const form = useForm<RubricFormValues>({
        resolver: zodResolver(rubricFormSchema),

        defaultValues: {
            title: '',
            description: '',
            type: RubricType.Assignment,
            grading: [{ name: '', description: '', points: 0 }], // include description here
            visibility: Visibility.Public,
            ...defaultValues,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'grading',
    });

    const onSubmit = (values: RubricFormValues) => {
        // console.log('Rubric form submitted:', values);
        toast.success('Rubric submitted successfully');
        onSubmitSuccess?.(values);
        onCancel();
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
                                        <SelectItem value="Assignment">Assignment</SelectItem>
                                        <SelectItem value="Exam">Exam</SelectItem>
                                        <SelectItem value="Class Attendance">Class Attendance</SelectItem>
                                        <SelectItem value="Auditions">Auditions</SelectItem>
                                        <SelectItem value="Competition">Competition</SelectItem>
                                        <SelectItem value="Performance">Performance</SelectItem>
                                        <SelectItem value="Project">Project</SelectItem>
                                        <SelectItem value="Quiz">Quiz</SelectItem>
                                        <SelectItem value="Reading">Reading</SelectItem>
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
                                        <SelectValue placeholder="Select rubric visibility" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={Visibility.Public}>Public</SelectItem>
                                        <SelectItem value={Visibility.Private}>Private</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>


                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Grading Criteria</h3>
                    {fields.map((field, index) => (
                        <div
                            key={field.id}
                            className="flex items-start border border-gray-300 rounded-md p-4 pr-2"
                        >
                            <div className="flex flex-col flex-1 gap-4">
                                {/* Row: name and points side by side */}
                                <div className="flex gap-4">
                                    <FormField
                                        control={form.control}
                                        name={`grading.${index}.name`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel>Grading criterion</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Criterion name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={`grading.${index}.points`}
                                        render={({ field }) => (
                                            <FormItem className="w-[100px]">
                                                <FormLabel>Points</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Below row: description full width */}
                                <FormField
                                    control={form.control}
                                    name={`grading.${index}.description`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Criterion Description</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Criterion description (optional)" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Delete button aligned top */}
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => remove(index)}
                                disabled={fields.length === 1}
                                className="self-start"
                            >
                                <X className="h-4 w-4 text-red-600" />
                            </Button>
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ name: '', description: '', points: 0 })}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Grading Criterion
                    </Button>
                </div>

                <div className="flex justify-end gap-2 pt-6">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit" className="min-w-[120px]">
                        Create Rubric
                    </Button>
                </div>
            </form>
        </Form>
    );
}
