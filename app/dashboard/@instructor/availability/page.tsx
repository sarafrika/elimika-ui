'use client';

import { useInstructor } from '@/context/instructor-context';
import { useUserProfile } from '@/context/profile-context';
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
  const [transformedSlots, setTransformedSlots] = useState<any[]>([]);

  const { data: availabilitySlotss, refetch } = useQuery(
    getInstructorCalendarOptions({
      path: { instructorUuid: user?.instructor?.uuid as string },
      query: { start_date: '2025-09-11' as any, end_date: '2026-11-11' as any },
    })
  );

  const { data: timetable } = useQuery({
    ...getInstructorScheduleOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: { start: '2025-10-10' as any, end: '2025-11-11' as any },
    }),
    enabled: !!instructor?.uuid,
  });

  useEffect(() => {
    const eventsFromSchedule = timetable?.data
      ? convertToCalendarEvents(timetable.data as ClassScheduleItem[])
      : [];

    setAvailabilityData((prev: any) => ({
      ...prev,
      events: eventsFromSchedule, // optionally: [...calendarEvents, ...eventsFromSchedule]
    }));
  }, [availabilitySlotss?.data, timetable?.data]);

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
      availabilityData={availabilityData || []}
      onAvailabilityUpdate={setAvailabilityData}
      classes={[]}
    />
  );
};

export default Page;
