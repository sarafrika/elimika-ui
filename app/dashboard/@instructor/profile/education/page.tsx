'use client';

import Spinner from '@/components/ui/spinner';
import { useInstructor } from '@/context/instructor-context';
import { fetchClient } from '@/services/api/fetch-client';
import { InstructorEducation } from '@/services/api/schema';
import { useEffect, useState } from 'react';
import EducationSettings from './_component/EducationForm';

export default function InstructoEducationPage() {
  const instructor = useInstructor();
  const [education, setEducation] = useState<InstructorEducation[] | null>(null);
  useEffect(() => {
    if (instructor) {
      fetchClient
        .GET('/api/v1/instructors/{instructorUuid}/education', {
          params: {
            path: {
              instructorUuid: instructor.uuid!,
            },
          },
        })
        .then(resp => {
          if (!resp.error) {
            setEducation(resp.data!.data! as unknown as InstructorEducation[]);
          }
        });
    }
  }, [instructor]);
  return (
    <>
      {instructor && education ? (
        <EducationSettings
          {...{
            instructor,
            instructorEducation: education,
          }}
        />
      ) : (
        <div className='flex items-center justify-center'>
          <Spinner />
        </div>
      )}
    </>
  );
}
