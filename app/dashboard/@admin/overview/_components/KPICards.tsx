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
import { AdminMetric, AdminMetricGrid } from '@/components/admin/admin-metric-card';

interface KPICardsProps {
  statistics: any;
  isLoading: boolean;
}

export default function KPICards({ statistics, isLoading }: KPICardsProps) {
  const kpis: AdminMetric[] = [
    {
      id: 'total-users',
      title: 'Total Users',
      value: statistics?.user_metrics?.total_users ?? 0,
      icon: Users,
      description: 'Registered users',
      trend: '+5.2%',
      trendDirection: 'up',
    },
    {
      id: 'active-users',
      title: 'Active Users (24h)',
      value: statistics?.user_metrics?.active_users_24h ?? 0,
      icon: UserCheck,
      description: 'Last 24 hours',
      trend: '+12.3%',
      trendDirection: 'up',
    },
    {
      id: 'new-users',
      title: 'New Users (7d)',
      value: statistics?.user_metrics?.new_registrations_7d ?? 0,
      icon: TrendingUp,
      description: 'Last 7 days',
      trend: '+8.1%',
      trendDirection: 'up',
    },
    {
      id: 'organizations-total',
      title: 'Organizations',
      value: statistics?.organization_metrics?.total_organizations ?? 0,
      icon: Building2,
      description: 'Total organizations',
      trend: '+2.4%',
      trendDirection: 'up',
    },
    {
      id: 'organizations-active',
      title: 'Active Organizations',
      value: statistics?.organization_metrics?.active_organizations ?? 0,
      icon: Activity,
      description: 'Currently active',
      trend: '+1.8%',
      trendDirection: 'up',
    },
    {
      id: 'pending-approvals',
      title: 'Pending Approvals',
      value: statistics?.organization_metrics?.pending_approvals ?? 0,
      icon: AlertCircle,
      description: 'Awaiting review',
      trend: null,
      trendDirection: null,
      highlight: true,
    },
    {
      id: 'total-courses',
      title: 'Total Courses',
      value: statistics?.content_metrics?.total_courses ?? 0,
      icon: BookOpen,
      description: 'Platform courses',
      trend: '+15.7%',
      trendDirection: 'up',
    },
    {
      id: 'total-admins',
      title: 'Total Admins',
      value: statistics?.admin_metrics?.total_admins ?? 0,
      icon: Shield,
      description: 'System administrators',
      trend: null,
      trendDirection: null,
    },
  ];

  return <AdminMetricGrid metrics={kpis} isLoading={isLoading} skeletonCount={8} />;
}
