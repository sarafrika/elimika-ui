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
  getCourseByUuidQueryKey
} from '@/services/client/@tanstack/react-query.gen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import { useDifficultyLevels } from '../../../../hooks/use-difficultyLevels';
import { FormSection } from './course-creation-form';
import {
  type CourseCreationFormValues,
  CURRENCIES
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

export const coursePricingSchema = z.object({
  is_free: z.boolean().default(false),
  currency: z.string().optional(),
  minimum_training_fee: z.coerce.number().min(0, 'Minimum training fee must be zero or greater'),
  creator_share_percentage: z.coerce
    .number()
    .min(0, 'Creator share must be at least 0%')
    .max(100, 'Creator share cannot exceed 100%'),
  instructor_share_percentage: z.coerce
    .number()
    .min(0, 'Instructor share must be at least 0%')
    .max(100, 'Instructor share cannot exceed 100%'),
  revenue_share_notes: z.string().max(500).optional(),
  coupon_code: z.string().optional(),
  access_duration: z.string().optional(),
  org_access: z
    .object({
      educational: z.boolean().optional(),
      corporate: z.boolean().optional(),
      non_profit: z.boolean().optional(),
      individual: z.boolean().optional(),
    })
    .optional(),
});

type coursePricingFormValues = z.infer<typeof coursePricingSchema>;

export const CoursePricingForm = forwardRef<CourseFormRef, CourseFormProps>(
  function CoursePricingForm(
    { showSubmitButton, initialValues, editingCourseId, courseId, successResponse },
    ref
  ) {
    const dialogCloseRef = useRef<HTMLButtonElement>(null);

    const form = useForm<coursePricingFormValues>({
      resolver: zodResolver(coursePricingSchema),
      defaultValues: {
        is_free: false,
        currency: 'KES',
        minimum_training_fee: 0,
        creator_share_percentage: 50,
        instructor_share_percentage: 50,
        revenue_share_notes: '',
        coupon_code: '',
        access_duration: '',
        org_access: {
          educational: false,
          corporate: false,
          non_profit: false,
          individual: true,
        },
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

    const onSubmit = (data: coursePricingFormValues) => {
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
      if (editingCourseId) {
        const editBody = {
          course_creator_uuid: authorUuid,
          status: 'draft',
          ...initialValues,
          is_free: data?.is_free,
          currency: data?.currency,
          minimum_training_fee: data?.minimum_training_fee,
          creator_share_percentage: data?.creator_share_percentage,
          instructor_share_percentage: data?.instructor_share_percentage,
          revenue_share_notes: data?.revenue_share_notes,
          coupon_code: data?.coupon_code,
          access_duration: data?.access_duration,
          org_access: {
            educational: data?.org_access?.educational,
            corporate: data?.org_access?.corporate,
            non_profit: data?.org_access?.non_profit,
            individual: data?.org_access?.individual,
          },
        };


        updateCourseMutation(
          { body: editBody as any, uuid: editingCourseId },
          {
            onSuccess(data, _variables, _context) {
              const respObj = data?.data;
              const errorObj = data?.error;

              if (respObj) {
                toast.success(data?.data?.message || "Course updated successfully");
                // if (typeof successResponse === "function") {
                //   // @ts-expect-error
                //   successResponse(data?.data)
                // }

                setActiveStep(6);
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
    };

    const onError = (error: any) => {
      toast.error(error)
    }

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
          onSubmit={form.handleSubmit(onSubmit, onError)}
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
            </div>
          )}
        </form>
      </Form>
    );
  }
);

export default CoursePricingForm;
