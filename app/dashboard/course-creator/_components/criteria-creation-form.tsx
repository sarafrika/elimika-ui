'use client';

import { useCourseCreator } from '@/context/course-creator-context';
import { EmptyState } from '@/components/ui/empty-state';
import type { ApiResponseCourse } from '../../../../services/client/types.gen';
import { CourseAssessmentStructure } from './assesment-structure-form';

type CriteriaCreationFormProps = {
  course: ApiResponseCourse | undefined;
};

const CriteriaCreationForm = ({ course }: CriteriaCreationFormProps) => {
  const creator = useCourseCreator();
  const courseUuid = course?.error || course?.success === false ? undefined : course?.data?.uuid;
  if (!courseUuid)
    return <EmptyState variant='compact' title='Save the course to configure assessments' />;
  return (
    <div className='mb-10 w-full'>
      <div>
        <CourseAssessmentStructure
          courseUuid={courseUuid}
          createdBy={creator?.profile?.uuid ?? ''}
        />
      </div>
    </div>
  );
};

export default CriteriaCreationForm;
