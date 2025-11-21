'use client';

import { ProfileFormSection, ProfileFormShell } from '@/components/profile/profile-form-layout';
import { ProfileViewList, ProfileViewListItem } from '@/components/profile/profile-view-field';
import { Button } from '@/components/ui/button';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useCourseCreator } from '@/context/course-creator-context';
import { getCourseCreatorEducationOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { PlusCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function CourseCreatorEducationPage() {
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { profile } = useCourseCreator();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      {
        id: 'education',
        title: 'Education',
        url: '/dashboard/profile/education',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const { data: educationData } = useQuery({
    ...getCourseCreatorEducationOptions({
      path: { courseCreatorUuid: profile?.uuid as string },
    }),
    enabled: !!profile?.uuid,
  });

  const educationRecords = educationData?.data?.content || [];

  return (
    <ProfileFormShell
      eyebrow='Course Creator'
      title='Education'
      description='Share your academic background and qualifications.'
    >
      <ProfileFormSection
        title='Educational Background'
        description='Your degrees and certifications help establish credibility.'
        viewContent={
          <ProfileViewList emptyMessage='No education records added yet.'>
            {educationRecords.map((edu: any) => (
              <ProfileViewListItem
                key={edu.uuid}
                title={edu.degree || 'Degree'}
                subtitle={edu.institution}
                badge={
                  edu.graduation_date
                    ? format(new Date(edu.graduation_date), 'MMM yyyy')
                    : undefined
                }
                description={edu.field_of_study}
              />
            ))}
          </ProfileViewList>
        }
      >
        <div className='space-y-4'>
          <p className='text-muted-foreground text-sm'>
            Education form editing coming soon.
          </p>
          <Button type='button' variant='outline' className='w-full' disabled>
            <PlusCircle className='mr-2 h-4 w-4' />
            Add Education
          </Button>
        </div>
      </ProfileFormSection>
    </ProfileFormShell>
  );
}