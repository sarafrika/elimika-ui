import type { ReactNode } from 'react';

interface Stat {
  value: number;
  label: string;
  icon: ReactNode;
  tone?: 'info';
}

interface OverviewStatsProps {
  stats: Stat[];
}

export function OverviewStats({ stats }: OverviewStatsProps) {
  return (
    <dl className='divide-border grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0'>
      {stats.map(stat => (
        <div key={stat.label} className='flex min-w-0 items-center gap-3.5 px-5 py-4'>
          <div
            aria-hidden='true'
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${stat.tone === 'info' ? 'bg-info/10 text-info' : 'bg-primary/10 text-primary'}`}
          >
            {stat.icon}
          </div>
          <div className='flex min-w-0 flex-col'>
            <dt className='text-muted-foreground order-last mt-1 text-xs'>{stat.label}</dt>
            <dd className='text-foreground text-[26px] leading-none font-semibold tabular-nums'>
              {stat.value}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
