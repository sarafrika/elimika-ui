'use client';

import { ClassScheduleCalendar } from '@/app/class-invite/page';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import useProgramBundledClassInfo from '@/hooks/use-program-classes';
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
import {
  AlertCircle,
  Armchair,
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Layers,
  MapPin,
  User,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUserProfile } from '../../../profile/context/profile-context';
import { EnrollmentLoadingState } from '../components/EnrollmentLoadingState';
import { getErrorMessage, type ProgramBundledClass } from '../types';

const STUDENT_SCHEDULE_START = new Date('2024-10-10');
const STUDENT_SCHEDULE_END = new Date('2030-10-10');
const ACTIVE_ENROLLMENT_STATUSES = new Set(['ENROLLED', 'ATTENDED', 'ABSENT']);

// ─── Shared InfoRow (matches ClassInviteContent) ───────────────────────────
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className='flex items-start gap-3'>
      <div className='text-primary mt-0.5'>{icon}</div>
      <div className='space-y-0.5'>
        <div className='text-muted-foreground text-xs tracking-wide uppercase'>{label}</div>
        <div className='text-sm font-medium'>{value}</div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function ProgramClassEnrollmentPage({
  programId,
  classId,
}: {
  programId: string;
  classId: string;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const { activeDomain } = useUserDomain();
  const user = useUserProfile();
  const student = user?.student;

  const [enrollmentError, setEnrollmentError] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────
  const { classes = [], loading } = useProgramBundledClassInfo(
    programId,
    undefined,
    undefined,
    student
  );

  const { data: classEnrollmentsResponse } = useQuery({
    ...getEnrollmentsForClassOptions({ path: { uuid: classId } }),
    enabled: Boolean(classId),
  });

  const enrollingClass = useMemo(
    () => classes.find(cls => cls.uuid === classId),
    [classes, classId]
  );

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

  const scheduleStats = useScheduleStats(
    schedule.map(item => ({ duration_minutes: Number(item.duration_minutes ?? 0) }))
  );

  const enrolledCount = useMemo(
    () =>
      Array.from(
        new Set(
          (classEnrollmentsResponse?.data ?? [])
            .filter(e =>
              ACTIVE_ENROLLMENT_STATUSES.has(String(e.status ?? 'ENROLLED').toUpperCase())
            )
            .map(e => e.student_uuid)
            .filter(Boolean)
        )
      ).length,
    [classEnrollmentsResponse?.data]
  );

  const maxParticipants = enrollingClass?.max_participants ?? 0;
  const isClassFull = maxParticipants > 0 && enrolledCount >= maxParticipants;
  const availableSeats = Math.max(0, maxParticipants - enrolledCount);

  const { formattedStart, formattedEnd } = useMemo(() => {
    if (!enrollingClass) return { formattedStart: '', formattedEnd: '' };
    try {
      const start = enrollingClass.default_start_time
        ? new Date(enrollingClass.default_start_time)
        : null;
      const end = enrollingClass.default_end_time
        ? new Date(enrollingClass.default_end_time)
        : null;
      return {
        formattedStart: start ? format(start, 'MMM dd, yyyy • hh:mm a') : 'N/A',
        formattedEnd: end ? format(end, 'MMM dd, yyyy • hh:mm a') : 'N/A',
      };
    } catch {
      return { formattedStart: 'N/A', formattedEnd: 'N/A' };
    }
  }, [enrollingClass]);

  // ── Cart mutations ─────────────────────────────────────────────────────
  const { cartId: savedCartId, setCartId } = useCartStore();
  const createCart = useMutation(createCartMutation());
  const addItemToCart = useMutation(addItemMutation());

  const handleCreateCartAndPay = (cls: ProgramBundledClass | undefined) => {
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
            items: [{ variant_id: catalogue.variant_code, quantity: 1 }],
          },
        },
        {
          onSuccess: data => {
            const cartId = data?.id || null;
            if (cartId) setCartId(cartId);
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
        body: { variant_id: catalogue.variant_code, quantity: 1 },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({
            queryKey: getCartQueryKey({ path: { cartId: savedCartId as string } }),
          });
          router.push('/cart');
          toast.success('Class added to cart!');
        },
      }
    );
  };

  // ── Enrollment mutations ───────────────────────────────────────────────
  const enrollStudent = useMutation(enrollStudentMutation());
  const waitlistStudent = useMutation(joinWaitlistMutation());

  const invalidateStudentEnrollmentData = () => {
    if (!student?.uuid) return;
    qc.invalidateQueries({
      queryKey: getStudentScheduleQueryKey({
        path: { studentUuid: student.uuid as string },
        query: { start: STUDENT_SCHEDULE_START, end: STUDENT_SCHEDULE_END },
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

  const handleWaitlist = () => {
    if (!student?.uuid)
      return toast.error('Student not found, log into your student profile or create a new one');
    if (!classId) return toast.error('Class not found');

    waitlistStudent.mutate(
      { body: { class_definition_uuid: classId, student_uuid: student.uuid } },
      {
        onSuccess: data => {
          invalidateStudentEnrollmentData();
          toast.success(data?.message || 'Student added to waitlist successfully');
          router.push('/dashboard/courses');
        },
        onError: err => toast.error(getErrorMessage(err, 'Failed to join the waitlist')),
      }
    );
  };

  const isCapacityError = (error: unknown) => {
    const message = getErrorMessage(error, '').toLowerCase();
    return (
      message.includes('capacity') || message.includes('full') || message.includes('waitlist')
    );
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
      { body: { class_definition_uuid: classId, student_uuid: student.uuid } },
      {
        onSuccess: data => {
          invalidateStudentEnrollmentData();
          toast.success(data?.message || 'Student enrolled successfully');
          router.push('/dashboard/courses');
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
      buildWorkspaceAliasPath(
        activeDomain,
        `/dashboard/courses/available-programs/${programId}`
      )
    );
  };

  // ── Loading / not-found states ─────────────────────────────────────────
  if (loading) {
    return (
      <EnrollmentLoadingState
        title='Preparing your program enrollment'
        description='We are loading the cohort schedule, included courses, and enrollment details so you can confirm everything with confidence.'
      />
    );
  }

  if (!enrollingClass) {
    return (
      <div className='mx-auto w-full max-w-6xl px-6 py-12 lg:py-16 space-y-4'>
        <Button variant='ghost' onClick={handleCancel} className='gap-2'>
          <ArrowLeft className='h-4 w-4' />
          Back to Classes
        </Button>
        <Card className='border-border/70 bg-card rounded-[28px] border shadow-sm flex flex-col items-center justify-center space-y-2 p-10 text-center'>
          <AlertCircle className='text-muted-foreground h-10 w-10' />
          <h3 className='text-foreground text-lg font-medium'>Class Not Found</h3>
          <p className='text-muted-foreground text-sm'>
            The class you&apos;re trying to enroll in could not be found.
          </p>
        </Card>
      </div>
    );
  }

  const isPending = enrollStudent.isPending || waitlistStudent.isPending;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className='mx-auto w-full max-w-6xl px-6 py-12 lg:py-16 space-y-6'>
      {/* Back button */}
      <Button variant='ghost' onClick={handleCancel} className='gap-2 -ml-2'>
        <ArrowLeft className='h-4 w-4' />
        Back to Classes
      </Button>

      {/* Main card */}
      <Card className='border-border bg-card rounded-[28px] border shadow-xl'>

        {/* ── Card header: badges + title + description ── */}
        <CardHeader className='space-y-4'>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex flex-wrap gap-2'>
              {enrollingClass.session_format && (
                <Badge className='rounded-full'>{enrollingClass.session_format}</Badge>
              )}
              {enrollingClass.class_visibility && (
                <Badge variant='outline' className='rounded-full'>
                  {enrollingClass.class_visibility}
                </Badge>
              )}
              {enrollingClass.duration_formatted && (
                <Badge
                  variant='outline'
                  className='border-primary/30 bg-primary/10 text-primary rounded-full'
                >
                  {enrollingClass.duration_formatted}
                </Badge>
              )}
            </div>

            {/* Program pill — matches ClassInviteContent accent pill */}
            <span className='text-on-accent bg-accent rounded-full px-3 py-1 text-xs font-semibold shadow-sm'>
              PROGRAM
            </span>
          </div>

          <CardTitle className='text-3xl font-semibold'>
            {enrollingClass.title || 'Program Enrollment'}
          </CardTitle>

          <CardDescription className='text-muted-foreground max-w-2xl'>
            Review the program details below before confirming your enrollment.
          </CardDescription>
        </CardHeader>

        {/* ── Program / class description (rich text) ── */}
        {enrollingClass.description && (
          <CardContent>
            <div className='bg-muted/30 rounded-2xl border border-border/60 p-4'>
              <RichTextRenderer htmlString={enrollingClass.description} />
            </div>
          </CardContent>
        )}

        {/* ── InfoRow grid ── */}
        <CardContent className='space-y-6'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <InfoRow
              icon={<Clock className='h-4 w-4' />}
              label='Class Begins'
              value={`${formattedStart} – ${formattedEnd}`}
            />

            <InfoRow
              icon={<MapPin className='h-4 w-4' />}
              label='Location'
              value={
                enrollingClass.location_type === 'ONLINE'
                  ? 'Online'
                  : (enrollingClass.location_name ?? enrollingClass.location_type ?? 'N/A')
              }
            />

            <InfoRow
              icon={<User className='h-4 w-4' />}
              label='Instructor'
              value={enrollingClass.instructor?.data?.full_name || 'N/A'}
            />

            <InfoRow
              icon={<Layers className='h-4 w-4' />}
              label='Training Fee'
              value={
                typeof enrollingClass.training_fee === 'number'
                  ? `KES ${enrollingClass.training_fee.toLocaleString()} / hr`
                  : enrollingClass.training_fee
                    ? `KES ${enrollingClass.training_fee} / hr`
                    : 'Free'
              }
            />

            <InfoRow
              icon={<Calendar className='h-4 w-4' />}
              label='Session Duration'
              value={`${scheduleStats.mostCommonDuration} · ${schedule.length} class instance${schedule.length !== 1 ? 's' : ''}`}
            />

            <InfoRow
              icon={<Clock className='h-4 w-4' />}
              label='Total Duration'
              value={scheduleStats.totalHours}
            />

            <InfoRow
              icon={<Users className='h-4 w-4' />}
              label='Capacity'
              value={`${maxParticipants} students`}
            />

            <InfoRow
              icon={<Armchair className='h-4 w-4' />}
              label='Available Seats'
              value={
                <div className='space-y-0.5'>
                  <span>
                    {availableSeats} of {maxParticipants}
                  </span>
                  {isClassFull && (
                    <p className='text-xs text-yellow-700 dark:text-yellow-300'>
                      Class is full — you&apos;ll be added to the waitlist.
                    </p>
                  )}
                </div>
              }
            />
          </div>
        </CardContent>

        {/* ── Courses included in this program ── */}
        <CardContent>
          <div className='bg-primary/5 rounded-2xl border border-primary/15 p-4'>
            <h3 className='font-semibold'>Courses Included in This Training</h3>
            <ul className='text-muted-foreground mt-3 space-y-2 text-sm'>
              {(!enrollingClass.course || enrollingClass.course.length === 0) && (
                <li className='text-muted-foreground text-sm'>No courses available</li>
              )}
              {enrollingClass.course?.map(course => (
                <li key={course.uuid} className='flex items-start gap-2'>
                  <BookOpen className='text-primary mt-0.5 h-4 w-4 shrink-0' />
                  <span>{course.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>

        {/* ── What You'll Get (benefits) ── */}
        <CardContent>
          <div className='bg-primary/5 rounded-2xl border border-primary/15 p-4'>
            <h3 className='font-semibold mb-3'>What You&apos;ll Get</h3>
            <ul className='text-muted-foreground space-y-2 text-sm'>
              <li className='flex items-start gap-2'>
                <BookOpen className='text-primary mt-0.5 h-4 w-4 shrink-0' />
                <span>Access to all course materials and resources</span>
              </li>
              <li className='flex items-start gap-2'>
                <BookOpen className='text-primary mt-0.5 h-4 w-4 shrink-0' />
                <span>Real-time session updates and notifications</span>
              </li>
              <li className='flex items-start gap-2'>
                <BookOpen className='text-primary mt-0.5 h-4 w-4 shrink-0' />
                <span>Assessments and assignments to track your progress</span>
              </li>
            </ul>
          </div>
        </CardContent>

        {/* ── Important notice ── */}
        <CardContent>
          <div className='rounded-2xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950'>
            <div className='flex gap-3'>
              <AlertCircle className='h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400' />
              <div className='space-y-1'>
                <p className='font-medium text-yellow-900 dark:text-yellow-100'>
                  Important Notice
                </p>
                <p className='text-sm text-yellow-800 dark:text-yellow-200'>
                  Once enrolled, you may need to contact your instructor or administrator to
                  withdraw from this class.
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        {/* ── Schedule calendar ── */}
        <CardContent>
          <ClassScheduleCalendar schedules={calendarSchedule} />
        </CardContent>

        {/* ── CTA footer (mirrors ClassInviteContent program card) ── */}
        <div className='border-border flex flex-col gap-3 border-t px-6 pt-6 pb-6 sm:flex-row sm:items-center sm:justify-between'>
          <div className='text-muted-foreground text-sm'>
            {isClassFull ? 'Class is full • Waitlist available' : 'Limited seats remaining'}
          </div>

          <div className='flex items-center gap-3'>
            <Button variant='outline' onClick={handleCancel} className='rounded-full px-6'>
              Cancel
            </Button>

            <Button
              onClick={handleEnrollStudent}
              disabled={isPending || enrollmentError}
              size='lg'
              className='rounded-full px-10 disabled:cursor-not-allowed disabled:opacity-60'
              variant='success'
            >
              {isPending
                ? 'Processing…'
                : isClassFull
                  ? 'Join Waitlist'
                  : 'Yes, Enroll Me'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}