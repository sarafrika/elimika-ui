'use client';

import { useInstructor } from '@/context/instructor-context';
import { useUserProfile } from '@/context/profile-context';
import {
  getInstructorAvailabilityOptions,
  getInstructorScheduleOptions
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  type AvailabilityData,
  type ClassScheduleItem,
  convertToCalendarEvents,
  transformAvailabilityArray,
} from '../../availability/components/types';
import TimetableManager from './timetable-manager';

interface TimetablePageProps {
  classesWithCourseAndInstructor: any;
  loading: boolean
}

const TimeTablePage = ({ classesWithCourseAndInstructor, loading }: TimetablePageProps) => {
  const user = useUserProfile();
  const instructor = useInstructor();
  const [transformedSlots, setTransformedSlots] = useState<any[]>([]);

  const { data: availabilitySlotss, refetch } = useQuery(
    getInstructorAvailabilityOptions({ path: { instructorUuid: user?.instructor?.uuid as string } })
  );

  const { data: timetable } = useQuery({
    ...getInstructorScheduleOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: { start: '2024-09-10' as any, end: '2026-11-11' as any },
    }),
    enabled: !!instructor?.uuid,
  });

  const instructorSchedule = timetable?.data ?? []

  const [availabilityData, setAvailabilityData] = useState<AvailabilityData>({
    slots: transformedSlots as any,
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
    <TimetableManager
      availabilityData={availabilityData || []}
      onAvailabilityUpdate={setAvailabilityData}
    />
  );
};

export default TimeTablePage;
