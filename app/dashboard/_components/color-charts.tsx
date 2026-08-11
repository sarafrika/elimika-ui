type TrendSeries = {
    label: string;
    data: number[];
    color: string;
};

type TrendChartProps = {
    months: string[];
    series: TrendSeries[];
    max?: number;
    height?: number;
};

export function TrendChart({
    months,
    series,
    max,
    height = 220,
}: TrendChartProps) {
    const W = 520;
    const H = height;
    const P = 30;

    const calculatedMax =
        max ?? Math.max(...series.flatMap(item => item.data), 0);

    const chartMax = calculatedMax > 0 ? calculatedMax : 60;

    const x = (i: number) =>
        P + (i * (W - P * 2)) / Math.max(months.length - 1, 1);

    const y = (value: number) =>
        H - P - (value / chartMax) * (H - P * 2);

    const path = (data: number[]) =>
        data
            .map(
                (value, i) =>
                    `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(value)}`
            )
            .join(' ');

    const gridValues = [0, 0.25, 0.5, 0.75, 1].map(
        percentage => chartMax * percentage
    );

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            className='h-[220px] w-full'
            preserveAspectRatio='none'
        >
            {/* Grid */}
            {gridValues.map((value, index) => (
                <g key={index}>
                    <line
                        x1={P}
                        x2={W - P}
                        y1={y(value)}
                        y2={y(value)}
                        stroke='#f1f5f9'
                    />

                    <text
                        x={4}
                        y={y(value) + 3}
                        fill='#94A3B8'
                        style={{ fontSize: 10 }}
                    >
                        {Math.round(value)}k
                    </text>
                </g>
            ))}

            {/* Months */}
            {months.map((month, index) => (
                <text
                    key={`${month}-${index}`}
                    x={x(index)}
                    y={H - 8}
                    textAnchor='middle'
                    fill='#64748B'
                    style={{ fontSize: 10 }}
                >
                    {month}
                </text>
            ))}

            {/* Lines */}
            {series.map(item => (
                <path
                    key={item.label}
                    d={path(item.data)}
                    fill='none'
                    stroke={item.color}
                    strokeWidth={2.5}
                />
            ))}

            {/* Legend */}
            <g
                style={{
                    fontSize: 10,
                }}
            >
                {series.map((item, index) => {
                    const legendStart = W - 230;
                    const spacing = 75;
                    const legendX = legendStart + index * spacing;

                    return (
                        <g key={item.label}>
                            <circle
                                cx={legendX}
                                cy={12}
                                r={4}
                                fill={item.color}
                            />

                            <text
                                x={legendX + 9}
                                y={15}
                                fill='#475569'
                            >
                                {item.label}
                            </text>
                        </g>
                    );
                })}
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
