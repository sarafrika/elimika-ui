export function TrendChart() {
    const months = ["Dec", "Jan", "Feb", "Mar", "Apr", "May"];
    const awarded = [10, 30, 45, 52, 54, 56];
    const disbursed = [2, 8, 12, 15, 17, 18];
    const spent = [1, 5, 9, 12, 14, 17];
    const W = 520, H = 220, P = 30;
    const max = 60;
    const x = (i: number) => P + (i * (W - P * 2)) / (months.length - 1);
    const y = (v: number) => H - P - (v / max) * (H - P * 2);
    const path = (arr: number[]) => arr.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[220px]">
            {[0, 15, 30, 45, 60].map((g) => (
                <g key={g}>
                    <line x1={P} x2={W - P} y1={y(g)} y2={y(g)} stroke="#f1f5f9" />
                    <text
                        x={4}
                        y={y(g) + 3}
                        fill="#94A3B8"
                        style={{ fontSize: 10 }}
                    >
                        {g}k
                    </text>
                </g>
            ))}
            {months.map((m, i) => (
                <text
                    key={m}
                    x={x(i)}
                    y={H - 8}
                    textAnchor="middle"
                    fill="#64748B"
                    style={{ fontSize: 10 }}
                >
                    {m}
                </text>
            ))}
            <path d={path(awarded)} fill="none" stroke="#0f766e" strokeWidth={2.5} />
            <path d={path(disbursed)} fill="none" stroke="#3b82f6" strokeWidth={2.5} />
            <path d={path(spent)} fill="none" stroke="#f59e0b" strokeWidth={2.5} />
            <g style={{ fontSize: 10 }}>
                <circle cx={W - 160} cy={12} r={4} fill="#0f766e" />
                <text x={W - 150} y={15} fill="#475569">Awarded</text>

                <circle cx={W - 100} cy={12} r={4} fill="#3b82f6" />
                <text x={W - 90} y={15} fill="#475569">Disbursed</text>

                <circle cx={W - 40} cy={12} r={4} fill="#f59e0b" />
                <text x={W - 30} y={15} fill="#475569">Spent</text>
            </g>

        </svg>
    );
}

export function Donut({
    segments,
    size = 160,
    stroke = 22,
    centerTop,
    centerBottom,
}: {
    segments: { value: number; color: string; label: string }[];
    size?: number;
    stroke?: number;
    centerTop?: string;
    centerBottom?: string;
}) {
    const total = segments.reduce((a, b) => a + b.value, 0) || 1;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    let offset = 0;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
            {segments.map((s, i) => {
                const len = (s.value / total) * c;
                const el = (
                    <circle
                        key={i}
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        fill="none"
                        stroke={s.color}
                        strokeWidth={stroke}
                        strokeDasharray={`${len} ${c - len}`}
                        strokeDashoffset={-offset}
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        strokeLinecap="butt"
                    />
                );
                offset += len;
                return el;
            })}
            {centerTop && (
                <text
                    x="50%"
                    y="47%"
                    textAnchor="middle"
                    fill="#0F172A"
                    style={{ fontSize: 20, fontWeight: 700 }}
                >
                    {centerTop}
                </text>
            )}
            {centerBottom && (
                <text
                    x="50%"
                    y="60%"
                    textAnchor="middle"
                    fill="#64748B"
                    style={{ fontSize: 11 }}
                >
                    {centerBottom}
                </text>
            )}
        </svg>
    );
}


export const TOKEN = {
    primary: "#2563eb",
    accent: "#8b5cf6",
    success: "#10b981",
    warning: "#f59e0b",
    info: "#0ea5e9",
    destructive: "#ef4444",
    muted: "#64748b",
    border: "#e2e8f0",
    chart1: "#0f766e",
    chart2: "#f59e0b",
    chart3: "#7c3aed",
    chart4: "#22c55e",
    chart5: "#3b82f6",
} as const;


