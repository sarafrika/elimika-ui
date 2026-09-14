'use client';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import type { Enrollment } from '@/services/client/types.gen';

export type AttendanceRow = { enrollment: Enrollment; name: string };

export function AttendanceDialog({
  open,
  onOpenChange,
  roster,
  sessionTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roster: AttendanceRow[];
  sessionTitle: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Class attendance</DialogTitle>
          <DialogDescription>{sessionTitle}</DialogDescription>
        </DialogHeader>
        <div className='max-h-96 space-y-2 overflow-y-auto'>
          {!roster.length && <EmptyState title='No enrollments for this session' />}
          {roster.map(({ enrollment, name }) => (
            <div
              key={enrollment.uuid}
              className='border-border flex items-center justify-between gap-3 rounded-lg border p-3'
            >
              <p className='text-sm font-medium'>{name}</p>
              <Badge variant='secondary'>
                {enrollment.status_description ?? enrollment.status ?? 'Not marked'}
              </Badge>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
