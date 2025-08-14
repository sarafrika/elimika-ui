'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { addProgramCourseMutation, createTrainingProgramMutation, getAllCategoriesOptions, getAllTrainingProgramsQueryKey, getProgramCoursesQueryKey, searchCoursesOptions, updateTrainingProgramMutation } from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { useInstructor } from '@/context/instructor-context';
import { createCategory } from '@/services/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { SimpleEditor } from '../../../../components/tiptap-templates/simple/simple-editor';


const classFormSchema = z.object({
  title: z.string().min(1, 'Class title is required'),
  description: z.string().optional(),
  objectives: z.string().optional(),
  prerequisites: z.string().optional(),
  categories: z.string(),
  total_duration_hours: z.any(),
  total_duration_minutes: z.any(),
  class_limit: z.coerce.number().min(1, 'Class limit must be at least 1'),
  price: z.coerce.number().optional(),
  is_free: z.boolean(),
  program_type: z.string().min(1, 'Program type is required'),
  initialValues: z.any()
});

export type ClassFormValues = z.infer<typeof classFormSchema>;

interface ClassCreationFormProps {
  onCancel: () => void;
  className?: string;
  classId?: string | number;
  initialValues?: Partial<ClassFormValues>;
}

function ClassCreationForm({ onCancel, className, classId, initialValues }: ClassCreationFormProps) {
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      title: '',
      description: '',
      objectives: '',
      prerequisites: '',
      total_duration_hours: 0,
      total_duration_minutes: 0,
      class_limit: 0,
      price: 0,
      is_free: false,
      program_type: '',
      categories: '',
      ...initialValues,
    },
  });

  const { append: appendCategory, remove: removeCategory } = useFieldArray({
    control: form.control, name: 'categories',
  });

  const queryClient = useQueryClient()
  const dialogCloseRef = useRef<HTMLButtonElement>(null);
  const [categoryInput, setCategoryInput] = useState('');
  const instructor = useInstructor();
  const { data: session } = useSession()

  // GET COURSE CATEGORIES
  const { data: categories } = useQuery(getAllCategoriesOptions({ 
    query: { 
      pageable: { 
        page: 0, 
        size: 100 
      } 
    } 
  }));

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
        return
      }

      toast.success(data?.message);
      dialogCloseRef.current?.click();
      queryClient.invalidateQueries({ queryKey: ["getAllCategories"] });
      setCategoryInput('');
    },
  });

  const createTrainingProgram = useMutation(createTrainingProgramMutation())
  const updateTrainingProgram = useMutation(updateTrainingProgramMutation());

  const onSubmit = (values: ClassFormValues, initialValues: any) => {
    const isEditing = !!initialValues?.uuid || !!classId; // Use either one depending on your data shape

    const trainingProgramBody = {
      title: values.title,
      instructor_uuid: instructor?.uuid || '',
      category_uuid: values.categories,
      description: values.description,
      objectives: values.objectives,
      prerequisites: values.prerequisites,
      total_duration_hours: values.total_duration_hours,
      total_duration_minutes: values.total_duration_minutes,
      class_limit: values.class_limit,
      price: values.price,
      is_free: values.is_free,
      program_type: values.program_type,
      total_duration_display: `${values.total_duration_hours} hours ${values.total_duration_minutes} minutes`,
      created_by: session?.user?.email,
      updated_by: session?.user?.email,
      is_published: false,
      published: false,
      active: false,
      status: "draft",
    };

    const commonOnSuccess = (data: any) => {
      toast.success(data?.message || (isEditing ? "Training program updated successfully" : "Training program created successfully"));
      onCancel();

      queryClient.invalidateQueries({
        queryKey: getAllTrainingProgramsQueryKey({ 
          query: { 
            pageable: { 
              page: 0, 
              size: 100 
            } 
          } 
        }),
      });
    };

    if (isEditing) {
      updateTrainingProgram.mutate(
        {
          body: trainingProgramBody,
          path: { uuid: classId || initialValues.uuid },
        },
        {
          onSuccess: commonOnSuccess,
        }
      );
    } else {
      createTrainingProgram.mutate(
        { body: trainingProgramBody },
        {
          onSuccess: commonOnSuccess,
        }
      );
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-8 ${className}`}>
        {/* Title */}
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Title</FormLabel>
              <FormControl>
                <Input placeholder='Enter class title' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <SimpleEditor
                  value={field.value}
                  onChange={field.onChange}
                />
                {/* <Textarea placeholder='Enter description' className='resize-none' {...field} /> */}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Objectives */}
        <FormField
          control={form.control}
          name='objectives'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objectives</FormLabel>
              <FormControl>
                <SimpleEditor
                  value={field.value}
                  onChange={field.onChange}
                />
                {/* <Textarea placeholder='What will students learn?' className='resize-none' {...field} /> */}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Prerequisites */}
        <FormField
          control={form.control}
          name='prerequisites'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prerequisites</FormLabel>
              <FormControl>
                <Textarea placeholder='What should students know before this course?' className='resize-none' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Duration */}
        <div className='grid grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='total_duration_hours'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Hours</FormLabel>
                <FormControl>
                  <Input type='number' min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='total_duration_minutes'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Minutes</FormLabel>
                <FormControl>
                  <Input type='number' min={0} max={59} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Class Limit */}
        <FormField
          control={form.control}
          name='class_limit'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Limit</FormLabel>
              <FormControl>
                <Input type='number' min='1' placeholder='Maximum number of students' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Program Type */}
        <FormField
          control={form.control}
          name='program_type'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Program Type</FormLabel>
              <FormControl>
                <Input placeholder='e.g., Comprehensive Masterclass' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Categories */}
        <FormField
          control={form.control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>

              <div className="mb-1 flex items-center gap-2">
                <Select
                  value={field.value || ''}
                  onValueChange={(uuid) => {
                    field.onChange(uuid);
                  }}
                >
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <div className="max-h-[250px] overflow-auto">
                      {categories?.data?.content?.map((cat: any) => (
                        <SelectItem key={cat.uuid} value={cat.uuid}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>

                {/* Dialog to add new category */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="hidden sm:flex">Add new</Button>
                  </DialogTrigger>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex sm:hidden"><Plus /></Button>
                  </DialogTrigger>
                  <DialogContent className="w-full sm:max-w-[350px]">
                    <DialogHeader>
                      <DialogTitle>Add new category</DialogTitle>
                      <DialogDescription>Add a new category here.</DialogDescription>
                    </DialogHeader>
                    <div className="flex w-full items-center gap-2 py-2">
                      <div className="grid w-full gap-3">
                        <Label htmlFor="category-name">Category Name</Label>
                        <Input
                          id="category-name"
                          name="category"
                          value={categoryInput}
                          onChange={(e) => setCategoryInput(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    <DialogFooter className="justify-end">
                      <Button
                        type="button"
                        className="min-w-[75px]"
                        onClick={() => {
                          if (categoryInput?.trim()) {
                            createCategoryMutation({ body: { name: categoryInput.trim() } });
                          }
                        }}
                      >
                        {createCategoryPending ? <Spinner /> : 'Add'}
                      </Button>
                      <DialogClose asChild>
                        <button ref={dialogCloseRef} style={{ display: 'none' }} />
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Display selected category */}
              {field.value && (
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const selectedCat = categories?.data?.content?.find((c: any) => c.uuid === field.value);
                    return selectedCat ? (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {selectedCat.name}
                        <button
                          type="button"
                          className="ml-1 text-red-500 hover:text-red-700"
                          onClick={() => field.onChange('')}
                        >
                          ✕
                        </button>
                      </Badge>
                    ) : null;
                  })()}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pricing */}
        <div className='space-y-4'>
          {/* Free Checkbox */}
          <FormField
            control={form.control}
            name='is_free'
            render={({ field }) => (
              <FormItem className='flex flex-row items-start space-x-3'>
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className='space-y-1 leading-none'>
                  <FormLabel>Free Course</FormLabel>
                  <FormDescription>Make this course available for free</FormDescription>
                </div>
              </FormItem>
            )}
          />

          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            {/* Price */}
            <FormField
              control={form.control}
              name='price'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min='0'
                      step='0.01'
                      {...field}
                      disabled={form.watch('is_free')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fixed Currency Display */}
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <FormControl>
                <Input value='KES' readOnly disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>
        </div>

        {/* Submit + Cancel Buttons */}
        <div className='flex justify-end gap-2 pt-6 pb-4'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>

          <Button type='submit' className='min-w-[115px]'>
            {(createTrainingProgram.isPending || updateTrainingProgram.isPending)
              ? <Spinner />
              : classId ? 'Update Class' : 'Create Class'}
          </Button>

        </div>
      </form>
    </Form>

  );
}

const addCourseToProgramSchema = z.object({
  course_uuid: z.string().uuid(),
  prerequisite_course_uuid: z.string().uuid().optional().or(z.literal('')),
  sequence_order: z.coerce.number().optional(),
  is_required: z.boolean(),
});

function AddCourseToProgramForm({
  programUuid,
  onCancel,
  onSuccess,
  className
}: {
  programUuid: string;
  onCancel: () => void;
  onSuccess?: () => void;
  className: any
}) {
  const form = useForm({
    resolver: zodResolver(addCourseToProgramSchema),
    defaultValues: {
      course_uuid: '',
      prerequisite_course_uuid: '',
      sequence_order: 1,
      is_required: true,
    },
  });

  const queryClient = useQueryClient();
  const instructor = useInstructor()

  // GET PUBLISHED INSTRUCTOR'S COURSES
  const { data: allCourses } = useQuery(searchCoursesOptions({ query: { searchParams: { instructor_uuid_eq: instructor?.uuid as string, } } }))

  const addProgramCourses = useMutation(addProgramCourseMutation())

  const onSubmit = (values: any) => {
    // const selectedCourse = allCourses?.data?.content?.find(c => c.uuid === values.course_uuid);
    // const prerequisiteCourse = allCourses?.data?.content?.find(c => c.uuid === values.prerequisite_course_uuid);

    const body = {
      program_uuid: programUuid,
      course_uuid: values.course_uuid,
      sequence_order: values.sequence_order,
      sequence_display: `Course ${values.sequence_order} of Program`,
      is_required: values.is_required,
      created_by: instructor?.user_uuid,
      prerequisite_course_uuid: values.prerequisite_course_uuid || null,
      has_prerequisites: !!values.prerequisite_course_uuid,
      association_category: values.is_required ? 'Required Course' : 'Optional Course',
      requirement_status: values.is_required ? 'Mandatory Course' : 'Elective Course',
      curriculum_summary: `${values.is_required ? 'Required' : 'Optional'
        } course${values.prerequisite_course_uuid ? ' with prerequisites' : ''} in sequence position ${values.sequence_order}`
    };

    addProgramCourses.mutate({ body: body, path: { programUuid: programUuid } }, {
      onSuccess: (data) => {
        toast.success(data?.message || "Course added to program successfully")
        onCancel();
        queryClient.invalidateQueries({
          queryKey: getProgramCoursesQueryKey({ path: { programUuid } }),
        });
      },
      onError: (error: any) => {
        const message = error?.error?.toLowerCase?.() || '';
        if (message.includes('duplicate key')) {
          toast.error("This course has already been added, or the sequence number is already in use.");
        } else {
          toast.error('Failed to add course to program.');
        }
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-8 ${className}`}>
        {/* Course Selection */}
        <FormField
          control={form.control}
          name="course_uuid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course</FormLabel>
              <Select
                value={field.value || ''}
                onValueChange={(uuid) => field.onChange(uuid)}
              >
                <FormControl className="w-full max-w-[462px]">
                  <SelectTrigger className="w-full truncate">
                    <SelectValue
                      placeholder="Select course"
                      className="truncate"
                    />
                  </SelectTrigger>
                </FormControl>

                <SelectContent className="w-full max-w-[462px]">
                  {allCourses?.data?.content?.map((c: any) => (
                    <SelectItem
                      key={c.uuid}
                      value={c.uuid}
                      className="w-full truncate max-w-full"
                      title={c.name}
                    >
                      <span className="block truncate">{c.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Prerequisite Course */}
        <FormField
          control={form.control}
          name="prerequisite_course_uuid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prerequisite Course</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl className="w-full max-w-[462px]">
                  <SelectTrigger className="w-full truncate">
                    <SelectValue placeholder="Select prerequisite (optional)" className="truncate" />
                  </SelectTrigger>
                </FormControl>

                <SelectContent className="w-full max-w-[462px]">
                  {allCourses?.data?.content?.map((c: any) => (
                    <SelectItem
                      key={c.uuid}
                      value={c.uuid}
                      className="w-full truncate max-w-full"
                      title={c.name}
                    >
                      <span className="block truncate">{c.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sequence Order */}
        <FormField
          control={form.control}
          name="sequence_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sequence Order</FormLabel>
              <FormControl>
                <Input type="number" min={1} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Required Toggle */}
        <FormField
          control={form.control}
          name="is_required"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>Is this course required?</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className='min-w-[180px]' disabled={addProgramCourses.isPending}>
            {addProgramCourses.isPending ? <Spinner /> : 'Add Course to Program'}
          </Button>
        </div>

      </form>
    </Form>
  );
}


interface CreateClassDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  classId?: string | number;
  initialValues?: Partial<ClassFormValues>;
}

function CreateClassDialog({ isOpen, onOpenChange }: CreateClassDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 pt-8 pb-4'>
          <DialogTitle className='text-xl'>Create New Class</DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            Fill in the class details below. You&apos;ll be able to make changes after you&apos;ve
            created the class.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[calc(90vh-8rem)]'>
          <ClassCreationForm onCancel={() => onOpenChange(false)} className='px-6 pb-6' />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function EditClassDialog({ isOpen, onOpenChange, classId, initialValues }: CreateClassDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 pt-8 pb-4'>
          <DialogTitle className='text-xl'>Edit Class</DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            Modify the class details as needed. You can update them again later.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[calc(90vh-8rem)]'>
          <ClassCreationForm
            classId={classId}
            className='px-6 pb-6'
            initialValues={initialValues}
            onCancel={() => onOpenChange(false)}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}


interface AddProgramCourseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  classId?: string
}

function AddProgramCourseDialog({ isOpen, onOpenChange, classId }: AddProgramCourseDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 pt-8 pb-4'>
          <DialogTitle className='text-xl'>Add Program Course</DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            Select a course to add to this program. You can define its position, prerequisites, and whether it’s required.
          </DialogDescription>

        </DialogHeader>

        <ScrollArea className='h-auto py-6'>
          <AddCourseToProgramForm
            programUuid={classId as string}
            onCancel={() => onOpenChange(false)}
            className='px-6 pb-6'
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export { AddProgramCourseDialog, CreateClassDialog, EditClassDialog };

