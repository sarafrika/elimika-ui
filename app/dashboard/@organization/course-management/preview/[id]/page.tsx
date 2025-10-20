'use client';

import { useInstructor } from '@/context/instructor-context';
import CoursePreviewComponent from '../../../../@course_creator/course-management/preview/[id]/coursePreview-component';

function Page() {
  const instructor = useInstructor();
  return <CoursePreviewComponent authorName={instructor?.full_name ?? ''} />;
}

export default Page;
