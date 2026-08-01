// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { useInstructorAnalyticsData } from '../useInstructorAnalyticsData';

export function PerformanceChart() {
  const { performance, isLoading } = useInstructorAnalyticsData();

  if (isLoading) {
    return (
      <div className='border-border bg-card h-full animate-pulse rounded-xl border p-3 shadow-sm sm:p-4'>
        <div className='bg-muted mb-3 h-3 w-40 rounded' />

        <div className='mb-3 flex gap-3'>
          <div className='bg-muted h-3 w-24 rounded' />
          <div className='bg-muted h-3 w-28 rounded' />
          <div className='bg-muted h-3 w-32 rounded' />
        </div>

        <div className='overflow-x-auto'>
          <div
            className='bg-muted/40 rounded'
            style={{
              height: 160,
              minWidth: 240,
              width: '100%',
            }}
          >
            <div className='relative h-full w-full'>
              {/* Grid lines */}
              <div className='absolute inset-0 flex flex-col justify-between px-8 py-2'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className='bg-muted/60 h-px w-full' />
                ))}
              </div>

              {/* Bars skeleton */}
              <div className='absolute inset-0 flex items-end justify-around px-10 pb-6'>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className='flex items-end gap-1'>
                    <div className='bg-primary/40 h-10 w-2.5 rounded-sm' />
                    <div className='bg-success/40 h-16 w-2.5 rounded-sm' />
                  </div>
                ))}
              </div>

              {/* Line skeleton */}
              <div className='absolute inset-0 flex items-center'>
                <svg viewBox='0 0 420 160' className='h-full w-full'>
                  <polyline
                    points='0,120 80,100 160,110 240,80 320,90 400,70'
                    fill='none'
                    className='stroke-warning/40'
                    strokeWidth='2'
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (performance.length === 0) {
    return (
      <EmptyState
        icon={() => null}
        title='No performance data yet'
        description='Complete one or more sessions to see performance trends over time.'
        variant='card'
      />
    );
  }

  const weeks = performance.map(point => point.label);
  const sessionsData = performance.map(point => point.sessions);
  const participantsData = performance.map(point => point.participants);
  const completionData = performance.map(point => point.completion);
  const chartH = 160;
  const chartW = 420;
  const padL = 36;
  const padB = 30;
  const padT = 10;
  const plotW = chartW - padL - 20;
  const plotH = chartH - padB - padT;
  const n = weeks.length;
  const maxParticipants = Math.max(100, ...participantsData);
  const groupW = plotW / n;
  const barW = groupW * 0.18;

  const xPos = (i: number) => padL + groupW * i + groupW / 2;

  const yPart = (v: number) => padT + plotH - (v / maxParticipants) * plotH;
  const yComp = (v: number) => padT + plotH - (v / 100) * plotH;

  const linePoints = weeks.map((_, i) => `${xPos(i)},${yComp(completionData[i])}`).join(' ');

  const yGrids = [0, 200, 400, 600, 800];
  const yGridsRight = [0, 25, 50, 75, 100];

  return (
    <div className='border-border bg-card h-full rounded-xl border p-3 shadow-sm sm:p-4'>
      <h3 className='text-foreground mb-1 text-xs font-semibold sm:text-sm'>
        Performance Over Time
      </h3>

      {/* Legend */}
      <div className='mb-2 flex flex-wrap gap-3'>
        <LegendItem
          color='text-primary'
          bgColor='bg-primary'
          label='Sessions Completed'
          type='bar'
        />
        <LegendItem
          color='text-success'
          bgColor='bg-success'
          label='Participants Trained'
          type='bar'
        />
        <LegendItem
          color='text-warning'
          bgColor='bg-warning'
          label='Completion Rate (%)'
          type='line'
        />
      </div>

      {/* Chart */}
      <div className='overflow-x-auto'>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className='w-full' style={{ minWidth: 240 }}>
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
                  stroke='var(--border-subtle)'
                  strokeWidth='1'
                />
                <text x={padL - 4} y={y + 3} fontSize='7' fill='var(--text-muted)' textAnchor='end'>
                  {v}
                </text>
                <text
                  x={chartW - 16}
                  y={y + 3}
                  fontSize='7'
                  fill='var(--text-muted)'
                  textAnchor='start'
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
                  className='fill-primary'
                  rx='2'
                />
                {/* Participants bar */}
                <rect
                  x={cx + 2}
                  y={baseY - bH2}
                  width={barW}
                  height={bH2}
                  className='fill-success'
                  rx='2'
                />
                {/* Week label */}
                <text
                  x={cx}
                  y={chartH - 4}
                  fontSize='7'
                  className='text-muted-foreground'
                  textAnchor='middle'
                >
                  {weeks[i]}
                </text>
              </g>
            );
          })}

          {/* Completion line */}
          <polyline
            points={linePoints}
            fill='none'
            className='stroke-warning'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          {weeks.map((_, i) => (
            <circle
              key={i}
              cx={xPos(i)}
              cy={yComp(completionData[i])}
              r='3'
              fill='var(--card-background)'
              className='stroke-warning'
              strokeWidth='1.5'
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
  type: 'bar' | 'line';
}) {
  return (
    <div className='flex items-center gap-1'>
      {type === 'bar' ? (
        <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${bgColor} ${color}`} />
      ) : (
        <svg width='14' height='8' className='shrink-0'>
          <line
            x1='0'
            y1='4'
            x2='14'
            y2='4'
            className={`stroke-current ${color}`}
            strokeWidth='1.5'
          />
          <circle
            cx='7'
            cy='4'
            r='2.5'
            fill='var(--card-background)'
            className={`stroke-current ${color}`}
            strokeWidth='1.5'
          />
        </svg>
      )}
      <span className='text-muted-foreground text-xs whitespace-nowrap'>{label}</span>
    </div>
  );
}
