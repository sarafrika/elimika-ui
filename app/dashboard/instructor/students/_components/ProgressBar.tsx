interface ProgressBarProps {
  value: number; // 0–100
  isComplete?: boolean;
}

export function ProgressBar({ value }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  const getColorClass = (value: number) => {
    if (value === 100) return 'bg-primary';
    if (value >= 70) return 'bg-primary/80';
    if (value >= 40) return 'bg-primary/60';
    return 'bg-primary/40';
  };

  return (
    <div className='flex w-full min-w-[80px] flex-col items-center gap-2'>
      <span className='text-foreground w-9 self-start text-start text-sm font-medium'>
        {safeValue}%
      </span>

      <div className='bg-muted h-1.5 w-full min-w-[48px] overflow-hidden rounded-full'>
        <div
          className={`h-full rounded-full transition-all ${getColorClass(safeValue)}`}
          style={{ width: `${safeValue}%` }}
          role='progressbar'
          aria-valuenow={safeValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
