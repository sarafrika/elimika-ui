'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '../../../../../lib/utils';
import { ScheduleSettings } from './page';
import {
  calculateSessionHours,
  formatSessionDate,
  generateScheduleInstances,
  ScheduledSessionInstance,
  ScheduleMode,
} from './schedule-utils';
import { ScheduleInstancesTable } from './ScheduleInstancesTable';

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const ScheduleSection = ({
  data,
  onChange,
  occurrenceCount,
  scheduleMode,
  onScheduleModeChange,
  customSessions,
  onCustomSessionsChange,
  classScheduleConflicts,
  customScheduleConflicts,
  activeScheduleConflicts,
}: {
  data: ScheduleSettings;
  onChange: (updates: Partial<ScheduleSettings>) => void;
  occurrenceCount: number;
  scheduleMode: ScheduleMode;
  onScheduleModeChange: (value: ScheduleMode) => void;
  customSessions: ScheduledSessionInstance[];
  onCustomSessionsChange: (sessions: ScheduledSessionInstance[]) => void;
  classScheduleConflicts: Array<{
    proposed: ScheduledSessionInstance;
    existing: {
      classTitle: string;
      startTime: string;
      endTime: string;
    };
  }>;
  customScheduleConflicts: Array<{
    proposed: ScheduledSessionInstance;
    existing: {
      classTitle: string;
      startTime: string;
      endTime: string;
    };
  }>;
  activeScheduleConflicts: Array<{
    proposed: ScheduledSessionInstance;
    existing: {
      classTitle: string;
      startTime: string;
      endTime: string;
    };
  }>;
}) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [defaultStartTime, setDefaultStartTime] = useState('09:00');
  const [defaultEndTime, setDefaultEndTime] = useState('17:00');
  const [allDay, setAllDay] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  const displaySummary = useMemo(() => {
    if (data.repeat.unit === 'week' && data.repeat.days?.length) {
      return `Repeats on: ${data.repeat.days.map(d => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d]).join(', ')}`;
    }
    return `Repeats every ${data.repeat.interval} ${data.repeat.unit}(s)`;
  }, [data.repeat.unit, data.repeat.interval, data.repeat.days]);

  const scheduleInstances = useMemo(() => generateScheduleInstances(data), [data]);
  const getConflictMessage = (
    session: ScheduledSessionInstance,
    conflicts: typeof activeScheduleConflicts
  ) => {
    const conflict = conflicts.find(
      item =>
        item.proposed.date === session.date &&
        item.proposed.startTime === session.startTime &&
        item.proposed.endTime === session.endTime
    );

    if (!conflict) {
      return null;
    }

    return `Conflicts with ${conflict.existing.classTitle}`;
  };

  useEffect(() => {
    setSelectedDates(customSessions.map(session => new Date(`${session.date}T00:00:00`)));
  }, [customSessions]);

  const syncSessionsForDates = (dates: Date[]) => {
    const nextSessions = dates.map(date => {
      const dateKey = toDateKey(date);
      const existingSession = customSessions.find(session => session.date === dateKey);

      if (existingSession) {
        return existingSession;
      }

      const startTime = allDay ? '00:00' : defaultStartTime;
      const endTime = allDay ? '23:59' : defaultEndTime;

      return {
        date: dateKey,
        startTime,
        endTime,
        hours: allDay ? 24 : calculateSessionHours(startTime, endTime),
      };
    });

    onCustomSessionsChange(nextSessions);
  };

  const handleDateSelect = (dates: Date[] | undefined) => {
    const nextDates = dates ?? [];
    setSelectedDates(nextDates);
    syncSessionsForDates(nextDates);
  };

  const updateAllCustomSessionTimes = (startTime: string, endTime: string, nextAllDay: boolean) => {
    if (customSessions.length === 0) {
      return;
    }

    onCustomSessionsChange(
      customSessions.map(session => ({
        ...session,
        startTime: nextAllDay ? '00:00' : startTime,
        endTime: nextAllDay ? '23:59' : endTime,
        hours: nextAllDay ? 24 : calculateSessionHours(startTime, endTime),
      }))
    );
  };

  const handleDefaultStartTimeChange = (value: string) => {
    setDefaultStartTime(value);
    updateAllCustomSessionTimes(value, defaultEndTime, allDay);
  };

  const handleDefaultEndTimeChange = (value: string) => {
    setDefaultEndTime(value);
    updateAllCustomSessionTimes(defaultStartTime, value, allDay);
  };

  const handleAllDayChange = (checked: boolean) => {
    setAllDay(checked);
    updateAllCustomSessionTimes(defaultStartTime, defaultEndTime, checked);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditStartTime(customSessions[index].startTime);
    setEditEndTime(customSessions[index].endTime);
  };

  const handleSaveEdit = (index: number) => {
    const nextSessions = [...customSessions];
    nextSessions[index] = {
      ...nextSessions[index],
      startTime: editStartTime,
      endTime: editEndTime,
      hours: calculateSessionHours(editStartTime, editEndTime),
    };

    onCustomSessionsChange(nextSessions);
    setEditingIndex(null);
    setEditStartTime('');
    setEditEndTime('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditStartTime('');
    setEditEndTime('');
  };

  const handleRemoveSession = (index: number) => {
    const nextSessions = [...customSessions];
    nextSessions.splice(index, 1);
    onCustomSessionsChange(nextSessions);
    setEditingIndex(null);
  };

  return (
    <Card className='overflow-hidden border pt-0 shadow-sm'>
      <div className='bg-muted/50 border-b px-6 py-4'>
        <h3 className='text-foreground text-lg font-semibold'>Class Schedule</h3>
      </div>

      <div className='border-b px-6 py-5'>
        <div className='space-y-4'>
          <div>
            <p className='text-sm font-semibold'>Which schedule should be used?</p>
            <p className='text-muted-foreground text-sm'>
              Choose between the recurring class schedule and a custom schedule with manually
              selected session dates.
            </p>
          </div>

          <RadioGroup
            value={scheduleMode}
            onValueChange={value => onScheduleModeChange(value as ScheduleMode)}
            className='grid gap-3 md:grid-cols-2'
          >
            <Label
              htmlFor='schedule-mode-class'
              className='border-border has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 flex cursor-pointer items-start gap-3 rounded-xl border p-4'
            >
              <RadioGroupItem id='schedule-mode-class' value='class' className='mt-0.5' />
              <div className='flex flex-col'>
                <span className='text-sm font-semibold'>Use class schedule</span>
                <span className='text-muted-foreground text-[12px]'>
                  Default recurring setup driven by start date, repeat rule, and end date.
                </span>
              </div>
            </Label>

            <Label
              htmlFor='schedule-mode-custom'
              className='border-border has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 flex cursor-pointer items-start gap-3 rounded-xl border p-4'
            >
              <RadioGroupItem id='schedule-mode-custom' value='custom' className='mt-0.5' />
              <div className='flex flex-col'>
                <span className='text-sm font-semibold'>Use custom schedule</span>
                <span className='text-muted-foreground text-[12px]'>
                  Use the manually selected date instances from the custom scheduler.
                </span>
              </div>
            </Label>
          </RadioGroup>
        </div>
      </div>

      {activeScheduleConflicts.length > 0 && (
        <div className='border-b px-6 py-5'>
          <Alert variant='destructive'>
            <AlertTitle>Schedule conflict detected</AlertTitle>
            <AlertDescription>
              <p>
                One or more selected sessions overlap with this instructor&apos;s existing class
                schedule. Adjust the times below before publishing.
              </p>
              <ul className='list-disc space-y-1 pl-5'>
                {activeScheduleConflicts.slice(0, 5).map(conflict => (
                  <li
                    key={`${conflict.proposed.date}-${conflict.proposed.startTime}-${conflict.existing.classTitle}-${conflict.existing.startTime}`}
                  >
                    {formatSessionDate(conflict.proposed.date)} {conflict.proposed.startTime} -{' '}
                    {conflict.proposed.endTime} overlaps with {conflict.existing.classTitle} (
                    {new Date(conflict.existing.startTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(conflict.existing.endTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    ).
                  </li>
                ))}
                {activeScheduleConflicts.length > 5 && (
                  <li>{activeScheduleConflicts.length - 5} more conflict(s) not shown.</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {scheduleMode === 'class' ? (
        <>
          <Table>
            <TableBody>
              <TableRow className='border-b hover:bg-transparent'>
                <TableCell className='bg-muted/30 w-1/3 py-4 font-semibold'>
                  Academic Period
                </TableCell>
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

              <TableRow className='border-b hover:bg-transparent'>
                <TableCell className='bg-muted/30 py-4 font-semibold'>
                  Registration Period
                </TableCell>
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
                        <label className='text-muted-foreground text-xs font-semibold'>
                          End Date
                        </label>
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

              <TableRow className='border-b hover:bg-transparent'>
                <TableCell className='bg-muted/30 py-4 font-semibold'>Start Classes *</TableCell>
                <TableCell className='bg-card py-4'>
                  <div className='space-y-3'>
                    <div className='flex flex-col gap-4 sm:flex-row sm:items-end'>
                      <div className='flex flex-col gap-2'>
                        <label className='text-muted-foreground text-xs font-semibold'>
                          Class Day
                        </label>
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
                        <label className='text-muted-foreground text-xs font-semibold'>
                          End Time
                        </label>
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

              <TableRow className='border-b hover:bg-transparent'>
                <TableCell className='bg-muted/30 py-4 font-semibold'>Repeat *</TableCell>
                <TableCell className='bg-card py-4'>
                  <div className='space-y-4'>
                    <div className='flex flex-wrap items-end gap-3'>
                      <label className='text-foreground text-sm font-semibold'>
                        Repeat every:
                      </label>
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
                        <label className='text-foreground text-sm font-semibold'>
                          Select days:
                        </label>
                        <div className='flex flex-wrap gap-2'>
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                            <label
                              key={day}
                              className={cn(
                                'flex cursor-pointer select-none items-center gap-2 rounded-lg border px-4 py-2.5 transition-all',
                                data.repeat.days?.includes(idx)
                                  ? 'border-primary bg-primary/10 text-primary font-medium'
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

              <TableRow className='hover:bg-transparent'>
                <TableCell className='bg-muted/30 py-4 font-semibold'>End Repeat *</TableCell>
                <TableCell className='bg-card py-4'>
                  <div className='space-y-3'>
                    <div className='flex items-end gap-3'>
                      <div className='flex flex-col gap-2'>
                        <label className='text-muted-foreground text-xs font-semibold'>
                          On date:
                        </label>
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

          <div className='border-t p-6'>
            <div className='bg-muted/30 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3'>
              <div>
                <p className='text-sm font-semibold'>Generated class schedule instances</p>
                <p className='text-muted-foreground text-sm'>
                  This list previews the exact sessions that will be created from the recurring
                  schedule.
                </p>
              </div>
              <div className='text-sm font-medium'>Currently selected</div>
            </div>

            <ScheduleInstancesTable
              sessions={scheduleInstances}
              title={`Class Schedule Instances (${scheduleInstances.length})`}
              emptyMessage='Complete the recurring schedule fields to preview generated class instances.'
              getConflictMessage={session =>
                getConflictMessage(session, classScheduleConflicts)
              }
            />
          </div>
        </>
      ) : (
        <div className='border-t p-6'>
          <div className='bg-muted/30 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3'>
            <div>
              <p className='text-sm font-semibold'>Custom schedule sessions</p>
              <p className='text-muted-foreground text-sm'>
                Select exact dates for one-off sessions and adjust the session times as needed.
              </p>
            </div>
            <div className='text-sm font-medium'>Currently selected</div>
          </div>

          <div className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <div className='space-y-4'>
                <div>
                  <label className='mb-2 block text-sm font-medium'>Default Start Time</label>
                  <Input
                    type='time'
                    value={defaultStartTime}
                    onChange={e => handleDefaultStartTimeChange(e.target.value)}
                    disabled={allDay}
                    className='w-full'
                  />
                </div>
                <div>
                  <label className='mb-2 block text-sm font-medium'>Default End Time</label>
                  <Input
                    type='time'
                    value={defaultEndTime}
                    onChange={e => handleDefaultEndTimeChange(e.target.value)}
                    disabled={allDay}
                    className='w-full'
                  />
                </div>
                <label className='flex cursor-pointer items-center gap-3'>
                  <input
                    type='checkbox'
                    checked={allDay}
                    onChange={e => handleAllDayChange(e.target.checked)}
                    className='h-4 w-4 rounded'
                  />
                  <span className='text-sm font-medium'>All Day</span>
                </label>
                <div className='text-muted-foreground text-sm'>
                  Duration: {allDay ? '24' : calculateSessionHours(defaultStartTime, defaultEndTime).toFixed(1)} hours
                </div>
              </div>

              <div>
                <label className='mb-2 block text-sm font-medium'>Select Dates</label>
                <Calendar
                  mode='multiple'
                  selected={selectedDates}
                  onSelect={handleDateSelect}
                  className='rounded-md border'
                />
              </div>
            </div>

            <ScheduleInstancesTable
              sessions={customSessions}
              title={`Custom Schedule Sessions (${customSessions.length})`}
              emptyMessage='Select one or more dates to build the custom schedule.'
              editable
              editingIndex={editingIndex}
              editStartTime={editStartTime}
              editEndTime={editEndTime}
              onStartTimeChange={setEditStartTime}
              onEndTimeChange={setEditEndTime}
              onEdit={handleEdit}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
              onRemove={handleRemoveSession}
              getConflictMessage={session =>
                getConflictMessage(session, customScheduleConflicts)
              }
            />
          </div>
        </div>
      )}
    </Card>
  );
};
