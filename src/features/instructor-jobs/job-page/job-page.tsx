'use client';

import { ArrowLeft, BriefcaseBusiness } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { SectionError } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
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
import {
  SectionCardSkeleton,
  type SectionTab,
  SectionTabPanel,
  SectionTabs,
  surfaceTheme,
} from '@/components/data-display';

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

  /** The address for a tab and clash filter: `clashes` only lives on the schedule tab. */
  const hrefFor = (patch: { tab?: JobTab; clashes?: boolean }) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextTab = patch.tab ?? tab;
    if (nextTab === 'overview') params.delete('tab');
    else params.set('tab', nextTab);
    const nextClashes = patch.clashes ?? (nextTab === 'schedule' && clashesOnly);
    if (nextClashes && nextTab === 'schedule') params.set('clashes', '1');
    else params.delete('clashes');
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };
  const updateQuery = (patch: { tab?: JobTab; clashes?: boolean }) =>
    router.replace(hrefFor(patch), { scroll: false });

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
      <main className={cn(surfaceTheme.pageWide, 'flex flex-col gap-5 py-4')}>
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
  const tabs = TABS.map((id): SectionTab<JobTab> => {
    if (id === 'schedule' && facts) {
      return clashCount > 0
        ? {
            id,
            label: TAB_LABELS[id],
            flag: { label: `${clashCount} clash${clashCount === 1 ? '' : 'es'}`, tone: 'danger' },
          }
        : { id, label: TAB_LABELS[id], count: facts.sessionCount };
    }
    if (id === 'pay' && noRate) {
      return { id, label: TAB_LABELS[id], flag: { label: 'No rate yet', tone: 'warning' } };
    }
    return { id, label: TAB_LABELS[id] };
  });
  const ready = readiness?.state === 'ready';

  return (
    <main className={cn(surfaceTheme.pageWide, 'flex flex-col gap-5 pt-4 pb-28 lg:pb-8')}>
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
            <SectionTabs
              tabs={tabs}
              value={tab}
              onValueChange={value => updateQuery({ tab: value })}
              hrefFor={value => hrefFor({ tab: value })}
              label='Job sections'
              sticky
              className='gap-5'
            >
              <SectionTabPanel value='overview' className='flex flex-col gap-5'>
                <OverviewPanel
                  job={job}
                  contentTitle={data.contentTitle}
                  creatorName={data.creatorName}
                />
                <MoreJobsForCourse job={job} contentTitle={data.contentTitle} now={now} />
              </SectionTabPanel>
              <SectionTabPanel value='schedule'>
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
              </SectionTabPanel>
              <SectionTabPanel value='where'>
                <WherePanel job={job} />
              </SectionTabPanel>
              <SectionTabPanel value='pay'>
                <PayPanel
                  job={job}
                  facts={facts}
                  rate={data.rate}
                  rateLoading={eligibilityChecking || data.rate?.kind === 'resolving'}
                />
              </SectionTabPanel>
              <SectionTabPanel value='dates'>
                <DatesPanel job={job} facts={facts} />
              </SectionTabPanel>
            </SectionTabs>
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
