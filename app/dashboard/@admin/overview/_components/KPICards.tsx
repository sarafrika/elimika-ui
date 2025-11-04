import { DashboardGrid, DashboardKpiCard } from '@/components/ui/dashboard';
import type { DashboardIconName } from '@/components/icons';

interface KPICardsProps {
  statistics: any;
  isLoading: boolean;
}

export default function KPICards({ statistics, isLoading }: KPICardsProps) {
  type KpiDefinition = {
    key: string;
    title: string;
    value: number;
    caption: string;
    icon: DashboardIconName;
    trend?: { value: string; direction?: 'up' | 'down' | 'flat'; tone?: 'positive' | 'negative' | 'warning'; };
    highlight?: 'warning' | 'critical' | 'success';
  };

  const kpis: KpiDefinition[] = [
    {
      key: 'total-users',
      title: 'Total users',
      value: statistics?.user_metrics?.total_users ?? 0,
      caption: 'Registered users',
      icon: 'users',
      trend: { value: '+5.2%', direction: 'up', tone: 'positive' },
    },
    {
      key: 'active-users',
      title: 'Active users (24h)',
      value: statistics?.user_metrics?.active_users_24h ?? 0,
      caption: 'Last 24 hours',
      icon: 'user-active',
      trend: { value: '+12.3%', direction: 'up', tone: 'positive' },
    },
    {
      key: 'new-users',
      title: 'New users (7d)',
      value: statistics?.user_metrics?.new_registrations_7d ?? 0,
      caption: 'Last 7 days',
      icon: 'trend-up',
      trend: { value: '+8.1%', direction: 'up', tone: 'positive' },
    },
    {
      key: 'organizations',
      title: 'Organizations',
      value: statistics?.organization_metrics?.total_organizations ?? 0,
      caption: 'Total organisations',
      icon: 'organizations',
      trend: { value: '+2.4%', direction: 'up', tone: 'positive' },
    },
    {
      key: 'active-organizations',
      title: 'Active organisations',
      value: statistics?.organization_metrics?.active_organizations ?? 0,
      caption: 'Currently active',
      icon: 'activity',
      trend: { value: '+1.8%', direction: 'up', tone: 'positive' },
    },
    {
      key: 'pending-approvals',
      title: 'Pending approvals',
      value: statistics?.organization_metrics?.pending_approvals ?? 0,
      caption: 'Awaiting review',
      icon: 'warning',
      highlight: 'warning',
    },
    {
      key: 'total-courses',
      title: 'Total courses',
      value: statistics?.content_metrics?.total_courses ?? 0,
      caption: 'Platform courses',
      icon: 'courses',
      trend: { value: '+15.7%', direction: 'up', tone: 'positive' },
    },
    {
      key: 'total-admins',
      title: 'Total admins',
      value: statistics?.admin_metrics?.total_admins ?? 0,
      caption: 'System administrators',
      icon: 'security',
    },
  ];

  return (
    <DashboardGrid columns='4'>
      {kpis.map(kpi => (
        <DashboardKpiCard
          key={kpi.key}
          title={kpi.title}
          value={kpi.value}
          caption={kpi.caption}
          icon={kpi.icon}
          trend={kpi.trend}
          highlight={kpi.highlight}
          isLoading={isLoading}
        />
      ))}
    </DashboardGrid>
  );
}
