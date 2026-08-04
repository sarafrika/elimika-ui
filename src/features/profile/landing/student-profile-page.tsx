'use client';

import { useQuery } from '@tanstack/react-query';
import { Award, BookOpen, CalendarClock, CircleCheckBig, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { extractList, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { parseApiDate } from '@/lib/date';
import {
  getCourseEnrollmentsForStudentOptions,
  getStudentCertificatesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { StatValue } from './components/profile-stat-strip';
import { ProfilePage } from './profile-page';
import { studentTabs } from './students-tab';
import type { DomainProfilePageProps, StatDescriptor } from './types';

type StudentEnrollment = {
  status?: string;
  completion_date?: string | Date | null;
};

export default function StudentProfilePage({
  profile,
  profileSource,
  headerBadge,
  isPublic = false,
}: DomainProfilePageProps) {
  const studentUuid = profile.uuid;
  const enabled = Boolean(studentUuid);

  const enrollmentsQuery = useQuery({
    ...getCourseEnrollmentsForStudentOptions({
      path: { studentUuid },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled,
    retry: false,
  });

  const certificatesQuery = useQuery({
    ...getStudentCertificatesOptions({ path: { studentUuid } }),
    enabled,
    retry: false,
  });

  const enrollmentsPage = extractPage<StudentEnrollment>(enrollmentsQuery.data);
  const enrolledTotal = getTotalFromMetadata(enrollmentsPage.metadata) || enrollmentsPage.items.length;
  const completedTotal = enrollmentsPage.items.filter(
    enrollment => enrollment.status === 'COMPLETED' || Boolean(enrollment.completion_date)
  ).length;
  const certificatesTotal = extractList<Record<string, unknown>>(certificatesQuery.data).length;
  const memberSince = parseApiDate(profile.created_date)?.format('MMM YYYY');

  const stats: StatDescriptor[] = [
    {
      id: 'enrolled',
      label: 'Enrolled',
      icon: <BookOpen className='h-4 w-4' />,
      value: (
        <StatValue
          loading={enrollmentsQuery.isLoading}
          value={enrollmentsQuery.isError ? undefined : String(enrolledTotal)}
        />
      ),
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: <CircleCheckBig className='h-4 w-4' />,
      value: (
        <StatValue
          loading={enrollmentsQuery.isLoading}
          value={enrollmentsQuery.isError ? undefined : String(completedTotal)}
        />
      ),
    },
    {
      id: 'certificates',
      label: 'Certificates',
      icon: <Award className='h-4 w-4' />,
      value: (
        <StatValue
          loading={certificatesQuery.isLoading}
          value={certificatesQuery.isError ? undefined : String(certificatesTotal)}
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

  const primaryGuardian = profile.student_profile?.primaryGuardianContact;
  const secondaryGuardian = profile.student_profile?.secondaryGuardianContact;
  const hasGuardians = Boolean(primaryGuardian || secondaryGuardian);

  return (
    <ProfilePage
      tabs={studentTabs}
      profile={profile}
      domain='student'
      profileSource={profileSource}
      headerBadge={headerBadge}
      isPublic={isPublic}
      stats={stats}
      sidebar={
        hasGuardians ? (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <Users className='text-muted-foreground h-4 w-4' />
                Guardian contacts
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm'>
              {primaryGuardian ? (
                <div>
                  <p className='text-muted-foreground text-[10px] tracking-wide uppercase'>
                    Primary
                  </p>
                  <p className='font-medium break-words'>{primaryGuardian}</p>
                </div>
              ) : null}
              {secondaryGuardian ? (
                <div>
                  <p className='text-muted-foreground text-[10px] tracking-wide uppercase'>
                    Secondary
                  </p>
                  <p className='font-medium break-words'>{secondaryGuardian}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null
      }
    />
  );
}
