'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getCoursesByInstructorOptions } from '@/services/client/@tanstack/react-query.gen';
import type { SearchInstructor } from '@/src/features/dashboard/courses/types';
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
  Wallet
} from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

type Props = {
  instructor: SearchInstructor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const serviceOptions = [
  { id: 'one-on-one', label: '1-on-1 Session', price: 1500, description: 'KSh 1,500 / session' },
  {
    id: 'group',
    label: 'Group Session (2-5 people)',
    price: 1200,
    description: 'KSh 1,200 / person',
  },
  { id: 'course', label: 'Online Course', price: 5000, description: 'KSh 5,000 / course' },
];

const timeSlots = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
];

const durations = ['30 mins', '1 Hour', '2 Hours'];

const paymentMethods = [
  {
    id: 'skills-fund',
    label: 'Skills Fund',
    description: 'Pay using your Skills Wallet',
    icon: Wallet,
  },
  {
    id: 'm-pesa',
    label: 'M-Pesa',
    description: 'Pay via M-Pesa',
    icon: Phone,
  },
  {
    id: 'card',
    label: 'Card',
    description: 'Visa, Mastercard, etc.',
    icon: CreditCard,
  },
];

const stepItems = ['Service Details', 'Schedule', 'Payment', 'Confirm'];

function getLocation(instructor: SearchInstructor) {
  return instructor.formatted_location || instructor.location?.city || 'Nairobi, Kenya';
}

function getTopSkills(instructor: SearchInstructor) {
  return instructor.specializations
    .map(skill => skill.skill_name)
    .filter((skill, index, array) => skill && array.indexOf(skill) === index)
    .slice(0, 3);
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

function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(amount);
}

export function InstructorHireModal({ instructor, open, onOpenChange }: Props) {
  const [selectedService, setSelectedService] = useState(serviceOptions[0].id);
  const [selectedTime, setSelectedTime] = useState('02:00 PM');
  const [selectedPayment, setSelectedPayment] = useState('skills-fund');

  const [selectedDuration, setSelectedDuration] = useState('1 Hour');
  const [selectedCourseUuid, setSelectedCourseUuid] = useState<string>('');
  const [hireNotes, setHireNotes] = useState('');
  const [sessionType, setSessionType] = useState<'online' | 'physical'>('online');

  const { data: instructorCourses } = useQuery({
    ...getCoursesByInstructorOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: !!instructor?.uuid,
  });

  const allowedCourses = useMemo(
    () => instructorCourses?.data?.content ?? [],
    [instructorCourses]
  );

  const selectedServiceOption = useMemo(
    () => serviceOptions.find(option => option.id === selectedService) ?? serviceOptions[0],
    [selectedService]
  );

  const matchScore = Math.min(
    99,
    60 +
    Math.min(20, Math.round((instructor?.rating ?? 4.4) * 4)) +
    Math.min(10, Math.round((instructor?.total_experience_years ?? 0) * 1.2)) +
    (instructor?.admin_verified ? 7 : 0) +
    (instructor?.is_profile_complete ? 5 : 0)
  );

  const selectedCourse = useMemo(
    () =>
      allowedCourses.find(course => course.uuid === selectedCourseUuid) ??
      allowedCourses[0] ??
      null,
    [allowedCourses, selectedCourseUuid]
  );

  const selectedCourseLabel = selectedCourse ? getCourseLabel(selectedCourse) : 'No course selected';
  const reviewCount = instructor?.review_count ?? Math.max(18, Math.round(((instructor?.rating ?? 4.8) || 4.8) * 25));

  useEffect(() => {
    if (!open || !instructor) {
      return;
    }

    if (!allowedCourses.length) {
      setSelectedCourseUuid('');
      return;
    }

    const currentSelectionIsValid = allowedCourses.some(course => course.uuid === selectedCourseUuid);
    if (!currentSelectionIsValid) {
      setSelectedCourseUuid(allowedCourses[0]?.uuid ?? '');
    }
  }, [allowedCourses, instructor, open, selectedCourseUuid]);

  useEffect(() => {
    if (!open) {
      setHireNotes('');
    }
  }, [open]);

  if (!instructor) return null;

  const topSkills = getTopSkills(instructor);
  const totalAmount = selectedServiceOption.price;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[92vh] max-w-[calc(100vw-1rem)] overflow-hidden rounded-[20px] p-0 sm:max-w-5xl lg:max-w-6xl'>
        <div className='flex max-h-[92vh] flex-col'>
          <DialogHeader className='border-border/60 border-b px-4 py-4 sm:px-5'>
            <DialogTitle className='text-[1.1rem] font-semibold sm:text-[1.25rem]'>
              Hire {instructor.full_name || 'Instructor'}
            </DialogTitle>
          </DialogHeader>

          <div className='flex gap-4 overflow-y-auto p-5 mb-20'>
            <div className='min-w-0 space-y-4'>
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
                        <h2 className='flex flex-row gap-2 items-center text-[1.05rem] font-semibold sm:text-[1.25rem]'>
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
                        {topSkills.map(skill => (
                          <Badge key={skill} variant='outline' className='rounded-full px-2.5 py-1 text-[11px]'>
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      <div className='flex flex-wrap items-center gap-2 text-sm'>
                        <span className='text-warning inline-flex items-center gap-1 font-semibold'>
                          <Star className='size-4 fill-current' />
                          {(instructor.rating ?? 4.8).toFixed(1)}
                        </span>
                        <span className='text-muted-foreground'>
                          {reviewCount} reviews
                        </span>
                      </div>
                    </div>
                  </div>

                  <Card className='w-full max-w-[190px] rounded-[18px] border bg-background p-4 shadow-none sm:max-w-[300px] h-auto'>
                    <div className='space-y-2'>
                      <p className='text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground'>
                        AI Match Score
                      </p>
                      <div className='flex items-center gap-3'>
                        <div className="grid size-[72px] place-items-center rounded-full"
                          style={{
                            background: `conic-gradient(
      color-mix(in srgb, var(--success) 85%, var(--background)) 0 ${matchScore}%,
      color-mix(in srgb, var(--border) 60%, var(--background)) ${matchScore}% 100%
    )`,
                          }}
                        >
                          <div className="grid size-[58px] place-items-center rounded-full bg-card text-center">
                            <div>
                              <div className="text-[0.95rem] font-semibold leading-none text-foreground">
                                {matchScore}%
                              </div>
                              <div className="mt-0.5 text-[0.55rem] uppercase tracking-wide text-muted-foreground">
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
              <div className='flex items-center'>
                {stepItems.map((step, index) => {
                  const isActive = index === 0;
                  const isCompleted = index < 0; // update when you have currentStep state

                  return (
                    <div key={step} className='flex items-center w-full'>
                      {/* STEP */}
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
                            'text-xs font-medium whitespace-nowrap',
                            isActive ? 'text-foreground' : 'text-muted-foreground',
                          ].join(' ')}
                        >
                          {step}
                        </span>
                      </div>

                      {/* CONNECTOR LINE */}
                      {index !== stepItems.length - 1 && (
                        <div className='flex-1 mx-3 h-[2px] bg-border relative'>
                          <div
                            className={`absolute left-0 top-0 h-full ${isCompleted ? 'bg-primary w-full' : 'w-0'
                              }`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_1fr]'>
                <div className='bg-card mt-4'>
                  <h3 className='text-sm font-semibold sm:text-base'>Select Service</h3>
                  <div className='mt-4 grid gap-3 md:grid-cols-3'>
                    {serviceOptions.map(option => {
                      const active = option.id === selectedService;

                      return (
                        <button
                          key={option.id}
                          type='button'
                          onClick={() => setSelectedService(option.id)}
                          className={[
                            'rounded-[14px] border px-3 py-3 text-left transition-colors',
                            active ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-accent',
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
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <Card className='bg-card border-none shadow-none'>
                    <div className='flex'>
                      <div className='space-y-4'>
                        <div>
                          <h3 className='text-sm font-semibold sm:text-base'>Session Details</h3>
                        </div>

                        <div className='grid gap-3 sm:grid-cols-2'>
                          {/* COURSE / TOPIC */}
                          <div className='space-y-1.5'>
                            <p className='text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
                              Subject / Topic
                            </p>
                            <Select
                              value={selectedCourseUuid}
                              onValueChange={setSelectedCourseUuid}
                              disabled={!allowedCourses.length}
                            >
                              <SelectTrigger className='h-10 rounded-[12px] text-sm'>
                                <SelectValue
                                  placeholder={
                                    allowedCourses.length
                                      ? 'Select course'
                                      : 'No approved courses available'
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {allowedCourses.map(course => (
                                  <SelectItem key={course.uuid ?? course.name} value={course.uuid ?? course.name}>
                                    {getCourseLabel(course)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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

                          {/* SESSION TYPE */}
                          <div className='space-y-1.5'>
                            <p className='text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
                              Session Type
                            </p>
                            <div className='grid grid-cols-2 gap-2'>
                              <button
                                type='button'
                                onClick={() => setSessionType('online')}
                                className={[
                                  'flex items-center justify-center gap-2 rounded-[14px] border px-3 py-2.5 text-sm transition',
                                  sessionType === 'online'
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border bg-background hover:bg-accent',
                                ].join(' ')}
                              >
                                <Laptop className='size-4' />
                                Online
                              </button>

                              <button
                                type='button'
                                onClick={() => setSessionType('physical')}
                                className={[
                                  'flex items-center justify-center gap-2 rounded-[14px] border px-3 py-2.5 text-sm transition',
                                  sessionType === 'physical'
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border bg-background hover:bg-accent',
                                ].join(' ')}
                              >
                                <MapPin className='size-4' />
                                Physical
                              </button>
                            </div>
                          </div>

                          {/* DURATION */}
                          <div className='space-y-1.5 sm:col-span-2'>
                            <p className='text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
                              Duration
                            </p>
                            <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                              <SelectTrigger className='h-10 rounded-[12px] text-sm'>
                                <SelectValue placeholder='Select duration' />
                              </SelectTrigger>
                              <SelectContent>
                                {durations.map(duration => (
                                  <SelectItem key={duration} value={duration}>
                                    {duration}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className='grid gap-3 md:grid-cols-[minmax(0,1fr)_1fr]'>
                          <Card className='rounded-[14px] border bg-background p-3 shadow-none'>
                            <div className='mb-3 flex items-center justify-between text-xs font-medium text-muted-foreground'>
                              <span>May 2025</span>
                              <span>Tue, 20 May 2025</span>
                            </div>
                            <div className='grid grid-cols-7 gap-1 text-center text-[11px]'>
                              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                <span key={day} className='py-1 text-muted-foreground'>
                                  {day}
                                </span>
                              ))}
                              {['', '', '', '', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31'].map(
                                (day, index) => (
                                  <button
                                    key={`${day}-${index}`}
                                    type='button'
                                    className={[
                                      'aspect-square rounded-md text-[11px] transition-colors',
                                      day === '20'
                                        ? 'bg-primary text-primary-foreground'
                                        : day
                                          ? 'hover:bg-accent'
                                          : 'cursor-default opacity-0',
                                    ].join(' ')}
                                  >
                                    {day}
                                  </button>
                                )
                              )}
                            </div>
                          </Card>

                          <Card className='rounded-[14px] border bg-background p-3 shadow-none'>
                            <div className='mb-3 text-xs font-medium text-muted-foreground'>
                              Available Time Slots
                            </div>
                            <div className='flex flex-wrap gap-2'>
                              {timeSlots.map(slot => (
                                <button
                                  key={slot}
                                  type='button'
                                  onClick={() => setSelectedTime(slot)}
                                  className={[
                                    'rounded-lg border px-3 py-2 text-xs transition-colors',
                                    slot === selectedTime
                                      ? 'border-primary bg-primary text-primary-foreground'
                                      : 'border-border bg-background hover:bg-accent',
                                  ].join(' ')}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          </Card>
                        </div>

                        <div className='space-y-1.5'>
                          <Label htmlFor='hire-notes' className='text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground'>
                            Your Notes (Optional)
                          </Label>
                          <Textarea
                            id='hire-notes'
                            value={hireNotes}
                            onChange={event => setHireNotes(event.target.value)}
                            className='min-h-24 rounded-[14px] text-sm'
                            placeholder='Add any specific requirements, goals, or context for this booking...'
                            maxLength={500}
                          />
                          <p className='text-right text-xs text-muted-foreground'>{hireNotes.length}/500</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className='rounded-md border bg-success/5 p-4 shadow-none'>
                  <h3 className='text-sm font-semibold sm:text-base'>Booking Summary</h3>
                  <div className='mt-4 space-y-3 text-sm'>
                    <SummaryRow label='Service' value={selectedServiceOption.label} />
                    <SummaryRow label='Subject / Topic' value={selectedCourseLabel} />
                    <SummaryRow label='Date' value='Tue, 20 May 2025' />
                    <SummaryRow label='Time' value='02:00 PM - 03:00 PM' />
                    <SummaryRow label='Duration' value='1 Hour' />
                    <SummaryRow label='Notes' value={hireNotes.trim() || 'No notes added'} />
                    <Separator className='my-2' />
                    <SummaryRow label='Total Amount' value={`KSh ${formatAmount(totalAmount)}`} strong />
                  </div>

                  <div className='bg-success/5 shadow-none'>
                    <h3 className='text-sm font-semibold sm:text-base'>Payment Method</h3>
                    <div className='mt-3 space-y-2'>
                      {paymentMethods.map(method => (
                        <button
                          key={method.id}
                          type='button'
                          onClick={() => setSelectedPayment(method.id)}
                          className={[
                            'flex w-full items-center justify-between gap-3 rounded-md border px-3 py-3 text-left transition-colors',
                            method.id === selectedPayment
                              ? 'border-primary bg-primary/5'
                              : 'border-border bg-background hover:bg-accent',
                          ].join(' ')}
                        >
                          <div className='flex items-center gap-3'>
                            <div
                              className={[
                                'flex size-9 items-center justify-center rounded-xl',
                                method.id === selectedPayment
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-muted text-muted-foreground',
                              ].join(' ')}
                            >
                              <method.icon className='size-4' />
                            </div>
                            <div>
                              <p className='text-sm font-medium'>{method.label}</p>
                              <p className='text-muted-foreground text-xs'>{method.description}</p>
                            </div>
                          </div>
                          <div
                            className={[
                              'flex size-4 items-center justify-center rounded-full border transition',
                              method.id === selectedPayment
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground',
                            ].join(' ')}
                          >
                            {method.id === selectedPayment && (
                              <Check className='size-3 text-white' strokeWidth={3} />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Card className='rounded-[18px] border bg-success/10 p-4 shadow-none'>
                    <div className='flex items-start gap-3'>
                      <CheckCircle2 className='text-success mt-0.5 size-4' />
                      <div className='text-sm'>
                        <p className='text-success font-medium'>You will be charged KSh 1,500</p>
                        <p className='text-success/80 mt-1'>Remaining Balance: KSh 18,500</p>
                      </div>
                    </div>
                  </Card>
                </Card>
              </div>

              <Card className='rounded-md border bg-card p-4 shadow-none'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4'>
                  <div className='text-sm'>
                    <div className='text-success flex items-center gap-2 font-medium'>
                      <CheckCircle2 className='size-4' />
                      Secure Booking
                    </div>
                    <p className='text-muted-foreground mt-1 text-xs sm:text-sm'>
                      Your payment is protected with 256-bit SSL encryption.
                    </p>
                  </div>

                  <div className='flex flex-col gap-2 sm:flex-row'>
                    <Button type='button' variant='outline' className='h-10 rounded-xl px-5' onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button type='button' variant='success' className='h-10 rounded-xl px-5'>
                      <Sparkles className='size-4' />
                      Confirm & Hire Now
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
    <div className='flex items-center justify-between gap-3'>
      <span className='text-muted-foreground'>{label}</span>
      <span className={strong ? 'font-semibold' : 'font-medium'}>{value}</span>
    </div>
  );
}

function PaymentRow({
  icon: Icon,
  label,
  description,
  active = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  active?: boolean;
}) {
  return (
    <button
      type='button'
      className={[
        'flex w-full items-center justify-between gap-3 rounded-[14px] border px-3 py-3 text-left transition-colors',
        active ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-accent',
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
          <p className='text-sm font-medium'>{label}</p>
          <p className='text-muted-foreground text-xs'>{description}</p>
        </div>
      </div>
      <div
        className={[
          'size-4 rounded-full border',
          active ? 'border-primary bg-primary' : 'border-muted-foreground',
        ].join(' ')}
      />
    </button>
  );
}
