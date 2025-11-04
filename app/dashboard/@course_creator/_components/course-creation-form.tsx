'use client';

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { useStepper } from '@/components/ui/stepper';
import { Textarea } from '@/components/ui/textarea';
import { useOptionalCourseCreator } from '@/context/course-creator-context';
import { useInstructor } from '@/context/instructor-context';
import { createCategory, updateCourse } from '@/services/client';
import {
  createCourseMutation,
  getAllCategoriesOptions,
  getAllCategoriesQueryKey,
  getCourseByUuidQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, XIcon } from 'lucide-react';
import { forwardRef, ReactNode, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useDifficultyLevels } from '../../../../hooks/use-difficultyLevels';
import {
  CourseCreationFormValues,
  courseCreationSchema,
  CURRENCIES,
  providedByOptions,
  requirementTypes,
} from './course-creation-types';

export type FormSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export const FormSection = ({ title, description, children }: FormSectionProps) => (
  <section className='rounded-3xl border border-blue-200/40 bg-white/90 p-6 shadow-lg shadow-blue-200/40 transition lg:p-8 dark:border-blue-500/25 dark:bg-blue-950/30'>
    <div className='flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10'>
      <div className='lg:w-1/3'>
        <p className='text-xs font-semibold tracking-[0.4em] text-blue-500/80 uppercase dark:text-blue-200'>
          Section
        </p>
        <h3 className='mt-2 text-lg font-semibold text-slate-900 dark:text-blue-50'>{title}</h3>
        <p className='mt-2 text-sm text-slate-600 dark:text-slate-200'>{description}</p>
      </div>
      <div className='lg:flex-1'>{children}</div>
    </div>
  </section>
);

export type CourseFormProps = {
  showSubmitButton?: boolean;
  initialValues?: Partial<CourseCreationFormValues>;
  editingCourseId?: string;
  courseId?: string;
  successResponse?: (data: any) => void;
};

export type CourseFormRef = {
  submit: () => void;
};

export const CourseCreationForm = forwardRef<CourseFormRef, CourseFormProps>(
  function CourseCreationForm(
    { showSubmitButton, initialValues, editingCourseId, courseId, successResponse },
    ref
  ) {
    const dialogCloseRef = useRef<HTMLButtonElement>(null);

    const form = useForm<CourseCreationFormValues>({
      resolver: zodResolver(courseCreationSchema),
      defaultValues: {
        name: '',
        description: '',
        is_free: false,
        objectives: '',
        categories: [],
        class_limit: 1,
        prerequisites: '',
        age_lower_limit: 1,
        age_upper_limit: 1,
        thumbnail_url: '',
        banner_url: '',
        intro_video_url: '',
        duration_hours: 0,
        duration_minutes: 1,
        minimum_training_fee: initialValues?.minimum_training_fee ?? 0,
        creator_share_percentage: 50,
        instructor_share_percentage: 50,
        revenue_share_notes: '',
        training_requirements: [],
        ...initialValues,
      },
      mode: 'onChange',
    });

    useEffect(() => {
      if (initialValues && Object.keys(initialValues).length > 0) {
        form.reset({
          ...form.getValues(), // preserve any unsaved edits (optional)
          ...initialValues, // overwrite with fetched data
        });
      }
    }, [initialValues, form]);

    const {
      // fields: categoryFields,
      append: appendCategory,
      remove: removeCategory,
    } = useFieldArray({
      control: form.control,
      name: 'categories',
    });

    const {
      fields: trainingRequirementFields,
      append: appendTrainingRequirement,
      remove: removeTrainingRequirement,
    } = useFieldArray({
      control: form.control,
      name: 'training_requirements',
    });

    const queryClient = useQueryClient();
    const instructor = useInstructor();
    const courseCreatorContext = useOptionalCourseCreator();
    const courseCreatorProfile = courseCreatorContext?.profile;

    const authorName = courseCreatorProfile?.full_name ?? instructor?.full_name ?? '';
    const authorUuid = courseCreatorProfile?.uuid ?? instructor?.uuid ?? '';
    const { setActiveStep } = useStepper();
    const { difficultyLevels, isLoading: difficultyIsLoading } = useDifficultyLevels();

    // states
    const [categoryInput, setCategoryInput] = useState('');

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

        toast.success(data?.message || 'Category added successfully');
        dialogCloseRef.current?.click();
        queryClient.invalidateQueries({
          queryKey: getAllCategoriesQueryKey({ query: { pageable: {} } }),
        });
        setCategoryInput('');
      },
    });

    const { mutate: createCourse, isPending: createCourseIsPending } =
      useMutation(createCourseMutation());

    const { mutate: updateCourseMutation, isPending: updateCourseIsPending } = useMutation({
      mutationFn: ({ body, uuid }: { body: any; uuid: string }) =>
        updateCourse({ body, path: { uuid: uuid } }),
    });

    // GET COURSE CATEGORIES
    const { data: categories } = useQuery(
      getAllCategoriesOptions({
        query: { pageable: { page: 0, size: 100 } },
      })
    );

    const onSubmit = (data: CourseCreationFormValues) => {
      const resolvedCourseCreatorUuid = authorUuid;

      if (!resolvedCourseCreatorUuid) {
        toast.error('Course creator profile is missing.');
        return;
      }

      const totalShare =
        Number(data?.creator_share_percentage || 0) +
        Number(data?.instructor_share_percentage || 0);

      if (Math.abs(totalShare - 100) > 0.01) {
        toast.error('Creator and instructor shares must add up to 100%.');
        return;
      }

      const trainingRequirementsPayload =
        data?.training_requirements?.map(req => ({
          uuid: req.uuid,
          requirement_type: req.requirement_type,
          name: req.name,
          description: req.description || undefined,
          quantity:
            typeof req.quantity === 'number' && !Number.isNaN(req.quantity)
              ? req.quantity
              : undefined,
          unit: req.unit || undefined,
          provided_by: req.provided_by,
          is_mandatory: !!req.is_mandatory,
          course_uuid: editingCourseId ?? '',
        })) ?? [];

      if (editingCourseId) {
        const editBody = {
          total_duration_display: '',
          created_by: authorName,
          updated_by: authorName,
          course_creator_uuid: resolvedCourseCreatorUuid,
          name: data?.name,
          description: data?.description,
          objectives: data?.objectives,
          thumbnail_url: data?.thumbnail_url,
          banner_url: data?.banner_url,
          intro_video_url: data?.intro_video_url,
          category_uuids: data?.categories,
          difficulty_uuid: data?.difficulty,
          prerequisites: data?.prerequisites,
          duration_hours: data?.duration_hours,
          duration_minutes: data?.duration_minutes,
          class_limit: data?.class_limit,
          minimum_training_fee: data?.minimum_training_fee,
          creator_share_percentage: data?.creator_share_percentage,
          instructor_share_percentage: data?.instructor_share_percentage,
          revenue_share_notes: data?.revenue_share_notes,
          training_requirements: trainingRequirementsPayload,
          status: 'draft',
          active: false,
          is_free: data?.is_free,
          is_published: false,
          is_draft: true,
          age_lower_limit: data?.age_lower_limit,
          age_upper_limit: data?.age_upper_limit,
        };

        updateCourseMutation(
          { body: editBody as any, uuid: editingCourseId },
          {
            onSuccess(data, variables, context) {
              const respObj = data?.data;
              const errorObj = data?.error;

              if (respObj) {
                toast.success(data?.data?.message);
                // if (typeof successResponse === "function") {
                //   // @ts-ignore
                //   successResponse(data?.data)
                // }

                setActiveStep(1);
                queryClient.invalidateQueries({
                  queryKey: getCourseByUuidQueryKey({ path: { uuid: courseId as string } }),
                });
                return;
              }

              if (errorObj && typeof errorObj === 'object') {
                Object.values(errorObj).forEach(errorMsg => {
                  if (typeof errorMsg === 'string') {
                    toast.error(errorMsg);
                  }
                });
                return;
                // @ts-ignore
              } else if (data?.message) {
                // @ts-ignore
                toast.error(data.message);
                return;
              } else {
                toast.error('An unknown error occurred.');
                return;
              }
            },
          }
        );
      }

      if (!editingCourseId) {
        createCourse(
          {
            body: {
              total_duration_display: '',
              updated_by: authorName,
              created_by: authorName,
              course_creator_uuid: resolvedCourseCreatorUuid,
              name: data?.name,
              description: data?.description,
              objectives: data?.objectives,
              category_uuids: data?.categories,
              difficulty_uuid: data?.difficulty,
              prerequisites: data?.prerequisites,
              duration_hours: 0,
              duration_minutes: 0,
              class_limit: data?.class_limit,
              minimum_training_fee: data?.minimum_training_fee,
              creator_share_percentage: data?.creator_share_percentage,
              instructor_share_percentage: data?.instructor_share_percentage,
              revenue_share_notes: data?.revenue_share_notes,
              training_requirements: trainingRequirementsPayload,
              thumbnail_url: '',
              banner_url: '',
              intro_video_url: '',
              status: 'draft',
              active: false,
              is_free: data?.is_free,
              is_published: false,
              is_draft: true,
              age_lower_limit: data?.age_lower_limit,
              age_upper_limit: data?.age_upper_limit,
            },
          },
          {
            onError(error, variables, context) {
              toast.error(error?.message);
            },
            onSuccess: data => {
              toast.success('Course created successfully');
              setActiveStep(1);
              queryClient.invalidateQueries({
                queryKey: getCourseByUuidQueryKey({ path: { uuid: courseId as string } }),
              });

              if (typeof successResponse === 'function') {
                // @ts-ignore
                successResponse(data?.data);
              }
            },
          }
        );
      }
    };

    useImperativeHandle(ref, () => ({
      submit: () => form.handleSubmit(onSubmit)(),
    }));

    const isFree = form.watch('is_free');

    useEffect(() => {
      if (isFree) {
        form.setValue('price', 0);
        form.setValue('sale_price', 0);
        form.setValue('minimum_training_fee', 0);
      }
    }, [isFree, form]);

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-8 rounded-[32px] border border-blue-200/40 bg-gradient-to-br from-white via-blue-50 to-blue-100/60 p-6 shadow-xl shadow-blue-200/40 transition lg:p-10 dark:border-blue-500/25 dark:from-blue-950/60 dark:via-blue-900/40 dark:to-slate-950/80 dark:shadow-blue-900/20'
        >
          {/* Course Name */}
          <FormSection
            title='Course Name'
            description='This will be the name of your course, visible to students and instructors.'
          >
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
          </FormSection>

          {/* Course Description */}
          <FormSection
            title='Course Description'
            description='A brief description of what this course covers'
          >
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
          </FormSection>

          {/* Learning Objectives */}
          <FormSection
            title='Learning Objectives'
            description='List what students will learn from your course'
          >
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
          </FormSection>

          {/* Prerequisites */}
          <FormSection
            title='Course Prerequisites'
            description='Outline the knowledge or skills students should have before starting this course.'
          >
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
          </FormSection>

          {/* Pricing */}
          <FormSection title='Course Pricing' description='Set the pricing details for your course'>
            <div className='w-full space-y-4'>
              <FormField
                control={form.control}
                name='is_free'
                render={({ field }) => (
                  <FormItem className='hidden flex-row items-start space-x-3'>
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

              {/* Full width form fields */}
              <div className='w-full space-y-4'>
                <FormField
                  control={form.control}
                  name='currency'
                  render={({ field }) => (
                    <FormItem className='w-full'>
                      <FormLabel>Currency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isFree}
                      >
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Select currency' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(CURRENCIES).map(currency => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            title='Monetization Controls'
            description='Configure minimum training fee expectations and the revenue split inherited by every instructor.'
          >
            <div className='flex flex-col gap-4'>
              <FormField
                control={form.control}
                name='minimum_training_fee'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Training Fee</FormLabel>
                    <FormControl>
                      <Input type='number' min='0' step='0.01' {...field} />
                    </FormControl>
                    <FormDescription>
                      Instructor-led classes must charge at least this amount.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='creator_share_percentage'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Creator Share (%)</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' max='100' step='1' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='instructor_share_percentage'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructor Share (%)</FormLabel>
                      <FormControl>
                        <Input type='number' min='0' max='100' step='1' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name='revenue_share_notes'
              render={({ field }) => (
                <FormItem className='mt-4'>
                  <FormLabel>Revenue Share Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder='Add extra context for instructors about this revenue policy.'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          <FormSection
            title='Training Requirements'
            description='List the resources or facilities that must be available before this course can be delivered.'
          >
            <div className='space-y-4'>
              {trainingRequirementFields.map((field, index) => (
                <div key={field.id} className='space-y-4 rounded-lg border p-4'>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name={`training_requirements.${index}.name` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requirement Name</FormLabel>
                          <FormControl>
                            <Input placeholder='e.g., 3D printers, VR headsets' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`training_requirements.${index}.requirement_type` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select type' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {requirementTypes.map(type => (
                                <SelectItem key={type} value={type}>
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name={`training_requirements.${index}.quantity` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input type='number' min='0' step='1' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`training_requirements.${index}.unit` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <FormControl>
                            <Input placeholder='e.g., sets, seats' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name={`training_requirements.${index}.provided_by` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provided By</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select owner' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {providedByOptions.map(option => {
                                const label = option
                                  .split('_')
                                  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                                  .join(' ');
                                return (
                                  <SelectItem key={option} value={option}>
                                    {label}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`training_requirements.${index}.is_mandatory` as const}
                      render={({ field }) => (
                        <FormItem className='flex flex-row items-start space-y-0 space-x-3 rounded-md border p-3'>
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className='space-y-1 leading-none'>
                            <FormLabel>Mandatory requirement</FormLabel>
                            <FormDescription>Mark as required before scheduling.</FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`training_requirements.${index}.description` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={2}
                            placeholder='Provide any supporting detail'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='flex justify-end'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => removeTrainingRequirement(index)}
                    >
                      Remove requirement
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type='button'
                variant='outline'
                onClick={() =>
                  appendTrainingRequirement({
                    requirement_type: 'material',
                    name: '',
                    description: '',
                    quantity: undefined,
                    unit: '',
                    provided_by: 'course_creator',
                    is_mandatory: false,
                  })
                }
              >
                Add training requirement
              </Button>
            </div>
          </FormSection>

          {/* Categories */}
          <FormSection
            title='Course Categories'
            description='Add relevant categories for your course'
          >
            <FormItem>
              <div className='mb-4 flex items-center gap-2'>
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
          </FormSection>

          {/* Difficulty Level */}
          <FormSection
            title='Difficulty Level'
            description='Set the difficulty level of your course'
          >
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
                        <Spinner />
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
          </FormSection>

          {showSubmitButton && (
            <div className='xxs:flex-col flex flex-col justify-center gap-4 pt-6 sm:flex-row sm:justify-end'>
              <Button type='submit' className='min-w-32'>
                {createCourseIsPending || updateCourseIsPending ? <Spinner /> : 'Save Course'}
              </Button>
              <Button
                disabled={!editingCourseId}
                onClick={() => setActiveStep(1)}
                className='min-w-32'
              >
                {'Continue →'}
              </Button>
            </div>
          )}
        </form>
      </Form>
    );
  }
);

export default CourseCreationForm;
