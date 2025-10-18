'use client';

import { useCourseCreator } from '@/context/course-creator-context';
import PublishedCoursesComponent from './publishedCourse-component';

function Page() {
  const { profile } = useCourseCreator();
  return <PublishedCoursesComponent courseCreatorId={profile?.uuid} />;
}

export default Page;
