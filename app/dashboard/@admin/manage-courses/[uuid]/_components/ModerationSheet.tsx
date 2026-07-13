'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';

export type ModerationSheetAction = 'reject' | 'revoke';

const COPY: Record<
  ModerationSheetAction,
  { title: string; description: string; confirm: string; placeholder: string }
> = {
  reject: {
    title: 'Reject course',
    description:
      'The course creator will be notified with your reason and the decision is recorded in the moderation history.',
    confirm: 'Reject course',
    placeholder: 'Explain what needs to change before this course can be approved…',
  },
  revoke: {
    title: 'Revoke approval',
    description:
      'The course will no longer accept new enrollments. The creator is notified and the decision is recorded.',
    confirm: 'Revoke approval',
    placeholder: 'Reason for revoking the approval…',
  },
};

export function ModerationSheet({
  action,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  action: ModerationSheetAction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState('');
  const copy = COPY[action];

  return (
    <Sheet
      open={open}
      onOpenChange={next => {
        if (!next) setReason('');
        onOpenChange(next);
      }}
    >
      <SheetContent side='right' className='flex w-full flex-col sm:max-w-md'>
        <SheetHeader className='text-left'>
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
        </SheetHeader>
        <div className='flex-1 px-4'>
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder={copy.placeholder}
            className='min-h-32 rounded-md'
          />
        </div>
        <SheetFooter>
          <Button
            variant='destructive'
            onClick={() => onConfirm(reason.trim() || undefined)}
            disabled={isPending}
          >
            {copy.confirm}
          </Button>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
