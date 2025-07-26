'use client';

import Spinner from '@/components/ui/spinner';
import { useInstructor } from '@/context/instructor-context';
import { fetchClient } from '@/services/api/fetch-client';
import { InstructorSkill } from '@/services/api/schema';
import { useEffect, useState } from 'react';
import SkillsSettings from './_component/InstructorSkillsForm';

export default function InstructorSkillsPage() {
  const instructor = useInstructor();
  const [skills, setSkills] = useState<InstructorSkill[] | null>(null);

  useEffect(() => {
    if (instructor) {
      fetchClient
        .GET('/api/v1/instructors/{instructorUuid}/skills', {
          params: {
            path: {
              instructorUuid: instructor.uuid!,
            },
            query: {
              //@ts-ignore
              page: 0,
              size: 10,
            },
          },
        })
        .then(resp => {
          if (!resp.error) {
            setSkills(resp.data!.data!.content as InstructorSkill[]);
          }
        });
    }
  }, [instructor]);

  return (
    <>
      {instructor && skills ? (
        <SkillsSettings
          {...{
            instructor,
            instructorSkills: skills,
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
