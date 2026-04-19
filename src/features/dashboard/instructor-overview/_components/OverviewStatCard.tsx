import { cn } from '@/lib/utils';
import type { OverviewStat } from './overview-data';

const toneClasses = {
  blue: 'from-blue-600 to-blue-500',
  green: 'from-emerald-500 to-teal-400',
  orange: 'from-orange-500 to-amber-400',
  red: 'from-red-500 to-rose-400',
} as const;

type OverviewStatCardProps = {
  stat: OverviewStat;
};

export function OverviewStatCard({ stat }: OverviewStatCardProps) {
  return (
    <article
      className={cn(
        'min-h-[78px] rounded-[10px] bg-gradient-to-r px-5 py-4 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]',
        toneClasses[stat.tone]
      )}
    >
      <div className='flex h-full items-center gap-3'>
        <span className='text-[2rem] font-semibold leading-none sm:text-[2.2rem]'>{stat.value}</span>
        <span className='text-[1rem] font-medium sm:text-[1.08rem]'>{stat.label}</span>
      </div>
    </article>
  );
}
