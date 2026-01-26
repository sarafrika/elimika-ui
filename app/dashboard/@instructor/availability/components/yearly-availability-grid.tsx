'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AvailabilityData, AvailabilitySlot } from './types';

interface YearlyAvailabilityGridProps {
  availabilityData: AvailabilityData;
  onAvailabilityUpdate: (data: AvailabilityData) => void;
  isEditing: boolean;
}

const statusColorMap = {
  available: 'bg-success/10 dark:bg-success/20 text-success border-success/30 dark:border-success/40',
  booked: 'bg-info/10 dark:bg-info/20 text-info border-info/30 dark:border-info/40',
  unavailable: 'bg-destructive/10 dark:bg-destructive/20 text-destructive border-destructive/30 dark:border-destructive/40',
  reserved: 'bg-warning/10 dark:bg-warning/20 text-warning border-warning/30 dark:border-warning/40',
  empty: 'bg-muted/50 text-muted-foreground border-muted',
};

const statusBadgeMap = {
  available: 'bg-success text-success-foreground',
  booked: 'bg-info text-info-foreground',
  unavailable: 'bg-destructive text-destructive-foreground',
  reserved: 'bg-warning text-warning-foreground',
};

const statusDotMap = {
  available: 'bg-success',
  booked: 'bg-info',
  unavailable: 'bg-destructive',
  reserved: 'bg-warning',
};

const statusRowColorMap = {
  available: 'bg-success/5 dark:bg-success/15 border-success/20 dark:border-success/30',
  booked: 'bg-info/5 dark:bg-info/15 border-info/20 dark:border-info/30',
  unavailable: 'bg-destructive/5 dark:bg-destructive/15 border-destructive/20 dark:border-destructive/30',
  reserved: 'bg-warning/5 dark:bg-warning/15 border-warning/20 dark:border-warning/30',
};

export function YearlyAvailabilityGrid({
  availabilityData,
  onAvailabilityUpdate,
  isEditing,
}: YearlyAvailabilityGridProps) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const yearData = useMemo(() => {
    const months = [];
    for (let month = 0; month < 12; month++) {
      const date = new Date(currentYear, month, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'long' });
      const daysInMonth = new Date(currentYear, month + 1, 0).getDate();

      months.push({
        index: month,
        name: monthName,
        shortName: date.toLocaleDateString('en-US', { month: 'short' }),
        daysInMonth,
        date,
      });
    }
    return months;
  }, [currentYear]);

  const getMonthStatus = (month: number) => {
    const monthSlots = availabilityData?.slots?.filter((slot) => {
      if (slot.date) {
        return slot.date.getMonth() === month && slot.date.getFullYear() === currentYear;
      }
      return slot.recurring;
    });

    const available = monthSlots?.filter((slot) => slot.is_available === true).length ?? 0;
    const booked = monthSlots?.filter((slot) => slot.is_available === false).length ?? 0;

    return {
      available,
      booked,
      total: monthSlots?.length ?? 0,
    };
  };

  const getMonthClass = (month: number) => {
    const currentMonth = new Date().getMonth();
    const currentYearCheck = new Date().getFullYear();
    const isCurrentMonth = month === currentMonth && currentYear === currentYearCheck;

    let baseClasses =
      'min-h-[160px] p-5 border border-border/50 rounded-xl cursor-pointer transition-all duration-300 relative hover:shadow-lg';

    if (isCurrentMonth) {
      baseClasses +=
        ' ring-2 ring-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-md';
    } else {
      baseClasses += ' bg-card hover:bg-muted/40 hover:scale-[1.02]';
    }

    return baseClasses;
  };

  const handleMonthClick = (month: number) => {
    if (!isEditing) return;

    const status = getMonthStatus(month);
    const isAvailable = status.available > 0;
    const newStatus = isAvailable ? 'unavailable' : 'available';

    const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
    const updatedSlots = [...availabilityData.slots];

    const filteredSlots = updatedSlots.filter((slot) => {
      if (slot.date) {
        return !(slot.date.getMonth() === month && slot.date.getFullYear() === currentYear);
      }
      return true;
    });

    if (newStatus === 'available') {
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, month, day);
        const dayOfWeek = date.getDay();

        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const defaultTimeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

        defaultTimeSlots.forEach((time) => {
          const newSlot: AvailabilitySlot = {
            id: `${dayName}-${time}-${date.toISOString()}`,
            day: dayName,
            startTime: time,
            endTime: getEndTime(time),
            date: new Date(date),
            status: 'available',
            recurring: false,
          };
          filteredSlots.push(newSlot);
        });
      }
    }

    onAvailabilityUpdate({
      ...availabilityData,
      slots: filteredSlots,
    });
  };

  const getEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    return `${(Number(hours) + 1)
      .toString()
      .padStart(2, '0')}:${minutes?.toString().padStart(2, '0')}`;
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    setCurrentYear((prev) => prev + (direction === 'next' ? 1 : -1));
  };

  const getTotalAvailabilityForYear = () => {
    const yearSlots = availabilityData?.slots?.filter((slot) => {
      if (slot.date) {
        return slot.date.getFullYear() === currentYear;
      }
      return slot.recurring;
    });

    return {
      available: yearSlots?.filter((slot) => slot.is_available === true).length ?? 0,
      booked: yearSlots?.filter((slot) => slot.is_available === false).length ?? 0,
      total: yearSlots?.length ?? 0,
    };
  };

  const yearTotals = getTotalAvailabilityForYear();

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
                onClick={() => navigateYear('prev')}
                className="h-9 w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="text-center min-w-[120px]">
                <h3 className="text-2xl font-bold flex items-center justify-center gap-2 text-foreground">
                  <Calendar className="h-6 w-6 text-primary" />
                  {currentYear}
                </h3>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateYear('next')}
                className="h-9 w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={() => setCurrentYear(new Date().getFullYear())}
              variant="outline"
              size="sm"
            >
              Current Year
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Year Summary */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h4 className="text-lg font-semibold text-foreground">
                Year {currentYear} Summary
              </h4>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                className={`border ${statusBadgeMap.available}`}
                variant="outline"
              >
                {yearTotals.available} Available
              </Badge>
              <Badge className={`border ${statusBadgeMap.booked}`} variant="outline">
                {yearTotals.booked} Booked
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Months Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {yearData.map((month) => {
          const status = getMonthStatus(month.index);
          const currentMonth = new Date().getMonth();
          const currentYearCheck = new Date().getFullYear();
          const isCurrentMonth =
            month.index === currentMonth && currentYear === currentYearCheck;

          return (
            <TooltipProvider key={month.index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={getMonthClass(month.index)}
                    onClick={() => handleMonthClick(month.index)}
                  >
                    <div className="flex h-full flex-col">
                      {/* Month Header */}
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="text-lg font-bold flex items-center gap-2 text-foreground">
                          {isCurrentMonth && (
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          )}
                          {month.name}
                        </h4>
                        <Calendar className="text-muted-foreground h-5 w-5" />
                      </div>

                      {/* Status Breakdown */}
                      <div className="flex-1 space-y-2.5">
                        {status.available > 0 && (
                          <div
                            className={`flex items-center justify-between p-2 rounded-lg border ${statusRowColorMap.available}`}
                          >
                            <span className="text-sm font-medium text-success">
                              Available
                            </span>
                            <Badge className={statusBadgeMap.available}>
                              {status.available}
                            </Badge>
                          </div>
                        )}

                        {status.booked > 0 && (
                          <div
                            className={`flex items-center justify-between p-2 rounded-lg border ${statusRowColorMap.booked}`}
                          >
                            <span className="text-sm font-medium text-info">
                              Booked
                            </span>
                            <Badge className={statusBadgeMap.booked}>
                              {status.booked}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {status.total === 0 && (
                        <div className="text-muted-foreground py-8 text-center text-sm bg-muted/30 rounded-lg">
                          No availability set
                        </div>
                      )}

                      {/* Footer Stats */}
                      <div className="border-t border-border/50 mt-4 pt-3">
                        <div className="text-muted-foreground text-center text-xs font-medium">
                          {month.daysInMonth} days • {status.total} total slots
                        </div>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-2 text-sm">
                    <div className="font-semibold text-base text-foreground">
                      {month.name} {currentYear}
                    </div>
                    <div className="space-y-1.5 border-t border-border pt-2">
                      <div className="flex items-center gap-2 text-success">
                        <div className={`h-2 w-2 rounded-full ${statusDotMap.available}`} />
                        <span>{status.available} available slots</span>
                      </div>
                      <div className="flex items-center gap-2 text-info">
                        <div className={`h-2 w-2 rounded-full ${statusDotMap.booked}`} />
                        <span>{status.booked} booked slots</span>
                      </div>
                    </div>
                    {isEditing && (
                      <div className="text-muted-foreground border-t border-border pt-2 text-xs">
                        Click to toggle month availability
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}