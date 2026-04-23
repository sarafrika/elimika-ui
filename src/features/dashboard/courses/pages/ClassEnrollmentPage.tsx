'use client';

import { ClassScheduleCalendar } from '@/app/class-invite/page';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import useBundledClassInfo from '@/hooks/use-course-classes';
import { useScheduleStats } from '@/hooks/use-schedule-stats';
import {
  addItemMutation,
  createCartMutation,
  enrollStudentMutation,
  getCartQueryKey,
  getClassEnrollmentsForStudentQueryKey,
  getEnrollmentsForClassOptions,
  getEnrollmentsForClassQueryKey,
  getStudentScheduleQueryKey,
  joinWaitlistMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useCartStore } from '@/store/cart-store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertCircle, Armchair, ArrowLeft, Calendar, DollarSign, MapPin, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUserProfile } from '../../../profile/context/profile-context';
import { EnrollmentLoadingState } from '../components/EnrollmentLoadingState';
import { type BundledClass, getErrorMessage } from '../types';

const STUDENT_SCHEDULE_START = new Date('2024-10-10');
const STUDENT_SCHEDULE_END = new Date('2030-10-10');
const ACTIVE_ENROLLMENT_STATUSES = new Set(['ENROLLED', 'ATTENDED', 'ABSENT']);

export default function ClassEnrollmentPage({
  courseId,
  classId,
}: {
  courseId: string;
  classId: string;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const { activeDomain } = useUserDomain();
  const user = useUserProfile()
  const student = user?.student

  const [enrollmentError, setEnrollmentError] = useState(false);

  const { replaceBreadcrumbs } = useBreadcrumb();

  // Fetch class information
  const { classes = [], loading } = useBundledClassInfo(courseId, undefined, undefined, student);

  const { data: classEnrollmentsResponse } = useQuery({
    ...getEnrollmentsForClassOptions({ path: { uuid: classId } }),
    enabled: Boolean(classId),
  });

  // Find the specific class
  const enrollingClass = useMemo(() => {
    return classes.find(cls => cls.uuid === classId);
  }, [classes, classId]);
  const schedule = enrollingClass?.schedule ?? [];
  const calendarSchedule = schedule.flatMap(item => {
    if (
      !item.uuid ||
      !item.class_definition_uuid ||
      !item.start_time ||
      !item.end_time ||
      !item.timezone ||
      !item.title ||
      !item.status
    ) {
      return [];
    }

    return [
      {
        uuid: item.uuid,
        class_definition_uuid: item.class_definition_uuid,
        instructor_uuid: String(item.instructor_uuid ?? enrollingClass?.instructor?.uuid ?? ''),
        start_time: item.start_time,
        end_time: item.end_time,
        timezone: item.timezone,
        title: item.title,
        location_type: item.location_type === 'ONLINE' ? 'ONLINE' : 'PHYSICAL',
        location_name: item.location_name ?? undefined,
        status: item.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED',
        duration_minutes: Number(item.duration_minutes ?? 0),
        duration_formatted: item.duration_formatted ?? '',
        time_range: item.time_range ?? '',
        is_currently_active: item.is_currently_active ?? false,
        can_be_cancelled: item.can_be_cancelled ?? false,
      },
    ];
  }) as unknown as Parameters<typeof ClassScheduleCalendar>[0]['schedules'];

  const totalMinutes = enrollingClass?.schedule?.reduce((sum, item) => {
    const minutes = Number(item?.duration_minutes);
    return sum + (Number.isFinite(minutes) ? minutes : 0);
  }, 0);
  const totalHours = (totalMinutes ?? 0) / 60;
  const totalHoursRounded = `${Math.round(totalHours)}`;

  const scheduleStats = useScheduleStats(
    schedule.map(item => ({
      duration_minutes: Number(item.duration_minutes ?? 0),
    }))
  );
  const enrolledCount = useMemo(
    () =>
      Array.from(
        new Set(
          (classEnrollmentsResponse?.data ?? [])
            .filter(enrollment =>
              ACTIVE_ENROLLMENT_STATUSES.has(String(enrollment.status ?? 'ENROLLED').toUpperCase())
            )
            .map(enrollment => enrollment.student_uuid)
            .filter(Boolean)
        )
      ).length,
    [classEnrollmentsResponse?.data]
  );

  const maxParticipants = enrollingClass?.max_participants ?? 0;
  const isClassFull = maxParticipants > 0 && enrolledCount >= maxParticipants;


  // Format dates
  const { formattedStart, formattedEnd } = useMemo(() => {
    if (!enrollingClass) {
      return { formattedStart: '', formattedEnd: '' };
    }

    try {
      const start = enrollingClass?.default_start_time
        ? new Date(enrollingClass.default_start_time)
        : null;
      const end = enrollingClass?.default_end_time
        ? new Date(enrollingClass.default_end_time)
        : null;

      return {
        formattedStart: start ? format(start, 'MMM dd, yyyy • hh:mm a') : 'N/A',
        formattedEnd: end ? format(end, 'MMM dd, yyyy • hh:mm a') : 'N/A',
      };
    } catch (e) {
      return { formattedStart: 'N/A', formattedEnd: 'N/A' };
    }
  }, [enrollingClass]);

  // Update breadcrumbs
  useEffect(() => {
    if (courseId && classId) {
      replaceBreadcrumbs([
        {
          id: 'dashboard',
          title: 'Dashboard',
          url: buildWorkspaceAliasPath(activeDomain, '/dashboard/overview'),
        },
        {
          id: 'courses',
          title: 'Browse Courses',
          url: buildWorkspaceAliasPath(activeDomain, '/dashboard/courses'),
        },
        {
          id: 'course-details',
          title: 'Available Classes',
          url: buildWorkspaceAliasPath(
            activeDomain,
            `/dashboard/courses/available-classes/${courseId}`
          ),
        },
        {
          id: 'enroll',
          title: 'Enroll',
          url: buildWorkspaceAliasPath(
            activeDomain,
            `/dashboard/courses/available-classes/${courseId}/enroll?id=${classId}`
          ),
        },
      ]);
    }
  }, [replaceBreadcrumbs, courseId, classId, activeDomain]);

  const { cartId: savedCartId, setCartId } = useCartStore();
  const createCart = useMutation(createCartMutation());
  const addItemToCart = useMutation(addItemMutation());

  const handleCreateCartAndPay = (cls: BundledClass | undefined) => {
    if (!cls) return;
    const catalogue = cls.catalogue;

    if (!catalogue?.variant_code) {
      toast.error('No catalogue found for this class');
      return;
    }

    if (!savedCartId) {
      createCart.mutate(
        {
          body: {
            currency_code: 'KES',
            region_code: 'KE',
            items: [
              {
                variant_id: catalogue.variant_code,
                quantity: 1,
              },
            ],
          },
        },
        {
          onSuccess: data => {
            const cartId = data?.id || null;
            if (cartId) {
              setCartId(cartId);
            }

            qc.invalidateQueries({
              queryKey: getCartQueryKey({ path: { cartId: cartId as string } }),
            });

            toast.success('Class added to cart!');
            router.push('/cart');
          },
          onError: error => {
            toast.error(getErrorMessage(error, 'Failed to add class to cart'));
          },
        }
      );

      return;
    }

    addItemToCart.mutate(
      {
        path: { cartId: savedCartId as string },
        body: {
          variant_id: catalogue.variant_code,
          quantity: 1,
        },
      },
      {
        onSuccess: data => {
          qc.invalidateQueries({
            queryKey: getCartQueryKey({ path: { cartId: savedCartId as string } }),
          });

          router.push('/cart');
          toast.success('Class added to cart!');
        },
      }
    );
  };

  // Enrollment mutation
  const enrollStudent = useMutation(enrollStudentMutation());
  const waitlistStudent = useMutation(joinWaitlistMutation());

  const invalidateStudentEnrollmentData = () => {
    if (!student?.uuid) return;

    qc.invalidateQueries({
      queryKey: getStudentScheduleQueryKey({
        path: { studentUuid: student.uuid as string },
        query: {
          start: STUDENT_SCHEDULE_START,
          end: STUDENT_SCHEDULE_END,
        },
      }),
    });

    qc.invalidateQueries({
      queryKey: getClassEnrollmentsForStudentQueryKey({
        path: { studentUuid: student.uuid as string },
        query: { pageable: {} },
      }),
    });

    qc.invalidateQueries({
      queryKey: getEnrollmentsForClassQueryKey({ path: { uuid: classId } }),
    });
  };

  const handleEnrollmentSuccess = (data: { message?: string } | undefined, successText: string) => {
    invalidateStudentEnrollmentData();
    toast.success(data?.message || successText);
    router.push('/dashboard/courses');
  };

  const handleWaitlist = () => {
    if (!student?.uuid) {
      toast.error('Student not found, log into your student profile or create a new one');
      return;
    }

    waitlistStudent.mutate(
      {
        body: {
          class_definition_uuid: classId,
          student_uuid: student.uuid,
        },
      },
      {
        onSuccess: data => {
          handleEnrollmentSuccess(data, 'Student added to waitlist successfully');
        },
        onError: err => {
          toast.error(getErrorMessage(err, 'Failed to join the waitlist'));
        },
      }
    );
  };

  const isCapacityError = (error: unknown) => {
    const message = getErrorMessage(error, '').toLowerCase();
    return message.includes('capacity') || message.includes('full') || message.includes('waitlist');
  };

  const handleEnrollStudent = () => {
    if (!student?.uuid)
      return toast.error('Student not found, log into your student profile or create a new one');
    if (!classId) return toast.error('Class not found');

    if (isClassFull) {
      handleWaitlist();
      return;
    }

    enrollStudent.mutate(
      {
        body: {
          class_definition_uuid: classId,
          student_uuid: student.uuid,
        },
      },
      {
        onSuccess: data => {
          handleEnrollmentSuccess(data, 'Student enrolled successfully');
        },
        onError: err => {
          if (isCapacityError(err)) {
            handleWaitlist();
            return;
          }

          toast.error(getErrorMessage(err, 'Failed to enroll in class'));
          handleCreateCartAndPay(enrollingClass);
        },
      }
    );
  };

  const handleCancel = () => {
    window.location.assign(
      buildWorkspaceAliasPath(activeDomain, `/dashboard/courses/available-classes/${courseId}`)
    );
  };

  if (loading) {
    return (
      <EnrollmentLoadingState
        title='Preparing your class enrollment'
        description='We are loading the class schedule, instructor details, and seat availability so you can review everything before joining.'
      />
    );
  }

  if (!enrollingClass) {
    return (
      <div className='space-y-4'>
        <Button variant='ghost' onClick={handleCancel} className='gap-2'>
          <ArrowLeft className='h-4 w-4' />
          Back to Classes
        </Button>
        <Card className='flex flex-col items-center justify-center space-y-2 p-6 text-center'>
          <AlertCircle className='text-muted-foreground h-10 w-10' />
          <h3 className='text-foreground text-lg font-medium'>Class Not Found</h3>
          <p className='text-muted-foreground text-sm'>
            The class you're trying to enroll in could not be found.
          </p>
        </Card>
      </div>
    );
  }

  console.log(enrollingClass, "EC")

  return (
    <div className='space-y-6 pb-20'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <Button variant='ghost' onClick={handleCancel} className='gap-2'>
          <ArrowLeft className='h-4 w-4' />
          Back to Classes
        </Button>
      </div>

      {/* Main Content */}
      <div className='mx-auto max-w-4xl space-y-6'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold'>Confirm Enrollment</h1>
          <p className='text-muted-foreground'>
            Review the class details below before confirming your enrollment.
          </p>
        </div>

        {/* Class Details Card */}
        <Card className='space-y-6 p-6'>
          {/* Course Name */}
          <div className='space-y-2'>
            <h2 className='text-2xl font-semibold'>{enrollingClass?.course?.name || 'N/A'}</h2>
            {enrollingClass?.course?.description && (
              <RichTextRenderer htmlString={enrollingClass.course.description} />
            )}
          </div>

          <div className='border-t pt-6'>
            <div className='grid gap-4 md:grid-cols-2'>
              {/* Instructor */}
              <div className='flex items-start gap-3'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <User className='text-primary h-5 w-5' />
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Instructor</p>
                  <p className='text-muted-foreground text-sm'>
                    {enrollingClass?.instructor?.data?.full_name || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Location */}
              {enrollingClass?.location_type && (
                <div className='flex items-start gap-3'>
                  <div className='bg-primary/10 rounded-lg p-2'>
                    <MapPin className='text-primary h-5 w-5' />
                  </div>
                  <div className='space-y-1'>
                    <p className='text-sm font-medium'>Location</p>
                    <p className='text-muted-foreground text-sm'>{enrollingClass.location_type}</p>
                  </div>
                </div>
              )}

              {/* Start Date */}
              <div className='flex items-start gap-3'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <Calendar className='text-primary h-5 w-5' />
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Start Date</p>
                  <p className='text-muted-foreground text-sm'>{formattedStart}</p>
                </div>
              </div>

              {/* Training Fee */}
              <div className='flex items-start gap-3'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <DollarSign className='text-primary h-5 w-5' />
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Training Fee</p>
                  <p className='text-muted-foreground text-sm'>
                    KES {enrollingClass?.training_fee || 'N/A'} / hr
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <Calendar className='text-primary h-5 w-5' />
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Session Duration</p>
                  <p className='text-muted-foreground text-sm'>
                    {scheduleStats.mostCommonDuration} - {schedule.length} class instances
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <Calendar className='text-primary h-5 w-5' />
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Total Duration</p>
                  <p className='text-muted-foreground text-sm'>{scheduleStats.totalHours}</p>
                </div>
              </div>

              {/* // available seats is supposed to reduce as students are enrolled to this class */}

              <div className='flex items-start gap-3'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <Armchair className='text-primary h-5 w-5' />
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Available Seats</p>
                  <p className='text-muted-foreground text-sm'>
                    {Math.max(0, maxParticipants - enrolledCount)} of {maxParticipants} seats
                  </p>
                  {isClassFull && (
                    <p className='text-sm text-yellow-700 dark:text-yellow-300'>
                      This class is full. We&apos;ll add you to the waitlist instead.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <CardContent className='p-0'>
          <ClassScheduleCalendar schedules={calendarSchedule} />
        </CardContent>

        {/* Benefits Card */}
        <Card className='bg-primary/5 p-6'>
          <h3 className='mb-3 font-semibold'>What You'll Get</h3>
          <ul className='text-muted-foreground space-y-2 text-sm'>
            <li className='flex items-start gap-2'>
              <span className='text-primary mt-0.5'>✓</span>
              <span>Access to all course materials and resources</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-primary mt-0.5'>✓</span>
              <span>Real-time session updates and notifications</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-primary mt-0.5'>✓</span>
              <span>Assessments and assignments to track your progress</span>
            </li>
            {/* <li className='flex items-start gap-2'>
                            <span className='mt-0.5 text-primary'>✓</span>
                            <span>Direct communication with your instructor</span>
                        </li> */}
          </ul>
        </Card>

        {/* Warning Card */}
        <Card className='border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950'>
          <div className='flex gap-3'>
            <AlertCircle className='h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400' />
            <div className='space-y-1'>
              <p className='font-medium text-yellow-900 dark:text-yellow-100'>Important Notice</p>
              <p className='text-sm text-yellow-800 dark:text-yellow-200'>
                Once enrolled, you may need to contact your instructor or administrator to withdraw
                from this class.
              </p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className='flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
          <Button variant='outline' onClick={handleCancel} className='w-full sm:w-auto'>
            Cancel
          </Button>

          <Button
            onClick={handleEnrollStudent}
            disabled={enrollStudent.isPending || enrollmentError}
            className='w-full min-w-[120px] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto'
            variant='success'
          >
            {enrollStudent.isPending || waitlistStudent.isPending
              ? 'Processing...'
              : isClassFull
                ? 'Join Waitlist'
                : 'Yes, Enroll Me'}
          </Button>
        </div>
      </div>
    </div>
  );
}
