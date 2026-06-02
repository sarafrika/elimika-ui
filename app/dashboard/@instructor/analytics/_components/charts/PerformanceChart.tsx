"use client";

const weeks = ["May 1-7", "May 8-14", "May 15-21", "May 22-28", "May 29-31"];

// Sessions completed (bar1), Participants trained (bar2), Completion rate line
const sessionsData = [4, 6, 8, 7, 7];
const participantsData = [120, 240, 380, 560, 610];
const completionData = [60, 65, 72, 95, 75]; // percent

export function PerformanceChart() {
  const maxParticipants = 800;
  const chartH = 160;
  const chartW = 420;
  const padL = 36;
  const padB = 30;
  const padT = 10;
  const plotW = chartW - padL - 20;
  const plotH = chartH - padB - padT;
  const n = weeks.length;
  const groupW = plotW / n;
  const barW = groupW * 0.18;

  const xPos = (i: number) => padL + groupW * i + groupW / 2;

  // Y for participants (left axis)
  const yPart = (v: number) => padT + plotH - (v / maxParticipants) * plotH;
  // Y for completion rate (right axis, 0–100%)
  const yComp = (v: number) => padT + plotH - (v / 100) * plotH;

  const linePoints = weeks
    .map((_, i) => `${xPos(i)},${yComp(completionData[i])}`)
    .join(" ");

  const yGrids = [0, 200, 400, 600, 800];
  const yGridsRight = [0, 25, 50, 75, 100];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 h-full">
      <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-1">
        Performance Over Time
      </h3>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-2">
        <LegendItem color="#3b82f6" label="Sessions Completed" type="bar" />
        <LegendItem color="#22c55e" label="Participants Trained" type="bar" />
        <LegendItem color="#8b5cf6" label="Completion Rate (%)" type="line" />
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full"
          style={{ minWidth: 240 }}
        >
          {/* Grid lines */}
          {yGrids.map((v, i) => {
            const y = yPart(v);
            return (
              <g key={i}>
                <line
                  x1={padL}
                  y1={y}
                  x2={chartW - 20}
                  y2={y}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
                <text x={padL - 4} y={y + 3} fontSize="7" fill="#9ca3af" textAnchor="end">
                  {v}
                </text>
                <text x={chartW - 16} y={y + 3} fontSize="7" fill="#9ca3af" textAnchor="start">
                  {yGridsRight[i]}%
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {weeks.map((_, i) => {
            const cx = xPos(i);
            const bH1 = (sessionsData[i] / 10) * plotH * 0.5;
            const bH2 = (participantsData[i] / maxParticipants) * plotH;
            const baseY = padT + plotH;
            return (
              <g key={i}>
                {/* Sessions bar (blue) */}
                <rect
                  x={cx - barW - 2}
                  y={baseY - bH1}
                  width={barW}
                  height={bH1}
                  fill="#3b82f6"
                  rx="2"
                />
                {/* Participants bar (green) */}
                <rect
                  x={cx + 2}
                  y={baseY - bH2}
                  width={barW}
                  height={bH2}
                  fill="#22c55e"
                  rx="2"
                />
                {/* Week label */}
                <text x={cx} y={chartH - 4} fontSize="7" fill="#9ca3af" textAnchor="middle">
                  {weeks[i]}
                </text>
              </g>
            );
          })}

          {/* Completion line */}
          <polyline
            points={linePoints}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {weeks.map((_, i) => (
            <circle
              key={i}
              cx={xPos(i)}
              cy={yComp(completionData[i])}
              r="3"
              fill="white"
              stroke="#8b5cf6"
              strokeWidth="1.5"
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  type,
}: {
  color: string;
  label: string;
  type: "bar" | "line";
}) {
  return (
    <div className="flex items-center gap-1">
      {type === "bar" ? (
        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
      ) : (
        <svg width="14" height="8" className="shrink-0">
          <line x1="0" y1="4" x2="14" y2="4" stroke={color} strokeWidth="1.5" />
          <circle cx="7" cy="4" r="2.5" fill="white" stroke={color} strokeWidth="1.5" />
        </svg>
      )}
      <span className="text-xs text-gray-500 whitespace-nowrap">{label}</span>
    </div>
  );
}
