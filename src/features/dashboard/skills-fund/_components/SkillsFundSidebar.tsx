import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRight, Info } from 'lucide-react';
import type { SkillsFundActivityEntry, SkillsFundResource, SkillsFundTrackerEntry } from '../data';

const iconToneClasses = {
  amber: 'bg-warning/10 text-warning',
  blue: 'bg-primary/10 text-primary',
  green: 'bg-green-50 text-green-600',
  violet: 'bg-violet-50 text-violet-600',
} as const;

type SkillsFundSidebarProps = {
  activityEntries: SkillsFundActivityEntry[];
  resources: SkillsFundResource[];
  trackerEntries: SkillsFundTrackerEntry[];
  walletActionLabel: string;
  walletBalance: string;
  walletRemaining: string;
  walletSecondaryActionLabel: string;
  walletSubtitle: string;
  walletTitle: string;
  walletUtilizationLabel: string;
  walletUtilizationPercent: number;
};

function SidebarSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className='border-border bg-muted/20 rounded-[12px] border p-3'>
      <h2 className='text-foreground text-[1.05rem] font-semibold'>{title}</h2>
      <div className='mt-3'>{children}</div>
    </section>
  );
}

export function SkillsFundSidebar({
  activityEntries,
  resources,
  trackerEntries,
  walletActionLabel,
  walletBalance,
  walletRemaining,
  walletSecondaryActionLabel,
  walletSubtitle,
  walletTitle,
  walletUtilizationLabel,
  walletUtilizationPercent,
}: SkillsFundSidebarProps) {
  return (
    <aside className='grid w-full gap-3 self-start sm:grid-cols-2 xl:ml-auto xl:max-w-[400px] xl:grid-cols-1'>
      <SidebarSection title='Application Tracker'>
        <div className='border-border bg-card rounded-[10px] border p-3'>
          <div className='space-y-3'>
            {trackerEntries.map(entry => {
              const Icon = entry.icon;

              return (
                <div key={entry.id} className='flex items-start gap-3'>
                  <div
                    className={cn(
                      'mt-0.5 flex h-8 w-8 items-center justify-center rounded-full',
                      iconToneClasses[entry.iconTone]
                    )}
                  >
                    <Icon className='size-4' />
                  </div>
                  <div className='min-w-0'>
                    <p className='text-foreground truncate text-sm font-semibold'>{entry.title}</p>
                    <p className='text-muted-foreground text-[0.82rem]'>
                      {entry.amount} <span className='mx-1'>|</span> {entry.source}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <Button variant='outline' className='mt-3 h-9 w-full rounded-[8px] text-sm'>
            View All Applications
          </Button>
        </div>
      </SidebarSection>

      <SidebarSection title={walletTitle}>
        <div className='border-border bg-card rounded-[10px] border p-3'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <p className='text-foreground text-[1.95rem] leading-none font-semibold sm:text-[2.1rem]'>
                {walletBalance}
              </p>
              <p className='text-muted-foreground mt-1 text-sm'>{walletSubtitle}</p>
              <p className='text-muted-foreground/80 text-sm'>Total Limit: Ksh 50,000</p>
            </div>
          </div>

          <div className='mt-4 space-y-2'>
            <div className='text-foreground flex items-center justify-between text-[0.85rem] font-semibold'>
              <span className='inline-flex items-center gap-1'>
                Fund Utilization
                <Info className='text-muted-foreground size-3.5' />
              </span>
              <span>{walletUtilizationLabel}</span>
            </div>
            <div className='bg-muted h-2 overflow-hidden rounded-full'>
              <div
                className='bg-primary h-full rounded-full'
                style={{ width: `${walletUtilizationPercent}%` }}
              />
            </div>
            <p className='text-muted-foreground text-sm'>{walletRemaining}</p>
          </div>

          <div className='mt-4 space-y-2'>
            <Button className='h-9 w-full rounded-[8px] text-sm'>{walletActionLabel}</Button>
            <Button variant='outline' className='h-9 w-full rounded-[8px] text-sm'>
              {walletSecondaryActionLabel}
            </Button>
          </div>
        </div>
      </SidebarSection>

      <SidebarSection title='Fund Activity'>
        <div className='border-border bg-card rounded-[10px] border p-3'>
          <div className='space-y-3'>
            {activityEntries.map(entry => {
              const Icon = entry.icon;

              return (
                <div key={entry.id} className='flex items-start gap-3'>
                  <div
                    className={cn(
                      'mt-0.5 flex h-8 w-8 items-center justify-center rounded-full',
                      iconToneClasses[entry.iconTone]
                    )}
                  >
                    <Icon className='size-4' />
                  </div>
                  <div className='min-w-0'>
                    <p className='text-foreground text-sm font-semibold'>{entry.title}</p>
                    <p className='text-muted-foreground text-[0.82rem]'>
                      {entry.amount} <span className='mx-1'>•</span> {entry.date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <Button variant='outline' className='mt-3 h-9 w-full rounded-[8px] text-sm'>
            View Full History
          </Button>
        </div>
      </SidebarSection>

      <SidebarSection title='Top Funding Resources'>
        <div className='border-border bg-card rounded-[10px] border p-3'>
          <div className='space-y-2.5'>
            {resources.map(resource => {
              const Icon = resource.icon;

              return (
                <div
                  key={resource.id}
                  className='border-border/60 flex items-center gap-3 rounded-[8px] border px-2.5 py-2'
                >
                  <div className='bg-primary/10 text-primary flex h-7 w-7 items-center justify-center rounded-[7px]'>
                    <Icon className='size-4' />
                  </div>
                  <span className='text-foreground text-sm font-medium'>{resource.title}</span>
                </div>
              );
            })}
          </div>

          <Button className='mt-3 h-9 w-full rounded-[8px] text-sm'>
            View Wallet
            <ChevronRight className='size-4' />
          </Button>
        </div>
      </SidebarSection>
    </aside>
  );
}
