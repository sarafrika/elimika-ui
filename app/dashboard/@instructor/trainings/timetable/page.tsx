'use client';

import { useInstructor } from '@/context/instructor-context';
import {
  getInstructorCalendarOptions
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  type AvailabilityData,
  type ClassScheduleItem,
  convertToCalendarEvents
} from '../../availability/components/types';
import TimetableManager from './timetable-manager';

interface TimetablePageProps {
  classesWithCourseAndInstructor: any;
  loading: boolean
}

const TimeTablePage = ({ classesWithCourseAndInstructor, loading }: TimetablePageProps) => {
  const instructor = useInstructor();
  const [transformedSlots, setTransformedSlots] = useState<any[]>([]);

  // const { data: availabilitySlots, refetch } = useQuery(
  //   getInstructorAvailabilityOptions({ path: { instructorUuid: user?.instructor?.uuid as string } })
  // );

  const { data: timetable } = useQuery({
    ...getInstructorCalendarOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: { start_date: '2024-09-10' as any, end_date: '2026-11-11' as any },
    }),
    enabled: !!instructor?.uuid,
  });

  const instructorSchedule = timetable?.data ?? []

  const [availabilityData, setAvailabilityData] = useState<AvailabilityData>({
    // slots: transformedSlots as any,
    // events: [],
    events: convertToCalendarEvents(instructorSchedule as ClassScheduleItem[]),
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

  // useEffect(() => {
  //   if (availabilitySlots?.data) {
  //     const slots = transformAvailabilityArray(availabilitySlots.data);
  //     setTransformedSlots(slots);

  //     setAvailabilityData((prev: any) => ({
  //       ...prev,
  //       slots,
  //     }));
  //   }
  // }, [availabilitySlots?.data]);

  return (
    <TimetableManager
      availabilityData={availabilityData || []}
      onAvailabilityUpdate={setAvailabilityData}
    />
  );
};

export default TimeTablePage;
