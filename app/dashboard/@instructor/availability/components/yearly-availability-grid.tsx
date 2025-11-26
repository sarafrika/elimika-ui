'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AvailabilityData, AvailabilitySlot } from './types';

interface YearlyAvailabilityGridProps {
  availabilityData: AvailabilityData;
  onAvailabilityUpdate: (data: AvailabilityData) => void;
  isEditing: boolean;
}

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
    // Get all slots for this month
    const monthSlots = availabilityData?.slots?.filter(slot => {
      if (slot.date) {
        return slot.date.getMonth() === month && slot.date.getFullYear() === currentYear;
      }
      // For recurring slots, count them for each month
      return slot.recurring;
    });

    const available = monthSlots?.filter(slot => slot.is_available === true).length;
    const unavailable = monthSlots?.filter(slot => slot.is_available === false).length;
    const booked = monthSlots?.filter(slot => slot.is_available === false).length;
    const reserved = monthSlots?.filter(slot => slot.is_available === false).length;

    return {
      available,
      unavailable,
      booked,
      reserved,
      total: monthSlots?.length,
    };
  };

  const getMonthClass = (month: number) => {
    const _status = getMonthStatus(month);
    const currentMonth = new Date().getMonth();
    const currentYearCheck = new Date().getFullYear();
    const isCurrentMonth = month === currentMonth && currentYear === currentYearCheck;

    let baseClasses =
      'h-32 p-4 border border-border rounded-lg cursor-pointer transition-all hover:shadow-md relative';

    if (isCurrentMonth) {
      baseClasses += ' ring-2 ring-primary bg-primary/10';
    } else {
      baseClasses += ' bg-card hover:bg-muted/60';
    }

    return baseClasses;
  };

  const handleMonthClick = (month: number) => {
    if (!isEditing) return;

    const status = getMonthStatus(month);

    // Toggle month availability (simplified - create default availability for the month)
    const isAvailable = status.available > 0;
    const newStatus = isAvailable ? 'unavailable' : 'available';

    // Create default availability for business days of the month
    const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
    const updatedSlots = [...availabilityData.slots];

    // Remove existing slots for this month
    const filteredSlots = updatedSlots.filter(slot => {
      if (slot.date) {
        return !(slot.date.getMonth() === month && slot.date.getFullYear() === currentYear);
      }
      return true;
    });

    // Add new slots if setting to available
    if (newStatus === 'available') {
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, month, day);
        const dayOfWeek = date.getDay();

        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const defaultTimeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

        defaultTimeSlots.forEach(time => {
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
    return `${(Number(hours) + 1).toString().padStart(2, '0')}:${minutes?.toString().padStart(2, '0')}`;
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    setCurrentYear(prev => prev + (direction === 'next' ? 1 : -1));
  };

  const getStatusColor = (
    count: number,
    type: 'available' | 'booked' | 'unavailable' | 'reserved'
  ) => {
    if (count === 0) return 'bg-muted text-muted-foreground';

    switch (type) {
      case 'available':
        return 'bg-success/10 text-success';
      case 'booked':
        return 'bg-primary/10 text-primary';
      case 'unavailable':
        return 'bg-destructive/10 text-destructive';
      case 'reserved':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTotalAvailabilityForYear = () => {
    const yearSlots = availabilityData?.slots?.filter(slot => {
      if (slot.date) {
        return slot.date.getFullYear() === currentYear;
      }
      return slot.recurring;
    });

    return {
      available: yearSlots?.filter(slot => slot.is_available === true).length,
      booked: yearSlots?.filter(slot => slot.is_available === false).length,
      unavailable: yearSlots?.filter(slot => slot.is_available === false).length,
      total: yearSlots?.length,
    };
  };

  const yearTotals = getTotalAvailabilityForYear();

  return (
    <div className='space-y-6'>
      {/* Year Navigation */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='outline' size='sm' onClick={() => navigateYear('prev')}>
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <h3 className='text-2xl font-medium'>{currentYear}</h3>
          <Button variant='outline' size='sm' onClick={() => navigateYear('next')}>
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>

        {isEditing && (
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm'>
              <Plus className='mr-2 h-4 w-4' />
              Bulk Add
            </Button>
            <Button variant='outline' size='sm'>
              <Trash2 className='mr-2 h-4 w-4' />
              Clear Year
            </Button>
          </div>
        )}
      </div>

      {/* Year Summary */}
      <Card className='p-4'>
        <div className='flex items-center justify-between'>
          <h4 className='font-medium'>Year {currentYear} Summary</h4>
          <div className='flex items-center gap-4'>
            <Badge className={getStatusColor(yearTotals.available, 'available')}>
              {yearTotals.available} Available
            </Badge>
            <Badge className={getStatusColor(yearTotals.booked, 'booked')}>
              {yearTotals.booked} Booked
            </Badge>
            <Badge className={getStatusColor(yearTotals.unavailable, 'unavailable')}>
              {yearTotals.unavailable} Unavailable
            </Badge>
          </div>
        </div>
      </Card>

      {/* Months Grid */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {yearData.map(month => {
          const status = getMonthStatus(month.index);

          return (
            <TooltipProvider key={month.index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={getMonthClass(month.index)}
                    onClick={() => handleMonthClick(month.index)}
                  >
                    <div className='flex h-full flex-col'>
                      <div className='mb-2 flex items-center justify-between'>
                        <h4 className='text-lg font-medium'>{month.name}</h4>
                        <Calendar className='h-4 w-4 text-muted-foreground' />
                      </div>

                      <div className='flex-1 space-y-2'>
                        {status.available > 0 && (
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-success'>Available</span>
                            <Badge className='bg-success/10 text-success'>
                              {status.available}
                            </Badge>
                          </div>
                        )}

                        {status.booked > 0 && (
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-primary'>Booked</span>
                            <Badge className='bg-primary/10 text-primary'>{status.booked}</Badge>
                          </div>
                        )}

                        {status.unavailable > 0 && (
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-destructive'>Unavailable</span>
                            <Badge className='bg-destructive/10 text-destructive'>
                              {status.unavailable}
                            </Badge>
                          </div>
                        )}

                        {status.reserved > 0 && (
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-warning'>Reserved</span>
                            <Badge className='bg-warning/10 text-warning'>
                              {status.reserved}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {status.total === 0 && (
                        <div className='py-4 text-center text-sm text-muted-foreground'>
                          No availability set
                        </div>
                      )}

                      <div className='mt-auto border-t border-border pt-2'>
                        <div className='text-center text-xs text-muted-foreground'>
                          {month.daysInMonth} days • {status.total} slots
                        </div>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className='space-y-1 text-sm'>
                    <div className='font-medium'>
                      {month.name} {currentYear}
                    </div>
                    <div className='space-y-1'>
                      <div className='text-success'>✓ {status.available} available slots</div>
                      <div className='text-primary'>📚 {status.booked} booked slots</div>
                      <div className='text-destructive'>✕ {status.unavailable} unavailable</div>
                      <div className='text-warning'>⏳ {status.reserved} reserved</div>
                    </div>
                    {isEditing && (
                      <div className='mt-2 border-t pt-2 text-xs text-muted-foreground'>
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

      {/* Quick Actions */}
      {isEditing && (
        <Card className='p-4'>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-muted-foreground'>
              Click months to toggle availability • Automatically sets business hours for weekdays
            </div>
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='sm'>
                Set All Months Available
              </Button>
              <Button variant='outline' size='sm'>
                Copy Previous Year
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
