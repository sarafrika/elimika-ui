'use client';

import type { LucideIcon } from 'lucide-react';

import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type CredentialsTabConfig = {
  id: string;
  label: string;
  countLabel?: string;
  icon: LucideIcon;
};

type CredentialsTabsProps = {
  tabs: CredentialsTabConfig[];
};

export function CredentialsTabs({ tabs }: CredentialsTabsProps) {
  return (
    <TabsList className='h-auto w-full flex-wrap justify-start gap-2 rounded-[16px] border bg-card/95 p-2 shadow-sm sm:w-fit'>
      {tabs.map(tab => {
        const Icon = tab.icon;

        return (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className={cn(
              'min-h-11 rounded-lg px-4 text-sm font-medium data-[state=active]:bg-[color-mix(in_srgb,var(--primary)_10%,white)] data-[state=active]:text-foreground'
            )}
          >
            <Icon className='size-4' />
            <span className='inline-flex items-center gap-2'>
              <span>{tab.label}</span>
              {tab.countLabel ? (
                <span className='text-muted-foreground text-xs font-medium'>{tab.countLabel}</span>
              ) : null}
            </span>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
