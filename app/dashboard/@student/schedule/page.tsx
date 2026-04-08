'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStudent } from '@/context/student-context';
import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import { cx, getCardClasses, getStatCardClasses } from '@/lib/design-system';
import { endOfDay, format, startOfDay } from 'date-fns';
import { Calendar, DoorOpen, GraduationCap, LayoutGrid, RefreshCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import ClassroomPage from './_components/classrooms';
import MyClassesPage from './_components/my-classes';
import {
  buildStudentScheduleInstances,
  getNextScheduleInstance,
} from './_components/schedule-data';
import TimetableManager from './_components/timetable-manager';

const tabs = [
  {
    id: 'classes',
    label: 'My Classes',
    icon: GraduationCap,
    description: 'Browse the classes you are already enrolled in.',
  },
  {
    id: 'timetable',
    label: 'Timetable',
    icon: Calendar,
    description: 'See your class sessions in calendar and agenda views.',
  },
  {
    id: 'classroom',
    label: 'Classroom',
    icon: DoorOpen,
    description: 'Check rooms, venues, and virtual meeting destinations.',
  },
] as const;

const Page = () => {
  const student = useStudent();
  const { classDefinitions, isError, loading } = useStudentClassDefinitions(student ?? undefined);
  const scheduleInstances = useMemo(
    () => buildStudentScheduleInstances(classDefinitions),
    [classDefinitions]
  );

  const defaultStartDate = new Date();
  const defaultEndDate = new Date();
  defaultEndDate.setMonth(defaultEndDate.getMonth() + 6);

  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('classes');
  const [startDate, setStartDate] = useState(defaultStartDate.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(defaultEndDate.toISOString().slice(0, 10));

  const filteredScheduleInstances = useMemo(() => {
    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));

    return scheduleInstances.filter(instance => {
      const instanceStart = new Date(instance.startTime);
      return instanceStart >= start && instanceStart <= end;
    });
  }, [endDate, scheduleInstances, startDate]);

  const nextSession = useMemo(
    () => getNextScheduleInstance(scheduleInstances),
    [scheduleInstances]
  );

  const statCards = [
    {
      label: 'Enrolled classes',
      value: classDefinitions.length,
      helper: 'Classes currently tied to your learner profile',
      icon: GraduationCap,
    },
    {
      label: 'Scheduled sessions',
      value: scheduleInstances.length,
      helper: 'All class schedule instances available to you',
      icon: Calendar,
    },
    {
      label: 'Visible in range',
      value: filteredScheduleInstances.length,
      helper: `${format(new Date(startDate), 'MMM d')} to ${format(new Date(endDate), 'MMM d, yyyy')}`,
      icon: LayoutGrid,
    },
    {
      label: 'Next session',
      value: nextSession ? format(new Date(nextSession.startTime), 'EEE, MMM d') : 'None yet',
      helper: nextSession
        ? `${nextSession.timeRange} · ${nextSession.classTitle}`
        : 'No upcoming session found',
      icon: RefreshCcw,
    },
  ];

  return (
    <div className='space-y-6 pb-12'>
      <section className={cx(getCardClasses(), 'overflow-hidden p-0')}>
        <CardContent className='grid gap-6 p-5 sm:p-6 xl:grid-cols-[1.2fr_0.8fr] xl:p-8'>
          <div className='space-y-4'>
            <div className='border-primary/20 bg-primary/5 text-primary inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold'>
              <Calendar className='h-3.5 w-3.5' />
              Student schedule
            </div>
            <div className='space-y-2'>
              <h1 className='text-foreground text-2xl font-semibold sm:text-3xl'>
                Keep classes, sessions, and rooms in one place.
              </h1>
              <p className='text-muted-foreground max-w-2xl text-sm sm:text-base'>
                Track enrolled classes, inspect upcoming schedule instances, and jump straight into
                online sessions when a meeting link is available.
              </p>
            </div>
          </div>

          <div className='grid gap-3 sm:grid-cols-2'>
            {statCards.map(card => (
              <Card key={card.label} className={getStatCardClasses()}>
                <CardContent className='p-0'>
                  <div className='flex items-start gap-4'>
                    <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                      <card.icon className='h-5 w-5' />
                    </div>
                    <div className='min-w-0'>
                      <p className='text-muted-foreground text-sm'>{card.label}</p>
                      <p className='text-foreground text-2xl font-semibold'>{card.value}</p>
                      <p className='text-muted-foreground text-xs'>{card.helper}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </section>

      <section className='grid gap-3 md:grid-cols-3'>
        {tabs.map(({ id, label, icon: Icon, description }) => (
          <button
            key={id}
            type='button'
            onClick={() => setActiveTab(id)}
            className={cx(
              getCardClasses(),
              'p-4 text-left transition-all sm:p-5',
              activeTab === id
                ? 'border-primary/40 bg-primary/5 shadow-md'
                : 'hover:border-primary/30 hover:bg-muted/30'
            )}
          >
            <div className='flex items-start gap-3'>
              <div
                className={cx(
                  'rounded-2xl p-3',
                  activeTab === id ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary'
                )}
              >
                <Icon className='h-5 w-5' />
              </div>
              <div className='min-w-0'>
                <h2 className='text-foreground text-base font-semibold'>{label}</h2>
                <p className='text-muted-foreground mt-1 text-sm'>{description}</p>
              </div>
            </div>
          </button>
        ))}
      </section>

      {activeTab === 'timetable' && (
        <section className={cx(getCardClasses(), 'p-4 sm:p-6')}>
          <div className='grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end'>
            <div className='space-y-1'>
              <h2 className='text-foreground text-lg font-semibold'>Schedule range</h2>
              <p className='text-muted-foreground text-sm'>
                Narrow the timetable to the dates you want to review.
              </p>
            </div>

            <div className='grid gap-3 sm:grid-cols-3'>
              <div className='space-y-2'>
                <Label htmlFor='start-date'>Start date</Label>
                <Input
                  id='start-date'
                  type='date'
                  value={startDate}
                  onChange={event => setStartDate(event.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='end-date'>End date</Label>
                <Input
                  id='end-date'
                  type='date'
                  value={endDate}
                  onChange={event => setEndDate(event.target.value)}
                />
              </div>
              <div className='flex items-end'>
                <Button
                  variant='outline'
                  className='w-full'
                  onClick={() => {
                    setStartDate(defaultStartDate.toISOString().slice(0, 10));
                    setEndDate(defaultEndDate.toISOString().slice(0, 10));
                  }}
                >
                  Reset range
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className='animate-in fade-in-50 duration-300'>
        {activeTab === 'classes' && (
          <MyClassesPage classDefinitions={classDefinitions} isError={isError} loading={loading} />
        )}
        {activeTab === 'timetable' && (
          <TimetableManager
            classDefinitions={classDefinitions}
            loading={loading}
            scheduleInstances={filteredScheduleInstances}
          />
        )}
        {activeTab === 'classroom' && (
          <ClassroomPage
            classDefinitions={classDefinitions}
            loading={loading}
            scheduleInstances={scheduleInstances}
          />
        )}
      </div>
    </div>
  );
};

export default Page;
