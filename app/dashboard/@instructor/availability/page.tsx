'use client';

import { useInstructor } from '@/context/instructor-context';
import { useUserProfile } from '@/context/profile-context';
import { getInstructorAvailabilityOptions, getInstructorScheduleOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ClassData } from '../trainings/create-new/academic-period-form';
import AvailabilityManager from './components/availability-manager';

export type AvailabilitySlot = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  date?: Date;
  status: 'available' | 'unavailable' | 'reserved' | 'booked';
  recurring?: boolean;
  note?: string;
  is_available?: boolean;
  custom_pattern?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  type: 'booked' | 'available' | 'unavailable' | 'reserved';
  startTime: string;
  endTime: string;
  date: Date;
  day: string;
  location?: string;
  attendees?: number;
  isRecurring?: boolean;
  recurringDays?: string[];
  status: 'available' | 'unavailable' | 'reserved' | 'booked';
  color?: string;
  reminders?: number[];
  notes?: string;
};

export type AvailabilityData = {
  slots: AvailabilitySlot[];
  events: CalendarEvent[];
  settings: {
    timezone: string;
    autoAcceptBookings: boolean;
    bufferTime: number; // minutes between slots
    workingHours: {
      start: string;
      end: string;
    };
  };
};

function transformAvailabilityArray(dataArray: any[]) {
  const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return dataArray?.map(data => ({
    id: data.uuid,
    day: dayMap[data.day_of_week ?? 0],
    startTime: data.start_time?.slice(0, 5),
    endTime: data.end_time?.slice(0, 5),
    status: data.is_available ? 'available' : 'unavailable',
    recurring: data.availability_type === 'weekly',
    note: data.availability_description || '',
    is_available: data.is_available,
    custom_pattern: data.custom_pattern || '',
  }));
}

type ClassScheduleItem = {
  uuid: string;
  title: string;
  start_time: Date;
  end_time: Date;
  status: string;
  location_type: string;
  max_participants: number;
  cancellation_reason?: string | null;
};

export function convertToCalendarEvents(classes: ClassScheduleItem[]): CalendarEvent[] {
  return classes.map(item => {
    const start = new Date(item.start_time);
    const end = new Date(item.end_time);

    const getTimeString = (date: Date) => date.toTimeString().slice(0, 5);
    const getDayName = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long' });

    // Optional: determine color by status (use normalized uppercase key)
    const colorMap: Record<string, string> = {
      SCHEDULED: '#1E90FF',
      CANCELLED: '#FF6B6B',
      COMPLETED: '#2ECC71',
    };

    // Map incoming status strings to the allowed CalendarEvent['status'] union
    const statusMap: Record<string, CalendarEvent['status']> = {
      SCHEDULED: 'booked',
      CANCELLED: 'unavailable',
      COMPLETED: 'booked',
      RESERVED: 'reserved',
      BOOKED: 'booked',
      AVAILABLE: 'available',
    };

    const statusKey = String(item.status ?? '').toUpperCase();
    const mappedStatus = statusMap[statusKey] ?? 'booked';

    return {
      id: item.uuid,
      title: item.title,
      type: 'booked',
      startTime: getTimeString(start),
      endTime: getTimeString(end),
      date: new Date(start.toDateString()),
      day: getDayName(start),
      location: item.location_type === 'ONLINE' ? 'Zoom' : item.location_type,
      attendees: item.max_participants,
      isRecurring: false,
      recurringDays: [],
      status: mappedStatus,
      color: colorMap[statusKey] || '#888',
      reminders: [15],
      notes: item.cancellation_reason || '',
    };
  });
}

// const availabilitySlots: AvailabilitySlot[] = [
//   {
//     id: '1de5a1c7-1d9d-4d1d-9339-0080384c3150',
//     day: 'Tuesday',
//     startTime: '12:00',
//     endTime: '18:30',
//     status: 'available',
//     recurring: true,
//     note: 'Weekly on Tuesday',
//     is_available: true,
//     custom_pattern: '',
//   },
//   {
//     id: 'slot-1',
//     day: 'Monday',
//     startTime: '09:00',
//     endTime: '10:00',
//     status: 'available',
//     recurring: true,
//     note: 'Morning availability',
//     is_available: true,
//     custom_pattern: '',
//   },
//   {
//     id: 'slot-2',
//     day: 'Monday',
//     startTime: '10:30',
//     endTime: '11:30',
//     status: 'booked',
//     date: new Date('2025-10-06'),
//     is_available: false,
//   },
//   {
//     id: 'slot-3',
//     day: 'Tuesday',
//     startTime: '13:00',
//     endTime: '14:00',
//     status: 'available',
//     recurring: true,
//     is_available: true,
//   },
//   {
//     id: 'slot-4',
//     day: 'Tuesday',
//     startTime: '15:00',
//     endTime: '16:00',
//     status: 'unavailable',
//     note: 'Out of office',
//     is_available: false,
//   },
//   {
//     id: 'slot-5',
//     day: 'Wednesday',
//     startTime: '08:00',
//     endTime: '09:00',
//     status: 'reserved',
//     date: new Date('2025-10-08'),
//     is_available: false,
//   },
//   {
//     id: 'slot-6',
//     day: 'Wednesday',
//     startTime: '11:00',
//     endTime: '12:00',
//     status: 'available',
//     recurring: true,
//     is_available: true,
//   },
//   {
//     id: 'slot-7',
//     day: 'Thursday',
//     startTime: '14:00',
//     endTime: '15:00',
//     status: 'booked',
//     date: new Date('2025-10-09'),
//     is_available: false,
//   },
//   {
//     id: 'slot-8',
//     day: 'Thursday',
//     startTime: '16:00',
//     endTime: '17:00',
//     status: 'available',
//     is_available: true,
//   },
//   {
//     id: 'slot-9',
//     day: 'Friday',
//     startTime: '09:00',
//     endTime: '10:00',
//     status: 'reserved',
//     date: new Date('2025-10-10'),
//     is_available: true,
//   },
//   {
//     id: 'slot-10',
//     day: 'Friday',
//     startTime: '10:30',
//     endTime: '11:30',
//     status: 'available',
//     recurring: true,
//     note: 'Weekly check-in slot',
//     is_available: true,
//   },
// ];

const calendarEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Team Standup',
    type: 'booked',
    startTime: '09:00',
    endTime: '09:30',
    date: new Date('2025-10-01'),
    day: 'Wednesday',
    location: 'Zoom',
    attendees: 6,
    isRecurring: true,
    recurringDays: ['Monday', 'Wednesday', 'Friday'],
    status: 'booked',
    color: '#1E90FF',
    reminders: [10],
    notes: 'Daily team sync-up',
  },
  {
    id: 'event-2',
    title: 'Client Presentation',
    type: 'reserved',
    startTime: '11:00',
    endTime: '12:00',
    date: new Date('2025-10-02'),
    day: 'Thursday',
    location: 'Client HQ',
    attendees: 3,
    status: 'booked',
    color: '#FF6347',
    reminders: [30, 10],
  },
  {
    id: 'event-3',
    title: 'Lunch Break',
    type: 'unavailable',
    startTime: '12:30',
    endTime: '13:30',
    date: new Date('2025-10-01'),
    day: 'Wednesday',
    status: 'unavailable',
    color: '#98FB98',
    isRecurring: true,
    recurringDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  },
  {
    id: 'event-4',
    title: 'Yoga Session',
    type: 'unavailable',
    startTime: '07:00',
    endTime: '08:00',
    date: new Date('2025-10-03'),
    day: 'Friday',
    location: 'Home Gym',
    status: 'available',
    color: '#FFD700',
    reminders: [60],
  },
  {
    id: 'event-5',
    title: 'React Workshop',
    type: 'unavailable',
    startTime: '14:00',
    endTime: '16:00',
    date: new Date('2025-10-05'),
    day: 'Sunday',
    location: 'Tech Center Room B',
    attendees: 25,
    status: 'booked',
    color: '#00CED1',
    notes: 'Bring laptop and charger',
  },
  {
    id: 'event-6',
    title: '1:1 Check-in with Manager',
    type: 'unavailable',
    startTime: '10:00',
    endTime: '10:30',
    date: new Date('2025-10-07'),
    day: 'Tuesday',
    location: 'Office Room 402',
    attendees: 2,
    status: 'reserved',
    color: '#9370DB',
    reminders: [15],
  },
  {
    id: 'event-7',
    title: 'Doctor Appointment',
    type: 'unavailable',
    startTime: '16:00',
    endTime: '17:00',
    date: new Date('2025-10-04'),
    day: 'Saturday',
    location: 'Health Clinic',
    status: 'booked',
    reminders: [1440, 60],
    color: '#DC143C',
  },
  {
    id: 'event-8',
    title: 'Weekly Strategy Session',
    type: 'booked',
    startTime: '15:00',
    endTime: '16:00',
    date: new Date('2025-10-03'),
    day: 'Friday',
    location: 'Board Room',
    attendees: 8,
    isRecurring: true,
    recurringDays: ['Friday'],
    status: 'booked',
    color: '#4682B4',
    reminders: [30],
  },
  {
    id: 'event-9',
    title: 'Annual Tech Conference',
    type: 'booked',
    startTime: '09:00',
    endTime: '17:00',
    date: new Date('2025-10-10'),
    day: 'Friday',
    location: 'Convention Center',
    attendees: 150,
    status: 'booked',
    color: '#FF8C00',
    notes: 'All-day event. RSVP required.',
  },
  {
    id: 'event-10',
    title: 'Reading Time',
    type: 'unavailable',
    startTime: '20:00',
    endTime: '21:00',
    date: new Date('2025-10-02'),
    day: 'Thursday',
    status: 'available',
    color: '#8FBC8F',
    isRecurring: true,
    recurringDays: ['Tuesday', 'Thursday'],
  },
];

const sampleClassData: ClassData[] = [
  {
    courseTitle: 'Introduction to Web Development',
    classTitle: 'Frontend Bootcamp - Beginner',
    category: 'Programming',
    targetAudience: ['Beginners', 'Aspiring Developers'],
    description: 'A beginner-friendly bootcamp to learn HTML, CSS, and JavaScript from scratch.',
    academicPeriod: {
      startDate: new Date('2025-10-10'),
      endDate: new Date('2026-01-10'),
    },
    registrationPeriod: {
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-10-05'),
    },
    timetable: {
      selectedDays: ['Monday', 'Wednesday', 'Friday'],
      timeSlots: [
        { day: 'Monday', startTime: '09:00', endTime: '11:00' },
        { day: 'Wednesday', startTime: '09:00', endTime: '11:00' },
        { day: 'Friday', startTime: '09:00', endTime: '11:00' },
      ],
      duration: '2h',
      timezone: 'UTC+1',
      classType: 'online',
    },
    schedule: {
      instructor: 'instructor-123',
      skills: [
        {
          id: 'skill-html',
          title: 'HTML Basics',
          lessons: [
            {
              id: 'lesson-1',
              title: 'Intro to HTML',
              duration: '30m',
              date: new Date('2025-10-10'),
              time: '09:00',
            },
            { id: 'lesson-2', title: 'Semantic Tags', duration: '30m' },
          ],
        },
      ],
    },
    visibility: {
      publicity: 'public',
      enrollmentLimit: 30,
      price: 0,
      isFree: true,
    },
    resources: [
      { id: 'res-1', type: 'link', name: 'HTML Cheat Sheet', url: 'https://htmlcheatsheet.com' },
    ],
    assessments: [
      {
        id: 'assess-1',
        type: 'quiz',
        title: 'HTML Basics Quiz',
        description: 'A short quiz to test your HTML knowledge.',
      },
    ],
    status: 'published',
  },

  {
    courseTitle: 'Creative Graphic Design',
    classTitle: 'Photoshop Mastery',
    subtitle: 'Level up your design skills',
    category: 'Design',
    targetAudience: ['Design Students', 'Marketing Teams'],
    description:
      'Learn Adobe Photoshop from industry experts. Build real-world projects for your portfolio.',
    academicPeriod: {
      startDate: new Date('2025-11-01'),
      endDate: new Date('2026-02-15'),
    },
    registrationPeriod: {
      startDate: new Date('2025-10-01'),
      endDate: new Date('2025-10-30'),
    },
    timetable: {
      selectedDays: ['Tuesday', 'Thursday'],
      timeSlots: [
        { day: 'Tuesday', startTime: '14:00', endTime: '16:00' },
        { day: 'Thursday', startTime: '14:00', endTime: '16:00' },
      ],
      duration: '2h',
      timezone: 'UTC+1',
      classType: 'hybrid',
      location: 'Design Studio, Lagos',
    },
    schedule: {
      instructor: 'instructor-456',
      skills: [
        {
          id: 'skill-ps',
          title: 'Photoshop Fundamentals',
          lessons: [
            { id: 'lesson-3', title: 'Tools Overview', duration: '1h' },
            { id: 'lesson-4', title: 'Layers and Masks', duration: '1h' },
          ],
        },
      ],
    },
    visibility: {
      publicity: 'private',
      enrollmentLimit: 15,
      price: 150,
      isFree: false,
    },
    resources: [
      {
        id: 'res-2',
        type: 'file',
        name: 'Design Assets.zip',
        url: 'https://example.com/assets.zip',
      },
    ],
    assessments: [
      {
        id: 'assess-2',
        type: 'assignment',
        title: 'Portfolio Project',
        description: 'Design a brand poster using learned techniques.',
      },
    ],
    status: 'published',
  },

  {
    courseTitle: 'Startup Business 101',
    classTitle: 'Entrepreneurship Essentials',
    subtitle: 'Build your business from idea to execution',
    category: 'Business',
    targetAudience: ['Aspiring Entrepreneurs', 'Small Business Owners'],
    description:
      'This course guides you through the key steps in starting and running a successful business.',
    academicPeriod: {
      startDate: new Date('2026-01-05'),
      endDate: new Date('2026-03-30'),
    },
    registrationPeriod: {
      startDate: new Date('2025-12-01'),
    },
    timetable: {
      selectedDays: ['Saturday'],
      timeSlots: [{ day: 'Saturday', startTime: '10:00', endTime: '13:00' }],
      duration: '3h',
      timezone: 'UTC',
      classType: 'in-person',
      location: 'Startup Hub, Abuja',
    },
    schedule: {
      instructor: 'instructor-789',
      skills: [
        {
          id: 'skill-biz',
          title: 'Business Planning',
          lessons: [
            { id: 'lesson-5', title: 'Business Models', duration: '1h' },
            { id: 'lesson-6', title: 'Market Research', duration: '1h' },
          ],
        },
      ],
    },
    visibility: {
      publicity: 'public',
      enrollmentLimit: 50,
      price: 200,
      isFree: false,
    },
    resources: [
      {
        id: 'res-3',
        type: 'link',
        name: 'Business Model Canvas',
        url: 'https://strategyzer.com/canvas/business-model-canvas',
      },
    ],
    assessments: [
      {
        id: 'assess-3',
        type: 'assignment',
        title: 'Business Plan Draft',
        description: 'Submit your initial business plan for feedback.',
      },
    ],
    status: 'draft',
  },
];

const Page = () => {
  const user = useUserProfile();
  const instructor = useInstructor()
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [transformedSlots, setTransformedSlots] = useState<any[]>([]);

  const { data: availabilitySlotss, refetch } = useQuery(
    getInstructorAvailabilityOptions({ path: { instructorUuid: user?.instructor?.uuid as string } })
  );

  console.log(availabilitySlotss, "here")

  console.log(instructor, "TT")

  const { data: timetable } = useQuery({
    ...getInstructorScheduleOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: { start: "2025-10-10" as any, end: "2025-11-11" as any }
    }),
    enabled: !!instructor?.uuid
  })
  console.log(timetable, "TT")

  useEffect(() => {
    const slots = availabilitySlotss?.data
      ? transformAvailabilityArray(availabilitySlotss.data)
      : [];

    const eventsFromSchedule = timetable?.data
      ? convertToCalendarEvents(timetable.data as ClassScheduleItem[])
      : [];

    setAvailabilityData((prev: any) => ({
      ...prev,
      slots,
      events: eventsFromSchedule, // optionally: [...calendarEvents, ...eventsFromSchedule]
    }));

    setTransformedSlots(slots);
  }, [availabilitySlotss?.data, timetable?.data]);


  // const calendarEvents = convertToCalendarEvents(timetable && timetable?.data as any);
  // console.log(calendarEvents, "CE")

  const [availabilityData, setAvailabilityData] = useState<AvailabilityData>({
    slots: transformedSlots as any,
    events: calendarEvents,
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
    if (availabilitySlotss?.data) {
      const slots = transformAvailabilityArray(availabilitySlotss.data);
      setTransformedSlots(slots);

      setAvailabilityData((prev: any) => ({
        ...prev,
        slots,
      }));
    }
  }, [availabilitySlotss?.data]);

  return (
    <AvailabilityManager
      availabilityData={availabilityData || []}
      onAvailabilityUpdate={setAvailabilityData}
      classes={sampleClassData}
    />
  );
};

export default Page;
