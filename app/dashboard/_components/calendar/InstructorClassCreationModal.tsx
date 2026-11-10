'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { CalendarClassSlot } from '@/lib/calendar-class-slot';

const InstructorClassCreationForm = dynamic(
  () => import('@/app/dashboard/instructor/classes/new/_components/InstructorClassCreationForm'),
  { loading: () => <Skeleton className='h-96 w-full rounded-md' />, ssr: false }
);

export function InstructorClassCreationModal({
  slot,
  timeZone,
  onClose,
  onCreated,
}: {
  slot: { startTime: Date; endTime: Date };
  timeZone: string;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const initialSlot = useMemo<CalendarClassSlot>(
    () => ({ startTime: slot.startTime, endTime: slot.endTime, timeZone }),
    [slot.startTime, slot.endTime, timeZone]
  );
  const close = () => {
    if (!submitting) onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open) close();
      }}
    >
      <DialogContent
        className='flex max-h-[95dvh] flex-col overflow-hidden p-0 sm:max-w-6xl'
        onInteractOutside={event => event.preventDefault()}
        onEscapeKeyDown={event => {
          if (submitting) event.preventDefault();
        }}
      >
        <DialogHeader className='shrink-0 border-b px-5 py-4 pr-12'>
          <DialogTitle>Create a class</DialogTitle>
          <DialogDescription>
            Your selected time is filled in. Choose an approved course or program and add more days
            in the scheduler.
          </DialogDescription>
        </DialogHeader>
        <div className='min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6'>
          <InstructorClassCreationForm
            mode='modal'
            initialSlot={initialSlot}
            onCancel={close}
            onSubmittingChange={setSubmitting}
            onCreated={() => {
              onCreated?.();
              onClose();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
