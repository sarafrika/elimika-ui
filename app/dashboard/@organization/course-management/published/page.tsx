'use client';

import { useOptionalCourseCreator } from '../../../../../context/course-creator-context';
import PublishedCoursesComponent from '../../../@course_creator/course-management/published/publishedCourse-component';

function Page() {
  const courseCreatorContext = useOptionalCourseCreator();
  const courseCreatorProfile = courseCreatorContext?.profile;
  return <PublishedCoursesComponent courseCreatorId={courseCreatorProfile?.uuid as string} />;
}

export default Page;
