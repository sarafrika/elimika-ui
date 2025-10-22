import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CourseCreator } from '@/services/client';
import { Edit, Trash2 } from 'lucide-react';
import CourseCreatorDetails from './CreatorDetails';

interface CourseCreatorMobileModalProps {
  courseCreator: CourseCreator | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (courseCreator: CourseCreator) => void;
  onUnverify: (courseCreator: CourseCreator) => void;
  onDecline: (courseCreator: CourseCreator) => void;
}

export default function CourseCreatorMobileModal({
  courseCreator,
  isOpen,
  onClose,
  onApprove,
  onDecline,
  onUnverify,
}: CourseCreatorMobileModalProps) {
  if (!courseCreator) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto'>
        <DialogHeader>
          <div className='flex items-center justify-between'>
            <DialogTitle>Course Creator Details</DialogTitle>
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

        <CourseCreatorDetails courseCreator={courseCreator} />

        {/* Action Buttons */}
        <div className='flex gap-3 border-t pt-4'>
          <Button
            onClick={() => {
              onApprove(courseCreator);
              onClose();
            }}
            className='bg-blue-600 text-white hover:bg-blue-700'
          >
            <Edit className='mr-2 h-4 w-4' />
            Verify
          </Button>
          <Button
            variant='secondary'
            onClick={() => {
              onUnverify(courseCreator);
              onClose();
            }}
          >
            <Trash2 className='mr-2 h-4 w-4' />
            Unverify
          </Button>
          <Button
            variant='destructive'
            onClick={() => {
              onDecline(courseCreator);
              onClose();
            }}
          >
            <Trash2 className='mr-2 h-4 w-4' />
            Decline
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
