import type { DashboardChildrenTypes } from '@/lib/types';
import { DashboardClientLayout } from '@/src/features/dashboard/layouts/DashboardClientLayout';

export default function DashboardLayout(dashboardProps: DashboardChildrenTypes) {
  return <DashboardClientLayout {...dashboardProps} />;
}
