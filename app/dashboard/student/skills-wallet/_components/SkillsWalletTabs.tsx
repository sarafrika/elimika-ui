'use client';

import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type SkillsWalletTabConfig = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type SkillsWalletTabsProps = {
  tabs: ReadonlyArray<SkillsWalletTabConfig>;
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function SkillsWalletTabs({ tabs, activeTab, onTabChange }: SkillsWalletTabsProps) {
  return (
    <div className='mt-4 -mx-4 overflow-x-auto px-4 no-scrollbar'>
      <div className='flex gap-2 min-w-max'>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type='button'
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm whitespace-nowrap transition-colors',
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border hover:border-primary hover:text-primary'
              )}
            >
              <Icon className='h-3.5 w-3.5' />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
