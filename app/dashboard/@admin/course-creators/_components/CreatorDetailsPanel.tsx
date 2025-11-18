import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import type { CourseCreator } from '@/services/client';
import { Edit, Trash2, User } from 'lucide-react';
import CourseCreatorDetails from './CreatorDetails';

interface CourseCreatorDetailsPanelProps {
  courseCreator: CourseCreator | null;
  onApprove: (courseCreator: CourseCreator) => void;
  onUnverify: (courseCreator: CourseCreator) => void;
  onDecline: (courseCreator: CourseCreator) => void;
  isApprovePending: boolean;
  isUnverifyPending: boolean;
  isDeclinePending: boolean;
}

export default function CourseCreatorDetailsPanel({
  courseCreator,
  onApprove,
  onUnverify,
  onDecline,
  isApprovePending,
  isUnverifyPending,
  isDeclinePending,
}: CourseCreatorDetailsPanelProps) {
  if (!courseCreator) {
    return (
      <div className='hidden flex-1 flex-col lg:flex'>
        <div className='flex flex-1 items-center justify-center'>
          <div className='text-center'>
            <User className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
            <h2 className='mb-2 text-lg font-medium'>No Course Creator Selected</h2>
            <p className='text-muted-foreground'>
              Select a course creator from the list to view details
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='hidden flex-1 flex-col lg:flex'>
      {/* Header */}
      <div className='bg-background border-b p-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-semibold'>Course Creator Details</h1>
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
        <CourseCreatorDetails courseCreator={courseCreator} />
      </div>

      {/* Action Buttons */}
      <div className='bg-background border-t p-6'>
        <div className='flex gap-3'>
          <Button
            onClick={() => onApprove(courseCreator)}
            className='min-w-[110px] bg-blue-600 text-white hover:bg-blue-700'
          >
            <Edit className='mr-2 h-4 w-4' />
            {isApprovePending ? <Spinner /> : 'Approve Verification'}
          </Button>
          <Button
            variant='secondary'
            onClick={() => onUnverify(courseCreator)}
            className='min-w-[100px]'
          >
            <Trash2 className='mr-2 h-4 w-4' />
            {isUnverifyPending ? <Spinner /> : 'Unverify'}
          </Button>
          <Button
            variant='destructive'
            onClick={() => onDecline(courseCreator)}
            className='min-w-[100px]'
          >
            <Trash2 className='mr-2 h-4 w-4' />
            {isDeclinePending ? <Spinner /> : 'Decline'}
          </Button>
        </div>
      </div>
    </div>
  );
}
