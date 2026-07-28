'use client';

import { cn } from '@/lib/utils';
import type { ScheduleMode } from './class-form-shared';

const OPTIONS: { key: ScheduleMode; title: string; desc: string }[] = [
  { key: 'standard', title: 'Standard Schedule', desc: 'Set recurring days and times' },
  { key: 'pick', title: 'Pick Dates', desc: 'Select specific dates' },
  { key: 'academic', title: 'Academic Period', desc: 'Align with academic term' },
];

export function ScheduleModeCards({ value, onChange }: { value: ScheduleMode; onChange: (v: ScheduleMode) => void }) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">Schedule Options</div>
      <div className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map(opt => {
          const selected = value === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className={cn(
                'rounded-lg border p-3 text-left transition-all',
                selected ? 'border-primary bg-primary/5 ring-1 ring-primary/25' : 'border-border hover:border-primary/40'
              )}
            >
              <div className="text-sm font-medium">{opt.title}</div>
              <div className="text-xs text-muted-foreground">{opt.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
