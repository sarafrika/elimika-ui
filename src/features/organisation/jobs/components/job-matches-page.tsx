'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Inbox,
  Link as LinkIcon,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useMemo } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { useInstructorsByIds, useUsersByIds } from '@/hooks/use-batched-lookups';
import { STALE_TIMES } from '@/lib/query-client';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { PageHeader } from '@/components/page-header';
import {
  HIRING_STAGES,
  type HiringStage,
  isClassCreatedStatus,
  nextStepFor,
  stageIndexOf,
  statusLabel,
} from '@/components/profile-job-marketplace/application-status';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRate, formatRateAmount } from '@/lib/rate-card';
import { cn } from '@/lib/utils';
import type { ClassMarketplaceJobApplication, Instructor } from '@/services/client';
import {
  getJobOptions,
  listJobApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { surfaceTheme } from '@/components/data-display';
import { jobHref, jobMatchCandidateHref, jobsHref } from '../lib/job-routes';

dayjs.extend(relativeTime);

const STAGE_STYLES: Record<HiringStage, string> = {
  pending: 'border-border bg-muted text-muted-foreground',
  shortlisted: 'border-info/30 bg-info/10 text-info',
  interviewing: 'border-warning/30 bg-warning/10 text-warning',
  offered: 'border-primary/30 bg-primary/10 text-primary',
  hired: 'border-success/30 bg-success/10 text-success',
};
const CLASS_CREATED_STYLE = 'border-success/30 bg-success/10 text-success';
const CLOSED_STYLE = 'border-destructive/30 bg-destructive/10 text-destructive';

const badgeStyleFor = (status?: string) => {
  const stage = HIRING_STAGES[stageIndexOf(status)];
  if (stage) return STAGE_STYLES[stage];
  return isClassCreatedStatus(status) ? CLASS_CREATED_STYLE : CLOSED_STYLE;
};
// A created class sits past the whole funnel; anything else off it has left, so it sorts last.
const rankOf = (status?: string) =>
  isClassCreatedStatus(status) ? HIRING_STAGES.length : stageIndexOf(status);
const matchScore = (a: ClassMarketplaceJobApplication) =>
  (a.instructor_admin_verified ? 50 : 0) + (a.training_approved ? 50 : 0);
const matchColor = (n: number) =>
  n >= 80 ? 'text-success' : n >= 50 ? 'text-warning' : 'text-muted-foreground';
// A job without a known basis still shows the amount, never a guessed unit.
const approvedRateLabel = (amount: number, basis?: string | null) =>
  basis ? formatRate(Number(amount), basis) : formatRateAmount(Number(amount));
const initials = (name: string) =>
  name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

function CandidateCard({
  app,
  index,
  jobUuid,
  rateBasis,
  instructor,
  profileImageUrl,
  loading,
}: {
  app: ClassMarketplaceJobApplication;
  index: number;
  jobUuid: string;
  rateBasis?: string | null;
  instructor?: Instructor;
  profileImageUrl?: string | null;
  loading: boolean;
}) {
  const displayName = instructor?.full_name ?? 'Applicant';
  const match = matchScore(app);
  const accent = index === 0 ? 'bg-success' : index === 1 ? 'bg-primary' : 'bg-warning';
  const nextStep = nextStepFor(app.status);
  const href = jobMatchCandidateHref(jobUuid, app.instructor_uuid ?? '', app.uuid ?? '');

  return (
    <Card className='relative overflow-hidden'>
      <span aria-hidden className={cn('absolute top-0 left-0 h-full w-1', accent)} />
      <CardHeader className='pb-3'>
        <div className='flex items-start gap-3'>
          {loading ? (
            <Skeleton className='h-14 w-14 rounded-full' />
          ) : (
            <Avatar className='border-card h-14 w-14 border-2 shadow'>
              {profileImageUrl && (
                <AvatarImage src={toAuthenticatedMediaUrl(profileImageUrl)} alt={displayName} />
              )}
              <AvatarFallback className='bg-primary/10 text-primary font-semibold'>
                {initials(displayName)}
              </AvatarFallback>
            </Avatar>
          )}
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-2'>
              <CardTitle className='truncate text-base'>
                {loading ? <Skeleton className='h-4 w-28' /> : displayName}
              </CardTitle>
              <Badge variant='secondary' className='text-[10px]'>
                #{index + 1}
              </Badge>
            </div>
            <p className='text-muted-foreground mt-0.5 truncate text-xs'>
              {instructor?.professional_headline ?? 'Instructor'}
            </p>
          </div>
          <div className='text-right'>
            <div className={cn('text-2xl leading-none font-bold', matchColor(match))}>{match}%</div>
            <p className='text-muted-foreground text-[10px] tracking-wide uppercase'>match</p>
          </div>
        </div>
        <Progress value={match} className='mt-3 h-1.5' />
      </CardHeader>
      <CardContent className='space-y-3 pt-0 text-sm'>
        <div>
          <p className='text-muted-foreground mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase'>
            <CheckCircle2 className='text-success h-3.5 w-3.5' /> Credentials
          </p>
          <div className='flex flex-wrap gap-1.5'>
            {app.instructor_admin_verified && (
              <Badge
                variant='outline'
                className='border-success/30 bg-success/10 text-success text-[11px]'
              >
                <BadgeCheck className='mr-1 h-3 w-3' /> Admin verified
              </Badge>
            )}
            {app.training_approved && (
              <Badge
                variant='outline'
                className='border-success/30 bg-success/10 text-success text-[11px]'
              >
                <CheckCircle2 className='mr-1 h-3 w-3' /> Training approved
              </Badge>
            )}
            {!app.instructor_admin_verified && !app.training_approved && (
              <span className='text-muted-foreground text-xs'>Verification pending</span>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 gap-2 text-xs'>
          {instructor?.professional_headline && (
            <div className='flex items-start gap-2'>
              <GraduationCap className='text-primary mt-0.5 h-3.5 w-3.5 shrink-0' />
              <span className='text-muted-foreground'>{instructor.professional_headline}</span>
            </div>
          )}
          <div className='flex items-start gap-2'>
            <Briefcase className='text-primary mt-0.5 h-3.5 w-3.5 shrink-0' />
            <span className='text-muted-foreground'>
              Applied {app.created_date ? dayjs(app.created_date).fromNow() : '—'}
            </span>
          </div>
          {instructor?.website && (
            <a
              href={instructor.website}
              target='_blank'
              rel='noreferrer'
              className='text-primary inline-flex items-center gap-1.5 font-medium hover:underline'
            >
              <LinkIcon className='h-3.5 w-3.5' /> Portfolio <ExternalLink className='h-3 w-3' />
            </a>
          )}
        </div>

        <Separator />

        <div className='flex items-center justify-between'>
          <div>
            <p className='text-muted-foreground text-[10px] tracking-wide uppercase'>
              Approved rate
            </p>
            <p className='text-sm font-semibold'>
              {app.approved_rate != null ? (
                approvedRateLabel(app.approved_rate, rateBasis)
              ) : (
                <span className='text-muted-foreground'>—</span>
              )}
            </p>
          </div>
          <Badge variant='outline' className={cn('text-xs', badgeStyleFor(app.status))}>
            {statusLabel(app.status)}
          </Badge>
        </div>

        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground text-xs'>
            {nextStep ? `Next step: ${nextStep.label}` : 'No further steps'}
          </span>
          <Button size='sm' variant='outline' className='ml-auto' asChild>
            <Link href={href}>
              {nextStep ? 'Review applicant' : 'Open applicant'}
              <ArrowRight className='ml-2 h-3.5 w-3.5' />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className='flex items-center gap-2'>
      <div className='bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full'>
        {icon}
      </div>
      <div>
        <p className='text-muted-foreground text-[10px] tracking-wide uppercase'>{label}</p>
        <p className='text-sm font-semibold'>{value}</p>
      </div>
    </div>
  );
}

export function JobMatchesPage({ jobUuid }: { jobUuid: string }) {
  const selectedJobUuid = jobUuid;
  const jobQuery = useQuery({
    ...getJobOptions({ path: { jobUuid } }),
    enabled: Boolean(jobUuid),
    staleTime: STALE_TIMES.entity,
  });
  const selectedJob = jobQuery.error ? null : jobQuery.data?.data;

  const applicationsQuery = useQuery({
    ...listJobApplicationsOptions({
      path: { jobUuid },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: Boolean(jobUuid) && Boolean(selectedJob),
    staleTime: STALE_TIMES.live,
  });
  const applications = useMemo(
    () => (applicationsQuery.error ? [] : (applicationsQuery.data?.data?.content ?? [])),
    [applicationsQuery.data, applicationsQuery.error]
  );
  const instructorIds = useMemo(
    () => applications.map(application => application.instructor_uuid ?? '').filter(Boolean),
    [applications]
  );
  const { instructorMap, isLoading: instructorsLoading } = useInstructorsByIds(instructorIds);
  const userIds = useMemo(
    () =>
      Object.values(instructorMap)
        .map(instructor => instructor.user_uuid)
        .filter(Boolean),
    [instructorMap]
  );
  const { userMap } = useUsersByIds(userIds);

  const topThree = useMemo(
    () =>
      [...applications]
        .sort(
          (a, b) =>
            matchScore(b) - matchScore(a) ||
            dayjs(b.created_date ?? 0).valueOf() - dayjs(a.created_date ?? 0).valueOf()
        )
        .slice(0, 3),
    [applications]
  );
  const pipeline = useMemo(() => {
    const counts = Object.fromEntries(HIRING_STAGES.map(s => [s, 0])) as Record<
      HiringStage,
      number
    >;
    for (const a of applications) {
      const stage = HIRING_STAGES[stageIndexOf(a.status)];
      if (stage) counts[stage] += 1;
    }
    return counts;
  }, [applications]);
  const classesCreated = useMemo(
    () => applications.filter(a => isClassCreatedStatus(a.status)).length,
    [applications]
  );

  return (
    <div className={`${surfaceTheme.pageWide} space-y-6 py-4`}>
      <Button asChild variant='ghost' size='sm'>
        <Link href={jobsHref()}>
          <ArrowLeft className='h-4 w-4' /> Back to jobs
        </Link>
      </Button>
      <PageHeader
        eyebrow='Jobs'
        title='Job Matches'
        description={selectedJob?.title ?? 'Applicants for this job posting'}
        action={
          <Button asChild variant='outline'>
            <Link href={jobHref(jobUuid)}>View job details</Link>
          </Button>
        }
      />

      <AsyncSection
        loading={jobQuery.isLoading}
        error={jobQuery.error}
        onRetry={() => jobQuery.refetch()}
        errorTitle='Couldn’t load this job'
        skeleton={<Skeleton className='h-64 w-full rounded-xl' />}
        empty={!selectedJob}
        emptyState={
          <EmptyState
            icon={Briefcase}
            title='Job not found'
            description='This job no longer exists or isn’t visible to your organisation.'
          />
        }
      >
        {selectedJob ? (
          <>
            <Card className='from-primary/10 to-primary/5 border-primary/30 bg-gradient-to-br'>
              <CardContent className='flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-start gap-3'>
                  <div className='bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-full'>
                    <Sparkles className='h-4 w-4' />
                  </div>
                  <div>
                    <p className='text-foreground text-sm font-semibold'>
                      {applications.length
                        ? `Top ${topThree.length} candidate${topThree.length === 1 ? '' : 's'} for `
                        : 'No candidates yet for '}
                      <span className='font-bold'>{selectedJob?.title ?? '—'}</span>
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      Ranked by admin verification and training approval against this posting.
                    </p>
                  </div>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {topThree.map((c, i) => (
                    <Badge
                      key={c.uuid}
                      variant='outline'
                      className='bg-card border-primary/30 text-primary'
                    >
                      #{i + 1} · {matchScore(c)}%
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <AsyncSection
              loading={applicationsQuery.isLoading}
              error={applicationsQuery.error}
              onRetry={() => applicationsQuery.refetch()}
              errorTitle='Couldn’t load applicants'
              skeleton={<Skeleton className='h-64 w-full rounded-xl' />}
              empty={applications.length === 0}
              emptyState={
                <EmptyState
                  icon={Inbox}
                  title='No candidates yet'
                  description='Applications to this posting will appear here.'
                />
              }
            >
              <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                {topThree.map((app, idx) => (
                  <CandidateCard
                    key={app.uuid}
                    app={app}
                    index={idx}
                    jobUuid={selectedJobUuid}
                    rateBasis={selectedJob?.rate_basis}
                    instructor={instructorMap[app.instructor_uuid ?? '']}
                    profileImageUrl={
                      userMap[instructorMap[app.instructor_uuid ?? '']?.user_uuid ?? '']
                        ?.profile_image_url
                    }
                    loading={instructorsLoading}
                  />
                ))}
              </div>
            </AsyncSection>

            <Card>
              <CardHeader className='pb-3'>
                <div className='flex flex-wrap items-end justify-between gap-3'>
                  <div>
                    <CardTitle className='text-base'>Recruitment pipeline</CardTitle>
                    <p className='text-muted-foreground mt-0.5 text-xs'>
                      Candidate stages for {selectedJob?.title ?? 'this posting'}
                    </p>
                  </div>
                  <div className='flex gap-4'>
                    <Stat
                      icon={<Briefcase className='h-4 w-4' />}
                      label='Job status'
                      value={selectedJob.status ?? '—'}
                    />
                    <Stat
                      icon={<TrendingUp className='h-4 w-4' />}
                      label='Candidates'
                      value={applications.length}
                    />
                    <Stat
                      icon={<CheckCircle2 className='h-4 w-4' />}
                      label='Classes created'
                      value={classesCreated}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 gap-3 sm:grid-cols-5'>
                  {HIRING_STAGES.map(stage => (
                    <div key={stage} className={cn('rounded-lg border p-3', STAGE_STYLES[stage])}>
                      <div className='flex items-center justify-between'>
                        <p className='text-xs font-semibold tracking-wide uppercase'>
                          {statusLabel(stage)}
                        </p>
                        <Award className='h-3.5 w-3.5 opacity-60' />
                      </div>
                      <p className='mt-1 text-2xl font-bold'>{pipeline[stage]}</p>
                    </div>
                  ))}
                </div>

                {applications.length > 0 && (
                  <>
                    <Separator className='my-5' />
                    <div className='space-y-2'>
                      <p className='text-muted-foreground text-xs font-semibold tracking-wide uppercase'>
                        Candidates for {selectedJob?.title ?? 'this posting'}
                      </p>
                      {[...applications]
                        .sort((a, b) => rankOf(b.status) - rankOf(a.status))
                        .map(app => (
                          <CandidateRow
                            key={app.uuid}
                            app={app}
                            jobUuid={selectedJobUuid}
                            rateBasis={selectedJob?.rate_basis}
                            instructor={instructorMap[app.instructor_uuid ?? '']}
                            profileImageUrl={
                              userMap[instructorMap[app.instructor_uuid ?? '']?.user_uuid ?? '']
                                ?.profile_image_url
                            }
                            loading={instructorsLoading}
                          />
                        ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </AsyncSection>
    </div>
  );
}

function CandidateRow({
  app,
  jobUuid,
  rateBasis,
  instructor,
  profileImageUrl,
  loading,
}: {
  app: ClassMarketplaceJobApplication;
  jobUuid: string;
  rateBasis?: string | null;
  instructor?: Instructor;
  profileImageUrl?: string | null;
  loading: boolean;
}) {
  const displayName = instructor?.full_name ?? 'Applicant';
  const nextStep = nextStepFor(app.status);
  const href = jobMatchCandidateHref(jobUuid, app.instructor_uuid ?? '', app.uuid ?? '');
  return (
    <div className='flex flex-wrap items-center gap-3 rounded-md border p-2.5'>
      {loading ? (
        <Skeleton className='h-8 w-8 rounded-full' />
      ) : (
        <Avatar className='h-8 w-8'>
          {profileImageUrl && (
            <AvatarImage src={toAuthenticatedMediaUrl(profileImageUrl)} alt={displayName} />
          )}
          <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
            {initials(displayName)}
          </AvatarFallback>
        </Avatar>
      )}
      <div className='min-w-0 flex-1'>
        <Link href={href} className='block truncate text-sm font-medium hover:underline'>
          {loading ? <Skeleton className='h-3.5 w-24' /> : displayName}
        </Link>
        <p className='text-muted-foreground truncate text-xs'>
          Applied {app.created_date ? dayjs(app.created_date).fromNow() : '—'}
          {app.approved_rate != null && ` · ${approvedRateLabel(app.approved_rate, rateBasis)}`}
        </p>
      </div>
      <Badge variant='outline' className={cn('text-xs', badgeStyleFor(app.status))}>
        {statusLabel(app.status)}
      </Badge>
      {/* Every decision is taken on the applicant's own page, so the row only points at it. */}
      <Button size='sm' variant='ghost' className='h-8' asChild>
        <Link href={href}>
          {nextStep ? `Review · ${nextStep.label}` : 'Open applicant'}
          <ArrowRight className='ml-2 h-3.5 w-3.5' />
        </Link>
      </Button>
    </div>
  );
}
