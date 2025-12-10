'use client';

import { useOptionalCourseCreator } from '../../../../../context/course-creator-context';
import DraftCoursesComponent from '../../../@course_creator/course-management/drafts/draftCourse-component';

function Page() {
  const courseCreatorContext = useOptionalCourseCreator();
  const courseCreatorProfile = courseCreatorContext?.profile;
  return <DraftCoursesComponent courseCreatorId={courseCreatorProfile?.uuid as string} />;
}

export default Page;
