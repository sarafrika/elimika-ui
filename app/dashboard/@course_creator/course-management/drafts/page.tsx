'use client';

import { useCourseCreator } from '@/context/course-creator-context';
import DraftCoursesComponent from './draftCourse-component';

function Page() {
  const { profile } = useCourseCreator();
  return <DraftCoursesComponent courseCreatorId={profile?.uuid as string} />;
}

export default Page;
