'use client';

import { useInstructor } from '@/context/instructor-context';
import { getInstructorCalendarOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  type AvailabilityData,
  type ClassScheduleItem,
  convertToCalendarEvents,
} from '../../availability/components/types';
import NewTimetableManager from './NewTimeTableManager';

interface TimetablePageProps {
  classesWithCourseAndInstructor: any;
  loading: boolean;
}

const NewTimeTablePage = ({ classesWithCourseAndInstructor, loading }: TimetablePageProps) => {
  const instructor = useInstructor();

  const {
    data: timetable,
    refetch: refetchTimetable,
    isFetching,
  } = useQuery({
    ...getInstructorCalendarOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: { start_date: '2024-09-10' as any, end_date: '2026-11-11' as any },
    }),
    enabled: !!instructor?.uuid,
  });

  const instructorSchedule = timetable?.data ?? [];

  const [availabilityData, setAvailabilityData] = useState<AvailabilityData>({
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

  const handleAvailabilityUpdate = async (updatedAvailability: AvailabilityData) => {
    setAvailabilityData(updatedAvailability);

    const refreshed = await refetchTimetable();

    const newEvents = refreshed.data?.data
      ? convertToCalendarEvents(refreshed.data.data as ClassScheduleItem[])
      : [];

    setAvailabilityData(prev => ({
      ...prev,
      events: newEvents,
    }));
  };

  return (
    <NewTimetableManager
      availabilityData={availabilityData || []}
      onAvailabilityUpdate={handleAvailabilityUpdate}
      classes={classesWithCourseAndInstructor}
    />
  );
};

export default NewTimeTablePage;
