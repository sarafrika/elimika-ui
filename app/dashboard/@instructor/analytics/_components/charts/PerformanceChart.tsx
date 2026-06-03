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

  const yPart = (v: number) => padT + plotH - (v / maxParticipants) * plotH;
  const yComp = (v: number) => padT + plotH - (v / 100) * plotH;

  const linePoints = weeks
    .map((_, i) => `${xPos(i)},${yComp(completionData[i])}`)
    .join(" ");

  const yGrids = [0, 200, 400, 600, 800];
  const yGridsRight = [0, 25, 50, 75, 100];

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-3 sm:p-4 h-full">
      <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-1">
        Performance Over Time
      </h3>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-2">
        <LegendItem color="text-primary" bgColor="bg-primary" label="Sessions Completed" type="bar" />
        <LegendItem color="text-success" bgColor="bg-success" label="Participants Trained" type="bar" />
        <LegendItem color="text-warning" bgColor="bg-warning" label="Completion Rate (%)" type="line" />
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
                  stroke="var(--border-subtle)"
                  strokeWidth="1"
                />
                <text
                  x={padL - 4}
                  y={y + 3}
                  fontSize="7"
                  fill="var(--text-muted)"
                  textAnchor="end"
                >
                  {v}
                </text>
                <text
                  x={chartW - 16}
                  y={y + 3}
                  fontSize="7"
                  fill="var(--text-muted)"
                  textAnchor="start"
                >
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
                {/* Sessions bar */}
                <rect
                  x={cx - barW - 2}
                  y={baseY - bH1}
                  width={barW}
                  height={bH1}
                  className="fill-primary"
                  rx="2"
                />
                {/* Participants bar */}
                <rect
                  x={cx + 2}
                  y={baseY - bH2}
                  width={barW}
                  height={bH2}
                  className="fill-success"
                  rx="2"
                />
                {/* Week label */}
                <text
                  x={cx}
                  y={chartH - 4}
                  fontSize="7"
                  className="text-muted-foreground"
                  textAnchor="middle"
                >
                  {weeks[i]}
                </text>
              </g>
            );
          })}

          {/* Completion line */}
          <polyline
            points={linePoints}
            fill="none"
            className="stroke-warning"
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
              fill="var(--card-background)"
              className="stroke-warning"
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
  bgColor,
  label,
  type,
}: {
  color: string;
  bgColor?: string;
  label: string;
  type: "bar" | "line";
}) {
  return (
    <div className="flex items-center gap-1">
      {type === "bar" ? (
        <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${bgColor} ${color}`} />
      ) : (
        <svg width="14" height="8" className="shrink-0">
          <line x1="0" y1="4" x2="14" y2="4" className={`stroke-current ${color}`} strokeWidth="1.5" />
          <circle cx="7" cy="4" r="2.5" fill="var(--card-background)" className={`stroke-current ${color}`} strokeWidth="1.5" />
        </svg>
      )}
      <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
    </div>
  );
}