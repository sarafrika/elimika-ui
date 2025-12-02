import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Course } from '@/services/client';
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
}: CourseMobileModalProps) {
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
