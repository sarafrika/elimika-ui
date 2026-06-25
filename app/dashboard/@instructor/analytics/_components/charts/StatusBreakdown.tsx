"use client";

import { EmptyState } from '@/components/ui/empty-state';
import { useInstructorAnalyticsData } from "../useInstructorAnalyticsData";

function DonutChart({ breakdown }: { breakdown: Array<{ value: number; pct: number; color: string }> }) {
  const r = 40;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const total = breakdown.reduce((sum, item) => sum + item.value, 0);

  return (
    <svg
      viewBox="0 0 120 120"
      className="mx-auto h-28 w-28 shrink-0 sm:h-32 sm:w-32"
    >
      {breakdown.map(({ pct, color }, i) => {
        const dash = (pct / 100) * circumference;
        const gap = circumference - dash;
        const rotation = (offset / 100) * 360 - 90;

        offset += pct;

        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="18"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={0}
            transform={`rotate(${rotation} ${cx} ${cy})`}
            className={`${color} transition-all duration-500`}
          />
        );
      })}

      <text
        x={cx}
        y={cy - 5}
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        className="fill-foreground"
      >
        {total}
      </text>

      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        fontSize="7"
        className="fill-muted-foreground"
      >
        Total Sessions
      </text>
    </svg>
  );
}

export function StatusBreakdown() {
  const { statusBreakdown, isLoading } = useInstructorAnalyticsData();

  if (isLoading) {
    return (
      <div className="h-full rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Loading status breakdown...
        </div>
      </div>
    );
  }

  if (statusBreakdown.length === 0) {
    return (
      <EmptyState
        icon={() => null}
        title="No session statuses yet"
        description="Status breakdown appears once your sessions are scheduled and completed."
        variant="card"
      />
    );
  }

  return (
    <div className="h-full rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-foreground sm:text-sm">
          Status Breakdown
        </h3>

        <button className="shrink-0 whitespace-nowrap text-xs text-primary transition-colors hover:opacity-80">
          View Report
        </button>
      </div>

      <DonutChart breakdown={statusBreakdown} />

      <div className="mt-3 space-y-1.5">
        {statusBreakdown.map(({ label, value, pct, color }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.replace(
                  "text-",
                  "bg-"
                )}`}
              />

              <span className="truncate text-xs text-muted-foreground">
                {label}
              </span>
            </div>

            <span className="shrink-0 text-xs font-semibold text-foreground">
              {value}{" "}
              <span className="font-normal text-muted-foreground">
                ({pct}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
