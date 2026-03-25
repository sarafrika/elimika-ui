'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { cx, elimikaDesignSystem, getHeaderClasses, getStatCardClasses } from '@/lib/design-system';
import useSearchTrainingInstructors from '@/hooks/use-search-training-instructors';
import {
  getStudentBookingsOptions,
  listTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, CalendarDays, SearchCheck, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useStudent } from '../../../../../context/student-context';
import type { ClassData } from '../../../@instructor/trainings/create-new/academic-period-form';
import { InstructorDirectory } from '../../../_components/instructor-directory';
import { StudentBookingsPanel } from '../../_components/student-bookings-panel';

export type Instructor = {
  id: string;
  name: string;
  title: string;
  bio: string;
  profileImage?: string;
  type: 'individual' | 'organization';
  gender?: 'male' | 'female' | 'other';
  rating: number;
  totalReviews: number;
  totalStudents: number;
  experience: number;
  specializations: string[];
  courses: string[];
  skills: string[];
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    year: number;
  }>;
  availability: Array<{
    id: string;
    date: Date;
    startTime: string;
    endTime: string;
    status: 'available' | 'booked';
  }>;
  rateCard: {
    hourly: number;
    halfDay: number;
    fullDay: number;
    currency: string;
  };
  mode: ('online' | 'onsite')[];
  location?: {
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  reviews: Array<{
    id: string;
    studentName: string;
    studentImage?: string;
    rating: number;
    comment: string;
    date: Date;
    course: string;
  }>;
};

export type BookingSlot = {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  venue?: string;
  mode: 'online' | 'onsite';
};

export type Booking = {
  id: string;
  studentId: string;
  studentName: string;
  instructorId: string;
  instructorName: string;
  slots: BookingSlot[];
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    endDate: Date;
  };
  totalSessions: number;
  totalDuration: number;
  totalFee: number;
  currency: string;
  paymentMethod?: 'skill-fund' | 'm-pesa' | 'card' | 'bank';
  paymentStatus: 'pending' | 'completed' | 'failed';
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'completed';
  createdAt: Date;
  confirmedAt?: Date;
  notes?: string;
};

type Props = {
  classes: ClassData[];
};

const InstructorBookingDashboard: React.FC<Props> = ({ classes }) => {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const student = useStudent();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const [activeTab, setActiveTab] = useState('browse');

  const { data: studentBookingsData, refetch } = useQuery({
    ...getStudentBookingsOptions({
      path: { studentUuid: student?.uuid as string },
      query: { pageable: {}, status: '' },
    }),
    enabled: !!student?.uuid,
  });

  const { data: trainingInstructors, loading } = useSearchTrainingInstructors();

  const { data: applications } = useQuery(
    listTrainingApplicationsOptions({
      path: { courseUuid: courseId as string },
      query: { pageable: {}, status: 'approved' },
    })
  );

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'courses', title: 'Browse Courses', url: '/dashboard/all-courses' },
      { id: 'book-instructor', title: 'Book Instructor', url: '/dashboard/all-courses/instructor' },
    ]);
  }, [replaceBreadcrumbs]);

  const approvedInstructorUuids = useMemo(
    () =>
      applications?.data?.content
        ?.filter(application => application?.applicant_type === 'instructor')
        ?.map(application => application?.applicant_uuid) ?? [],
    [applications]
  );

  const filteredInstructors = useMemo(
    () =>
      trainingInstructors?.filter(instructor =>
        approvedInstructorUuids.includes(instructor.uuid)
      ) ?? [],
    [approvedInstructorUuids, trainingInstructors]
  );

  const bookings = studentBookingsData?.data?.content ?? [];
  const totalUpcoming = bookings.filter(
    booking =>
      booking.start_time >= new Date() &&
      !['cancelled', 'declined', 'expired'].includes(booking.status)
  ).length;
  const pendingPayments = bookings.filter(booking => booking.status === 'payment_required').length;

  const handleBookingComplete = (_newBooking: Booking) => {
    refetch();
    setActiveTab('bookings');
  };

  return (
    <main className={elimikaDesignSystem.components.pageContainer}>
      <section className={cx(getHeaderClasses(), 'relative overflow-hidden')}>
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_42%),radial-gradient(circle_at_bottom_right,hsl(var(--primary)/0.12),transparent_34%)] dark:hidden' />
        <div className='relative space-y-6'>
          <div className='flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between'>
            <div className='space-y-4'>
              <Badge className={elimikaDesignSystem.components.header.badge}>
                Book an instructor
              </Badge>
              <div className='space-y-3'>
                <h1 className={elimikaDesignSystem.components.header.title}>
                  Choose the right instructor before you commit to a session
                </h1>
                <p className={elimikaDesignSystem.components.header.subtitle}>
                  Compare instructor profiles, understand teaching fit, review rates and
                  availability, then track every booking from payment through session day.
                </p>
              </div>
            </div>

            <Card className='border-primary/20 bg-primary/5 w-full max-w-md rounded-[32px] shadow-none'>
              <CardContent className='space-y-3 p-6'>
                <div className='text-primary flex items-center gap-2'>
                  <Sparkles className='h-4 w-4' />
                  <span className='text-sm font-semibold'>Booking guidance</span>
                </div>
                <p className='text-foreground text-2xl font-semibold'>
                  Review profile, pricing, then schedule
                </p>
                <p className='text-muted-foreground text-sm'>
                  The refreshed flow makes it easier to understand who you are booking and what the
                  session will cost before you pick a slot.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <Card className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                    <SearchCheck className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>Available instructors</p>
                    <p className='text-2xl font-semibold'>{filteredInstructors.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                    <BookOpen className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>Total bookings</p>
                    <p className='text-2xl font-semibold'>{bookings.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                    <CalendarDays className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>Upcoming sessions</p>
                    <p className='text-2xl font-semibold'>{totalUpcoming}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={getStatCardClasses()}>
              <CardContent className='p-0'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                    <Sparkles className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm'>Pending payments</p>
                    <p className='text-2xl font-semibold'>{pendingPayments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='w-full justify-start overflow-x-auto'>
          <TabsTrigger value='browse'>Browse instructors</TabsTrigger>
          <TabsTrigger value='bookings'>
            My bookings {bookings.length > 0 ? `(${bookings.length})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='browse' className='pt-4'>
          <InstructorDirectory
            instructors={filteredInstructors as any}
            classes={classes}
            onBookingComplete={handleBookingComplete}
            courseId={courseId as string}
            isLoading={loading}
          />
        </TabsContent>

        <TabsContent value='bookings' className='pt-4'>
          <StudentBookingsPanel
            bookings={bookings}
            instructors={filteredInstructors as any}
            refetchBookings={() => refetch()}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default InstructorBookingDashboard;
