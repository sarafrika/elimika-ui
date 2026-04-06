'use client';

import { CourseAssessmentStructure } from './assesment-structure-form';

type CriteriaCreationFormProps = {
  course: any;
};

const CriteriaCreationForm = ({ course }: CriteriaCreationFormProps) => {
  return (
    <div className='mb-10 w-full'>
      <div>
        <CourseAssessmentStructure courseUuid={course?.data?.uuid as string} createdBy={''} />
      </div>
    </div>
  );
};

export default CriteriaCreationForm;
