'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStudent } from '@/context/student-context';
import useInstructorClassesWithDetails from '@/hooks/use-instructor-classes';
import { getInstructorCalendarOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { Award, BookOpen, Briefcase, Calendar, CheckCircle, DollarSign, MapPin, Star, Users, Video, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { AvailabilityData, ClassScheduleItem, convertToCalendarEvents } from '../../@instructor/availability/components/types';
import TimetableManager from '../../@instructor/trainings/timetable/timetable-manager';
import type { Booking } from '../browse-courses/instructor/page';

type Props = {
  instructor: any;
  onClose: () => void;
  onBookingComplete: (booking: Booking) => void;
};

export const InstructorProfileComponent: React.FC<Props> = ({ instructor, onClose, onBookingComplete }) => {
  const student = useStudent();
  const [showBooking, setShowBooking] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  const [transformedSlots, setTransformedSlots] = useState<any[]>([]);

  // const { data: availabilitySlots, refetch } = useQuery(
  //   getInstructorAvailabilityOptions({ path: { instructorUuid: instructor?.uuid as string } })
  // );

  const { data: timetable } = useQuery({
    ...getInstructorCalendarOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: { start_date: '2024-09-10' as any, end_date: '2026-11-11' as any },
    }),
    enabled: !!instructor?.uuid,
  });

  const instructorSchedule = timetable?.data ?? []

  const [availabilityData, setAvailabilityData] = useState<AvailabilityData>({
    // slots: transformedSlots as any,
    // events: [],
    events: convertToCalendarEvents(instructorSchedule as ClassScheduleItem[]),
    settings: {
      timezone: 'UTC',
      autoAcceptBookings: false,
      bufferTime: 15,
      workingHours: {
        start: '08:00',
        end: '18:00',
      },
    },
  });

  useEffect(() => {
    const eventsFromSchedule = timetable?.data
      ? convertToCalendarEvents(timetable.data as ClassScheduleItem[])
      : [];

    setAvailabilityData((prev: any) => ({
      ...prev,
      events: eventsFromSchedule,
    }));
  }, [timetable?.data]);

  // useEffect(() => {
  //   if (availabilitySlots?.data) {
  //     const slots = transformAvailabilityArray(availabilitySlots.data);
  //     setTransformedSlots(slots);

  //     setAvailabilityData((prev: any) => ({
  //       ...prev,
  //       slots,
  //     }));
  //   }
  // }, [availabilitySlots?.data]);

  const { classes: classesWithCourseAndInstructor } = useInstructorClassesWithDetails(
    instructor?.uuid as string
  );

  // const bookInstructor = useMutation(bookInstructorSlotMutation());

  const handleBooking = () => {
    if (!instructor?.uuid || !student?.uuid || !startTime || !endTime) return;

    const utcStartTime = new Date(startTime).toISOString();
    const utcEndTime = new Date(endTime).toISOString();

    // bookInstructor.mutate(
    //   {
    //     path: { instructorUuid: instructor.uuid },
    //     body: {
    //       instructor_uuid: instructor.uuid,
    //       student_uuid: student.uuid,
    //       start_time: utcStartTime as any,
    //       end_time: utcEndTime as any,
    //       purpose: reason,
    //     },
    //   },
    // {
    //   onSuccess: (booking: Booking) => {
    //     onBookingComplete(booking);
    //     setShowBooking(false);
    //   },
    // }
    // );
  };

  return (
    <div className='overflow-y-auto w-full max-w-7xl relative self-center mx-auto'>
      <Button
        variant='ghost'
        size='sm'
        onClick={onClose}
        className='absolute top-4 right-4 h-8 w-8 p-0 z-10 bg-primary text-white dark:text-black'
      >
        <X className='h-6 w-6' />
      </Button>

      <div className='space-y-6 pr-6 pt-6'>
        {/* Header */}
        <div className='flex items-start gap-6'>
          <Avatar className='h-24 w-24'>
            <AvatarImage src={instructor.profileImage} alt={instructor.name} />
            <AvatarFallback>{instructor?.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className='flex-1'>
            <div className='flex items-start justify-between'>
              <div>
                <div className='mb-1 flex items-center gap-2'>
                  <h2>{instructor?.full_name}</h2>
                </div>
                <p className='text-muted-foreground'>{instructor?.professional_headline}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className='mt-4 flex flex-wrap items-center gap-4'>
              <div className='flex items-center gap-1'>
                <Star className='h-4 w-4 fill-yellow-500 text-yellow-500' />
                <span>x reviews</span>
              </div>
              <div className='text-muted-foreground flex items-center gap-1'>
                <Users className='h-4 w-4' />
                <span>xx students</span>
              </div>
              <div className='text-muted-foreground flex items-center gap-1'>
                <Briefcase className='h-4 w-4' />
                <span>xx years experience</span>
              </div>
              {instructor?.has_location_coordinates && (
                <div className='text-muted-foreground flex items-center gap-1'>
                  <MapPin className='h-4 w-4' />
                  <span>City, Country</span>
                </div>
              )}
            </div>

            {/* Mode badges */}
            <div className='mt-3 flex gap-2'>
              <Badge variant='secondary' className='gap-1'>
                <Video className='h-3 w-3' />
                Online / Onsite
              </Badge>
            </div>
          </div>
        </div>

        {/* Book Button */}
        <div className='flex justify-end'>
          <Button onClick={() => setShowBooking(true)} size='lg' className='flex items-center gap-2'>
            <Calendar className='h-4 w-4' />
            Book Session
          </Button>
        </div>

        {/* Booking Form */}
        {showBooking && (
          <Card className="max-w-md mx-auto mt-6">
            <CardHeader>
              <CardTitle>Book a Time Slot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row sm:space-x-4">
                  <div className="flex flex-col">
                    <label className="mb-1">Start Time</label>
                    <Input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col mt-4 sm:mt-0">
                    <label className="mb-1">End Time</label>
                    <Input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col mt-4 sm:mt-0">
                  <label className="mb-1">Purpose</label>
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleBooking} className="w-full sm:w-auto">
                Book
              </Button>
            </CardFooter>
          </Card>
        )}

        {showBooking && <>
          <TimetableManager
            availabilityData={availabilityData || []}
            onAvailabilityUpdate={setAvailabilityData}
          />

        </>}

        {/* Content Tabs */}
        <Tabs defaultValue='overview' className='w-full'>
          <TabsList className='flex flex-row gap-4' >
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='reviews'>Reviews ({reviews.length})</TabsTrigger>
            <TabsTrigger value='certifications'>Certifications</TabsTrigger>
            <TabsTrigger value='rates'>Rates</TabsTrigger>
          </TabsList>

          <div className="relative">
            {/* Overview Tab */}
            <TabsContent value='overview' className='space-y-6'>
              {/* Bio */}
              <Card className='p-6'>
                <h3 className='mb-3'>About</h3>
                <div className='text-muted-foreground'>
                  <RichTextRenderer htmlString={instructor.bio} />
                </div>
              </Card>

              {/* Skills */}
              <Card className='p-6'>
                <h3 className='mb-3'>Skills & Expertise</h3>
                <div className='flex flex-wrap gap-2'>
                  {skills.map(skill => (
                    <Badge key={skill} variant='secondary'>{skill}</Badge>
                  ))}
                </div>
              </Card>

              {/* Specializations */}
              <Card className='p-6'>
                <h3 className='mb-3'>Specializations</h3>
                <div className='flex flex-wrap gap-2'>
                  {specializations.map(spec => (
                    <Badge key={spec} variant='outline'>{spec}</Badge>
                  ))}
                </div>
              </Card>

              {/* Classes */}
              <Card className="mb-6 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Available Instructor Classes</CardTitle>
                  <Badge variant="secondary">{classesWithCourseAndInstructor?.length || 0} Classes</Badge>
                </div>

                {classesWithCourseAndInstructor?.length > 0 ? (
                  <div className="divide-y divide-border rounded-md">
                    {classesWithCourseAndInstructor.map(course => (
                      <div key={course?.uuid} className="flex items-start gap-3 p-4 transition hover:bg-secondary dark:hover:bg-muted">
                        <CheckCircle className="mt-1 h-5 w-5 text-green-600" />
                        <div className="flex flex-col">
                          <div>
                            <p className="font-medium">{course?.title}</p>
                            <p className="text-sm text-muted-foreground">0% enrollment</p>
                          </div>
                          <div className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span>{course?.course?.name}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <BookOpen className="mb-3 h-8 w-8 text-muted-foreground" />
                    <h4 className="text-lg font-medium">No Classes Available</h4>
                    <p className="mt-1 text-sm">This instructor hasn’t created any classes yet.</p>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-4">
              {Array.isArray(reviews) && reviews.length > 0 ? (
                reviews.map((review) => (
                  <Card key={review.id} className="transition hover:bg-muted/60">
                    <CardContent className="flex flex-col gap-3 p-6">
                      {/* Reviewer Header */}
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={review.studentImage} alt={review.studentName} />
                          <AvatarFallback>
                            {review.studentName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className='flex flex-row items-center justify-between' >
                            <p className="font-medium text-foreground">{review.studentName}</p>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating
                                    ? 'fill-yellow-500 text-yellow-500'
                                    : 'text-muted-foreground'
                                    }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <BookOpen className="h-4 w-4" />
                            {review.course}
                            <span className="text-muted-foreground">•</span>
                            <Calendar className="h-4 w-4" />
                            {review.date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Comment */}
                      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                        {review.comment}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Star className="mb-4 h-10 w-10 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No Reviews Yet</h3>
                  <p className="mt-1 text-sm">
                    This instructor hasn’t received any reviews yet.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Certifications Tab */}
            <TabsContent value='certifications' className='space-y-4'>
              {Array.isArray(certifications) && certifications.length > 0 ? (
                certifications.map(cert => (
                  <Card key={cert.id}>
                    <CardContent className='p-6'>
                      <div className='flex items-start gap-4'>
                        <div className='rounded-lg bg-primary/10 p-3'>
                          <Award className='h-6 w-6 text-primary' aria-hidden='true' />
                        </div>
                        <div>
                          <h4 className='text-base font-semibold'>{cert.name}</h4>
                          <p className='text-muted-foreground text-sm'>{cert.issuer}</p>
                          <p className='text-muted-foreground mt-1 text-sm'>
                            Issued {cert.year ? cert.year : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className='text-muted-foreground flex flex-col items-center justify-center py-12 text-center'>
                  <Award className='mb-4 h-10 w-10 text-muted-foreground' />
                  <h3 className='text-lg font-semibold'>No Certifications Found</h3>
                  <p className='mt-1 text-sm'>
                    You haven&apos;t earned any certifications for this course yet.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Rates Tab */}
            <TabsContent value='rates' className='space-y-4'>
              <Card className='p-6'>
                <h3 className='mb-4'>Rate Card</h3>
                <div className='space-y-4'>
                  <div className='bg-muted flex items-center justify-between rounded-lg p-4'>
                    <div>
                      <p>Hourly Rate</p>
                      <p className='text-muted-foreground text-sm'>1 hour session</p>
                    </div>
                    <p className='text-2xl'>
                      {/* {instructor.rateCard.currency} ${instructor.rateCard.hourly} */}
                      rate xx
                    </p>
                  </div>

                  <div className='bg-muted flex items-center justify-between rounded-lg p-4'>
                    <div>
                      <p>Half Day</p>
                      <p className='text-muted-foreground text-sm'>4 hours session</p>
                    </div>
                    <p className='text-2xl'>
                      {/* {instructor.rateCard.currency} ${instructor.rateCard.halfDay} */}
                      rate xx
                    </p>
                  </div>

                  <div className='bg-muted flex items-center justify-between rounded-lg p-4'>
                    <div>
                      <p>Full Day</p>
                      <p className='text-muted-foreground text-sm'>8 hours session</p>
                    </div>
                    <p className='text-2xl'>
                      {/* {instructor.rateCard.currency} ${instructor.rateCard.fullDay} */}
                      rate xx
                    </p>
                  </div>
                </div>
              </Card>

              <Card className='mb-6 border-primary/30 bg-primary/10 p-6'>
                <div className='flex gap-3'>
                  <DollarSign className='h-5 w-5 text-primary' />
                  <div>
                    <p className='text-primary'>Pricing Information</p>
                    <p className='mt-1 text-sm text-primary'>
                      All rates are in KES/NAIRA. Custom packages and group discounts are
                      available. Contact instructor for details.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

const skills = ['Python', 'TensorFlow', 'Pandas', 'Scikit-learn', 'SQL', 'Statistics'];
const specializations = ['Data Science', 'Machine Learning', 'Python', 'AI'];
const certifications = [
  { id: 'cert-3', name: 'Deep Learning Specialization', issuer: 'DeepLearning.AI', year: 2020 },
  { id: 'cert-4', name: 'Google Cloud Professional Data Engineer', issuer: 'Google', year: 2021 },
];
const reviews = [
  {
    id: 'review-3',
    studentName: 'Emily Wang',
    studentImage:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    comment: 'Incredibly knowledgeable and explains complex concepts clearly.',
    date: new Date(2024, 8, 10),
    course: 'Data Science',
  },
];
