'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStudent } from '@/context/student-context';
import useInstructorClassesWithDetails from '@/hooks/use-instructor-classes';
import { createBookingMutation, getInstructorCalendarOptions, getInstructorReviewsOptions, listCatalogItemsOptions, searchTrainingApplicationsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Award, BookOpen, Briefcase, Calendar, CheckCircle, DollarSign, MapPin, Star, Users, Video, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import { AvailabilityData, ClassScheduleItem, convertToCalendarEvents } from '../../@instructor/availability/components/types';
import type { Booking } from '../browse-courses/instructor/page';

type Props = {
  instructor: any;
  onClose: () => void;
  onBookingComplete: (booking: Booking) => void;
};

export const InstructorProfileComponent: React.FC<Props> = ({ instructor, onClose, onBookingComplete }) => {
  const student = useStudent();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  const [showBooking, setShowBooking] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  const { data: timetable } = useQuery({
    ...getInstructorCalendarOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: { start_date: '2024-09-10' as any, end_date: '2026-11-11' as any },
    }),
    enabled: !!instructor?.uuid,
  });

  const instructorSchedule = timetable?.data ?? []

  const [availabilityData, setAvailabilityData] = useState<AvailabilityData>({
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

  const { data: catalogues } = useQuery(listCatalogItemsOptions())
  const { classes: classesWithCourseAndInstructor } = useInstructorClassesWithDetails(
    instructor?.uuid as string
  );

  const filteredClasses = classesWithCourseAndInstructor.filter(cls =>
    catalogues?.data?.some(cat => cat.class_definition_uuid === cls.uuid)
  );

  const { data: reviews } = useQuery({
    ...getInstructorReviewsOptions({ path: { instructorUuid: instructor?.uuid as string } }),
    enabled: !!instructor.uuid,
  })
  const instructorReviews = reviews?.data || [];
  // get students details
  // get enrollment details / class name or course name

  const { data: appliedCourses } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: { pageable: {}, searchParams: { applicant_uuid_eq: instructor?.uuid as string } },
    }),
    enabled: !!instructor?.uuid,
  });

  const matchedCourse = appliedCourses?.data?.content?.find(
    course => course.course_uuid === courseId
  );

  const bookInstructor = useMutation(createBookingMutation());
  const handleBooking = () => {
    if (!instructor?.uuid || !student?.uuid || !startTime || !endTime) return;

    const utcStartTime = new Date(startTime).toISOString();
    const utcEndTime = new Date(endTime).toISOString();

    bookInstructor.mutate(
      {
        body: {
          instructor_uuid: instructor.uuid,
          student_uuid: student.uuid,
          start_time: utcStartTime as any,
          end_time: utcEndTime as any,
          course_uuid: courseId as string,
          currency: "KES",
          price_amount: 100,
          purpose: reason,
        },
      },
      {
        onSuccess: (data: any) => {
          const bookingId = data?.data?.uuid;

          if (typeof bookingId === 'string') {
            const STORAGE_KEY = 'student_booking_ids';

            const existing: string[] = JSON.parse(
              localStorage.getItem(STORAGE_KEY) || '[]'
            );

            if (!existing.includes(bookingId)) {
              existing.push(bookingId);
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
          }

          setShowBooking(false);
        },
      }

    );
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
                <span>{instructorReviews?.length} reviews</span>
              </div>
              <div className='text-muted-foreground flex items-center gap-1'>
                <Users className='h-4 w-4' />
                <span>N/A students</span>
              </div>
              <div className='text-muted-foreground flex items-center gap-1'>
                <Briefcase className='h-4 w-4' />
                <span>{instructor?.total_experience_years} years experience</span>
              </div>
              {instructor?.has_location_coordinates && (
                <div className='text-muted-foreground flex items-center gap-1'>
                  <MapPin className='h-4 w-4' />
                  <span>{instructor?.formatted_location}</span>
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
            <CardFooter className='flex flex-row items-center justify-between'>
              <Button onClick={handleBooking} className="w-full sm:w-auto">
                Book
              </Button>

              <Button onClick={() => setShowBooking(false)} variant={"destructive"} className="w-full sm:w-auto bg:destructive">
                Cancel
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* {showBooking && <>
          <TimetableManager
            availabilityData={availabilityData || []}
            onAvailabilityUpdate={setAvailabilityData}
          />
        </>} */}

        {/* Content Tabs */}
        <Tabs defaultValue='overview' className='w-full'>
          <TabsList className='flex flex-row gap-4' >
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='reviews'>Reviews ({instructorReviews.length})</TabsTrigger>
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
                  {skills?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {skills?.map((skill: any, index: any) => (
                        <Badge key={skill.uuid} variant="outline">
                          {skill.skill_name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No specializations added
                    </p>
                  )}
                </div>
              </Card>

              {/* Specializations */}
              <Card className="p-6">
                <h3 className="mb-3">Specializations</h3>

                {instructor?.specializations?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {instructor?.specializations?.map((spec: any, index: any) => (
                      <Badge key={spec.uuid} variant="outline">
                        {spec.skill_name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No specializations added
                  </p>
                )}
              </Card>


              {/* Classes */}
              <Card className="mb-6 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>

                    <CardTitle className="text-lg font-semibold">Available Instructor Classes</CardTitle>
                    <CardDescription>Classes with catalogues, available for enrollment</CardDescription>
                  </div>
                  <Badge variant="secondary">{filteredClasses?.length || 0} Classe(s)</Badge>
                </div>

                {filteredClasses?.length > 0 ? (
                  <div className="divide-y divide-border rounded-md">
                    {filteredClasses.map(course => (
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
              {Array.isArray(instructorReviews) && instructorReviews.length > 0 ? (
                instructorReviews.map((review: any) => (
                  <Card key={review.uuid} className="transition hover:bg-muted/60">
                    <CardContent className="flex flex-col gap-3 p-6">
                      {/* Reviewer Header */}
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={review.studentImage} alt={review.studentName} />
                          <AvatarFallback>
                            {/* {review.studentName.charAt(0).toUpperCase()} */}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className='flex flex-row items-center justify-between' >
                            <p className="font-medium text-foreground">{review?.studentName || "No name"}</p>
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
                            {review.course || "Class/Course Title"}
                            <span className="text-muted-foreground">•</span>
                            <Calendar className="h-4 w-4" />
                            {new Date(review.updated_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}

                          </div>
                        </div>
                      </div>

                      {/* Comment */}
                      <div>
                        <CardTitle>
                          {review.headline}
                        </CardTitle>
                        <CardDescription>
                          {review.comments}
                        </CardDescription>
                      </div>
                      {/* <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      </p> */}
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
                <div>
                  <CardTitle className='mb-4'>Rate Card</CardTitle>

                </div>
                <div className='space-y-4'>
                  <div className='bg-muted flex items-center justify-between rounded-lg p-4'>
                    <div>
                      <p>Group In Person Rate</p>
                      <p className='text-muted-foreground text-sm'>Per hour per head</p>
                    </div>
                    <p className='text-2xl'>
                      {matchedCourse?.rate_card?.currency} {matchedCourse?.rate_card?.group_inperson_rate}
                    </p>
                  </div>

                  <div className='bg-muted flex items-center justify-between rounded-lg p-4'>
                    <div>
                      <p>Group Online Rate</p>
                      <p className='text-muted-foreground text-sm'>Per hour per head</p>
                    </div>
                    <p className='text-2xl'>
                      {matchedCourse?.rate_card?.currency} {matchedCourse?.rate_card?.group_online_rate}
                    </p>
                  </div>

                  <div className='bg-muted flex items-center justify-between rounded-lg p-4'>
                    <div>
                      <p>Private In Person Rate</p>
                      <p className='text-muted-foreground text-sm'>Per hour per head</p>
                    </div>
                    <p className='text-2xl'>
                      {matchedCourse?.rate_card?.currency} {matchedCourse?.rate_card?.private_inperson_rate}
                    </p>
                  </div>


                  <div className='bg-muted flex items-center justify-between rounded-lg p-4'>
                    <div>
                      <p>Private Online Rate</p>
                      <p className='text-muted-foreground text-sm'>Per hour per head</p>
                    </div>
                    <p className='text-2xl'>
                      {matchedCourse?.rate_card?.currency} {matchedCourse?.rate_card?.private_online_rate}
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
const certifications = [
  { id: 'cert-3', name: 'Deep Learning Specialization', issuer: 'DeepLearning.AI', year: 2020 },
  { id: 'cert-4', name: 'Google Cloud Professional Data Engineer', issuer: 'Google', year: 2021 },
];
