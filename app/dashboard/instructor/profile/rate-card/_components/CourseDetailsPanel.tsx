import type { Course } from '@/services/client';
import { FileText } from 'lucide-react';
import CourseDetails from './CourseDetails';

interface CourseDetailsPanelProps {
  course: Course | null;
  onApprove: (course: Course) => void;
  onUnverify: (course: Course) => void;
  onDecline: (course: Course) => void;
  isApprovePending: boolean;
  isUnverifyPending: boolean;
  isDeclinePending: boolean;
}

export default function CourseDetailsPanel({
  course,
  onApprove,
  onUnverify,
  onDecline,
  isApprovePending,
  isUnverifyPending,
  isDeclinePending,
}: CourseDetailsPanelProps) {
  if (!course) {
    return (
      <div className='hidden flex-1 flex-col lg:flex'>
        <div className='flex flex-1 items-center justify-center'>
          <div className='text-center'>
            <FileText className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
            <h2 className='mb-2 text-lg font-medium'>No Course Selected</h2>
            <p className='text-muted-foreground'>Select a course from the list to view details</p>
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
          <h1 className='text-2xl font-semibold'>Course Rates</h1>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-6'>
        <CourseDetails course={course} />
      </div>
    </div>
  );
}
