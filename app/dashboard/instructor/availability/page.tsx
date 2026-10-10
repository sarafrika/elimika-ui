'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useUserProfile } from '@/context/profile-context';
import { dateWindow, resolveDisplayZone } from '@/lib/date';
import { jobTimeKind, jobTimeTitle } from '@/lib/instructor-job-time';
import { getInstructorCalendarOptions } from '@/services/client/@tanstack/react-query.gen';
import type { InstructorCalendarEntry } from '@/services/client/types.gen';
import AvailabilityManager from './components/availability-manager';
import { type AvailabilityData, type CalendarEvent, toCalendarInstants } from './components/types';

const Page = () => {
  const user = useUserProfile();
  const displayZone = useMemo(() => resolveDisplayZone(), []);
  const calendarRange = useMemo(() => {
    const { start, end } = dateWindow({ pastMonths: 3, futureMonths: 9 });
    return { start_date: start, end_date: end };
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
        const jobKind = jobTimeKind(entry.entry_type);

        return {
          id: entry.uuid ?? `${instants.startDateTime}-${entry.entry_type ?? 'event'}`,
          title: jobKind
            ? jobTimeTitle(jobKind, entry.title)
            : (entry.title ?? entry.entry_type ?? 'Availability'),
          ...instants,
          location: entry.location_type,
          attendees: 0,
          isRecurring: false,
          recurringDays: [],
          status: entry.status ?? 'SCHEDULED',
          is_available: entry.is_available,
          entry_type: entry.entry_type,
          organisation: entry.organisation_name || undefined,
          jobUuid: entry.job_uuid || undefined,
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
    />
  );
};

export default Page;
