'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

type DayScheduleValue = {
  active?: boolean;
  start?: string;
  end?: string;
  allDay?: boolean;
};

export type CreateClassPrefill = {
  category?: string;
  subject?: string;
  courseId?: string;
  startDate?: string;
  endDate?: string;
  days?: Partial<Record<string, Partial<DayScheduleValue>>>;
  instructorId?: string;
  service?: string;
  location?: string;
  classroom?: string;
  // Populated by SchedulerGrid when the dialog is opened from an empty
  // day/week slot click.
  date?: Date;
  startTime?: Date;
  endTime?: Date;
};

function formatSlotSummary(prefill?: CreateClassPrefill | null) {
  if (!prefill?.date) return null;

  const dateLabel = prefill.date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (!prefill.startTime || !prefill.endTime) return dateLabel;

  const timeLabel = `${prefill.startTime.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })} – ${prefill.endTime.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })}`;

  return `${dateLabel} · ${timeLabel}`;
}

export function CreateClassDialog({
  open,
  onOpenChange,
  onCreated,
  prefill,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (payload: unknown) => void;
  prefill?: CreateClassPrefill | null;
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  // Reset the form each time the dialog is opened for a new slot.
  useEffect(() => {
    if (!open) return;
    setName('');
    setCode('');
    setDescription('');
  }, [open, prefill]);

  const slotSummary = formatSlotSummary(prefill);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onCreated?.({
      name,
      code,
      description,
      ...prefill,
    });

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex h-full max-h-[100dvh] w-full max-w-[100vw] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90dvh] sm:w-auto sm:max-w-lg sm:rounded-lg'>
        <DialogHeader className='shrink-0 border-b px-4 pt-4 pb-3 sm:px-6 sm:pt-5'>
          <DialogTitle className='text-lg leading-tight font-semibold sm:text-xl'>
            Create a class
          </DialogTitle>
          <DialogDescription>Fill in the details below to create a new class.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-1 flex-col overflow-hidden'>
          <div className='flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6'>
            {slotSummary && (
              <div className='bg-muted/40 rounded-md border p-3 text-sm'>
                <p className='font-medium'>Scheduled for</p>
                <p className='text-muted-foreground'>{slotSummary}</p>
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='name'>Class Name</Label>
              <Input
                id='name'
                name='name'
                placeholder='e.g. Mathematics 101'
                value={name}
                onChange={event => setName(event.target.value)}
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='code'>Class Code</Label>
              <Input
                id='code'
                name='code'
                placeholder='e.g. MTH101'
                value={code}
                onChange={event => setCode(event.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                name='description'
                placeholder='Brief description of the class...'
                rows={4}
                value={description}
                onChange={event => setDescription(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter className='shrink-0 border-t px-4 py-3 sm:px-6'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit'>Create Class</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
