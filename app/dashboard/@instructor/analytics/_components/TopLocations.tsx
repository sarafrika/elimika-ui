"use client";

const locations = [
  { name: "Nairobi, Kenya", sessions: 24, pct: 50 },
  { name: "Online", sessions: 12, pct: 25 },
  { name: "Mombasa, Kenya", sessions: 6, pct: 13 },
  { name: "Kisumu, Kenya", sessions: 4, pct: 8 },
  { name: "Other Locations", sessions: 2, pct: 4 },
];

export function TopLocations() {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-3 sm:p-4 h-full">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground">
          Top Locations by Sessions
        </h3>
        <button className="text-xs text-primary hover:text-primary/80 transition-colors whitespace-nowrap shrink-0">
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
                style={{ width: `${pct * 2}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}