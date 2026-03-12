'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CourseAssessmentStructure } from './assesment-structure-form';
import { AssignmentRubricAssociationForm } from './assignment-rubric-association-form';
import { AttendanceRubricAssociationForm } from './attendance-rubric-association-form';

// const tabs = ['Assessment Structure', 'Assignment Rubric', 'Attendance Rubric'];
const tabs = ['Assessment Structure'];

type CriteriaCreationFormProps = {
  course: any;
};

const CriteriaCreationForm = ({ course }: CriteriaCreationFormProps) => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('Assessment Structure');

  return (
    <div className='mb-10 w-full'>
      <div className='border-border mb-4 flex border-b'>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`-mb-px border-b-2 px-4 py-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'Assessment Structure' && (
          <div>
            <CourseAssessmentStructure courseUuid={course?.data?.uuid as string} createdBy={''} />
          </div>
        )}

        {activeTab === 'Assignment Rubric' && (
          <div>
            <AssignmentRubricAssociationForm
              courseUuid={course?.data?.uuid as string}
              associatedBy={course?.data?.course_creator_uuid as string}
            />
          </div>
        )}

        {activeTab === 'Attendance Rubric' && (
          <div>
            <AttendanceRubricAssociationForm
              courseUuid={course?.data?.uuid as string}
              associatedBy={course?.data?.course_creator_uuid as string}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CriteriaCreationForm;
