'use client';

import { TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { MarketplaceTab } from '../data';

type MarketplaceTabsProps = {
  tabs: MarketplaceTab[];
  /** Accessible name for the tab list, e.g. "Billing basis". */
  label: string;
};

/** Underline tabs with counts; pair with a Radix `Tabs` root. */
export function MarketplaceTabs({ tabs, label }: MarketplaceTabsProps) {
  return (
    <TabsList
      aria-label={label}
      className='h-auto w-full justify-start gap-5 overflow-x-auto rounded-none border-b bg-transparent p-0'
    >
      {tabs.map(tab => {
        const Icon = tab.icon;

        return (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className='data-[state=active]:border-primary data-[state=active]:text-foreground -mb-px flex-none rounded-none border-0 border-b-2 border-transparent px-0.5 py-3 text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:shadow-none'
          >
            <Icon aria-hidden className='size-4' />
            <span>{tab.label}</span>
            <span className='text-muted-foreground font-normal tabular-nums'>{tab.count}</span>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
