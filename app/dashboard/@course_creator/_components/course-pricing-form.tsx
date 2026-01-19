'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useDifficultyLevels } from '../../../../hooks/use-difficultyLevels';
import { FormSection } from './course-creation-form';
import {
  type CourseCreationFormValues,
  courseCreationSchema,
  CURRENCIES,
} from './course-creation-types';

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

export const CoursePricingForm = forwardRef<CourseFormRef, CourseFormProps>(
  function CoursePricingForm(
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
        minimum_training_fee: 0,
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

    const creatorShare = form.watch('creator_share_percentage');
    const instructorShare = form.watch('instructor_share_percentage');

    useEffect(() => {
      if (typeof instructorShare === 'number' && instructorShare >= 0 && instructorShare <= 100) {
        const calculated = 100 - instructorShare;

        if (form.getValues('creator_share_percentage') !== calculated) {
          form.setValue('creator_share_percentage', calculated, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      }
    }, [instructorShare, form]);

    useEffect(() => {
      if (typeof creatorShare === 'number' && creatorShare >= 0 && creatorShare <= 100) {
        const calculated = 100 - creatorShare;

        if (form.getValues('instructor_share_percentage') !== calculated) {
          form.setValue('instructor_share_percentage', calculated, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      }
    }, [creatorShare, form]);

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
            onSuccess(data, _variables, _context) {
              const respObj = data?.data;
              const errorObj = data?.error;

              if (respObj) {
                toast.success(data?.data?.message);
                // if (typeof successResponse === "function") {
                //   // @ts-expect-error
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
                // @ts-expect-error
              } else if (data?.message) {
                // @ts-expect-error
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
            onError(error, _variables, _context) {
              toast.error(error?.message);
            },
            onSuccess: data => {
              toast.success('Course created successfully');
              setActiveStep(1);
              queryClient.invalidateQueries({
                queryKey: getCourseByUuidQueryKey({ path: { uuid: courseId as string } }),
              });

              if (typeof successResponse === 'function') {
                // @ts-expect-error
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
        // form.setValue('minimum_training_fee', 0);
      }
    }, [isFree, form]);

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='bg-card space-y-6 rounded-[32px] transition'
        >
          {/* Pricing */}
          <FormSection title='Course Pricing' description='Set the pricing details for your course'>
            <div className='w-full space-y-4'>
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
                    <FormLabel>Minimum Training Fee (per hour per head)</FormLabel>
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
                        <Input
                          type='number'
                          min={0}
                          max={100}
                          step={1}
                          value={field.value ?? 0}
                          onChange={e => {
                            const value = Math.min(100, Math.max(0, Number(e.target.value)));

                            field.onChange(value);
                            form.setValue('instructor_share_percentage', 100 - value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                        />
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
                        <Input
                          type='number'
                          min={0}
                          max={100}
                          step={1}
                          value={field.value ?? 0}
                          onChange={e => {
                            const value = Math.min(100, Math.max(0, Number(e.target.value)));

                            field.onChange(value);
                            form.setValue('creator_share_percentage', 100 - value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                        />
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

          {/* Coupon codes */}
          <FormSection
            title='Coupon Code'
            description='Enter a coupon code to apply a discount to your order.'
          >
            <FormField
              control={form.control}
              name='coupon_code'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder='Enter coupon code' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          {/* Access duration */}
          <FormSection
            title='Access Duration'
            description='Specify how long the user will have access to the product or content.'
          >
            <FormField
              control={form.control}
              name='access_duration'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder='e.g., 30 days, 6 months, lifetime access' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormSection>

          {/* Organizational access */}
          <FormSection
            title='Organizational Access'
            description='Select the organizations or groups that this access applies to.'
          >
            <div className='space-y-4'>
              <FormField
                control={form.control}
                name='org_access.educational'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-x-3'>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>Educational Institutions</FormLabel>
                      <FormDescription>
                        Universities, colleges, schools, and training centers
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='org_access.corporate'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-x-3'>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>Corporate Teams</FormLabel>
                      <FormDescription>
                        Companies and internal employee training programs
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='org_access.non_profit'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-x-3'>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>Non-Profit Organizations</FormLabel>
                      <FormDescription>
                        NGOs, charities, and community organizations
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='org_access.individual'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-x-3'>
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>Individual Users</FormLabel>
                      <FormDescription>Available for personal or self-paced use</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
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

export default CoursePricingForm;
