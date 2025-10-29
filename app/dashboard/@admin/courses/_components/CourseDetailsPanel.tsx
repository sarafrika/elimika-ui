import { Button } from '@/components/ui/button';
import { Course } from '@/services/client';
import { CheckCircle, Edit, MoreVertical, Trash2, User, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
            <User className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
            <h2 className='mb-2 text-lg font-medium'>No Course Selected</h2>
            <p className='text-muted-foreground'>
              Select a course from the list to view details
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
          <h1 className='text-2xl font-semibold'>Course Details</h1>

          <div className='flex items-center gap-2'>
            {course.status ? (
              <>
                <Button
                  variant='default'
                  size='sm'
                  onClick={() => onApprove(course)}
                  className='gap-2'
                >
                  <CheckCircle className='h-4 w-4' />
                  Approve
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onDecline(course)}
                  className='gap-2'
                >
                  <XCircle className='h-4 w-4' />
                  Reject
                </Button>
              </>
            ) : (
              <Button
                onClick={() => onUnverify(course)}
                variant='outline' size='sm' className='gap-2'>
                Revoke Verification
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm'>
                  <MoreVertical className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-48'>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className='text-destructive'
                  onClick={() => toast.message("Implement delete here")}
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete Course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className='flex lg:hidden items-center gap-2'>
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
        <CourseDetails course={course} />
      </div>

    </div>
  );
}
