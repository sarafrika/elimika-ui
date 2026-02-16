'use client';

import { Button } from '@/components/ui/button';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormEvent } from 'react';
import { toast } from 'sonner';
import { useInstructor } from '../../../../../context/instructor-context';
import { cn } from '../../../../../lib/utils';
import {
  createClassDefinitionMutation,
  getClassDefinitionQueryKey,
  getClassDefinitionsForInstructorQueryKey,
  updateClassDefinitionMutation,
} from '../../../../../services/client/@tanstack/react-query.gen';
import { ScheduleSettings } from './page';

const DAY_NAMES = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const RECURRENCE_TYPE_MAP: Record<string, string> = {
  day: 'DAILY',
  week: 'WEEKLY',
  month: 'MONTHLY',
  year: 'YEARLY',
};

export const ClassScheduleFormPage = ({
  data,
  resolvedId,
  classDetails,
  onChange,
  onClassCreated,
  onNext,
}: {
  data: ScheduleSettings;
  resolvedId: string;
  classDetails: any;
  onChange: (updates: Partial<ScheduleSettings>) => void;
  onClassCreated: (uuid: string) => void;
  onNext: () => void;
}) => {
  const qc = useQueryClient();
  const instructor = useInstructor();
  const createClassDefinition = useMutation(createClassDefinitionMutation());
  const updateClassDefinition = useMutation(updateClassDefinitionMutation());

  const isFormValid = () => {
    // ✅ Must have either program_uuid OR course_uuid
    if (!classDetails?.program_uuid && !classDetails?.course_uuid) {
      toast.error('Please select either a Program or a Course');
      return false;
    }

    // ✅ Optional: prevent both at the same time (if that's a rule)
    if (classDetails?.program_uuid && classDetails?.course_uuid) {
      toast.error('Please select only one: Program or Course');
      return false;
    }

    // ✅ Schedule validation
    if (!data.startClass.date || !data.startClass.startTime || !data.startClass.endTime) {
      toast.error('Please fill in all schedule fields');
      return false;
    }

    // ✅ Weekly repeat validation
    if (data.repeat.unit === 'week' && (!data.repeat.days || data.repeat.days.length === 0)) {
      toast.error('Please select at least one day of the week');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isFormValid()) return;

    try {
      const start_time = new Date(
        `${data.startClass.date}T${data.startClass.startTime}:00Z`
      ).toISOString();
      const end_time = new Date(
        `${data.startClass.date}T${data.startClass.endTime}:00Z`
      ).toISOString();

      const selectedDays = data.repeat.days || [];
      const days_of_week = selectedDays
        .sort()
        .map(dayIndex => DAY_NAMES[dayIndex])
        .join(',');

      const payload = {
        course_uuid: classDetails.course_uuid,
        title: classDetails.title,
        description: '',
        default_instructor_uuid: instructor?.uuid as string,
        class_visibility: 'PUBLIC',
        session_format: 'GROUP',
        location_type: classDetails.location_type,
        location_name: classDetails.location_name,
        location_latitude: -1.292066,
        location_longitude: 36.821945,
        max_participants: classDetails.class_limit,
        allow_waitlist: true,
        is_active: true,
        default_start_time: start_time,
        default_end_time: end_time,
        session_templates: [
          {
            start_time: start_time,
            end_time: end_time,
            recurrence: {
              recurrence_type: RECURRENCE_TYPE_MAP[data.repeat.unit],
              interval_value: data.repeat.interval,
              days_of_week: days_of_week || undefined,
              occurrence_count: 8,
            },
            conflict_resolution: 'FAIL',
          },
        ],
      };

      if (resolvedId) {
        updateClassDefinition.mutate(
          { path: { uuid: resolvedId }, body: payload as any },
          {
            onSuccess: response => {
              qc.invalidateQueries({
                queryKey: getClassDefinitionsForInstructorQueryKey({
                  path: { instructorUuid: instructor?.uuid as string },
                }),
              });

              qc.invalidateQueries({
                queryKey: getClassDefinitionQueryKey({
                  path: { uuid: resolvedId },
                }),
              });

              toast.success(response?.message || 'Class updated successfully');
              onNext();
            },
            onError: (error: any) => {
              toast.error(error?.message || 'Failed to update class');
            },
          }
        );
      } else {
        createClassDefinition.mutate(
          { body: payload as any },
          {
            onSuccess: response => {
              const savedUuid = response?.data?.class_definition?.uuid;

              if (savedUuid) {
                onClassCreated(savedUuid);
              }

              qc.invalidateQueries({
                queryKey: getClassDefinitionsForInstructorQueryKey({
                  path: { instructorUuid: instructor?.uuid as string },
                }),
              });

              toast.success(response?.message || 'Class created successfully');
              onNext();
            },
            onError: (error: any) => {
              toast.error(error?.message || 'Failed to create class');
            },
          }
        );
      }
    } catch (error) {
      toast.error('An error occurred while processing your request');
    }
  };

  return (
    <div className='mx-auto max-w-5xl'>
      <div className='mb-8'>
        <h2 className='text-foreground mb-2 text-xl font-bold'>Class Schedule</h2>
        <p className='text-muted-foreground'>Set up your class schedule and recurrence</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className='overflow-hidden rounded-xl shadow-lg'>
          <Table>
            <TableBody>
              {/* Academic Period */}
              <TableRow className='border-b hover:bg-transparent'>
                <TableCell className='bg-muted/50 w-1/3 py-5 font-semibold'>
                  Academic Period
                </TableCell>
                <TableCell className='bg-card py-5'>
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
                <TableCell className='bg-muted/50 py-5 font-semibold'>
                  Registration Period
                </TableCell>
                <TableCell className='bg-card py-5'>
                  <div className='space-y-4'>
                    <div className='flex flex-wrap items-end gap-4'>
                      <div className='flex flex-col gap-2'>
                        <label className='text-foreground text-sm font-semibold'>Start Date</label>
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
                        <label className='text-foreground text-sm font-semibold'>End Date</label>
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
                <TableCell className='bg-muted/50 py-5 font-semibold'>Start Classes *</TableCell>
                <TableCell className='bg-card py-5'>
                  <div className='space-y-4'>
                    <div className='flex flex-col gap-4 sm:flex-row sm:items-end'>
                      <div className='flex flex-col gap-2'>
                        <label className='text-foreground text-sm font-semibold'>Class Day</label>
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
                        <label className='text-foreground text-sm font-semibold'>Start Time</label>
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
                        <label className='text-foreground text-sm font-semibold'>End Time</label>
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

              {/* Class Schedule */}
              <TableRow className='border-b hover:bg-transparent'>
                <TableCell className='bg-muted/50 py-5 font-semibold'>Classes Schedule *</TableCell>
                <TableCell className='bg-card py-5'>
                  <div className='space-y-4'>
                    {/* Repeat Frequency */}
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

                    {/* Weekly: Select Days */}
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

                    {/* Display selected summary */}
                    <div className='text-muted-foreground bg-muted/30 rounded-lg px-4 py-3 text-sm'>
                      {data.repeat.unit === 'week' && data.repeat.days?.length
                        ? `Repeats on: ${data.repeat.days.map(d => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d]).join(', ')}`
                        : `Repeats every ${data.repeat.interval || 1} ${data.repeat.unit}(s)`}
                    </div>
                  </div>
                </TableCell>
              </TableRow>

              {/* End Repeat */}
              <TableRow className='border-b hover:bg-transparent'>
                <TableCell className='bg-muted/50 py-5 font-semibold'>End Repeat</TableCell>
                <TableCell className='bg-card py-5'>
                  <div className='flex items-end gap-3'>
                    <label className='text-foreground text-sm font-semibold'>On date:</label>
                    <Input
                      type='date'
                      value={data.endRepeat}
                      onChange={e => onChange({ endRepeat: e.target.value })}
                      className='w-44'
                    />
                  </div>
                </TableCell>
              </TableRow>

              {/* Alert Attendee */}
              <TableRow className='hover:bg-transparent'>
                <TableCell className='bg-muted/50 py-5 font-semibold'>Alert Attendee</TableCell>
                <TableCell className='bg-card py-5'>
                  <label className='text-foreground flex w-fit cursor-pointer items-center gap-3 text-sm font-medium'>
                    <input
                      type='checkbox'
                      checked={data.alertAttendee}
                      onChange={e => onChange({ alertAttendee: e.target.checked })}
                      className='h-4 w-4 rounded'
                    />
                    Send notifications to attendees
                  </label>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>

        <div className='mt-8 flex justify-end'>
          <Button
            type='submit'
            disabled={createClassDefinition.isPending || updateClassDefinition.isPending}
            size='lg'
            className='px-8'
          >
            {createClassDefinition.isPending || updateClassDefinition.isPending
              ? 'Saving...'
              : 'Save & Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
};
