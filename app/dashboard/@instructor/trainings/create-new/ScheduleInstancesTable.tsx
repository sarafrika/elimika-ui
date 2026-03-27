'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, X } from 'lucide-react';
import { calculateSessionHours, formatSessionDate, ScheduledSessionInstance } from './schedule-utils';

interface ScheduleInstancesTableProps {
  sessions: ScheduledSessionInstance[];
  title: string;
  totalHoursLabel?: string;
  emptyMessage?: string;
  editable?: boolean;
  editingIndex?: number | null;
  editStartTime?: string;
  editEndTime?: string;
  onStartTimeChange?: (value: string) => void;
  onEndTimeChange?: (value: string) => void;
  onEdit?: (index: number) => void;
  onSave?: (index: number) => void;
  onCancel?: () => void;
  onRemove?: (index: number) => void;
}

export const ScheduleInstancesTable = ({
  sessions,
  title,
  totalHoursLabel,
  emptyMessage = 'No scheduled instances yet.',
  editable = false,
  editingIndex = null,
  editStartTime = '',
  editEndTime = '',
  onStartTimeChange,
  onEndTimeChange,
  onEdit,
  onSave,
  onCancel,
  onRemove,
}: ScheduleInstancesTableProps) => {
  if (sessions.length === 0) {
    return (
      <div className='text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-sm'>
        {emptyMessage}
      </div>
    );
  }

  const totalHours = sessions.reduce((sum, session) => sum + session.hours, 0);

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between gap-4'>
        <h5 className='text-sm font-semibold'>{title}</h5>
        <div className='text-muted-foreground text-sm'>
          {totalHoursLabel ?? `Total: ${totalHours.toFixed(1)} hours`}
        </div>
      </div>

      <div className='overflow-hidden rounded-lg border'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-muted/50'>
              <tr className='border-b'>
                <th className='p-3 text-left text-sm font-medium'>Date</th>
                <th className='p-3 text-left text-sm font-medium'>Start Time</th>
                <th className='p-3 text-left text-sm font-medium'>End Time</th>
                <th className='p-3 text-left text-sm font-medium'>Hours</th>
                {editable && <th className='p-3 text-left text-sm font-medium'>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sessions.map((session, index) => (
                <tr
                  key={`${session.date}-${index}`}
                  className='hover:bg-muted/30 border-b last:border-0'
                >
                  <td className='p-3 font-medium'>{formatSessionDate(session.date)}</td>
                  <td className='p-3'>
                    {editable && editingIndex === index ? (
                      <Input
                        type='time'
                        value={editStartTime}
                        onChange={event => onStartTimeChange?.(event.target.value)}
                        className='w-full'
                      />
                    ) : (
                      session.startTime
                    )}
                  </td>
                  <td className='p-3'>
                    {editable && editingIndex === index ? (
                      <Input
                        type='time'
                        value={editEndTime}
                        onChange={event => onEndTimeChange?.(event.target.value)}
                        className='w-full'
                      />
                    ) : (
                      session.endTime
                    )}
                  </td>
                  <td className='p-3'>
                    {editable && editingIndex === index
                      ? calculateSessionHours(editStartTime, editEndTime).toFixed(1)
                      : session.hours.toFixed(1)}
                  </td>
                  {editable && (
                    <td className='p-3'>
                      <div className='flex gap-2'>
                        {editingIndex === index ? (
                          <>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => onSave?.(index)}
                              className='h-8 w-8 p-0'
                            >
                              ✓
                            </Button>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => onCancel?.()}
                              className='h-8 w-8 p-0'
                            >
                              ✕
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => onEdit?.(index)}
                              className='h-8 w-8 p-0'
                            >
                              <Edit2 className='h-4 w-4' />
                            </Button>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => onRemove?.(index)}
                              className='text-destructive hover:text-destructive h-8 w-8 p-0'
                            >
                              <X className='h-4 w-4' />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
