'use client';

import { Award, Calendar, ClipboardList, FileCheck, Users } from 'lucide-react';
import { useInstructorAnalyticsData } from './useInstructorAnalyticsData';

interface MetricCardProps {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  iconBg: string;
}

function MetricCard({ label, value, change, positive, icon, iconBg }: MetricCardProps) {
  return (
    <div className='bg-card border-border min-w-[120px] flex-1 rounded-xl border p-3 shadow-sm sm:p-4'>
      <div className='flex items-start gap-2'>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
          {icon}
        </div>
        <div className='min-w-0'>
          <p className='text-muted-foreground truncate text-xs leading-tight'>{label}</p>
          <p className='text-foreground mt-0.5 text-lg leading-none font-bold sm:text-xl lg:text-2xl'>
            {value}
          </p>
          <div className='mt-1 flex items-center gap-1'>
            <span
              className={`text-xs font-semibold ${positive ? 'text-success' : 'text-destructive'}`}
            >
              {positive ? '▲' : '▼'} {change}
            </span>
            {/* <span className="text-xs text-muted-foreground truncate">vs Apr 1 – Apr 30</span> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DetailedMetrics() {
  const { metrics: metData } = useInstructorAnalyticsData();

  const metrics: MetricCardProps[] = [
    {
      label: 'No. of Programs',
      value: String(metData.numberOfPrograms),
      change: '0',
      positive: true,
      iconBg: 'bg-primary/10',
      icon: <Calendar className='text-primary h-4 w-4' />,
    },
    {
      label: 'No. of Instructors',
      value: String(metData.totalInstructors),
      change: '0',
      positive: true,
      iconBg: 'bg-primary/10',
      icon: <Users className='text-primary h-4 w-4' />,
    },
    {
      label: 'Active Participants',
      value: String(metData.activeParticipants),
      change: '0%',
      positive: true,
      iconBg: 'bg-success/10',
      icon: <Users className='text-success h-4 w-4' />,
    },
    {
      label: 'Assessments Conducted',
      value: String(metData.assessmentsConducted),
      change: '0%',
      positive: true,
      iconBg: 'bg-warning/10',
      icon: <ClipboardList className='text-warning h-4 w-4' />,
    },
    {
      label: 'Certificates Issued',
      value: String(metData.certificatesIssues),
      change: '0%',
      positive: true,
      iconBg: 'bg-accent/10',
      icon: <Award className='text-accent h-4 w-4' />,
    },
    {
      label: 'Surveys Completed',
      value: String(metData.surveysCompleted),
      change: '0%',
      positive: true,
      iconBg: 'bg-success/10',
      icon: <FileCheck className='text-success h-4 w-4' />,
    },
  ];

  return (
    <div className=''>
      <h3 className='text-foreground mb-3 text-xs font-semibold sm:text-sm'>Detailed Metrics</h3>
      <div className='flex flex-wrap gap-3'>
        {metrics.map(m => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>
    </div>
  );
}
