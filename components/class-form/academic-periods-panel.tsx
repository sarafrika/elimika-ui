'use client';

import { CalendarDays, Clock, MoreVertical, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  type AcademicPeriod,
  DAY_FULL,
  DAYS,
  fmtShortDate,
  formatDuration,
  type PeriodSlot,
  periodStatus,
  sessionMinutesFor,
} from './class-form-shared';

const statusStyles: Record<string, string> = {
  active: 'bg-success/15 text-success border-success/30',
  upcoming: 'bg-primary/10 text-primary border-primary/25',
  ended: 'bg-muted text-muted-foreground border-border',
};
const accentStyles: Record<string, string> = {
  active: 'bg-success',
  upcoming: 'bg-primary',
  ended: 'bg-muted-foreground/40',
};
const chipStyles: Record<string, string> = {
  active: 'bg-success/15 text-success',
  upcoming: 'bg-primary/10 text-primary',
  ended: 'bg-muted text-muted-foreground',
};

export function AcademicPeriodsPanel({
  periods,
  onChange,
}: {
  periods: AcademicPeriod[];
  onChange: (p: AcademicPeriod[]) => void;
}) {
  const updatePeriod = (id: string, patch: Partial<AcademicPeriod>) =>
    onChange(periods.map(p => (p.id === id ? { ...p, ...patch } : p)));
  const removePeriod = (id: string) => onChange(periods.filter(p => p.id !== id));
  const addPeriod = () =>
    onChange([
      ...periods,
      {
        id: `ap-${Date.now()}`,
        name: `Academic Period ${periods.length + 1}`,
        startDate: '',
        endDate: '',
        slots: [],
      },
    ]);
  const addSlot = (id: string) => {
    const p = periods.find(x => x.id === id);
    if (!p) return;
    updatePeriod(id, {
      slots: [...p.slots, { day: 'Mon', start: '09:00', end: '10:00' }],
    });
  };
  const updateSlot = (id: string, idx: number, patch: Partial<PeriodSlot>) => {
    const p = periods.find(x => x.id === id);
    if (!p) return;
    updatePeriod(id, { slots: p.slots.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  };
  const removeSlot = (id: string, idx: number) => {
    const p = periods.find(x => x.id === id);
    if (!p) return;
    updatePeriod(id, { slots: p.slots.filter((_, i) => i !== idx) });
  };

  return (
    <div className='space-y-3'>
      {periods.map(p => {
        const status = periodStatus(p);
        return (
          <div key={p.id} className='bg-card relative overflow-hidden rounded-xl border p-4 pl-5'>
            <span className={cn('absolute top-0 left-0 h-full w-1.5', accentStyles[status])} />
            <div className='grid gap-4 md:grid-cols-[1.4fr_1fr_1fr_auto_auto] md:items-start'>
              <div className='space-y-2'>
                <Input
                  value={p.name}
                  onChange={e => updatePeriod(p.id, { name: e.target.value })}
                  className='h-8 border-0 bg-transparent px-0 text-base font-semibold shadow-none focus-visible:ring-0'
                />
                <div className='space-y-1.5'>
                  <div className='text-muted-foreground text-xs'>Recurring Lesson Schedule</div>
                  <div className='flex flex-wrap gap-2'>
                    {p.slots.map((slot, idx) => (
                      <div
                        key={idx}
                        className='bg-background flex items-center gap-1.5 rounded-md border p-1 pl-2 text-xs'
                      >
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type='button'
                              className={cn(
                                'rounded px-2 py-0.5 text-xs font-medium',
                                chipStyles[status]
                              )}
                            >
                              {DAY_FULL[slot.day]}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className='w-40 p-1' align='start'>
                            <div className='grid grid-cols-2 gap-1'>
                              {DAYS.map(d => (
                                <button
                                  key={d}
                                  type='button'
                                  onClick={() => updateSlot(p.id, idx, { day: d })}
                                  className={cn(
                                    'hover:bg-muted rounded px-2 py-1 text-left text-xs',
                                    slot.day === d && 'bg-muted font-medium'
                                  )}
                                >
                                  {DAY_FULL[d]}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <div className='bg-background flex items-center gap-1 rounded border px-1.5 py-0.5'>
                          <Clock className='text-muted-foreground h-3 w-3' />
                          <Input
                            type='time'
                            value={slot.start}
                            onChange={e => updateSlot(p.id, idx, { start: e.target.value })}
                            className='h-5 w-[80px] border-0 p-0 text-[11px] shadow-none focus-visible:ring-0'
                          />
                          <span className='text-muted-foreground'>-</span>
                          <Input
                            type='time'
                            value={slot.end}
                            aria-invalid={sessionMinutesFor(slot.start, slot.end) === undefined}
                            onChange={e => updateSlot(p.id, idx, { end: e.target.value })}
                            className='h-5 w-[80px] border-0 p-0 text-[11px] shadow-none focus-visible:ring-0'
                          />
                          <span className='text-muted-foreground w-[52px] text-right tabular-nums'>
                            {formatDuration(sessionMinutesFor(slot.start, slot.end))}
                          </span>
                        </div>
                        <button
                          type='button'
                          onClick={() => removeSlot(p.id, idx)}
                          className='text-muted-foreground hover:bg-muted hover:text-destructive rounded p-0.5'
                          aria-label='Remove slot'
                        >
                          <X className='h-3 w-3' />
                        </button>
                      </div>
                    ))}
                    <button
                      type='button'
                      onClick={() => addSlot(p.id)}
                      className='text-muted-foreground hover:border-primary hover:text-primary inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-1 text-xs'
                    >
                      <Plus className='h-3 w-3' /> Add slot
                    </button>
                  </div>
                </div>
              </div>

              <div className='space-y-1'>
                <Label className='text-muted-foreground text-[11px]'>Start Date</Label>
                <div className='relative'>
                  <CalendarDays className='text-muted-foreground pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2' />
                  <Input
                    type='date'
                    value={p.startDate}
                    onChange={e => updatePeriod(p.id, { startDate: e.target.value })}
                    className='h-9 pl-7 text-sm'
                  />
                </div>
                <div className='text-muted-foreground text-[11px]'>{fmtShortDate(p.startDate)}</div>
              </div>

              <div className='space-y-1'>
                <Label className='text-muted-foreground text-[11px]'>End Date</Label>
                <div className='relative'>
                  <CalendarDays className='text-muted-foreground pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2' />
                  <Input
                    type='date'
                    value={p.endDate}
                    onChange={e => updatePeriod(p.id, { endDate: e.target.value })}
                    className='h-9 pl-7 text-sm'
                  />
                </div>
                <div className='text-muted-foreground text-[11px]'>{fmtShortDate(p.endDate)}</div>
              </div>

              <div className='space-y-1'>
                <Label className='text-muted-foreground text-[11px]'>Status</Label>
                <div
                  className={cn(
                    'inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium capitalize',
                    statusStyles[status]
                  )}
                >
                  {status}
                </div>
              </div>

              <div className='pt-5'>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type='button'
                      className='text-muted-foreground hover:bg-muted rounded p-1'
                      aria-label='Period options'
                    >
                      <MoreVertical className='h-4 w-4' />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className='w-36 p-1' align='end'>
                    <button
                      type='button'
                      onClick={() => removePeriod(p.id)}
                      className='text-destructive hover:bg-destructive/10 flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm'
                    >
                      <Trash2 className='h-3.5 w-3.5' /> Remove period
                    </button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {p.slots.some(s => sessionMinutesFor(s.start, s.end) === undefined) && (
              <div className='bg-destructive/10 text-destructive mt-3 rounded-md px-3 py-1.5 text-[11px]'>
                One or more slots end at or before they start.
              </div>
            )}
          </div>
        );
      })}

      <div className='flex justify-end'>
        <Button
          type='button'
          variant='outline'
          onClick={addPeriod}
          className='border-primary/40 text-primary hover:bg-primary/5'
        >
          <Plus className='mr-1 h-4 w-4' /> Add Academic Period
        </Button>
      </div>
    </div>
  );
}
