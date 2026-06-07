
interface ProgressBarProps {
  value: number; // 0–100
  isComplete?: boolean;
}

export function ProgressBar({ value }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  const getColorClass = (value: number) => {
    if (value === 100) return "bg-primary";
    if (value >= 70) return "bg-primary/80";
    if (value >= 40) return "bg-primary/60";
    return "bg-primary/40";
  };

  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <span className="text-sm font-medium text-foreground w-9 shrink-0">
        {safeValue}%
      </span>

      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-[48px]">
        <div
          className={`h-full rounded-full transition-all ${getColorClass(safeValue)}`}
          style={{ width: `${safeValue}%` }}
          role="progressbar"
          aria-valuenow={safeValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
