'use client';

import { useCourseCreator } from '@/context/course-creator-context';
import CoursePreviewComponent from './coursePreview-component';

function Page() {
  const { profile } = useCourseCreator();
  return <CoursePreviewComponent authorName={profile?.full_name ?? ''} />;
}

export default Page;
