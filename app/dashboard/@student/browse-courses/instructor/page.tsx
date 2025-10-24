'use client';

import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getAllInstructorsOptions } from '../../../../../services/client/@tanstack/react-query.gen';
import { ClassData } from '../../../@instructor/trainings/create-new/academic-period-form';
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
  const bookings = exampleBookings || [];
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [activeTab, setActiveTab] = useState('browse');
  const { data } = useQuery(
    getAllInstructorsOptions({ query: { pageable: { page: 0, size: 20 } } })
  );

  // Initialize sample instructors if empty
  useEffect(() => {
    if (instructors?.length === 0) {
      const sampleInstructors: Instructor[] = [
        {
          id: 'instructor-1',
          name: 'Dr. Sarah Johnson',
          title: 'Senior Frontend Developer & Educator',
          bio: 'Passionate educator with 8+ years of experience in web development. Specialized in React, TypeScript, and modern web technologies. I believe in hands-on learning and building real-world projects.',
          profileImage:
            'https://images.unsplash.com/photo-1594256347468-5cd43df8fbaf?w=400&h=400&fit=crop&crop=face',
          type: 'individual',
          gender: 'female',
          rating: 4.9,
          totalReviews: 127,
          totalStudents: 450,
          experience: 8,
          specializations: ['Web Development', 'React', 'TypeScript', 'UI/UX'],
          courses: ['Introduction to Web Development', 'Advanced React Patterns'],
          skills: ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'Node.js'],
          certifications: [
            { id: 'cert-1', name: 'Certified React Developer', issuer: 'Meta', year: 2022 },
            { id: 'cert-2', name: 'AWS Solutions Architect', issuer: 'Amazon', year: 2021 },
          ],
          availability: [
            {
              id: 'slot-1',
              date: new Date(2024, 9, 16),
              startTime: '09:00',
              endTime: '11:00',
              status: 'available',
            },
            {
              id: 'slot-2',
              date: new Date(2024, 9, 16),
              startTime: '14:00',
              endTime: '16:00',
              status: 'available',
            },
            {
              id: 'slot-3',
              date: new Date(2024, 9, 17),
              startTime: '10:00',
              endTime: '12:00',
              status: 'available',
            },
            {
              id: 'slot-4',
              date: new Date(2024, 9, 18),
              startTime: '09:00',
              endTime: '11:00',
              status: 'available',
            },
          ],
          rateCard: {
            hourly: 50,
            halfDay: 180,
            fullDay: 320,
            currency: 'USD',
          },
          mode: ['online', 'onsite'],
          location: {
            city: 'Lagos',
            country: 'Nigeria',
            coordinates: { lat: 6.5244, lng: 3.3792 },
          },
          reviews: [
            {
              id: 'review-1',
              studentName: 'Alice Johnson',
              studentImage:
                'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
              rating: 5,
              comment:
                'Excellent instructor! Very patient and knowledgeable. Helped me land my first job.',
              date: new Date(2024, 8, 15),
              course: 'Frontend Bootcamp',
            },
            {
              id: 'review-2',
              studentName: 'Bob Smith',
              studentImage:
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
              rating: 5,
              comment: "Best React course I've taken. Real-world projects and great mentorship.",
              date: new Date(2024, 7, 22),
              course: 'Advanced React',
            },
          ],
        },
        {
          id: 'instructor-2',
          name: 'Prof. Michael Chen',
          title: 'Data Science Expert & AI Researcher',
          bio: 'PhD in Computer Science with focus on Machine Learning and AI. 12+ years of teaching experience. Published researcher and industry consultant.',
          profileImage:
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
          type: 'individual',
          gender: 'male',
          rating: 4.8,
          totalReviews: 89,
          totalStudents: 320,
          experience: 12,
          specializations: ['Data Science', 'Machine Learning', 'Python', 'AI'],
          courses: ['Introduction to Data Science', 'Machine Learning Fundamentals'],
          skills: ['Python', 'TensorFlow', 'Pandas', 'Scikit-learn', 'SQL', 'Statistics'],
          certifications: [
            {
              id: 'cert-3',
              name: 'Deep Learning Specialization',
              issuer: 'DeepLearning.AI',
              year: 2020,
            },
            {
              id: 'cert-4',
              name: 'Google Cloud Professional Data Engineer',
              issuer: 'Google',
              year: 2021,
            },
          ],
          availability: [
            {
              id: 'slot-5',
              date: new Date(2024, 9, 16),
              startTime: '13:00',
              endTime: '15:00',
              status: 'available',
            },
            {
              id: 'slot-6',
              date: new Date(2024, 9, 17),
              startTime: '09:00',
              endTime: '11:00',
              status: 'available',
            },
            {
              id: 'slot-7',
              date: new Date(2024, 9, 19),
              startTime: '10:00',
              endTime: '12:00',
              status: 'available',
            },
          ],
          rateCard: {
            hourly: 75,
            halfDay: 270,
            fullDay: 500,
            currency: 'USD',
          },
          mode: ['online'],
          location: {
            city: 'San Francisco',
            country: 'USA',
            coordinates: { lat: 37.7749, lng: -122.4194 },
          },
          reviews: [
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
          ],
        },
        {
          id: 'instructor-3',
          name: 'Jessica Martinez',
          title: 'UX/UI Design Lead & Mentor',
          bio: '10 years of experience in product design. Worked with Fortune 500 companies. Passionate about teaching design thinking and user-centered design.',
          profileImage:
            'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face',
          type: 'individual',
          gender: 'female',
          rating: 4.9,
          totalReviews: 156,
          totalStudents: 580,
          experience: 10,
          specializations: ['UI/UX Design', 'Product Design', 'Figma', 'Design Systems'],
          courses: ['UI/UX Design Fundamentals', 'Advanced Figma'],
          skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research', 'Wireframing'],
          certifications: [
            {
              id: 'cert-5',
              name: 'Google UX Design Professional Certificate',
              issuer: 'Google',
              year: 2021,
            },
            { id: 'cert-6', name: 'Interaction Design Foundation', issuer: 'IDF', year: 2019 },
          ],
          availability: [
            {
              id: 'slot-8',
              date: new Date(2024, 9, 16),
              startTime: '10:00',
              endTime: '12:00',
              status: 'available',
            },
            {
              id: 'slot-9',
              date: new Date(2024, 9, 16),
              startTime: '15:00',
              endTime: '17:00',
              status: 'available',
            },
            {
              id: 'slot-10',
              date: new Date(2024, 9, 18),
              startTime: '09:00',
              endTime: '11:00',
              status: 'available',
            },
            {
              id: 'slot-11',
              date: new Date(2024, 9, 19),
              startTime: '14:00',
              endTime: '16:00',
              status: 'available',
            },
          ],
          rateCard: {
            hourly: 60,
            halfDay: 220,
            fullDay: 400,
            currency: 'USD',
          },
          mode: ['online', 'onsite'],
          location: {
            city: 'London',
            country: 'UK',
            coordinates: { lat: 51.5074, lng: -0.1278 },
          },
          reviews: [
            {
              id: 'review-4',
              studentName: 'David Brown',
              studentImage:
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
              rating: 5,
              comment:
                'Amazing mentor! Helped me build a portfolio that landed me multiple interviews.',
              date: new Date(2024, 7, 5),
              course: 'UI/UX Design',
            },
          ],
        },
        {
          id: 'instructor-4',
          name: 'Tech Academy Pro',
          title: 'Corporate Training & Development',
          bio: 'Leading corporate training organization specializing in technology education. Team of 20+ expert instructors covering various technical domains.',
          profileImage:
            'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=400&fit=crop&crop=faces',
          type: 'organization',
          rating: 4.7,
          totalReviews: 245,
          totalStudents: 2500,
          experience: 15,
          specializations: [
            'Corporate Training',
            'Full Stack Development',
            'Cloud Computing',
            'DevOps',
          ],
          courses: ['Full Stack Bootcamp', 'AWS Certification Prep', 'DevOps Fundamentals'],
          skills: ['JavaScript', 'Python', 'Java', 'AWS', 'Docker', 'Kubernetes', 'CI/CD'],
          certifications: [
            { id: 'cert-7', name: 'AWS Training Partner', issuer: 'Amazon', year: 2020 },
            { id: 'cert-8', name: 'Microsoft Learning Partner', issuer: 'Microsoft', year: 2021 },
          ],
          availability: [
            {
              id: 'slot-12',
              date: new Date(2024, 9, 16),
              startTime: '09:00',
              endTime: '17:00',
              status: 'available',
            },
            {
              id: 'slot-13',
              date: new Date(2024, 9, 17),
              startTime: '09:00',
              endTime: '17:00',
              status: 'available',
            },
            {
              id: 'slot-14',
              date: new Date(2024, 9, 18),
              startTime: '09:00',
              endTime: '17:00',
              status: 'available',
            },
          ],
          rateCard: {
            hourly: 100,
            halfDay: 350,
            fullDay: 650,
            currency: 'USD',
          },
          mode: ['online', 'onsite'],
          location: {
            city: 'New York',
            country: 'USA',
            coordinates: { lat: 40.7128, lng: -74.006 },
          },
          reviews: [
            {
              id: 'review-5',
              studentName: 'Corporate Client',
              rating: 5,
              comment:
                'Excellent training program for our development team. Very professional and thorough.',
              date: new Date(2024, 8, 1),
              course: 'Full Stack Development',
            },
          ],
        },
      ];
      setInstructors(sampleInstructors);
    }
  }, [instructors?.length, setInstructors]);

  const handleBookingComplete = (newBooking: Booking) => {
    // setBookings((prev: any) => [...prev, newBooking]);
    setActiveTab('bookings');
  };

  const handleBookingUpdate = (updatedBooking: Booking) => {
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
            <div className='rounded-lg bg-blue-100 p-2'>
              <Users className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Available Instructors</p>
              <p className='text-2xl'>{data?.data?.content?.length}</p>
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
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Search className="w-5 h-5 text-purple-600" />
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
        <TabsList>
          <TabsTrigger value='browse'>Browse Instructors</TabsTrigger>
          <TabsTrigger value='bookings'>
            My Bookings {bookings?.length > 0 && `(${bookings?.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='browse' className='mt-6'>
          <InstructorDirectory
            instructors={data?.data?.content as any}
            classes={classes}
            onBookingComplete={handleBookingComplete}
          />
        </TabsContent>

        <TabsContent value='bookings' className='mt-6'>
          <ManageBookings
            bookings={bookings}
            instructors={data?.data?.content as any}
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
