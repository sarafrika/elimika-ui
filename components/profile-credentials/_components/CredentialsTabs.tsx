'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

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
  className?: string;
  listClassName?: string;
  triggerClassName?: string;
  rightSlot?: ReactNode;
};

export function CredentialsTabs({
  tabs,
  className,
  listClassName,
  triggerClassName,
  rightSlot,
}: CredentialsTabsProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between',
        className
      )}
    >
      <TabsList
        className={cn(
          'h-auto w-full flex-wrap justify-start gap-2 rounded-[16px] border bg-card/95 p-2 shadow-sm xl:w-fit',
          listClassName
        )}
      >
        {tabs.map(tab => {
          const Icon = tab.icon;

          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'min-h-11 rounded-lg px-4 text-sm font-medium',
                'data-[state=active]:bg-[color-mix(in_srgb,var(--primary)_10%,white)]',
                'data-[state=active]:dark:bg-[color-mix(in_srgb,var(--primary)_45%,black_55%)]',
                'data-[state=active]:text-foreground',
                triggerClassName
              )}
            >
              <Icon className='size-4' />
              <span className='inline-flex items-center gap-2'>
                <span>{tab.label}</span>
                {tab.countLabel ? (
                  <span className='text-muted-foreground text-xs font-medium'>
                    {tab.countLabel}
                  </span>
                ) : null}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {rightSlot ? <div className='flex w-full justify-start xl:w-auto xl:justify-end'>{rightSlot}</div> : null}
    </div>
  );
}
