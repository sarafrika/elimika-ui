'use client';

import {
  InstructorClassOverviewPage,
  type InstructorClassOverviewRoute,
} from '@/app/dashboard/instructor/_components/class-overview/InstructorClassOverviewPage';
import { surfaceTheme } from '@/components/data-display';
import { cn } from '@/lib/utils';

export { socialShareActions } from '@/app/dashboard/instructor/_components/class-overview/InstructorClassOverviewPage';

const ROUTE: InstructorClassOverviewRoute = {
  section: { id: 'trainings', title: 'Classes', url: '/dashboard/instructor/classes' },
  overviewBase: '/dashboard/instructor/classes/overview',
  editHref: uuid => `/dashboard/instructor/classes/new?id=${uuid}`,
  showShareLinks: false,
  containerClassName: cn(surfaceTheme.pageWide, 'pt-6 pb-20'),
};

export default function ClassOverviewPage() {
  return <InstructorClassOverviewPage route={ROUTE} />;
}
