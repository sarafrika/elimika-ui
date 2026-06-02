"use client";

const statuses = [
  { label: "Completed", value: 32, pct: 67, color: "#22c55e" },
  { label: "In Progress", value: 8, pct: 17, color: "#f97316" },
  { label: "Upcoming", value: 6, pct: 13, color: "#3b82f6" },
  { label: "Cancelled", value: 2, pct: 4, color: "#ef4444" },
];

function DonutChart() {
  const r = 40;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28 sm:w-32 sm:h-32 mx-auto shrink-0">
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
            stroke={color}
            strokeWidth="18"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={0}
            transform={`rotate(${rotation} ${cx} ${cy})`}
            className="transition-all duration-500"
          />
        );
      })}
      {/* Center text */}
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#111827">
        48
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7" fill="#6b7280">
        Total Sessions
      </text>
    </svg>
  );
}

export function StatusBreakdown() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 h-full">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-800">Status Breakdown</h3>
        <button className="text-xs text-blue-500 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0">
          View Report
        </button>
      </div>

      <DonutChart />

      <div className="mt-3 space-y-1.5">
        {statuses.map(({ label, value, pct, color }) => (
          <div key={label} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: color }}
              />
              <span className="text-xs text-gray-600 truncate">{label}</span>
            </div>
            <span className="text-xs font-semibold text-gray-700 shrink-0">
              {value}{" "}
              <span className="font-normal text-gray-400">({pct}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
