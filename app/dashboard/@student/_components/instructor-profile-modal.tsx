'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle,
  DollarSign,
  MapPin,
  Star,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
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
import type {
  CourseTrainingApplication,
  CourseTrainingRateCard,
  InstructorCalendarEntry,
  InstructorReview,
} from '@/services/client/types.gen';
import type { Booking } from '@/src/features/dashboard/courses/pages/InstructorBookingPage';
import type { SearchInstructor } from '@/src/features/dashboard/courses/types';
import {
  AvailabilityData,
  ClassScheduleItem,
  convertToCalendarEvents,
} from '../../@instructor/availability/components/types';
import { ReviewCard } from '../../@instructor/reviews/review-card';
import BookInstructorTimeTableManager from './book-instructor-schedule';

type Props = {
  instructor: SearchInstructor;
  onClose: () => void;
  onBookingComplete: (booking: Booking) => void;
};

type RateKey = keyof Pick<
  CourseTrainingRateCard,
  'group_inperson_rate' | 'group_online_rate' | 'private_inperson_rate' | 'private_online_rate'
>;

export const InstructorProfileComponent: React.FC<Props> = ({
  instructor,
  onClose,
  onBookingComplete,
}) => {
  const student = useStudent();
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  const [showBooking, setShowBooking] = useState(false);
  const [reason, setReason] = useState('');

  const { data: timetable } = useQuery({
    ...getInstructorCalendarOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: { start_date: new Date('2024-09-10'), end_date: new Date('2026-11-11') },
    }),
    enabled: !!instructor?.uuid,
  });

  const instructorSchedule: InstructorCalendarEntry[] = timetable?.data ?? [];

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

    setAvailabilityData(prev => ({
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
  const instructorReviews: InstructorReview[] = reviews?.data ?? [];
  // get students details
  // get enrollment details / class name or course name

  const { data: appliedCourses } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: { pageable: {}, searchParams: { applicant_uuid_eq: instructor?.uuid as string } },
    }),
    enabled: !!instructor?.uuid,
  });

  const matchedCourse: CourseTrainingApplication | undefined = appliedCourses?.data?.content?.find(
    course => course.course_uuid === courseId
  );

  const [selectedRateKey, setSelectedRateKey] = useState<RateKey>('private_online_rate');
  const [totalAmount, setTotalAmount] = useState(0);
  const bookingRates = matchedCourse?.rate_card
    ? {
        ...matchedCourse.rate_card,
        currency: matchedCourse.rate_card.currency ?? 'KES',
      }
    : undefined;

  return (
    <div className='relative mx-auto w-full max-w-7xl self-center overflow-y-auto'>
      <Button
        variant='ghost'
        size='sm'
        onClick={onClose}
        className='bg-background/90 absolute top-4 right-4 z-10 h-9 w-9 rounded-full border p-0 shadow-sm backdrop-blur'
      >
        <X className='h-6 w-6' />
      </Button>

      <div className='space-y-6 pt-6 pr-6'>
        <div className='border-border bg-card rounded-[24px] border p-5 sm:p-6'>
          <div className='flex flex-col gap-5 lg:flex-row lg:items-start'>
          <Avatar className='h-24 w-24'>
            <AvatarImage
              src={instructor.profile_image_url ?? undefined}
              alt={instructor.full_name}
            />
            <AvatarFallback>{instructor?.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>

            <div className='flex-1'>
              <div className='flex items-start justify-between'>
              <div>
                  <div className='mb-1 flex items-center gap-2'>
                    <h2 className='text-2xl font-semibold tracking-[-0.03em]'>{instructor?.full_name}</h2>
                  </div>
                  <p className='text-muted-foreground'>{instructor?.professional_headline}</p>
                </div>
              </div>

              <div className='mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                <div className='bg-muted/50 flex items-center gap-2 rounded-2xl px-3 py-2'>
                  <Star className='h-4 w-4 fill-yellow-500 text-yellow-500' />
                  <span className='text-sm'>{instructorReviews?.length} reviews</span>
                </div>
                <div className='bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-2xl px-3 py-2'>
                  <Users className='h-4 w-4' />
                  <span className='text-sm'>N/A students</span>
                </div>
                <div className='bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-2xl px-3 py-2'>
                  <Briefcase className='h-4 w-4' />
                  <span className='text-sm'>{instructor?.total_experience_years} years experience</span>
                </div>
                {instructor?.has_location_coordinates && (
                  <div className='bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-2xl px-3 py-2'>
                    <MapPin className='h-4 w-4' />
                    <span className='text-sm'>{instructor?.formatted_location}</span>
                  </div>
                )}
              </div>

              <div className='mt-3 flex gap-2'>
                <Badge variant='secondary' className='gap-1 rounded-full'>
                <Video className='h-3 w-3' />
                Online / Onsite
              </Badge>
            </div>
          </div>
          </div>

          <div className='mt-5 flex justify-end'>
            <Button
              onClick={() => setShowBooking(true)}
              size='lg'
              className='flex items-center gap-2 rounded-xl'
            >
            <Calendar className='h-4 w-4' />
            Book Session
          </Button>
        </div>
        </div>

        {showBooking && (
          <>
            <BookInstructorTimeTableManager
              availabilityData={availabilityData || []}
              onAvailabilityUpdate={setAvailabilityData}
              studentBookingData={{
                course_uuid: courseId || '',
                student_uuid: student?.uuid || '',
                instructor_uuid: instructor?.uuid || '',
                booking_id: '',
                price_amount: totalAmount,
                purpose: reason,
                rate_key: selectedRateKey,
                rates: bookingRates,
              }}
            />
          </>
        )}

        <Tabs defaultValue='overview' className='w-full'>
          <TabsList className='bg-muted/50 flex h-auto flex-row gap-2 rounded-2xl p-1'>
            <TabsTrigger value='overview' className='rounded-xl'>Overview</TabsTrigger>
            <TabsTrigger value='reviews' className='rounded-xl'>Reviews ({instructorReviews.length})</TabsTrigger>
            <TabsTrigger value='certifications' className='rounded-xl'>Certifications</TabsTrigger>
            <TabsTrigger value='rates' className='rounded-xl'>Rates</TabsTrigger>
          </TabsList>

          <div className='relative'>
            <TabsContent value='overview' className='space-y-6'>
              <Card className='rounded-[22px] p-6 shadow-none'>
                <h3 className='mb-3'>About</h3>
                <div className='text-muted-foreground'>
                  <RichTextRenderer htmlString={instructor.bio ?? ''} />
                </div>
              </Card>

              {/* Skills */}
              {/* <Card className='p-6'>
                <h3 className='mb-3'>Skills & Expertise</h3>
                <div className='flex flex-wrap gap-2'>
                  {skills?.length > 0 ? (
                    <div className='flex flex-wrap gap-2'>
                      {skills?.map(skill => (
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
              <Card className='rounded-[22px] p-6 shadow-none'>
                <h3 className='mb-3'>Skills & Expertise</h3>

                {instructor?.specializations?.length > 0 ? (
                  <div className='flex flex-wrap gap-2'>
                    {instructor?.specializations?.map(spec => (
                      <Badge key={spec.uuid ?? spec.skill_name} variant='outline'>
                        {spec.skill_name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className='text-muted-foreground text-sm'>No specializations added</p>
                )}
              </Card>

              {/* Classes */}
              <Card className='mb-6 rounded-[22px] p-6 shadow-none'>
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
                        <CheckCircle className='mt-1 h-5 w-5 text-success' />
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

            <TabsContent value='reviews' className='space-y-4'>
              {Array.isArray(instructorReviews) && instructorReviews.length > 0 ? (
                instructorReviews.map(review => <ReviewCard key={review.uuid} review={review} />)
              ) : (
                <div className='text-muted-foreground flex flex-col items-center justify-center py-12 text-center'>
                  <Star className='text-muted-foreground mb-4 h-10 w-10' />
                  <h3 className='text-lg font-semibold'>No Reviews Yet</h3>
                  <p className='mt-1 text-sm'>This instructor hasn’t received any reviews yet.</p>
                </div>
              )}
            </TabsContent>

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

            <TabsContent value='rates' className='space-y-4'>
              <Card className='rounded-[22px] p-6 shadow-none'>
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

              <Card className='border-primary/30 bg-primary/10 mb-6 rounded-[22px] p-6 shadow-none'>
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

const skills: Array<{ skill_name: string; uuid?: string }> = [];
const certifications = [
  { id: 'cert-3', name: 'Deep Learning Specialization', issuer: 'DeepLearning.AI', year: 2020 },
  { id: 'cert-4', name: 'Google Cloud Professional Data Engineer', issuer: 'Google', year: 2021 },
];
