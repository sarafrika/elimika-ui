'use client';

import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import useSearchTrainingInstructors from '@/hooks/use-search-training-instructors';
import { getBookingOptions, listTrainingApplicationsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQueries, useQuery } from '@tanstack/react-query';
import { BookOpen, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import type { ClassData } from '../../../@instructor/trainings/create-new/academic-period-form';
import { InstructorDirectory } from '../../../_components/instructor-directory';
import { ManageBookings } from '../../../_components/manage-bookings';

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
  classes: ClassData[];
};

const InstructorBookingDashboard: React.FC<Props> = ({ classes }) => {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  // saved booking ids in local storage
  const bookingIds: string[] = JSON.parse(
    localStorage.getItem('student_booking_ids') || '[]'
  );
  const bookingQueries = useQueries({
    queries: bookingIds.map(bookingUuid => ({
      ...getBookingOptions({
        path: { bookingUuid },
      }),
      enabled: !!bookingUuid,
    })),
  });

  const studentsBookings = bookingQueries
    .map(q => q.data?.data)
    .filter(Boolean);
  // saved booking ids in local storage

  const bookings = studentsBookings || [];
  const [activeTab, setActiveTab] = useState('browse');
  const { data: trainingInstructors, loading } = useSearchTrainingInstructors();

  const { data: applications } = useQuery(
    listTrainingApplicationsOptions({
      path: { courseUuid: courseId as string },
      query: { pageable: {}, status: "approved" }
    })
  )

  const approvedInstructorUuids =
    applications?.data?.content
      ?.filter(app => app?.applicant_type === 'instructor')
      ?.map(app => app?.applicant_uuid) ?? [];

  const filteredInstructors = trainingInstructors?.filter(instructor =>
    approvedInstructorUuids.includes(instructor.uuid)
  );

  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'courses',
        title: 'Browse Courses',
        url: `/dashboard/browse-courses`,
      },
      {
        id: 'book-instructor',
        title: `Book Instructor`,
        url: `/dashboard/browse-courses/instructor`,
      },
    ]);
  }, [replaceBreadcrumbs]);


  const handleBookingComplete = (_newBooking: Booking) => {
    // setBookings((prev: any) => [...prev, newBooking]);
    setActiveTab('bookings');
  };

  const handleBookingUpdate = (_updatedBooking: Booking) => {
    // setBookings((prev: any) =>
    //     prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
    // );
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1>Book an Instructor</h1>
        <p className='text-muted-foreground'>
          Browse qualified instructors and book personalized training sessions
        </p>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-primary/10 p-2'>
              <Users className='h-5 w-5 text-primary' />
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Available Instructors</p>
              <p className='text-2xl'>{filteredInstructors?.length}</p>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-green-100 p-2'>
              <BookOpen className='h-5 w-5 text-green-600' />
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Total Bookings</p>
              <p className='text-2xl'>{bookings?.length || '0'}</p>
            </div>
          </div>
        </Card>

        {/* <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Upcoming Sessions</p>
                            <p className="text-2xl">
                                {bookings?.filter((b) => b.status === 'confirmed').length}
                            </p>
                        </div>
                    </div>
                </Card> */}

        {/* <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-accent/10 p-2">
                            <Search className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Specializations</p>
                            <p className="text-2xl">
                                {new Set(instructors?.flatMap((i) => i.specializations)).size}
                            </p>
                        </div>
                    </div>
                </Card> */}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='border' >
          <TabsTrigger value='browse'>Browse Instructors</TabsTrigger>
          <TabsTrigger value='bookings'>
            My Bookings {bookings?.length > 0 && `(${bookings?.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='browse' className='mt-6'>
          <InstructorDirectory
            instructors={filteredInstructors as any}
            classes={classes}
            onBookingComplete={handleBookingComplete}
            courseId={courseId as string}
          />
        </TabsContent>

        <TabsContent value='bookings' className='mt-6'>
          <ManageBookings
            bookings={bookings}
            instructors={filteredInstructors as any}
            onBookingUpdate={handleBookingUpdate}
            refetchBookings={() => bookingQueries.forEach(q => q.refetch())}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstructorBookingDashboard;


