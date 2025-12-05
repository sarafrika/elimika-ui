'use client';

import CoursePreviewComponent from '@/app/dashboard/@course_creator/course-management/preview/[id]/coursePreview-component';

export default function AdminCoursePreviewPage() {
  // Admins may not have a course creator profile; authorName resolved inside component if empty.
  return <CoursePreviewComponent authorName='' />;
}
