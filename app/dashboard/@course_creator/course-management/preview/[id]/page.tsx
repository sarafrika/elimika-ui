'use client';

import { useCourseCreator } from '@/context/course-creator-context';
import {
  CourseCreatorEmptyState,
  CourseCreatorLoadingState,
} from '../../../_components/loading-state';
import CoursePreviewComponent from './coursePreview-component';

function Page() {
  const { profile, isLoading } = useCourseCreator();

  if (isLoading) {
    return <CourseCreatorLoadingState headline='Loading course preview…' />;
  }

  if (!profile) {
    return <CourseCreatorEmptyState />;
  }

  return <CoursePreviewComponent authorName={profile.full_name ?? ''} />;
}

export default Page;
