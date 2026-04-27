'use client';

import { ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
      <Card className='gap-4 rounded-[18px] border-white/60 bg-card/95 px-4 py-4 shadow-sm'>
        <div className='border-b pb-4'>
          <h2 className='text-foreground text-lg font-semibold'>{heading}</h2>
          <p className='text-muted-foreground mt-1 text-sm'>{count}</p>
        </div>

        {groups.map(group => {
          const GroupIcon = group.icon;

          return (
            <section key={group.title} className='space-y-3 border-b pb-4 last:border-b-0 last:pb-0'>
              <div className='text-foreground flex items-center justify-between gap-3 text-base font-semibold'>
                <span className='flex items-center gap-2'>
                  <GroupIcon className='text-primary size-4' />
                  {group.title}
                </span>
                <ChevronRight className='text-muted-foreground size-4' />
              </div>

              <div className='space-y-2'>
                {group.items.map(item => (
                  <button
                    key={item.label}
                    type='button'
                    onClick={item.onSelect}
                    className='hover:bg-muted/40 flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors'
                    aria-pressed={item.active}
                  >
                    <span className='flex items-center gap-3'>
                      <span
                        className={
                          item.active
                            ? 'border-primary bg-primary/10 h-4 w-4 rounded-full border-2'
                            : 'border-muted-foreground/40 h-4 w-4 rounded-full border-2'
                        }
                      />
                      <span className={item.active ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                        {item.label}
                      </span>
                    </span>
                    {item.count ? (
                      <Badge
                        variant='secondary'
                        className='rounded-md bg-[color-mix(in_srgb,var(--primary)_10%,white)] px-2 py-0.5 text-primary'
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

        <Button className='w-full rounded-xl' onClick={onSetAlertsClick} disabled={!onSetAlertsClick}>
          {setAlertLabel}
        </Button>

        <Button
          variant='outline'
          className='w-full justify-between rounded-xl border-white/70 bg-background/80'
          onClick={onApplicationsClick}
          disabled={!onApplicationsClick}
        >
          {applicationsLabel}
          <ChevronRight className='size-4' />
        </Button>
      </Card>
    </aside>
  );
}
