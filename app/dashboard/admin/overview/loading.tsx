import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';

export default function AdminOverviewLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <SectionCardSkeleton rows={2} />
        <SectionCardSkeleton rows={3} />
      </div>
    </div>
  );
}
