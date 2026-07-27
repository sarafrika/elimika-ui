'use client';

import type { ApiResponseCourse } from '../../../../services/client/types.gen';
import CourseGradingForm from './course-grading-form';

type CourseGradingSectionProps = {
  course: ApiResponseCourse | undefined;
};

const CourseGradingSection = ({ course }: CourseGradingSectionProps) => {
  return (
    <div className='mb-10 w-full'>
      <CourseGradingForm courseUuid={course?.data?.uuid as string} />
    </div>
  );
};

export default CourseGradingSection;
