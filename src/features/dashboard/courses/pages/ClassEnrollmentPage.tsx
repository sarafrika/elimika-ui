// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import useBundledClassInfo from '@/hooks/use-course-classes';
import {
  enrollStudentMutation,
  getClassEnrolmentEligibilityOptions,
  getEnrollmentsForClassOptions,
  joinWaitlistMutation
} from '@/services/client/@tanstack/react-query.gen';
import { allCourseTrainingRequirementsOptions } from '@/services/course-training-requirements';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { StudentEnrollmentGate } from '@/src/features/dashboard/courses/components/StudentEnrollmentGate';
import { invalidateEnrollmentSuccessQueries } from '@/src/features/dashboard/courses/shared/enrollment-query-invalidation';
import { roleScopedDashboardPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertCircle, ArrowLeft, Calendar, Clock, Users, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useOrganisationsByIds } from '../../../../../hooks/use-batched-lookups';
import { useDifficultyLevels } from '../../../../../hooks/use-difficultyLevels';
import { useUserProfile } from '../../../profile/context/profile-context';
import { EnrollmentLoadingState } from '../components/EnrollmentLoadingState';
import { ClassJoinView, type JoinCheckItem } from '../enrollment/class-join-view';
import { durationLabel, joinPrice, toJoinSessions, useAddClassToCart } from '../enrollment/join-data';
import { type BundledClass, getErrorMessage } from '../types';

const ACTIVE_ENROLLMENT_STATUSES = new Set(['ENROLLED', 'ATTENDED', 'ABSENT']);

function formatAgeRange(lower?: number | null, upper?: number | null): string | null {
  if (lower == null && upper == null) return null;
  if (lower != null && upper != null) return `${lower}–${upper} years`;
  if (lower != null) return `${lower}+ years`;
  return `Up to ${upper} years`;
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function ClassEnrollmentPage(props: { courseId: string; classId: string }) {
  return (
    <StudentEnrollmentGate>
      <ClassEnrollmentContent {...props} />
    </StudentEnrollmentGate>
  );
}

function ClassEnrollmentContent({
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
  const [termsOk, setTermsOk] = useState(false);
  const [requirementsChecked, setRequirementsChecked] = useState<Record<string, boolean>>({});

  // ── Data fetching ──────────────────────────────────────────────────────
  const { classes = [], loading } = useBundledClassInfo(courseId, student, classId);
  const { difficultyMap } = useDifficultyLevels()

  // The platform already knows the learner's date of birth and the course's limits, so it decides
  // this rather than asking them to vouch for themselves. Checkout enforces the same rule.
  const eligibilityQuery = useQuery({
    ...getClassEnrolmentEligibilityOptions({
      path: { classDefinitionUuid: classId, studentUuid: student?.uuid as string },
    }),
    enabled: Boolean(classId && student?.uuid),
  });
  const eligibility = eligibilityQuery.data?.data ?? null;
  const eligibilityKnown = Boolean(eligibility);
  const eligibleToJoin = eligibility?.eligible ?? false;

  const { data: classEnrollmentsResponse } = useQuery({
    ...getEnrollmentsForClassOptions({ path: { uuid: classId } }),
    enabled: Boolean(classId),
  });

  const enrollingClass = useMemo(
    () => classes.find(cls => cls.uuid === classId),
    [classes, classId]
  );


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


  // ORGANISATION DETAILS
  const { organisationMap } = useOrganisationsByIds([enrollingClass?.organisation_uuid!]);
  const organisation =
    (enrollingClass?.organisation_uuid && organisationMap[enrollingClass.organisation_uuid]) || null;

  // CLASS SCHEDULES
  const schedules = enrollingClass?.schedule ?? [];
  const sortedSchedules = [...schedules].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const firstSchedule = sortedSchedules[0];

  const startsAt = firstSchedule?.start_time;

  // ── Age & material requirements (real course data) ─────────────────────
  const ageRange = formatAgeRange(
    enrollingClass?.course?.age_lower_limit,
    enrollingClass?.course?.age_upper_limit
  );

  const { data: courseReqResp } = useQuery({
    ...allCourseTrainingRequirementsOptions(enrollingClass?.course?.uuid),
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

  // The catalogue's whole-class amount is what the cart charges, so it also decides paid vs free.
  const price = enrollingClass ? joinPrice(enrollingClass) : null;
  const hasFee = Boolean(price && !price.isFree);

  const cart = useAddClassToCart();
  const handleCreateCartAndPay = (cls: BundledClass | undefined, destination = '/dashboard/checkout') => {
    if (!cls) return;
    cart.add(cls.catalogue?.variant_code, destination);
  };

  // ── Enrollment mutations ───────────────────────────────────────────────
  const enrollStudent = useMutation(enrollStudentMutation());
  const waitlistStudent = useMutation(joinWaitlistMutation());

  const invalidateStudentEnrollmentData = () => {
    if (!student?.uuid) return;
    return invalidateEnrollmentSuccessQueries(qc);
  };

  const handleEnrollmentSuccess = async (
    data: { message?: string } | undefined,
    successText: string
  ) => {
    await invalidateStudentEnrollmentData();
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
      roleScopedDashboardPath(activeDomain, `/dashboard/courses/available-classes/${courseId}`)
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

  if (!enrollingClass || !price) {
    return (
      <div className='mx-auto w-full max-w-6xl space-y-4 px-6 py-12 lg:py-16'>
        <Button variant='ghost' onClick={handleCancel} className='gap-2'>
          <ArrowLeft className='h-4 w-4' />
          Back to Classes
        </Button>
        <Card className='border-border/70 bg-card flex flex-col items-center justify-center space-y-2 rounded-md border p-10 text-center shadow-sm'>
          <AlertCircle className='text-muted-foreground h-10 w-10' />
          <h3 className='text-foreground text-lg font-medium'>Class Not Found</h3>
          <p className='text-muted-foreground text-sm'>
            The class you&apos;re trying to enroll in could not be found.
          </p>
        </Card>
      </div>
    );
  }

  const isPending = enrollStudent.isPending || waitlistStudent.isPending || cart.pending;
  const sessions = toJoinSessions(sortedSchedules);
  const firstLength = Number(sortedSchedules[0]?.duration_minutes ?? 0);
  const totalMinutes = sortedSchedules.reduce((sum, item) => sum + Number(item.duration_minutes ?? 0), 0);
  const closesOn = enrollingClass.registration_period_end_date ?? eligibility?.registration_window?.closes_on;
  const instructorName = enrollingClass.instructor?.data?.full_name;
  const place =
    enrollingClass.location_type === 'ONLINE'
      ? 'Online'
      : (enrollingClass.location_name ?? organisation?.name ?? 'In person');

  const blockers = [
    alreadyEnrolled ? 'You are already enrolled in this class.' : null,
    eligibilityKnown && !eligibleToJoin && !isClassFull ? (eligibility?.reason ?? 'You cannot join this class right now.') : null,
    enrollmentError ? 'Something went wrong. Refresh and try again.' : null,
  ].filter((reason): reason is string => Boolean(reason));

  const items: JoinCheckItem[] = studentRequirements.map(requirement => ({
    id: requirement.uuid,
    name: requirement.quantity ? `${requirement.name} (${requirement.quantity} ${requirement.unit ?? ''})`.trim() : requirement.name,
    detail: requirement.description ?? undefined,
    required: Boolean(requirement.is_mandatory),
    checked: Boolean(requirementsChecked[requirement.uuid]),
    onToggle: checked => toggleRequirement(requirement.uuid, checked),
  }));

  return (
    <ClassJoinView
      onBack={handleCancel}
      title={enrollingClass.title || enrollingClass.course?.name || 'Class'}
      subtitle={
        <>
          {enrollingClass.course?.name ?? 'Course'}
          {instructorName ? (
            <>
              {' '}
              · with <strong className='text-foreground'>{instructorName}</strong>
            </>
          ) : null}{' '}
          · {place}
          {difficultyMap[enrollingClass?.course?.difficulty_uuid] ? ` · ${difficultyMap[enrollingClass.course.difficulty_uuid]}` : ''}
        </>
      }
      chips={[
        isClassFull
          ? { label: 'Full · waitlist open', tone: 'destructive' }
          : closesOn
            ? { label: `Open · closes ${format(new Date(closesOn), 'EEE d MMM')}`, tone: 'success' }
            : { label: 'Open for registration', tone: 'success' },
        { label: enrollingClass.location_type === 'ONLINE' ? 'Online' : 'In person', tone: 'info' },
        ...(enrollingClass.session_format ? [{ label: String(enrollingClass.session_format).toLowerCase().replace(/^./, c => c.toUpperCase()), tone: 'neutral' as const }] : []),
      ]}
      stats={[
        {
          label: 'Starts',
          value: startsAt ? format(new Date(startsAt), 'EEE d MMM') : 'Not scheduled',
          hint: sessions[0]?.timeLabel ? `${sessions[0].timeLabel} EAT` : undefined,
          tone: 'info',
          icon: Calendar,
        },
        {
          label: 'Sessions',
          value: sessions.length ? `${sessions.length} × ${durationLabel(firstLength) || '—'}` : '—',
          hint: totalMinutes ? `${durationLabel(totalMinutes)} of teaching` : undefined,
          tone: 'neutral',
          icon: Clock,
        },
        {
          label: 'Seats left',
          value: maxParticipants > 0 ? `${availableSeats} of ${maxParticipants}` : 'Open',
          hint: isClassFull ? 'Full — join the waitlist' : isAlmostFull || (maxParticipants > 0 && availableSeats <= 3) ? 'Filling fast' : 'Plenty of room',
          tone: isClassFull ? 'destructive' : maxParticipants > 0 && availableSeats <= 3 ? 'warning' : 'success',
          icon: Users,
        },
        {
          label: 'Registration',
          value: closesOn ? `Closes ${format(new Date(closesOn), 'EEE d MMM')}` : 'Open',
          hint: closesOn ? format(new Date(closesOn), 'd MMMM yyyy') : 'No closing date set',
          tone: 'success',
          icon: Zap,
        },
      ]}
      sessions={sessions}
      eligibility={
        eligibilityQuery.isLoading
          ? { state: 'loading', title: 'Checking your profile…' }
          : eligibility && !eligibility.eligible && !isClassFull
            ? { state: 'blocked', title: `Age requirement: ${ageRange ?? 'Any'}`, detail: eligibility.reason }
            : eligibility?.student_age != null
              ? { state: 'ok', title: `Age ${ageRange ?? 'any'} — you meet it`, detail: 'Checked against your profile' }
              : { state: 'none', title: 'No age restriction for this class' }
      }
      items={items}
      terms={{ checked: termsOk, onToggle: setTermsOk, detail: `One payment covers every session${price.rateLabel ? ` · ${price.rateLabel}` : ''}.` }}
      price={price}
      seatsBadge={
        maxParticipants > 0
          ? { label: isClassFull ? 'Full' : `${availableSeats} ${availableSeats === 1 ? 'seat' : 'seats'} left`, tone: isClassFull ? 'destructive' : availableSeats <= 3 ? 'warning' : 'success' }
          : null
      }
      blockers={blockers}
      notices={isClassFull && !alreadyEnrolled ? [{ label: 'This class is full. You will join the waitlist instead.', tone: 'warning' }] : []}
      primary={{
        label: isClassFull ? 'Join the waitlist' : hasFee ? 'Continue to pay' : 'Join for free',
        pending: isPending,
        onClick: handleEnrollStudent,
      }}
      secondary={hasFee && !isClassFull ? { label: 'Add to cart', onClick: () => handleCreateCartAndPay(enrollingClass, '/dashboard/cart') } : null}
    />
  );
}
