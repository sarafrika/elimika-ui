import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

import type { SharedSkill } from '../types';

type TopSkillsPanelProps = {
  skills: SharedSkill[];
};

export function TopSkillsPanel({ skills }: TopSkillsPanelProps) {
  const topSkills = skills.slice(0, 5);

  return (
    <article className='border-border/60 bg-card self-start rounded-lg border p-3 shadow-sm'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <h2 className='text-foreground text-sm font-semibold sm:text-base'>Top Skills</h2>
        <span className='text-muted-foreground text-[10px]'>Skill graph</span>
      </div>

      <div className='space-y-3'>
        <SkillsRadarChart skills={topSkills} />

        <div className='min-w-0 space-y-2'>
          <p className='text-foreground text-xs font-semibold sm:text-sm'>Top Skills</p>
          {topSkills.length > 0 ? (
            topSkills.map(skill => (
              <div
                key={skill.id}
                className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3'
              >
                <div className='min-w-0'>
                  <div className='mb-1 flex items-center justify-between gap-2'>
                    <span className='text-foreground truncate text-xs'>{skill.name}</span>
                    <span className='text-muted-foreground text-[10px]'>{skill.version}</span>
                  </div>
                  <Progress value={skill.score} className='h-1 rounded-sm' />
                </div>
                <span className='text-muted-foreground text-[10px]'>{skill.score}%</span>
              </div>
            ))
          ) : (
            <p className='text-muted-foreground text-xs'>Skills you add will appear here.</p>
          )}
        </div>

        <Button asChild variant='outline' size='sm' className='h-8 w-full rounded-md text-xs'>
          <Link href='/dashboard/my-skills/verified-skills'>View Verified Skills</Link>
        </Button>
      </div>
    </article>
  );
}

function SkillsRadarChart({ skills }: { skills: SharedSkill[] }) {
  const chartSkills = skills.length > 0 ? skills : [];
  const center = 100;
  const maxRadius = 58;
  const sides = Math.max(chartSkills.length, 3);
  const gridLevels = [0.33, 0.66, 1];
  const dataPoints = chartSkills
    .map((skill, index) => getRadarPoint(index, sides, center, maxRadius * (skill.score / 100)))
    .join(' ');

  return (
    <div className='mx-auto w-full max-w-60'>
      <svg viewBox='0 0 200 190' role='img' aria-label='Top skills radar chart' className='w-full'>
        {gridLevels.map(level => (
          <polygon
            key={level}
            points={Array.from({ length: sides })
              .map((_, index) => getRadarPoint(index, sides, center, maxRadius * level))
              .join(' ')}
            className='stroke-border fill-transparent'
            strokeWidth='1'
          />
        ))}

        {Array.from({ length: sides }).map((_, index) => {
          const outer = getRadarPoint(index, sides, center, maxRadius);
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={outer.split(',')[0]}
              y2={outer.split(',')[1]}
              className='stroke-border'
              strokeWidth='1'
            />
          );
        })}

        {dataPoints ? (
          <polygon points={dataPoints} className='fill-primary/20 stroke-primary' strokeWidth='2' />
        ) : null}

        {chartSkills.map((skill, index) => {
          const [x, y] = getRadarCoordinates(index, sides, center, maxRadius * (skill.score / 100));
          const [labelX, labelY] = getRadarCoordinates(index, sides, center, maxRadius + 22);

          return (
            <g key={skill.id}>
              <circle cx={x} cy={y} r='3' className='fill-primary' />
              <text
                x={labelX}
                y={labelY}
                textAnchor={labelX > center + 8 ? 'start' : labelX < center - 8 ? 'end' : 'middle'}
                dominantBaseline='middle'
                className='fill-muted-foreground text-[9px]'
              >
                {skill.name.length > 14 ? `${skill.name.slice(0, 12)}...` : skill.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function getRadarPoint(index: number, sides: number, center: number, radius: number) {
  const [x, y] = getRadarCoordinates(index, sides, center, radius);
  return `${x.toFixed(2)},${y.toFixed(2)}`;
}

function getRadarCoordinates(index: number, sides: number, center: number, radius: number) {
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / sides;
  const x = center + radius * Math.cos(angle);
  const y = center + radius * Math.sin(angle);
  return [x, y] as const;
}
