'use client';

import { ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { FilterGroup } from '../data';

type MarketplaceSidebarProps = {
  heading: string;
  count: string;
  groups: FilterGroup[];
  setAlertLabel: string;
  applicationsLabel: string;
  onSetAlertsClick?: () => void;
  onApplicationsClick?: () => void;
};

export function MarketplaceSidebar({
  heading,
  count,
  groups,
  setAlertLabel,
  applicationsLabel,
  onSetAlertsClick,
  onApplicationsClick,
}: MarketplaceSidebarProps) {
  return (
    <aside className='space-y-4'>
      <div className='space-y-4 rounded-md border border-border/70 bg-card px-4 py-4 shadow-sm'>
        <div className='border-b border-border/60 pb-4'>
          <h2 className='text-foreground text-base font-semibold'>{heading}</h2>
          <p className='text-muted-foreground mt-1 text-sm'>{count}</p>
        </div>

        {groups.map(group => {
          const GroupIcon = group.icon;

          return (
            <section key={group.title} className='space-y-2 border-b border-border/60 pb-4 last:border-b-0 last:pb-0'>
              <div className='text-muted-foreground text-xs font-medium uppercase tracking-wide flex items-center gap-2'>
                <GroupIcon className='text-primary size-4' />
                {group.title}
              </div>

              <div className='space-y-1'>
                {group.items.map(item => (
                  <button
                    key={item.label}
                    type='button'
                    onClick={item.onSelect}
                    className={
                      item.active
                        ? 'bg-primary/10 flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left transition-colors'
                        : 'hover:bg-muted/40 flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left transition-colors'
                    }
                    aria-pressed={item.active}
                  >
                    <span className='flex items-center gap-2.5'>
                      <span
                        className={
                          item.active
                            ? 'border-primary bg-primary size-3.5 rounded-full border-2'
                            : 'border-muted-foreground/40 size-3.5 rounded-full border-2'
                        }
                      />
                      <span className={item.active ? 'text-foreground text-sm font-medium' : 'text-muted-foreground text-sm'}>
                        {item.label}
                      </span>
                    </span>
                    {item.count ? (
                      <Badge
                        variant='outline'
                        className='rounded-md border-border/70 bg-muted/40 px-2 py-0.5 text-xs tabular-nums text-muted-foreground'
                      >
                        {item.count}
                      </Badge>
                    ) : null}
                  </button>
                ))}
              </div>
            </section>
          );
        })}

        <Button className='w-full' onClick={onSetAlertsClick} disabled={!onSetAlertsClick}>
          {setAlertLabel}
        </Button>

        <Button
          variant='outline'
          className='w-full justify-between'
          onClick={onApplicationsClick}
          disabled={!onApplicationsClick}
        >
          {applicationsLabel}
          <ChevronRight className='size-4' />
        </Button>
      </div>
    </aside>
  );
}
