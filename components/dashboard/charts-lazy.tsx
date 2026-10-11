'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// recharts stays out of the route's first load; each chart fetches its chunk when it mounts.
const chartSkeleton = () => <Skeleton className='h-[200px] w-full rounded-lg sm:h-[240px] 2xl:h-[280px]' />;

export const FundUtilizationChart = dynamic(
  () => import('./charts').then(mod => mod.FundUtilizationChart),
  { ssr: false, loading: chartSkeleton }
);

export const EnrollmentTrendsChart = dynamic(
  () => import('./charts').then(mod => mod.EnrollmentTrendsChart),
  { ssr: false, loading: chartSkeleton }
);

export const WeeklyGrowthChart = dynamic(
  () => import('./charts').then(mod => mod.WeeklyGrowthChart),
  { ssr: false, loading: chartSkeleton }
);
