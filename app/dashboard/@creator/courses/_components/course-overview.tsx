'use client';

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useInstructor } from '@/context/instructor-context';
import { createCategory, updateCourse } from '@/services/client';
import { createCourseMutation, getAllCategoriesOptions, getAllDifficultyLevelsOptions } from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CourseFormValues, courseSchema } from './course-schema';

interface CourseOverviewProps {
    data: any;
    onDataChange: (data: any) => void;
}


export function CourseOverview({ data }: CourseOverviewProps) {
    const dialogCloseRef = useRef<HTMLButtonElement>(null);

    const defaultValues: CourseFormValues = {
        title: '',
        name: '',
        subtitle: '',
        categories: [],
        difficulty: '',
        description: '',
        targetAudience: [],
        objectives: [''],
        prerequisites: '',
        equipment: '',
        classroom: '',
    };

    const form = useForm<CourseFormValues>({
        resolver: zodResolver(courseSchema),
        defaultValues, // just empty defaults
    });

    useEffect(() => {
        if (data) {
            form.reset({
                ...defaultValues,
                ...data,
                objectives: Array.isArray(data.objectives) ? data.objectives : [''],
                targetAudience: Array.isArray(data.targetAudience) ? data.targetAudience : [],
                categories: Array.isArray(data.categories) ? data.categories : [],
            });
        }
    }, [data, defaultValues]);

    const {
        fields: objectiveFields,
        append: appendObjective,
        remove: removeObjective
    } = useFieldArray({
        control: form.control,
        name: 'objectives'
    });

    const {
        // fields: categoryFields,
        append: appendCategory,
        remove: removeCategory,
    } = useFieldArray({
        control: form.control,
        name: 'categories',
    });

    const prerequisites = form.watch('prerequisites');
    const objectives = form.watch('objectives');

    // Watch entire form and trigger parent update
    const formData = form.watch();
    useEffect(() => {
        // onDataChange(formData);
    }, [formData]);

    const targetAudiences = [
        'Beginners', 'Intermediate', 'Advanced', 'Professionals',
        'Students', 'Teens (13-17)', 'Adults (18-64)', 'Seniors (65+)'
    ];

    const addPrerequisite = (value: string) => {
        // if (value && !prerequisites.includes(value)) {
        //     setValue('prerequisites', [...prerequisites, value]);
        // }
    };

    const removePrerequisite = (value: string) => {
        // setValue('prerequisites', prerequisites.filter(p => p !== value));
    };


    const queryClient = useQueryClient();
    const instructor = useInstructor();
    const [categoryInput, setCategoryInput] = useState('');

    const { data: categories } = useQuery(
        getAllCategoriesOptions({ query: { pageable: { page: 0, size: 100 } } })
    );

    const { data: difficulty, isLoading: difficultyIsLoading } = useQuery(
        getAllDifficultyLevelsOptions()
    );
    const difficultyLevels = difficulty?.data;



    // MUTATION
    const { mutate: createCategoryMutation, isPending: createCategoryPending } = useMutation({
        mutationFn: ({ body }: { body: any }) => createCategory({ body }),
        onSuccess: (data: any) => {
            if (data?.error) {
                if (data.error.error?.toLowerCase().includes('duplicate key')) {
                    toast.error('Category already exists');
                } else {
                    toast.error('Failed to add category');
                }
                dialogCloseRef.current?.click();
                setCategoryInput('');
                return;
            }

            toast.success(data?.message);
            dialogCloseRef.current?.click();
            queryClient.invalidateQueries({ queryKey: ['getAllCategories'] });
            setCategoryInput('');
        },
    });

    const { mutate: createCourse, isPending: createCourseIsPending } =
        useMutation(createCourseMutation());

    const { mutate: updateCourseMutation, isPending: updateCourseIsPending } = useMutation({
        mutationFn: ({ body, uuid }: { body: any; uuid: string }) =>
            updateCourse({ body, path: { uuid: uuid } }),
    });



    const onSubmit = (value: any) => {
        // console.log(value, "val")
    }

    return (
        <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} >
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Course Title *</Label>
                                <FormField
                                    control={form.control}
                                    name='name'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input placeholder='Enter course name' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {/* {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>} */}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subtitle">Subtitle/Tagline</Label>
                                <Input id="subtitle" placeholder="Brief subtitle or tagline" {...form.register('subtitle')} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Course Category *</Label>
                            <div className="grid grid-cols-1 w-full">
                                <FormItem>
                                    <div className='mb-4 flex items-center gap-2 flex-1 w-full'>
                                        <Select
                                            value=''
                                            onValueChange={uuid => {
                                                if (uuid && !form.watch('categories').includes(uuid)) {
                                                    appendCategory(uuid);
                                                }
                                            }}
                                        >
                                            <FormControl className='w-full'>
                                                <SelectTrigger>
                                                    <SelectValue placeholder='Select category' />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <div className='max-h-[250px] overflow-auto'>
                                                    {/* @ts-ignore */}
                                                    {categories?.data?.content
                                                        ?.filter((cat: any) => !form.watch('categories').includes(cat.uuid))
                                                        .map((cat: any) => (
                                                            <SelectItem key={cat.uuid} value={cat.uuid}>
                                                                {cat.name}
                                                            </SelectItem>
                                                        ))}
                                                </div>
                                            </SelectContent>
                                        </Select>
                                        {/* Dialog to add new category */}
                                        <Dialog>
                                            <DialogTrigger className='hidden sm:flex' asChild>
                                                <Button variant='outline' className='hidden sm:flex'>
                                                    Add new
                                                </Button>
                                            </DialogTrigger>

                                            <DialogTrigger className='flex sm:hidden' asChild>
                                                <Button variant='outline' className='flex sm:hidden'>
                                                    <Plus />
                                                </Button>
                                            </DialogTrigger>

                                            <DialogContent className='w-full sm:max-w-[350px]'>
                                                <DialogHeader>
                                                    <DialogTitle>Add new category</DialogTitle>
                                                    <DialogDescription>Add a new category here.</DialogDescription>
                                                </DialogHeader>
                                                <div className='flex w-full items-center gap-2 py-2'>
                                                    <div className='grid w-full gap-3'>
                                                        <Label htmlFor='category-name'>Category Name</Label>
                                                        <Input
                                                            id='category-name'
                                                            name='category'
                                                            value={categoryInput}
                                                            onChange={e => setCategoryInput(e.target.value)}
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter className='justify-end'>
                                                    <Button
                                                        type='button'
                                                        className='min-w-[75px]'
                                                        onClick={() => {
                                                            if (categoryInput?.trim()) {
                                                                createCategoryMutation({ body: { name: categoryInput.trim() } });
                                                            }
                                                        }}
                                                    >
                                                        {createCategoryPending ? <Spinner /> : 'Add'}
                                                    </Button>

                                                    {/* Hidden button that will close the dialog when clicked */}
                                                    <DialogClose asChild>
                                                        <button ref={dialogCloseRef} style={{ display: 'none' }} />
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </FormItem>

                                {/* Show badges of selected categories */}
                                <div className='flex flex-wrap gap-2'>
                                    {form.watch('categories').map((uuid: string, index: number) => {
                                        //@ts-ignore
                                        const cat = categories?.data?.content?.find((c: any) => c.uuid === uuid);
                                        if (!cat) return null;
                                        return (
                                            <Badge key={uuid} variant='secondary' className='flex items-center gap-1'>
                                                {cat.name}
                                                <button
                                                    type='button'
                                                    className='ml-2'
                                                    onClick={() => removeCategory(index)}
                                                    aria-label={`Remove category ${cat.name}`}
                                                >
                                                    <XIcon className='h-3 w-3' />
                                                </button>
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Difficulty Level</Label>
                            <FormField
                                control={form.control}
                                name='difficulty'
                                render={({ field }) => (
                                    <FormItem>
                                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                            <FormControl className='w-full'>
                                                <SelectTrigger>
                                                    <SelectValue placeholder='Select difficulty level' />
                                                </SelectTrigger>
                                            </FormControl>
                                            {difficultyIsLoading ? (
                                                <SelectContent>
                                                    <div>Loading...</div>
                                                </SelectContent>
                                            ) : (
                                                <SelectContent>
                                                    {Array.isArray(difficultyLevels) &&
                                                        difficultyLevels.map((level: any) => (
                                                            <SelectItem key={level.uuid} value={level.uuid as string}>
                                                                {level.name}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            )}
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Course Description</Label>
                            <FormField
                                control={form.control}
                                name='description'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <SimpleEditor value={field.value} onChange={field.onChange} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Target Audience */}
                <Card>
                    <CardHeader>
                        <CardTitle>Target Audience</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {targetAudiences.map((audience) => (
                                <div key={audience} className="flex items-center space-x-2">
                                    <FormField
                                        control={form.control}
                                        name="targetAudience"
                                        render={({ field }) => {
                                            const isChecked = field.value?.includes(audience);
                                            return (
                                                <Checkbox
                                                    id={audience}
                                                    checked={isChecked}
                                                    onCheckedChange={(checked) => {
                                                        const updated = checked
                                                            ? [...(field.value || []), audience]
                                                            : (field.value || []).filter((a) => a !== audience);
                                                        field.onChange(updated);
                                                    }}
                                                />
                                            );
                                        }}
                                    />
                                    <Label htmlFor={audience}>{audience}</Label>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Learning Objectives */}
                <Card>
                    <CardHeader>
                        <CardTitle>Learning Objectives</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <FormField
                            control={form.control}
                            name='objectives'
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <SimpleEditor value={field.value} onChange={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Prerequisites */}
                <Card>
                    <CardHeader>
                        <CardTitle>Prerequisites</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <FormField
                            control={form.control}
                            name='prerequisites'
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <SimpleEditor value={field.value} onChange={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Course Requirements */}
                <Card>
                    <CardHeader>
                        <CardTitle>Course Requirements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="equipment">Equipment & Instruments</Label>
                            <Textarea
                                id="equipment"
                                placeholder="List required equipment, software, or instruments..."
                                rows={3}
                                {...form.register('equipment')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="classroom">Classroom Requirements</Label>
                            <Textarea
                                id="classroom"
                                placeholder="Describe specific classroom or space needs..."
                                rows={3}
                                {...form.register('classroom')}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" className="min-w-32">
                        Submit data
                    </Button>
                </div>

            </form >
        </Form>
    );
}
