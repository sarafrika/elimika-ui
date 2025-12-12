'use client';

import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useBreadcrumb } from '../../../../../context/breadcrumb-provider';
import useSearchTrainingInstructors from '../../../../../hooks/use-search-training-instructors';
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

  const bookings = exampleBookings || [];
  const [activeTab, setActiveTab] = useState('browse');
  const { data: trainingInstructors, loading } = useSearchTrainingInstructors();
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
              <p className='text-2xl'>{trainingInstructors?.length}</p>
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
            instructors={trainingInstructors as any}
            classes={classes}
            onBookingComplete={handleBookingComplete}
          />
        </TabsContent>

        <TabsContent value='bookings' className='mt-6'>
          <ManageBookings
            bookings={bookings}
            instructors={trainingInstructors as any}
            onBookingUpdate={handleBookingUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstructorBookingDashboard;

const exampleBookings: any[] = [
  {
    id: 'booking-001',
    studentId: 'student_001',
    studentName: 'Alice Kimani',
    instructorId: 'instructor_001',
    instructorName: 'Mr. Otieno',
    slots: [
      {
        id: 'slot-001',
        date: new Date('2025-10-15'),
        startTime: '10:00',
        endTime: '11:00',
        duration: 1,
        mode: 'online',
      },
    ],
    totalSessions: 1,
    totalDuration: 1,
    totalFee: 1500,
    currency: 'KES',
    paymentMethod: 'm-pesa',
    paymentStatus: 'completed',
    status: 'confirmed',
    createdAt: new Date('2025-10-10T12:00:00'),
    confirmedAt: new Date('2025-10-11T09:00:00'),
    notes: 'First session on Zoom. Join link to be sent 1 day before.',
  },

  {
    id: 'booking-002',
    studentId: 'student_002',
    studentName: 'Brian Mwangi',
    instructorId: 'instructor_002',
    instructorName: 'Ms. Achieng',
    slots: [
      {
        id: 'slot-002a',
        date: new Date('2025-10-17'),
        startTime: '14:00',
        endTime: '15:30',
        duration: 1.5,
        venue: 'Nairobi Learning Center',
        mode: 'onsite',
      },
      {
        id: 'slot-002b',
        date: new Date('2025-10-24'),
        startTime: '14:00',
        endTime: '15:30',
        duration: 1.5,
        venue: 'Nairobi Learning Center',
        mode: 'onsite',
      },
    ],
    recurring: {
      frequency: 'weekly',
      endDate: new Date('2025-11-14'),
    },
    totalSessions: 2,
    totalDuration: 3,
    totalFee: 3000,
    currency: 'KES',
    paymentMethod: 'skill-fund',
    paymentStatus: 'pending',
    status: 'pending',
    createdAt: new Date('2025-10-12T10:30:00'),
    notes: 'Weekly computer science tutoring.',
  },

  {
    id: 'booking-003',
    studentId: 'student_003',
    studentName: 'Carol Wanjiru',
    instructorId: 'instructor_003',
    instructorName: 'Dr. Njuguna',
    slots: [
      {
        id: 'slot-003',
        date: new Date('2025-10-20'),
        startTime: '09:00',
        endTime: '10:30',
        duration: 1.5,
        mode: 'online',
      },
    ],
    totalSessions: 1,
    totalDuration: 1.5,
    totalFee: 2000,
    currency: 'KES',
    paymentMethod: 'card',
    paymentStatus: 'completed',
    status: 'completed',
    createdAt: new Date('2025-10-01T14:20:00'),
    confirmedAt: new Date('2025-10-02T10:00:00'),
    notes: 'Session completed successfully. Student wants follow-up in November.',
  },

  {
    id: 'booking-004',
    studentId: 'student_004',
    studentName: 'David Otieno',
    instructorId: 'instructor_004',
    instructorName: 'Mr. Kiptoo',
    slots: [
      {
        id: 'slot-004',
        date: new Date('2025-10-19'),
        startTime: '16:00',
        endTime: '17:00',
        duration: 1,
        venue: 'Kisumu Tech Hub',
        mode: 'onsite',
      },
    ],
    totalSessions: 1,
    totalDuration: 1,
    totalFee: 1000,
    currency: 'KES',
    paymentStatus: 'failed',
    status: 'cancelled',
    createdAt: new Date('2025-10-05T08:15:00'),
    notes: 'Student missed the session and payment failed.',
  },
];
