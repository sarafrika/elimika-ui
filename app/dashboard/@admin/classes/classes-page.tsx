'use client';

import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  COLOR_PALETTE,
  ScheduleCalendarHeader,
  ScheduleCompactActions,
  ScheduleDayView,
  ScheduleFiltersPanel,
  ScheduleLoadingState,
  ScheduleMonthView,
  ScheduleSessionDetailsPanel,
  ScheduleWeekView,
  ScheduleYearView,
  Skeleton,
} from '@/components/schedule/ClassScheduleShared';
import type {
  CalendarEvent,
  ClassDefinition,
  ClassSchedule,
  ScheduleFilterSection,
  StudentEnrollment,
  ViewMode,
} from '@/components/schedule/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import useAmdinClassesWithDetails from '@/hooks/use-admin-classes';
import { useCompactScheduleLayout } from '@/hooks/use-compact-schedule-layout';
import { useStudentsMap } from '@/hooks/use-studentsMap';
import { getEnrollmentsForInstanceOptions } from '@/services/client/@tanstack/react-query.gen';

export default function AdminClassPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | 'all'>('all');
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    classes: true,
    instructors: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltersSheetOpen, setIsFiltersSheetOpen] = useState(false);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const lastAutoFocusKeyRef = useRef<string | null>(null);

  const isCompactLayout = useCompactScheduleLayout();

  const { classes: classesWithCourseAndInstructor, isPending } = useAmdinClassesWithDetails();

  const allEvents = useMemo<CalendarEvent[]>(() => {
    if (!classesWithCourseAndInstructor) return [];

    const events: CalendarEvent[] = [];
    classesWithCourseAndInstructor.forEach((classDef: ClassDefinition, classIndex: number) => {
      const color = COLOR_PALETTE[classIndex % COLOR_PALETTE.length];
      classDef.schedule?.forEach((scheduleItem: ClassSchedule) => {
        events.push({
          id: scheduleItem.uuid,
          classDefinitionId: classDef.uuid,
          title: classDef.title,
          courseName: classDef.course?.name || '',
          instructor: classDef.instructor?.full_name || '',
          location: classDef.location_name || '',
          locationType: classDef.location_type || '',
          startTime: new Date(scheduleItem.start_time),
          endTime: new Date(scheduleItem.end_time),
          color,
          maxParticipants: classDef.max_participants || 0,
          trainingFee: classDef.training_fee || 0,
          sessionFormat: classDef.session_format || '',
        });
      });
    });

    return events;
  }, [classesWithCourseAndInstructor]);

  const uniqueClasses = useMemo(() => {
    if (!classesWithCourseAndInstructor) return [];

    const classes = classesWithCourseAndInstructor.map((classDef: ClassDefinition) => ({
      id: classDef.uuid,
      name: `${classDef.title} - ${classDef.course?.name || 'Unknown'}`,
    }));

    const allClasses = [{ id: 'all', name: 'All Classes' }, ...classes];
    if (!searchQuery) return allClasses;

    const query = searchQuery.toLowerCase();
    return allClasses.filter(cls => cls.name.toLowerCase().includes(query));
  }, [classesWithCourseAndInstructor, searchQuery]);

  const uniqueInstructors = useMemo(() => {
    if (!classesWithCourseAndInstructor) return [];

    const instructorMap = new Map<string, { id: string; name: string }>();
    classesWithCourseAndInstructor.forEach((classDef: ClassDefinition) => {
      if (classDef.instructor?.uuid) {
        instructorMap.set(classDef.instructor.uuid, {
          id: classDef.instructor.uuid,
          name: classDef.instructor.full_name || 'Unknown Instructor',
        });
      }
    });

    return Array.from(instructorMap.values());
  }, [classesWithCourseAndInstructor]);

  const filteredEvents = useMemo(() => {
    let events = allEvents;

    if (selectedClassId !== 'all') {
      events = events.filter(event => event.classDefinitionId === selectedClassId);
    }

    if (selectedInstructorId) {
      const instructor = uniqueInstructors.find(inst => inst.id === selectedInstructorId);
      if (instructor) {
        events = events.filter(event => event.instructor === instructor.name);
      }
    }

    return events;
  }, [allEvents, selectedClassId, selectedInstructorId, uniqueInstructors]);

  const activeFilterCount = Number(selectedClassId !== 'all') + Number(!!selectedInstructorId);
  const selectedFilterKey = `${selectedClassId}:${selectedInstructorId ?? 'all'}`;

  useEffect(() => {
    if (activeFilterCount === 0 || filteredEvents.length === 0) {
      lastAutoFocusKeyRef.current = null;
      return;
    }

    if (lastAutoFocusKeyRef.current === selectedFilterKey) return;

    const sortedEvents = [...filteredEvents].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    const nextDate = new Date(sortedEvents[0].startTime);
    lastAutoFocusKeyRef.current = selectedFilterKey;

    setCurrentDate(previousDate =>
      previousDate.getTime() === nextDate.getTime() ? previousDate : nextDate
    );
  }, [activeFilterCount, filteredEvents, selectedFilterKey]);

  useEffect(() => {
    if (!isCompactLayout) {
      setIsFiltersSheetOpen(false);
      setIsDetailsSheetOpen(false);
    }
  }, [isCompactLayout]);

  const filterSections = useMemo<ScheduleFilterSection[]>(
    () => [
      {
        key: 'classes',
        label: 'Classes',
        count: uniqueClasses.length,
        isOpen: openDropdowns.classes,
        onToggle: () => setOpenDropdowns(prev => ({ ...prev, classes: !prev.classes })),
        items: uniqueClasses,
        onItemClick: id => {
          setSelectedClassId(id);
          setSelectedInstructorId(null);
          setIsFiltersSheetOpen(false);
        },
        selectedId: selectedClassId,
      },
      {
        key: 'instructors',
        label: 'Instructors',
        count: uniqueInstructors.length,
        isOpen: openDropdowns.instructors,
        onToggle: () => setOpenDropdowns(prev => ({ ...prev, instructors: !prev.instructors })),
        items: uniqueInstructors,
        onItemClick: id => {
          setSelectedInstructorId(current => (current === id ? null : id));
          setIsFiltersSheetOpen(false);
        },
        selectedId: selectedInstructorId,
      },
    ],
    [
      openDropdowns.classes,
      openDropdowns.instructors,
      selectedClassId,
      selectedInstructorId,
      uniqueClasses,
      uniqueInstructors,
    ]
  );

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  const handleMonthClick = (monthIndex: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1));
    setViewMode('month');
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    setViewMode('day');
  };

  const handleEventSelect = (event: CalendarEvent) => {
    setSelectedEvent(event);
    if (isCompactLayout) setIsDetailsSheetOpen(true);
  };

  const { data } = useQuery({
    ...getEnrollmentsForInstanceOptions({
      path: { instanceUuid: selectedEvent?.id || '' },
    }),
    enabled: !!selectedEvent?.id,
  });

  const enrollmentsData = data?.data || [];
  const studentUuids = enrollmentsData.map(enrollment => enrollment?.student_uuid).filter(Boolean);
  const { studentsMap, isLoading: isLoadingStudents } = useStudentsMap(studentUuids);

  const transformedStudents: StudentEnrollment[] = useMemo(
    () =>
      enrollmentsData.map(enrollment => {
        const student = studentsMap[enrollment.student_uuid || ''];
        let attendanceStatus: 'present' | 'absent' | 'pending' = 'pending';

        if (enrollment.is_attendance_marked) {
          attendanceStatus = enrollment.did_attend ? 'present' : 'absent';
        }

        return {
          id: enrollment.uuid || '',
          name: student?.full_name || 'Unknown Student',
          enrollmentDate: new Date(
            enrollment.created_date || selectedEvent?.startTime || new Date()
          ),
          attendanceStatus,
        };
      }),
    [enrollmentsData, selectedEvent?.startTime, studentsMap]
  );

  return (
    <main>
      <div className='flex flex-col space-y-3 py-6'>
        <Badge
          variant='outline'
          className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
        >
          Class management
        </Badge>

        <p className='text-muted-foreground max-w-3xl text-sm leading-relaxed'>
          Oversee and manage all classes across the platform, including scheduling, instructor
          assignments, attendance tracking, and revenue oversight to ensure smooth operations.
        </p>
      </div>

      {isPending ? (
        <Card className='bg-background flex h-[calc(75vh-4rem)] flex-col overflow-hidden rounded-2xl border font-sans'>
          <div className='bg-background border-border border-b px-4 py-3 md:px-6 md:py-4'>
            <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center md:gap-6'>
                <Skeleton className='h-6 w-32' />
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-8 w-8 rounded-lg' />
                  <Skeleton className='h-5 w-40' />
                  <Skeleton className='h-8 w-8 rounded-lg' />
                </div>
                <Skeleton className='h-9 w-64 rounded-lg' />
              </div>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-8 w-24 rounded-lg' />
                <Skeleton className='h-8 w-8 rounded-lg' />
              </div>
            </div>
          </div>
          <ScheduleLoadingState />
        </Card>
      ) : (
        <Card className='bg-background flex h-[calc(75vh-2rem)] flex-col overflow-hidden pt-0 font-sans sm:h-[calc(82vh-2rem)] md:h-[calc(80vh-2rem)]'>
          <style jsx global>{`
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          <ScheduleCalendarHeader
            currentDate={currentDate}
            viewMode={viewMode}
            onViewChange={setViewMode}
            onDateChange={handleDateChange}
            eventCount={filteredEvents.length}
          />

          <div className='relative flex flex-1 overflow-hidden'>
            <ScheduleCompactActions
              activeFilterCount={activeFilterCount}
              hasSelectedEvent={!!selectedEvent}
              onOpenFilters={() => setIsFiltersSheetOpen(true)}
              onOpenDetails={() => setIsDetailsSheetOpen(true)}
            />

            <div className='bg-background border-border hidden w-60 flex-col overflow-hidden border-r min-[1551px]:flex md:w-64'>
              <ScheduleFiltersPanel
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeFilterCount={activeFilterCount}
                onClearFilters={() => {
                  setSelectedClassId('all');
                  setSelectedInstructorId(null);
                }}
                sections={filterSections}
              />
            </div>

            <div className='bg-background flex flex-1 flex-col overflow-hidden pt-14 min-[1551px]:pt-2'>
              {viewMode === 'week' && (
                <ScheduleWeekView
                  events={filteredEvents}
                  onEventSelect={handleEventSelect}
                  selectedEvent={selectedEvent}
                  currentDate={currentDate}
                  onDateSelect={handleDateSelect}
                />
              )}
              {viewMode === 'day' && (
                <ScheduleDayView
                  events={filteredEvents}
                  onEventSelect={handleEventSelect}
                  selectedEvent={selectedEvent}
                  currentDate={currentDate}
                />
              )}
              {viewMode === 'month' && (
                <ScheduleMonthView
                  events={filteredEvents}
                  onEventSelect={handleEventSelect}
                  currentDate={currentDate}
                  onDateSelect={handleDateSelect}
                />
              )}
              {viewMode === 'year' && (
                <ScheduleYearView
                  events={filteredEvents}
                  currentDate={currentDate}
                  onMonthClick={handleMonthClick}
                />
              )}
            </div>

            <div className='bg-muted/30 border-border scrollbar-hide hidden overflow-y-auto border-l min-[1551px]:block min-[1551px]:w-80'>
              <ScheduleSessionDetailsPanel
                selectedEvent={selectedEvent}
                isLoadingStudents={isLoadingStudents}
                transformedStudents={transformedStudents}
              />
            </div>
          </div>

          <Sheet open={isFiltersSheetOpen} onOpenChange={setIsFiltersSheetOpen}>
            <SheetContent side='left' className='w-[92vw] max-w-sm p-0'>
              <SheetHeader className='border-border border-b'>
                <SheetTitle>Classes</SheetTitle>
                <SheetDescription>
                  Search and filter class sessions without crowding the calendar.
                </SheetDescription>
              </SheetHeader>
              <ScheduleFiltersPanel
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeFilterCount={activeFilterCount}
                onClearFilters={() => {
                  setSelectedClassId('all');
                  setSelectedInstructorId(null);
                }}
                sections={filterSections}
              />
            </SheetContent>
          </Sheet>

          <Sheet open={isDetailsSheetOpen} onOpenChange={setIsDetailsSheetOpen}>
            <SheetContent side='right' className='w-[92vw] max-w-lg overflow-y-auto p-0'>
              <SheetHeader className='border-border border-b'>
                <SheetTitle>Session details</SheetTitle>
                <SheetDescription>
                  Review timing, location, capacity, and enrolled students.
                </SheetDescription>
              </SheetHeader>
              <ScheduleSessionDetailsPanel
                selectedEvent={selectedEvent}
                isLoadingStudents={isLoadingStudents}
                transformedStudents={transformedStudents}
              />
            </SheetContent>
          </Sheet>
        </Card>
      )}
    </main>
  );
}
