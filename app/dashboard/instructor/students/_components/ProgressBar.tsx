interface ProgressBarProps {
  value: number; // 0–100
  isComplete?: boolean;
}

export function ProgressBar({ value }: ProgressBarProps) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;

  return (
    <div className='flex w-full min-w-20 flex-col items-start gap-1.5'>
      <span className='text-foreground text-xs font-semibold tabular-nums'>{safeValue}%</span>

      <div className='bg-border h-1.25 w-full overflow-hidden rounded-full'>
        <div
          className='bg-primary h-full rounded-full transition-all'
          style={{ width: `${safeValue}%` }}
          role='progressbar'
          aria-label='Course progress'
          aria-valuenow={safeValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
