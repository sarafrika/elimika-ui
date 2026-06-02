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
      ? "bg-blue-500"
      : rate >= 75
      ? "bg-blue-400"
      : "bg-blue-300";

  return (
    <div className="flex items-center gap-2 group">
      <span className="text-xs text-gray-600 truncate flex-1 min-w-0 group-hover:text-gray-900 transition-colors">
        {name}
      </span>
      <div className="w-24 sm:w-28 bg-gray-100 rounded-full h-2 shrink-0">
        <div
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8 text-right shrink-0">
        {rate}%
      </span>
    </div>
  );
}

export function CompletionByProgram() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 h-full">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-800">
          Completion Rate by Program
        </h3>
        <button className="text-xs text-blue-500 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0">
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
