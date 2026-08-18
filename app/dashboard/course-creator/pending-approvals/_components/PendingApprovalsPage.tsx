'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCourseCreator } from '@/context/course-creator-context';
import { extractPage } from '@/lib/api-helpers';
import { useQuery } from '@tanstack/react-query';
import { Building2, Clock3, ExternalLink, GraduationCap, Loader2, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useInstructorsByIds, useOrganisationsByIds } from '@/hooks/use-batched-lookups';
import type { CourseTrainingApplication, ProgramTrainingApplication } from '@/services/client';
import {
  searchProgramTrainingApplicationsOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { stripHtml } from '../../../../../src/features/dashboard/courses/shared/_components/courses-data';
import { AdminPageHeader, adminTheme, SectionCard, StatusBadge } from '../../../admin/_components/ui';

type ApplicantType = 'instructor' | 'organisation';

type ApplicantSummary = {
  uuid: string;
  type: ApplicantType;
  name: string;
  headline: string;
  location: string;
  avatarUrl?: string;
  latestStatus: string;
  pendingCount: number;
  courseCount: number;
  programCount: number;
  submittedAt?: string | Date;
};

function formatDate(value?: string | Date | null): string {
  if (!value) return '-';
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime())
    ? '-'
    : parsed.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
}

function latestStatus(items: Array<CourseTrainingApplication | ProgramTrainingApplication>) {
  const ordered = [...items].sort((a, b) => {
    const dateA = new Date(a.created_date ?? '').getTime();
    const dateB = new Date(b.created_date ?? '').getTime();
    return dateB - dateA;
  });
  return ordered[0]?.status ?? 'pending';
}

function ApplicantCard({ applicant }: { applicant: ApplicantSummary }) {
  const initials = applicant.name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className='border-border/60 bg-muted/20 rounded-md border p-4 shadow-sm'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='flex min-w-0 items-start gap-3'>
          <Avatar className='size-12 shrink-0'>
            <AvatarImage src={applicant.avatarUrl} />
            <AvatarFallback
              className={
                applicant.type === 'organisation'
                  ? 'bg-accent/10 text-accent-foreground'
                  : 'bg-primary/10 text-primary'
              }
            >
              {applicant.type === 'organisation' ? (
                <Building2 className='size-5' />
              ) : (
                initials || 'AP'
              )}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2 mb-1'>
              <p className='text-foreground truncate text-sm font-semibold'>{applicant.name}</p>
              {/* <StatusBadge status={applicant.latestStatus} /> */}
              <StatusBadge
                status={applicant.pendingCount > 0 ? 'pending' : applicant.latestStatus}
                label={
                  applicant.pendingCount > 0
                    ? `${applicant.pendingCount} pending`
                    : `Latest: ${applicant.latestStatus}`
                }
              />
              <StatusBadge
                tone={applicant.type === 'organisation' ? 'info' : 'warning'}
                label={applicant.type === 'organisation' ? 'Organisation' : 'Instructor'}
              />
            </div>
            <p className='text-muted-foreground truncate text-xs'>{stripHtml(applicant.headline) || 'No profile headline'}</p>
            <p className='text-muted-foreground mt-1 truncate text-xs'>{applicant.location}</p>
          </div>
        </div>

        <div className='flex shrink-0 flex-wrap gap-2'>
          <Button variant='outline' size='sm' asChild>
            <Link href={`/dashboard/course-creator/manage-applicant/${applicant.uuid}`}>
              <ExternalLink className='size-4' />
              Review applicant
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PendingApprovalsPage() {
  const { profile: courseCreator } = useCourseCreator();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ApplicantType>('instructor');

  const courseApplicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        searchParams: {
          course_creator_uuid: courseCreator?.uuid ?? '',
        },
        pageable: { page: 0, size: 100 },
      },
    }),
    enabled: !!courseCreator?.uuid,
    staleTime: 30_000,
  });

  const programApplicationsQuery = useQuery({
    ...searchProgramTrainingApplicationsOptions({
      query: {
        searchParams: {
          course_creator_uuid: courseCreator?.uuid ?? '',
        },
        pageable: { page: 0, size: 100 },
      },
    }),
    enabled: !!courseCreator?.uuid,
    staleTime: 30_000,
  });

  const courseApplications = extractPage<CourseTrainingApplication>(courseApplicationsQuery.data).items;
  const programApplications = extractPage<ProgramTrainingApplication>(programApplicationsQuery.data).items;
  const allApplications = [...courseApplications, ...programApplications];

  const applicantMap = useMemo(() => {
    const map = new Map<
      string,
      {
        uuid: string;
        type: ApplicantType;
        applications: Array<CourseTrainingApplication | ProgramTrainingApplication>;
      }
    >();

    for (const application of allApplications) {
      const uuid = application.applicant_uuid;
      const type = (application.applicant_type?.toLowerCase() as ApplicantType) ?? 'instructor';
      if (!uuid) continue;
      const current = map.get(uuid) ?? { uuid, type, applications: [] };
      current.applications.push(application);
      map.set(uuid, current);
    }

    return map;
  }, [allApplications]);

  const instructorIds = useMemo(
    () =>
      Array.from(applicantMap.values())
        .filter(applicant => applicant.type === 'instructor')
        .map(applicant => applicant.uuid),
    [applicantMap]
  );

  const organisationIds = useMemo(
    () =>
      Array.from(applicantMap.values())
        .filter(applicant => applicant.type === 'organisation')
        .map(applicant => applicant.uuid),
    [applicantMap]
  );

  const { instructorMap, isLoading: instructorsLoading } = useInstructorsByIds(instructorIds);
  const { organisationMap, isLoading: organisationsLoading } = useOrganisationsByIds(
    organisationIds
  );

  const applicants = useMemo<ApplicantSummary[]>(() => {
    return Array.from(applicantMap.values())
      .map(entry => {
        const applications = entry.applications;
        const latest = [...applications].sort((a, b) => {
          const dateA = new Date(a.created_date ?? '').getTime();
          const dateB = new Date(b.created_date ?? '').getTime();
          return dateB - dateA;
        })[0];

        if (entry.type === 'instructor') {
          const instructor = instructorMap[entry.uuid];
          return {
            uuid: entry.uuid,
            type: 'instructor',
            name: instructor?.full_name ?? 'Instructor applicant',
            headline: instructor?.professional_headline ?? instructor?.bio ?? 'Instructor profile',
            location: instructor?.formatted_location ?? instructor?.location ?? 'Location not listed',
            avatarUrl: instructor?.profile_picture_url,
            latestStatus: latestStatus(applications),
            pendingCount: applications.filter(app => app.status?.toLowerCase() === 'pending')
              .length,
            courseCount: applications.filter(app => 'course_uuid' in app).length,
            programCount: applications.filter(app => 'program_uuid' in app).length,
            submittedAt: latest?.created_date,
          };
        }

        const organisation = organisationMap[entry.uuid];
        return {
          uuid: entry.uuid,
          type: 'organisation',
          name: organisation?.name ?? 'Organisation applicant',
          headline: organisation?.description ?? 'Organisation profile',
          location: [organisation?.location, organisation?.country].filter(Boolean).join(', ') || 'Location not listed',
          avatarUrl: undefined,
          latestStatus: latestStatus(applications),
          pendingCount: applications.filter(app => app.status?.toLowerCase() === 'pending').length,
          courseCount: applications.filter(app => 'course_uuid' in app).length,
          programCount: applications.filter(app => 'program_uuid' in app).length,
          submittedAt: latest?.created_date,
        };
      })
      .filter(applicant => {
        if (typeFilter !== 'all' && applicant.type !== typeFilter) return false;
        if (!search.trim()) return true;
        const term = search.trim().toLowerCase();
        return [applicant.name, applicant.headline, applicant.location]
          .filter(Boolean)
          .some(value => value.toLowerCase().includes(term));
      })
      .sort((a, b) => {
        if (a.pendingCount !== b.pendingCount) return b.pendingCount - a.pendingCount;
        const aDate = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const bDate = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return bDate - aDate;
      });
  }, [applicantMap, courseApplications, organisationMap, instructorMap, programApplications, search, typeFilter]);

  const stats = useMemo(
    () => ({
      total: applicants.length,
      pending: applicants.reduce((sum, applicant) => sum + applicant.pendingCount, 0),
      instructors: applicants.filter(applicant => applicant.type === 'instructor').length,
      organisations: applicants.filter(applicant => applicant.type === 'organisation').length,
    }),
    [applicants]
  );

  const isLoading = courseApplicationsQuery.isLoading || programApplicationsQuery.isLoading;

  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Pending approvals'
          description='Review all instructor and organisation training applications from a single queue.'
        />

        <div className='grid gap-3 md:grid-cols-4'>
          <div className='bg-card border-border/70 flex items-center gap-3 rounded-md border p-4 shadow-sm'>
            <span className='border-border/70 bg-primary/10 text-primary flex size-10 items-center justify-center rounded-md border'>
              <Users className='size-5' />
            </span>
            <div>
              <p className='text-muted-foreground text-xs font-medium uppercase'>Applicants</p>
              <p className='text-foreground text-xl font-semibold tabular-nums'>{stats.total}</p>
            </div>
          </div>
          <div className='bg-card border-border/70 flex items-center gap-3 rounded-md border p-4 shadow-sm'>
            <span className='border-border/70 bg-warning/10 text-warning flex size-10 items-center justify-center rounded-md border'>
              <Clock3 className='size-5' />
            </span>
            <div>
              <p className='text-muted-foreground text-xs font-medium uppercase'>Pending</p>
              <p className='text-foreground text-xl font-semibold tabular-nums'>{stats.pending}</p>
            </div>
          </div>
          <div className='bg-card border-border/70 flex items-center gap-3 rounded-md border p-4 shadow-sm'>
            <span className='border-border/70 bg-primary/10 text-primary flex size-10 items-center justify-center rounded-md border'>
              <GraduationCap className='size-5' />
            </span>
            <div>
              <p className='text-muted-foreground text-xs font-medium uppercase'>Instructors</p>
              <p className='text-foreground text-xl font-semibold tabular-nums'>
                {stats.instructors}
              </p>
            </div>
          </div>
          <div className='bg-card border-border/70 flex items-center gap-3 rounded-md border p-4 shadow-sm'>
            <span className='border-border/70 bg-accent/10 text-accent-foreground flex size-10 items-center justify-center rounded-md border'>
              <Building2 className='size-5' />
            </span>
            <div>
              <p className='text-muted-foreground text-xs font-medium uppercase'>Organisations</p>
              <p className='text-foreground text-xl font-semibold tabular-nums'>
                {stats.organisations}
              </p>
            </div>
          </div>
        </div>

        <SectionCard
          title='Approval queue'
          description='Each applicant card groups all of their course and program applications.'
          actions={
            <div className='relative min-w-[240px]'>
              <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
              <Input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder='Search applicants...'
                className='pl-9'
              />
            </div>
          }
        >
          <Tabs value={typeFilter} onValueChange={value => setTypeFilter(value as typeof typeFilter)} className='space-y-4'>
            <TabsList className="h-auto flex-wrap gap-2 justify-start">
              {/* <TabsTrigger value="all">All · {stats.total}</TabsTrigger> */}
              <TabsTrigger value="instructor">
                Instructors · {stats.instructors}
              </TabsTrigger>
              <TabsTrigger value="organisation">
                Organisations · {stats.organisations}
              </TabsTrigger>
            </TabsList>

            <TabsContent value='all' className='mt-0 space-y-4'>
              {isLoading ? (
                <div className='flex h-48 items-center justify-center'>
                  <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
                </div>
              ) : applicants.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title='No pending applicants'
                  description='When instructors or organisations submit applications, they will appear here.'
                  variant='compact'
                />
              ) : (
                <div className='flex flex-col gap-4'>
                  {applicants.map(applicant => (
                    <ApplicantCard key={applicant.uuid} applicant={applicant} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value='instructor' className='mt-0 space-y-4'>
              {applicants.filter(applicant => applicant.type === 'instructor').length ? (
                <div className='flex flex-col gap-4'>
                  {applicants
                    .filter(applicant => applicant.type === 'instructor')
                    .map(applicant => (
                      <ApplicantCard key={applicant.uuid} applicant={applicant} />
                    ))}
                </div>
              ) : (
                <EmptyState
                  icon={GraduationCap}
                  title='No instructor applicants'
                  description='There are no instructor applications in the queue yet.'
                  variant='compact'
                />
              )}
            </TabsContent>

            <TabsContent value='organisation' className='mt-0 space-y-4'>
              {applicants.filter(applicant => applicant.type === 'organisation').length ? (
                <div className='flex flex-col gap-4'>
                  {applicants
                    .filter(applicant => applicant.type === 'organisation')
                    .map(applicant => (
                      <ApplicantCard key={applicant.uuid} applicant={applicant} />
                    ))}
                </div>
              ) : (
                <EmptyState
                  icon={Building2}
                  title='No organisation applicants'
                  description='There are no organisation applications in the queue yet.'
                  variant='compact'
                />
              )}
            </TabsContent>
          </Tabs>
        </SectionCard>
      </div>
    </main>
  );
}
