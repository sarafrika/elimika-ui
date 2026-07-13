'use client';

import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { CourseTrainingRequirements } from '@/app/dashboard/_components/course-training-requirements';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Course, CourseRequirement } from '@/services/client';
import { getCourseRequirementsOptions } from '@/services/client/@tanstack/react-query.gen';
import { SectionCard } from '../../../_components/ui/SectionCard';

export function RequirementsSection({ course }: { course: Course }) {
  const courseUuid = course.uuid as string;
  const { data, isLoading } = useQuery({
    ...getCourseRequirementsOptions({ path: { courseUuid }, query: { pageable: {} } }),
    enabled: !!courseUuid,
  });
  const requirements: CourseRequirement[] = data?.data?.content ?? [];

  return (
    <div className='space-y-4'>
      <SectionCard
        title='Enrollment requirements'
        description='Prerequisites and conditions learners must meet.'
      >
        {isLoading ? (
          <div className='space-y-2'>
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className='h-10 w-full rounded-md' />
            ))}
          </div>
        ) : requirements.length === 0 ? (
          <p className='rounded-md border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground'>
            No enrollment requirements defined.
          </p>
        ) : (
          <ul className='space-y-2'>
            {requirements.map(requirement => (
              <li
                key={requirement.uuid}
                className='flex items-start gap-3 rounded-md border border-border/60 bg-muted/20 px-4 py-3'
              >
                <ClipboardList className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                <div className='min-w-0 flex-1'>
                  <p className='text-sm text-foreground'>{requirement.requirement_text}</p>
                  <div className='mt-1 flex flex-wrap gap-1.5'>
                    <Badge variant='secondary' className='rounded-md text-[11px] capitalize'>
                      {String(requirement.requirement_type ?? '').replace(/_/g, ' ').toLowerCase()}
                    </Badge>
                    {requirement.is_mandatory === false ? (
                      <Badge variant='outline' className='rounded-md text-[11px]'>
                        Optional
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <CourseTrainingRequirements
        requirements={course.training_requirements}
        viewerRole='admin'
        description='Resources each party must provide to deliver this course.'
      />
    </div>
  );
}
