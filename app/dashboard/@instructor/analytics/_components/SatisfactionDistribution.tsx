"use client";

const levels = [
  { label: "Excellent (4.5 – 5)", pct: 62, color: "bg-green-500" },
  { label: "Good (3.5 – 4.4)", pct: 28, color: "bg-blue-400" },
  { label: "Average (2.5 – 3.4)", pct: 8, color: "bg-amber-400" },
  { label: "Poor (1 – 2.4)", pct: 2, color: "bg-red-400" },
];

export function SatisfactionDistribution() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 h-full">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-800">
          Satisfaction Distribution
        </h3>
        <button className="text-xs text-blue-500 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0">
          View Report
        </button>
      </div>

      <div className="space-y-3">
        {levels.map(({ label, pct, color }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="text-xs text-gray-600 truncate">{label}</span>
              <span className="text-xs font-semibold text-gray-700 shrink-0">{pct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
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
