import { cn } from '@/lib/utils';
import type { CoursesCategoryTileData } from './courses-data';

const toneClasses = {
  amber: 'bg-warning/10 text-warning',
  green: 'bg-success/10 text-success',
  rose: 'bg-destructive/10 text-destructive',
  sky: 'bg-primary/10 text-primary',
  violet: 'bg-secondary text-foreground',
} as const;

type CoursesCategoryTileProps = {
  tile: CoursesCategoryTileData;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
};

export function CoursesCategoryTile({
  tile,
  onClick,
  isActive = false,
  className,
}: CoursesCategoryTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'border-border bg-card hover:bg-secondary/60 flex min-h-12 min-w-0 items-center gap-3 rounded-md border px-4 py-2 text-left transition-colors',
        className,
        isActive && 'border-primary bg-primary/5'
      )}
    >
      <span
        className={cn(
          'inline-flex size-9 shrink-0 items-center justify-center rounded-xl',
          toneClasses[tile.tone]
        )}
      >
        <tile.icon className="size-4" />
      </span>

      <span
        className="text-foreground min-w-0 truncate text-sm font-semibold"
        title={tile.title}
      >
        {tile.title}
      </span>
    </button>
  );
}
