'use client';

import { CalendarDays, Info, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fmtTime12, TIMEZONES } from './class-form-shared';

export function PickDatesPanel({
  pickedDates,
  onPickedDatesChange,
  sortedPickedDates,
  pickMonth,
  onPickMonthChange,
  sessionDuration,
  onSessionDurationChange,
  sessionStart,
  onSessionStartChange,
  sessionEnd,
  timezone,
  onTimezoneChange,
}: {
  pickedDates: Date[];
  onPickedDatesChange: (d: Date[]) => void;
  sortedPickedDates: Date[];
  pickMonth: Date;
  onPickMonthChange: (d: Date) => void;
  sessionDuration: string;
  onSessionDurationChange: (v: string) => void;
  sessionStart: string;
  onSessionStartChange: (v: string) => void;
  sessionEnd: string;
  timezone: string;
  onTimezoneChange: (v: string) => void;
}) {
  const removeDate = (d: Date) => onPickedDatesChange(pickedDates.filter(x => x.getTime() !== d.getTime()));

  return (
    <div className="space-y-4">
      <div className="grid gap-6 lg:grid-cols-[auto_1fr_1fr]">
        <div className="space-y-2">
          <Label className="text-xs">
            Select Dates <span className="text-destructive">*</span>
          </Label>
          <div className="rounded-lg border p-1">
            <Calendar
              mode="multiple"
              selected={pickedDates}
              onSelect={d => onPickedDatesChange(d ?? [])}
              month={pickMonth}
              onMonthChange={onPickMonthChange}
              weekStartsOn={1}
              showOutsideDays
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="invisible text-xs">Selected</Label>
          <div className="space-y-2">
            {sortedPickedDates.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                Pick one or more dates from the calendar.
              </div>
            ) : (
              sortedPickedDates.map(d => (
                <div key={d.toISOString()} className="flex items-center gap-3 rounded-lg border bg-primary/[0.03] px-3 py-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-[140px] text-sm font-medium">
                    {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="flex-1 text-sm text-muted-foreground">
                    {fmtTime12(sessionStart)} – {fmtTime12(sessionEnd)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDate(d)}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    aria-label={`Remove ${d.toDateString()}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold">Session Settings</div>
          <div className="space-y-1">
            <Label className="text-xs">
              Session Duration <span className="text-destructive">*</span>
            </Label>
            <Select value={sessionDuration} onValueChange={onSessionDurationChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['30m', '1h', '1.5h', '2h', '3h', '4h'].map(d => (
                  <SelectItem key={d} value={d}>
                    {d === '30m' ? '30 Minutes' : d === '1h' ? '1 Hour' : d === '1.5h' ? '1.5 Hours' : `${d.replace('h', '')} Hours`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">
                Start Time <span className="text-destructive">*</span>
              </Label>
              <Input type="time" value={sessionStart} onChange={e => onSessionStartChange(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Time</Label>
              <Input type="time" value={sessionEnd} readOnly className="bg-muted/50" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Time Zone</Label>
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
          <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-xs text-primary">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>All times are in ({timezone})</span>
          </div>
          <div className="rounded-md bg-muted px-3 py-2 text-center text-xs font-medium">
            Total sessions: {sortedPickedDates.length}
          </div>
        </div>
      </div>
    </div>
  );
}
