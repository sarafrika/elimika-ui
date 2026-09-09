'use client';

import { useUserProfile } from '@/context/profile-context';
import { localDate, resolveDisplayZone } from '@/lib/date';
import { getInstructorCalendarOptions } from '@/services/client/@tanstack/react-query.gen';
import type { InstructorCalendarEntry } from '@/services/client/types.gen';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import AvailabilityManager from './components/availability-manager';
import { type AvailabilityData, type CalendarEvent, toCalendarInstants } from './components/types';

const Page = () => {
  const user = useUserProfile();
  const displayZone = useMemo(() => resolveDisplayZone(), []);
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

  const [availabilityData, setAvailabilityData] = useState<AvailabilityData>(() => ({
    events: [],
    settings: {
      timezone: displayZone,
      autoAcceptBookings: false,
      bufferTime: 15,
      workingHours: {
        start: '08:00',
        end: '18:00',
      },
    },
  }));

  useEffect(() => {
    const calendarEvents: CalendarEvent[] = (availabilitySlotsResponse?.data ?? []).map(
      (entry: InstructorCalendarEntry) => {
        const instants = toCalendarInstants(entry.start_time, entry.end_time, displayZone);

        return {
          id: entry.uuid ?? `${instants.startDateTime}-${entry.entry_type ?? 'event'}`,
          title: entry.title ?? entry.entry_type ?? 'Availability',
          ...instants,
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
  }, [availabilitySlotsResponse?.data, displayZone]);

  return (
    <AvailabilityManager
      availabilityData={availabilityData}
      onAvailabilityUpdate={setAvailabilityData}
      classes={[]}
    />
  );
};

export default Page;
