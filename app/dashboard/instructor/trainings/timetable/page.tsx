'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import type { DashboardClass } from '@/app/dashboard/_components/types';
import { useInstructor } from '@/context/instructor-context';
import { useCalendarFetchRange } from '@/lib/calendar-range';
import { localDate } from '@/lib/date';
import { getInstructorCalendarOptions } from '@/services/client/@tanstack/react-query.gen';
import {
  type AvailabilityData,
  type ClassScheduleItem,
  convertToCalendarEvents,
} from '../../availability/components/types';
import TimetableManager from './timetable-manager';

interface TimetablePageProps {
  classesWithCourseAndInstructor: DashboardClass[];
  loading: boolean;
}

const TimeTablePage = ({ classesWithCourseAndInstructor, loading }: TimetablePageProps) => {
  const instructor = useInstructor();
  const [visibleRange, setVisibleRange] = useCalendarFetchRange();
  const scheduleRange = useMemo(
    () => ({ start_date: localDate(visibleRange.start), end_date: localDate(visibleRange.end) }),
    [visibleRange.end, visibleRange.start]
  );

  const {
    data: timetable,
    refetch: refetchTimetable,
    isFetching,
  } = useQuery({
    ...getInstructorCalendarOptions({
      path: { instructorUuid: instructor?.uuid as string },
      query: scheduleRange,
    }),
    enabled: !!instructor?.uuid,
    placeholderData: keepPreviousData,
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

    setAvailabilityData(prev => ({
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
    <TimetableManager
      availabilityData={availabilityData}
      onAvailabilityUpdate={handleAvailabilityUpdate}
      onVisibleRangeChange={setVisibleRange}
    />
  );
};

export default TimeTablePage;
