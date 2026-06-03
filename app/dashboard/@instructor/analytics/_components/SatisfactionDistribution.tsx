"use client";

const levels = [
  { label: "Excellent (4.5 – 5)", pct: 62, color: "bg-success" },
  { label: "Good (3.5 – 4.4)", pct: 28, color: "bg-primary" },
  { label: "Average (2.5 – 3.4)", pct: 8, color: "bg-warning" },
  { label: "Poor (1 – 2.4)", pct: 2, color: "bg-destructive" },
];

export function SatisfactionDistribution() {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-3 sm:p-4 h-full">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground">
          Satisfaction Distribution
        </h3>
        <button className="text-xs text-primary hover:text-primary/80 transition-colors whitespace-nowrap shrink-0">
          View Report
        </button>
      </div>

      <div className="space-y-3">
        {levels.map(({ label, pct, color }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="text-xs text-muted-foreground truncate">{label}</span>
              <span className="text-xs font-semibold text-foreground shrink-0">{pct}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`${color} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${pct * 1.6}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}