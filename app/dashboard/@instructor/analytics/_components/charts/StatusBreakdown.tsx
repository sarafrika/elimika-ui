"use client";

const statuses = [
  {
    label: "Completed",
    value: 32,
    pct: 67,
    color: "text-success",
  },
  {
    label: "In Progress",
    value: 8,
    pct: 17,
    color: "text-warning",
  },
  {
    label: "Upcoming",
    value: 6,
    pct: 13,
    color: "text-primary",
  },
  {
    label: "Cancelled",
    value: 2,
    pct: 4,
    color: "text-destructive",
  },
];

function DonutChart() {
  const r = 40;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg
      viewBox="0 0 120 120"
      className="mx-auto h-28 w-28 shrink-0 sm:h-32 sm:w-32"
    >
      {statuses.map(({ pct, color }, i) => {
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
        48
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

      <DonutChart />

      <div className="mt-3 space-y-1.5">
        {statuses.map(({ label, value, pct, color }) => (
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