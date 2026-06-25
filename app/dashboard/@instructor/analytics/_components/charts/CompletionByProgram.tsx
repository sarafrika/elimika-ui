"use client";

import { EmptyState } from '@/components/ui/empty-state';
import { useInstructorAnalyticsData } from "../useInstructorAnalyticsData";

interface ProgramBarProps {
  name: string;
  rate: number;
}

function ProgramBar({ name, rate }: ProgramBarProps) {
  const color =
    rate >= 90
      ? "bg-primary"
      : rate >= 75
        ? "bg-primary/70"
        : "bg-primary/40";

  return (
    <div className="flex items-center gap-2 group">
      <span className="flex-1 min-w-0 text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors">
        {name}
      </span>
      <div className="relative w-24 sm:w-28 h-2 shrink-0 bg-muted rounded-full">
        <div
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="w-8 text-right shrink-0 text-xs font-semibold text-foreground">
        {rate}%
      </span>
    </div>
  );
}

export function CompletionByProgram() {
  const { programCompletion, isLoading } = useInstructorAnalyticsData();

  if (isLoading) {
    return (
      <div className="h-full p-3 sm:p-4 bg-card rounded-xl border border-border shadow-sm">
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Loading program completion data...
        </div>
      </div>
    );
  }

  if (programCompletion.length === 0) {
    return (
      <EmptyState
        icon={() => null}
        title="No program completion data"
        description="Your completion rates will appear once sessions are scheduled and completed."
        variant="card"
      />
    );
  }

  return (
    <div className="h-full p-3 sm:p-4 bg-card rounded-xl border border-border shadow-sm">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground">
          Completion Rate by Program
        </h3>
        <button className="text-xs text-primary hover:text-primary/80 transition-colors whitespace-nowrap shrink-0">
          View Full Report
        </button>
      </div>

      <div className="space-y-2.5">
        {programCompletion.map((p) => (
          <ProgramBar key={p.name} {...p} />
        ))}
      </div>
    </div>
  );
}