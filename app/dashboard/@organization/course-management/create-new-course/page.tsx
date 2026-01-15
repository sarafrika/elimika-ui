import CourseCreatorAccessGate from '@/components/profile/course-creator-access-gate';
import CourseCreationPage from '../../../@course_creator/course-management/create-new-course/_component/CourseBuilderPage';

function Page() {
  return (
    <CourseCreatorAccessGate fallbackUrl='/dashboard/overview'>
      <CourseCreationPage />
    </CourseCreatorAccessGate>
  );
}

export default Page;
