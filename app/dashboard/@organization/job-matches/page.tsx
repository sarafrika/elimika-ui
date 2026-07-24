// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Award, BadgeCheck, Briefcase, CheckCircle2, Inbox, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity, extractPage } from '@/lib/api-helpers';
import { cn } from '@/lib/utils';
import type { ClassMarketplaceJob, ClassMarketplaceJobApplication, Instructor } from '@/services/client';
import {
  getInstructorByUuidOptions,
  listJobApplicationsOptions,
  listJobsOptions,
} from '@/services/client/@tanstack/react-query.gen';

dayjs.extend(relativeTime);

const prettyStatus = (s?: string) =>
  (s ?? 'Pending').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const initials = (name: string) =>
  name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

const statusStyles = (s?: string) => {
  const v = (s ?? '').toLowerCase();
  if (v.includes('approv') || v.includes('hire') || v.includes('accept')) return 'border-success/30 bg-success/10 text-success';
  if (v.includes('reject') || v.includes('declin') || v.includes('withdraw')) return 'border-destructive/30 bg-destructive/10 text-destructive';
  if (v.includes('review') || v.includes('shortlist') || v.includes('interview')) return 'border-warning/30 bg-warning/10 text-warning';
  return 'border-border bg-muted text-muted-foreground';
};

/** Lazily resolves a candidate's real instructor profile. */
function useInstructor(instructorUuid?: string) {
  const q = useQuery({
    ...getInstructorByUuidOptions({ path: { uuid: instructorUuid ?? '' } }),
    enabled: Boolean(instructorUuid),
    retry: false,
  });
  const instructor = extractEntity<Instructor>(q.data);
  return { loading: q.isLoading, name: instructor?.full_name ?? null };
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
  const { loading, name } = useInstructor(app.instructor_uuid);
  const displayName = name ?? 'Applicant';
  const accent = index === 0 ? 'bg-success' : index === 1 ? 'bg-teal-500' : 'bg-warning';

  return (
    <Card className="relative overflow-hidden">
      <span aria-hidden className={cn('absolute left-0 top-0 h-full w-1', accent)} />
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {loading ? (
            <Skeleton className="h-14 w-14 rounded-full" />
          ) : (
            <Avatar className="h-14 w-14 shadow">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials(displayName)}</AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="truncate text-base">{loading ? <Skeleton className="h-4 w-28" /> : displayName}</CardTitle>
              <Badge variant="secondary" className="text-[10px]">
                #{index + 1}
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Applied {app.created_date ? dayjs(app.created_date).fromNow() : '—'}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 text-sm">
        <div className="flex flex-wrap gap-1.5">
          {app.instructor_admin_verified && (
            <Badge variant="outline" className="border-success/30 bg-success/10 text-[11px] text-success">
              <BadgeCheck className="mr-1 h-3 w-3" /> Admin verified
            </Badge>
          )}
          {app.training_approved && (
            <Badge variant="outline" className="border-success/30 bg-success/10 text-[11px] text-success">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Training approved
            </Badge>
          )}
          {!app.instructor_admin_verified && !app.training_approved && (
            <span className="text-xs text-muted-foreground">Verification pending</span>
          )}
        </div>

        {app.application_note && (
          <p className="line-clamp-3 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">{app.application_note}</p>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Proposed rate</p>
            <p className="text-sm font-semibold">
              {app.approved_rate != null ? (
                <>
                  KES {Number(app.approved_rate).toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground"> / hr</span>
                </>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </p>
          </div>
          <Badge variant="outline" className={cn('text-xs', statusStyles(app.status))}>
            {prettyStatus(app.status)}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/dashboard/opportunities/${jobUuid}/applications/${app.uuid}`}>Review</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

export default function JobMatchesPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const jobsQuery = useQuery({
    ...listJobsOptions({ query: { organisation_uuid: organisationUuid, pageable: { page: 0, size: 100 } } }),
    enabled: Boolean(organisationUuid),
  });
  const jobs = extractPage<ClassMarketplaceJob>(jobsQuery.data).items;

  const [selectedJobUuid, setSelectedJobUuid] = useState<string>('');
  useEffect(() => {
    if (!selectedJobUuid && jobs.length) setSelectedJobUuid(jobs[0].uuid as string);
  }, [jobs, selectedJobUuid]);

  const selectedJob = jobs.find(j => j.uuid === selectedJobUuid);

  const applicationsQuery = useQuery({
    ...listJobApplicationsOptions({ path: { jobUuid: selectedJobUuid }, query: { pageable: { page: 0, size: 100 } } }),
    enabled: Boolean(selectedJobUuid),
  });
  const applications = extractPage<ClassMarketplaceJobApplication>(applicationsQuery.data).items;

  // Most-recent-first for the highlighted cards.
  const topThree = useMemo(
    () =>
      [...applications]
        .sort((a, b) => new Date(b.created_date ?? 0).getTime() - new Date(a.created_date ?? 0).getTime())
        .slice(0, 3),
    [applications]
  );

  // Real, status-derived pipeline (no fabricated funnel).
  const pipeline = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of applications) {
      const key = prettyStatus(a.status);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()];
  }, [applications]);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]">
      <PageHeader
        eyebrow="Onboarding"
        title="Job Matches"
        description="Candidates for your open instructor postings, with credentials and pipeline tracking."
        action={
          jobs.length ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-xs font-medium text-muted-foreground sm:inline">Job posting</span>
              <Select value={selectedJobUuid} onValueChange={setSelectedJobUuid}>
                <SelectTrigger className="h-9 w-[220px] sm:w-[260px]">
                  <SelectValue placeholder="Select a posting" />
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No job postings yet"
          description="Post an instructor job from a course to start receiving and ranking candidates here."
        />
      ) : (
        <>
          {/* Candidates banner */}
          <Card className="border-teal-200 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {applications.length
                      ? `${applications.length} candidate${applications.length === 1 ? '' : 's'} for `
                      : 'No candidates yet for '}
                    <span className="font-bold">{selectedJob?.title ?? '—'}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ranked by recency — review credentials, proposed rates and verification status.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top candidate cards */}
          {applicationsQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <EmptyState icon={Inbox} title="No candidates yet" description="Applications to this posting will appear here." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {topThree.map((app, idx) => (
                <CandidateCard key={app.uuid} app={app} index={idx} jobUuid={selectedJobUuid} />
              ))}
            </div>
          )}

          {/* Pipeline tracker */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Recruitment pipeline</CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">Candidate stages for {selectedJob?.title ?? 'this posting'}</p>
                </div>
                <div className="flex gap-4">
                  <Stat icon={<Briefcase className="h-4 w-4" />} label="Open reqs" value={jobs.length} />
                  <Stat icon={<TrendingUp className="h-4 w-4" />} label="Candidates" value={applications.length} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pipeline.length === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No candidate activity yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                  {pipeline.map(([stage, count]) => (
                    <div key={stage} className={cn('rounded-lg border p-3', statusStyles(stage))}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide">{stage}</p>
                        <Award className="h-3.5 w-3.5 opacity-60" />
                      </div>
                      <p className="mt-1 text-2xl font-bold">{count}</p>
                    </div>
                  ))}
                </div>
              )}

              {applications.length > 0 && (
                <>
                  <Separator className="my-5" />
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Candidates for {selectedJob?.title ?? 'this posting'}
                    </p>
                    {applications.map(app => (
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
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border p-2.5">
      {loading ? (
        <Skeleton className="h-8 w-8 rounded-full" />
      ) : (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials(displayName)}</AvatarFallback>
        </Avatar>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{loading ? <Skeleton className="h-3.5 w-24" /> : displayName}</p>
        <p className="truncate text-xs text-muted-foreground">
          Applied {app.created_date ? dayjs(app.created_date).fromNow() : '—'}
          {app.approved_rate != null && ` · KES ${Number(app.approved_rate).toLocaleString()}/hr`}
        </p>
      </div>
      <Badge variant="outline" className={cn('text-xs', statusStyles(app.status))}>
        {prettyStatus(app.status)}
      </Badge>
      <Button asChild size="sm" variant="ghost" className="h-8">
        <Link href={`/dashboard/opportunities/${jobUuid}/applications/${app.uuid}`}>Review →</Link>
      </Button>
    </div>
  );
}
