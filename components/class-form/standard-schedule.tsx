'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DAYS, type DayKey, type DayRow, sessionEndFor, TIMEZONES } from './class-form-shared';

export function StandardSchedule({
  days,
  onDayChange,
  repeatEvery,
  onRepeatEveryChange,
  repeatUnit,
  onRepeatUnitChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  regStart,
  onRegStartChange,
  regEnd,
  onRegEndChange,
  continuousReg,
  onContinuousRegChange,
  timezone,
  onTimezoneChange,
  totalSessions,
}: {
  days: Record<DayKey, DayRow>;
  onDayChange: (day: DayKey, patch: Partial<DayRow>) => void;
  repeatEvery: string;
  onRepeatEveryChange: (v: string) => void;
  repeatUnit: string;
  onRepeatUnitChange: (v: string) => void;
  startDate: string;
  onStartDateChange: (v: string) => void;
  endDate: string;
  onEndDateChange: (v: string) => void;
  regStart: string;
  onRegStartChange: (v: string) => void;
  regEnd: string;
  onRegEndChange: (v: string) => void;
  continuousReg: boolean;
  onContinuousRegChange: (v: boolean) => void;
  timezone: string;
  onTimezoneChange: (v: string) => void;
  totalSessions: number;
}) {
  return (
    <div className='grid gap-6 lg:grid-cols-[1.4fr_1fr]'>
      <div className='space-y-2'>
        <div className='text-sm font-semibold'>Schedule</div>
        <div className='text-muted-foreground mb-2 text-xs'>Set class days and times.</div>
        <div className='min-w-0 overflow-hidden rounded-lg border'>
          <div className='bg-muted/50 text-muted-foreground hidden grid-cols-[64px_1fr_1fr_56px] gap-1 px-2 py-1.5 text-xs sm:grid'>
            <div>Day</div>
            <div>Start</div>
            <div>Minutes</div>
            <div className='text-center leading-none'>All Day</div>
          </div>
          {DAYS.map(d => {
            const row = days[d];
            return (
              <div key={d} className={cn('min-w-0 border-t', row.active && 'bg-primary/5')}>
                <div className='hidden grid-cols-[64px_1fr_1fr_56px] items-center gap-1 px-2 py-1.5 sm:grid'>
                  <button
                    type='button'
                    onClick={() => onDayChange(d, { active: !row.active })}
                    className={cn(
                      'h-8 rounded-md text-xs font-medium transition-colors',
                      row.active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                    )}
                  >
                    {d}
                  </button>
                  <Input
                    type='time'
                    value={row.start}
                    disabled={!row.active || row.allDay}
                    onChange={e =>
                      onDayChange(d, {
                        start: e.target.value,
                        end: sessionEndFor(e.target.value, row.durationMinutes || 120),
                      })
                    }
                    className='h-8 w-full min-w-0 px-1 text-xs'
                  />
                  <Input
                    type='number'
                    min={1}
                    step={1}
                    inputMode='numeric'
                    value={row.durationMinutes ?? ''}
                    disabled={!row.active || row.allDay}
                    onChange={e => {
                      const durationMinutes = e.target.value.replace(/\D/g, '');
                      onDayChange(d, {
                        durationMinutes,
                        end: sessionEndFor(row.start, durationMinutes || 1),
                      });
                    }}
                    className='h-8 w-full min-w-0 px-1 text-xs'
                  />
                  <div className='flex justify-center'>
                    <Checkbox
                      checked={row.allDay}
                      disabled={!row.active}
                      onCheckedChange={v => onDayChange(d, { allDay: v === true })}
                    />
                  </div>
                </div>
                <div className='space-y-2 px-3 py-2.5 sm:hidden'>
                  <div className='flex items-center justify-between gap-2'>
                    <button
                      type='button'
                      onClick={() => onDayChange(d, { active: !row.active })}
                      aria-pressed={row.active}
                      className={cn(
                        'h-9 min-w-[64px] rounded-md px-3 text-sm font-medium transition-colors',
                        row.active
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {d}
                    </button>
                    <label className='text-muted-foreground flex items-center gap-2 text-xs'>
                      <Checkbox
                        checked={row.allDay}
                        disabled={!row.active}
                        onCheckedChange={v => onDayChange(d, { allDay: v === true })}
                      />
                      All day
                    </label>
                  </div>
                  {row.active && !row.allDay && (
                    <div className='grid grid-cols-2 gap-2'>
                      <div className='space-y-1'>
                        <div className='text-muted-foreground text-[10px] tracking-wide uppercase'>
                          Start
                        </div>
                        <Input
                          type='time'
                          value={row.start}
                          onChange={e =>
                            onDayChange(d, {
                              start: e.target.value,
                              end: sessionEndFor(e.target.value, row.durationMinutes || 120),
                            })
                          }
                          className='h-10 w-full text-sm'
                        />
                      </div>
                      <div className='space-y-1'>
                        <div className='text-muted-foreground text-[10px] tracking-wide uppercase'>
                          Minutes
                        </div>
                        <Input
                          type='number'
                          min={1}
                          step={1}
                          inputMode='numeric'
                          value={row.durationMinutes ?? ''}
                          onChange={e => {
                            const durationMinutes = e.target.value.replace(/\D/g, '');
                            onDayChange(d, {
                              durationMinutes,
                              end: sessionEndFor(row.start, durationMinutes || 1),
                            });
                          }}
                          className='h-10 w-full text-sm'
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className='space-y-3'>
        <div className='space-y-1'>
          <Label className='text-xs'>Repeat Every</Label>
          <div className='grid grid-cols-[80px_1fr] gap-2'>
            <Input value={repeatEvery} onChange={e => onRepeatEveryChange(e.target.value)} />
            <Select value={repeatUnit} onValueChange={onRepeatUnitChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['Day', 'Week', 'Month'].map(u => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='space-y-1'>
            <Label className='text-xs'>Start Date *</Label>
            <Input
              type='date'
              value={startDate}
              onChange={e => onStartDateChange(e.target.value)}
            />
          </div>
          <div className='space-y-1'>
            <Label className='text-xs'>End Repeat *</Label>
            <Input type='date' value={endDate} onChange={e => onEndDateChange(e.target.value)} />
          </div>
          <div className='space-y-1'>
            <Label className='text-xs'>Registration Start</Label>
            <Input
              type='date'
              value={regStart}
              onChange={e => onRegStartChange(e.target.value)}
              disabled={continuousReg}
            />
          </div>
          <div className='space-y-1'>
            <Label className='text-xs'>Registration End</Label>
            <Input
              type='date'
              value={regEnd}
              onChange={e => onRegEndChange(e.target.value)}
              disabled={continuousReg}
            />
          </div>
        </div>
        <label className='flex items-center gap-2 text-xs'>
          <Checkbox
            checked={continuousReg}
            onCheckedChange={v => onContinuousRegChange(v === true)}
          />
          Continuous Registration (no closing date)
        </label>
        <div className='space-y-1'>
          <Label className='text-xs'>Timezone</Label>
          <Select value={timezone} onValueChange={onTimezoneChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map(tz => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='bg-primary/10 text-primary rounded-md px-3 py-2 text-center text-xs font-medium'>
          Total sessions: {totalSessions}
        </div>
      </div>
    </div>
  );
}
