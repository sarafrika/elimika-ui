import React from "react";

interface Stat {
  value: number;
  label: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

interface OverviewStatsProps {
  stats: Stat[];
}

export function OverviewStats({ stats }: OverviewStatsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {stats.map((stat, i) => (
        <div
          key={i}
          className={`flex-1 min-w-[90px] flex flex-col items-center justify-center gap-1 rounded-xl p-3 border transition-colors ${
            stat.highlight
              ? "bg-primary/5 border-primary/20"
              : "bg-background border-border"
          }`}
        >
          <div className="text-primary">{stat.icon}</div>
          <p className="text-xl font-bold text-foreground">{stat.value}</p>
          <p className="text-xs text-muted-foreground text-center leading-tight">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
