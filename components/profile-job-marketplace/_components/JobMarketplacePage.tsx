'use client';

import { ChevronDown, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent } from '@/components/ui/tabs';

import type { JobMarketplaceRole } from '../data';
import { getJobMarketplaceContent } from '../data';
import { MarketplaceRail } from './MarketplaceRail';
import { MarketplaceSidebar } from './MarketplaceSidebar';
import { MarketplaceTabs } from './MarketplaceTabs';
import { OpportunityCard } from './OpportunityCard';
import { PerformanceVideoCard } from './PerformanceVideoCard';

type JobMarketplacePageProps = {
  role: JobMarketplaceRole;
};

export function JobMarketplacePage({ role }: JobMarketplacePageProps) {
  const content = getJobMarketplaceContent(role);

  return (
    <main className='min-h-screen px-3 py-4 sm:px-5 lg:px-7'>
      <div className='mx-auto max-w-[1560px]'>
        <div className='grid gap-4 xl:grid-cols-[270px_minmax(0,1fr)] 2xl:grid-cols-[270px_minmax(0,1fr)_300px]'>
          <div className='hidden xl:sticky xl:top-4 xl:block xl:self-start'>
            <MarketplaceSidebar
              heading={content.sidebarHeading}
              count={content.sidebarCount}
              groups={content.filterGroups}
              setAlertLabel={content.setAlertLabel}
              applicationsLabel={content.applicationsLabel}
            />
          </div>

          <div className='space-y-4'>
            <Card className='gap-0 overflow-hidden rounded-[18px] border-white/60 bg-card/95 px-0 py-0 shadow-sm'>
              <div className='flex flex-wrap items-center gap-3 border-b px-5 py-4'>
                <h1 className='text-foreground text-[1.9rem] font-semibold tracking-tight'>{content.title}</h1>
                {/* <div className='text-muted-foreground flex items-center gap-2 text-base'>
                  <Search className='size-4' />
                  <span>{content.userName}</span>
                </div> */}
              </div>

              <Tabs defaultValue={content.tabs[0]?.id} className='gap-0'>
                <div className='px-5'>
                  <MarketplaceTabs tabs={content.tabs} />
                </div>

                {content.tabs.map(tab => (
                  <TabsContent key={tab.id} value={tab.id} className='mt-0 space-y-4 px-4 py-4 sm:px-5'>
                    <Card className='gap-4 rounded-[16px] border-white/60 bg-background/65 px-4 py-4 shadow-none'>
                      <div className='flex flex-wrap items-center justify-between gap-3'>
                        <div className='text-foreground text-[1.05rem] font-medium'>
                          {content.opportunitySummary}
                        </div>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='text-muted-foreground text-sm'>{content.sortLabel}</span>
                          <Button variant='outline' size='sm' className='rounded-lg border-white/70 bg-background/80'>
                            {content.sortValue}
                            <ChevronDown className='size-4' />
                          </Button>
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button
                                variant='outline'
                                size='sm'
                                className='rounded-lg border-white/70 bg-background/80 xl:hidden'
                              >
                                <SlidersHorizontal className='size-4' />
                                {content.filterValue}
                              </Button>
                            </SheetTrigger>
                            <SheetContent side='left' className='w-[88vw] max-w-sm overflow-y-auto border-r p-4'>
                              <SheetHeader className='sr-only'>
                                <SheetTitle>{content.sidebarHeading}</SheetTitle>
                                <SheetDescription>
                                  Explore job marketplace filters and quick actions.
                                </SheetDescription>
                              </SheetHeader>
                              <MarketplaceSidebar
                                heading={content.sidebarHeading}
                                count={content.sidebarCount}
                                groups={content.filterGroups}
                                setAlertLabel={content.setAlertLabel}
                                applicationsLabel={content.applicationsLabel}
                              />
                            </SheetContent>
                          </Sheet>
                        </div>
                      </div>

                      <div className='grid gap-4 3xl:grid-cols-2'>
                        {content.opportunities.map(item => (
                          <OpportunityCard key={item.id} item={item} />
                        ))}
                      </div>

                      <div className='space-y-3'>
                        <div className='flex items-center justify-between gap-3'>
                          <h2 className='text-foreground text-xl font-semibold'>Performance Videos</h2>
                          <ChevronDown className='text-muted-foreground size-4 rotate-[-90deg]' />
                        </div>
                        <div className='grid gap-4 xl:grid-cols-2'>
                          {content.performanceVideos.map(item => (
                            <PerformanceVideoCard key={item.id} item={item} />
                          ))}
                        </div>
                      </div>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </Card>
          </div>

          <div className='xl:col-start-2 2xl:col-start-auto 2xl:sticky 2xl:top-4 2xl:self-start'>
            <MarketplaceRail
              coursesTitle={content.coursesTitle}
              insightsTitle={content.insightsTitle}
              matchingTitle={content.matchingTitle}
              matchingDescription={content.matchingDescription}
              matchingAction={content.matchingAction}
              searchJobsPlaceholder={content.searchJobsPlaceholder}
              sendLabel={content.sendLabel}
              insightsCount={content.insightsCount}
              courses={content.courses}
              insights={content.insights}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
