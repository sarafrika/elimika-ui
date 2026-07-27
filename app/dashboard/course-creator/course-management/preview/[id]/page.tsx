'use client';

import { useCourseCreator } from '@/context/course-creator-context';
import { CourseCreatorEmptyState } from '../../../_components/loading-state';
import CoursePreviewComponent from './coursePreview-component';

function Page() {
  const { profile, isLoading } = useCourseCreator();

  // Don't gate the whole preview on the profile query — the preview component fetches
  // the course itself and resolves its own loading state. The author name simply fills
  // in once the profile arrives (it has an in-component fallback until then).
  if (!profile && !isLoading) {
    return <CourseCreatorEmptyState />;
  }

  return <CoursePreviewComponent authorName={profile?.full_name ?? ''} />;
}

export default Page;
