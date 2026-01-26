'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ClassData } from '../../trainings/create-new/academic-period-form';
import type { AvailabilityData, CalendarEvent } from './types';

interface MonthlyAvailabilityGridProps {
  availabilityData: AvailabilityData;
  onAvailabilityUpdate: (data: AvailabilityData) => void;
  isEditing: boolean;
  classes: ClassData[];
}

const eventColorMap = {
  SCHEDULED_INSTANCE: {
    badge: 'bg-info/10 text-info border-info/20',
    dot: 'bg-info',
    gradient: 'from-info/5 to-info/10 dark:from-info/20 dark:to-info/15',
  },
  BLOCKED: {
    badge: 'bg-destructive/10 text-destructive border-destructive/20',
    dot: 'bg-destructive',
    gradient: 'from-destructive/5 to-destructive/10 dark:from-destructive/20 dark:to-destructive/15',
  },
  AVAILABILITY: {
    badge: 'bg-success/10 text-success border-success/20',
    dot: 'bg-success',
    gradient: 'from-success/5 to-success/10 dark:from-success/20 dark:to-success/15',
  },
};

export function MonthlyAvailabilityGrid({
  availabilityData,
  onAvailabilityUpdate,
  isEditing,
  classes,
}: MonthlyAvailabilityGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [_isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [_selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [_selectedSlot, setSelectedSlot] = useState<{
    day: string;
    time: string;
    date: Date;
  } | null>(null);

  const monthData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);

    const startDay = startDate.getDay();
    const daysToSubtract = startDay === 0 ? 6 : startDay - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);

    const endDay = endDate.getDay();
    const daysToAdd = endDay === 0 ? 0 : 7 - endDay;
    endDate.setDate(endDate.getDate() + daysToAdd);

    const days = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return {
      year,
      month,
      firstDay,
      lastDay,
      days,
    };
  }, [currentMonth]);

  const getDayStatus = (date: Date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

    const daySlots = availabilityData.events.filter((slot) => {
      if (slot.date) {
        return slot.date.toDateString() === date.toDateString();
      }
      return slot.day === dayName;
    });

    const dayClasses = classes.filter((classItem) => {
      if (classItem.status !== 'published') return false;
      return classItem.timetable.timeSlots.some((timeSlot) => {
        const isCorrectDay = timeSlot.day.toLowerCase() === dayName.toLowerCase();
        const isWithinPeriod =
          date >= new Date(classItem.academicPeriod.startDate) &&
          date <= new Date(classItem.academicPeriod.endDate);
        return isCorrectDay && isWithinPeriod;
      });
    });

    const dayEvents = [
      ...availabilityData.events.filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === date.toDateString();
      }),
    ];

    const blockedEvents = daySlots.filter((slot) => slot.entry_type === 'BLOCKED');
    const bookedEvents = [...daySlots.filter((slot) => slot.entry_type === 'SCHEDULED_INSTANCE')];

    return {
      blocked: blockedEvents,
      booked: bookedEvents,
      total: daySlots.length,
      classes: dayClasses,
      events: dayEvents,
    };
  };

  const getDayClass = (date: Date, status: ReturnType<typeof getDayStatus>) => {
    const isCurrentMonth = date.getMonth() === monthData.month;
    const isToday = date.toDateString() === new Date().toDateString();

    let baseClasses =
      'min-h-[120px] p-3 border border-border/50 rounded-lg cursor-pointer transition-all duration-200 relative hover:shadow-md';

    if (!isCurrentMonth) {
      baseClasses += ' bg-muted/30 text-muted-foreground';
    } else if (isToday) {
      baseClasses += ' ring-2 ring-primary bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm';
    } else {
      baseClasses += ' bg-card hover:bg-muted/30';
    }

    if (status.events.length > 0) {
      baseClasses += ' hover:scale-[1.02]';
    }

    return baseClasses;
  };

  const handleDayClick = (date: Date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

    const eventsForDay = availabilityData.events.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });

    if (eventsForDay.length > 0) {
      setSelectedEvent(eventsForDay[0] as any);
      setSelectedSlot(null);
    } else {
      setSelectedEvent(null);
      setSelectedSlot({
        day: dayName,
        time: '09:00',
        date,
      });
    }

    setIsEventModalOpen(true);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Card */}
      <Card className="p-0 border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('prev')}
                className="h-9 w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="text-center min-w-[180px]">
                <h3 className="text-xl font-bold flex items-center justify-center gap-2 text-foreground">
                  <Calendar className="h-5 w-5 text-primary" />
                  {monthName}
                </h3>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('next')}
                className="h-9 w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={() => setCurrentMonth(new Date())}
              variant="outline"
              size="sm"
            >
              Current Month
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card className="overflow-hidden border-0 shadow-sm">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {weekdays.map((day) => (
            <div
              key={day}
              className="border-r border-border last:border-r-0 p-4 text-center text-sm font-semibold text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-px bg-border">
          {monthData.days.map((date, index) => {
            const status = getDayStatus(date);
            const isCurrentMonth = date.getMonth() === monthData.month;
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={getDayClass(date, status)}
                      onClick={() => handleDayClick(date)}
                    >
                      {/* Date Number */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-sm font-semibold ${isToday
                            ? 'flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground'
                            : !isCurrentMonth
                              ? 'text-muted-foreground/60'
                              : 'text-foreground'
                            }`}
                        >
                          {date.getDate()}
                        </span>

                        {/* Status Dots */}
                        {status.events.length > 0 && (
                          <div className="flex gap-1">
                            {status.booked.length > 0 && (
                              <div className="h-2 w-2 rounded-full bg-info" />
                            )}
                            {status.blocked.length > 0 && (
                              <div className="h-2 w-2 rounded-full bg-destructive" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Event Previews */}
                      <div className="space-y-1.5">
                        {status.events.slice(0, 3).map((event) => {
                          const colors =
                            eventColorMap[event?.entry_type || 'SCHEDULED_INSTANCE'] ??
                            eventColorMap.SCHEDULED_INSTANCE;

                          return (
                            <div
                              key={event.id}
                              className={`rounded-md px-2 py-1 text-xs font-medium border ${colors.badge} truncate transition-all hover:scale-105`}
                            >
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                                <span className="truncate">
                                  {event.title || event.entry_type}
                                </span>
                              </div>
                              <div className="text-xs opacity-75 mt-0.5">
                                {event.startTime}
                              </div>
                            </div>
                          );
                        })}

                        {status.events.length > 3 && (
                          <div className="text-muted-foreground text-xs font-medium text-center py-1">
                            +{status.events.length - 3} more
                          </div>
                        )}
                      </div>

                      {/* Count Badges at Bottom */}
                      {(status.booked.length > 0 || status.blocked.length > 0) && (
                        <div className="absolute bottom-2 right-2 flex gap-1">
                          {status.booked.length > 0 && (
                            <Badge className="h-5 text-xs bg-info/10 text-info border-info/20">
                              {status.booked.length}
                            </Badge>
                          )}
                          {status.blocked.length > 0 && (
                            <Badge className="h-5 text-xs bg-destructive/10 text-destructive border-destructive/20">
                              {status.blocked.length}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-2 text-sm">
                      <div className="font-semibold text-foreground">
                        {date.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>

                      {status.booked.length > 0 && (
                        <div className="flex items-center gap-2 text-info">
                          <div className="h-2 w-2 rounded-full bg-info" />
                          <span>{status.booked.length} booked event(s)</span>
                        </div>
                      )}

                      {status.blocked.length > 0 && (
                        <div className="flex items-center gap-2 text-destructive">
                          <div className="h-2 w-2 rounded-full bg-destructive" />
                          <span>{status.blocked.length} blocked slot(s)</span>
                        </div>
                      )}

                      {status.events.length > 0 && (
                        <div className="border-t border-border pt-2 mt-2 text-xs space-y-1">
                          <div className="font-medium text-foreground">Events:</div>
                          {status.events.slice(0, 5).map((e) => (
                            <div key={e.id} className="text-muted-foreground">
                              • {e.title} ({e.startTime}-{e.endTime})
                            </div>
                          ))}
                        </div>
                      )}

                      {status.classes.length > 0 && (
                        <div className="border-t border-border pt-2 text-xs">
                          <div className="font-medium text-foreground">Classes:</div>
                          <div className="text-muted-foreground">
                            {status.classes.map((c) => c.classTitle).join(', ')}
                          </div>
                        </div>
                      )}

                      {status.total === 0 && status.events.length === 0 && (
                        <div className="text-muted-foreground text-xs">Click to add event</div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </Card>
    </div>
  );
}