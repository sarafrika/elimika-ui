'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { RubricAssociationForm } from './rubric-association-form';

const tabs = ['Assignment Rubrics', 'Attendance Rubric'];

type CriteriaCreationFormProps = {
  course: any;

};

const CriteriaCreationForm = ({
  course,
}: CriteriaCreationFormProps) => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('Assignment Rubrics');

  return (
    <div className='mb-10 w-full'>
      <div className='border-border mb-4 flex border-b'>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`-mb-px border-b-2 px-4 py-2 transition-colors ${activeTab === tab
              ? 'border-primary text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'Assignment Rubrics' && (
          <div>
            <RubricAssociationForm courseUuid={course?.data?.uuid as string} associatedBy={course?.data?.course_creator_uuid as string} />

            <div className='text-muted-foreground flex min-h-[300px] flex-col items-center justify-center gap-6 px-3 py-2 text-center text-sm'>
              <p>No rubrics assigned yet</p>
            </div>
          </div>
        )}

        {activeTab === 'Attendance' && (
          <div className='text-muted-foreground flex min-h-[300px] flex-col items-center justify-center gap-6 px-3 py-2 text-center text-sm'>
            <p>No attendance recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CriteriaCreationForm;
