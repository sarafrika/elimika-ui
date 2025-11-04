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
  const kpis: AdminMetric[] = [
    {
      id: 'total-users',
      title: 'Total Users',
      value: toNumber(statistics?.user_metrics?.total_users),
      icon: Users,
      description: 'Registered users',
      trend: '+5.2%',
      trendDirection: 'up',
    },
    {
      id: 'active-users',
      title: 'Active Users (24h)',
      value: toNumber(statistics?.user_metrics?.active_users_24h),
      icon: UserCheck,
      description: 'Last 24 hours',
      trend: '+12.3%',
      trendDirection: 'up',
    },
    {
      id: 'new-users',
      title: 'New Users (7d)',
      value: toNumber(statistics?.user_metrics?.new_registrations_7d),
      icon: TrendingUp,
      description: 'Last 7 days',
      trend: '+8.1%',
      trendDirection: 'up',
    },
    {
      id: 'organizations-total',
      title: 'Organizations',
      value: toNumber(statistics?.organization_metrics?.total_organizations),
      icon: Building2,
      description: 'Total organizations',
      trend: '+2.4%',
      trendDirection: 'up',
    },
    {
      id: 'organizations-active',
      title: 'Active Organizations',
      value: toNumber(statistics?.organization_metrics?.active_organizations),
      icon: Activity,
      description: 'Currently active',
      trend: '+1.8%',
      trendDirection: 'up',
    },
    {
      id: 'pending-approvals',
      title: 'Pending Approvals',
      value: toNumber(statistics?.organization_metrics?.pending_approvals),
      icon: AlertCircle,
      description: 'Awaiting review',
      trend: null,
      trendDirection: null,
      highlight: true,
    },
    {
      id: 'total-courses',
      title: 'Total Courses',
      value: toNumber(statistics?.content_metrics?.total_courses),
      icon: BookOpen,
      description: 'Platform courses',
      trend: '+15.7%',
      trendDirection: 'up',
    },
    {
      id: 'total-admins',
      title: 'Total Admins',
      value: toNumber(statistics?.admin_metrics?.total_admins),
      icon: Shield,
      description: 'System administrators',
      trend: null,
      trendDirection: null,
    },
  ];

  return <AdminMetricGrid metrics={kpis} isLoading={isLoading} skeletonCount={8} />;
}
