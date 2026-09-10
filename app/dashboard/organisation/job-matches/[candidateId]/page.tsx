// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  Briefcase,
  CalendarClock,
  Check,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Link as LinkIcon,
  ThumbsDown,
  TriangleAlert,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AsyncSection } from '@/components/data/async-section';
import {
  canRejectApplication,
  HIRING_STAGES,
  isClassCreatedStatus,
  isExitStatus,
  nextStepFor,
  stageIndexOf,
  statusLabel,
} from '@/components/profile-job-marketplace/application-status';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { extractEntity, extractList } from '@/lib/api-helpers';
import { getErrorMessage } from '@/lib/error-utils';
import { cn } from '@/lib/utils';
import type { ClassMarketplaceJobApplication, Instructor } from '@/services/client';
import { invalidateJobApplicationWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';
import {
  getInstructorByUuidOptions,
  getInstructorEducationOptions,
  getInstructorExperienceOptions,
  getInstructorMembershipsOptions,
  getInstructorSkillsOptions,
  listJobApplicationsOptions,
  reviewApplicationMutation,
} from '@/services/client/@tanstack/react-query.gen';

dayjs.extend(relativeTime);

const HIRED_INDEX = HIRING_STAGES.length - 1;
// The endpoint is multiplexed on `action`, so the toast has to name the step actually taken.
const MOVE_MESSAGES: Record<string, string> = {
  shortlist: 'Candidate shortlisted.',
  interview: 'Interview scheduled. The candidate has been notified.',
  offer: 'Offer sent to the candidate.',
  hire: 'Hired. They are a member of your organisation now — create the class to put them on the job.',
  reject: 'Candidate rejected. They have been notified.',
};
const stageStyles: Record<string, string> = {
  pending: 'border-border bg-muted text-muted-foreground',
  shortlisted: 'border-sky-200 bg-sky-50 text-sky-700',
  interviewing: 'border-warning/30 bg-warning/10 text-warning',
  offered: 'border-primary/30 bg-primary/10 text-primary',
  hired: 'border-success/30 bg-success/10 text-success',
  assigned: 'border-success/30 bg-success/10 text-success',
};
const matchScore = (a?: ClassMarketplaceJobApplication) =>
  (a?.instructor_admin_verified ? 50 : 0) + (a?.training_approved ? 50 : 0);
const initials = (name: string) =>
  name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
const stripHtml = (html?: string) =>
  (html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function toUtcLocalDateTime(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19);
}

function toDateTimeInputValue(value?: string | Date | null) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className='flex items-center gap-3 p-4'>
        <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600'>
          {icon}
        </div>
        <div>
          <div className='text-muted-foreground text-xs tracking-wide uppercase'>{label}</div>
          <div className='text-base font-semibold'>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className='flex items-start gap-2'>
      <span className='text-muted-foreground mt-0.5'>{icon}</span>
      <div>
        <p className='text-muted-foreground text-[10px] tracking-wide uppercase'>{label}</p>
        <p className='text-sm font-medium'>{value}</p>
      </div>
    </div>
  );
}

/**
 * The whole funnel on one line: what this candidate has been through, where they are, what is
 * left. Creating the class comes after the hire and is not a stage, so it never appears here.
 */
function StageRail({ status }: { status?: string }) {
  const closed = isExitStatus(status);
  // A created class means the funnel was walked to its end, so every stage sits behind it.
  const reached = isClassCreatedStatus(status) ? HIRED_INDEX : stageIndexOf(status);

  return (
    <Card>
      <CardContent className='space-y-3 p-5'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <h2 className='text-sm font-semibold'>Where this candidate stands</h2>
          <Badge
            variant='outline'
            className={cn('text-xs', stageStyles[status ?? ''] ?? 'text-destructive')}
          >
            {statusLabel(status)}
          </Badge>
        </div>
        <ol className='flex flex-wrap items-center gap-y-3'>
          {HIRING_STAGES.map((stage, index) => {
            const behind = !closed && index < reached;
            const here = !closed && index === reached;
            return (
              <li key={stage} className='flex items-center'>
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                    behind
                      ? 'border-teal-500 bg-teal-500 text-white'
                      : here
                        ? 'border-teal-600 bg-teal-50 text-teal-700'
                        : 'border-border text-muted-foreground'
                  )}
                  aria-current={here ? 'step' : undefined}
                >
                  {behind ? <Check className='h-3.5 w-3.5' /> : index + 1}
                </span>
                <span
                  className={cn('ml-2 text-sm', here ? 'font-medium' : 'text-muted-foreground')}
                >
                  {statusLabel(stage)}
                </span>
                {index < HIRED_INDEX ? (
                  <span
                    aria-hidden
                    className={cn('mx-3 h-px w-8', behind ? 'bg-teal-500' : 'bg-border')}
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
        <p className='text-muted-foreground text-xs'>
          {closed
            ? `This application closed as ${statusLabel(status)}, so no stage remains.`
            : 'Hiring is the last decision. Creating the class is what puts the hired instructor on the job.'}
        </p>
      </CardContent>
    </Card>
  );
}

/** A refused transition moves nothing, so the server's own reason stays on screen beside the control. */
function TransitionError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role='alert'
      className='border-destructive/50 bg-destructive/10 flex items-start gap-2 rounded-md border p-3 text-sm'
    >
      <TriangleAlert className='text-destructive mt-0.5 h-4 w-4 shrink-0' />
      <span>{message}</span>
    </div>
  );
}

/** A disabled control owes the organisation the reason, so the gate is named where the button is. */
function HireBlockedNotice({ blocked }: { blocked: boolean }) {
  if (!blocked) return null;
  return (
    <div className='border-warning/60 bg-warning/10 text-foreground flex items-start gap-2 rounded-md border p-3 text-sm'>
      <TriangleAlert className='text-warning mt-0.5 h-4 w-4 shrink-0' />
      <span>Not approved to train this course or program yet — hiring is blocked.</span>
    </div>
  );
}

export default function CandidateDetailPage() {
  const params = useParams<{ candidateId: string }>();
  const instructorUuid = params?.candidateId ?? '';
  const search = useSearchParams();
  const jobUuid = search.get('job') ?? '';
  const applicationUuid = search.get('application') ?? '';
  const router = useRouter();
  const queryClient = useQueryClient();
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [interviewAt, setInterviewAt] = useState('');
  const [interviewNote, setInterviewNote] = useState('');
  const [transitionError, setTransitionError] = useState<string | null>(null);

  const instructorQuery = useQuery({
    ...getInstructorByUuidOptions({ path: { uuid: instructorUuid } }),
    enabled: Boolean(instructorUuid),
  });
  const instructor = extractEntity<Instructor>(instructorQuery.data);
  const name = instructor?.full_name ?? 'Candidate';

  const skillsQuery = useQuery({
    ...getInstructorSkillsOptions({ path: { instructorUuid } }),
    enabled: Boolean(instructorUuid),
    retry: false,
  });
  const experienceQuery = useQuery({
    ...getInstructorExperienceOptions({ path: { instructorUuid } }),
    enabled: Boolean(instructorUuid),
    retry: false,
  });
  const educationQuery = useQuery({
    ...getInstructorEducationOptions({ path: { instructorUuid } }),
    enabled: Boolean(instructorUuid),
    retry: false,
  });
  const membershipsQuery = useQuery({
    ...getInstructorMembershipsOptions({ path: { instructorUuid } }),
    enabled: Boolean(instructorUuid),
    retry: false,
  });

  const skills = extractList<Record<string, unknown>>(skillsQuery.data);
  const experience = extractList<Record<string, unknown>>(experienceQuery.data);
  const education = extractList<Record<string, unknown>>(educationQuery.data);
  const memberships = extractList<Record<string, unknown>>(membershipsQuery.data);

  const applicationsQuery = useQuery({
    ...listJobApplicationsOptions({
      path: { jobUuid },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: Boolean(jobUuid),
  });
  const app = (applicationsQuery.data?.data?.content ?? []).find(
    (a: ClassMarketplaceJobApplication) =>
      a.uuid === applicationUuid || a.instructor_uuid === instructorUuid
  );
  const status = app?.status as string | undefined;
  const match = matchScore(app);
  // The one move available from here. Never two, never one that skips a stage.
  const nextStep = nextStepFor(status);
  const isHired = stageIndexOf(status) === HIRED_INDEX;
  const classCreated = isClassCreatedStatus(status);
  const canReject = canRejectApplication(status);
  // The hire endpoint refuses an instructor who is not approved to deliver this job, so the
  // control never offers a move the server will turn down.
  const notApprovedToTrain = app?.training_approved === false;
  const forwardBlocked = nextStep?.action === 'hire' && notApprovedToTrain;
  const createClassHref = `/dashboard/organisation/opportunities/${jobUuid}/create-class`;

  // Hiring is one backend transition that affiliates the instructor. Nothing is chained onto it:
  // a refused step must leave the candidate exactly where they were.
  const moveMutation = useMutation({
    ...reviewApplicationMutation(),
    onSuccess: async (_d, vars) => {
      await invalidateJobApplicationWorkflowQueries(queryClient);
      await applicationsQuery.refetch();
      const action = String(vars?.query?.action ?? '');
      setTransitionError(null);
      toast.success(MOVE_MESSAGES[action] ?? 'Candidate updated.');
    },
    onError: error => {
      // A refused skip names both stages, so the server's own words stand in for a generic toast.
      const message = getErrorMessage(error, 'Could not move this candidate.');
      setTransitionError(message);
      toast.error(message);
    },
  });
  const act = (action: string, body?: Record<string, string>) => {
    if (!app) return;
    setTransitionError(null);
    moveMutation.mutate({
      path: { jobUuid, applicationUuid: app.uuid as string },
      query: { action },
      body,
    });
  };

  const openInterviewDialog = () => {
    if (!app) return;
    setInterviewAt(toDateTimeInputValue(app.interview_at));
    setInterviewNote(app.review_notes ?? '');
    setInterviewDialogOpen(true);
  };

  const takeNextStep = () => {
    if (!nextStep) return;
    // Only the interview step carries a payload the organisation still has to supply.
    if (nextStep.action === 'interview') {
      openInterviewDialog();
      return;
    }
    act(nextStep.action);
  };

  const confirmInterview = () => {
    const scheduledInterviewAt = toUtcLocalDateTime(interviewAt);
    if (!scheduledInterviewAt) {
      toast.error('Select an interview date and time.');
      return;
    }
    act('interview', {
      ...(interviewNote.trim() ? { review_notes: interviewNote.trim() } : {}),
      interview_at: scheduledInterviewAt,
    });
    setInterviewDialogOpen(false);
    setInterviewAt('');
    setInterviewNote('');
  };

  const skillNames = useMemo(
    () => skills.map(s => String(s.skill_name ?? s.name ?? '')).filter(Boolean),
    [skills]
  );

  if (instructorQuery.isLoading) {
    return (
      <div className='mx-auto w-full max-w-[1400px] space-y-6 px-3 py-4 sm:px-5 lg:px-6'>
        <Skeleton className='h-10 w-40' />
        <Skeleton className='h-48 w-full rounded-2xl' />
      </div>
    );
  }
  if (!instructor) {
    return (
      <div className='p-6'>
        <p className='text-muted-foreground'>Candidate not found.</p>
        <Link href='/dashboard/organisation/job-matches' className='text-primary underline'>
          Back to Job Matches
        </Link>
      </div>
    );
  }

  return (
    <div className='mx-auto w-full max-w-[1400px] space-y-6 px-3 py-4 sm:px-5 lg:px-6'>
      <div className='flex items-center gap-2'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => router.push('/dashboard/organisation/job-matches')}
        >
          <ArrowLeft className='mr-1.5 h-4 w-4' /> Back to Job Matches
        </Button>
      </div>

      {/* Hero */}
      <Card className='relative overflow-hidden border-none bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 text-white shadow-xl'>
        <CardContent className='relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8'>
          <Avatar className='h-24 w-24 border-4 border-white/30 shadow-2xl sm:h-32 sm:w-32'>
            {instructor.profile_image_url && (
              <AvatarImage src={instructor.profile_image_url} alt={name} />
            )}
            <AvatarFallback className='bg-teal-900 text-2xl text-white'>
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-center gap-2'>
              {app?.instructor_admin_verified && (
                <Badge className='bg-white/20 text-white hover:bg-white/25'>
                  <BadgeCheck className='mr-1 h-3 w-3' /> Verified
                </Badge>
              )}
              <Badge
                variant='outline'
                className={cn(
                  'bg-card border-white/40 text-xs',
                  stageStyles[status ?? ''] ?? 'text-destructive'
                )}
              >
                {statusLabel(status)}
              </Badge>
            </div>
            <h1 className='mt-2 text-3xl font-bold tracking-tight sm:text-4xl'>{name}</h1>
            <p className='mt-1 text-sm text-white/85 sm:text-base'>
              {instructor.professional_headline ?? 'Instructor'}
            </p>
            <div className='mt-3 flex flex-wrap items-center gap-3 text-xs text-white/80'>
              {app?.created_date && (
                <span className='inline-flex items-center gap-1'>
                  <CalendarClock className='h-3.5 w-3.5' /> Applied{' '}
                  {dayjs(app.created_date).fromNow()}
                </span>
              )}
              {instructor.website && (
                <a
                  href={instructor.website}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center gap-1 hover:underline'
                >
                  <LinkIcon className='h-3.5 w-3.5' /> Portfolio{' '}
                  <ExternalLink className='h-3 w-3' />
                </a>
              )}
            </div>
          </div>
          <div className='shrink-0 rounded-2xl bg-white/10 p-4 text-center backdrop-blur'>
            <div className='text-4xl leading-none font-bold text-white sm:text-5xl'>{match}%</div>
            <p className='mt-1 text-[10px] tracking-widest text-white/70 uppercase'>match</p>
            <Progress value={match} className='mt-2 h-1.5 bg-white/20' />
          </div>
        </CardContent>
      </Card>

      {app ? <StageRail status={status} /> : null}

      {isHired ? (
        <Card className='border-success/40 bg-success/10'>
          <CardContent className='flex flex-wrap items-start gap-3 p-5'>
            <UserCheck className='text-success mt-0.5 h-5 w-5 shrink-0' />
            <div className='min-w-0 text-sm'>
              <div className='font-medium'>Hired — {name} is now a member of your organisation</div>
              <p className='text-muted-foreground'>
                Nothing is left to assign. Creating this job’s class is what puts them on it, built
                from the sessions the job already holds.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Stat strip */}
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <StatCard
          icon={<Briefcase className='h-4 w-4' />}
          label='Experience'
          value={`${experience.length} role${experience.length === 1 ? '' : 's'}`}
        />
        <StatCard
          icon={<GraduationCap className='h-4 w-4' />}
          label='Education'
          value={`${education.length} record${education.length === 1 ? '' : 's'}`}
        />
        <StatCard
          icon={<Award className='h-4 w-4' />}
          label='Skills'
          value={String(skillNames.length)}
        />
        <StatCard
          icon={<CalendarClock className='h-4 w-4' />}
          label='Applied'
          value={app?.created_date ? dayjs(app.created_date).fromNow() : '—'}
        />
      </div>

      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]'>
        {/* Main */}
        <div>
          <Tabs defaultValue='overview'>
            <TabsList className='bg-muted/50 flex h-auto flex-wrap gap-1 rounded-full p-1'>
              {[
                { v: 'overview', l: 'Overview' },
                { v: 'skills', l: 'Skills & Credentials' },
                { v: 'experience', l: 'Experience' },
                { v: 'actions', l: 'Actions' },
              ].map(t => (
                <TabsTrigger
                  key={t.v}
                  value={t.v}
                  className='data-[state=active]:bg-card rounded-full data-[state=active]:text-teal-700 data-[state=active]:shadow-sm'
                >
                  {t.l}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value='overview' className='mt-4 space-y-4'>
              <Card>
                <CardContent className='space-y-4 p-5'>
                  <div>
                    <h3 className='text-sm font-semibold'>About</h3>
                    <p className='text-muted-foreground mt-1.5 text-sm leading-relaxed'>
                      {stripHtml(instructor.bio) || 'No bio provided.'}
                    </p>
                  </div>
                  <Separator />
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <InfoRow
                      icon={<GraduationCap className='h-4 w-4' />}
                      label='Headline'
                      value={instructor.professional_headline ?? '—'}
                    />
                    <InfoRow
                      icon={<BadgeCheck className='h-4 w-4' />}
                      label='Verification'
                      value={app?.instructor_admin_verified ? 'Admin verified' : 'Pending'}
                    />
                    <InfoRow
                      icon={<CheckCircle2 className='h-4 w-4' />}
                      label='Training access'
                      value={app?.training_approved ? 'Approved' : 'Not approved'}
                    />
                    <InfoRow
                      icon={<Briefcase className='h-4 w-4' />}
                      label='Proposed rate'
                      value={
                        app?.approved_rate != null
                          ? `KES ${Number(app.approved_rate).toLocaleString()}/hr`
                          : '—'
                      }
                    />
                  </div>
                  {app?.application_note && (
                    <>
                      <Separator />
                      <div>
                        <h3 className='text-sm font-semibold'>Application note</h3>
                        <p className='text-muted-foreground mt-1.5 text-sm'>
                          {app.application_note}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='skills' className='mt-4 space-y-4'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <AsyncSection
                    loading={skillsQuery.isLoading}
                    error={skillsQuery.error}
                    empty={!skillsQuery.isLoading && skillNames.length === 0}
                    emptyTitle='No skills listed'
                    emptyDescription="This instructor hasn't added skills to their profile."
                  >
                    <div className='flex flex-wrap gap-1.5'>
                      {skillNames.map(s => (
                        <Badge
                          key={s}
                          variant='outline'
                          className='border-success/30 bg-success/10 text-success'
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </AsyncSection>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Memberships & credentials</CardTitle>
                </CardHeader>
                <CardContent>
                  <AsyncSection
                    loading={membershipsQuery.isLoading}
                    error={membershipsQuery.error}
                    empty={!membershipsQuery.isLoading && memberships.length === 0}
                    emptyTitle='No memberships listed'
                    emptyDescription='No professional memberships on this profile.'
                  >
                    <ul className='space-y-2'>
                      {memberships.map((m, i) => (
                        <li key={i} className='flex items-start gap-2 text-sm'>
                          <Award className='mt-0.5 h-4 w-4 shrink-0 text-teal-600' />
                          <span>
                            {String(
                              m.organization ?? m.organisation ?? m.name ?? m.title ?? 'Membership'
                            )}
                            {m.role ? ` — ${m.role}` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </AsyncSection>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='experience' className='mt-4 space-y-4'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  <AsyncSection
                    loading={experienceQuery.isLoading}
                    error={experienceQuery.error}
                    empty={!experienceQuery.isLoading && experience.length === 0}
                    emptyTitle='No experience listed'
                    emptyDescription="This instructor hasn't added work history."
                  >
                    <ol className='border-muted relative space-y-5 border-l-2 pl-6'>
                      {experience.map((e, i) => (
                        <li key={i} className='relative'>
                          <span className='absolute -left-[29px] flex h-6 w-6 items-center justify-center rounded-full border-2 border-teal-500 bg-teal-500 text-white'>
                            <Briefcase className='h-3 w-3' />
                          </span>
                          <div className='text-sm font-medium'>
                            {String(e.job_title ?? e.title ?? e.role ?? 'Role')}
                          </div>
                          <div className='text-muted-foreground text-xs'>
                            {String(
                              e.organization_name ??
                                e.organisation ??
                                e.company ??
                                e.organization ??
                                ''
                            )}
                            {e.start_date || e.years
                              ? ` · ${String(e.years ?? `${e.start_date ?? ''}${e.end_date ? ` – ${e.end_date}` : ''}`)}`
                              : ''}
                          </div>
                          {(e.description || e.summary) && (
                            <p className='text-muted-foreground mt-1 text-xs'>
                              {stripHtml(String(e.description ?? e.summary))}
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                  </AsyncSection>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Education</CardTitle>
                </CardHeader>
                <CardContent>
                  <AsyncSection
                    loading={educationQuery.isLoading}
                    error={educationQuery.error}
                    empty={!educationQuery.isLoading && education.length === 0}
                    emptyTitle='No education listed'
                    emptyDescription='No education records on this profile.'
                  >
                    <ul className='space-y-2'>
                      {education.map((ed, i) => (
                        <li key={i} className='flex items-start gap-2 text-sm'>
                          <GraduationCap className='mt-0.5 h-4 w-4 shrink-0 text-teal-600' />
                          <span>
                            {String(ed.qualification ?? ed.degree ?? ed.title ?? 'Qualification')}
                            {ed.school_name || ed.institution
                              ? ` — ${String(ed.school_name ?? ed.institution)}`
                              : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </AsyncSection>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='actions' className='mt-4'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>
                    {nextStep ? 'Move candidate' : isHired ? 'Create the class' : 'No move left'}
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <TransitionError message={transitionError} />
                  <HireBlockedNotice blocked={forwardBlocked} />
                  <div className='grid gap-2 sm:grid-cols-2'>
                    {nextStep ? (
                      <Button
                        className='justify-start'
                        disabled={!app || forwardBlocked || moveMutation.isPending}
                        onClick={takeNextStep}
                      >
                        <ArrowRight className='mr-2 h-4 w-4' /> {nextStep.label}
                      </Button>
                    ) : isHired ? (
                      <Button className='justify-start' asChild>
                        <Link href={createClassHref}>
                          <Briefcase className='mr-2 h-4 w-4' /> Create the class
                        </Link>
                      </Button>
                    ) : null}
                    {canReject ? (
                      <Button
                        variant='outline'
                        className='text-destructive justify-start'
                        disabled={!app || moveMutation.isPending}
                        onClick={() => act('reject')}
                      >
                        <ThumbsDown className='mr-2 h-4 w-4' /> Reject candidate
                      </Button>
                    ) : null}
                  </div>
                  <p className='text-muted-foreground text-xs'>
                    {forwardBlocked
                      ? 'Hiring stays closed until this instructor is approved to deliver what this job teaches.'
                      : nextStep
                        ? `${nextStep.label} moves them to ${statusLabel(nextStep.leadsTo)}. No stage can be skipped, so this is the only way forward.`
                        : isHired
                          ? 'The funnel ends at the hire. Creating the class assigns them, converts the times held for this job and closes the other candidates out.'
                          : classCreated
                            ? 'This job’s class has been created and this instructor is on it.'
                            : `This application closed as ${statusLabel(status)} and can no longer be actioned.`}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <aside className='space-y-6 lg:sticky lg:top-4 lg:self-start'>
          <Card className='overflow-hidden'>
            <div className='bg-gradient-to-br from-teal-600 to-teal-800 p-5 text-white'>
              <div className='text-xs tracking-wide text-white/70 uppercase'>Pipeline stage</div>
              <div className='mt-1 text-3xl font-semibold'>{statusLabel(status)}</div>
              <div className='mt-1 text-xs text-white/70'>{match}% match</div>
              {nextStep ? (
                <Button
                  className='bg-card hover:bg-card/90 mt-4 w-full text-teal-700'
                  disabled={!app || forwardBlocked || moveMutation.isPending}
                  onClick={takeNextStep}
                >
                  <ArrowRight className='mr-2 h-4 w-4' /> {nextStep.label}
                </Button>
              ) : isHired ? (
                <Button className='bg-card hover:bg-card/90 mt-4 w-full text-teal-700' asChild>
                  <Link href={createClassHref}>
                    <Briefcase className='mr-2 h-4 w-4' /> Create the class
                  </Link>
                </Button>
              ) : null}
            </div>
            <CardContent className='space-y-3 pt-5 text-sm'>
              <TransitionError message={transitionError} />
              <HireBlockedNotice blocked={forwardBlocked} />
              <div className='flex items-center justify-between'>
                <dt className='text-muted-foreground'>Rate</dt>
                <dd className='font-medium'>
                  {app?.approved_rate != null
                    ? `KES ${Number(app.approved_rate).toLocaleString()}/hr`
                    : '—'}
                </dd>
              </div>
              <div className='flex items-center justify-between'>
                <dt className='text-muted-foreground'>Verified</dt>
                <dd className='font-medium'>{app?.instructor_admin_verified ? 'Yes' : 'No'}</dd>
              </div>
              <div className='flex items-center justify-between'>
                <dt className='text-muted-foreground'>Training</dt>
                <dd className='font-medium'>{app?.training_approved ? 'Approved' : '—'}</dd>
              </div>
              <div className='flex items-center justify-between'>
                <dt className='text-muted-foreground'>Applied</dt>
                <dd className='font-medium'>
                  {app?.created_date ? dayjs(app.created_date).format('DD MMM YYYY') : '—'}
                </dd>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <AlertDialog
        open={interviewDialogOpen}
        onOpenChange={open => {
          setInterviewDialogOpen(open);
          if (!open) {
            setInterviewAt('');
            setInterviewNote('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move candidate to interview?</AlertDialogTitle>
            <AlertDialogDescription>
              Set the interview date and time before notifying the instructor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1.5'>
              <Label htmlFor='candidate-interview-at' className='text-xs'>
                Interview date and time
              </Label>
              <Input
                id='candidate-interview-at'
                type='datetime-local'
                value={interviewAt}
                min={toDateTimeInputValue(new Date())}
                onChange={event => setInterviewAt(event.target.value)}
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='candidate-interview-note' className='text-xs'>
                Note (optional)
              </Label>
              <Textarea
                id='candidate-interview-note'
                placeholder='e.g. Prepare a 10-minute demo lesson'
                value={interviewNote}
                onChange={event => setInterviewNote(event.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmInterview}
              disabled={!toUtcLocalDateTime(interviewAt)}
            >
              Confirm interview
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
