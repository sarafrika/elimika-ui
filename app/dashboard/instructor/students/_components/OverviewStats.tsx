import React from 'react';

interface Stat {
  value: number;
  label: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

interface OverviewStatsProps {
  stats: Stat[];
}

export function OverviewStats({ stats }: OverviewStatsProps) {
  return (
    <div className='flex flex-wrap gap-2'>
      {stats.map((stat, i) => (
        <div
          key={i}
          className={`flex min-w-[90px] flex-1 flex-col items-center justify-center rounded-xl border px-2 py-3 transition-colors ${
            stat.highlight ? 'bg-primary/5 border-primary/20' : 'bg-background border-border'
          }`}
        >
          <div className='text-primary'>{stat.icon}</div>
          <p className='text-foreground text-xl font-bold'>{stat.value}</p>
          <p className='text-muted-foreground text-center text-xs leading-tight'>{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
