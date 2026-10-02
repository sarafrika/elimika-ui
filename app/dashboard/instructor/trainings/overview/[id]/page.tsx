'use client';

import {
  InstructorClassOverviewPage,
  type InstructorClassOverviewRoute,
} from '@/app/dashboard/instructor/_components/class-overview/InstructorClassOverviewPage';

export type { ContentItem } from '@/app/dashboard/instructor/_components/class-overview/InstructorClassOverviewPage';

const ROUTE: InstructorClassOverviewRoute = {
  section: { id: 'trainings', title: 'Training Classes', url: '/dashboard/instructor/trainings' },
  overviewBase: '/dashboard/instructor/trainings/overview',
  editHref: uuid => `/dashboard/instructor/trainings/create-new?id=${uuid}`,
  showShareLinks: true,
  containerClassName: 'w-full pb-20',
};

export default function TrainingOverviewPage() {
  return <InstructorClassOverviewPage route={ROUTE} />;
}
