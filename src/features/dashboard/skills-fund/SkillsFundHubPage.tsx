'use client';

import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SkillsFundHeader } from './_components/SkillsFundHeader';
import { SkillsFundMiniTrackerCard } from './_components/SkillsFundMiniTrackerCard';
import { SkillsFundOpportunityCard } from './_components/SkillsFundOpportunityCard';
import { SkillsFundSidebar } from './_components/SkillsFundSidebar';
import { SkillsFundTabs } from './_components/SkillsFundTabs';
import { SkillsFundToolbar } from './_components/SkillsFundToolbar';
import { getSkillsFundContent, type SkillsFundRole, type SkillsFundSortValue, type SkillsFundTabId } from './data';

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
      return nextItems.sort((left, right) => right.recommendation.localeCompare(left.recommendation));
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
      <div className='mx-auto max-w-[1520px] px-2 py-2 sm:px-3 lg:px-4'>
        <section className='overflow-hidden border border-border bg-card'>
          <SkillsFundHeader profileName={content.profileName} title={content.title} />
          <SkillsFundTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={content.tabs} />

          <div className='grid gap-4 p-3 sm:p-4 xl:grid-cols-[minmax(0,1fr)_272px] xl:items-start 2xl:grid-cols-[minmax(0,1fr)_272px]'>
            <div className='space-y-4'>
              <SkillsFundToolbar
                filterCount={content.filterCount}
                matchedScore={content.matchedScore}
                sortValue={sortValue}
                onSortChange={setSortValue}
              />

              <section className='grid justify-start gap-3 min-[900px]:grid-cols-2 xl:gap-4 2xl:grid-cols-3'>
                {featuredOpportunities.map(opportunity => (
                  <SkillsFundOpportunityCard key={opportunity.id} opportunity={opportunity} />
                ))}
              </section>

              <section className='rounded-[12px] border border-border bg-muted/20 p-3 sm:p-4'>
                <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
                  <h2 className='text-[1.2rem] font-semibold text-foreground sm:text-[1.35rem]'>
                    Application Tracker
                  </h2>
                  <Button
                    variant='ghost'
                    className='h-auto px-0 text-sm font-semibold text-primary hover:bg-transparent hover:text-primary/80'
                  >
                    View All Applications
                    <ChevronRight className='size-4' />
                  </Button>
                </div>

                <div className='grid justify-start gap-3 min-[980px]:grid-cols-2'>
                  {content.bottomCards.map(card => (
                    <SkillsFundMiniTrackerCard key={card.id} card={card} />
                  ))}
                </div>
              </section>
            </div>

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
          </div>
        </section>
      </div>
    </main>
  );
}
