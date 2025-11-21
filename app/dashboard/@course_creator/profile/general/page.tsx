'use client';

import { ProfileFormSection, ProfileFormShell } from '@/components/profile/profile-form-layout';
import { ProfileViewField, ProfileViewGrid } from '@/components/profile/profile-view-field';
import HTMLTextPreview from '@/components/editors/html-text-preview';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useCourseCreator } from '@/context/course-creator-context';
import { profilePicSvg } from '@/lib/utils';
import { useEffect } from 'react';

export default function CourseCreatorGeneralPage() {
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { profile } = useCourseCreator();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      {
        id: 'general',
        title: 'General',
        url: '/dashboard/profile/general',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <ProfileFormShell
      eyebrow='Course Creator'
      title='General Information'
      description='Manage your basic profile information and bio.'
    >
      <div className='space-y-6'>
        <ProfileFormSection
          title='Profile Photo'
          description='Your profile photo appears across the platform.'
          viewContent={
            <div className='flex items-center gap-4'>
              <Avatar className='h-20 w-20'>
                <AvatarImage src={profile.profile_image_url || profilePicSvg} />
                <AvatarFallback>{profile.full_name?.charAt(0) || 'C'}</AvatarFallback>
              </Avatar>
            </div>
          }
        >
          {/* Edit mode form will be added here */}
          <p className='text-muted-foreground text-sm'>Profile photo editing coming soon.</p>
        </ProfileFormSection>

        <ProfileFormSection
          title='Basic Information'
          description='Your name and professional headline.'
          viewContent={
            <ProfileViewGrid>
              <ProfileViewField label='Full Name' value={profile.full_name} />
              <ProfileViewField
                label='Professional Headline'
                value={profile.professional_headline}
              />
            </ProfileViewGrid>
          }
        >
          {/* Edit mode form will be added here */}
          <p className='text-muted-foreground text-sm'>
            Basic information editing coming soon.
          </p>
        </ProfileFormSection>

        <ProfileFormSection
          title='About'
          description='Tell learners about your background and expertise.'
          viewContent={
            profile.bio ? (
              <HTMLTextPreview
                htmlContent={profile.bio}
                className='prose prose-sm dark:prose-invert max-w-none'
              />
            ) : (
              <p className='text-muted-foreground text-sm'>No bio added yet.</p>
            )
          }
        >
          {/* Edit mode form will be added here */}
          <p className='text-muted-foreground text-sm'>Bio editing coming soon.</p>
        </ProfileFormSection>
      </div>
    </ProfileFormShell>
  );
}