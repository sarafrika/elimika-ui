import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addDays, format, isBefore, isSameDay, isWithinInterval, startOfDay } from 'date-fns';
import { Calendar, ChevronRight, Clock, MapPin, Video } from 'lucide-react';
import { useMemo, useState } from 'react';

export type ClassScheduleItem = {
  uuid: string;
  start_time: string;
  end_time: string;
  title: string;
  location_type: 'ONLINE' | 'PHYSICAL';
  time_range: string;
  student_attended?: boolean | null;
};

interface WeeklyScheduleListProps {
  schedules: ClassScheduleItem[];
  onScheduleClick: (schedule: ClassScheduleItem) => void;
  title?: string;
}

const FILTER_OPTIONS = [
  { label: 'Next 7 days', value: 7 },
  { label: 'Next 14 days', value: 14 },
  { label: 'Next 21 days', value: 21 },
  { label: 'Next 30 days', value: 30 },
];

export function WeeklyScheduleList({
  schedules,
  onScheduleClick,
  title = 'Upcoming Classes',
}: WeeklyScheduleListProps) {
  const [filterDays, setFilterDays] = useState<number>(7);

  // ---- Date range ----
  const rangeStart = startOfDay(new Date());
  const rangeEnd = addDays(rangeStart, filterDays);

  // ---- Filter schedules ----
  const filteredSchedules = useMemo(
    () =>
      schedules.filter(schedule =>
        isWithinInterval(new Date(schedule.start_time), {
          start: rangeStart,
          end: rangeEnd,
        })
      ),
    [schedules, rangeStart, rangeEnd]
  );

  // ---- Empty state ----
  if (!filteredSchedules.length) {
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between gap-3'>
          <CardTitle className='text-base sm:text-lg'>{title}</CardTitle>

          <Select value={String(filterDays)} onValueChange={v => setFilterDays(Number(v))}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent>
          <div className='py-10 text-center'>
            <Calendar className='text-muted-foreground mx-auto mb-4 h-14 w-14' />
            <p className='text-muted-foreground text-sm sm:text-base'>
              No classes scheduled in the next {filterDays} days
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---- Render ----
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between gap-3'>
        <CardTitle className='text-base sm:text-lg'>{title}</CardTitle>

        <Select value={String(filterDays)} onValueChange={v => setFilterDays(Number(v))}>
          <SelectTrigger className='w-[140px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent>
        <div className='space-y-3'>
          {filteredSchedules.map(schedule => {
            const isPast = isBefore(new Date(schedule.end_time), new Date());
            const isToday = isSameDay(new Date(schedule.start_time), new Date());

            return (
              <Card
                key={schedule.uuid}
                className={`cursor-pointer transition-all hover:shadow-md active:scale-[0.99] ${isPast ? 'opacity-60' : ''} ${isToday ? 'border-primary/50 bg-primary/5' : ''} `}
                onClick={() => onScheduleClick(schedule)}
              >
                <CardContent className='p-3 sm:p-4'>
                  <div className='flex items-center justify-between gap-2'>
                    <div className='min-w-0 flex-1'>
                      <div className='mb-2 flex flex-wrap items-center gap-2'>
                        <h4 className='truncate text-sm font-semibold sm:text-base'>
                          {schedule.title}
                        </h4>

                        {isPast && schedule.student_attended !== null && (
                          <Badge
                            variant={schedule.student_attended ? 'default' : 'destructive'}
                            className='text-xs'
                          >
                            {schedule.student_attended ? 'Attended' : 'Missed'}
                          </Badge>
                        )}

                        {isToday && (
                          <Badge variant='default' className='text-xs'>
                            Today
                          </Badge>
                        )}
                      </div>

                      <div className='text-muted-foreground flex flex-wrap gap-2 text-xs sm:gap-4 sm:text-sm'>
                        <div className='flex items-center gap-1'>
                          <Calendar className='h-3 w-3' />
                          <span>{format(new Date(schedule.start_time), 'EEE, MMM d')}</span>
                        </div>

                        <div className='flex items-center gap-1'>
                          <Clock className='h-3 w-3' />
                          <span>{schedule.time_range}</span>
                        </div>

                        <div className='flex items-center gap-1'>
                          {schedule.location_type === 'ONLINE' ? (
                            <>
                              <Video className='h-3 w-3' />
                              <span className='hidden sm:inline'>Online</span>
                            </>
                          ) : (
                            <>
                              <MapPin className='h-3 w-3' />
                              <span className='hidden sm:inline'>Physical</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className='text-muted-foreground h-5 w-5 flex-shrink-0' />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
