'use client';

import { useInstructor } from '@/context/instructor-context';
import CoursePreviewComponent from '../../../../@creator/course-management/preview/[id]/coursePreview-component';

function Page() {
  const instructor = useInstructor();
  return <CoursePreviewComponent instructorName={instructor?.full_name as string} />;
}

export default Page;
