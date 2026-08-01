'use client';

import { Button } from '@/components/ui/button';
import { ChevronRight, FileText, GraduationCap, WalletCards } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SkillsFundHeader } from './_components/SkillsFundHeader';
import { SkillsFundMiniTrackerCard } from './_components/SkillsFundMiniTrackerCard';
import { SkillsFundOpportunityCard } from './_components/SkillsFundOpportunityCard';
import { SkillsFundSidebar } from './_components/SkillsFundSidebar';
import { SkillsFundTabs } from './_components/SkillsFundTabs';
import { SkillsFundToolbar } from './_components/SkillsFundToolbar';
import {
  getSkillsFundContent,
  type SkillsFundRole,
  type SkillsFundSortValue,
  type SkillsFundTabId,
} from './data';

type SkillsFundHubPageProps = {
  role: SkillsFundRole;
  profileName: string;
};

function sortOpportunities<T extends { recommendation: string; supportAmount: number }>(
  items: T[],
  sortValue: SkillsFundSortValue
) {
  const nextItems = [...items];

  switch (sortValue) {
    case 'highest-support':
      return nextItems.sort((left, right) => right.supportAmount - left.supportAmount);
    case 'recommended':
      return nextItems.sort((left, right) =>
        right.recommendation.localeCompare(left.recommendation)
      );
    case 'best-match':
    default:
      return nextItems;
  }
}

export function SkillsFundHubPage({ role, profileName }: SkillsFundHubPageProps) {
  const content = useMemo(() => getSkillsFundContent(role, profileName), [profileName, role]);
  const [activeTab, setActiveTab] = useState<SkillsFundTabId>('bursaries');
  const [sortValue, setSortValue] = useState<SkillsFundSortValue>('best-match');

  const visibleOpportunities = useMemo(
    () =>
      sortOpportunities(
        content.opportunities.filter(opportunity => opportunity.tab === activeTab),
        sortValue
      ),
    [activeTab, content.opportunities, sortValue]
  );

  const featuredOpportunities = visibleOpportunities.slice(0, 4);

  return (
    <main className='w-full'>
      <div className='px-2 py-2'>
        <section className='bg-card overflow-hidden'>
          <SkillsFundHeader profileName={content.profileName} title={content.title} />
          <SkillsFundTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={content.tabs} />

          <div className='grid gap-4 p-3 sm:p-4 xl:grid-cols-[minmax(0,1fr)_350px] xl:items-start 2xl:grid-cols-[minmax(0,1fr)_350px]'>
            <div className='space-y-4'>
              <SkillsFundToolbar
                filterCount={content.filterCount}
                matchedScore={content.matchedScore}
                sortValue={sortValue}
                onSortChange={setSortValue}
              />

              <section>
                {featuredOpportunities.length > 0 ? (
                  <div className='grid justify-start gap-3 min-[900px]:grid-cols-2 xl:gap-4 2xl:grid-cols-3'>
                    {featuredOpportunities.map(opportunity => (
                      <SkillsFundOpportunityCard key={opportunity.id} opportunity={opportunity} />
                    ))}
                  </div>
                ) : (
                  <div className='border-border bg-muted/20 flex min-h-[280px] flex-col items-center justify-center rounded-[12px] border border-dashed p-8 text-center'>
                    <GraduationCap className='text-muted-foreground mb-4 size-10' />
                    <h3 className='text-lg font-semibold'>No funding opportunities available</h3>
                    <p className='text-muted-foreground mt-2 max-w-md text-sm'>
                      There are currently no bursaries, scholarships, sponsorships, or
                      apprenticeships available. Check back later for new opportunities.
                    </p>
                  </div>
                )}
              </section>

              <section className='border-border bg-muted/20 rounded-[12px] border p-3 sm:p-4'>
                <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
                  <h2 className='text-foreground text-[1.2rem] font-semibold sm:text-[1.35rem]'>
                    Application Tracker
                  </h2>
                  <Button
                    variant='ghost'
                    className='text-primary hover:text-primary/80 h-auto px-0 text-sm font-semibold hover:bg-transparent'
                  >
                    View All Applications
                    <ChevronRight className='size-4' />
                  </Button>
                </div>

                {content.bottomCards.length > 0 ? (
                  <div className='grid justify-start gap-3 min-[980px]:grid-cols-2'>
                    {content.bottomCards.map(card => (
                      <SkillsFundMiniTrackerCard key={card.id} card={card} />
                    ))}
                  </div>
                ) : (
                  <div className='border-border bg-background/50 flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center'>
                    <FileText className='text-muted-foreground mb-3 size-8' />
                    <h3 className='font-semibold'>No applications yet</h3>
                    <p className='text-muted-foreground mt-1 text-sm'>
                      Applications you submit will appear here for tracking.
                    </p>
                  </div>
                )}
              </section>
            </div>

            {content.trackerEntries.length > 0 ||
            content.activityEntries.length > 0 ||
            content.resources.length > 0 ? (
              <SkillsFundSidebar
                activityEntries={content.activityEntries}
                resources={content.resources}
                trackerEntries={content.trackerEntries}
                walletActionLabel={content.walletActionLabel}
                walletBalance={content.walletBalance}
                walletRemaining={content.walletRemaining}
                walletSecondaryActionLabel={content.walletSecondaryActionLabel}
                walletSubtitle={content.walletSubtitle}
                walletTitle={content.walletTitle}
                walletUtilizationLabel={content.walletUtilizationLabel}
                walletUtilizationPercent={content.walletUtilizationPercent}
              />
            ) : (
              <aside className='border-border bg-muted/20 flex min-h-[500px] flex-col items-center justify-center rounded-[16px] border border-dashed p-8 text-center'>
                <WalletCards className='text-muted-foreground mb-4 size-10' />
                <h3 className='text-lg font-semibold'>No funding activity</h3>
                <p className='text-muted-foreground mt-2 max-w-xs text-sm'>
                  Your wallet, activity history, resources, and funding tracker will appear here
                  once funding data becomes available.
                </p>
              </aside>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
