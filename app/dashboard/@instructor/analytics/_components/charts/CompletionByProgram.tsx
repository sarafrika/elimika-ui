"use client";

interface ProgramBarProps {
  name: string;
  rate: number;
}

const programs: ProgramBarProps[] = [
  { name: "Project Management Fundamentals", rate: 88 },
  { name: "Effective Communication Skills", rate: 90 },
  { name: "Excel for Beginners", rate: 100 },
  { name: "Cybersecurity Awareness", rate: 63 },
  { name: "Sales Techniques Mastery", rate: 89 },
  { name: "Leadership & Team Management", rate: 85 },
  { name: "Advanced Excel for Analysts", rate: 76 },
  { name: "Customer Experience Excellence", rate: 80 },
];

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
        {programs.map((p) => (
          <ProgramBar key={p.name} {...p} />
        ))}
      </div>
    </div>
  );
}