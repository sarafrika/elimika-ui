'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { extractList, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { parseApiDate } from '@/lib/date';
import {
  getInstructorDocumentsOptions,
  getInstructorEducationOptions,
  getInstructorExperienceOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { Award, BadgeCheck, Briefcase, CalendarClock, GraduationCap } from 'lucide-react';
import { StatValue } from './components/profile-stat-strip';
import { instructorTabs } from './instructors-tab';
import { ProfilePage } from './profile-page';
import type { DomainProfilePageProps, StatDescriptor } from './types';

function plural(count: number, singular: string) {
  return `${count} ${singular}${count === 1 ? '' : 's'}`;
}

export default function InstructorProfilePage({
  profile,
  profileSource,
  headerBadge,
  isPublic = false,
}: DomainProfilePageProps) {
  const instructorUuid = profile.uuid;
  const enabled = Boolean(instructorUuid);

  const experienceQuery = useQuery({
    ...getInstructorExperienceOptions({
      path: { instructorUuid },
      query: { pageable: { page: 0, size: 1 } },
    }),
    enabled,
    retry: false,
  });

  const educationQuery = useQuery({
    ...getInstructorEducationOptions({ path: { instructorUuid } }),
    enabled,
    retry: false,
  });

  const documentsQuery = useQuery({
    ...getInstructorDocumentsOptions({ path: { instructorUuid } }),
    enabled,
    retry: false,
  });

  const experienceTotal = getTotalFromMetadata(
    extractPage<Record<string, unknown>>(experienceQuery.data).metadata
  );
  const educationTotal = extractList<Record<string, unknown>>(educationQuery.data).length;
  const verifiedDocuments = extractList<{ is_verified?: boolean }>(documentsQuery.data).filter(
    document => document.is_verified
  ).length;
  const memberSince = parseApiDate(profile.created_date)?.format('MMM YYYY');

  const stats: StatDescriptor[] = [
    {
      id: 'experience',
      label: 'Experience',
      icon: <Briefcase className='h-4 w-4' />,
      value: (
        <StatValue
          loading={experienceQuery.isLoading}
          value={experienceQuery.isError ? undefined : plural(experienceTotal, 'role')}
        />
      ),
    },
    {
      id: 'qualifications',
      label: 'Qualifications',
      icon: <GraduationCap className='h-4 w-4' />,
      value: (
        <StatValue
          loading={educationQuery.isLoading}
          value={educationQuery.isError ? undefined : plural(educationTotal, 'record')}
        />
      ),
    },
    {
      id: 'verified-documents',
      label: 'Verified docs',
      icon: <Award className='h-4 w-4' />,
      value: (
        <StatValue
          loading={documentsQuery.isLoading}
          value={documentsQuery.isError ? undefined : String(verifiedDocuments)}
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
      tabs={instructorTabs}
      profile={profile}
      domain='instructor'
      profileSource={profileSource}
      headerBadge={headerBadge}
      isPublic={isPublic}
      stats={stats}
      sidebar={
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
      }
    />
  );
}
