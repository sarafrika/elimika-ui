import { Users, Building2, BookOpen, Shield, Activity, UserCheck, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { AdminDashboardStats } from '@/services/client/types.gen';

interface KPICardsProps {
  statistics?: AdminDashboardStats;
  isLoading: boolean;
}

export default function KPICards({ statistics, isLoading }: KPICardsProps) {
  const userMetrics = statistics?.user_metrics;
  const organizationMetrics = statistics?.organization_metrics;
  const learningMetrics = statistics?.learning_metrics;
  const adminMetrics = statistics?.admin_metrics;

  const kpis = [
    {
      title: 'Total Users',
      value: userMetrics?.total_users,
      icon: Users,
      description: 'Registered platform-wide users',
    },
    {
      title: 'Active Users (24h)',
      value: userMetrics?.active_users_24h,
      icon: UserCheck,
      description: 'Signed in during the last 24 hours',
    },
    {
      title: 'New Registrations (7d)',
      value: userMetrics?.new_registrations_7d,
      icon: Activity,
      description: 'Accounts created in the past 7 days',
    },
    {
      title: 'Organizations',
      value: organizationMetrics?.total_organizations,
      icon: Building2,
      description: 'Organizations onboarded onto Elimika',
    },
    {
      title: 'Active Organizations',
      value: organizationMetrics?.active_organizations,
      icon: CheckCircle2,
      description: 'Organizations with active status',
    },
    {
      title: 'Pending Organization Approvals',
      value: organizationMetrics?.pending_approvals,
      icon: AlertTriangle,
      description: 'Awaiting onboarding review',
      highlight: true,
    },
    {
      title: 'Total Courses',
      value: learningMetrics?.total_courses ?? learningMetrics?.published_courses,
      icon: BookOpen,
      description: 'Courses available across the platform',
    },
    {
      title: 'Total Admins',
      value: adminMetrics?.total_admins,
      icon: Shield,
      description: 'System and organization administrators',
    },
  ];

  if (isLoading) {
    return (
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-8 w-8 rounded-full' />
            </CardHeader>
            <CardContent>
              <Skeleton className='mb-2 h-8 w-16' />
              <Skeleton className='h-3 w-32' />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {kpis.map((kpi, index) => (
        <Card key={index} className={`flex flex-col ${kpi.highlight ? 'border-warning bg-warning/5' : ''}`}>
          <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-2'>
            <div className='flex items-center gap-2'>
              <CardTitle className='text-sm font-medium'>{kpi.title}</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className='h-4 w-4 text-muted-foreground cursor-help flex-shrink-0' />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{kpi.description}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div
              className={`rounded-full p-2 flex-shrink-0 ${kpi.highlight ? 'bg-warning/20' : 'bg-primary/10'}`}
            >
              <kpi.icon className={`h-4 w-4 ${kpi.highlight ? 'text-warning' : 'text-primary'}`} />
            </div>
          </CardHeader>
          <CardContent className='flex-grow flex items-end'>
            <div className='text-2xl font-bold'>{kpi.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
