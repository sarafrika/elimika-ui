'use client';

import { useInstructor } from '../../../../../context/instructor-context';
import DraftCoursesComponent from '../../../@creator/course-management/drafts/draftCourse-component';

function Page() {
  const instructor = useInstructor();
  return <DraftCoursesComponent instructorId={instructor?.uuid as string} />;
}

export default Page;
