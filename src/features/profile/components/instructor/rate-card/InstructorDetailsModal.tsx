'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface InstructorDetailsModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  instructor: any | null;
}

export default function InstructorDetailsModal({
  open,
  setOpen,
  instructor,
}: InstructorDetailsModalProps) {
  if (!instructor) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Instructor Details</DialogTitle>
          <DialogDescription>Information about the instructor who applied.</DialogDescription>
        </DialogHeader>

        <div className='space-y-3 py-2'>
          <div>
            <p className='text-muted-foreground text-sm font-medium'>Instructor UUID</p>
            <p className='font-mono text-sm'>{instructor.applicant_uuid}</p>
          </div>

          <div>
            <p className='text-muted-foreground text-sm font-medium'>Applicant Type</p>
            <p className='text-sm'>{instructor.applicant_type}</p>
          </div>

          <div>
            <p className='text-muted-foreground text-sm font-medium'>Application Notes</p>
            <p className='text-sm'>{instructor.application_notes || 'No notes provided'}</p>
          </div>

          <Separator />

          <div>
            <p className='text-muted-foreground text-sm font-medium'>Review Notes</p>
            <p className='text-sm'>{instructor.review_notes || 'No review notes provided'}</p>
          </div>

          <div>
            <p className='text-muted-foreground text-sm font-medium'>Status</p>
            <p className='text-sm capitalize'>{instructor.status}</p>
          </div>

          <div>
            <p className='text-muted-foreground text-sm font-medium'>Submitted</p>
            <p className='text-sm'>{new Date(instructor.created_date).toLocaleString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
