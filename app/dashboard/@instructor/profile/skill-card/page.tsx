'use client';

import Spinner from '@/components/ui/spinner';
import { useInstructor } from '@/context/instructor-context';
import { InstructorSkill } from '@/services/api/schema';
import { getInstructorSkillsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import SkillsSettings from './_component/InstructorSkillsForm';

export default function InstructorSkillsPage() {
  const instructor = useInstructor();
  const [skills, setSkills] = useState<InstructorSkill[] | null>(null);

  const { data } = useQuery({
    ...getInstructorSkillsOptions({ path: { instructorUuid: instructor?.uuid as string }, query: { pageable: { page: 0, size: 20 } } }),
    enabled: !!instructor?.uuid,
  })

  useEffect(() => {
    if (instructor) {
      setSkills(data?.data?.content as InstructorSkill[] || []);
    }
  }, [instructor, data?.data?.content]);

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
