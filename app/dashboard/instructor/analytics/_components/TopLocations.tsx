"use client";

import { EmptyState } from '@/components/ui/empty-state';
import { useInstructorAnalyticsData } from './useInstructorAnalyticsData';

export function TopLocations({ handleViewTopLocations }: { handleViewTopLocations?: () => void }) {
  const { locations, isLoading } = useInstructorAnalyticsData();

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-3 sm:p-4 h-full">
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Loading location analytics...
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <EmptyState
        icon={() => null}
        title="No locations yet"
        description="Your top locations will update once sessions are added."
        variant="card"
      />
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-3 sm:p-4 h-full">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground">
          Top Locations by Sessions
        </h3>
        <button onClick={handleViewTopLocations} className="text-xs text-primary hover:text-primary/80 transition-colors whitespace-nowrap shrink-0">
          View Report
        </button>
      </div>

      <div className="space-y-3">
        {locations.map(({ name, sessions, pct }) => (
          <div key={name}>
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="text-xs text-muted-foreground truncate">
                {name}
              </span>
              <span className="text-xs font-semibold text-foreground shrink-0">
                {sessions}{" "}
                <span className="font-normal text-muted-foreground">
                  ({pct}%)
                </span>
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary/90 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
