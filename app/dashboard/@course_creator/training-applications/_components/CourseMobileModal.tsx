import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Course } from '@/services/client';
import { Edit, Trash2 } from 'lucide-react';
import CourseDetails from './CourseDetails';

interface CourseMobileModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (course: Course) => void;
  onUnverify: (course: Course) => void;
  onDecline: (course: Course) => void;
}

export default function CourseMobileModal({
  course,
  isOpen,
  onClose,
  onApprove,
  onDecline,
  onUnverify,
}: CourseMobileModalProps) {
  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto'>
        <DialogHeader>
          <div className='flex items-center justify-between'>
            <DialogTitle>Course Details</DialogTitle>
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

        <CourseDetails course={course} />

        {/* Action Buttons */}
        <div className='flex gap-3 border-t pt-6'>
          <Button
            onClick={() => {
              onApprove(course);
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
              onUnverify(course);
              onClose();
            }}
          >
            <Trash2 className='mr-2 h-4 w-4' />
            Unverify
          </Button>
          <Button
            variant='destructive'
            onClick={() => {
              onDecline(course);
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
