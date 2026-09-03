// @ts-nocheck -- generated client types drift on booking and training application responses
'use client';

import { ClassScheduleCalendar } from '@/app/class-invite/page';
import {
  approvedRateFor,
  computeUpcomingSessions,
  DEFAULT_DAYS,
  fmtDate,
  formatMoney,
  LocationVenue,
  OfferingPicker,
  PickDatesPanel,
  ScheduleModeCards,
  ServiceCards,
  sessionMinutesFor,
  StandardSchedule,
  toDateTime,
  UpcomingSessions,
  type DayKey,
  type DayRow,
  type Offering,
  type RateBasis,
} from '@/components/class-form';
import { ResourceConflictAlert } from '@/components/resourcing/ResourceConflictAlert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/context/profile-context';
import { useStudent } from '@/context/student-context';
import { useUserDomain } from '@/context/user-domain-context';
import useSearchTrainingInstructors from '@/hooks/use-search-training-instructors';
import { localDate } from '@/lib/date';
import {
  createBookingMutation,
  getCourseByUuidOptions,
  getCourseTrainingRequirementsOptions,
  getInstructorScheduleOptions,
  getStudentBookingsQueryKey,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { Course, ScheduledInstance } from '@/services/client/types.gen';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { SearchInstructor } from '../../../types';
import { getErrorMessage } from '../../../types';

const DEFAULT_TIME_ZONE = 'Africa/Nairobi';
const DEFAULT_START_TIME = '09:00';
const DEFAULT_END_TIME = '10:00';

type Props = {
  courseId: string | null;
  instructorId: string | null;
};

type CourseApplication = {
  course_uuid?: string;
  applicant_uuid?: string;
  applicant_type?: string;
  rate_card?: Record<string, number | string | null | undefined>;
};

type ConflictItem = {
  start?: string;
  end?: string;
  reasons: string[];
};

const ageFromDate = (dob?: Date | string | null) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const birthdayNotReached =
    now.getMonth() < birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate());
  if (birthdayNotReached) age -= 1;
  return age;
};

const formatAgeRange = (lower?: number | null, upper?: number | null) => {
  if (lower == null && upper == null) return 'No age restriction';
  if (lower != null && upper != null) return `${lower}–${upper} years`;
  if (lower != null) return `${lower}+ years`;
  return `Up to ${upper} years`;
};

const scheduleWindows = (sessions: Array<{ date: Date; time: string }>, timezone: string) =>
  sessions.flatMap(session => {
    const [startText, endText] =
      session.time === 'All day'
        ? ['00:00', '23:59']
        : session.time.split(/\s*[–-]\s*/).map(value => value.trim());
    if (!startText || !endText || !sessionMinutesFor(startText, endText)) return [];
    const date = fmtDate(session.date);
    const start = new Date(toDateTime(date, startText, timezone));
    const end = new Date(toDateTime(date, endText, timezone));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
    return [{ start, end }];
  });

function InstructorSummary({ instructor }: { instructor: SearchInstructor }) {
  const location =
    instructor.formatted_location || instructor.location?.city || 'Location not available';
  const initials = (instructor.full_name || 'Instructor')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className='border-primary/15 overflow-hidden rounded-2xl p-0'>
      <CardContent className='relative p-5 sm:p-6'>
        <div className='from-primary/10 via-background absolute inset-0 bg-gradient-to-br to-transparent' />
        <div className='relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex min-w-0 items-center gap-4'>
            <Avatar className='border-primary/20 size-20 border-2 sm:size-24'>
              <AvatarImage
                src={instructor.profile_image_url ?? undefined}
                alt={instructor.full_name}
              />
              <AvatarFallback className='text-lg font-semibold'>{initials}</AvatarFallback>
            </Avatar>
            <div className='min-w-0 space-y-2'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge className='border-success/40 bg-success/10 text-success rounded-full border'>
                  Available
                </Badge>
                {instructor.admin_verified ? <Badge variant='outline'>Verified</Badge> : null}
              </div>
              <h1 className='text-foreground truncate text-xl font-semibold sm:text-2xl'>
                {instructor.full_name || 'Instructor'}
              </h1>
              <p className='text-muted-foreground text-sm'>
                {instructor.professional_headline || 'Certified Instructor'}
              </p>
              <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs'>
                <span className='inline-flex items-center gap-1'>
                  <MapPin className='size-3.5' />
                  {location}
                </span>
                <span className='inline-flex items-center gap-1'>
                  <CalendarDays className='size-3.5' />
                  {instructor.total_experience_years ?? 0}+ years experience
                </span>
                <span className='text-warning inline-flex items-center gap-1'>
                  <Star className='size-3.5 fill-current' />
                  {Number(instructor.rating ?? 0).toFixed(1)} ({instructor.review_count ?? 0})
                </span>
              </div>
            </div>
          </div>
          <div className='bg-background/80 rounded-xl border p-4 sm:min-w-48'>
            <p className='text-muted-foreground text-xs font-medium'>Booking with</p>
            <p className='text-foreground mt-1 text-sm font-semibold'>Your selected instructor</p>
            <p className='text-muted-foreground mt-1 text-xs'>
              Choose a course, service, and schedule below.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InstructorHirePage({ courseId, instructorId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const student = useStudent();
  const profile = useUserProfile();
  const { activeDomain } = useUserDomain();
  const { data: instructors = [], loading: instructorsLoading } = useSearchTrainingInstructors();
  const instructor = instructors.find(item => item.uuid === instructorId) as
    | SearchInstructor
    | undefined;

  const [selectedOffering, setSelectedOffering] = useState('');
  const [serviceKey, setServiceKey] = useState<'1on1' | 'group' | 'online' | 'private-online'>(
    '1on1'
  );
  const [delivery, setDelivery] = useState<'ONLINE' | 'IN_PERSON' | 'HYBRID'>('ONLINE');
  const [locationName, setLocationName] = useState('');
  const [locationLatitude, setLocationLatitude] = useState('');
  const [locationLongitude, setLocationLongitude] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'standard' | 'pick' | 'academic'>('pick');
  const [timezone] = useState(DEFAULT_TIME_ZONE);
  const [pickedDates, setPickedDates] = useState<Date[]>([]);
  const [pickMonth, setPickMonth] = useState(new Date());
  const [pickStart, setPickStart] = useState(DEFAULT_START_TIME);
  const [pickEnd, setPickEnd] = useState(DEFAULT_END_TIME);
  const [days, setDays] = useState<Record<DayKey, DayRow>>(() => ({ ...DEFAULT_DAYS }));
  const [repeatEvery, setRepeatEvery] = useState('1');
  const [repeatUnit, setRepeatUnit] = useState('Week');
  const [startDate, setStartDate] = useState(fmtDate(new Date()));
  const [endDate, setEndDate] = useState(fmtDate(new Date(Date.now() + 28 * 86400000)));
  const [requirementsChecked, setRequirementsChecked] = useState<Record<string, boolean>>({});
  const [termsOk, setTermsOk] = useState(false);

  const { data: applicationsResponse, isLoading: applicationsLoading } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        pageable: {},
        searchParams: { applicant_uuid_eq: instructorId ?? '', status: 'approved' },
      },
    }),
    enabled: Boolean(instructorId),
  });
  const applications = (applicationsResponse?.data?.content ?? []) as CourseApplication[];
  const approvedApplications = applications.filter(
    application => application.applicant_type === 'instructor' && application.course_uuid
  );
  const courseUuids = [
    ...new Set(approvedApplications.map(application => application.course_uuid)),
  ].filter(Boolean);
  const courseQueries = useQueries({
    queries: courseUuids.map(uuid => ({
      ...getCourseByUuidOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
    })),
  });
  const courses = courseQueries.map(query => query.data?.data).filter(Boolean) as Course[];
  const selectedCourseUuid = selectedOffering.replace('course:', '');
  const selectedCourse = courses.find(course => course.uuid === selectedCourseUuid) ?? null;
  const selectedApplication = approvedApplications.find(
    application => application.course_uuid === selectedCourseUuid
  );

  useEffect(() => {
    const initialCourse =
      courseId && courses.some(course => course.uuid === courseId) ? courseId : courses[0]?.uuid;
    if (initialCourse && !selectedOffering) setSelectedOffering(`course:${initialCourse}`);
  }, [courseId, courses, selectedOffering]);

  useEffect(() => {
    setSelectedOffering(current => {
      const next = current.replace('course:', '');
      return courses.some(course => course.uuid === next)
        ? current
        : courses[0]?.uuid
          ? `course:${courses[0].uuid}`
          : '';
    });
  }, [courses]);

  const courseRequirementsQuery = useQuery({
    ...getCourseTrainingRequirementsOptions({
      path: { courseUuid: selectedCourseUuid || 'unset' },
      query: { pageable: {} },
    }),
    enabled: Boolean(selectedCourseUuid),
  });
  const studentRequirements = (courseRequirementsQuery.data?.data?.content ?? []).filter(
    requirement => requirement.provided_by?.toLowerCase() === 'student'
  );
  const mandatoryRequirements = studentRequirements.filter(requirement => requirement.is_mandatory);
  const requirementsComplete = mandatoryRequirements.every(
    requirement => requirementsChecked[requirement.uuid]
  );

  const scheduleRange = useMemo(() => {
    const start = new Date();
    const end = new Date();
    end.setFullYear(end.getFullYear() + 1);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }, []);
  const instructorScheduleQuery = useQuery({
    ...getInstructorScheduleOptions({
      path: { instructorUuid: instructorId ?? 'unset' },
      query: { start: localDate(scheduleRange.start), end: localDate(scheduleRange.end) },
    }),
    enabled: Boolean(instructorId),
  });
  const existingSchedule = (instructorScheduleQuery.data?.data ?? []) as ScheduledInstance[];

  const offerings = useMemo<Offering[]>(
    () =>
      courses.map(course => ({
        value: `course:${course.uuid}`,
        label: course.name || 'Untitled course',
        kind: 'Course',
        categoryNames: course.category_names ?? [],
        rateCard: approvedApplications.find(application => application.course_uuid === course.uuid)
          ?.rate_card,
      })),
    [approvedApplications, courses]
  );
  const selectedOfferingDetails = offerings.find(offering => offering.value === selectedOffering);
  const rateCard = selectedApplication?.rate_card;
  const rateBasis: RateBasis = 'per_hour';
  const serviceFormat =
    serviceKey === '1on1' || serviceKey === 'private-online' ? 'INDIVIDUAL' : 'GROUP';
  const rate = approvedRateFor(rateCard, serviceFormat, delivery, rateBasis) ?? 0;

  const upcomingSessions = useMemo(() => {
    if (scheduleMode === 'pick') {
      const minutes = sessionMinutesFor(pickStart, pickEnd);
      if (!minutes) return [];
      return pickedDates
        .slice()
        .sort((left, right) => left.getTime() - right.getTime())
        .map(date => ({
          date,
          label: date.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          time: `${pickStart}–${pickEnd}`,
          minutes,
        }));
    }
    return computeUpcomingSessions(startDate, endDate, days);
  }, [days, endDate, pickEnd, pickStart, pickedDates, scheduleMode, startDate]);

  const windows = useMemo(
    () => scheduleWindows(upcomingSessions, timezone),
    [upcomingSessions, timezone]
  );
  const conflicts = useMemo<ConflictItem[]>(() => {
    const busy = existingSchedule.filter(
      item => String(item.status ?? '').toUpperCase() !== 'CANCELLED'
    );
    return windows.flatMap(window =>
      busy.flatMap(item => {
        if (!item.start_time || !item.end_time) return [];
        const existingStart = new Date(item.start_time);
        const existingEnd = new Date(item.end_time);
        if (window.start >= existingEnd || existingStart >= window.end) return [];
        return [
          {
            start: existingStart.toLocaleString(),
            end: existingEnd.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            reasons: [`Overlaps with ${item.title || 'an existing instructor class'}`],
          },
        ];
      })
    );
  }, [existingSchedule, windows]);

  const age = ageFromDate(profile?.dob);
  const lowerAge = selectedCourse?.age_lower_limit;
  const upperAge = selectedCourse?.age_upper_limit;
  const ageKnown = age != null;
  const ageEligible =
    age == null || ((lowerAge == null || age >= lowerAge) && (upperAge == null || age <= upperAge));
  const eligibilityReady = ageEligible && (ageKnown || (lowerAge == null && upperAge == null));
  const totalHours = upcomingSessions.reduce((sum, session) => sum + session.minutes / 60, 0);
  const totalAmount = totalHours * rate;
  const createBooking = useMutation(createBookingMutation());
  const isSubmitting = createBooking.isPending;

  const handleBack = () =>
    router.push(
      buildWorkspaceAliasPath(
        activeDomain,
        `/dashboard/courses/instructor${courseId ? `?courseId=${courseId}` : ''}`
      )
    );

  const handleServiceChange = (next: string) => {
    setServiceKey(next as typeof serviceKey);
    setDelivery(next === 'private-online' || next === 'online' ? 'ONLINE' : delivery);
  };

  const handleSubmit = async () => {
    if (!student?.uuid) return toast.error('Student profile is required before booking.');
    if (!selectedCourseUuid || !selectedApplication)
      return toast.error('Select an approved course or program.');
    if (!rate) return toast.error('This instructor has no approved rate for the selected service.');
    if (!upcomingSessions.length) return toast.error('Select at least one valid upcoming session.');
    if (conflicts.length) return toast.error('Resolve the schedule conflicts before confirming.');
    if (!eligibilityReady)
      return toast.error(
        ageKnown
          ? 'You do not meet this course age requirement.'
          : 'Your date of birth is required to check eligibility.'
      );
    if (!requirementsComplete)
      return toast.error('Complete the required course materials checklist.');
    if (!termsOk) return toast.error('Confirm that you agree to the schedule and booking terms.');
    try {
      const createdBookings: Array<{ uuid: string }> = [];
      for (const session of upcomingSessions) {
        const [startText, endText] =
          session.time === 'All day'
            ? ['00:00', '23:59']
            : session.time.split(/\s*[–-]\s*/).map(value => value.trim());
        const start = toDateTime(fmtDate(session.date), startText, timezone);
        const end = toDateTime(fmtDate(session.date), endText, timezone);
        const created = await createBooking.mutateAsync({
          body: {
            student_uuid: student.uuid,
            course_uuid: selectedCourseUuid,
            instructor_uuid: instructorId,
            start_time: start,
            end_time: end,
            price_amount: (session.minutes / 60) * rate,
            currency: rateCard?.currency ?? 'KES',
            purpose: [
              `Instructor hire for ${selectedCourse?.name ?? 'course'}`,
              `Service: ${serviceKey}`,
              meetingLink ? `Meeting link: ${meetingLink}` : null,
              locationName ? `Location: ${locationName}` : null,
            ]
              .filter(Boolean)
              .join(' · '),
          },
        });
        if (!created?.data?.uuid)
          throw new Error('Booking was created without a booking reference.');
        createdBookings.push(created.data);
      }

      await queryClient.invalidateQueries({
        queryKey: getStudentBookingsQueryKey({
          path: { studentUuid: student.uuid },
          query: { pageable: {}, status: '' },
        }),
      });
      const firstBookingUuid = createdBookings[0]?.uuid;
      toast.success('Booking request sent successfully.');
      router.push(
        buildWorkspaceAliasPath(
          activeDomain,
          `/dashboard/student/my-bookings${firstBookingUuid ? `?bookingUuid=${firstBookingUuid}` : ''}`
        )
      );
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not create the booking request.'));
    }
  };

  if (instructorsLoading || applicationsLoading) {
    return (
      <div className='mx-auto max-w-6xl space-y-5 px-4 py-6'>
        <Skeleton className='h-40 w-full rounded-2xl' />
        <Skeleton className='h-96 w-full rounded-2xl' />
      </div>
    );
  }
  if (!instructor) {
    return (
      <div className='mx-auto max-w-3xl px-4 py-16 text-center'>
        <h1 className='text-foreground text-xl font-semibold'>Instructor not found</h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          This instructor may no longer be available.
        </p>
        <Button className='mt-5' onClick={handleBack}>
          <ArrowLeft className='mr-2 size-4' />
          Back to instructors
        </Button>
      </div>
    );
  }

  return (
    <div className='mx-auto w-full max-w-7xl space-y-6 px-3 py-5 sm:px-5 lg:px-6'>
      <div className='flex items-center justify-between gap-3'>
        <Button type='button' variant='ghost' onClick={handleBack}>
          <ArrowLeft className='mr-2 size-4' />
          Back to instructors
        </Button>
        <Badge variant='outline'>Hire instructor</Badge>
      </div>

      <InstructorSummary instructor={instructor} />

      <div className='space-y-6'>
        <div className='space-y-6'>
          <section className='space-y-4'>
            <div>
              <OfferingPicker
                loading={courseQueries.some(query => query.isLoading)}
                offerings={offerings}
                offering={selectedOffering}
                onOfferingChange={setSelectedOffering}
                selectedOffering={selectedOfferingDetails}
                categories={[]}
                categoriesLoading={false}
                programCategoryUuid=''
                onProgramCategoryChange={() => undefined}
                title=''
                showInstructor={false}
                showCategory={false}
                titleLabel=''
                titleHint=''
              />
            </div>
          </section>

          <section className='space-y-4'>
            <div>
              <ServiceCards
                value={serviceKey}
                onChange={handleServiceChange}
                rateCard={rateCard}
                delivery={delivery}
                rateBasis={rateBasis}
              />
            </div>
          </section>

          <section className='space-y-4'>
            <LocationVenue
              delivery={delivery}
              onDeliveryChange={setDelivery}
              meetingLink={meetingLink}
              onMeetingLinkChange={setMeetingLink}
              locationName={locationName}
              onLocationNameChange={setLocationName}
              locationLatitude={locationLatitude}
              onLocationLatitudeChange={setLocationLatitude}
              locationLongitude={locationLongitude}
              onLocationLongitudeChange={setLocationLongitude}
              venueUuid=''
              onVenueChange={() => undefined}
              venueResources={[]}
              onlyAvailable
              onOnlyAvailableChange={() => undefined}
              showVenue={false}
            />
          </section>

          <section className='space-y-4'>
            <h2 className='text-foreground text-base font-semibold'>Select schedule options</h2>
            <div className='space-y-5'>
              <ScheduleModeCards value={scheduleMode} onChange={setScheduleMode} />
              {scheduleMode === 'pick' ? (
                <PickDatesPanel
                  pickedDates={pickedDates}
                  onPickedDatesChange={setPickedDates}
                  sortedPickedDates={pickedDates
                    .slice()
                    .sort((left, right) => left.getTime() - right.getTime())}
                  pickMonth={pickMonth}
                  onPickMonthChange={setPickMonth}
                  sessionStart={pickStart}
                  onSessionStartChange={setPickStart}
                  sessionEnd={pickEnd}
                  onSessionEndChange={setPickEnd}
                  timezone={timezone}
                  onTimezoneChange={() => undefined}
                />
              ) : (
                <StandardSchedule
                  days={days}
                  onDayChange={(day, patch) =>
                    setDays(current => ({ ...current, [day]: { ...current[day], ...patch } }))
                  }
                  repeatEvery={repeatEvery}
                  onRepeatEveryChange={setRepeatEvery}
                  repeatUnit={repeatUnit}
                  onRepeatUnitChange={setRepeatUnit}
                  startDate={startDate}
                  onStartDateChange={setStartDate}
                  endDate={endDate}
                  onEndDateChange={setEndDate}
                  regStart=''
                  onRegStartChange={() => undefined}
                  regEnd=''
                  onRegEndChange={() => undefined}
                  continuousReg={false}
                  onContinuousRegChange={() => undefined}
                  timezone={timezone}
                  onTimezoneChange={() => undefined}
                  totalSessions={upcomingSessions.length}
                />
              )}
            </div>
          </section>

          <section className='space-y-4'>
            <h2 className='text-foreground text-base font-semibold'>Upcoming sessions</h2>
            <div>
              <UpcomingSessions sessions={upcomingSessions} />
            </div>
          </section>

          <section className='space-y-4'>
            <h2 className='text-foreground text-base font-semibold'>Instructor schedule</h2>
            <div className='space-y-4'>
              {existingSchedule.length ? (
                <ClassScheduleCalendar
                  schedules={
                    existingSchedule as unknown as Parameters<
                      typeof ClassScheduleCalendar
                    >[0]['schedules']
                  }
                />
              ) : (
                <p className='text-muted-foreground text-sm'>
                  No existing classes are currently on this instructor&apos;s calendar.
                </p>
              )}
              <ResourceConflictAlert
                title="Your currently selected sessions overlap the instructor's current class schedule"
                conflicts={conflicts}
              />
            </div>
          </section>

          <section className='space-y-4'>
            <h2 className='text-foreground text-base font-semibold'>Eligibility check</h2>
            <div className='space-y-4'>
              <div className='flex items-start gap-3'>
                <CheckCircle2
                  className={
                    eligibilityReady
                      ? 'text-success mt-0.5 size-5'
                      : 'text-destructive mt-0.5 size-5'
                  }
                />
                <div>
                  <p className='text-sm font-medium'>
                    Age requirement: {formatAgeRange(lowerAge, upperAge)}
                  </p>
                  <p
                    className={
                      eligibilityReady
                        ? 'text-muted-foreground mt-1 text-xs'
                        : 'text-destructive mt-1 text-xs'
                    }
                  >
                    {ageKnown
                      ? `Your profile age is ${age}. ${ageEligible ? 'You meet this requirement.' : 'You do not meet this requirement.'}`
                      : 'Add a date of birth to your profile before booking this course.'}
                  </p>
                </div>
              </div>
              <Separator />
              <div className='flex items-start gap-3'>
                <ShieldCheck className='text-muted-foreground mt-0.5 size-5' />
                <div className='flex-1'>
                  <p className='text-sm font-medium'>Course materials</p>
                  {studentRequirements.length ? (
                    <div className='mt-2 space-y-2'>
                      {studentRequirements.map(requirement => (
                        <label key={requirement.uuid} className='flex items-start gap-2 text-sm'>
                          <Checkbox
                            checked={Boolean(requirementsChecked[requirement.uuid])}
                            onCheckedChange={checked =>
                              setRequirementsChecked(current => ({
                                ...current,
                                [requirement.uuid]: checked === true,
                              }))
                            }
                          />
                          <span>
                            {requirement.name}
                            {requirement.is_mandatory ? (
                              <span className='text-destructive'> · required</span>
                            ) : null}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className='text-muted-foreground mt-1 text-xs'>
                      No student-provided materials are required.
                    </p>
                  )}
                </div>
              </div>
              <label className='flex items-start gap-2 text-sm'>
                <Checkbox
                  checked={termsOk}
                  onCheckedChange={checked => setTermsOk(checked === true)}
                />
                <span>I agree to the selected schedule, location, and booking terms.</span>
              </label>
            </div>
          </section>
        </div>

        <aside className='pt-1'>
          <Card>
            <CardHeader>
              <CardTitle>Send booking request</CardTitle>
            </CardHeader>
            <CardContent className='space-y-5'>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Course</span>
                  <span className='max-w-48 text-right font-medium'>
                    {selectedCourse?.name || 'Not selected'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Service</span>
                  <span className='font-medium'>{serviceKey}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Sessions</span>
                  <span className='font-medium'>{upcomingSessions.length}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Total hours</span>
                  <span className='font-medium'>{totalHours.toFixed(1)}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Rate</span>
                  <span className='font-medium'>
                    {formatMoney(rate, rateCard?.currency)} / hour
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Estimated total</span>
                  <span className='font-semibold'>
                    {formatMoney(totalAmount, rateCard?.currency ?? 'KES')}
                  </span>
                </div>
              </div>
              <Separator />

              <p className='text-muted-foreground text-xs'>
                A booking request will be sent to the instructor. Payment is only requested after
                the booking is accepted.
              </p>
              <Button
                type='button'
                size='lg'
                className='w-full'
                disabled={
                  isSubmitting ||
                  !instructorId ||
                  !selectedCourseUuid ||
                  !upcomingSessions.length ||
                  conflicts.length > 0
                }
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  'Sending request…'
                ) : (
                  <>
                    <CalendarDays className='mr-2 size-4' />
                    Send booking request
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
