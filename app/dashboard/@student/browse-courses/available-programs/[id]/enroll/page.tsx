'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useStudent } from '@/context/student-context';
import {
  addItemMutation,
  createCartMutation,
  enrollStudentMutation,
  getCartQueryKey,
  getStudentScheduleQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertCircle,
  Armchair,
  ArrowLeft,
  BookOpen,
  Calendar,
  DollarSign,
  MapPin,
  User,
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import RichTextRenderer from '../../../../../../../components/editors/richTextRenders';
import { useUserProfile } from '../../../../../../../context/profile-context';
import { useUserDomain } from '../../../../../../../context/user-domain-context';
import useProgramBundledClassInfo from '../../../../../../../hooks/use-program-classes';
import { useScheduleStats } from '../../../../../../../hooks/use-schedule-stats';
import { useCartStore } from '../../../../../../../store/cart-store';
import { ClassScheduleCalendar } from '../../../../../../class-invite/page';
import { CustomLoadingState } from '../../../../../@course_creator/_components/loading-state';

const EnrollClassPage = () => {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const domain = useUserDomain();
  const user = useUserProfile();

  const programId = params?.id as string;
  const classId = searchParams.get('id');

  const [enrollmentError, setEnrollmentError] = useState(false);

  const { replaceBreadcrumbs } = useBreadcrumb();
  const student = useStudent();

  // Fetch class information
  const { classes = [], loading } = useProgramBundledClassInfo(
    programId,
    undefined,
    undefined,
    student
  );

  // Find the specific class
  const enrollingClass = useMemo(() => {
    return classes.find(cls => cls.uuid === classId);
  }, [classes, classId]);
  const schedule = enrollingClass?.schedule ?? [];

  const totalMinutes = enrollingClass?.schedule?.reduce((sum: any, item: any) => {
    const minutes = Number(item?.duration_minutes);
    return sum + (Number.isFinite(minutes) ? minutes : 0);
  }, 0);
  const totalHours = totalMinutes / 60;
  const totalHoursRounded = `${Math.round(totalHours)}`;

  const scheduleStats = useScheduleStats(schedule);

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
    if (programId && enrollingClass) {
      replaceBreadcrumbs([
        { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
        { id: 'courses', title: 'Browse Courses', url: `/dashboard/browse-courses` },
        {
          id: 'program-details',
          title: 'Available Programs',
          url: `/dashboard/browse-courses/available-programs/${programId}`,
        },
        {
          id: 'enroll',
          title: 'Enroll',
          url: `/dashboard/browse-courses/available-programs/${programId}/enroll?id=${classId}`,
        },
      ]);
    }
  }, [replaceBreadcrumbs]);

  const { cartId: savedCartId, setCartId } = useCartStore();
  const createCart = useMutation(createCartMutation());
  const addItemToCart = useMutation(addItemMutation());

  const handleCreateCartAndPay = (cls: any) => {
    if (!cls) return;
    const catalogue = cls.catalogue;

    if (catalogue === null) {
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
          onSuccess: (data: any) => {
            const cartId = data?.data?.id || null;
            if (cartId) {
              setCartId(cartId);
            }

            qc.invalidateQueries({
              queryKey: getCartQueryKey({ path: { cartId: cartId as string } }),
            });

            toast.success('Class added to cart!');
            router.push('/cart');
          },
          onError: (error: any) => {
            toast.error(error.message);
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
  const handleEnrollStudent = () => {
    if (!student?.uuid) return toast.error('Student not found');
    if (!classId) return toast.error('Class not found');

    enrollStudent.mutate(
      {
        body: {
          class_definition_uuid: classId,
          student_uuid: student.uuid,
        },
      },
      {
        onSuccess: data => {
          qc.invalidateQueries({
            queryKey: getStudentScheduleQueryKey({
              path: { studentUuid: student.uuid as string },
              query: {
                start: new Date('2025-11-02'),
                end: new Date('2026-12-19'),
              },
            }),
          });

          toast.success(data?.message || 'Student enrolled successfully');

          // Navigate back to available classes
          router.push(`/dashboard/browse-courses/available-programs/${programId}`);
        },
        onError: err => {
          handleCreateCartAndPay(enrollingClass);
        },
      }
    );
  };

  const handleCancel = () => {
    router.push(`/dashboard/browse-courses/available-programs/${programId}`);
  };

  if (loading) {
    return <CustomLoadingState subHeading='Loading class information...' />;
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
            <h2 className='text-2xl font-semibold'>{enrollingClass?.title || 'N/A'}</h2>
            {enrollingClass?.description && (
              <RichTextRenderer htmlString={enrollingClass?.description} />
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
                    {enrollingClass?.instructor?.full_name || 'N/A'}
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

              <div className='flex items-start gap-3'>
                <div className='bg-primary/10 rounded-lg p-2'>
                  <Armchair className='text-primary h-5 w-5' />
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Available Seats</p>
                  <p className='text-muted-foreground text-sm'>
                    {enrollingClass?.max_participants - enrollingClass?.enrollments?.length} of{' '}
                    {enrollingClass?.max_participants} seats
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Courses Card */}
        <Card className='bg-primary/5 p-6'>
          <h3 className='font-semibold'>Courses Included in This Training</h3>

          <ul className='text-muted-foreground space-y-2 text-sm'>
            {enrollingClass?.course?.length === 0 && (
              <li className='text-muted-foreground text-sm'>No courses available</li>
            )}

            {enrollingClass?.course?.map((course: any) => (
              <li key={course.uuid} className='flex items-start gap-2'>
                <BookOpen className='text-primary mt-0.5 h-4 w-4' />
                <span>{course.title || course.name}</span>
              </li>
            ))}
          </ul>
        </Card>

        <CardContent className='p-0'>
          <ClassScheduleCalendar schedules={schedule as any} />
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
            {enrollStudent.isPending ? 'Enrolling...' : 'Yes, Enroll Me'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnrollClassPage;
