'use client';

import { useInstructor } from '../../../../../context/instructor-context';
import PublishedCoursesComponent from '../../../@creator/course-management/published/publishedCourse-component';

function Page() {
  const instrucor = useInstructor();
  return <PublishedCoursesComponent instructorId={instrucor?.uuid as string} />;
}

export default Page;
