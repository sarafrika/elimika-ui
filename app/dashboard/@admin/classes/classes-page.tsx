'use client'

import { useQuery } from '@tanstack/react-query';
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Home, MapPin, Search, Settings, Users, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../../../components/ui/badge';
import useInstructorClassesWithDetails from '../../../../hooks/use-instructor-classes';
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
    <div className={`animate-pulse bg-muted rounded ${className}`} />
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
    <div className="border-b border-border">
        <button
            onClick={onToggle}
            className="w-full px-4 md:px-5 py-2.5 md:py-3 flex items-center justify-between hover:bg-accent transition-colors"
        >
            <span className="font-medium text-foreground text-xs md:text-sm tracking-wide uppercase">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm font-semibold text-muted-foreground">{count}</span>
                <ChevronDown className={`w-3 h-3 md:w-4 md:h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
        </button>
        {isOpen && items && (
            <div className="px-4 md:px-5 pb-3 space-y-1.5 max-h-64 overflow-y-auto scrollbar-hide">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`text-xs md:text-sm py-1.5 px-2.5 rounded cursor-pointer transition-colors flex items-center justify-between ${selectedId === item.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-accent'
                            }`}
                        onClick={() => onItemClick?.(item.id)}
                    >
                        <span className="truncate">{item.name}</span>
                        {selectedId === item.id && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 ml-2" />}
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
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        };
        return currentDate.toLocaleDateString('en-US', options);
    };

    return (
        <div className="bg-background border-b border-border px-4 md:px-6 py-3 md:py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-6">
                    <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground">Class Schedule</h1>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onDateChange('prev')} className="p-1.5 hover:bg-accent rounded-lg transition-colors">
                            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <span className="text-xs md:text-sm font-semibold text-foreground min-w-[130px] md:min-w-[160px] text-center">
                            {formatDate()}
                        </span>
                        <button onClick={() => onDateChange('next')} className="p-1.5 hover:bg-accent rounded-lg transition-colors">
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 overflow-x-auto">
                        {(['day', 'week', 'month', 'year'] as ViewMode[]).map((view) => (
                            <button
                                key={view}
                                onClick={() => onViewChange(view)}
                                className={`px-3 md:px-3.5 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all whitespace-nowrap ${viewMode === view ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {view.charAt(0).toUpperCase() + view.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-3">
                    <div className="flex items-center gap-2 bg-primary/10 px-2.5 py-1.5 rounded-lg">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs md:text-sm font-semibold text-primary">
                            {eventCount} {eventCount === 1 ? 'Session' : 'Sessions'}
                        </span>
                    </div>
                    <button className="p-1.5 hover:bg-accent rounded-lg transition-colors">
                        <Settings className="w-4 h-4 text-muted-foreground" />
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

        return events.filter((event) => {
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
        <div className="flex-1 overflow-auto scrollbar-hide">
            <div className="min-w-[400px] md:min-w-[700px]">
                <div className="grid grid-cols-8 border-b border-border bg-muted sticky top-0 z-10">
                    <div className="p-2 md:p-3 text-xs md:text-sm font-semibold text-muted-foreground">Time</div>
                    {days.map((day, idx) => {
                        const date = new Date(weekStart);
                        date.setDate(weekStart.getDate() + idx);
                        return (
                            <div key={day} className="p-2 md:p-3 border-l border-border">
                                <div className="text-xs md:text-sm font-semibold text-foreground text-center">{day}</div>
                                <div className="text-xs text-muted-foreground text-center mt-0.5">{date.getDate()}</div>
                            </div>
                        );
                    })}
                </div>
                <div className="relative">
                    {hours.map((hour) => (
                        <div key={hour} className="grid grid-cols-8 border-b border-border/50">
                            <div className="p-2 md:p-3 text-xs md:text-sm text-muted-foreground font-medium">
                                {hour.toString().padStart(2, '0')}:00
                            </div>
                            {days.map((_, dayIndex) => {
                                const dayEvents = getEventsForDayAndHour(dayIndex, hour);
                                const isStartHour = dayEvents.some(e => new Date(e.startTime).getHours() === hour);

                                return (
                                    <div key={dayIndex} className="border-l border-border/50 relative" style={{ height: '60px' }}>
                                        {isStartHour && dayEvents.map((event, eventIdx) => {
                                            const eventStartHour = new Date(event.startTime).getHours();
                                            if (eventStartHour !== hour) return null;

                                            return (
                                                <div
                                                    key={event.id}
                                                    className={`absolute rounded-lg p-1.5 md:p-2 cursor-pointer transition-all hover:shadow-lg overflow-hidden ${selectedEvent?.id === event.id ? 'ring-2 ring-ring' : ''
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
                                                    <div className="text-white text-[10px] md:text-xs font-semibold truncate">{event.title}</div>
                                                    <div className="text-white text-[9px] md:text-xs opacity-90 truncate">{event.courseName}</div>
                                                    <div className="text-white text-[9px] md:text-xs opacity-75 truncate mt-0.5">
                                                        {new Date(event.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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

    const dayEvents = events.filter((event) => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === currentDate.toDateString();
    });

    const getEventsForHour = (hour: number) => {
        return dayEvents.filter((event) => {
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
        <div className="flex-1 overflow-auto scrollbar-hide">
            <div className="relative">
                {hours.map((hour) => {
                    const hourEvents = getEventsForHour(hour);
                    return (
                        <div key={hour} className="border-b border-border/50 flex" style={{ height: '60px' }}>
                            <div className="w-16 md:w-20 p-2 md:p-3 text-xs md:text-sm text-muted-foreground font-medium">
                                {hour.toString().padStart(2, '0')}:00
                            </div>

                            <div className="flex-1 relative p-2">
                                {hourEvents.map((event, idx) => (
                                    <div
                                        key={event.id}
                                        className={`absolute rounded-lg p-2 md:p-3 cursor-pointer transition-all hover:shadow-lg ${selectedEvent?.id === event.id ? 'ring-2 ring-ring' : ''
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
                                        <div className="text-white text-sm md:text-base font-semibold">{event.title}</div>
                                        <div className="text-white text-xs md:text-sm opacity-90 mt-0.5">{event.courseName}</div>
                                        <div className="text-white text-xs md:text-sm opacity-90">{event.instructor}</div>
                                        <div className="text-white text-xs md:text-sm opacity-90">{event.location}</div>
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
        return events.filter((event) => {
            const eventDate = new Date(event.startTime);
            return eventDate.toDateString() === targetDate.toDateString();
        });
    };

    return (
        <div className="flex-1 overflow-auto scrollbar-hide p-3 md:p-5">
            <div className="grid grid-cols-7 gap-2 md:gap-3">
                {days.map((day) => (
                    <div key={day} className="text-center text-xs md:text-sm font-semibold text-muted-foreground pb-1.5">{day}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNumber = i + 1;
                    const dayEvents = getEventsForDay(dayNumber);
                    return (
                        <div key={i} className="border border-border rounded-lg p-2 min-h-[70px] md:min-h-[100px] hover:border-ring transition-colors">
                            <div className="text-xs md:text-sm font-semibold text-foreground mb-1.5">{dayNumber}</div>
                            <div className="space-y-1">
                                {dayEvents.slice(0, 3).map((event) => (
                                    <div
                                        key={event.id}
                                        className="text-[10px] md:text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity truncate"
                                        style={{ backgroundColor: event.color, color: 'white' }}
                                        onClick={() => onEventSelect(event)}
                                        title={`${event.title} - ${event.courseName}`}
                                    >
                                        {event.title}
                                    </div>
                                ))}
                                {dayEvents.length > 3 && (
                                    <div className="text-[10px] md:text-xs text-muted-foreground pl-1">+{dayEvents.length - 3} more</div>
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
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const getEventsForMonth = (monthIndex: number) => {
        return events.filter(event => {
            const eventDate = new Date(event.startTime);
            return eventDate.getFullYear() === currentDate.getFullYear() && eventDate.getMonth() === monthIndex;
        });
    };

    const getDaysInMonth = (monthIndex: number) => {
        return new Date(currentDate.getFullYear(), monthIndex + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (monthIndex: number) => {
        return new Date(currentDate.getFullYear(), monthIndex, 1).getDay();
    };

    return (
        <div className="flex-1 overflow-auto scrollbar-hide p-3 md:p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {months.map((month, monthIdx) => {
                    const monthEvents = getEventsForMonth(monthIdx);
                    const daysInMonth = getDaysInMonth(monthIdx);
                    const firstDay = getFirstDayOfMonth(monthIdx);

                    return (
                        <div
                            key={month}
                            className="border border-border rounded-lg p-2.5 md:p-3 hover:border-ring transition-colors cursor-pointer"
                            onClick={() => onMonthClick(monthIdx)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm md:text-base font-semibold text-foreground">{month}</div>
                                {monthEvents.length > 0 && (
                                    <div className="bg-primary/10 text-primary text-[10px] md:text-xs font-semibold px-1.5 py-0.5 rounded-full">
                                        {monthEvents.length}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-7 gap-0.5">
                                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const dayNumber = i + 1;
                                    const targetDate = new Date(currentDate.getFullYear(), monthIdx, dayNumber);
                                    const hasEvent = monthEvents.some(event =>
                                        new Date(event.startTime).toDateString() === targetDate.toDateString()
                                    );
                                    return (
                                        <div
                                            key={i}
                                            className={`text-center text-[10px] md:text-xs p-0.5 rounded ${hasEvent ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-accent'
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
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
                <Icon className="w-3 h-3" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="mt-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Enrolled Students ({students.length})
            </h4>
            <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted border-b border-border">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Name</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Enrolled</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Attendance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {students.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={3}
                                        className="px-3 py-6 text-center text-sm text-muted-foreground"
                                    >
                                        No students enrolled for this session
                                    </td>
                                </tr>
                            ) : (
                                students.map((student) => (
                                    <tr
                                        key={student.id}
                                        className="hover:bg-accent transition-colors"
                                    >
                                        <td className="px-3 py-2 text-sm font-medium text-foreground">
                                            {student.name}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-muted-foreground">
                                            {student.enrollmentDate.toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-3 py-2">
                                            {getStatusBadge(student.attendanceStatus)}
                                        </td>
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
    const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({ classes: false, instructors: false });
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const { classes: classesWithCourseAndInstructor, loading } = useInstructorClassesWithDetails("a95a2c0d-2097-40ae-a4ce-6630111d12d1");

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
                    courseName: classDef.course?.name || 'Unknown Course',
                    instructor: classDef.instructor?.full_name || 'Unknown Instructor',
                    location: classDef.location_name || 'No location',
                    locationType: classDef.location_type || 'UNKNOWN',
                    startTime: new Date(scheduleItem.start_time),
                    endTime: new Date(scheduleItem.end_time),
                    color: color,
                    maxParticipants: classDef.max_participants || 0,
                    trainingFee: classDef.training_fee || 0,
                    sessionFormat: classDef.session_format || 'UNKNOWN',
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
                const sortedEvents = classEvents.sort((a, b) =>
                    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                );
                setCurrentDate(new Date(sortedEvents[0].startTime));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClassId]);

    const handleDateChange = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        switch (viewMode) {
            case 'day': newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1)); break;
            case 'week': newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7)); break;
            case 'month': newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1)); break;
            case 'year': newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1)); break;
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
            path: { instanceUuid: selectedEvent?.id || '' }
        }),
        enabled: !!selectedEvent?.id,
    })
    const enrollmentsData = data?.data || [];
    const studentUuids = enrollmentsData
        .map((enrollment) => enrollment?.student_uuid)
        .filter(Boolean);

    const { studentsMap, isLoading: isLoadingStudents } = useStudentsMap(studentUuids);

    // Transform enrollment data for StudentEnrollmentTable
    const transformedStudents: StudentEnrollment[] = useMemo(() => {
        return enrollmentsData.map((enrollment) => {
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
                    Oversee and manage all classes across the platform, including scheduling, instructor assignments, attendance tracking, and revenue oversight to ensure smooth operations.
                </p>
            </div>

            {loading ? (
                <div className="h-screen border rounded-2xl flex flex-col bg-background font-sans overflow-hidden">
                    <div className="bg-background border-b border-border px-4 md:px-6 py-3 md:py-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-6">
                                <Skeleton className="h-6 w-32" />
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                </div>
                                <Skeleton className="h-9 w-64 rounded-lg" />
                            </div>
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-8 w-24 rounded-lg" />
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-1 overflow-hidden">
                        <div className="w-60 md:w-64 bg-background border-r border-border flex flex-col">
                            <div className="p-3 md:p-4 border-b border-border">
                                <Skeleton className="h-9 w-full rounded-lg" />
                            </div>
                            <div className="flex-1 p-4 space-y-3">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-32 w-full" />
                            </div>
                        </div>
                        <div className="flex-1 p-4 space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                        <div className="hidden lg:block lg:w-80 bg-muted/30 border-l border-border p-4 space-y-4">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    </div>
                </div>

            ) : (

                <div className="h-screen flex flex-col bg-background font-sans overflow-hidden">
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
                    <div className="flex flex-1 overflow-hidden relative">
                        <button
                            className="lg:hidden fixed bottom-4 right-4 z-50 bg-foreground text-background p-3 rounded-full shadow-lg"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <Search className="w-5 h-5" />
                        </button>
                        <div className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative w-60 md:w-64 bg-background border-r border-border flex flex-col transition-transform duration-300 ease-in-out z-40 h-full`}>
                            <div className="p-3 md:p-4 border-b border-border">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search classes..."
                                        className="w-full pl-9 pr-3 py-1.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto scrollbar-hide">
                                <Dropdown label="Classes" count={uniqueClasses.length} isOpen={openDropdowns.classes} onToggle={() => setOpenDropdowns((prev) => ({ ...prev, classes: !prev.classes }))} items={uniqueClasses} onItemClick={(id) => { setSelectedClassId(id); setSelectedInstructorId(null); setIsMobileMenuOpen(false); }} selectedId={selectedClassId} />
                                <Dropdown label="Instructors" count={uniqueInstructors.length} isOpen={openDropdowns.instructors} onToggle={() => setOpenDropdowns((prev) => ({ ...prev, instructors: !prev.instructors }))} items={uniqueInstructors} onItemClick={(id) => { setSelectedInstructorId(selectedInstructorId === id ? null : id); setIsMobileMenuOpen(false); }} selectedId={selectedInstructorId} />
                            </div>
                            {(selectedClassId !== 'all' || selectedInstructorId) && (
                                <div className="p-3 md:p-4 border-t border-border">
                                    <button onClick={() => { setSelectedClassId('all'); setSelectedInstructorId(null); setIsMobileMenuOpen(false); }} className="w-full text-xs md:text-sm font-medium text-foreground hover:text-foreground transition-colors text-center py-1.5 border border-input rounded-lg hover:bg-accent">
                                        Clear All Filters
                                    </button>
                                </div>
                            )}
                        </div>
                        {isMobileMenuOpen && <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setIsMobileMenuOpen(false)} />}


                        <div className="flex-1 flex flex-col overflow-hidden bg-background">
                            {viewMode === 'week' && <WeekView events={filteredEvents} onEventSelect={setSelectedEvent} selectedEvent={selectedEvent} currentDate={currentDate} />}
                            {viewMode === 'day' && <DayView events={filteredEvents} onEventSelect={setSelectedEvent} selectedEvent={selectedEvent} currentDate={currentDate} />}
                            {viewMode === 'month' && <MonthView events={filteredEvents} onEventSelect={setSelectedEvent} currentDate={currentDate} />}
                            {viewMode === 'year' && <YearView events={filteredEvents} currentDate={currentDate} onMonthClick={handleMonthClick} />}
                        </div>



                        <div className="hidden lg:block lg:w-80 bg-muted/30 border-l border-border overflow-y-auto scrollbar-hide">
                            {selectedEvent ? (
                                <div>
                                    <div className="p-4 border-b border-border bg-background">
                                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Class Session</h3>
                                        <h2 className="text-base font-bold text-foreground">{selectedEvent.title}</h2>
                                        <p className="text-sm text-muted-foreground mt-0.5">{selectedEvent.courseName}</p>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div className="border-b border-border pb-3">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date & Time</span>
                                            </div>
                                            <p className="text-sm text-foreground mt-0.5">
                                                {new Date(selectedEvent.startTime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {new Date(selectedEvent.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedEvent.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="border-b border-border pb-3">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Instructor</span>
                                            </div>
                                            <p className="text-sm text-foreground mt-0.5">{selectedEvent.instructor}</p>
                                        </div>
                                        <div className="border-b border-border pb-3">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</span>
                                            </div>
                                            <p className="text-sm text-foreground mt-0.5">{selectedEvent.location} ({selectedEvent.locationType})</p>
                                        </div>
                                        <div className="border-b border-border pb-3">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Capacity</span>
                                            </div>
                                            <p className="text-sm text-foreground mt-0.5">{selectedEvent.maxParticipants} participants</p>
                                        </div>
                                        <div className="border-b border-border pb-3">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <Home className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Session Format</span>
                                            </div>
                                            <p className="text-sm text-foreground mt-0.5">{selectedEvent.sessionFormat}</p>
                                        </div>
                                        <div className="border-t border-border pt-3">
                                            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                                                <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-0.5">Training Fee</div>
                                                <div className="text-xl font-bold text-primary">${selectedEvent.trainingFee}</div>
                                            </div>
                                        </div>
                                        {isLoadingStudents ? (
                                            <div className="mt-4">
                                                <Skeleton className="h-4 w-32 mb-2" />
                                                <div className="border border-border rounded-lg overflow-hidden">
                                                    <div className="bg-muted border-b border-border p-3 flex gap-4">
                                                        <Skeleton className="h-3 w-20" />
                                                        <Skeleton className="h-3 w-24" />
                                                        <Skeleton className="h-3 w-16" />
                                                    </div>
                                                    <div className="divide-y divide-border">
                                                        {[1, 2, 3].map((i) => (
                                                            <div key={i} className="p-3 flex gap-4">
                                                                <Skeleton className="h-4 w-24" />
                                                                <Skeleton className="h-4 w-20" />
                                                                <Skeleton className="h-6 w-16 rounded-full" />
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
                                <div className="p-6 flex items-center justify-center h-full">
                                    <div className="text-center text-muted-foreground">
                                        <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Select a class session to view details</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div >
            )}



        </main>
    );
}