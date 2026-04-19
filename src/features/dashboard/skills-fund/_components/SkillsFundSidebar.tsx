import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRight, Info } from 'lucide-react';
import type {
  SkillsFundActivityEntry,
  SkillsFundResource,
  SkillsFundTrackerEntry,
} from '../data';

const iconToneClasses = {
  amber: 'bg-amber-50 text-amber-600',
  blue: 'bg-blue-50 text-blue-600',
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

function SidebarSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className='rounded-[12px] border border-slate-200 bg-[#f6f8ff] p-3'>
      <h2 className='text-[1.05rem] font-semibold text-slate-800'>{title}</h2>
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
    <aside className='grid w-full gap-3 self-start sm:grid-cols-2 xl:ml-auto xl:max-w-[272px] xl:grid-cols-1'>
      <SidebarSection title='Application Tracker'>
        <div className='rounded-[10px] border border-slate-200 bg-white p-3'>
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
                    <p className='truncate text-sm font-semibold text-slate-800'>{entry.title}</p>
                    <p className='text-[0.82rem] text-slate-500'>
                      {entry.amount} <span className='mx-1'>|</span> {entry.source}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            variant='outline'
            className='mt-3 h-9 w-full rounded-[8px] border-slate-300 text-sm text-blue-700 hover:bg-blue-50'
          >
            View All Applications
          </Button>
        </div>
      </SidebarSection>

      <SidebarSection title={walletTitle}>
        <div className='rounded-[10px] border border-slate-200 bg-white p-3'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <p className='text-[1.95rem] font-semibold leading-none text-slate-900 sm:text-[2.1rem]'>
                {walletBalance}
              </p>
              <p className='mt-1 text-sm text-slate-500'>{walletSubtitle}</p>
              <p className='text-sm text-slate-400'>Total Limit: Ksh 50,000</p>
            </div>
          </div>

          <div className='mt-4 space-y-2'>
            <div className='flex items-center justify-between text-[0.85rem] font-semibold text-slate-700'>
              <span className='inline-flex items-center gap-1'>
                Fund Utilization
                <Info className='size-3.5 text-slate-400' />
              </span>
              <span>{walletUtilizationLabel}</span>
            </div>
            <div className='h-2 overflow-hidden rounded-full bg-slate-100'>
              <div
                className='h-full rounded-full bg-blue-500'
                style={{ width: `${walletUtilizationPercent}%` }}
              />
            </div>
            <p className='text-sm text-slate-500'>{walletRemaining}</p>
          </div>

          <div className='mt-4 space-y-2'>
            <Button className='h-9 w-full rounded-[8px] bg-blue-600 text-sm hover:bg-blue-700'>
              {walletActionLabel}
            </Button>
            <Button
              variant='outline'
              className='h-9 w-full rounded-[8px] border-slate-300 text-sm text-blue-700 hover:bg-blue-50'
            >
              {walletSecondaryActionLabel}
            </Button>
          </div>
        </div>
      </SidebarSection>

      <SidebarSection title='Fund Activity'>
        <div className='rounded-[10px] border border-slate-200 bg-white p-3'>
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
                    <p className='text-sm font-semibold text-slate-800'>{entry.title}</p>
                    <p className='text-[0.82rem] text-slate-500'>
                      {entry.amount} <span className='mx-1'>•</span> {entry.date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            variant='outline'
            className='mt-3 h-9 w-full rounded-[8px] border-slate-300 text-sm text-blue-700 hover:bg-blue-50'
          >
            View Full History
          </Button>
        </div>
      </SidebarSection>

      <SidebarSection title='Top Funding Resources'>
        <div className='rounded-[10px] border border-slate-200 bg-white p-3'>
          <div className='space-y-2.5'>
            {resources.map(resource => {
              const Icon = resource.icon;

              return (
                <div
                  key={resource.id}
                  className='flex items-center gap-3 rounded-[8px] border border-slate-100 px-2.5 py-2'
                >
                  <div className='flex h-7 w-7 items-center justify-center rounded-[7px] bg-blue-50 text-blue-600'>
                    <Icon className='size-4' />
                  </div>
                  <span className='text-sm font-medium text-slate-700'>{resource.title}</span>
                </div>
              );
            })}
          </div>

          <Button className='mt-3 h-9 w-full rounded-[8px] bg-blue-600 text-sm hover:bg-blue-700'>
            View Wallet
            <ChevronRight className='size-4' />
          </Button>
        </div>
      </SidebarSection>
    </aside>
  );
}
