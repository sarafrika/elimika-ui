'use client';

import { useInstructor } from '../../../../../context/instructor-context';
import PublishedCoursesComponent from '../../../@course_creator/course-management/published/publishedCourse-component';

function Page() {
  const instrucor = useInstructor();
  return <PublishedCoursesComponent courseCreatorId={instrucor?.uuid as string} />;
}

export default Page;
