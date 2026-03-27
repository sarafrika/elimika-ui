'use client';

import CourseGradingForm from './course-grading-form';

type CourseGradingSectionProps = {
  course: any;
};

const CourseGradingSection = ({ course }: CourseGradingSectionProps) => {
  return (
    <div className='mb-10 w-full'>
      <CourseGradingForm courseUuid={course?.data?.uuid as string} />
    </div>
  );
};

export default CourseGradingSection;
