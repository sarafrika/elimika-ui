'use client';

import { ProfileFormSection, ProfileFormShell } from '@/components/profile/profile-form-layout';
import { ProfileViewList, ProfileViewListItem } from '@/components/profile/profile-view-field';
import { Button } from '@/components/ui/button';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useCourseCreator } from '@/context/course-creator-context';
import { getCourseCreatorMembershipsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { PlusCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function CourseCreatorMembershipPage() {
  const { replaceBreadcrumbs } = useBreadcrumb();
  const { profile } = useCourseCreator();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'profile', title: 'Profile', url: '/dashboard/profile' },
      {
        id: 'professional-membership',
        title: 'Professional Memberships',
        url: '/dashboard/profile/professional-membership',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const { data: membershipData } = useQuery({
    ...getCourseCreatorMembershipsOptions({
      path: { courseCreatorUuid: profile?.uuid as string },
    }),
    enabled: !!profile?.uuid,
  });

  const membershipRecords = membershipData?.data?.content || [];

  return (
    <ProfileFormShell
      eyebrow='Course Creator'
      title='Professional Memberships'
      description='Highlight your professional affiliations and industry memberships.'
    >
      <ProfileFormSection
        title='Professional Bodies'
        description='Memberships in professional organizations demonstrate your commitment to the field.'
        viewContent={
          <ProfileViewList emptyMessage='No professional memberships added yet.'>
            {membershipRecords.map((membership: any) => (
              <ProfileViewListItem
                key={membership.uuid}
                title={membership.organization_name || 'Organization'}
                subtitle={membership.membership_type}
                badge={
                  membership.membership_start_date
                    ? `Since ${format(new Date(membership.membership_start_date), 'MMM yyyy')}`
                    : undefined
                }
                description={membership.description}
              />
            ))}
          </ProfileViewList>
        }
      >
        <div className='space-y-4'>
          <p className='text-muted-foreground text-sm'>
            Membership form editing coming soon.
          </p>
          <Button type='button' variant='outline' className='w-full' disabled>
            <PlusCircle className='mr-2 h-4 w-4' />
            Add Membership
          </Button>
        </div>
      </ProfileFormSection>
    </ProfileFormShell>
  );
}