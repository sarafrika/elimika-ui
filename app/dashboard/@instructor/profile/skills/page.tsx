'use client';

import { useInstructor } from '@/context/instructor-context';
import SkillsSettings from './_component/InstructorSkillsForm';
import { useEffect, useState } from 'react';
import { InstructorSkill } from '@/services/api/schema';
import { fetchClient } from '@/services/api/fetch-client';
import Spinner from '@/components/ui/spinner';

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
        <Spinner />
      )}
    </>
  );
}
