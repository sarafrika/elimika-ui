'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useStudent } from '@/context/student-context';
import {
  createBookingMutation,
  getCourseByUuidOptions,
  getStudentBookingsQueryKey,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { SearchInstructor } from '@/src/features/dashboard/courses/types';
import { getErrorMessage } from '@/src/features/dashboard/courses/types';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Check,
  CheckCircle2,
  CreditCard,
  Laptop,
  MapPin,
  Phone,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type Props = {
  instructor: SearchInstructor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type BookingService = 'private' | 'group';
type SessionType = 'online' | 'physical';
type PaymentMethod = 'skills-fund' | 'm-pesa' | 'card';

type BookingRateKey =
  | 'private_online_rate'
  | 'private_inperson_rate'
  | 'group_online_rate'
  | 'group_inperson_rate';

const serviceOptions: Array<{
  id: BookingService;
  label: string;
  description: string;
}> = [
    {
      id: 'private',
      label: '1-on-1 Session',
      description: 'Private booking for one learner',
    },
    {
      id: 'group',
      label: 'Group Session',
      description: 'Shared class for multiple learners',
    },
  ];

const timeSlots = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
];

const paymentMethods: Array<{
  id: PaymentMethod;
  label: string;
  description: string;
  icon: typeof Wallet;
}> = [
    {
      id: 'skills-fund',
      label: 'Skills Fund',
      description: 'Pay using your Skills Wallet',
      icon: Wallet,
    },
    {
      id: 'm-pesa',
      label: 'M-Pesa',
      description: 'Pay with mobile money',
      icon: Phone,
    },
    {
      id: 'card',
      label: 'Card',
      description: 'Visa, Mastercard, and more',
      icon: CreditCard,
    },
  ];

const stepItems = ['Service Details', 'Schedule', 'Payment', 'Confirm'];

function getLocation(instructor: SearchInstructor) {
  return instructor.formatted_location || instructor.location?.city || 'Nairobi, Kenya';
}

// function getTopSkills(instructor: SearchInstructor) {
//   return instructor.specializations
//     .map(skill => skill.skill_name)
//     .filter((skill, index, array) => skill && array.indexOf(skill) === index)
//     .slice(0, 3);
// }

function getTopSkills(instructor: SearchInstructor) {
  return {}
}

function getCourseLabel(course: { name?: string; category_names?: Array<string> }) {
  if (course.name?.trim()) {
    return course.name.trim();
  }

  if (course.category_names?.length) {
    return course.category_names[0];
  }

  return 'Untitled course';
}

function formatMoney(amount: number, currency?: string) {
  const resolvedCurrency = currency?.toUpperCase() ?? 'KES';
  const currencyLabel = resolvedCurrency === 'KES' ? 'KSh' : resolvedCurrency;

  return `${currencyLabel} ${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

function resolveRateKey(service: BookingService, sessionType: SessionType): BookingRateKey {
  if (service === 'private') {
    return sessionType === 'online' ? 'private_online_rate' : 'private_inperson_rate';
  }

  return sessionType === 'online' ? 'group_online_rate' : 'group_inperson_rate';
}

function combineDateAndTime(date: Date, timeLabel: string) {
  const [timePart, meridiem] = timeLabel.split(' ');
  const [hourPart, minutePart = '0'] = timePart.split(':');
  let hours = Number(hourPart);
  const minutes = Number(minutePart);

  if (meridiem === 'PM' && hours < 12) {
    hours += 12;
  }

  if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  }

  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function getDurationLabel(hoursPerClass: number) {
  if (hoursPerClass === 1) return '1 hour';
  return `${hoursPerClass} hours`;
}

export function InstructorHireModal({ instructor, open, onOpenChange }: Props) {
  const student = useStudent();
  const queryClient = useQueryClient();
  const createBooking = useMutation(createBookingMutation());

  const [selectedService, setSelectedService] = useState<BookingService>('private');
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType>('online');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('skills-fund');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [hoursPerClass, setHoursPerClass] = useState<number>(1);
  const [selectedCourseUuid, setSelectedCourseUuid] = useState<string>('');
  const [hireNotes, setHireNotes] = useState('');

  const { data: trainingApplications } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        pageable: {},
        searchParams: {
          applicant_uuid_eq: instructor?.uuid as string,
          status: 'approved',
        },
      },
    }),
    enabled: Boolean(instructor?.uuid),
  });

  const approvedApplications = useMemo(() => {
    return (
      trainingApplications?.data?.content?.filter(
        application => application?.applicant_type === 'instructor' && application?.course_uuid
      ) ?? []
    );
  }, [trainingApplications]);

  const courseUuids = useMemo(
    () => Array.from(new Set(approvedApplications.map(application => application.course_uuid).filter(Boolean))),
    [approvedApplications]
  );

  const courseQueries = useQueries({
    queries: courseUuids.map(uuid => ({
      ...getCourseByUuidOptions({
        path: { uuid: uuid as string },
      }),
      enabled: Boolean(uuid),
    })),
  });

  const allowedCourses = useMemo(() => {
    return courseQueries
      .map(query => query.data?.data)
      .filter((course): course is { uuid?: string; name?: string; category_names?: string[] } => Boolean(course));
  }, [courseQueries]);

  const selectedApplication = useMemo(
    () => approvedApplications.find(application => application.course_uuid === selectedCourseUuid),
    [approvedApplications, selectedCourseUuid]
  );

  const selectedCourse = useMemo(
    () => allowedCourses.find(course => course.uuid === selectedCourseUuid) ?? allowedCourses[0] ?? null,
    [allowedCourses, selectedCourseUuid]
  );

  const selectedServiceOption = useMemo(
    () => serviceOptions.find(option => option.id === selectedService) ?? serviceOptions[0],
    [selectedService]
  );

  const selectedRateCard = selectedApplication?.rate_card;
  const selectedRateKey = resolveRateKey(selectedService, selectedSessionType);
  const rateAmount = selectedRateCard?.[selectedRateKey] ?? 0;
  const classInstances = selectedDates.length;
  const totalHours = classInstances * hoursPerClass;
  const perSessionAmount = rateAmount * hoursPerClass;
  const totalAmount = rateAmount * totalHours;
  const currency = selectedRateCard?.currency ?? 'KES';
  const selectedDateLabels = useMemo(
    () =>
      selectedDates
        .slice()
        .sort((left, right) => left.getTime() - right.getTime())
        .map(date =>
          date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        ),
    [selectedDates]
  );

  const reviewCount = instructor?.review_count ?? Math.max(18, Math.round(((instructor?.rating ?? 4.8) || 4.8) * 25));
  const topSkills = getTopSkills(instructor ?? ({} as SearchInstructor));
  const matchScore = Math.min(
    99,
    60 +
    Math.min(20, Math.round((instructor?.rating ?? 4.4) * 4)) +
    Math.min(10, Math.round((instructor?.total_experience_years ?? 0) * 1.2)) +
    (instructor?.admin_verified ? 7 : 0) +
    (instructor?.is_profile_complete ? 5 : 0)
  );

  const currentStep = useMemo(() => {
    const hasServiceDetails = Boolean(selectedCourseUuid && selectedService && selectedSessionType && hoursPerClass > 0);
    const hasSchedule = selectedDates.length > 0 && Boolean(selectedTime);
    const hasPayment = Boolean(selectedPayment);
    const hasSummary = hasServiceDetails && hasSchedule && hasPayment;

    if (!hasServiceDetails) return 1;
    if (!hasSchedule) return 2;
    if (!hasPayment) return 3;
    if (hasSummary) return 4;
    return 1;
  }, [hoursPerClass, selectedCourseUuid, selectedDates.length, selectedPayment, selectedService, selectedSessionType, selectedTime]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const firstCourse = allowedCourses[0]?.uuid ?? '';
    setSelectedCourseUuid(current => {
      if (!current) {
        return firstCourse;
      }

      const currentCourseIsValid = allowedCourses.some(course => course.uuid === current);
      return currentCourseIsValid ? current : firstCourse;
    });
  }, [allowedCourses, open]);

  useEffect(() => {
    if (!open) {
      setHireNotes('');
      setSelectedDates([]);
      setSelectedTime('');
      setHoursPerClass(1);
      setSelectedPayment('skills-fund');
      setSelectedService('private');
      setSelectedSessionType('online');
    }
  }, [open]);

  if (!instructor) {
    return null;
  }

  const confirmDisabled =
    createBooking.isPending ||
    !student?.uuid ||
    !selectedCourseUuid ||
    !selectedApplication ||
    !selectedDates.length ||
    !selectedTime ||
    rateAmount <= 0;

  const handleBookingSubmit = async () => {
    if (!student?.uuid) {
      toast.error('Student profile is required before booking an instructor');
      return;
    }

    if (!selectedApplication) {
      toast.error('Select an approved course before booking');
      return;
    }

    if (!selectedDates.length || !selectedTime) {
      toast.error('Select at least one date and time slot');
      return;
    }

    if (rateAmount <= 0) {
      toast.error('This instructor does not have a valid rate for the selected service');
      return;
    }

    const bookingSlots = selectedDates.map(date => {
      const start = combineDateAndTime(date, selectedTime);
      const end = new Date(start.getTime() + hoursPerClass * 60 * 60 * 1000);

      return { start, end };
    });

    const failures: string[] = [];
    let successCount = 0;

    for (const slot of bookingSlots) {
      try {
        await createBooking.mutateAsync({
          body: {
            student_uuid: student.uuid,
            course_uuid: selectedCourseUuid,
            instructor_uuid: instructor.uuid as string,
            start_time: slot.start.toISOString(),
            end_time: slot.end.toISOString(),
            price_amount: perSessionAmount,
            currency,
            purpose: hireNotes.trim() || undefined,
          },
        });
        successCount += 1;
      } catch (error) {
        failures.push(getErrorMessage(error, 'Failed to create booking request'));
      }
    }

    if (successCount > 0) {
      await queryClient.invalidateQueries({
        queryKey: getStudentBookingsQueryKey({
          path: { studentUuid: student.uuid },
          query: { pageable: {}, status: '' },
        }),
      });
    }

    if (successCount === bookingSlots.length) {
      toast.success(
        bookingSlots.length === 1
          ? 'Booking request created successfully'
          : `${bookingSlots.length} booking requests created successfully`
      );
      onOpenChange(false);
      return;
    }

    if (successCount > 0) {
      toast.error(`${successCount} booking request${successCount === 1 ? '' : 's'} created, ${failures.length} failed`);
      return;
    }

    toast.error(failures[0] || 'Failed to create booking request');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[92vh] max-w-[calc(100vw-1rem)] overflow-hidden rounded-[20px] p-0 sm:max-w-5xl lg:max-w-6xl'>
        <div className='flex max-h-[92vh] flex-col'>
          <DialogHeader className='border-border/60 border-b px-4 py-4 sm:px-5'>
            <DialogTitle className='self-statrt text-start sm:text-center text-[1.1rem] font-semibold sm:text-[1.25rem]'>
              Hire {instructor.full_name || 'Instructor'}
            </DialogTitle>
          </DialogHeader>

          <div className='flex-1 overflow-y-auto p-5'>
            <div className='space-y-8 sm:space-y-4'>
              <div className='bg-card shadow-none'>
                <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                  <div className='flex min-w-0 items-start gap-4'>
                    <Avatar className='size-20 border border-border/60 sm:size-24'>
                      <AvatarImage src={instructor.profile_image_url ?? undefined} alt={instructor.full_name} />
                      <AvatarFallback className='text-lg font-semibold'>
                        {instructor.full_name?.charAt(0) || 'I'}
                      </AvatarFallback>
                    </Avatar>

                    <div className='min-w-0 space-y-2'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Badge className='bg-success/10 border border-success/45 text-success rounded-full px-2.5 text-[11px]'>
                          Available
                        </Badge>
                      </div>

                      <div className='space-y-1'>
                        <h2 className='flex flex-row items-center gap-2 text-[1.05rem] font-semibold sm:text-[1.25rem]'>
                          {instructor.full_name}

                          {instructor.admin_verified ? (
                            <CheckCircle2 className='text-primary size-4' />
                          ) : null}
                        </h2>
                        <p className='text-muted-foreground text-sm sm:text-base'>
                          {instructor.professional_headline || 'Certified Instructor'}
                        </p>
                      </div>

                      <div className='flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm'>
                        <span className='text-muted-foreground inline-flex items-center gap-1.5'>
                          <MapPin className='size-3.5' />
                          {getLocation(instructor)}
                        </span>
                        <span className='text-muted-foreground inline-flex items-center gap-1.5'>
                          <CalendarDays className='size-3.5' />
                          {instructor.total_experience_years || 0}+ years
                        </span>
                      </div>

                      <div className='flex flex-wrap gap-2'>
                        {/* {topSkills.map(skill => (
                          <Badge key={skill} variant='outline' className='rounded-full px-2.5 py-1 text-[11px]'>
                            {skill}
                          </Badge>
                        ))} */}
                      </div>

                      <div className='flex flex-wrap items-center gap-2 text-sm'>
                        <span className='text-warning inline-flex items-center gap-1 font-semibold'>
                          <Star className='size-4 fill-current' />
                          {(instructor.rating ?? 4.8).toFixed(1)}
                        </span>
                        <span className='text-muted-foreground'>{reviewCount} reviews</span>
                      </div>
                    </div>
                  </div>

                  <Card className='h-auto w-full rounded-[18px] border bg-background p-4 shadow-none sm:max-w-[300px]'>
                    <div className='space-y-2'>
                      <p className='text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
                        AI Match Score
                      </p>
                      <div className='flex items-center gap-3'>
                        <div
                          className='grid size-[72px] place-items-center rounded-full'
                          style={{
                            background: `conic-gradient(
                              color-mix(in srgb, var(--success) 85%, var(--background)) 0 ${matchScore}%,
                              color-mix(in srgb, var(--border) 60%, var(--background)) ${matchScore}% 100%
                            )`,
                          }}
                        >
                          <div className='grid size-[58px] place-items-center rounded-full bg-card text-center'>
                            <div>
                              <div className='text-[0.95rem] font-semibold leading-none text-foreground'>
                                {matchScore}%
                              </div>
                              <div className='mt-0.5 text-[0.55rem] uppercase tracking-wide text-muted-foreground'>
                                match
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className='text-foreground text-sm font-semibold'>Excellent match</p>
                        </div>
                      </div>
                      <p className='text-success text-xs'>Great match for your needs!</p>
                      <p className='text-primary text-xs font-medium'>Why this match?</p>
                    </div>
                  </Card>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3 md:flex md:items-center'>
                {stepItems.map((step, index) => {
                  const isActive = index + 1 === currentStep;
                  const isCompleted = index + 1 < currentStep;

                  return (
                    <div
                      key={step}
                      className='flex items-center md:w-full'
                    >
                      <div className='flex items-center gap-2'>
                        <div
                          className={[
                            'flex size-6 items-center justify-center rounded-full text-[11px] font-semibold transition',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : isCompleted
                                ? 'bg-primary/80 text-white'
                                : 'bg-muted text-muted-foreground',
                          ].join(' ')}
                        >
                          {index + 1}
                        </div>

                        <span
                          className={[
                            'text-xs font-medium',
                            isActive
                              ? 'text-foreground'
                              : 'text-muted-foreground',
                          ].join(' ')}
                        >
                          {step}
                        </span>
                      </div>

                      {/* connector line only on desktop */}
                      {index !== stepItems.length - 1 ? (
                        <div className='relative mx-3 hidden h-[2px] flex-1 bg-border md:block'>
                          <div
                            className={[
                              'absolute left-0 top-0 h-full transition-all',
                              isCompleted ? 'w-full bg-primary' : 'w-0',
                            ].join(' ')}
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_400px]'>
                <div className='space-y-4'>
                  <Card className='rounded-[16px] border bg-card p-4 shadow-none'>
                    <div className='space-y-2'>
                      <h3 className='text-sm font-semibold sm:text-base'>Select Service</h3>
                      <p className='text-muted-foreground text-xs sm:text-sm'>
                        Choose the booking format that matches this instructor's approved rate card.
                      </p>
                    </div>

                    <div className='mt-4 grid gap-3 md:grid-cols-2'>
                      {serviceOptions.map(option => {
                        const active = option.id === selectedService;
                        const rateForService = selectedRateCard?.[resolveRateKey(option.id, selectedSessionType)] ?? 0;

                        return (
                          <button
                            key={option.id}
                            type='button'
                            onClick={() => setSelectedService(option.id)}
                            className={[
                              'rounded-[14px] border px-3 py-3 text-left transition-colors',
                              active
                                ? 'border-primary bg-primary/5'
                                : 'border-border bg-background hover:bg-accent',
                            ].join(' ')}
                          >
                            <div className='flex items-start gap-2'>
                              <span
                                className={[
                                  'mt-1 size-3 rounded-full border',
                                  active ? 'border-primary bg-primary' : 'border-muted-foreground',
                                ].join(' ')}
                              />
                              <div className='min-w-0'>
                                <p className='text-sm font-medium'>{option.label}</p>
                                <p className='text-muted-foreground mt-1 text-xs'>{option.description}</p>
                                <p className='text-primary mt-2 text-xs font-medium'>
                                  {rateForService > 0 ? formatMoney(rateForService, currency) : 'Rate unavailable'}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </Card>

                  <Card className='rounded-[16px] border bg-card p-4 shadow-none'>
                    <div className='space-y-4'>
                      <div>
                        <h3 className='text-sm font-semibold sm:text-base'>Session Details</h3>
                        <p className='text-muted-foreground text-xs sm:text-sm'>
                          Pick a course, class days, time slot, and how long each class should last.
                        </p>
                      </div>

                      <div className='grid gap-3 sm:grid-cols-2'>
                        <div className='space-y-1.5 sm:col-span-2'>
                          <p className='text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
                            Approved Course
                          </p>
                          <div className='w-full min-w-0'>
                            <Select
                              value={selectedCourseUuid}
                              onValueChange={setSelectedCourseUuid}
                              disabled={!allowedCourses.length}
                            >
                              <SelectTrigger className='text-start h-10 w-full min-w-0 rounded-md text-sm'>
                                <SelectValue
                                  placeholder={
                                    allowedCourses.length
                                      ? 'Select course'
                                      : 'No approved courses available'
                                  }
                                />
                              </SelectTrigger>

                              <SelectContent className='max-h-72 w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)] overflow-hidden'>
                                {allowedCourses.map(course => (
                                  <SelectItem
                                    key={course.uuid ?? course.name}
                                    value={course.uuid ?? course.name ?? ''}
                                    className='min-w-0'
                                  >
                                    <span className='block w-full truncate'>
                                      {getCourseLabel(course)}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {allowedCourses.length ? (
                            <p className='text-muted-foreground text-xs'>
                              Courses approved for this instructor to train.
                            </p>
                          ) : (
                            <p className='text-warning text-xs'>
                              No approved courses found for this instructor yet.
                            </p>
                          )}
                        </div>

                        <div className='space-y-1.5'>
                          <p className='text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
                            Session Type
                          </p>
                          <div className='grid grid-cols-2 gap-2'>
                            <button
                              type='button'
                              onClick={() => setSelectedSessionType('online')}
                              className={[
                                'flex items-center justify-center gap-2 rounded-[14px] border px-3 py-2.5 text-sm transition',
                                selectedSessionType === 'online'
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border bg-background hover:bg-accent',
                              ].join(' ')}
                            >
                              <Laptop className='size-4' />
                              Online
                            </button>

                            <button
                              type='button'
                              onClick={() => setSelectedSessionType('physical')}
                              className={[
                                'flex items-center justify-center gap-2 rounded-[14px] border px-3 py-2.5 text-sm transition',
                                selectedSessionType === 'physical'
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border bg-background hover:bg-accent',
                              ].join(' ')}
                            >
                              <MapPin className='size-4' />
                              Physical
                            </button>
                          </div>
                        </div>

                        <div className='space-y-1.5'>
                          <p className='text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
                            Hours per Class
                          </p>
                          <Input
                            type='number'
                            min='0.5'
                            step='0.5'
                            value={hoursPerClass}
                            onChange={event => setHoursPerClass(Number(event.target.value) || 0)}
                            className='h-10 rounded-[12px] text-sm'
                          />
                          <p className='text-muted-foreground text-xs'>
                            The final amount uses the rate per hour for each selected class instance.
                          </p>
                        </div>

                        <div className='space-y-1.5 sm:col-span-2'>
                          <Label className='text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
                            Notes
                          </Label>
                          <Textarea
                            value={hireNotes}
                            onChange={event => setHireNotes(event.target.value)}
                            className='min-h-24 rounded-[14px] text-sm'
                            placeholder='Add learning goals, special instructions, or any booking notes...'
                            maxLength={500}
                          />
                          <p className='text-right text-xs text-muted-foreground'>{hireNotes.length}/500</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className='rounded-[16px] border bg-card p-4 shadow-none'>
                    <div className='flex items-center justify-between gap-3'>
                      <div>
                        <h3 className='text-sm font-semibold sm:text-base'>Choose Days</h3>
                        <p className='text-muted-foreground text-xs sm:text-sm'>
                          Select one or more class days from the calendar.
                        </p>
                      </div>
                      <Badge variant='outline' className='rounded-full px-2.5 py-1 text-[11px]'>
                        {selectedDates.length} selected
                      </Badge>
                    </div>

                    <div className='mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]'>
                      <Calendar
                        mode='multiple'
                        selected={selectedDates}
                        onSelect={dates => setSelectedDates(dates ?? [])}
                        disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                        className='w-full rounded-lg border'
                      />

                      <div className='space-y-3 rounded-[14px] border bg-background p-3'>
                        <div>
                          <p className='text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
                            Available Time Slots
                          </p>
                          <p className='text-muted-foreground mt-1 text-xs'>
                            Pick the start time for each selected day.
                          </p>
                        </div>
                        <div className='flex flex-wrap gap-2'>
                          {timeSlots.map(slot => {
                            const active = slot === selectedTime;

                            return (
                              <button
                                key={slot}
                                type='button'
                                onClick={() => setSelectedTime(slot)}
                                className={[
                                  'rounded-lg border px-3 py-2 text-xs transition-colors',
                                  active
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-background hover:bg-accent',
                                ].join(' ')}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>

                        <div className='space-y-2'>
                          <p className='text-xs font-medium text-muted-foreground'>
                            Selected days
                          </p>
                          {selectedDateLabels.length ? (
                            <ul className='space-y-2 text-xs'>
                              {selectedDateLabels.map(label => (
                                <li key={label} className='rounded-md border bg-card px-2.5 py-2'>
                                  {label}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className='text-muted-foreground text-xs'>
                              No dates selected yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className='space-y-4'>
                  <Card className='rounded-[16px] border bg-success/5 p-4 shadow-none'>
                    <h3 className='text-sm font-semibold sm:text-base'>Booking Summary</h3>
                    <div className='mt-4 space-y-3 text-sm'>
                      <SummaryRow label='Instructor' value={instructor.full_name || 'Instructor'} />
                      <SummaryRow label='Service' value={selectedServiceOption.label} />
                      <SummaryRow label='Session type' value={selectedSessionType === 'online' ? 'Online' : 'Physical'} />
                      <SummaryRow label='Course' value={selectedCourse ? getCourseLabel(selectedCourse) : 'No course selected'} />
                      <SummaryRow label='Class days' value={String(classInstances || 0)} />
                      <SummaryRow label='Hours per class' value={getDurationLabel(hoursPerClass)} />
                      <SummaryRow label='Time' value={selectedTime || 'No time selected'} />
                      <SummaryRow label='Notes' value={hireNotes.trim() || 'No notes added'} />
                      <Separator className='my-2' />
                      <SummaryRow
                        label='Rate per hour'
                        value={rateAmount > 0 ? formatMoney(rateAmount, currency) : 'Unavailable'}
                      />
                      <SummaryRow
                        label='Per class amount'
                        value={perSessionAmount > 0 ? formatMoney(perSessionAmount, currency) : 'Unavailable'}
                      />
                      <SummaryRow
                        label='Total booking amount'
                        value={totalAmount > 0 ? formatMoney(totalAmount, currency) : 'Select days to calculate'}
                        strong
                      />
                    </div>
                  </Card>

                  <Card className='rounded-[16px] border bg-card p-4 shadow-none'>
                    <h3 className='text-sm font-semibold sm:text-base'>Payment Method</h3>
                    <div className='mt-3 space-y-2'>
                      {paymentMethods.map(method => {
                        const active = method.id === selectedPayment;
                        const Icon = method.icon;

                        return (
                          <button
                            key={method.id}
                            type='button'
                            onClick={() => setSelectedPayment(method.id)}
                            className={[
                              'flex w-full items-center justify-between gap-3 rounded-[14px] border px-3 py-3 text-left transition-colors',
                              active
                                ? 'border-primary bg-primary/5'
                                : 'border-border bg-background hover:bg-accent',
                            ].join(' ')}
                          >
                            <div className='flex items-center gap-3'>
                              <div
                                className={[
                                  'flex size-9 items-center justify-center rounded-xl',
                                  active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                                ].join(' ')}
                              >
                                <Icon className='size-4' />
                              </div>
                              <div>
                                <p className='text-sm font-medium'>{method.label}</p>
                                <p className='text-muted-foreground text-xs'>{method.description}</p>
                              </div>
                            </div>
                            <div
                              className={[
                                'flex size-4 items-center justify-center rounded-full border transition',
                                active ? 'border-primary bg-primary' : 'border-muted-foreground',
                              ].join(' ')}
                            >
                              {active ? <Check className='size-3 text-white' strokeWidth={3} /> : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <Card className='mt-4 rounded-[18px] border bg-success/10 p-4 shadow-none'>
                      <div className='flex items-start gap-3'>
                        <CheckCircle2 className='text-success mt-0.5 size-4' />
                        <div className='text-sm'>
                          <p className='text-success font-medium'>
                            You will be charged {totalAmount > 0 ? formatMoney(totalAmount, currency) : 'when booking details are complete'}
                          </p>
                          <p className='text-success/80 mt-1'>
                            {classInstances > 0 && hoursPerClass > 0
                              ? `${classInstances} class instance${classInstances === 1 ? '' : 's'} x ${hoursPerClass} hour${hoursPerClass === 1 ? '' : 's'}`
                              : 'Select class days and duration to see the total'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Card>
                </div>
              </div>

              <Card className='rounded-md border bg-card p-4 shadow-none mb-10'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='text-sm'>
                    <div className='text-success flex items-center gap-2 font-medium'>
                      <CheckCircle2 className='size-4' />
                      Secure Booking
                    </div>
                    <p className='text-muted-foreground mt-1 text-xs sm:text-sm'>
                      Your booking will be created using the selected schedule and approved course rate.
                    </p>
                  </div>

                  <div className='flex flex-col gap-2 sm:flex-row'>
                    <Button
                      type='button'
                      variant='destructive'
                      className='h-10 rounded-md px-5'
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type='button'
                      variant='success'
                      className='h-10 rounded-md px-5'
                      onClick={handleBookingSubmit}
                      disabled={confirmDisabled}
                    >
                      {createBooking.isPending ? (
                        <>
                          <Spinner className='size-4' />
                          Creating booking...
                        </>
                      ) : (
                        <>
                          <Sparkles className='size-4' />
                          Confirm & Hire Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span
        className={`truncate max-w-[60%] text-right ${strong ? "font-semibold" : "font-medium"
          }`}
        title={value} // shows full text on hover
      >
        {value}
      </span>
    </div>
  );
}
