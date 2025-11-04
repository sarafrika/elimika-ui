import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Building2,
  BookOpen,
  Shield,
  TrendingUp,
  AlertCircle,
  Activity,
  UserCheck,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminDashboardStatsDTO } from '@/services/api/actions';

interface KPICardsProps {
  statistics?: AdminDashboardStatsDTO;
  isLoading: boolean;
}

const toNumber = (value?: bigint | number | string | null) => {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const formatMetric = (value: number) => value.toLocaleString();

export default function KPICards({ statistics, isLoading }: KPICardsProps) {
  const kpis = [
    {
      title: 'Total Users',
      value: toNumber(statistics?.user_metrics?.total_users),
      icon: Users,
      description: 'Registered users',
      trend: '+5.2%',
      trendUp: true,
    },
    {
      title: 'Active Users (24h)',
      value: toNumber(statistics?.user_metrics?.active_users_24h),
      icon: UserCheck,
      description: 'Last 24 hours',
      trend: '+12.3%',
      trendUp: true,
    },
    {
      title: 'New Users (7d)',
      value: toNumber(statistics?.user_metrics?.new_registrations_7d),
      icon: TrendingUp,
      description: 'Last 7 days',
      trend: '+8.1%',
      trendUp: true,
    },
    {
      title: 'Organizations',
      value: toNumber(statistics?.organization_metrics?.total_organizations),
      icon: Building2,
      description: 'Total organizations',
      trend: '+2.4%',
      trendUp: true,
    },
    {
      title: 'Active Organizations',
      value: toNumber(statistics?.organization_metrics?.active_organizations),
      icon: Activity,
      description: 'Currently active',
      trend: '+1.8%',
      trendUp: true,
    },
    {
      title: 'Pending Approvals',
      value: toNumber(statistics?.organization_metrics?.pending_approvals),
      icon: AlertCircle,
      description: 'Awaiting review',
      trend: null,
      trendUp: null,
      highlight: true,
    },
    {
      title: 'Total Courses',
      value: toNumber(statistics?.content_metrics?.total_courses),
      icon: BookOpen,
      description: 'Platform courses',
      trend: '+15.7%',
      trendUp: true,
    },
    {
      title: 'Total Admins',
      value: toNumber(statistics?.admin_metrics?.total_admins),
      icon: Shield,
      description: 'System administrators',
      trend: null,
      trendUp: null,
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
        <Card key={index} className={kpi.highlight ? 'border-warning bg-warning/5' : ''}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>{kpi.title}</CardTitle>
            <div
              className={`rounded-full p-2 ${kpi.highlight ? 'bg-warning/20' : 'bg-primary/10'}`}
            >
              <kpi.icon className={`h-4 w-4 ${kpi.highlight ? 'text-warning' : 'text-primary'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatMetric(kpi.value)}</div>
            <div className='flex items-center justify-between'>
              <p className='text-muted-foreground text-xs'>{kpi.description}</p>
              {kpi.trend && (
                <Badge variant={kpi.trendUp ? 'success' : 'destructive'} className='text-xs'>
                  {kpi.trend}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
