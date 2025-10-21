'use client';

import { useInstructor } from '@/context/instructor-context';
import { useUserProfile } from '@/context/profile-context';
import { getInstructorAvailabilityOptions, getInstructorScheduleOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
];

const Page = () => {
  const user = useUserProfile();
  const instructor = useInstructor()
  const [transformedSlots, setTransformedSlots] = useState<any[]>([]);

  const { data: availabilitySlotss, refetch } = useQuery(
    getInstructorAvailabilityOptions({ path: { instructorUuid: user?.instructor?.uuid as string } })
  );

  const { data: timetable } = useQuery({
    ...getInstructorScheduleOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: { start: "2025-09-10" as any, end: "2025-11-11" as any }
    }),
    enabled: !!instructor?.uuid
  })

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
      classes={[]}
    />
  );
};

export default Page;
