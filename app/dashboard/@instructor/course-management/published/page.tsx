'use client'

import { useInstructor } from '../../../../../context/instructor-context';
import PublishedCoursesComponent from './publishedCourse-component';

function Page() {
  const instrucor = useInstructor()
  return <PublishedCoursesComponent instructorId={instrucor?.uuid as string} />;
}

export default Page;
