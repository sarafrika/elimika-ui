'use client';

import { TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { MarketplaceTab } from '../data';

type MarketplaceTabsProps = {
  tabs: MarketplaceTab[];
};

export function MarketplaceTabs({ tabs }: MarketplaceTabsProps) {
  return (
    <TabsList className='h-auto w-full flex-wrap justify-start gap-2 rounded-none border-b bg-transparent p-0'>
      {tabs.map(tab => {
        const Icon = tab.icon;

        return (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className='rounded-none border-b-2 border-transparent px-0 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none'
          >
            <span className='flex items-center gap-2 px-1'>
              <Icon className='size-4' />
              <span>{tab.label}</span>
              {tab.count ? <span className='text-muted-foreground'>({tab.count})</span> : null}
            </span>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
