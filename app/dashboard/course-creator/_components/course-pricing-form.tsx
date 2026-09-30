'use client';

import { WatchedValue } from '@/components/form/watched-value';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { useOptionalCourseCreator } from '@/context/course-creator-context';
import { useInstructor } from '@/context/instructor-context';
import { updateCourse } from '@/services/client';
import {
  getAllCategoriesOptions,
  getCourseByUuidOptions,
  getCourseByUuidQueryKey,
  publishCourseMutation,
  publishCourseQueryKey,
  searchCoursesQueryKey,
  unpublishCourseMutation,
  unpublishCourseQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { invalidateContentModerationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeDollarSign, BookCheck, Undo2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { type Control, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';
import { type CourseCreationFormValues, CURRENCIES } from './course-creation-types';

type MutationPayload = Record<string, unknown>;
type CategoryPayload = { name: string };
type CourseMutationResult = {
  data?: { message?: string };
  error?: Record<string, unknown>;
  message?: string;
};

const getFormErrorMessage = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.find(item => typeof item === 'string');
  return undefined;
};

const getErrorMessage = (error: unknown) =>
  typeof error === 'object' && error !== null && 'message' in error
    ? String(error.message)
    : undefined;

export type CourseFormProps = {
  showSubmitButton?: boolean;
  initialValues?: Partial<CourseCreationFormValues>;
  editingCourseId?: string;
  courseId?: string;
  successResponse?: (data: unknown) => void;
  onValuesChange?: () => void;
};

export type CourseFormRef = {
  submit: () => Promise<boolean>;
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

const currencyLabel = (currency: unknown) =>
  currency === 'KES' ? 'KSh' : String(currency || 'KSh');

function PricingSummary({ control }: { control: Control<coursePricingFormValues> }) {
  const [fee, instructorShare, creatorShare, currency] = useWatch({
    control,
    name: [
      'minimum_training_fee',
      'instructor_share_percentage',
      'creator_share_percentage',
      'currency',
    ],
  });
  const minimumFee = Number(fee) || 0;
  const formatAmount = (amount: number) =>
    `${currencyLabel(currency)} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  return (
    <div
      className='border-border bg-muted/30 grid gap-3 rounded-md border p-4 sm:grid-cols-3'
      aria-live='polite'
      aria-atomic='true'
    >
      <div>
        <p className='text-muted-foreground text-xs'>Minimum fee</p>
        <p className='text-foreground font-semibold'>{formatAmount(minimumFee)}</p>
      </div>
      <div>
        <p className='text-muted-foreground text-xs'>Instructor receives</p>
        <p className='text-foreground font-semibold'>
          {formatAmount((minimumFee * (Number(instructorShare) || 0)) / 100)}
        </p>
      </div>
      <div>
        <p className='text-muted-foreground text-xs'>Course creator receives</p>
        <p className='text-foreground font-semibold'>
          {formatAmount((minimumFee * (Number(creatorShare) || 0)) / 100)}
        </p>
      </div>
    </div>
  );
}

export const CoursePricingForm = forwardRef<CourseFormRef, CourseFormProps>(
  function CoursePricingForm(
    { showSubmitButton, initialValues, editingCourseId, courseId, successResponse, onValuesChange },
    ref
  ) {
    const dialogCloseRef = useRef<HTMLButtonElement>(null);
    const router = useRouter();
    const targetCourseId = courseId ?? editingCourseId;

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
          ...form.getValues(), // preserve unsaved edits (optional)
          ...initialValues, // overwrite with fetched data
        });
      }
    }, [initialValues, form]);

    const queryClient = useQueryClient();
    const instructor = useInstructor();
    const courseCreatorContext = useOptionalCourseCreator();
    const courseCreatorProfile = courseCreatorContext?.profile;

    const authorUuid = courseCreatorProfile?.uuid ?? instructor?.uuid ?? '';

    const { mutate: updateCourseMutation, isPending: updateCourseIsPending } = useMutation({
      mutationFn: ({ body, uuid }: { body: MutationPayload; uuid: string }) =>
        updateCourse({ body: body as never, path: { uuid: uuid } }),
    });

    const { data: courseData } = useQuery({
      ...getCourseByUuidOptions({ path: { uuid: targetCourseId as string } }),
      enabled: !!targetCourseId,
    });

    const PublishCourse = useMutation(publishCourseMutation());
    const UnpublishCourse = useMutation(unpublishCourseMutation());

    const handlePublishCourse = async () => {
      if (!targetCourseId) return;

      try {
        await PublishCourse.mutateAsync(
          { path: { uuid: targetCourseId } },
          {
            async onSuccess(data) {
              toast.success(data?.message || 'Course published successfully');
              queryClient.invalidateQueries({
                queryKey: publishCourseQueryKey({ path: { uuid: targetCourseId } }),
              });
              queryClient.invalidateQueries({
                queryKey: getCourseByUuidQueryKey({ path: { uuid: targetCourseId } }),
              });
              queryClient.invalidateQueries({
                queryKey: searchCoursesQueryKey({
                  query: {
                    searchParams: { course_creator_uuid_eq: authorUuid },
                    pageable: {},
                  },
                }),
              });
              await invalidateContentModerationWorkflowQueries(queryClient);
              router.push('/dashboard/course-creator/course-management');
            },
            onError: error => {
              toast.error(getErrorMessage(error) || 'Failed to publish course');
            },
          }
        );
      } catch {
        // handled by mutation error callback
      }
    };

    const handleUnpublishCourse = async () => {
      if (!targetCourseId) return;

      try {
        await UnpublishCourse.mutateAsync(
          { path: { uuid: targetCourseId } },
          {
            async onSuccess(data) {
              toast.success(data?.message || 'Course unpublished successfully');
              queryClient.invalidateQueries({
                queryKey: unpublishCourseQueryKey({ path: { uuid: targetCourseId } }),
              });
              queryClient.invalidateQueries({
                queryKey: publishCourseQueryKey({ path: { uuid: targetCourseId } }),
              });
              queryClient.invalidateQueries({
                queryKey: getCourseByUuidQueryKey({ path: { uuid: targetCourseId } }),
              });
              queryClient.invalidateQueries({
                queryKey: searchCoursesQueryKey({
                  query: {
                    searchParams: { course_creator_uuid_eq: authorUuid },
                    pageable: {},
                  },
                }),
              });
              await invalidateContentModerationWorkflowQueries(queryClient);
            },
            onError: error => {
              toast.error(getErrorMessage(error) || 'Failed to unpublish course');
            },
          }
        );
      } catch {
        // handled by mutation error callback
      }
    };

    // GET COURSE CATEGORIES
    const { data: categories } = useQuery(
      getAllCategoriesOptions({
        query: { pageable: { page: 0, size: 100 } },
      })
    );

    const instructorShare =
      useWatch({ control: form.control, name: 'instructor_share_percentage' }) ?? [];

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

    const onSubmit = (data: coursePricingFormValues) => {
      const resolvedCourseCreatorUuid = authorUuid;

      if (!resolvedCourseCreatorUuid) {
        toast.error('Course creator profile is missing.');
        return Promise.resolve(false);
      }

      const totalShare =
        Number(data?.creator_share_percentage || 0) +
        Number(data?.instructor_share_percentage || 0);

      if (Math.abs(totalShare - 100) > 0.01) {
        toast.error('Creator and instructor shares must add up to 100%.');
        return Promise.resolve(false);
      }
      if (editingCourseId) {
        return new Promise<boolean>(resolve => {
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
            { body: editBody as MutationPayload, uuid: editingCourseId },
            {
              async onSuccess(result) {
                if (result.error || result.data?.error || result.data?.success === false) {
                  toast.error(
                    getErrorMessage(result.error) || result.data?.message || 'Failed to save pricing.'
                  );
                  resolve(false);
                  return;
                }
                if (!result.data) {
                  toast.error('Failed to save pricing.');
                  resolve(false);
                  return;
                }

                toast.success(result.data.message || 'Course updated successfully');
                await queryClient.invalidateQueries({
                  queryKey: getCourseByUuidQueryKey({ path: { uuid: editingCourseId } }),
                });
                resolve(true);
              },
              onError() {
                resolve(false);
              },
            }
          );
        });
      }

      return Promise.resolve(false);
    };

    const onError = () => {
      toast.error('Please review the pricing fields and try again.');
    };

    useImperativeHandle(ref, () => ({
      submit: async () => {
        let saved = false;
        await form.handleSubmit(async values => {
          saved = await onSubmit(values);
        }, onError)();
        return saved;
      },
    }));

    const isFree = useWatch({ control: form.control, name: 'is_free' }) ?? [];
    const isPublished =
      courseData?.data?.is_published === true || courseData?.data?.status === 'published';
    const isCourseActionPending = PublishCourse.isPending || UnpublishCourse.isPending;

    useEffect(() => {
      if (isFree) {
        form.setValue('minimum_training_fee', 0);
      }
    }, [isFree, form]);

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onError)}
          onChange={onValuesChange}
          className='bg-card space-y-6 rounded-[32px] transition'
        >
          <section className='space-y-6'>
            <CardHeader>
              <div className='flex items-center gap-2'>
                <BadgeDollarSign className='text-primary h-4 w-4' />
                <CardTitle className='text-base'>Course pricing</CardTitle>
              </div>
              <CardDescription>
                Set the minimum learner fee and how course income is shared.
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-6'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='minimum_training_fee'
                  render={({ field }) => (
                    <FormItem className='grid max-w-sm content-start gap-1.5 space-y-0'>
                      <FormLabel>Minimum fee per student per hour</FormLabel>
                      <div className='flex items-center gap-2'>
                        <span className='text-muted-foreground text-sm font-medium'>
                          <WatchedValue control={form.control} name='currency'>
                            {currencyLabel}
                          </WatchedValue>
                        </span>
                        <FormControl>
                          <Input type='number' min={0} step='0.01' placeholder='0' {...field} />
                        </FormControl>
                      </div>
                      <FormDescription className='text-xs'>
                        This is the lowest fee that can be charged to one learner for one teaching
                        hour.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='grid max-w-sm content-start gap-4'>
                  <FormField
                    control={form.control}
                    name='currency'
                    render={({ field }) => (
                      <FormItem className='grid gap-1.5 space-y-0'>
                        <FormLabel>Currency</FormLabel>
                        <Select
                          onValueChange={value => {
                            field.onChange(value);
                            onValuesChange?.();
                          }}
                          value={field.value}
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


                  {/* <FormField
                    control={form.control}
                    name='is_free'
                    render={({ field }) => (
                      <FormItem className='flex flex-row items-start space-x-3 opacity-50'>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled
                          />
                        </FormControl>
                        <div className='space-y-1 leading-none'>
                          <FormLabel>Free Course</FormLabel>
                          <FormDescription className='text-xs'>
                            Make this course available for free
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  /> */}
                </div>
              </div>

              <div className='border-border grid gap-4 border-t pt-5'>
                <div>
                  <h3 className='text-foreground text-sm font-semibold'>Revenue split</h3>
                  <p className='text-muted-foreground text-xs'>
                    The course creator share adjusts automatically so the total always equals 100%.
                  </p>
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='instructor_share_percentage'
                    render={({ field }) => (
                      <FormItem className='grid gap-1.5 space-y-0'>
                        <FormLabel>Instructor share</FormLabel>
                        <div className='flex items-center gap-2'>
                          <FormControl>
                            <Input
                              {...field}
                              type='number'
                              min={0}
                              max={100}
                              step={1}
                              value={field.value ?? 0}
                              onChange={event => {
                                const value = Math.min(
                                  100,
                                  Math.max(0, Number(event.target.value) || 0)
                                );
                                field.onChange(value);
                                form.setValue('creator_share_percentage', 100 - value, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                              }}
                            />
                          </FormControl>
                          <span className='text-muted-foreground text-sm'>%</span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='creator_share_percentage'
                    render={({ field }) => (
                      <FormItem className='grid gap-1.5 space-y-0'>
                        <FormLabel>Course creator share</FormLabel>
                        <div className='flex items-center gap-2'>
                          <FormControl>
                            <Input
                              {...field}
                              type='number'
                              value={field.value ?? 0}
                              readOnly
                              aria-readonly='true'
                              className='bg-muted/50'
                            />
                          </FormControl>
                          <span className='text-muted-foreground text-sm'>%</span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <PricingSummary control={form.control} />
                <FormField
                  control={form.control}
                  name='revenue_share_notes'
                  render={({ field }) => (
                    <FormItem>
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
              </div>
            </CardContent>
          </section>

          {/* Coupon codes */}
          {/* <FormSection
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
          </FormSection> */}

          {/* Access duration */}
          {/* <FormSection
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
          </FormSection> */}

          {/* Organizational access */}
          {/* <FormSection
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
          </FormSection> */}

          {/* {isPublished ? (
            <Button
              variant='outline'
              onClick={handleUnpublishCourse}
              disabled={!courseId || isCourseActionPending}
              className='px-6'
            >
              {UnpublishCourse.isPending ? <Spinner /> : <Undo2 />}
              Unpublish
            </Button>
          ) : (
            <Button
              variant='ghost'
              onClick={handlePublishCourse}
              disabled={!courseId || isCourseActionPending}
              className='border-muted-foreground/50 border px-12'
            >
              {PublishCourse.isPending ? <Spinner /> : <BookCheck />}
              Publish
            </Button>
          )} */}

          {showSubmitButton && (
            <div className='xxs:flex-col flex flex-col justify-center gap-4 pt-6 sm:flex-row sm:justify-end'>
              {isPublished ? (
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleUnpublishCourse}
                  disabled={!targetCourseId || isCourseActionPending}
                  className='px-6'
                >
                  {UnpublishCourse.isPending ? <Spinner /> : <Undo2 />}
                  Unpublish
                </Button>
              ) : (
                <Button
                  type='button'
                  variant='ghost'
                  onClick={handlePublishCourse}
                  disabled={!targetCourseId || isCourseActionPending}
                  className='border-muted-foreground/50 border px-12'
                >
                  {PublishCourse.isPending ? <Spinner /> : <BookCheck />}
                  Publish
                </Button>
              )}

              <Button type='submit' className='min-w-32'>
                {updateCourseIsPending ? <Spinner /> : 'Save Course'}
              </Button>
            </div>
          )}
        </form>
      </Form>
    );
  }
);

export default CoursePricingForm;
