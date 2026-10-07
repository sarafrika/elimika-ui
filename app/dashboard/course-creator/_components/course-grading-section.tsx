'use client';

import type { ApiResponseCourse } from '../../../../services/client/types.gen';
import CourseGradingForm from './course-grading-form';

type CourseGradingSectionProps = {
  course: ApiResponseCourse | undefined;
};

const CourseGradingSection = ({ course }: CourseGradingSectionProps) => {
  return (
    <div className='mb-10 w-full'>
      <CourseGradingForm
        courseUuid={course?.error || course?.success === false ? undefined : course?.data?.uuid}
        creatorUuid={
          course?.error || course?.success === false ? undefined : course?.data?.course_creator_uuid
        }
      />
    </div>
  );
};

export default CourseGradingSection;
