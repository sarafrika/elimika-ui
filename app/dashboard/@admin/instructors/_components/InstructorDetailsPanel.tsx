import { Button } from '@/components/ui/button';
import { Instructor } from '@/services/api/schema';
import { Edit, Trash2, User } from 'lucide-react';
import React from 'react';
import Spinner from '@/components/ui/spinner';
import InstructorDetails from './InstructorDetails';

interface InstructorDetailsPanelProps {
  instructor: Instructor | null;
  onApprove: (instructor: Instructor) => void;
  onReject: (instructor: Instructor) => void;
  getStatusBadgeComponent: (instructorId: string) => React.ReactElement;
  isApprovePending: boolean;
  isRejectPending: boolean;
}

export default function InstructorDetailsPanel({
  instructor,
  onApprove,
  onReject,
  getStatusBadgeComponent,
  isApprovePending,
  isRejectPending,
}: InstructorDetailsPanelProps) {
  if (!instructor) {
    return (
      <div className='hidden flex-1 flex-col rounded-xl border border-border/60 bg-card/20 lg:flex'>
        <div className='flex flex-1 items-center justify-center'>
          <div className='text-center'>
            <User className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
            <h2 className='mb-2 text-lg font-medium'>No Instructor Selected</h2>
            <p className='text-muted-foreground'>
              Select an instructor from the list to view details
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='hidden flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-card/10 lg:flex'>
      {/* Header */}
      <div className='border-b bg-background/80 p-6 backdrop-blur'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-semibold'>Instructor Details</h1>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm'>
              <Edit className='h-4 w-4' />
            </Button>
            <Button variant='ghost' size='sm'>
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-6'>
        <InstructorDetails instructor={instructor} />
      </div>

      {/* Action Buttons */}
      <div className='border-t bg-background/60 p-6 backdrop-blur'>
        <div className='flex gap-3'>
          <Button
            onClick={() => onApprove(instructor)}
            className='min-w-[110px] bg-blue-600 text-white hover:bg-blue-700'
          >
            <Edit className='mr-2 h-4 w-4' />
            {isApprovePending ? <Spinner /> : 'Approve Verification'}
          </Button>
          <Button
            variant='destructive'
            onClick={() => onReject(instructor)}
            className='min-w-[100px]'
          >
            <Trash2 className='mr-2 h-4 w-4' />
            {isRejectPending ? <Spinner /> : 'Unverify'}
          </Button>
        </div>
      </div>
    </div>
  );
}
