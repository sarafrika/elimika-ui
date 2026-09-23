'use client';

import { ArrowLeft, BriefcaseBusiness } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { SectionError } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toSchedulingConflicts } from '@/lib/scheduling-conflicts';
import { cn } from '@/lib/utils';

import { ApplyDialog } from '../apply/apply-dialog';
import { useNow } from '../hooks/use-now';
import { clashesBySession, payLabel, sessionDate } from '../job-facts';
import { applicationPageHref, findWorkHref, myApplicationsHref } from '../job-routes';
import { ApplyRail, OrganisationCard } from './apply-rail';
import { ClosedBanner, JobHero, JobHeroSkeleton } from './job-hero';
import { MoreJobsForCourse } from './more-jobs-for-course';
import { DatesPanel, OverviewPanel } from './overview-panels';
import { PayPanel } from './pay-panel';
import { SchedulePanel } from './schedule-panel';
import { useJobPage } from './use-job-page';
import { WherePanel } from './where-panel';
import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';

const TABS = ['overview', 'schedule', 'where', 'pay', 'dates'] as const;
type JobTab = (typeof TABS)[number];

const TAB_LABELS: Record<JobTab, string> = {
  overview: 'Overview',
  schedule: 'Schedule',
  where: 'Where',
  pay: 'Pay',
  dates: 'Dates',
};

function BackLink() {
  return (
    <Link
      href={findWorkHref()}
      className='text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm'
    >
      <ArrowLeft aria-hidden className='size-4' />
      Jobs
    </Link>
  );
}

function TabFlag({ tone, children }: { tone: 'danger' | 'warning' | 'count'; children: string }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 text-[11px] leading-5 font-semibold tabular-nums',
        tone === 'danger' && 'bg-destructive/10 text-destructive',
        tone === 'warning' && 'bg-warning/15 text-warning',
        tone === 'count' && 'bg-muted text-muted-foreground'
      )}
    >
      {children}
    </span>
  );
}

/** The instructor's page for one job: facts, sections in tabs, and the "Can you apply?" rail. */
export function JobPage({ jobUuid }: { jobUuid: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const now = useNow();
  const [applyOpen, setApplyOpen] = useState(false);
  const data = useJobPage(jobUuid, now);
  const { job, facts, jobQuery, eligibility, readiness } = data;

  const requested = searchParams.get('tab') as JobTab | null;
  const tab: JobTab = requested && TABS.includes(requested) ? requested : 'overview';
  const clashesOnly = searchParams.get('clashes') === '1';

  const updateQuery = (patch: { tab?: JobTab; clashes?: boolean }) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextTab = patch.tab ?? tab;
    if (nextTab === 'overview') params.delete('tab');
    else params.set('tab', nextTab);
    const nextClashes = patch.clashes ?? (nextTab === 'schedule' && clashesOnly);
    if (nextClashes && nextTab === 'schedule') params.set('clashes', '1');
    else params.delete('clashes');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const conflicts = useMemo(
    () =>
      eligibility?.schedule_clear === false
        ? toSchedulingConflicts(eligibility.schedule_conflicts)
        : [],
    [eligibility]
  );
  const clashCount = useMemo(
    () => (facts ? clashesBySession(facts.windows, conflicts).size || conflicts.length : 0),
    [facts, conflicts]
  );
  const noRate = eligibility?.rate_ok === false && eligibility.approved_rate == null;
  const eligibilityChecking = data.open && data.eligibilityQuery.isLoading && !eligibility;

  if (!jobQuery.isLoading && !jobQuery.error && !job) {
    return (
      <main className={cn(surfaceTheme.page, 'flex flex-col gap-5')}>
        <BackLink />
        <EmptyState
          variant='card'
          icon={BriefcaseBusiness}
          title='Job not found'
          description='This job doesn’t exist any more, or the link is incomplete.'
          action={
            <Button asChild variant='outline'>
              <Link href={findWorkHref()}>Browse open jobs</Link>
            </Button>
          }
        />
      </main>
    );
  }

  const seeClashes = () => updateQuery({ tab: 'schedule', clashes: true });
  const ready = readiness?.state === 'ready';

  return (
    <main className={cn(surfaceTheme.page, 'flex flex-col gap-5 pb-28 lg:pb-8')}>
      <div className='flex flex-col gap-3.5'>
        <BackLink />
        {job && facts && !data.open ? <ClosedBanner job={job} facts={facts} /> : null}
        {jobQuery.error ? (
          <SectionError
            title='Couldn’t load this job'
            error={jobQuery.error}
            onRetry={() => jobQuery.refetch()}
          />
        ) : job && facts ? (
          <JobHero
            job={job}
            facts={facts}
            open={data.open}
            now={now}
            organisation={data.organisation}
            organisationLoading={data.organisationLoading}
          />
        ) : (
          <JobHeroSkeleton />
        )}
      </div>

      {job && facts ? (
        <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]'>
          <div className='flex min-w-0 flex-col gap-5'>
            <Tabs value={tab} onValueChange={value => updateQuery({ tab: value as JobTab })} className='gap-5'>
              <TabsList
                aria-label='Job sections'
                className='h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b bg-transparent p-0'
              >
                {TABS.map(id => (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className='data-[state=active]:border-primary data-[state=active]:text-foreground -mb-px h-11 flex-none gap-2 rounded-none border-0 border-b-2 border-transparent px-3.5 text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:shadow-none'
                  >
                    {TAB_LABELS[id]}
                    {id === 'schedule' ? (
                      clashCount > 0 ? (
                        <TabFlag tone='danger'>{`${clashCount} clash${clashCount === 1 ? '' : 'es'}`}</TabFlag>
                      ) : (
                        <TabFlag tone='count'>{`${facts.sessionCount}`}</TabFlag>
                      )
                    ) : null}
                    {id === 'pay' && noRate ? <TabFlag tone='warning'>No rate yet</TabFlag> : null}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value='overview' className='flex flex-col gap-5'>
                <OverviewPanel job={job} contentTitle={data.contentTitle} creatorName={data.creatorName} />
                <MoreJobsForCourse job={job} contentTitle={data.contentTitle} now={now} />
              </TabsContent>
              <TabsContent value='schedule'>
                <SchedulePanel
                  facts={facts}
                  fit={{
                    checking: eligibilityChecking,
                    checked: Boolean(eligibility) && data.open,
                    conflicts,
                  }}
                  clashesOnly={clashesOnly}
                  onClashesOnlyChange={value => updateQuery({ clashes: value })}
                />
              </TabsContent>
              <TabsContent value='where'>
                <WherePanel job={job} />
              </TabsContent>
              <TabsContent value='pay'>
                <PayPanel
                  job={job}
                  facts={facts}
                  rate={data.rate}
                  rateLoading={eligibilityChecking || data.rate?.kind === 'resolving'}
                />
              </TabsContent>
              <TabsContent value='dates'>
                <DatesPanel job={job} facts={facts} />
              </TabsContent>
            </Tabs>
          </div>

          <aside
            aria-label='Your application'
            className='order-first flex flex-col gap-4 lg:sticky lg:top-4 lg:order-none lg:self-start'
          >
            <ApplyRail
              data={data}
              onApply={() => setApplyOpen(true)}
              onSeeClashes={seeClashes}
              clashCount={clashCount}
            />
            <OrganisationCard data={data} />
          </aside>
        </div>
      ) : jobQuery.isLoading ? (
        <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]'>
          <SectionCardSkeleton rows={6} />
          <SectionCardSkeleton rows={5} />
        </div>
      ) : null}

      {job && facts ? (
        <div className='bg-background/95 fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t px-4 py-3 shadow-lg backdrop-blur lg:hidden'>
          <div className='min-w-0 flex-1'>
            <p className='text-foreground truncate font-bold'>{payLabel(job)}</p>
            <p className='text-muted-foreground truncate text-xs'>
              {data.open ? `Closes ${sessionDate(facts.first)}` : 'Applications closed'}
            </p>
          </div>
          {data.applicationStatus ? (
            <Button asChild className='h-11'>
              <Link
                href={
                  data.application?.uuid
                    ? applicationPageHref(data.application.uuid)
                    : myApplicationsHref()
                }
              >
                Track
              </Link>
            </Button>
          ) : data.open ? (
            <Button className='h-11 px-6' disabled={!ready} onClick={() => setApplyOpen(true)}>
              Apply
            </Button>
          ) : (
            <Button asChild variant='outline' className='h-11'>
              <Link href={findWorkHref()}>Browse jobs</Link>
            </Button>
          )}
        </div>
      ) : null}

      <ApplyDialog
        job={job}
        open={applyOpen}
        onOpenChange={setApplyOpen}
        organisationName={data.organisation?.name}
        contentTitle={data.contentTitle}
      />
    </main>
  );
}
