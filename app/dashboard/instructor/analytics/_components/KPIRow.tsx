'use client';

import { Calendar, CheckCircle, Clock, Users } from 'lucide-react';
import { useInstructorAnalyticsData } from './useInstructorAnalyticsData';

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  iconBg: string;
}

function KPICard({ label, value, sub, change, positive, icon, iconBg }: KPICardProps) {
  return (
    <div className='border-border bg-card min-w-[140px] flex-1 rounded-xl border p-3 shadow-sm sm:p-4'>
      <div className='flex items-start justify-between gap-2'>
        <div className='min-w-0'>
          <p className='text-muted-foreground text-xs leading-tight sm:text-sm'>{label}</p>

          <div className='mt-1 flex flex-wrap items-baseline gap-1'>
            <span className='text-foreground text-xl leading-none font-bold sm:text-2xl lg:text-3xl'>
              {value}
            </span>

            {sub && (
              <span className='text-muted-foreground text-sm font-medium sm:text-base'>{sub}</span>
            )}
          </div>

          <div className='mt-1.5 flex items-center gap-1'>
            <span
              className={`text-xs font-semibold ${positive ? 'text-success' : 'text-destructive'}`}
            >
              {positive ? '▲' : '▼'} {change}
            </span>

            {/* <span className="truncate text-xs text-muted-foreground">
              vs Apr 1 – Apr 30
            </span> */}
          </div>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${iconBg}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function KPIRow() {
  const { metrics } = useInstructorAnalyticsData();

  const kpis: KPICardProps[] = [
    {
      label: 'Total Sessions',
      value: String(metrics.totalSessions),
      change: '—',
      positive: true,
      iconBg: 'bg-primary/5',
      icon: <Calendar className='text-primary h-4 w-4 sm:h-5 sm:w-5' />,
    },
    {
      label: 'Sessions Completed',
      value: String(metrics.completedSessions),
      sub:
        metrics.totalSessions > 0
          ? `(${Math.round((metrics.completedSessions / metrics.totalSessions) * 100)}%)`
          : '(0%)',
      change: '—',
      positive: true,
      iconBg: 'bg-success/5',
      icon: <CheckCircle className='text-success h-4 w-4 sm:h-5 sm:w-5' />,
    },
    {
      label: 'Participants Trained',
      value: String(metrics.participantsTrained),
      change: '—',
      positive: metrics.participantsTrained >= 0,
      iconBg: 'bg-warning/5',
      icon: <Users className='text-warning h-4 w-4 sm:h-5 sm:w-5' />,
    },
    {
      label: 'Completion Rate',
      value: `${metrics.completionRate}%`,
      change: '—',
      positive: metrics.completionRate >= 0,
      iconBg: 'bg-accent/5',
      icon: (
        <svg viewBox='0 0 36 36' className='h-4 w-4 sm:h-5 sm:w-5'>
          <circle
            cx='18'
            cy='18'
            r='15'
            fill='none'
            stroke='currentColor'
            className='text-muted'
            strokeWidth='3'
          />
          <circle
            cx='18'
            cy='18'
            r='15'
            fill='none'
            stroke='currentColor'
            className='text-primary/55'
            strokeWidth='3'
            strokeDasharray={`${Math.min(metrics.completionRate, 100)} 100`}
            strokeLinecap='round'
            transform='rotate(-90 18 18)'
          />
        </svg>
      ),
    },
    {
      label: 'Average Satisfaction',
      value: metrics.averageSatisfaction !== null ? metrics.averageSatisfaction.toFixed(1) : 'N/A',
      sub: metrics.averageSatisfaction !== null ? '/5' : undefined,
      change: '—',
      positive: metrics.averageSatisfaction !== null,
      iconBg: 'bg-destructive/10',
      icon: (
        <svg
          viewBox='0 0 24 24'
          className='text-destructive h-4 w-4 fill-none stroke-current stroke-2 sm:h-5 sm:w-5'
        >
          <polygon points='12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26' />
        </svg>
      ),
    },
    {
      label: 'Training Hours Delivered',
      value: String(metrics.trainingHours),
      change: '—',
      positive: metrics.trainingHours >= 0,
      iconBg: 'bg-muted',
      icon: <Clock className='text-muted-foreground h-4 w-4 sm:h-5 sm:w-5' />,
    },
  ];

  return (
    <div className='flex flex-wrap gap-3'>
      {kpis.map(kpi => (
        <KPICard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
