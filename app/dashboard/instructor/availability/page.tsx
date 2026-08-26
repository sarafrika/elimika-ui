'use client';

import { useUserProfile } from '@/context/profile-context';
import { localDate } from '@/lib/date';
import { getInstructorCalendarOptions } from '@/services/client/@tanstack/react-query.gen';
import type { InstructorCalendarEntry } from '@/services/client/types.gen';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import AvailabilityManager from './components/availability-manager';
import { type AvailabilityData } from './components/types';

const Page = () => {
  const user = useUserProfile();
  const calendarRange = useMemo(() => {
    const start = new Date();
    start.setFullYear(start.getFullYear() - 2);
    const end = new Date();
    end.setFullYear(end.getFullYear() + 2);
    return {
      start_date: localDate(start),
      end_date: localDate(end),
    };
  }, []);

  const { data: availabilitySlotsResponse } = useQuery({
    ...getInstructorCalendarOptions({
      path: { instructorUuid: user?.instructor?.uuid as string },
      query: calendarRange,
    }),
    enabled: !!user?.instructor?.uuid,
  });

  useEffect(() => {
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
      events: calendarEvents,
    }));
  }, [availabilitySlotsResponse?.data]);

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
