'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStudent } from '@/context/student-context';
import { getStudentScheduleOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  type AvailabilityData,
  type ClassScheduleItem,
  convertToCalendarEvents,
} from '../../@instructor/availability/components/types';
import TimetableManager from './_components/timetable-manager';

const Page = () => {
  const student = useStudent();

  const defaultStartDate = new Date();
  const defaultEndDate = new Date();
  defaultEndDate.setMonth(defaultEndDate.getMonth() + 6); // default 6 months range

  const [startDate, setStartDate] = useState(defaultStartDate.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(defaultEndDate.toISOString().slice(0, 10));

  const {
    data: enrollmentsData,
    refetch,
    isFetching,
  } = useQuery({
    ...getStudentScheduleOptions({
      path: { studentUuid: student?.uuid as string },
      query: { start: startDate as any, end: endDate as any },
    }),
    enabled: !!student?.uuid,
  });
  const enrollments = enrollmentsData?.data ?? [];

  const availabilityData: AvailabilityData = {
    slots: [],
    events: convertToCalendarEvents(enrollments as ClassScheduleItem[]),
    settings: {
      timezone: 'UTC',
      autoAcceptBookings: false,
      bufferTime: 15,
      workingHours: {
        start: '08:00',
        end: '18:00',
      },
    },
  };

  return (
    <div className='space-y-4'>
      {/* Date selectors */}
      <div className='flex items-end justify-end gap-4'>
        <div className='flex flex-col'>
          <Label htmlFor='start-date'>Start Date</Label>
          <Input
            id='start-date'
            type='date'
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className='mt-1'
          />
        </div>
        <div className='flex flex-col'>
          <Label htmlFor='end-date'>End Date</Label>
          <Input
            id='end-date'
            type='date'
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className='mt-1'
          />
        </div>
        <Button onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? 'Loading...' : 'Load Schedule'}
        </Button>
      </div>

      {/* Timetable */}
      <TimetableManager
        availabilityData={availabilityData}
        onAvailabilityUpdate={_updated => { }}
      />
    </div>
  );
};

export default Page;
