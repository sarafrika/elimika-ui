'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpen, CalendarDays, GraduationCap, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useStudent } from '@/context/student-context';
import useSearchTrainingInstructors from '@/hooks/use-search-training-instructors';
import {
  getStudentBookingsOptions,
  listTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { InstructorDirectory } from '@/src/features/dashboard/courses/components/instructor-directory';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { ManageBookings } from '@/src/features/dashboard/courses/components/manage-bookings';
import type { BookingRecord, BundledClass, SearchInstructor } from '../types';

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
  experience: number; // years
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
  duration: number; // in hours
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
  totalDuration: number; // in hours
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
  classes: BundledClass[];
};

const InstructorBookingDashboard: React.FC<Props> = ({ classes }) => {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const student = useStudent();
  const { activeDomain } = useUserDomain();

  const { data: studentsBookingsData, refetch } = useQuery({
    ...getStudentBookingsOptions({
      path: { studentUuid: student?.uuid as string },
      query: { pageable: {}, status: '' },
    }),
    enabled: !!student?.uuid,
  });
  const studentsBookings = studentsBookingsData?.data?.content;

  const bookings = studentsBookings || [];
  const [activeTab, setActiveTab] = useState('browse');
  const { data: trainingInstructors, loading } = useSearchTrainingInstructors();

  const { data: applications } = useQuery(
    listTrainingApplicationsOptions({
      path: { courseUuid: courseId as string },
      query: { pageable: {}, status: 'approved' },
    })
  );

  const approvedInstructorUuids =
    applications?.data?.content
      ?.filter(app => app?.applicant_type === 'instructor')
      ?.map(app => app?.applicant_uuid) ?? [];

  const filteredInstructors: SearchInstructor[] = trainingInstructors.filter(instructor =>
    approvedInstructorUuids.includes(instructor.uuid)
  );

  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      {
        id: 'dashboard',
        title: 'Dashboard',
        url: buildWorkspaceAliasPath(activeDomain, '/dashboard/overview'),
      },
      {
        id: 'courses',
        title: 'Browse Courses',
        url: buildWorkspaceAliasPath(activeDomain, '/dashboard/courses'),
      },
      {
        id: 'book-instructor',
        title: `Book Instructor`,
        url: buildWorkspaceAliasPath(
          activeDomain,
          `/dashboard/courses/instructor${courseId ? `?courseId=${courseId}` : ''}`
        ),
      },
    ]);
  }, [replaceBreadcrumbs, activeDomain, courseId]);

  const handleBookingComplete = (_newBooking: Booking) => {
    setActiveTab('bookings');
  };

  const handleBookingUpdate = (_updatedBooking: BookingRecord) => {};

  return (
    <div className='space-y-6'>
      <section className='border-border bg-card relative overflow-hidden rounded-[24px] border px-5 py-6 sm:px-6'>
        <div className='from-primary/10 via-background absolute inset-0 bg-gradient-to-br to-transparent' />
        <div className='relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
          <div className='max-w-3xl space-y-3'>
            <div className='bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold'>
              <GraduationCap className='size-3.5' />
              Instructor matching
            </div>
            <div className='space-y-2'>
              <h1 className='text-foreground text-[clamp(1.55rem,2.3vw,2.35rem)] font-semibold tracking-[-0.03em]'>
                Book an instructor for guided learning
              </h1>
              <p className='text-muted-foreground text-sm sm:text-[0.95rem]'>
                Compare approved instructors for this course, review availability and move into a
                managed booking flow without leaving the shared courses workspace.
              </p>
            </div>
          </div>

          <div className='grid gap-3 sm:grid-cols-3 lg:min-w-[470px]'>
            <Card className='rounded-[20px] border bg-background/85 p-4 shadow-none'>
              <div className='flex items-center gap-3'>
                <span className='bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-xl'>
                  <Users className='h-4 w-4' />
                </span>
                <div>
                  <p className='text-muted-foreground text-xs font-medium'>Available instructors</p>
                  <p className='text-foreground text-lg font-semibold'>{filteredInstructors.length}</p>
                </div>
              </div>
            </Card>

            <Card className='rounded-[20px] border bg-background/85 p-4 shadow-none'>
              <div className='flex items-center gap-3'>
                <span className='bg-success/10 text-success inline-flex size-10 items-center justify-center rounded-xl'>
                  <BookOpen className='h-4 w-4' />
                </span>
                <div>
                  <p className='text-muted-foreground text-xs font-medium'>My bookings</p>
                  <p className='text-foreground text-lg font-semibold'>{bookings?.length || 0}</p>
                </div>
              </div>
            </Card>

            <Card className='rounded-[20px] border bg-background/85 p-4 shadow-none'>
              <div className='flex items-center gap-3'>
                <span className='bg-warning/15 text-warning inline-flex size-10 items-center justify-center rounded-xl'>
                  <CalendarDays className='h-4 w-4' />
                </span>
                <div>
                  <p className='text-muted-foreground text-xs font-medium'>Course context</p>
                  <p className='text-foreground line-clamp-1 text-sm font-semibold'>
                    {courseId ? 'Scoped to selected course' : 'All approved instructors'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-5'>
        <TabsList className='bg-muted/50 h-auto rounded-2xl p-1'>
          <TabsTrigger value='browse' className='rounded-xl px-4 py-2.5'>
            Browse Instructors
          </TabsTrigger>
          <TabsTrigger value='bookings' className='rounded-xl px-4 py-2.5'>
            My Bookings {bookings?.length > 0 && `(${bookings?.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='browse' className='mt-0'>
          <InstructorDirectory
            instructors={filteredInstructors}
            classes={classes}
            onBookingComplete={handleBookingComplete}
            courseId={courseId as string}
          />
        </TabsContent>

        <TabsContent value='bookings' className='mt-0'>
          <ManageBookings
            bookings={bookings}
            instructors={filteredInstructors}
            onBookingUpdate={handleBookingUpdate}
            refetchBookings={() => refetch()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstructorBookingDashboard;
