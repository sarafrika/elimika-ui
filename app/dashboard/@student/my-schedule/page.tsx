'use client';

import {
  getStudentScheduleOptions
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useStudent } from '@/context/student-context';
import { AvailabilityData, ClassScheduleItem, convertToCalendarEvents } from '../../@instructor/availability/components/types';
import TimetableManager from './_components/timetable-manager';

const Page = () => {
  const student = useStudent();

  const { data: timetable } = useQuery({
    ...getStudentScheduleOptions({
      path: { studentUuid: student?.uuid as string },
      query: { start: '2025-09-10' as any, end: '2025-11-11' as any },
    }),
    enabled: !!student?.uuid,
  });

  const [availabilityData, setAvailabilityData] = useState<AvailabilityData>({
    slots: [],
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

  useEffect(() => {
    const eventsFromSchedule = timetable?.data
      ? convertToCalendarEvents(timetable.data as ClassScheduleItem[])
      : [];

    setAvailabilityData((prev: any) => ({
      ...prev,
      events: eventsFromSchedule,
    }));
  }, [timetable?.data]);

  return (
    <TimetableManager
      availabilityData={availabilityData || []}
      onAvailabilityUpdate={setAvailabilityData}
    />
  );
};

export default Page;
