import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    addDays,
    addWeeks,
    endOfMonth,
    endOfWeek,
    format,
    isBefore,
    isSameDay,
    isSameMonth,
    startOfMonth,
    startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

export type ClassScheduleItem = {
    uuid: string;
    class_definition_uuid: string;
    start_time: string;
    end_time: string;
    timezone: string;
    title: string;
    location_type: 'ONLINE' | 'PHYSICAL';
    status: 'SCHEDULED' | 'CANCELLED';
    duration_minutes: number;
    duration_formatted: string;
    time_range: string;
    is_currently_active: boolean;
    can_be_cancelled: boolean;
    instructor_name?: string;
    student_attended?: boolean | null;
};

interface ClassScheduleCalendarProps {
    schedules: ClassScheduleItem[];
    onScheduleClick?: (schedule: ClassScheduleItem) => void;
}

function getCalendarBounds(schedules: ClassScheduleItem[]) {
    if (!schedules?.length) {
        const now = new Date();
        return {
            minMonth: startOfMonth(now),
            maxMonth: endOfMonth(now),
        };
    }

    const sorted = schedules
        ?.map((s) => new Date(s.start_time))
        ?.sort((a, b) => a.getTime() - b.getTime());

    return {
        minMonth: startOfMonth(addWeeks(sorted[0], -2)),
        maxMonth: endOfMonth(addWeeks(sorted[sorted.length - 1], 2)),
    };
}

export function ClassScheduleCalendar({
    schedules,
    onScheduleClick,
}: ClassScheduleCalendarProps) {
    const { minMonth, maxMonth } = useMemo(
        () => getCalendarBounds(schedules),
        [schedules]
    );

    const [currentMonth, setCurrentMonth] = useState(minMonth);
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
        days.push(day);
        day = addDays(day, 1);
    }

    const prevMonth = startOfMonth(addDays(monthStart, -1));
    const nextMonth = startOfMonth(addDays(monthEnd, 1));

    const canGoPrev = prevMonth >= minMonth;
    const canGoNext = nextMonth <= maxMonth;

    const sessionsByDay = useMemo(() => {
        const map = new Map<string, ClassScheduleItem[]>();

        schedules?.forEach((s) => {
            const key = format(new Date(s.start_time), 'yyyy-MM-dd');
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(s);
        });

        return map;
    }, [schedules]);

    const filteredSchedulesForList = useMemo(() => {
        return schedules
            ?.filter((s) => isSameMonth(new Date(s.start_time), currentMonth))
            ?.sort(
                (a, b) =>
                    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
            );
    }, [schedules, currentMonth]);

    return (
        <div className="space-y-4">
            {/* Mobile View Toggle */}
            <div className="flex gap-2 sm:hidden">
                <Button
                    variant={viewMode === 'calendar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                    className="flex-1 text-xs"
                >
                    Calendar
                </Button>
                <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="flex-1 text-xs"
                >
                    List
                </Button>
            </div>

            {/* Calendar View */}
            <Card className={viewMode === 'list' ? 'hidden sm:block' : ''}>
                <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6">
                    <Button
                        size="icon"
                        variant="outline"
                        disabled={!canGoPrev}
                        onClick={() => canGoPrev && setCurrentMonth(prevMonth)}
                        className="h-8 w-8 sm:h-10 sm:w-10"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <h3 className="font-semibold text-sm sm:text-base">
                        {format(currentMonth, 'MMMM yyyy')}
                    </h3>

                    <Button
                        size="icon"
                        variant="outline"
                        disabled={!canGoNext}
                        onClick={() => canGoNext && setCurrentMonth(nextMonth)}
                        className="h-8 w-8 sm:h-10 sm:w-10"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <CardContent className="p-2 sm:p-6">
                    {/* Week Headers */}
                    <div className="grid grid-cols-7 mb-1 sm:mb-2 text-[10px] sm:text-xs text-muted-foreground">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={i} className="text-center font-medium">
                                <span className="sm:hidden">{d}</span>
                                <span className="hidden sm:inline">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {days.map((date) => {
                            const key = format(date, 'yyyy-MM-dd');
                            const sessions = sessionsByDay.get(key) || [];
                            const isOutsideMonth = !isSameMonth(date, currentMonth);
                            const isToday = isSameDay(date, new Date());

                            return (
                                <div
                                    key={key}
                                    className={`min-h-[60px] sm:min-h-[90px] rounded-md border p-0.5 sm:p-1 text-xs transition-colors
                    ${isOutsideMonth ? 'bg-muted/30 text-muted-foreground' : 'bg-card'}
                    ${sessions.length ? 'border-primary/50 hover:bg-primary/5' : ''}
                    ${isToday ? 'ring-1 sm:ring-2 ring-primary' : ''}
                  `}
                                >
                                    <div
                                        className={`font-medium text-right text-[10px] sm:text-xs ${isToday ? 'text-primary' : ''
                                            }`}
                                    >
                                        {format(date, 'd')}
                                    </div>

                                    <div className="space-y-0.5 sm:space-y-1 mt-0.5 sm:mt-1">
                                        {sessions.slice(0, 2).map((s) => {
                                            const isPast = isBefore(new Date(s.end_time), new Date());

                                            return (
                                                <button
                                                    key={s.uuid}
                                                    onClick={() => onScheduleClick?.(s)}
                                                    className={`w-full rounded bg-primary/10 px-0.5 sm:px-1 py-0.5 text-[8px] sm:text-[10px] text-left hover:bg-primary/20 transition-colors ${isPast ? 'opacity-60' : ''
                                                        }`}
                                                >
                                                    <div className="font-semibold truncate hidden sm:block">
                                                        {s.title}
                                                    </div>
                                                    <div className="text-muted-foreground">
                                                        {format(new Date(s.start_time), 'HH:mm')}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        {sessions.length > 2 && (
                                            <div className="text-[8px] text-center text-muted-foreground">
                                                +{sessions.length - 2}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Range Hint */}
                    <p className="mt-3 text-[10px] sm:text-xs text-muted-foreground text-center">
                        Showing schedule from{' '}
                        <strong>{format(minMonth, 'MMM d, yyyy')}</strong> to{' '}
                        <strong>{format(maxMonth, 'MMM d, yyyy')}</strong>
                    </p>
                </CardContent>
            </Card>

            {/* List View - Mobile Only */}
            {viewMode === 'list' && (
                <div className="sm:hidden space-y-2">
                    {filteredSchedulesForList?.length > 0 ? (
                        filteredSchedulesForList.map((schedule) => (
                            <Card
                                key={schedule.uuid}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => onScheduleClick?.(schedule)}
                            >
                                <CardContent className="p-3">
                                    <div className="font-semibold text-sm mb-1">
                                        {schedule.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        <div>
                                            {format(new Date(schedule.start_time), 'EEEE, MMMM d')}
                                        </div>
                                        <div>{schedule.time_range}</div>
                                        <div className="capitalize">
                                            {schedule.location_type.toLowerCase()}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="p-6 text-center text-sm text-muted-foreground">
                                No classes scheduled for this month
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}