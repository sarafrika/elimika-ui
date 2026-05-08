import { cn } from '@/lib/utils';
import type { OverviewStat } from './overview-data';

const toneClasses = {
  blue: 'from-primary to-primary',
  green: 'from-success to-teal-400',
  orange: 'from-orange-500 to-warning',
  red: 'from-destructive to-destructive',
} as const;

type OverviewStatCardProps = {
  stat: OverviewStat;
};

export function OverviewStatCard({ stat }: OverviewStatCardProps) {
  return (
    <article
      className={cn(
        `
          rounded-[10px]
          bg-gradient-to-r
          px-4 py-3 sm:px-5 sm:py-4
          text-white
          shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]

          min-h-[72px]
          w-full
        `,
        toneClasses[stat.tone]
      )}
    >
      <div
        className="
          flex h-full items-center gap-2 sm:gap-3
          flex-wrap sm:flex-nowrap
        "
      >
        <span
          className="
            leading-none font-semibold
            text-[clamp(1.5rem,4vw,2.2rem)]
          "
        >
          {stat.value}
        </span>

        <span
          className="
            font-medium leading-tight
            text-[clamp(0.85rem,2vw,1.08rem)]
            break-words
          "
        >
          {stat.label}
        </span>
      </div>
    </article>
  );
}
