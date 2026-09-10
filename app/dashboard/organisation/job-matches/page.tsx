// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
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
import { useEffect, useMemo, useState } from 'react';

import { EmptyState } from '@/components/empty-state';
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
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity, extractList, extractPage } from '@/lib/api-helpers';
import { cn } from '@/lib/utils';
import type {
  ClassMarketplaceJob,
  ClassMarketplaceJobApplication,
  Instructor,
} from '@/services/client';
import {
  getInstructorByUuidOptions,
  getInstructorSkillsOptions,
  listJobApplicationsOptions,
  listJobsOptions,
} from '@/services/client/@tanstack/react-query.gen';

dayjs.extend(relativeTime);

const STAGE_STYLES: Record<HiringStage, string> = {
  pending: 'border-border bg-muted text-muted-foreground',
  shortlisted: 'border-sky-200 bg-sky-50 text-sky-700',
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
const initials = (name: string) =>
  name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

function useInstructor(uuid?: string) {
  const q = useQuery({
    ...getInstructorByUuidOptions({ path: { uuid: uuid ?? '' } }),
    enabled: Boolean(uuid),
    retry: false,
  });
  const instructor = extractEntity<Instructor>(q.data);
  return { loading: q.isLoading, instructor, name: instructor?.full_name ?? null };
}

function CandidateCard({
  app,
  index,
  jobUuid,
}: {
  app: ClassMarketplaceJobApplication;
  index: number;
  jobUuid: string;
}) {
  const { loading, instructor, name } = useInstructor(app.instructor_uuid);
  const displayName = name ?? 'Applicant';
  const skillsQuery = useQuery({
    ...getInstructorSkillsOptions({ path: { instructorUuid: app.instructor_uuid ?? '' } }),
    enabled: Boolean(app.instructor_uuid),
    retry: false,
  });
  const skills = extractList<Record<string, unknown>>(skillsQuery.data)
    .map(s => String(s.skill_name ?? s.name ?? ''))
    .filter(Boolean)
    .slice(0, 4);
  const match = matchScore(app);
  const accent = index === 0 ? 'bg-success' : index === 1 ? 'bg-teal-500' : 'bg-warning';
  const nextStep = nextStepFor(app.status);
  const href = `/dashboard/organisation/job-matches/${app.instructor_uuid}?job=${jobUuid}&application=${app.uuid}`;

  return (
    <Card className='relative overflow-hidden'>
      <span aria-hidden className={cn('absolute top-0 left-0 h-full w-1', accent)} />
      <CardHeader className='pb-3'>
        <div className='flex items-start gap-3'>
          {loading ? (
            <Skeleton className='h-14 w-14 rounded-full' />
          ) : (
            <Avatar className='border-card h-14 w-14 border-2 shadow'>
              {instructor?.profile_image_url && (
                <AvatarImage src={instructor.profile_image_url} alt={displayName} />
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
            <CheckCircle2 className='text-success h-3.5 w-3.5' />{' '}
            {skills.length ? 'Verified skills' : 'Credentials'}
          </p>
          <div className='flex flex-wrap gap-1.5'>
            {skills.length ? (
              skills.map(s => (
                <Badge
                  key={s}
                  variant='outline'
                  className='border-success/30 bg-success/10 text-success text-[11px]'
                >
                  {s}
                </Badge>
              ))
            ) : (
              <>
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
              </>
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
            <p className='text-muted-foreground text-[10px] tracking-wide uppercase'>Rate card</p>
            <p className='text-sm font-semibold'>
              {app.approved_rate != null ? (
                <>
                  KES {Number(app.approved_rate).toLocaleString()}
                  <span className='text-muted-foreground text-xs font-normal'> / hr</span>
                </>
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

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
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

export default function JobMatchesPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const jobsQuery = useQuery({
    ...listJobsOptions({
      query: { organisation_uuid: organisationUuid, pageable: { page: 0, size: 100 } },
    }),
    enabled: Boolean(organisationUuid),
  });
  const jobs = extractPage<ClassMarketplaceJob>(jobsQuery.data).items;

  const [selectedJobUuid, setSelectedJobUuid] = useState('');
  useEffect(() => {
    if (!selectedJobUuid && jobs.length) setSelectedJobUuid(jobs[0].uuid as string);
  }, [jobs, selectedJobUuid]);
  const selectedJob = jobs.find(j => j.uuid === selectedJobUuid);

  const applicationsQuery = useQuery({
    ...listJobApplicationsOptions({
      path: { jobUuid: selectedJobUuid },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: Boolean(selectedJobUuid),
  });
  const applications = extractPage<ClassMarketplaceJobApplication>(applicationsQuery.data).items;

  const topThree = useMemo(
    () =>
      [...applications]
        .sort(
          (a, b) =>
            matchScore(b) - matchScore(a) ||
            new Date(b.created_date ?? 0).getTime() - new Date(a.created_date ?? 0).getTime()
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
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <PageHeader
        eyebrow='Onboarding'
        title='Job Matches'
        description='Candidates for your open instructor postings, ranked by verification. Open an applicant to decide on them.'
        action={
          jobs.length ? (
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground hidden text-xs font-medium sm:inline'>
                Job posting
              </span>
              <Select value={selectedJobUuid} onValueChange={setSelectedJobUuid}>
                <SelectTrigger className='h-9 w-[220px] sm:w-[260px]'>
                  <SelectValue placeholder='Select a posting' />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map(j => (
                    <SelectItem key={j.uuid} value={j.uuid as string}>
                      {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : undefined
        }
      />

      {jobsQuery.isLoading ? (
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className='h-64 w-full rounded-xl' />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title='No job postings yet'
          description='Post an instructor job from a course to start receiving and ranking candidates here.'
        />
      ) : (
        <>
          <Card className='from-primary/10 to-primary/5 border-teal-200 bg-gradient-to-br'>
            <CardContent className='flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-start gap-3'>
                <div className='flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-white'>
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
                    className='bg-card border-teal-300 text-teal-800'
                  >
                    #{i + 1} · {matchScore(c)}%
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {applicationsQuery.isLoading ? (
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className='h-64 w-full rounded-xl' />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title='No candidates yet'
              description='Applications to this posting will appear here.'
            />
          ) : (
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {topThree.map((app, idx) => (
                <CandidateCard key={app.uuid} app={app} index={idx} jobUuid={selectedJobUuid} />
              ))}
            </div>
          )}

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
                    label='Open reqs'
                    value={jobs.length}
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
                        <CandidateRow key={app.uuid} app={app} jobUuid={selectedJobUuid} />
                      ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function CandidateRow({ app, jobUuid }: { app: ClassMarketplaceJobApplication; jobUuid: string }) {
  const { loading, name } = useInstructor(app.instructor_uuid);
  const displayName = name ?? 'Applicant';
  const nextStep = nextStepFor(app.status);
  const href = `/dashboard/organisation/job-matches/${app.instructor_uuid}?job=${jobUuid}&application=${app.uuid}`;
  return (
    <div className='flex flex-wrap items-center gap-3 rounded-md border p-2.5'>
      {loading ? (
        <Skeleton className='h-8 w-8 rounded-full' />
      ) : (
        <Avatar className='h-8 w-8'>
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
          {app.approved_rate != null && ` · KES ${Number(app.approved_rate).toLocaleString()}/hr`}
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
