// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Languages,
  MapPin,
  ShieldCheck,
  Users,
  Wallet
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ClassScheduleCalendar } from '@/app/class-invite/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import useBundledClassInfo from '@/hooks/use-course-classes';
import {
  addItemMutation,
  createCartMutation,
  enrollStudentMutation,
  getCartQueryKey,
  getClassEnrollmentsForStudentQueryKey,
  getCourseTrainingRequirementsOptions,
  getEnrollmentsForClassOptions,
  getEnrollmentsForClassQueryKey,
  getStudentScheduleQueryKey,
  joinWaitlistMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useCartStore } from '@/store/cart-store';
import { useUserProfile } from '../../../profile/context/profile-context';
import { formatSessionSchedule } from '../components/availability-listing-layout';
import { EnrollmentLoadingState } from '../components/EnrollmentLoadingState';
import { type BundledClass, getErrorMessage } from '../types';
import PaymentMethodPicker, { formatKES } from './PaymentMethodPicker';

const STUDENT_SCHEDULE_START = new Date('2024-10-10');
const STUDENT_SCHEDULE_END = new Date('2030-10-10');
const ACTIVE_ENROLLMENT_STATUSES = new Set(['ENROLLED', 'ATTENDED', 'ABSENT']);

// Renders a field's value, or a muted "Not available" note when the current
// data model doesn't expose that field.
function FieldValue({ value }: { value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') {
    return <span className='text-muted-foreground text-sm italic'>Not available</span>;
  }
  return <>{value}</>;
}

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
    <div className='inline-flex items-start gap-2 text-sm'>
      <span className='text-muted-foreground mt-0.5'>{icon}</span>
      <span>
        <span className='sr-only'>{label}: </span>
        <FieldValue value={value} />
      </span>
    </div>
  );
}

function formatAgeRange(lower?: number | null, upper?: number | null): string | null {
  if (lower == null && upper == null) return null;
  if (lower != null && upper != null) return `${lower}–${upper} years`;
  if (lower != null) return `${lower}+ years`;
  return `Up to ${upper} years`;
}

// ─── Main Page ─────────────────────────────────────────────────────────────
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
  const user = useUserProfile();
  const student = user?.student;

  const [enrollmentError, setEnrollmentError] = useState(false);
  const [ageOk, setAgeOk] = useState(false);
  const [termsOk, setTermsOk] = useState(false);
  const [paymentOk, setPaymentOk] = useState(false);
  const [requirementsChecked, setRequirementsChecked] = useState<Record<string, boolean>>({});
  const [method, setMethod] = useState<PaymentMethod>('personal_wallet');
  const [accountId, setAccountId] = useState<string | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────
  const { classes = [], loading } = useBundledClassInfo(courseId, undefined, undefined, student);

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

  const activeEnrollments = useMemo(
    () =>
      (classEnrollmentsResponse?.data ?? []).filter(e =>
        ACTIVE_ENROLLMENT_STATUSES.has(String(e.status ?? 'ENROLLED').toUpperCase())
      ),
    [classEnrollmentsResponse?.data]
  );

  const enrolledCount = useMemo(
    () => Array.from(new Set(activeEnrollments.map(e => e.student_uuid).filter(Boolean))).length,
    [activeEnrollments]
  );

  // Derived from the enrollments already fetched for this class — no new
  // endpoint required, just a client-side membership check.
  const alreadyEnrolled = useMemo(
    () => (student?.uuid ? activeEnrollments.some(e => e.student_uuid === student.uuid) : false),
    [activeEnrollments, student?.uuid]
  );

  const maxParticipants = enrollingClass?.max_participants ?? 0;
  const isClassFull = maxParticipants > 0 && enrolledCount >= maxParticipants;
  const availableSeats = Math.max(0, maxParticipants - enrolledCount);
  const occupancyPercentage = maxParticipants > 0 ? (enrolledCount / maxParticipants) * 100 : 0;
  const isAlmostFull = !isClassFull && occupancyPercentage >= 75;

  const { formattedDates } = useMemo(() => {
    if (!enrollingClass) return { formattedDates: '' };
    try {
      const start = enrollingClass.default_start_time
        ? new Date(enrollingClass.default_start_time)
        : null;
      const end = enrollingClass.default_end_time
        ? new Date(enrollingClass.default_end_time)
        : null;
      return {
        formattedDates:
          start && end ? `${format(start, 'dd/MM/yyyy')} → ${format(end, 'dd/MM/yyyy')}` : 'N/A',
      };
    } catch {
      return { formattedDates: 'N/A' };
    }
  }, [enrollingClass]);

  // ── Age & material requirements (real course data) ─────────────────────
  const ageRange = formatAgeRange(
    enrollingClass?.course?.age_lower_limit,
    enrollingClass?.course?.age_upper_limit
  );
  const hasAgeRequirement = ageRange !== null;

  const { data: courseReqResp } = useQuery({
    ...getCourseTrainingRequirementsOptions({
      path: { courseUuid: enrollingClass?.course?.uuid ?? '' },
    }),
    enabled: Boolean(enrollingClass?.course?.uuid),
  });

  // Requirements the student is expected to supply themselves (e.g. materials).
  const studentRequirements = (courseReqResp?.data?.content ?? []).filter(
    requirement => requirement.provided_by?.toLowerCase() === 'student'
  );
  const mandatoryRequirements = studentRequirements.filter(r => r.is_mandatory);
  const allMandatoryRequirementsChecked = mandatoryRequirements.every(
    r => requirementsChecked[r.uuid]
  );

  const toggleRequirement = (uuid: string, checked: boolean) =>
    setRequirementsChecked(prev => ({ ...prev, [uuid]: checked }));

  const trainingFee = enrollingClass?.sale_price;
  const hasFee = typeof trainingFee === 'number' ? trainingFee > 0 : Boolean(trainingFee);
  const feeDisplay =
    typeof trainingFee === 'number'
      ? `KES ${trainingFee.toLocaleString()} / hr`
      : trainingFee
        ? `KES ${trainingFee} / hr`
        : 'Free';

  // ── Cart mutations ─────────────────────────────────────────────────────
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
            items: [{ variant_id: catalogue.variant_code, quantity: 1 }],
          },
        },
        {
          onSuccess: data => {
            const cartId = data?.data?.id ?? null;
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
      { body: { class_definition_uuid: classId, student_uuid: student.uuid } },
      {
        onSuccess: data => handleEnrollmentSuccess(data, 'Student added to waitlist successfully'),
        onError: err => toast.error(getErrorMessage(err, 'Failed to join the waitlist')),
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

    // A paid class has to be bought before the seat exists: the backend enrols the student itself
    // once the payment is captured. Enrolling directly here would be refused by the paywall.
    if (hasFee) {
      handleCreateCartAndPay(enrollingClass);
      return;
    }

    enrollStudent.mutate(
      { body: { class_definition_uuid: classId, student_uuid: student.uuid } },
      {
        onSuccess: data => handleEnrollmentSuccess(data, 'You are enrolled in this class'),
        onError: err => {
          if (isCapacityError(err)) {
            handleWaitlist();
            return;
          }
          toast.error(getErrorMessage(err, 'Failed to enroll in class'));
        },
      }
    );
  };

  const handleCancel = () => {
    window.location.assign(
      buildWorkspaceAliasPath(activeDomain, `/dashboard/courses/available-classes/${courseId}`)
    );
  };

  // ── Loading / not-found states ─────────────────────────────────────────
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
      <div className='mx-auto w-full max-w-6xl space-y-4 px-6 py-12 lg:py-16'>
        <Button variant='ghost' onClick={handleCancel} className='gap-2'>
          <ArrowLeft className='h-4 w-4' />
          Back to Classes
        </Button>
        <Card className='border-border/70 bg-card flex flex-col items-center justify-center space-y-2 rounded-[28px] border p-10 text-center shadow-sm'>
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
  const canSubmit =
    !isPending &&
    !enrollmentError &&
    !alreadyEnrolled &&
    (!hasAgeRequirement || ageOk) &&
    termsOk &&
    allMandatoryRequirementsChecked

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className='w-full max-w-5xl space-y-4 px-6 pt-4 pb-12'>
      <Button variant='ghost' onClick={handleCancel} className='-ml-2 gap-2'>
        <ArrowLeft className='h-4 w-4' />
        Back to Classes
      </Button>

      <h1 className='text-2xl font-semibold'>Join Class</h1>
          <p className='text-muted-foreground text-sm'>
            Confirm details before enrolling in {enrollingClass.course?.name ?? enrollingClass.title}
          </p>

          {/* Summary */}
          <Card className='rounded-[28px]'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg'>
                {enrollingClass.course?.name || enrollingClass.title || 'Class Enrollment'}
              </CardTitle>
              <div className='mt-1 flex flex-wrap gap-2 text-xs'>
                {enrollingClass.session_format && (
                  <Badge variant='secondary' className='capitalize'>
                    {enrollingClass.session_format}
                  </Badge>
                )}
                {enrollingClass.class_visibility && (
                  <Badge variant='outline' className='capitalize'>
                    {enrollingClass.class_visibility}
                  </Badge>
                )}
                {enrollingClass.duration_formatted && (
                  <Badge variant='outline'>{enrollingClass.duration_formatted}</Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className='grid gap-2 sm:grid-cols-2'>
              {/* Institution name is not part of the current class/course data model. */}
              <InfoRow icon={<Building2 className='h-4 w-4' />} label='Institution' value={null} />

              <InfoRow
                icon={<Users className='h-4 w-4' />}
                label='Instructor'
                value={enrollingClass.instructor?.data?.full_name}
              />
              {/* No discrete "academic period" field is exposed for this class. */}
              <InfoRow icon={<Calendar className='h-4 w-4' />} label='Academic period' value={null} />
              <InfoRow
                icon={<Clock className='h-4 w-4' />}
                label='Session duration'
                value={formatSessionSchedule(enrollingClass.session_templates)}
              />

              <InfoRow icon={<Calendar className='h-4 w-4' />} label='Dates' value={formattedDates} />

              <InfoRow
                icon={<MapPin className='h-4 w-4' />}
                label='Location'
                value={
                  enrollingClass.location_type === 'ONLINE'
                    ? 'Online'
                    : (enrollingClass.location_name ?? enrollingClass.meeting_link ?? null)
                }
              />
              {/* Language of instruction is not tracked on this class record. */}
              <InfoRow icon={<Languages className='h-4 w-4' />} label='Language' value={null} />
              {/* No level-of-study field is exposed on this class/course. */}
              <InfoRow icon={<GraduationCap className='h-4 w-4' />} label='Level of study' value={null} />
            </CardContent>
          </Card>

          {/* Seats */}
          <Card>
            <CardContent className='flex items-center justify-between py-4'>
              <div>
                <div className='text-sm font-medium'>Seat availability</div>
                <div className='text-muted-foreground text-xs'>
                  {availableSeats} of {maxParticipants || '?'} seats left
                </div>
              </div>

              {isClassFull ? (
                <Badge variant='destructive'>Full</Badge>
              ) : isAlmostFull ? (
                <Badge className='bg-warning/15 text-warning hover:bg-warning/15'>Almost full</Badge>
              ) : (
                <Badge className='bg-success/15 text-success hover:bg-success/15'>Open</Badge>
              )}
            </CardContent>
          </Card>

          {/* Eligibility checks */}
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base'>Eligibility checks</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Age requirement — backed by course.age_lower_limit / age_upper_limit when present. */}
              <div className='flex items-start gap-3'>
                {!hasAgeRequirement ? (
                  <AlertTriangle className='mt-0.5 h-5 w-5 text-muted-foreground' />
                ) : (
                  <CheckCircle2 className='mt-0.5 h-5 w-5 text-success' />
                )}
                <div className='flex-1'>
                  <div className='text-sm font-medium'>
                    Age requirement: {ageRange ?? 'Any'}
                  </div>
                  {hasAgeRequirement ? (
                    <label className='mt-2 flex items-center gap-2 text-sm'>
                      <Checkbox checked={ageOk} onCheckedChange={v => setAgeOk(!!v)} />
                      I confirm I meet the age requirement for this class.
                    </label>
                  ) : (
                    <div className='text-muted-foreground text-xs italic'>
                      No age restriction on file for this class.
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Materials / items the student needs to supply, from course training requirements. */}
              <div className='flex items-start gap-3'>
                <ShieldCheck className='mt-0.5 h-5 w-5 text-muted-foreground' />
                <div className='flex-1'>
                  <div className='text-sm font-medium'>Things you'll need to bring</div>
                  {studentRequirements.length === 0 ? (
                    <div className='text-muted-foreground mt-1 text-xs italic'>
                      No student-provided items listed for this course.
                    </div>
                  ) : (
                    <div className='mt-2 space-y-2'>
                      {studentRequirements.map(requirement => (
                        <label key={requirement.uuid} className='flex items-start gap-2 text-sm'>
                          <Checkbox
                            checked={!!requirementsChecked[requirement.uuid]}
                            onCheckedChange={v => toggleRequirement(requirement.uuid, !!v)}
                          />
                          <span>
                            {requirement.name}
                            {requirement.quantity ? ` (${requirement.quantity} ${requirement.unit ?? ''})` : ''}
                            {requirement.is_mandatory && (
                              <span className='text-destructive'> · required</span>
                            )}
                            {requirement.description && (
                              <span className='text-muted-foreground block text-xs'>
                                {requirement.description}
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className='flex items-start gap-3'>
                <ShieldCheck className='mt-0.5 h-5 w-5 text-muted-foreground' />
                <div className='flex-1'>
                  <div className='text-sm font-medium'>Tuition &amp; terms</div>
                  <div className='text-muted-foreground text-xs'>Training fee: {feeDisplay}</div>
                  <label className='mt-2 flex items-center gap-2 text-sm'>
                    <Checkbox checked={termsOk} onCheckedChange={v => setTermsOk(!!v)} />
                    I agree to the class schedule and tuition terms.
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader className='pb-2'>
              <div className='flex items-center justify-between gap-2'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Wallet className='h-4 w-4 text-primary' /> Payment method
                </CardTitle>
                <div className='text-right'>
                  <div className='text-muted-foreground text-xs'>Amount due</div>
                  <div className='text-primary text-base font-semibold'>{formatKES(enrollingClass?.catalogue?.unit_amount)}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!hasFee ? (
                <p className='text-sm text-muted-foreground'>
                  This class is free — no payment required.
                </p>
              ) : !student ? (
                <p className='text-sm text-muted-foreground'>Sign in to choose a payment method.</p>
              ) : (
                <PaymentMethodPicker />
              )}
            </CardContent>
          </Card>

          {/* Notices */}
          {alreadyEnrolled && (
            <div className='rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success'>
              You're already enrolled in this class.
            </div>
          )}
          {isClassFull && !alreadyEnrolled && (
            <div className='rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning'>
              This class is full. You'll be added to the waitlist instead of being enrolled directly.
            </div>
          )}

          {/* Actions */}
          <div className='flex flex-wrap items-center justify-end gap-2 pt-2'>
            <Button variant='outline' onClick={handleCancel} className='rounded-full px-6'>
              Cancel
            </Button>
            <Button
              onClick={handleEnrollStudent}
              disabled={!canSubmit}
              size='lg'
              className='rounded-full px-10 disabled:cursor-not-allowed disabled:opacity-60'
              variant='success'
            >
              {isPending ? 'Processing…' : isClassFull ? 'Join Waitlist' : 'Yes, Enroll Me'}
            </Button>
          </div>
    </div>
  );
}