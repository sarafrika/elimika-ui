import { SectionCardSkeleton, surfaceTheme } from '@/components/data-display';

export default function AdminJobLoading() {
  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <SectionCardSkeleton rows={2} />
        <SectionCardSkeleton rows={4} />
        <SectionCardSkeleton rows={5} />
      </div>
    </div>
  );
}
