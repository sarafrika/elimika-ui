'use client';

import { useInstructor } from '@/context/instructor-context';
import { useUserProfile } from '@/context/profile-context';
import type { InstructorCalendarEntry } from '@/services/client/types.gen';
import {
  getInstructorCalendarOptions,
  getInstructorScheduleOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import AvailabilityManager from './components/availability-manager';
import {
  type AvailabilityData,
  type ClassScheduleItem,
  convertToCalendarEvents,
} from './components/types';

const Page = () => {
  const user = useUserProfile();
  const instructor = useInstructor();

  const { data: availabilitySlotsResponse } = useQuery(
    getInstructorCalendarOptions({
      path: { instructorUuid: user?.instructor?.uuid as string },
      query: {
        start_date: new Date('2025-09-11'),
        end_date: new Date('2026-11-11'),
      },
    })
  );

  const { data: timetable } = useQuery({
    ...getInstructorScheduleOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: {
        start: new Date('2025-10-10'),
        end: new Date('2025-11-11'),
      },
    }),
    enabled: !!instructor?.uuid,
  });

  useEffect(() => {
    const eventsFromSchedule = timetable?.data
      ? convertToCalendarEvents(timetable.data as ClassScheduleItem[])
      : [];

    const calendarEvents = (availabilitySlotsResponse?.data ?? []).map(
      (entry: InstructorCalendarEntry) => {
        const start = entry.start_time ? new Date(entry.start_time) : new Date();
        const end = entry.end_time ? new Date(entry.end_time) : start;

        return {
          id: entry.uuid ?? `${start.toISOString()}-${entry.entry_type ?? 'event'}`,
          title: entry.title ?? entry.entry_type ?? 'Availability',
          startTime: start.toTimeString().slice(0, 5),
          endTime: end.toTimeString().slice(0, 5),
          startDateTime: start.toISOString().slice(0, 19),
          endDateTime: end.toISOString().slice(0, 19),
          date: new Date(start.toDateString()),
          day: start.toLocaleDateString('en-US', { weekday: 'long' }),
          location: entry.location_type,
          attendees: 0,
          isRecurring: false,
          recurringDays: [],
          status: entry.status ?? 'SCHEDULED',
          is_available: entry.is_available,
          entry_type: entry.entry_type,
        };
      }
    );

    setAvailabilityData(prev => ({
      ...prev,
      events: [...calendarEvents, ...eventsFromSchedule],
    }));
  }, [availabilitySlotsResponse?.data, timetable?.data]);

  const [availabilityData, setAvailabilityData] = useState<AvailabilityData>({
    events: [],
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

  return (
    <AvailabilityManager
      availabilityData={availabilityData}
      onAvailabilityUpdate={setAvailabilityData}
      classes={[]}
    />
  );
};

export default Page;
