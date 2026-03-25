'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStudent } from '@/context/student-context';
import useInstructorClassesWithDetails from '@/hooks/use-instructor-classes';
import {
  getInstructorCalendarOptions,
  getInstructorReviewsOptions,
  listCatalogItemsOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle,
  DollarSign,
  GraduationCap,
  MapPin,
  Star,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  AvailabilityData,
  ClassScheduleItem,
  convertToCalendarEvents,
} from '../../@instructor/availability/components/types';
import { ReviewCard } from '../../@instructor/reviews/review-card';
import type { Booking } from '../all-courses/instructor/page';
import BookInstructorTimeTableManager from './book-instructor-schedule';

type Props = {
  instructor: any;
  onClose: () => void;
  onBookingComplete: (booking: Booking) => void;
};

export const InstructorProfileComponent: React.FC<Props> = ({
  instructor,
  onClose,
  onBookingComplete: _onBookingComplete,
}) => {
  const student = useStudent();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  const [showBooking, setShowBooking] = useState(false);

  const { data: timetable } = useQuery({
    ...getInstructorCalendarOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: { start_date: '2024-09-10' as any, end_date: '2026-11-11' as any },
    }),
    enabled: !!instructor?.uuid,
  });

  const instructorSchedule = timetable?.data ?? [];

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

  const { data: catalogues } = useQuery(listCatalogItemsOptions());
  const { classes: classesWithCourseAndInstructor } = useInstructorClassesWithDetails(
    instructor?.uuid as string
  );

  const filteredClasses = classesWithCourseAndInstructor.filter(cls =>
    catalogues?.data?.some(cat => cat.class_definition_uuid === cls.uuid)
  );

  const { data: reviews } = useQuery({
    ...getInstructorReviewsOptions({ path: { instructorUuid: instructor?.uuid as string } }),
    enabled: !!instructor.uuid,
  });
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

  const rateEntries = [
    {
      key: 'private_online_rate',
      label: 'Private online',
      description: '1:1 virtual training session',
      amount: matchedCourse?.rate_card?.private_online_rate,
    },
    {
      key: 'private_inperson_rate',
      label: 'Private in person',
      description: '1:1 onsite training session',
      amount: matchedCourse?.rate_card?.private_inperson_rate,
    },
    {
      key: 'group_online_rate',
      label: 'Group online',
      description: 'Virtual session for multiple learners',
      amount: matchedCourse?.rate_card?.group_online_rate,
    },
    {
      key: 'group_inperson_rate',
      label: 'Group in person',
      description: 'Physical session for multiple learners',
      amount: matchedCourse?.rate_card?.group_inperson_rate,
    },
  ].filter(entry => typeof entry.amount === 'number');

  return (
    <div className='relative mx-auto w-full max-w-7xl self-center overflow-y-auto rounded-[32px] bg-background'>
      <Button
        variant='ghost'
        size='sm'
        onClick={onClose}
        className='bg-primary absolute top-4 right-4 z-10 h-8 w-8 p-0 text-white dark:text-black'
      >
        <X className='h-6 w-6' />
      </Button>

      <div className='space-y-6 p-6'>
        <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]'>
          <Card className='rounded-[32px] border-border/60 p-6 shadow-sm'>
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
          </Card>

          <Card className='rounded-[32px] border-border/60 p-6 shadow-sm'>
            <div className='space-y-4'>
              <div>
                <p className='text-muted-foreground text-sm'>Booking fit</p>
                <h3 className='mt-1 text-xl font-semibold'>Know who you are booking</h3>
              </div>

              <div className='space-y-3 text-sm'>
                <div className='rounded-2xl border border-border/60 p-4'>
                  <div className='font-medium'>Course alignment</div>
                  <p className='text-muted-foreground mt-1'>
                    {matchedCourse?.course_name ??
                      'This instructor is approved to teach the selected course.'}
                  </p>
                </div>

                <div className='rounded-2xl border border-border/60 p-4'>
                  <div className='font-medium'>Session formats</div>
                  <p className='text-muted-foreground mt-1'>
                    Use the scheduler below to request an online or in-person slot based on the rate you choose.
                  </p>
                </div>

                <div className='rounded-2xl border border-border/60 p-4'>
                  <div className='font-medium'>Booking flow</div>
                  <p className='text-muted-foreground mt-1'>
                    Pick a rate, add a short purpose, then choose a slot from the timetable to create your booking request.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setShowBooking(current => !current)}
                size='lg'
                className='w-full gap-2'
              >
                <Calendar className='h-4 w-4' />
                {showBooking ? 'Hide booking scheduler' : 'Start booking'}
              </Button>
            </div>
          </Card>
        </div>

        {rateEntries.length > 0 && (
          <Card className='rounded-[32px] border-border/60 p-6 shadow-sm'>
            <div className='mb-4 flex items-center justify-between gap-4'>
              <div>
                <h3 className='text-lg font-semibold'>Rate overview</h3>
                <p className='text-muted-foreground text-sm'>
                  Understand the available session types before opening the booking scheduler.
                </p>
              </div>
              <Badge variant='secondary'>{rateEntries.length} rate options</Badge>
            </div>

            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
              {rateEntries.map(entry => (
                <div
                  key={entry.key}
                  className='rounded-3xl border border-border/60 bg-muted/30 p-4'
                >
                  <div className='font-medium'>{entry.label}</div>
                  <p className='text-muted-foreground mt-1 text-sm'>{entry.description}</p>
                  <div className='mt-4 text-xl font-semibold'>
                    {matchedCourse?.rate_card?.currency ?? 'KES'} {entry.amount}
                    <span className='text-muted-foreground text-sm font-normal'> / hour</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Booking Form */}
        {showBooking && (
          <Card className='rounded-[32px] border-border/60 p-6 shadow-sm'>
            <div className='mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
              <div>
                <h3 className='text-lg font-semibold'>Booking scheduler</h3>
                <p className='text-muted-foreground text-sm'>
                  Use the instructor timetable to choose a slot after reviewing the available rates and expectations.
                </p>
              </div>

              <Badge variant='secondary' className='w-fit'>
                Course booking flow
              </Badge>
            </div>

            <BookInstructorTimeTableManager
              availabilityData={availabilityData || []}
              onAvailabilityUpdate={setAvailabilityData}
              studentBookingData={{
                course_uuid: courseId || '',
                student_uuid: student?.uuid || '',
                instructor_uuid: instructor?.uuid || '',
                booking_id: '',
                rates: matchedCourse?.rate_card,
              }}
              />
          </Card>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue='overview' className='w-full'>
          <TabsList className='flex flex-row gap-4'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='reviews'>Reviews ({instructorReviews.length})</TabsTrigger>
            <TabsTrigger value='certifications'>Certifications</TabsTrigger>
            <TabsTrigger value='rates'>Rates</TabsTrigger>
          </TabsList>

          <div className='relative'>
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
              {/* <Card className='p-6'>
                <h3 className='mb-3'>Skills & Expertise</h3>
                <div className='flex flex-wrap gap-2'>
                  {skills?.length > 0 ? (
                    <div className='flex flex-wrap gap-2'>
                      {skills?.map((skill: any, index: any) => (
                        <Badge key={skill.uuid} variant='outline'>
                          {skill.skill_name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className='text-muted-foreground text-sm'>No skills or expertise added</p>
                  )}
                </div>
              </Card> */}

              {/* Specializations */}
              <Card className='p-6'>
                <h3 className='mb-3'>Skills & Expertise</h3>

                {instructor?.specializations?.length > 0 ? (
                  <div className='flex flex-wrap gap-2'>
                    {instructor?.specializations?.map((spec: any, index: any) => (
                      <Badge key={spec.uuid} variant='outline'>
                        {spec.skill_name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className='text-muted-foreground text-sm'>No specializations added</p>
                )}
              </Card>

              <Card className='p-6'>
                <div className='mb-3 flex items-center gap-2'>
                  <GraduationCap className='h-5 w-5' />
                  <h3>Why students book this instructor</h3>
                </div>
                <div className='grid gap-4 md:grid-cols-3'>
                  <div className='rounded-2xl border border-border/60 p-4'>
                    <div className='font-medium'>Experience depth</div>
                    <p className='text-muted-foreground mt-1 text-sm'>
                      {instructor?.total_experience_years ?? 0} years of experience in the field.
                    </p>
                  </div>
                  <div className='rounded-2xl border border-border/60 p-4'>
                    <div className='font-medium'>Course relevance</div>
                    <p className='text-muted-foreground mt-1 text-sm'>
                      Approved for this course and visible in the student booking flow.
                    </p>
                  </div>
                  <div className='rounded-2xl border border-border/60 p-4'>
                    <div className='font-medium'>Booking clarity</div>
                    <p className='text-muted-foreground mt-1 text-sm'>
                      Rates, schedule, and review history are shown before you commit.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Classes */}
              <Card className='mb-6 p-6'>
                <div className='mb-4 flex items-center justify-between'>
                  <div>
                    <CardTitle className='text-lg font-semibold'>
                      Available Instructor Classes
                    </CardTitle>
                    <CardDescription>
                      Classes with catalogues, available for enrollment
                    </CardDescription>
                  </div>
                  <Badge variant='secondary'>{filteredClasses?.length || 0} Classe(s)</Badge>
                </div>

                {filteredClasses?.length > 0 ? (
                  <div className='divide-border divide-y rounded-md'>
                    {filteredClasses.map(course => (
                      <div
                        key={course?.uuid}
                        className='hover:bg-secondary dark:hover:bg-muted flex items-start gap-3 p-4 transition'
                      >
                        <CheckCircle className='mt-1 h-5 w-5 text-green-600' />
                        <div className='flex flex-col'>
                          <div>
                            <p className='font-medium'>{course?.title}</p>
                            <p className='text-muted-foreground text-sm'>0% enrollment</p>
                          </div>
                          <div className='text-muted-foreground mt-1 flex items-start gap-2 text-sm'>
                            <BookOpen className='text-muted-foreground h-4 w-4' />
                            <span>{course?.course?.name}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-muted-foreground flex flex-col items-center justify-center py-12 text-center'>
                    <BookOpen className='text-muted-foreground mb-3 h-8 w-8' />
                    <h4 className='text-lg font-medium'>No Classes Available</h4>
                    <p className='mt-1 text-sm'>This instructor hasn’t created any classes yet.</p>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value='reviews' className='space-y-4'>
              {Array.isArray(instructorReviews) && instructorReviews.length > 0 ? (
                instructorReviews.map((review: any) => (
                  <ReviewCard key={review.uuid} review={review} />
                ))
              ) : (
                <div className='text-muted-foreground flex flex-col items-center justify-center py-12 text-center'>
                  <Star className='text-muted-foreground mb-4 h-10 w-10' />
                  <h3 className='text-lg font-semibold'>No Reviews Yet</h3>
                  <p className='mt-1 text-sm'>This instructor hasn’t received any reviews yet.</p>
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
                        <div className='bg-primary/10 rounded-lg p-3'>
                          <Award className='text-primary h-6 w-6' aria-hidden='true' />
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
                  <Award className='text-muted-foreground mb-4 h-10 w-10' />
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
                      {matchedCourse?.rate_card?.currency}{' '}
                      {matchedCourse?.rate_card?.group_inperson_rate}
                    </p>
                  </div>

                  <div className='bg-muted flex items-center justify-between rounded-lg p-4'>
                    <div>
                      <p>Group Online Rate</p>
                      <p className='text-muted-foreground text-sm'>Per hour per head</p>
                    </div>
                    <p className='text-2xl'>
                      {matchedCourse?.rate_card?.currency}{' '}
                      {matchedCourse?.rate_card?.group_online_rate}
                    </p>
                  </div>

                  <div className='bg-muted flex items-center justify-between rounded-lg p-4'>
                    <div>
                      <p>Private In Person Rate</p>
                      <p className='text-muted-foreground text-sm'>Per hour per head</p>
                    </div>
                    <p className='text-2xl'>
                      {matchedCourse?.rate_card?.currency}{' '}
                      {matchedCourse?.rate_card?.private_inperson_rate}
                    </p>
                  </div>

                  <div className='bg-muted flex items-center justify-between rounded-lg p-4'>
                    <div>
                      <p>Private Online Rate</p>
                      <p className='text-muted-foreground text-sm'>Per hour per head</p>
                    </div>
                    <p className='text-2xl'>
                      {matchedCourse?.rate_card?.currency}{' '}
                      {matchedCourse?.rate_card?.private_online_rate}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className='border-primary/30 bg-primary/10 mb-6 p-6'>
                <div className='flex gap-3'>
                  <DollarSign className='text-primary h-5 w-5' />
                  <div>
                    <p className='text-primary'>Pricing Information</p>
                    <p className='text-primary mt-1 text-sm'>
                      All rates are in KES/NAIRA. Custom packages and group discounts are available.
                      Contact instructor for details.
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

const skills = [] as any[];
const certifications = [
  { id: 'cert-3', name: 'Deep Learning Specialization', issuer: 'DeepLearning.AI', year: 2020 },
  { id: 'cert-4', name: 'Google Cloud Professional Data Engineer', issuer: 'Google', year: 2021 },
];
