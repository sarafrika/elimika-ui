'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Home,
  MapPin,
  Search,
  Settings,
  Users,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../../../components/ui/badge';
import useAmdinClassesWithDetails from '../../../../hooks/use-admin-classes';
import { useStudentsMap } from '../../../../hooks/use-studentsMap';
import { getEnrollmentsForInstanceOptions } from '../../../../services/client/@tanstack/react-query.gen';

// Types
type ViewMode = 'day' | 'week' | 'month' | 'year';

interface ClassSchedule {
  uuid: string;
  class_definition_uuid: string;
  instructor_uuid: string;
  start_time: Date;
  end_time: Date;
  status?: string;
}

interface ClassDefinition {
  uuid: string;
  title: string;
  course: {
    uuid: string;
    name: string;
    course_creator_uuid: string;
  };
  instructor: {
    uuid: string;
    full_name?: string;
  };
  location_name: string;
  location_type: string;
  location_latitude?: number;
  location_longitude?: number;
  max_participants: number;
  session_format: string;
  training_fee: number;
  schedule: ClassSchedule[];
  allow_waitlist: boolean;
  is_active: boolean;
  duration_minutes: bigint;
  duration_formatted: string;
}

interface CalendarEvent {
  id: string;
  classDefinitionId: string;
  title: string;
  courseName: string;
  instructor: string;
  location: string;
  locationType: string;
  startTime: Date;
  endTime: Date;
  color: string;
  maxParticipants: number;
  trainingFee: number;
  sessionFormat: string;
}

interface StudentEnrollment {
  id: string;
  name: string;
  enrollmentDate: Date;
  attendanceStatus: 'present' | 'absent' | 'pending';
}

// Skeleton component for loading states
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-muted animate-pulse rounded ${className}`} />
);

// Semantic color palette using Tailwind colors
const COLOR_PALETTE = [
  'rgb(59 130 246)', // blue-500
  'rgb(139 92 246)', // violet-500
  'rgb(236 72 153)', // pink-500
  'rgb(16 185 129)', // emerald-500
  'rgb(245 158 11)', // amber-500
  'rgb(239 68 68)', // red-500
  'rgb(6 182 212)', // cyan-500
  'rgb(139 90 0)', // yellow-800
  'rgb(99 102 241)', // indigo-500
  'rgb(20 184 166)', // teal-500
];

const Dropdown: React.FC<{
  label: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  items?: { id: string; name: string }[];
  onItemClick?: (id: string) => void;
  selectedId?: string | null;
}> = ({ label, count, isOpen, onToggle, items, onItemClick, selectedId }) => (
  <div className='border-border border-b'>
    <button
      onClick={onToggle}
      className='hover:bg-primary/5 flex w-full items-center justify-between px-4 py-2.5 transition-colors md:px-5 md:py-3'
    >
      <span className='text-foreground text-xs font-medium tracking-wide uppercase md:text-sm'>
        {label}
      </span>
      <div className='flex items-center gap-2'>
        <span className='text-muted-foreground text-xs font-semibold md:text-sm'>{count}</span>
        <ChevronDown
          className={`text-muted-foreground h-3 w-3 transition-transform md:h-4 md:w-4 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>
    </button>

    {isOpen && items && (
      <div className='scrollbar-hide max-h-64 space-y-1.5 overflow-y-auto px-4 pb-3 md:px-5'>
        {items.map(item => (
          <div
            key={item.id}
            className={`flex cursor-pointer items-center justify-between rounded px-2.5 py-1.5 text-xs transition-colors md:text-sm ${
              selectedId === item.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-primary/5'
            }`}
            onClick={() => onItemClick?.(item.id)}
          >
            <span className='truncate'>{item.name}</span>
            {selectedId === item.id && (
              <Check className='text-primary ml-2 h-3.5 w-3.5 flex-shrink-0' />
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

const CalendarHeader: React.FC<{
  currentDate: Date;
  viewMode: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onDateChange: (direction: 'prev' | 'next') => void;
  eventCount: number;
}> = ({ currentDate, viewMode, onViewChange, onDateChange, eventCount }) => {
  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    return currentDate.toLocaleDateString('en-US', options);
  };

  return (
    <div className='bg-background border-border border-b px-4 py-3 md:px-6 md:py-4'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center md:gap-6'>
          <h1 className='text-foreground text-lg font-bold tracking-tight md:text-xl'>
            Class Schedule
          </h1>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => onDateChange('prev')}
              className='hover:bg-primary/5 rounded-lg p-1.5 transition-colors'
            >
              <ChevronLeft className='text-muted-foreground h-4 w-4' />
            </button>
            <span className='text-foreground min-w-[130px] text-center text-xs font-semibold md:min-w-[160px] md:text-sm'>
              {formatDate()}
            </span>
            <button
              onClick={() => onDateChange('next')}
              className='hover:bg-primary/5 rounded-lg p-1.5 transition-colors'
            >
              <ChevronRight className='text-muted-foreground h-4 w-4' />
            </button>
          </div>
          <div className='bg-muted flex items-center gap-1 overflow-x-auto rounded-lg p-0.5'>
            {(['day', 'week', 'month', 'year'] as ViewMode[]).map(view => (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all md:px-3.5 md:text-sm ${
                  viewMode === view
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className='flex items-center justify-between gap-3 md:justify-end'>
          <div className='bg-primary/10 flex items-center gap-2 rounded-lg px-2.5 py-1.5'>
            <Calendar className='text-primary h-3.5 w-3.5' />
            <span className='text-primary text-xs font-semibold md:text-sm'>
              {eventCount} {eventCount === 1 ? 'Session' : 'Sessions'}
            </span>
          </div>
          <button className='hover:bg-primary/5 rounded-lg p-1.5 transition-colors'>
            <Settings className='text-muted-foreground h-4 w-4' />
          </button>
        </div>
      </div>
    </div>
  );
};

const WeekView: React.FC<{
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  selectedEvent: CalendarEvent | null;
  currentDate: Date;
}> = ({ events, onEventSelect, selectedEvent, currentDate }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 18 }, (_, i) => i + 4);

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(currentDate);

  const getEventsForDayAndHour = (dayIndex: number, hour: number) => {
    const targetDate = new Date(weekStart);
    targetDate.setDate(weekStart.getDate() + dayIndex);

    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      const eventHour = eventDate.getHours();
      return eventDate.toDateString() === targetDate.toDateString() && eventHour === hour;
    });
  };

  const getEventHeight = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    return durationHours * 60; // 60px per hour
  };

  const getEventTop = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const minutes = start.getMinutes();
    return (minutes / 60) * 60;
  };

  return (
    <div className='scrollbar-hide flex-1 overflow-auto'>
      <div className='min-w-[400px] md:min-w-[700px]'>
        <div className='border-border bg-muted sticky top-0 z-10 grid grid-cols-8 border-b'>
          <div className='text-muted-foreground p-2 text-xs font-semibold md:p-3 md:text-sm'>
            Time
          </div>
          {days.map((day, idx) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + idx);
            return (
              <div key={day} className='border-border border-l p-2 md:p-3'>
                <div className='text-foreground text-center text-xs font-semibold md:text-sm'>
                  {day}
                </div>
                <div className='text-muted-foreground mt-0.5 text-center text-xs'>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>
        <div className='relative'>
          {hours.map(hour => (
            <div key={hour} className='border-border/50 grid grid-cols-8 border-b'>
              <div className='text-muted-foreground p-2 text-xs font-medium md:p-3 md:text-sm'>
                {hour.toString().padStart(2, '0')}:00
              </div>
              {days.map((_, dayIndex) => {
                const dayEvents = getEventsForDayAndHour(dayIndex, hour);
                const isStartHour = dayEvents.some(e => new Date(e.startTime).getHours() === hour);

                return (
                  <div
                    key={dayIndex}
                    className='border-border/50 relative border-l'
                    style={{ height: '60px' }}
                  >
                    {isStartHour &&
                      dayEvents.map((event, eventIdx) => {
                        const eventStartHour = new Date(event.startTime).getHours();
                        if (eventStartHour !== hour) return null;

                        return (
                          <div
                            key={event.id}
                            className={`absolute cursor-pointer overflow-hidden rounded-lg p-1.5 transition-all hover:shadow-lg md:p-2 ${
                              selectedEvent?.id === event.id ? 'ring-ring ring-2' : ''
                            }`}
                            style={{
                              backgroundColor: event.color,
                              height: `${getEventHeight(event)}px`,
                              top: `${getEventTop(event)}px`,
                              left: `${4 + eventIdx * 2}px`,
                              right: '4px',
                              zIndex: eventIdx + 1,
                            }}
                            onClick={() => onEventSelect(event)}
                          >
                            <div className='truncate text-[10px] font-semibold text-white md:text-xs'>
                              {event.title}
                            </div>
                            <div className='truncate text-[9px] text-white opacity-90 md:text-xs'>
                              {event.courseName}
                            </div>
                            <div className='mt-0.5 truncate text-[9px] text-white opacity-75 md:text-xs'>
                              {new Date(event.startTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DayView: React.FC<{
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  selectedEvent: CalendarEvent | null;
  currentDate: Date;
}> = ({ events, onEventSelect, selectedEvent, currentDate }) => {
  const hours = Array.from({ length: 18 }, (_, i) => i + 4);

  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === currentDate.toDateString();
  });

  const getEventsForHour = (hour: number) => {
    return dayEvents.filter(event => {
      const eventHour = new Date(event.startTime).getHours();
      return eventHour === hour;
    });
  };

  const getEventHeight = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    return durationHours * 60; // Fixed: multiply by hour height (60px)
  };

  return (
    <div className='scrollbar-hide flex-1 overflow-auto'>
      <div className='relative'>
        {hours.map(hour => {
          const hourEvents = getEventsForHour(hour);
          return (
            <div key={hour} className='border-border/50 flex border-b' style={{ height: '60px' }}>
              <div className='text-muted-foreground w-16 p-2 text-xs font-medium md:w-20 md:p-3 md:text-sm'>
                {hour.toString().padStart(2, '0')}:00
              </div>

              <div className='relative flex-1 p-2'>
                {hourEvents.map((event, idx) => (
                  <div
                    key={event.id}
                    className={`absolute cursor-pointer rounded-lg p-2 transition-all hover:shadow-lg md:p-3 ${
                      selectedEvent?.id === event.id ? 'ring-ring ring-2' : ''
                    }`}
                    style={{
                      backgroundColor: event.color,
                      height: `${getEventHeight(event)}px`,
                      left: `${8 + idx * 4}px`,
                      right: '0px',
                      top: '0px',
                      zIndex: idx + 1,
                    }}
                    onClick={() => onEventSelect(event)}
                  >
                    <div className='text-sm font-semibold text-white md:text-base'>
                      {event.title}
                    </div>
                    <div className='mt-0.5 text-xs text-white opacity-90 md:text-sm'>
                      {event.courseName}
                    </div>
                    <div className='text-xs text-white opacity-90 md:text-sm'>
                      {event.instructor}
                    </div>
                    <div className='text-xs text-white opacity-90 md:text-sm'>{event.location}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MonthView: React.FC<{
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  currentDate: Date;
}> = ({ events, onEventSelect, currentDate }) => {
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDay = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === targetDate.toDateString();
    });
  };

  return (
    <div className='scrollbar-hide flex-1 overflow-auto p-3 md:p-5'>
      <div className='grid grid-cols-7 gap-2 md:gap-3'>
        {days.map(day => (
          <div
            key={day}
            className='text-muted-foreground pb-1.5 text-center text-xs font-semibold md:text-sm'
          >
            {day}
          </div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNumber = i + 1;
          const dayEvents = getEventsForDay(dayNumber);
          return (
            <div
              key={i}
              className='border-border hover:border-ring min-h-[70px] rounded-lg border p-2 transition-colors md:min-h-[100px]'
            >
              <div className='text-foreground mb-1.5 text-xs font-semibold md:text-sm'>
                {dayNumber}
              </div>
              <div className='space-y-1'>
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className='cursor-pointer truncate rounded p-1 text-[10px] transition-opacity hover:opacity-80 md:text-xs'
                    style={{ backgroundColor: event.color, color: 'white' }}
                    onClick={() => onEventSelect(event)}
                    title={`${event.title} - ${event.courseName}`}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className='text-muted-foreground pl-1 text-[10px] md:text-xs'>
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const YearView: React.FC<{
  events: CalendarEvent[];
  currentDate: Date;
  onMonthClick: (month: number) => void;
}> = ({ events, currentDate, onMonthClick }) => {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const getEventsForMonth = (monthIndex: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getFullYear() === currentDate.getFullYear() && eventDate.getMonth() === monthIndex
      );
    });
  };

  const getDaysInMonth = (monthIndex: number) => {
    return new Date(currentDate.getFullYear(), monthIndex + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (monthIndex: number) => {
    return new Date(currentDate.getFullYear(), monthIndex, 1).getDay();
  };

  return (
    <div className='scrollbar-hide flex-1 overflow-auto p-3 md:p-5'>
      <div className='grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4'>
        {months.map((month, monthIdx) => {
          const monthEvents = getEventsForMonth(monthIdx);
          const daysInMonth = getDaysInMonth(monthIdx);
          const firstDay = getFirstDayOfMonth(monthIdx);

          return (
            <div
              key={month}
              className='border-border hover:border-ring cursor-pointer rounded-lg border p-2.5 transition-colors md:p-3'
              onClick={() => onMonthClick(monthIdx)}
            >
              <div className='mb-2 flex items-center justify-between'>
                <div className='text-foreground text-sm font-semibold md:text-base'>{month}</div>
                {monthEvents.length > 0 && (
                  <div className='bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-semibold md:text-xs'>
                    {monthEvents.length}
                  </div>
                )}
              </div>
              <div className='grid grid-cols-7 gap-0.5'>
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNumber = i + 1;
                  const targetDate = new Date(currentDate.getFullYear(), monthIdx, dayNumber);
                  const hasEvent = monthEvents.some(
                    event => new Date(event.startTime).toDateString() === targetDate.toDateString()
                  );
                  return (
                    <div
                      key={i}
                      className={`rounded p-0.5 text-center text-[10px] md:text-xs ${
                        hasEvent
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-primary/5'
                      }`}
                    >
                      {dayNumber}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StudentEnrollmentTable: React.FC<{ students: StudentEnrollment[] }> = ({ students }) => {
  const getStatusBadge = (status: StudentEnrollment['attendanceStatus']) => {
    const config = {
      present: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: Check },
      absent: { bg: 'bg-red-100', text: 'text-red-700', icon: X },
      pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    };
    const { bg, text, icon: Icon } = config[status];
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${bg} ${text}`}
      >
        <Icon className='h-3 w-3' />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className='mt-4'>
      <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase'>
        Enrolled Students ({students.length})
      </h4>
      <div className='border-border overflow-hidden rounded-lg border'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-muted border-border border-b'>
              <tr>
                <th className='text-muted-foreground px-3 py-2 text-left text-xs font-semibold'>
                  Name
                </th>
                <th className='text-muted-foreground px-3 py-2 text-left text-xs font-semibold'>
                  Enrolled
                </th>
                <th className='text-muted-foreground px-3 py-2 text-left text-xs font-semibold'>
                  Attendance
                </th>
              </tr>
            </thead>
            <tbody className='divide-border divide-y'>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={3} className='text-muted-foreground px-3 py-6 text-center text-sm'>
                    No students enrolled for this session
                  </td>
                </tr>
              ) : (
                students.map(student => (
                  <tr key={student.id} className='hover:bg-primary/5 transition-colors'>
                    <td className='text-foreground px-3 py-2 text-sm font-medium'>
                      {student.name}
                    </td>
                    <td className='text-muted-foreground px-3 py-2 text-sm'>
                      {student.enrollmentDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className='px-3 py-2'>{getStatusBadge(student.attendanceStatus)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default function AdminClassPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | 'all'>('all');
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    classes: false,
    instructors: false,
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { classes: classesWithCourseAndInstructor, loading } = useAmdinClassesWithDetails();

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
          color: color,
          maxParticipants: classDef.max_participants || 0,
          trainingFee: classDef.training_fee || 0,
          sessionFormat: classDef.session_format || '',
        });
      });
    });
    return events;
  }, [classesWithCourseAndInstructor]);

  const filteredEvents = useMemo(() => {
    let events = allEvents;
    if (selectedClassId !== 'all') {
      events = events.filter(event => event.classDefinitionId === selectedClassId);
    }
    if (selectedInstructorId) {
      const selectedClass = classesWithCourseAndInstructor?.find(
        (c: ClassDefinition) => c.instructor?.uuid === selectedInstructorId
      );
      if (selectedClass) {
        events = events.filter(event => event.classDefinitionId === selectedClass.uuid);
      }
    }
    return events;
  }, [allEvents, selectedClassId, selectedInstructorId, classesWithCourseAndInstructor]);

  const uniqueClasses = useMemo(() => {
    if (!classesWithCourseAndInstructor) return [];
    const classes = classesWithCourseAndInstructor.map((classDef: ClassDefinition) => ({
      id: classDef.uuid,
      name: `${classDef.title} - ${classDef.course?.name || 'Unknown'}`,
    }));
    return [{ id: 'all', name: 'All Classes' }, ...classes];
  }, [classesWithCourseAndInstructor]);

  const uniqueInstructors = useMemo(() => {
    if (!classesWithCourseAndInstructor) return [];
    const instructorMap = new Map();
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

  useEffect(() => {
    if (selectedClassId && selectedClassId !== 'all') {
      const classEvents = allEvents.filter(e => e.classDefinitionId === selectedClassId);
      if (classEvents.length > 0) {
        const sortedEvents = classEvents.sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
        setCurrentDate(new Date(sortedEvents[0].startTime));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId]);

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
    const newDate = new Date(currentDate.getFullYear(), monthIndex, 1);
    setCurrentDate(newDate);
    setViewMode('month');
  };

  // Fetch enrollment data for selected event
  const { data } = useQuery({
    ...getEnrollmentsForInstanceOptions({
      path: { instanceUuid: selectedEvent?.id || '' },
    }),
    enabled: !!selectedEvent?.id,
  });
  const enrollmentsData = data?.data || [];
  const studentUuids = enrollmentsData.map(enrollment => enrollment?.student_uuid).filter(Boolean);

  const { studentsMap, isLoading: isLoadingStudents } = useStudentsMap(studentUuids);

  // Transform enrollment data for StudentEnrollmentTable
  const transformedStudents: StudentEnrollment[] = useMemo(() => {
    return enrollmentsData.map(enrollment => {
      const student = studentsMap[enrollment.student_uuid || ''];

      // Determine attendance status
      let attendanceStatus: 'present' | 'absent' | 'pending' = 'pending';
      if (enrollment.is_attendance_marked) {
        attendanceStatus = enrollment.did_attend ? 'present' : 'absent';
      }

      return {
        id: enrollment.uuid || '',
        name: student?.full_name || 'Unknown Student',
        enrollmentDate: new Date(enrollment.created_date || selectedEvent?.startTime || new Date()),
        attendanceStatus,
      };
    });
  }, [enrollmentsData, studentsMap, selectedEvent?.startTime]);

  return (
    <main>
      <div className='flex flex-col space-y-3 py-6'>
        <Badge
          variant='outline'
          className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
        >
          Class management
        </Badge>

        {/* Description */}
        <p className='text-muted-foreground max-w-3xl text-sm leading-relaxed'>
          Oversee and manage all classes across the platform, including scheduling, instructor
          assignments, attendance tracking, and revenue oversight to ensure smooth operations.
        </p>
      </div>

      {loading ? (
        <div className='bg-background flex h-screen flex-col overflow-hidden rounded-2xl border font-sans'>
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
          <div className='flex flex-1 overflow-hidden'>
            <div className='bg-background border-border flex w-60 flex-col border-r md:w-64'>
              <div className='border-border border-b p-3 md:p-4'>
                <Skeleton className='h-9 w-full rounded-lg' />
              </div>
              <div className='flex-1 space-y-3 p-4'>
                <Skeleton className='h-10 w-full' />
                <Skeleton className='h-10 w-full' />
                <Skeleton className='h-32 w-full' />
              </div>
            </div>
            <div className='flex-1 space-y-2 p-4'>
              <Skeleton className='h-12 w-full' />
              <Skeleton className='h-12 w-full' />
              <Skeleton className='h-12 w-full' />
              <Skeleton className='h-12 w-full' />
              <Skeleton className='h-12 w-full' />
            </div>
            <div className='bg-muted/30 border-border hidden space-y-4 border-l p-4 lg:block lg:w-80'>
              <Skeleton className='h-20 w-full' />
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-32 w-full' />
            </div>
          </div>
        </div>
      ) : (
        <div className='bg-background flex h-screen flex-col overflow-hidden font-sans'>
          <style jsx global>{`
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <CalendarHeader
            currentDate={currentDate}
            viewMode={viewMode}
            onViewChange={setViewMode}
            onDateChange={handleDateChange}
            eventCount={filteredEvents.length}
          />
          <div className='relative flex flex-1 overflow-hidden'>
            <button
              className='bg-foreground text-background fixed right-4 bottom-4 z-50 rounded-full p-3 shadow-lg lg:hidden'
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Search className='h-5 w-5' />
            </button>
            <div
              className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} bg-background border-border fixed z-40 flex h-full w-60 flex-col border-r transition-transform duration-300 ease-in-out md:w-64 lg:relative lg:translate-x-0`}
            >
              <div className='border-border border-b p-3 md:p-4'>
                <div className='relative'>
                  <Search className='text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2' />
                  <input
                    type='text'
                    placeholder='Search classes...'
                    className='border-input focus:ring-ring bg-background text-foreground w-full rounded-lg border py-1.5 pr-3 pl-9 text-sm focus:border-transparent focus:ring-2 focus:outline-none'
                  />
                </div>
              </div>
              <div className='scrollbar-hide flex-1 overflow-y-auto'>
                <Dropdown
                  label='Classes'
                  count={uniqueClasses.length}
                  isOpen={openDropdowns.classes}
                  onToggle={() => setOpenDropdowns(prev => ({ ...prev, classes: !prev.classes }))}
                  items={uniqueClasses}
                  onItemClick={id => {
                    setSelectedClassId(id);
                    setSelectedInstructorId(null);
                    setIsMobileMenuOpen(false);
                  }}
                  selectedId={selectedClassId}
                />

                <Dropdown
                  label='Instructors'
                  count={uniqueInstructors.length}
                  isOpen={openDropdowns.instructors}
                  onToggle={() =>
                    setOpenDropdowns(prev => ({ ...prev, instructors: !prev.instructors }))
                  }
                  items={uniqueInstructors}
                  onItemClick={id => {
                    setSelectedInstructorId(selectedInstructorId === id ? null : id);
                    setIsMobileMenuOpen(false);
                  }}
                  selectedId={selectedInstructorId}
                />
              </div>
              {(selectedClassId !== 'all' || selectedInstructorId) && (
                <div className='border-border border-t p-3 md:p-4'>
                  <button
                    onClick={() => {
                      setSelectedClassId('all');
                      setSelectedInstructorId(null);
                      setIsMobileMenuOpen(false);
                    }}
                    className='text-foreground hover:text-foreground border-input hover:bg-primary/5 w-full rounded-lg border py-1.5 text-center text-xs font-medium transition-colors md:text-sm'
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
            {isMobileMenuOpen && (
              <div
                className='bg-opacity-50 fixed inset-0 z-30 bg-black lg:hidden'
                onClick={() => setIsMobileMenuOpen(false)}
              />
            )}

            <div className='bg-background flex flex-1 flex-col overflow-hidden'>
              {viewMode === 'week' && (
                <WeekView
                  events={filteredEvents}
                  onEventSelect={setSelectedEvent}
                  selectedEvent={selectedEvent}
                  currentDate={currentDate}
                />
              )}
              {viewMode === 'day' && (
                <DayView
                  events={filteredEvents}
                  onEventSelect={setSelectedEvent}
                  selectedEvent={selectedEvent}
                  currentDate={currentDate}
                />
              )}
              {viewMode === 'month' && (
                <MonthView
                  events={filteredEvents}
                  onEventSelect={setSelectedEvent}
                  currentDate={currentDate}
                />
              )}
              {viewMode === 'year' && (
                <YearView
                  events={filteredEvents}
                  currentDate={currentDate}
                  onMonthClick={handleMonthClick}
                />
              )}
            </div>

            <div className='bg-muted/30 border-border scrollbar-hide hidden overflow-y-auto border-l lg:block lg:w-80'>
              {selectedEvent ? (
                <div>
                  <div className='border-border bg-background border-b p-4'>
                    <h3 className='text-muted-foreground mb-1.5 text-xs font-semibold tracking-wider uppercase'>
                      Class Session
                    </h3>
                    <h2 className='text-foreground text-base font-bold'>{selectedEvent.title}</h2>
                    {selectedEvent.courseName && (
                      <p className='text-muted-foreground mt-0.5 text-sm'>
                        {selectedEvent.courseName}
                      </p>
                    )}
                  </div>
                  <div className='space-y-4 p-4'>
                    <div className='border-border border-b pb-3'>
                      <div className='mb-1.5 flex items-center gap-1.5'>
                        <Calendar className='text-muted-foreground h-3.5 w-3.5' />
                        <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                          Date & Time
                        </span>
                      </div>
                      <p className='text-foreground mt-0.5 text-sm'>
                        {new Date(selectedEvent.startTime).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}{' '}
                        •{' '}
                        {new Date(selectedEvent.startTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(selectedEvent.endTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className='border-border border-b pb-3'>
                      <div className='mb-1.5 flex items-center gap-1.5'>
                        <Users className='text-muted-foreground h-3.5 w-3.5' />
                        <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                          Instructor
                        </span>
                      </div>
                      <p className='text-foreground mt-0.5 text-sm'>{selectedEvent.instructor}</p>
                    </div>
                    <div className='border-border border-b pb-3'>
                      <div className='mb-1.5 flex items-center gap-1.5'>
                        <MapPin className='text-muted-foreground h-3.5 w-3.5' />
                        <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                          Location
                        </span>
                      </div>
                      <p className='text-foreground mt-0.5 text-sm'>
                        {selectedEvent.location} ({selectedEvent.locationType})
                      </p>
                    </div>
                    <div className='border-border border-b pb-3'>
                      <div className='mb-1.5 flex items-center gap-1.5'>
                        <Users className='text-muted-foreground h-3.5 w-3.5' />
                        <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                          Capacity
                        </span>
                      </div>
                      <p className='text-foreground mt-0.5 text-sm'>
                        {selectedEvent.maxParticipants} participants
                      </p>
                    </div>
                    <div className='border-border border-b pb-3'>
                      <div className='mb-1.5 flex items-center gap-1.5'>
                        <Home className='text-muted-foreground h-3.5 w-3.5' />
                        <span className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                          Session Format
                        </span>
                      </div>
                      <p className='text-foreground mt-0.5 text-sm'>
                        {selectedEvent.sessionFormat}
                      </p>
                    </div>
                    <div className='border-border border-t pt-3'>
                      <div className='bg-primary/10 border-primary/20 rounded-lg border p-3'>
                        <div className='text-primary mb-0.5 text-xs font-semibold tracking-wider uppercase'>
                          Training Fee (/hr/head)
                        </div>
                        <div className='text-primary text-xl font-bold'>
                          ${selectedEvent.trainingFee}
                        </div>
                      </div>
                    </div>

                    {isLoadingStudents ? (
                      <div className='mt-4'>
                        <Skeleton className='mb-2 h-4 w-32' />
                        <div className='border-border overflow-hidden rounded-lg border'>
                          <div className='bg-muted border-border flex gap-4 border-b p-3'>
                            <Skeleton className='h-3 w-20' />
                            <Skeleton className='h-3 w-24' />
                            <Skeleton className='h-3 w-16' />
                          </div>
                          <div className='divide-border divide-y'>
                            {[1, 2, 3].map(i => (
                              <div key={i} className='flex gap-4 p-3'>
                                <Skeleton className='h-4 w-24' />
                                <Skeleton className='h-4 w-20' />
                                <Skeleton className='h-6 w-16 rounded-full' />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <StudentEnrollmentTable students={transformedStudents} />
                    )}
                  </div>
                </div>
              ) : (
                <div className='flex h-full items-center justify-center p-6'>
                  <div className='text-muted-foreground text-center'>
                    <Calendar className='mx-auto mb-2 h-10 w-10 opacity-50' />
                    <p className='text-sm'>Select a class session to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
