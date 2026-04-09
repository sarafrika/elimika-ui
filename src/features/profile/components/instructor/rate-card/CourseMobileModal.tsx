import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CourseDetails from './CourseDetails';
import type { CourseWithApplication } from './types';

interface CourseMobileModalProps {
  course: CourseWithApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (course: CourseWithApplication) => void;
  onUnverify: (course: CourseWithApplication) => void;
  onDecline: (course: CourseWithApplication) => void;
}

export default function CourseMobileModal({ course, isOpen, onClose }: CourseMobileModalProps) {
  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] max-w-4xl overflow-y-auto'>
        <DialogHeader>
          <div className='flex items-center justify-between'>
            <DialogTitle>Course Details</DialogTitle>
          </div>
        </DialogHeader>

        <CourseDetails course={course} />
      </DialogContent>
    </Dialog>
  );
}
