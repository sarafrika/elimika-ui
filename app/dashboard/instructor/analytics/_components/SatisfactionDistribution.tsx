"use client";

import { EmptyState } from '@/components/ui/empty-state';
import { useInstructorAnalyticsData } from './useInstructorAnalyticsData';

export function SatisfactionDistribution({ handleViewSatisfactionDistribution }: { handleViewSatisfactionDistribution?: () => void }) {
  const { satisfactionBuckets, reviewCount, isLoading } = useInstructorAnalyticsData();

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-3 sm:p-4 h-full">
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Loading satisfaction metrics...
        </div>
      </div>
    );
  }

  if (reviewCount === 0) {
    return (
      <EmptyState
        icon={() => null}
        title="No review data yet"
        description="Instructor satisfaction will appear once learners submit reviews."
        variant="card"
      />
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-3 sm:p-4 h-full">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground">
          Satisfaction Distribution
        </h3>
        <button onClick={handleViewSatisfactionDistribution} className="text-xs text-primary hover:text-primary/80 transition-colors whitespace-nowrap shrink-0">
          View Report
        </button>
      </div>

      <div className="space-y-3">
        {satisfactionBuckets.map(({ label, pct, color }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="text-xs text-muted-foreground truncate">{label}</span>
              <span className="text-xs font-semibold text-foreground shrink-0">{pct}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`${color} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
