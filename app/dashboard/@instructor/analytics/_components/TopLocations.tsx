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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 h-full">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-800">
          Top Locations by Sessions
        </h3>
        <button className="text-xs text-blue-500 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0">
          View Report
        </button>
      </div>

      <div className="space-y-3">
        {locations.map(({ name, sessions, pct }) => (
          <div key={name}>
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="text-xs text-gray-600 truncate">{name}</span>
              <span className="text-xs font-semibold text-gray-700 shrink-0">
                {sessions}{" "}
                <span className="font-normal text-gray-400">({pct}%)</span>
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${pct * 2}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
