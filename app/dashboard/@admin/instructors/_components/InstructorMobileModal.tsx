import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Instructor } from '@/services/api/schema';
import { Edit, Trash2 } from 'lucide-react';
import type React from 'react';
import InstructorDetails from './InstructorDetails';

interface InstructorMobileModalProps {
  instructor: Instructor | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (instructor: Instructor) => void;
  onReject: (instructor: Instructor) => void;
  getStatusBadgeComponent: (instructorId: string) => React.ReactElement;
}

export default function InstructorMobileModal({
  instructor,
  isOpen,
  onClose,
  onApprove,
  onReject,
  getStatusBadgeComponent,
}: InstructorMobileModalProps) {
  if (!instructor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto'>
        <DialogHeader>
          <div className='flex items-center justify-between'>
            <DialogTitle>Instructor Details</DialogTitle>
            <div className='flex items-center gap-2'>
              <Button variant='ghost' size='sm'>
                <Edit className='h-4 w-4' />
              </Button>
              <Button variant='ghost' size='sm'>
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <InstructorDetails
          instructor={instructor}
          // getStatusBadgeComponent={getStatusBadgeComponent}
        />

        {/* Action Buttons */}
        <div className='flex gap-3 border-t pt-4'>
          <Button
            onClick={() => {
              onApprove(instructor);
              onClose();
            }}
            className='bg-blue-600 text-white hover:bg-blue-700'
          >
            <Edit className='mr-2 h-4 w-4' />
            Approve
          </Button>
          <Button
            variant='destructive'
            onClick={() => {
              onReject(instructor);
              onClose();
            }}
          >
            <Trash2 className='mr-2 h-4 w-4' />
            Reject
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
