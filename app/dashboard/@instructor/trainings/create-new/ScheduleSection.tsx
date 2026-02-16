'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useMemo } from 'react';
import { cn } from '../../../../../lib/utils';
import { ScheduleSettings } from './page';

export const ScheduleSection = ({
  data,
  onChange,
  occurrenceCount,
}: {
  data: ScheduleSettings;
  onChange: (updates: Partial<ScheduleSettings>) => void;
  occurrenceCount: number;
}) => {
  const displaySummary = useMemo(() => {
    if (data.repeat.unit === 'week' && data.repeat.days?.length) {
      return `Repeats on: ${data.repeat.days.map(d => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d]).join(', ')}`;
    }
    return `Repeats every ${data.repeat.interval} ${data.repeat.unit}(s)`;
  }, [data.repeat.unit, data.repeat.interval, data.repeat.days]);

  return (
    <Card className='overflow-hidden border pt-0 shadow-sm'>
      <div className='bg-muted/50 border-b px-6 py-4'>
        <h3 className='text-foreground text-lg font-semibold'>Class Schedule</h3>
      </div>

      <Table>
        <TableBody>
          {/* Academic Period */}
          <TableRow className='border-b hover:bg-transparent'>
            <TableCell className='bg-muted/30 w-1/3 py-4 font-semibold'>Academic Period</TableCell>
            <TableCell className='bg-card py-4'>
              <div className='flex flex-wrap items-center gap-3'>
                <Input
                  type='date'
                  value={data.academicPeriod.start}
                  onChange={e =>
                    onChange({
                      academicPeriod: { ...data.academicPeriod, start: e.target.value },
                    })
                  }
                  className='w-44'
                />
                <span className='text-muted-foreground text-sm font-medium'>to</span>
                <Input
                  type='date'
                  value={data.academicPeriod.end}
                  onChange={e =>
                    onChange({
                      academicPeriod: { ...data.academicPeriod, end: e.target.value },
                    })
                  }
                  className='w-44'
                />
              </div>
            </TableCell>
          </TableRow>

          {/* Registration Period */}
          <TableRow className='border-b hover:bg-transparent'>
            <TableCell className='bg-muted/30 py-4 font-semibold'>Registration Period</TableCell>
            <TableCell className='bg-card py-4'>
              <div className='space-y-3'>
                <div className='flex flex-wrap items-end gap-4'>
                  <div className='flex flex-col gap-2'>
                    <label className='text-muted-foreground text-xs font-semibold'>
                      Start Date
                    </label>
                    <Input
                      type='date'
                      value={data.registrationPeriod.start}
                      onChange={e =>
                        onChange({
                          registrationPeriod: {
                            ...data.registrationPeriod,
                            start: e.target.value,
                          },
                        })
                      }
                      className='w-44'
                    />
                  </div>

                  <div className='flex flex-col gap-2'>
                    <label className='text-muted-foreground text-xs font-semibold'>End Date</label>
                    <Input
                      type='date'
                      value={data.registrationPeriod.end || ''}
                      disabled={data.registrationPeriod.continuous}
                      onChange={e =>
                        onChange({
                          registrationPeriod: {
                            ...data.registrationPeriod,
                            end: e.target.value,
                          },
                        })
                      }
                      className='w-44'
                    />
                  </div>
                </div>

                <label className='text-foreground flex w-fit cursor-pointer items-center gap-3 text-sm font-medium'>
                  <input
                    type='checkbox'
                    checked={data.registrationPeriod.continuous || false}
                    onChange={e =>
                      onChange({
                        registrationPeriod: {
                          ...data.registrationPeriod,
                          continuous: e.target.checked,
                          end: e.target.checked ? '' : data.registrationPeriod.end,
                        },
                      })
                    }
                    className='h-4 w-4 rounded'
                  />
                  Continuous Registration (no closing date)
                </label>
              </div>
            </TableCell>
          </TableRow>

          {/* Start Classes */}
          <TableRow className='border-b hover:bg-transparent'>
            <TableCell className='bg-muted/30 py-4 font-semibold'>Start Classes *</TableCell>
            <TableCell className='bg-card py-4'>
              <div className='space-y-3'>
                <div className='flex flex-col gap-4 sm:flex-row sm:items-end'>
                  <div className='flex flex-col gap-2'>
                    <label className='text-muted-foreground text-xs font-semibold'>Class Day</label>
                    <Input
                      type='date'
                      value={data.startClass.date || ''}
                      onChange={e =>
                        onChange({
                          startClass: {
                            ...data.startClass,
                            date: e.target.value,
                          },
                        })
                      }
                      className='w-44'
                      required
                    />
                  </div>

                  <div className='flex flex-col gap-2'>
                    <label className='text-muted-foreground text-xs font-semibold'>
                      Start Time
                    </label>
                    <Input
                      type='time'
                      value={data.startClass.startTime || ''}
                      onChange={e =>
                        onChange({
                          startClass: {
                            ...data.startClass,
                            startTime: e.target.value,
                          },
                        })
                      }
                      disabled={data.allDay}
                      className='w-44'
                      required={!data.allDay}
                    />
                  </div>

                  <div className='flex flex-col gap-2'>
                    <label className='text-muted-foreground text-xs font-semibold'>End Time</label>
                    <Input
                      type='time'
                      value={data.startClass.endTime || ''}
                      onChange={e =>
                        onChange({
                          startClass: {
                            ...data.startClass,
                            endTime: e.target.value,
                          },
                        })
                      }
                      disabled={data.allDay}
                      className='w-44'
                      required={!data.allDay}
                    />
                  </div>
                </div>

                <label className='text-foreground flex w-fit cursor-pointer items-center gap-3 text-sm font-medium'>
                  <input
                    type='checkbox'
                    checked={data.allDay}
                    onChange={e => onChange({ allDay: e.target.checked })}
                    className='h-4 w-4 rounded'
                  />
                  All Day (entire day booked)
                </label>
              </div>
            </TableCell>
          </TableRow>

          {/* Repeat Configuration */}
          <TableRow className='border-b hover:bg-transparent'>
            <TableCell className='bg-muted/30 py-4 font-semibold'>Repeat *</TableCell>
            <TableCell className='bg-card py-4'>
              <div className='space-y-4'>
                <div className='flex flex-wrap items-end gap-3'>
                  <label className='text-foreground text-sm font-semibold'>Repeat every:</label>
                  <Input
                    type='number'
                    min={1}
                    value={data.repeat.interval || 1}
                    onChange={e =>
                      onChange({
                        repeat: {
                          ...data.repeat,
                          interval: parseInt(e.target.value, 10) || 1,
                        },
                      })
                    }
                    className='w-20'
                  />
                  <Select
                    value={data.repeat.unit || 'week'}
                    onValueChange={value =>
                      onChange({
                        repeat: {
                          ...data.repeat,
                          unit: value as 'day' | 'week' | 'month' | 'year',
                        },
                      })
                    }
                  >
                    <SelectTrigger className='w-40'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='day'>Day</SelectItem>
                      <SelectItem value='week'>Week</SelectItem>
                      <SelectItem value='month'>Month</SelectItem>
                      <SelectItem value='year'>Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {data.repeat.unit === 'week' && (
                  <div className='space-y-3'>
                    <label className='text-foreground text-sm font-semibold'>Select days:</label>
                    <div className='flex flex-wrap gap-2'>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                        <label
                          key={day}
                          className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 transition-all select-none',
                            data.repeat.days?.includes(idx)
                              ? 'bg-primary/10 border-primary text-primary font-medium'
                              : 'border-border hover:bg-muted'
                          )}
                        >
                          <input
                            type='checkbox'
                            checked={data.repeat.days?.includes(idx) || false}
                            onChange={e => {
                              const days = new Set(data.repeat.days || []);
                              if (e.target.checked) days.add(idx);
                              else days.delete(idx);
                              onChange({
                                repeat: {
                                  ...data.repeat,
                                  days: Array.from(days).sort(),
                                },
                              });
                            }}
                            className='h-4 w-4 rounded'
                          />
                          <span className='text-sm font-medium'>{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className='text-muted-foreground bg-muted/30 rounded-lg px-4 py-3 text-sm'>
                  {displaySummary}
                </div>
              </div>
            </TableCell>
          </TableRow>

          {/* End Repeat */}
          <TableRow className='hover:bg-transparent'>
            <TableCell className='bg-muted/30 py-4 font-semibold'>End Repeat *</TableCell>
            <TableCell className='bg-card py-4'>
              <div className='space-y-3'>
                <div className='flex items-end gap-3'>
                  <div className='flex flex-col gap-2'>
                    <label className='text-muted-foreground text-xs font-semibold'>On date:</label>
                    <Input
                      type='date'
                      value={data.endRepeat}
                      onChange={e => onChange({ endRepeat: e.target.value })}
                      className='w-44'
                      required
                    />
                  </div>
                </div>
                {occurrenceCount > 0 && (
                  <div className='bg-primary/10 text-primary border-primary/20 rounded-lg border px-4 py-2.5 text-sm font-medium'>
                    Total occurrences: <span className='font-bold'>{occurrenceCount}</span>
                  </div>
                )}
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  );
};
