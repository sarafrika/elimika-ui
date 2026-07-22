'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';

import { AnalyticsFiltersProvider, useAnalyticsFilters } from './_components/analytics-filters-context';
import {
  buildAnalyticsSearchParams,
  parseAnalyticsFiltersFromSearchParams,
  parseAnalyticsTabFromSearchParams,
  type AnalyticsTab,
} from './_components/analytics-url';
import { CompletionByProgram } from './_components/charts/CompletionByProgram';
import { PerformanceChart } from './_components/charts/PerformanceChart';
import { StatusBreakdown } from './_components/charts/StatusBreakdown';
import { DetailedMetrics } from './_components/DetailedMetrics';
import { HeaderBar } from './_components/HeaderBar';
import { KPIRow } from './_components/KPIRow';
import { SatisfactionDistribution } from './_components/SatisfactionDistribution';
import { SessionTable, SessionTableSummary } from './_components/SessionTable';
import { TabNav } from './_components/TabNav';
import { PlaceholderTab } from './_components/tabs/PlaceholderTab';
import { TopLocations } from './_components/TopLocations';
import { useInstructorAnalyticsData } from './_components/useInstructorAnalyticsData';

const TABS: AnalyticsTab[] = [
  'Overview',
  'Session Report',
  'Program Report',
  'Instructor Report',
  'Participant Report',
  'Location Report',
  'Trend Report',
  'Custom Report',
];

function useAnalyticsUrlSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { filters, setFilters } = useAnalyticsFilters();

  const urlFilters = useMemo(
    () => parseAnalyticsFiltersFromSearchParams(searchParams),
    [searchParams]
  );
  const urlTab = useMemo(() => parseAnalyticsTabFromSearchParams(searchParams), [searchParams]);

  useEffect(() => {
    setFilters(current => {
      const sameFilters =
        current.dateFrom === urlFilters.dateFrom &&
        current.dateTo === urlFilters.dateTo &&
        current.program === urlFilters.program &&
        current.location === urlFilters.location &&
        current.statuses.length === urlFilters.statuses.length &&
        current.statuses.every((status, index) => status === urlFilters.statuses[index]);

      return sameFilters ? current : urlFilters;
    });
  }, [setFilters, urlFilters]);

  const setActiveTab = (tab: AnalyticsTab) => {
    const nextSearchParams = buildAnalyticsSearchParams({ filters, tab });
    const nextQuery = nextSearchParams.toString();
    const currentQuery = searchParams.toString();

    if (nextQuery === currentQuery) {
      return;
    }

    const nextUrl = nextQuery ? pathname + '?' + nextQuery : pathname;
    router.replace(nextUrl, { scroll: false });
  };

  return {
    activeTab: urlTab,
    setActiveTab,
  };
}

function AnalyticsDashboardBody({
  activeTab,
  setActiveTab,
}: {
  activeTab: AnalyticsTab;
  setActiveTab: (tab: AnalyticsTab) => void;
}) {
  const analytics = useInstructorAnalyticsData();

  return (
    <div className='min-h-screen font-sans'>
      <div className='mx-auto w-full px-3 py-4 sm:px-4 lg:px-6'>
        <HeaderBar
          availablePrograms={analytics.availablePrograms}
          availableLocations={analytics.availableLocations}
        />

        <TabNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab as unknown as (tab: string) => void} />

        {activeTab === 'Overview' && (
          <div className='space-y-4 sm:space-y-5'>
            <KPIRow />

            <div className='flex flex-wrap gap-4'>
              <div className='min-w-[280px] flex-1'>
                <PerformanceChart />
              </div>
              <div className='min-w-[260px] flex-1'>
                <CompletionByProgram handeViewProgramReport={() => setActiveTab("Program Report")} />
              </div>
              <div className='w-full lg:min-w-[220px] lg:w-auto xl:min-w-[240px]'>
                <StatusBreakdown handleViewStatusBreakdown={() => setActiveTab("Location Report")} />
              </div>
            </div>

            <SessionTableSummary />

            <div className='flex flex-wrap gap-4'>
              <div className='min-w-[240px] flex-1'>
                <TopLocations handleViewTopLocations={() => setActiveTab("Location Report")} />
              </div>
              <div className='min-w-[240px] flex-1'>
                <SatisfactionDistribution handleViewSatisfactionDistribution={() => setActiveTab('Participant Report')} />
              </div>
            </div>

            <DetailedMetrics />
          </div>
        )}

        {activeTab === 'Session Report' && <SessionTable />}

        {activeTab === 'Program Report' && (
          <div className='space-y-4'>
            <CompletionByProgram />
            <SessionTableSummary />
          </div>
        )}

        {activeTab === 'Instructor Report' && (
          <div className='space-y-4'>
            <KPIRow />
            <DetailedMetrics />
          </div>
        )}

        {activeTab === 'Participant Report' && (
          <div className='space-y-4'>
            <SatisfactionDistribution />
            <DetailedMetrics />
          </div>
        )}

        {activeTab === 'Location Report' && (
          <div className='space-y-4'>
            <TopLocations />
            <StatusBreakdown />
          </div>
        )}

        {activeTab === 'Trend Report' && (
          <div className='space-y-4'>
            <PerformanceChart />
            <SessionTableSummary />
          </div>
        )}

        {activeTab === 'Custom Report' && <PlaceholderTab tabName={activeTab} />}
      </div>
    </div>
  );
}

function InstructorAnalyticsDashboardContent() {
  const searchParams = useSearchParams();
  const initialFilters = useMemo(
    () => parseAnalyticsFiltersFromSearchParams(searchParams),
    [searchParams]
  );
  const { activeTab, setActiveTab } = useAnalyticsUrlSync();

  return (
    <AnalyticsFiltersProvider initialFilters={initialFilters}>
      <AnalyticsDashboardBody activeTab={activeTab} setActiveTab={setActiveTab} />
    </AnalyticsFiltersProvider>
  );
}

export default function InstructorAnalyticsDashboard() {
  return <InstructorAnalyticsDashboardContent />;
}
