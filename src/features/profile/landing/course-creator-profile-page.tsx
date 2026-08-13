'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { parseApiDate } from '@/lib/date';
import {
  getCourseCreatorCertificationsOptions,
  searchCoursesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { Award, BadgeCheck, BookOpen, CalendarClock, FileEdit } from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { StatValue } from './components/profile-stat-strip';
import { creatorTabs } from './course-creator-tab';
import { ProfilePage } from './profile-page';
import type { DomainProfilePageProps, StatDescriptor } from './types';

function useCourseCountByStatus(courseCreatorUuid: string, status: string) {
  return useQuery({
    ...searchCoursesOptions({
      query: {
        searchParams: { status, course_creator_uuid_eq: courseCreatorUuid },
        pageable: { page: 0, size: 1 },
      },
    }),
    enabled: Boolean(courseCreatorUuid),
    retry: false,
  });
}

export default function CourseCreatorProfilePage({
  profile,
  profileSource,
  headerBadge,
  isPublic = false,
}: DomainProfilePageProps) {
  const courseCreatorUuid = profile.uuid;

  const publishedQuery = useCourseCountByStatus(courseCreatorUuid, 'published');
  const draftQuery = useCourseCountByStatus(courseCreatorUuid, 'draft');

  const certificationsQuery = useQuery({
    ...getCourseCreatorCertificationsOptions({
      path: { courseCreatorUuid },
      query: { pageable: { page: 0, size: 1 } },
    }),
    enabled: Boolean(courseCreatorUuid),
    retry: false,
  });

  const publishedTotal = getTotalFromMetadata(
    extractPage<Record<string, unknown>>(publishedQuery.data).metadata
  );
  const draftTotal = getTotalFromMetadata(
    extractPage<Record<string, unknown>>(draftQuery.data).metadata
  );
  const certificationsTotal = getTotalFromMetadata(
    extractPage<Record<string, unknown>>(certificationsQuery.data).metadata
  );
  const memberSince = parseApiDate(profile.created_date)?.format('MMM YYYY');

  const stats: StatDescriptor[] = [
    {
      id: 'published',
      label: 'Published',
      icon: <BookOpen className='h-4 w-4' />,
      value: (
        <StatValue
          loading={publishedQuery.isLoading}
          value={publishedQuery.isError ? undefined : String(publishedTotal)}
        />
      ),
    },
    {
      id: 'drafts',
      label: 'Drafts',
      icon: <FileEdit className='h-4 w-4' />,
      value: (
        <StatValue
          loading={draftQuery.isLoading}
          value={draftQuery.isError ? undefined : String(draftTotal)}
        />
      ),
    },
    {
      id: 'certifications',
      label: 'Certifications',
      icon: <Award className='h-4 w-4' />,
      value: (
        <StatValue
          loading={certificationsQuery.isLoading}
          value={certificationsQuery.isError ? undefined : String(certificationsTotal)}
        />
      ),
    },
  ];

  if (memberSince) {
    stats.push({
      id: 'member-since',
      label: 'Member since',
      icon: <CalendarClock className='h-4 w-4' />,
      value: memberSince,
    });
  }

  return (
    <ProfilePage
      tabs={creatorTabs}
      profile={profile}
      domain='course_creator'
      profileSource={profileSource}
      headerBadge={headerBadge}
      isPublic={isPublic}
      stats={stats}
      sidebar={
        <div className='flex flex-col gap-6' >
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Course library</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm'>
              <div className='flex items-center justify-between gap-3'>
                <span className='text-muted-foreground'>Published</span>
                <span className='font-medium'>
                  <StatValue
                    loading={publishedQuery.isLoading}
                    value={publishedQuery.isError ? undefined : String(publishedTotal)}
                  />
                </span>
              </div>
              <div className='flex items-center justify-between gap-3'>
                <span className='text-muted-foreground'>Drafts</span>
                <span className='font-medium'>
                  <StatValue
                    loading={draftQuery.isLoading}
                    value={draftQuery.isError ? undefined : String(draftTotal)}
                  />
                </span>
              </div>
              <div className='flex items-center justify-between gap-3'>
                <span className='text-muted-foreground'>Profile</span>
                <span className='font-medium'>
                  {profile.is_profile_complete ? 'Complete' : 'Incomplete'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Verification</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm'>
              <div className='flex items-center justify-between gap-3'>
                <span className='text-muted-foreground'>Admin verified</span>
                {profile.admin_verified ? (
                  <Badge
                    variant='outline'
                    className='border-success/30 bg-success/10 text-success gap-1'
                  >
                    <BadgeCheck className='h-3 w-3' /> Verified
                  </Badge>
                ) : (
                  <Badge variant='outline'>Pending</Badge>
                )}
              </div>
              <div className='flex items-center justify-between gap-3'>
                <span className='text-muted-foreground'>Profile</span>
                <span className='font-medium'>
                  {profile.is_profile_complete ? 'Complete' : 'Incomplete'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}
