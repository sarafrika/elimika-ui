'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  addProgramCourseMutation,
  addProgramRequirementMutation,
  createTrainingProgramMutation,
  getProgramCoursesQueryKey,
  getProgramRequirementsQueryKey,
  searchCoursesOptions,
  searchTrainingProgramsQueryKey,
  updateProgramRequirementMutation,
  updateTrainingProgramMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { RequirementTypeEnum, SchemaEnum } from '@/services/client/types.gen';
import { zodResolver } from '@hookform/resolvers/zod';

import { AddCategoryFormItem } from '@/components/add-category-formfield';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { useInstructor } from '@/context/instructor-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const programFormSchema = z.object({
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
  initialValues: z.any(),
});

export type ProgramFormValues = z.infer<typeof programFormSchema>;

interface ProgramCreationFormProps {
  onCancel: () => void;
  className?: string;
  programId?: string | number;
  initialValues?: Partial<ProgramFormValues>;
}

function ProgramCreationForm({
  onCancel,
  className,
  programId,
  initialValues,
}: ProgramCreationFormProps) {
  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
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
    control: form.control,
    name: 'categories',
  });

  const queryClient = useQueryClient();
  const instructor = useInstructor();
  const { data: session } = useSession();

  const createTrainingProgram = useMutation(createTrainingProgramMutation());
  const updateTrainingProgram = useMutation(updateTrainingProgramMutation());

  const onSubmit = (values: ProgramFormValues, initialValues: any) => {
    const isEditing = !!initialValues?.uuid || !!programId;

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
      status: SchemaEnum.DRAFT,
    };

    const commonOnSuccess = (data: any) => {
      toast.success(
        data?.message ||
        (isEditing
          ? 'Training program updated successfully'
          : 'Training program created successfully')
      );
      onCancel();

      queryClient.invalidateQueries({
        queryKey: searchTrainingProgramsQueryKey({
          query: { searchParams: { instructorUuid: instructor?.uuid }, pageable: {} },
        }),
      });
    };

    if (isEditing) {
      updateTrainingProgram.mutate(
        {
          body: trainingProgramBody,
          path: { uuid: programId || initialValues.uuid },
        },
        {
          onSuccess: commonOnSuccess,
          onError: error => {
            //@ts-ignore
            toast.error(`${error?.message} - ${Object.values(error?.error)[0]}`);
          },
        }
      );
    } else {
      createTrainingProgram.mutate(
        { body: trainingProgramBody },
        {
          onSuccess: commonOnSuccess,
          onError: error => {
            //@ts-ignore
            toast.error(`${error?.message} - ${Object.values(error?.error)[0]}`);
          },
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
              <FormLabel>Program Title</FormLabel>
              <FormControl>
                <Input placeholder='Enter program title' {...field} />
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
                <SimpleEditor value={field.value} onChange={field.onChange} />
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
                <SimpleEditor value={field.value} onChange={field.onChange} />
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
                <Textarea
                  placeholder='What should students know before taking this program?'
                  className='resize-none'
                  {...field}
                />
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
          name='categories'
          render={({ field }) => <AddCategoryFormItem field={field} />}
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
                  <FormLabel>Free Program</FormLabel>
                  <FormDescription>Make this program available for free</FormDescription>
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
            {createTrainingProgram.isPending || updateTrainingProgram.isPending ? (
              <Spinner />
            ) : programId ? (
              'Update Program'
            ) : (
              'Create Program'
            )}
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
  className,
}: {
  programUuid: string;
  onCancel: () => void;
  onSuccess?: () => void;
  className: any;
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
  const instructor = useInstructor();

  // GET PUBLISHED INSTRUCTOR'S COURSES
  const { data: allCourses } = useQuery(
    searchCoursesOptions({
      query: {
        searchParams: {
          instructor_uuid_eq: instructor?.uuid as string,
        },
        pageable: {
          page: 0,
          size: 100,
        },
      },
    })
  );

  const addProgramCourses = useMutation(addProgramCourseMutation());

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
        } course${values.prerequisite_course_uuid ? ' with prerequisites' : ''} in sequence position ${values.sequence_order}`,
    };

    addProgramCourses.mutate(
      { body: body, path: { programUuid: programUuid } },
      {
        onSuccess: data => {
          toast.success(data?.message || 'Course added to program successfully');
          onCancel();
          queryClient.invalidateQueries({
            queryKey: getProgramCoursesQueryKey({ path: { programUuid } }),
          });
        },
        onError: (error: any) => {
          const message = error?.error?.toLowerCase?.() || '';
          if (message.includes('duplicate key')) {
            toast.error(
              'This course has already been added, or the sequence number is already in use.'
            );
          } else {
            toast.error('Failed to add course to program.');
          }
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-8 ${className}`}>
        {/* Course Selection */}
        <FormField
          control={form.control}
          name='course_uuid'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course</FormLabel>
              <Select value={field.value || ''} onValueChange={uuid => field.onChange(uuid)}>
                <FormControl className='w-full max-w-[462px]'>
                  <SelectTrigger className='w-full truncate'>
                    <SelectValue placeholder='Select course' className='truncate' />
                  </SelectTrigger>
                </FormControl>

                <SelectContent className='w-full max-w-[462px]'>
                  {allCourses?.data?.content?.map((c: any) => (
                    <SelectItem
                      key={c.uuid}
                      value={c.uuid}
                      className='w-full max-w-full truncate'
                      title={c.name}
                    >
                      <span className='block truncate'>{c.name}</span>
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
          name='prerequisite_course_uuid'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prerequisite Course</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl className='w-full max-w-[462px]'>
                  <SelectTrigger className='w-full truncate'>
                    <SelectValue
                      placeholder='Select prerequisite (optional)'
                      className='truncate'
                    />
                  </SelectTrigger>
                </FormControl>

                <SelectContent className='w-full max-w-[462px]'>
                  {allCourses?.data?.content?.map((c: any) => (
                    <SelectItem
                      key={c.uuid}
                      value={c.uuid}
                      className='w-full max-w-full truncate'
                      title={c.name}
                    >
                      <span className='block truncate'>{c.name}</span>
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
          name='sequence_order'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sequence Order</FormLabel>
              <FormControl>
                <Input type='number' min={1} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Required Toggle */}
        <FormField
          control={form.control}
          name='is_required'
          render={({ field }) => (
            <FormItem className='flex items-center gap-2'>
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>Is this course required?</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Buttons */}
        <div className='flex justify-end gap-3 pt-4'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button type='submit' className='min-w-[180px]' disabled={addProgramCourses.isPending}>
            {addProgramCourses.isPending ? <Spinner /> : 'Add Course to Program'}
          </Button>
        </div>
      </form>
    </Form>
  );
}


const programRequirementSchema = z.object({
  program_uuid: z.string(),
  requirement_type: z.string().optional(),
  requirement_text: z.string().optional(),
  requirement_category: z.string().optional(),
  requirement_priority: z.string().optional(),
  compliance_level: z.string().optional(),
  requirement_summary: z.string().optional(),
  is_mandatory: z.boolean(),
  // is_optional: z.boolean(),
});

export type ProgramRequirementFormValues = z.infer<typeof programRequirementSchema>;

function ProgramRequirementForm({
  programUuid,
  requirementUuid,
  initialValues,
  onSuccess,
  onCancel,
  className,
}: {
  programUuid: string;
  requirementUuid?: string;
  initialValues?: ProgramRequirementFormValues;
  onSuccess?: () => void;
  onCancel: () => void;
  className?: string;
}) {
  const form = useForm<ProgramRequirementFormValues>({
    resolver: zodResolver(programRequirementSchema),
    defaultValues: {
      program_uuid: '',
      requirement_type: '',
      requirement_text: '',
      is_mandatory: true,
      compliance_level: '',
      requirement_category: '',
      requirement_priority: '',
      requirement_summary: '',
      ...initialValues
    },
  });

  const qc = useQueryClient();
  const instructor = useInstructor();

  const addProgramRequirement = useMutation(addProgramRequirementMutation());
  const updateProgramRequirement = useMutation(updateProgramRequirementMutation());

  const handleSubmit = async (values: ProgramRequirementFormValues) => {
    const payload = {
      ...values,
      requirement_type: values.requirement_type as RequirementTypeEnum,
      program_uuid: programUuid as string,
      is_optional: !values.is_mandatory,
      updated_by: instructor?.full_name,
      requirement_text: values.requirement_text,
      is_mandatory: values.is_mandatory,
      requirement_category: values.requirement_category,
      requirement_priority: values.requirement_priority,
      compliance_level: values.compliance_level,
      requirement_summary: values.requirement_summary,
    };

    if (requirementUuid) {
      updateProgramRequirement.mutate(
        { path: { programUuid, requirementUuid }, body: payload as any },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: getProgramRequirementsQueryKey({
                path: { programUuid },
                query: { pageable: {} },
              }),
            });
            toast.success(data?.message || 'Requirement updated successfully');
            onCancel();
          },
          onError: () => toast.error('Failed to update requirement'),
        }
      );
    } else {
      addProgramRequirement.mutate(
        { path: { programUuid: programUuid as string }, body: payload as any },
        {
          onSuccess: data => {
            qc.invalidateQueries({
              queryKey: getProgramRequirementsQueryKey({
                path: { programUuid: programUuid as string },
                query: { pageable: {} },
              }),
            });

            toast.success(data?.message || 'Requirement added successfully');
            onCancel();
          },
          onError: (error) => {
            // const message = error?.error?.toLowerCase?.() || '';
            // if (message.includes('duplicate key')) {
            //   toast.error('This requirement already exists or is duplicated.');
            // } else {
            //   toast.error('Failed to add requirement.');
            // }
          },
        }
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-8 ${className}`}>
        {/* Requirement Type */}
        <FormField
          control={form.control}
          name='requirement_type'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requirement Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl className='w-full max-w-[462px]'>
                  <SelectTrigger className='w-full truncate'>
                    <SelectValue placeholder='Select requirement type' className='truncate' />
                  </SelectTrigger>
                </FormControl>

                <SelectContent className='w-full max-w-[462px]'>
                  {Object.entries(RequirementTypeEnum).map(([key, value]) => (
                    <SelectItem
                      key={key}
                      value={value}
                      className='w-full max-w-full truncate'
                      title={value}
                    >
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Requirement Text */}
        <FormField
          control={form.control}
          name='requirement_text'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requirement Text</FormLabel>
              <FormControl>
                <Textarea placeholder='Describe the requirement' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Required Checkbox */}
        <FormField
          control={form.control}
          name='is_mandatory'
          render={({ field }) => (
            <FormItem className='flex items-center gap-2'>
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>Is this requirement mandatory?</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Buttons */}
        <div className='flex justify-end gap-3 pt-4'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type='submit'
            className='min-w-[180px]'
            disabled={addProgramRequirement.isPending || updateProgramRequirement.isPending}
          >
            {(addProgramRequirement.isPending || updateProgramRequirement.isPending) && <Spinner />}
            {initialValues ? 'Update Requirement' : 'Add Requirement'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface CreateProgramDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  programId?: string | number;
  initialValues?: Partial<ProgramFormValues>;
}

function CreateProgramDialog({ isOpen, onOpenChange }: CreateProgramDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 pt-8 pb-4'>
          <DialogTitle className='text-xl'>Create New Program</DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            Fill in the program details below. You&apos;ll be able to make changes after you&apos;ve
            created the program.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[calc(90vh-8rem)]'>
          <ProgramCreationForm onCancel={() => onOpenChange(false)} className='px-6 pb-6' />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function EditProgramDialog({
  isOpen,
  onOpenChange,
  programId,
  initialValues,
}: CreateProgramDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 pt-8 pb-4'>
          <DialogTitle className='text-xl'>Edit Program</DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            Modify the program details as needed. You can update them again later.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-[calc(90vh-8rem)]'>
          <ProgramCreationForm
            programId={programId}
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
  programId?: string;
  onSuccess?: () => any;
}

function AddProgramCourseDialog({
  isOpen,
  onOpenChange,
  programId,
  onSuccess,
}: AddProgramCourseDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 pt-8 pb-4'>
          <DialogTitle className='text-xl'>Add Program Course</DialogTitle>
          <DialogDescription className='text-muted-foreground text-sm'>
            Select a course to add to this program. You can define its position, prerequisites, and
            whether it’s required.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-auto py-6'>
          <AddCourseToProgramForm
            programUuid={programId as string}
            onCancel={() => onOpenChange(false)}
            className='px-6 pb-6'
            onSuccess={onSuccess}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface ProgramRequirementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  programId?: string;
  requirementId?: string;
  onSuccess?: () => void;
  initialValues: any
}

function ProgramRequirementDialog({
  isOpen,
  onOpenChange,
  programId,
  requirementId,
  onSuccess,
  initialValues,
}: ProgramRequirementDialogProps) {
  const isEditMode = requirementId;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-w-6xl flex-col p-0'>
        <DialogHeader className='border-b px-6 pt-8 pb-4'>
          <DialogTitle className='text-xl'>
            {isEditMode ? 'Edit Program Requirement' : 'Add Program Requirement'}
          </DialogTitle>

          <DialogDescription className='text-muted-foreground text-sm'>
            {isEditMode
              ? 'Update the details of this program requirement.'
              : 'Select a course to add to this program. You can define its position, prerequisites, and whether it’s required.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='h-auto py-6'>
          <ProgramRequirementForm
            initialValues={initialValues}
            requirementUuid={requirementId as string}
            programUuid={programId as string}
            onCancel={() => onOpenChange(false)}
            onSuccess={onSuccess}
            className='px-6 pb-6'
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}


export { AddProgramCourseDialog, CreateProgramDialog, EditProgramDialog, ProgramRequirementDialog };
