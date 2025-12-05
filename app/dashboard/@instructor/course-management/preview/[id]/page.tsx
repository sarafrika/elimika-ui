'use client';

import CoursePreviewComponent from '@/app/dashboard/@course_creator/course-management/preview/[id]/coursePreview-component';
import { CataloguePreviewSummary } from '@/app/dashboard/_components/catalogue-preview-summary';
import { useUserProfile } from '@/context/profile-context';

export default function InstructorCoursePreviewPage() {
  const profile = useUserProfile();
  const isVerifiedInstructor = Boolean(profile?.instructor?.admin_verified);

  if (isVerifiedInstructor) {
    return <CoursePreviewComponent authorName={profile?.instructor?.full_name ?? ''} />;
  }

  return <CataloguePreviewSummary />;
}
