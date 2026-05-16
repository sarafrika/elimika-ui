'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
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
  getConflictMessage?: (session: ScheduledSessionInstance) => string | null;
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
  getConflictMessage,
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
      <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
        <h5 className='text-sm font-semibold'>{title}</h5>
        <div className='text-muted-foreground text-sm'>
          {totalHoursLabel ?? `Total: ${totalHours.toFixed(1)} hours`}
        </div>
      </div>

      <div className='space-y-3 md:hidden'>
        {sessions.map((session, index) => (
          <div
            key={`${session.date}-${index}`}
            className={cn(
              'rounded-lg border bg-card p-3',
              getConflictMessage?.(session) && 'border-destructive/40 bg-destructive/5'
            )}
          >
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <p className='text-sm font-semibold text-foreground'>
                  {formatSessionDate(session.date)}
                </p>
                {getConflictMessage?.(session) ? (
                  <Badge variant='destructive' className='mt-1'>
                    Conflict
                  </Badge>
                ) : null}
              </div>
              <div className='shrink-0 text-right text-sm text-muted-foreground'>
                <div>{session.hours.toFixed(1)} hrs</div>
              </div>
            </div>

            <div className='mt-3 grid grid-cols-2 gap-3 text-sm'>
              <div className='space-y-1'>
                <div className='text-muted-foreground text-xs font-medium uppercase tracking-wide'>
                  Start
                </div>
                {editable && editingIndex === index ? (
                  <Input
                    type='time'
                    value={editStartTime}
                    onChange={event => onStartTimeChange?.(event.target.value)}
                    className='w-full'
                  />
                ) : (
                  <div className='break-words'>{session.startTime}</div>
                )}
              </div>

              <div className='space-y-1'>
                <div className='text-muted-foreground text-xs font-medium uppercase tracking-wide'>
                  End
                </div>
                {editable && editingIndex === index ? (
                  <Input
                    type='time'
                    value={editEndTime}
                    onChange={event => onEndTimeChange?.(event.target.value)}
                    className='w-full'
                  />
                ) : (
                  <div className='break-words'>{session.endTime}</div>
                )}
              </div>
            </div>

            {editable ? (
              <div className='mt-3 flex flex-col gap-2'>
                {editingIndex === index ? (
                  <>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => onSave?.(index)}
                      className='h-9 w-full justify-center px-3'
                    >
                      Save
                    </Button>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => onCancel?.()}
                      className='h-9 w-full justify-center px-3'
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => onEdit?.(index)}
                      className='h-9 w-full justify-center px-3'
                    >
                      <Edit2 className='h-4 w-4' />
                      Edit
                    </Button>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => onRemove?.(index)}
                      className='text-destructive hover:text-destructive h-9 w-full justify-center px-3'
                    >
                      <X className='h-4 w-4' />
                      Remove
                    </Button>
                  </>
                )}
              </div>
            ) : null}

            {getConflictMessage?.(session) ? (
              <p className='text-destructive mt-3 text-xs'>{getConflictMessage(session)}</p>
            ) : null}
          </div>
        ))}
      </div>

      <div className='hidden overflow-hidden rounded-lg border md:block'>
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
                  className={cn(
                    'border-b last:border-0 hover:bg-muted/30',
                    getConflictMessage?.(session) && 'bg-destructive/5'
                  )}
                >
                  <td className='p-3 font-medium'>
                    <div className='space-y-1'>
                      <div>{formatSessionDate(session.date)}</div>
                      {getConflictMessage?.(session) && (
                        <Badge variant='destructive'>Conflict</Badge>
                      )}
                    </div>
                  </td>
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
                    <div className='space-y-1'>
                      <div>
                        {editable && editingIndex === index
                          ? calculateSessionHours(editStartTime, editEndTime).toFixed(1)
                          : session.hours.toFixed(1)}
                      </div>
                      {getConflictMessage?.(session) && (
                        <p className='text-destructive text-xs'>{getConflictMessage(session)}</p>
                      )}
                    </div>
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
