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

interface KPICardsProps {
  statistics: any;
  isLoading: boolean;
}

export default function KPICards({ statistics, isLoading }: KPICardsProps) {
  const kpis = [
    {
      title: 'Total Users',
      value: statistics?.user_metrics?.total_users ?? 0,
      icon: Users,
      description: 'Registered users',
      trend: '+5.2%',
      trendUp: true,
    },
    {
      title: 'Active Users (24h)',
      value: statistics?.user_metrics?.active_users_24h ?? 0,
      icon: UserCheck,
      description: 'Last 24 hours',
      trend: '+12.3%',
      trendUp: true,
    },
    {
      title: 'New Users (7d)',
      value: statistics?.user_metrics?.new_registrations_7d ?? 0,
      icon: TrendingUp,
      description: 'Last 7 days',
      trend: '+8.1%',
      trendUp: true,
    },
    {
      title: 'Organizations',
      value: statistics?.organization_metrics?.total_organizations ?? 0,
      icon: Building2,
      description: 'Total organizations',
      trend: '+2.4%',
      trendUp: true,
    },
    {
      title: 'Active Organizations',
      value: statistics?.organization_metrics?.active_organizations ?? 0,
      icon: Activity,
      description: 'Currently active',
      trend: '+1.8%',
      trendUp: true,
    },
    {
      title: 'Pending Approvals',
      value: statistics?.organization_metrics?.pending_approvals ?? 0,
      icon: AlertCircle,
      description: 'Awaiting review',
      trend: null,
      trendUp: null,
      highlight: true,
    },
    {
      title: 'Total Courses',
      value: statistics?.content_metrics?.total_courses ?? 0,
      icon: BookOpen,
      description: 'Platform courses',
      trend: '+15.7%',
      trendUp: true,
    },
    {
      title: 'Total Admins',
      value: statistics?.admin_metrics?.total_admins ?? 0,
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
            <div className='text-2xl font-bold'>{kpi.value.toLocaleString()}</div>
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
