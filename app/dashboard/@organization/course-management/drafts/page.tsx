'use client';

import { useInstructor } from '../../../../../context/instructor-context';
import DraftCoursesComponent from '../../../@course_creator/course-management/drafts/draftCourse-component';

function Page() {
  const instructor = useInstructor();
  return <DraftCoursesComponent courseCreatorId={instructor?.uuid as string} />;
}

export default Page;
