'use client';

import { ProfileFormShell } from '@/components/profile/profile-form-layout';
import { ProfileViewList, ProfileViewListItem } from '@/components/profile/profile-view-field';
import { Button } from '@/components/ui/button';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useCourseCreator } from '@/context/course-creator-context';
import { useProfileFormMode } from '@/context/profile-form-mode-context';
import { getCourseCreatorExperienceOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { PlusCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function CourseCreatorExperiencePage() {
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { profile } = useCourseCreator();
  const { isEditing } = useProfileFormMode();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      {
        id: 'experience',
        title: 'Experience',
        url: '/dashboard/profile/experience',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const { data: experienceData } = useQuery({
    ...getCourseCreatorExperienceOptions({
      path: { courseCreatorUuid: profile?.uuid as string },
    }),
    enabled: !!profile?.uuid,
  });

  const experienceRecords = experienceData?.data?.content || [];

  return (
    <ProfileFormShell
      eyebrow='Course Creator'
      title='Professional Experience'
      description='Showcase your work history and professional achievements.'
    >
      <div className='space-y-6'>
        <div className='rounded-lg border border-blue-200/40 bg-white p-6'>
          <div className='mb-4'>
            <h3 className='text-lg font-semibold'>Work Experience</h3>
            <p className='text-muted-foreground text-sm'>
              Your professional background demonstrates expertise in your field.
            </p>
          </div>

          {isEditing ? (
            <div className='space-y-4'>
              <p className='text-muted-foreground text-sm'>
                Experience form editing coming soon.
              </p>
              <Button type='button' variant='outline' className='w-full' disabled>
                <PlusCircle className='mr-2 h-4 w-4' />
                Add Experience
              </Button>
            </div>
          ) : (
            <ProfileViewList emptyMessage='No experience records added yet.'>
              {experienceRecords.map((exp: any) => (
                <ProfileViewListItem
                  key={exp.uuid}
                  title={exp.job_title || 'Position'}
                  subtitle={exp.company_name}
                  badge={
                    exp.start_date
                      ? `${format(new Date(exp.start_date), 'MMM yyyy')} - ${exp.end_date ? format(new Date(exp.end_date), 'MMM yyyy') : 'Present'}`
                      : undefined
                  }
                  description={exp.description}
                />
              ))}
            </ProfileViewList>
          )}
        </div>
      </div>
    </ProfileFormShell>
  );
}