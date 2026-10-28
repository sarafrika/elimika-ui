'use client';

import { CourseGradesCard } from '@/components/grades/CourseGradesCard';
import { ProgressReportCard } from '@/components/lesson/ProgressReportCard';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ProgramReportCourse } from '@/services/client/types.gen';
import type { ReportAudience } from './report-model';

/** A program course's lesson-by-lesson marks, from the course gradebook the course uses. */
export function LessonMarksSheet({
  course,
  audience,
  learnerName,
  onClose,
}: {
  course: ProgramReportCourse;
  audience: ReportAudience;
  learnerName?: string;
  onClose: () => void;
}) {
  const courseUuid = course.course_uuid ?? '';
  const enrollmentUuid = course.course_enrollment_uuid ?? '';
  const name = learnerName ?? 'Learner';
  return (
    <Sheet open onOpenChange={open => !open && onClose()}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-3xl'>
        <SheetHeader className='border-b pr-12'>
          <SheetTitle>{course.course_title ?? 'Course'} · Lesson marks</SheetTitle>
          <SheetDescription>
            The marks behind the course final. Drafts and unsubmitted scores are never shown.
          </SheetDescription>
        </SheetHeader>
        <div className='p-4' data-testid='lesson-marks-sheet'>
          {audience === 'instructor' ? (
            <ProgressReportCard
              courseUuid={courseUuid}
              enrollmentUuid={enrollmentUuid}
              studentName={name}
            />
          ) : (
            <CourseGradesCard
              courseUuid={courseUuid}
              enrollmentUuid={enrollmentUuid}
              studentName={name}
              courseName={course.course_title}
              audience={audience === 'guardian' ? 'guardian' : 'learner'}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
