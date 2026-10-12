import { OrgLoadingPage } from '@/app/dashboard/organisation/_components/org-loading';
import { CourseRailSkeleton } from '@/components/dashboard/course-rail';
import { KpiCardSkeleton } from '@/components/dashboard/kpi-card';
import { SectionCardSkeleton } from '@/components/data-display/section-card';
import { Skeleton } from '@/components/ui/skeleton';

/** Mirrors the overview: welcome, KPIs, course rail, then the chart and feed grids. */
export default function OverviewLoading() {
  return (
    <OrgLoadingPage width='standard'>
      <Skeleton className='h-28 w-full rounded-xl' />
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {[0, 1, 2, 3].map(item => (
          <KpiCardSkeleton key={item} />
        ))}
      </div>
      <CourseRailSkeleton />
      <div className='grid gap-4 lg:grid-cols-3'>
        <Skeleton className='h-72 rounded-xl lg:col-span-2' />
        <SectionCardSkeleton rows={5} />
      </div>
      <div className='grid gap-4 lg:grid-cols-3'>
        <Skeleton className='h-64 rounded-xl' />
        <Skeleton className='h-64 rounded-xl lg:col-span-2' />
      </div>
      <div className='grid gap-4 lg:grid-cols-2'>
        <SectionCardSkeleton rows={4} />
        <SectionCardSkeleton rows={4} />
      </div>
    </OrgLoadingPage>
  );
}
