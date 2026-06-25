import {
  BadgeCheck,
  BookOpen,
  Building2,
  FileClock,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { getDashboardStatistics } from '@/services/client';
import type { AdminDashboardStats } from '@/services/client';
import { StatCard } from '../../_components/ui/StatCard';

function n(value?: bigint | number | null): string {
  if (value == null) return '0';
  return Number(value).toLocaleString();
}

export async function KpiSection() {
  const { data } = await getDashboardStatistics().catch(() => ({ data: undefined }));
  const stats = (data?.data ?? {}) as AdminDashboardStats;

  const cards = [
    {
      label: 'Total users',
      value: n(stats.user_metrics?.total_users),
      hint: `${n(stats.user_metrics?.suspended_accounts)} suspended`,
      icon: Users,
      tone: 'info' as const,
    },
    {
      label: 'Organisations',
      value: n(stats.organisation_metrics?.total_organisations),
      hint: `${n(stats.organisation_metrics?.pending_approvals)} pending approval`,
      icon: Building2,
      tone: 'info' as const,
    },
    {
      label: 'Courses',
      value: n(stats.content_metrics?.total_courses),
      hint: `${n(stats.content_metrics?.pending_moderation)} pending moderation`,
      icon: BookOpen,
      tone: 'info' as const,
    },
    {
      label: 'Verified instructors',
      value: n(stats.compliance_metrics?.verified_instructors),
      hint: `${n(stats.compliance_metrics?.pending_instructor_verifications)} pending`,
      icon: BadgeCheck,
      tone: 'success' as const,
    },
    {
      label: 'Pending documents',
      value: n(stats.compliance_metrics?.pending_instructor_documents),
      hint: 'Awaiting verification',
      icon: FileClock,
      tone: 'warning' as const,
    },
    {
      label: 'Orders',
      value: n(stats.commerce_metrics?.total_orders),
      hint: `${n(stats.commerce_metrics?.unique_customers)} unique customers`,
      icon: ShoppingCart,
      tone: 'info' as const,
    },
  ];

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {cards.map(card => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
