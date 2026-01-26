'use client';

import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStudent } from '@/context/student-context';
import { getStudentScheduleOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { Calendar, DoorOpen, GraduationCap } from 'lucide-react';
import { useState } from 'react';
import {
  type AvailabilityData,
  type ClassScheduleItem,
  convertToCalendarEvents,
} from '../../@instructor/availability/components/types';
import ClassroomPage from './_components/classrooms';
import MyClassesPage from './_components/my-classes';
import TimetableManager from './_components/timetable-manager';

const Page = () => {
  const student = useStudent();

  const defaultStartDate = new Date();
  const defaultEndDate = new Date();
  defaultEndDate.setMonth(defaultEndDate.getMonth() + 6);

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

  const [activeTab, setActiveTab] = useState('classes');

  const tabs = [
    {
      id: 'classes',
      label: 'My Classes',
      icon: GraduationCap,
      description: 'View enrolled courses & classes',
    },
    {
      id: 'timetable',
      label: 'Timetable',
      icon: Calendar,
      description: 'schedule',
    },
    {
      id: 'classroom',
      label: 'Classroom',
      icon: DoorOpen,
      description: 'classrooms',
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'classes':
        return <MyClassesPage />;
      case 'classroom':
        return <ClassroomPage />;
      case 'timetable':
      default:
        return (
          <TimetableManager
            availabilityData={availabilityData}
            onAvailabilityUpdate={_updated => {}}
          />
        );
    }
  };

  return (
    <div className='container mx-auto space-y-6 pb-12'>
      {/* Tab Navigation */}
      <div>
        <CardContent className='p-6 px-0'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            {tabs.map(({ id, label, icon: Icon, description }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`group relative overflow-hidden rounded-lg border-2 p-4 text-left transition-all ${
                  activeTab === id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className='flex items-start gap-3'>
                  <div
                    className={`rounded-lg p-2 transition-colors ${
                      activeTab === id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                    }`}
                  >
                    <Icon className='h-5 w-5' />
                  </div>
                  <div className='flex-1 space-y-1'>
                    <h3
                      className={`font-semibold transition-colors ${
                        activeTab === id ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {label}
                    </h3>
                    <p className='text-muted-foreground text-sm'>{description}</p>
                  </div>
                </div>
                {activeTab === id && (
                  <div className='bg-primary absolute bottom-0 left-0 h-1 w-full' />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </div>

      {/* Date Range Selector - Only for Timetable */}
      {activeTab === 'timetable' && (
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
      )}

      {/* Tab Content */}
      <div className='animate-in fade-in-50 duration-300'>{renderTabContent()}</div>
    </div>
  );
};

export default Page;
