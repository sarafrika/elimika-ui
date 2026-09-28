'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCourseCreator } from '@/context/course-creator-context';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { useQuery } from '@tanstack/react-query';
import { Building2, Clock3, GraduationCap, Layers, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { ApplicantReviewSheet } from './ApplicantReviewSheet';
import { applicationKey, type ReviewApplication } from './approval-queue';

import { SectionCard, StatusBadge, surfaceTheme } from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { useInstructorsByIds, useOrganisationsByIds } from '@/hooks/use-batched-lookups';
import { APPROVAL_QUERY_FRESHNESS, STALE_TIMES } from '@/lib/query-client';
import type { CourseTrainingApplication, ProgramTrainingApplication } from '@/services/client';
import {
  searchProgramTrainingApplicationsOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { stripHtml } from '../../../../../src/features/dashboard/courses/shared/_components/courses-data';

type ApplicantType = 'instructor' | 'organisation';

export type ApplicantSummary = {
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

function latestStatus(items: Array<CourseTrainingApplication | ProgramTrainingApplication>) {
  const ordered = [...items].sort((a, b) => {
    const dateA = new Date(a.created_date ?? '').getTime();
    const dateB = new Date(b.created_date ?? '').getTime();
    return dateB - dateA;
  });
  return ordered[0]?.status ?? 'pending';
}

function ApplicantCard({
  applicant,
  onReview,
}: {
  applicant: ApplicantSummary;
  onReview: () => void;
}) {
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
            <AvatarImage src={toAuthenticatedMediaUrl(applicant.avatarUrl) || undefined} />
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
            <div className='mb-1 flex flex-wrap items-center gap-2'>
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
            <p className='text-muted-foreground truncate text-xs'>
              {stripHtml(applicant.headline) || 'No profile headline'}
            </p>
            <p className='text-muted-foreground mt-1 truncate text-xs'>{applicant.location}</p>
          </div>
        </div>

        <div className='flex shrink-0 flex-wrap gap-2'>
          <Button variant='outline' size='sm' onClick={onReview}>
            Review applicant
          </Button>
        </div>

        {/* <Button variant='outline' size='sm' asChild>
          <Link href={`/dashboard/course-creator/manage-applicant/${applicant.uuid}`}>
            <ExternalLink className='size-4' />
            Review applicant
          </Link>
        </Button> */}
      </div>
    </div>
  );
}

export default function PendingApprovalsPage() {
  const { profile: courseCreator } = useCourseCreator();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [selected, setSelected] = useState<ApplicantSummary | null>(null);
  const [decisions, setDecisions] = useState<Record<string, 'approved' | 'rejected' | 'revoked'>>(
    {}
  );
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
    ...APPROVAL_QUERY_FRESHNESS,
    staleTime: STALE_TIMES.live,
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
    ...APPROVAL_QUERY_FRESHNESS,
    staleTime: STALE_TIMES.live,
  });

  const reviewApplications = useMemo<ReviewApplication[]>(
    () =>
      [
        ...(courseApplicationsQuery.data?.error || courseApplicationsQuery.data?.success === false
          ? []
          : (courseApplicationsQuery.data?.data?.content ?? [])
        ).map(application => ({
          kind: 'course' as const,
          application,
          parentUuid: application.course_uuid,
        })),
        ...(programApplicationsQuery.data?.error || programApplicationsQuery.data?.success === false
          ? []
          : (programApplicationsQuery.data?.data?.content ?? [])
        ).map(application => ({
          kind: 'program' as const,
          application,
          parentUuid: application.program_uuid,
        })),
      ].map(entry => ({
        ...entry,
        application: {
          ...entry.application,
          status: decisions[applicationKey(entry)] ?? entry.application.status,
        },
      })),
    [courseApplicationsQuery.data, programApplicationsQuery.data, decisions]
  );
  const allApplications = useMemo(
    () => reviewApplications.map(entry => entry.application),
    [reviewApplications]
  );

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
      const type: ApplicantType =
        application.applicant_type === 'organisation' ? 'organisation' : 'instructor';
      if (!uuid) continue;
      const current = map.get(`${type}:${uuid}`) ?? { uuid, type, applications: [] };
      current.applications.push(application);
      map.set(`${type}:${uuid}`, current);
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
  const { organisationMap, isLoading: organisationsLoading } =
    useOrganisationsByIds(organisationIds);

  const applicants = useMemo<ApplicantSummary[]>(() => {
    return Array.from(applicantMap.values())
      .map<ApplicantSummary>(entry => {
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
            location:
              instructor?.location_name ?? instructor?.formatted_location ?? 'Location not listed',
            avatarUrl:
              instructor &&
                'profile_picture_url' in instructor &&
                typeof instructor.profile_picture_url === 'string'
                ? instructor.profile_picture_url
                : undefined,
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
          location:
            [organisation?.location, organisation?.country].filter(Boolean).join(', ') ||
            'Location not listed',
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
        if (!deferredSearch.trim()) return true;
        const term = deferredSearch.trim().toLowerCase();
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
  }, [applicantMap, organisationMap, instructorMap, deferredSearch, typeFilter]);

  const stats = useMemo(() => {
    const allApplicants = Array.from(applicantMap.values());

    return {
      total: allApplicants.length,
      pending: allApplicants.reduce(
        (sum, applicant) =>
          sum +
          applicant.applications.filter(
            application => application.status?.toLowerCase() === 'pending'
          ).length,
        0
      ),
      instructors: allApplicants.filter(applicant => applicant.type === 'instructor').length,
      organisations: allApplicants.filter(applicant => applicant.type === 'organisation').length,
    };
  }, [applicantMap]);

  const isLoading =
    !courseCreator?.uuid ||
    courseApplicationsQuery.isLoading ||
    programApplicationsQuery.isLoading ||
    instructorsLoading ||
    organisationsLoading;
  const pendingRateUpdates = allApplications.filter(
    application => application.status === 'approved' && application.pending_rate_update_uuid
  ).length;

  return (
    <main className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
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

        {pendingRateUpdates > 0 ? (
          <div className='border-primary/30 bg-primary/5 flex flex-wrap items-center justify-between gap-3 rounded-md border p-4'>
            <p className='text-foreground flex items-center gap-2 text-sm'>
              <Layers className='text-primary size-4' />
              {pendingRateUpdates} approved{' '}
              {pendingRateUpdates === 1 ? 'applicant has' : 'applicants have'} rate card updates
              waiting for you.
            </p>
            <Button size='sm' asChild>
              <Link href={dashboardUrl('course_creator', 'training-applications?tab=rate-updates')}>
                Review rate card updates
              </Link>
            </Button>
          </div>
        ) : null}

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
                aria-label='Search applicants'
                className='pl-9'
              />
            </div>
          }
        >
          {courseApplicationsQuery.isError ||
            programApplicationsQuery.isError ||
            courseApplicationsQuery.data?.error ||
            programApplicationsQuery.data?.error ||
            courseApplicationsQuery.data?.success === false ||
            programApplicationsQuery.data?.success === false ? (
            <EmptyState
              title='Could not load applications'
              description='Please retry before reviewing the queue.'
              action={
                <Button
                  variant='outline'
                  onClick={() => {
                    void courseApplicationsQuery.refetch();
                    void programApplicationsQuery.refetch();
                  }}
                >
                  Retry
                </Button>
              }
            />
          ) : (
            <Tabs
              value={typeFilter}
              onValueChange={value => setTypeFilter(value as typeof typeFilter)}
              className='space-y-4'
            >
              <TabsList className='h-auto flex-wrap justify-start gap-2'>
                {/* <TabsTrigger value="all">All · {stats.total}</TabsTrigger> */}
                <TabsTrigger value='instructor'>Instructors · {stats.instructors}</TabsTrigger>
                <TabsTrigger value='organisation'>
                  Organisations · {stats.organisations}
                </TabsTrigger>
              </TabsList>

              <TabsContent value='instructor' className='mt-0 space-y-4'>
                {isLoading ? (
                  <Skeleton className='h-28 w-full rounded-md' />
                ) : applicants.filter(applicant => applicant.type === 'instructor').length ? (
                  <div className='flex flex-col gap-4'>
                    {applicants
                      .filter(applicant => applicant.type === 'instructor')
                      .map(applicant => (
                        <ApplicantCard
                          key={applicant.uuid}
                          applicant={applicant}
                          onReview={() => setSelected(applicant)}
                        />
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
                {isLoading ? (
                  <Skeleton className='h-28 w-full rounded-md' />
                ) : applicants.filter(applicant => applicant.type === 'organisation').length ? (
                  <div className='flex flex-col gap-4'>
                    {applicants
                      .filter(applicant => applicant.type === 'organisation')
                      .map(applicant => (
                        <ApplicantCard
                          key={applicant.uuid}
                          applicant={applicant}
                          onReview={() => setSelected(applicant)}
                        />
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
          )}
        </SectionCard>
      </div>
      {selected && courseCreator?.uuid ? (
        <ApplicantReviewSheet
          applicant={selected}
          instructor={instructorMap[selected.uuid]}
          organisation={organisationMap[selected.uuid]}
          applications={reviewApplications}
          creatorUuid={courseCreator.uuid}
          onClose={() => setSelected(null)}
          onDecided={(entry, status) =>
            setDecisions(previous => ({ ...previous, [applicationKey(entry)]: status }))
          }
        />
      ) : null}
    </main>
  );
}
