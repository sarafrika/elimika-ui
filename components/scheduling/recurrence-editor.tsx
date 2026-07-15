'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  RECURRENCE_DAY_SHORT,
  RECURRENCE_WEEK_DAYS,
  type RecurrenceDay,
  type RecurrenceEndMode,
  type RecurrenceFrequency,
  type RecurrenceValue,
  summarizeRecurrence,
} from '@/lib/recurrence';

const FREQUENCY_OPTIONS: Array<{ value: RecurrenceFrequency; label: string }> = [
  { value: 'NONE', label: 'Does not repeat' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
];

const UNIT_LABEL: Record<Exclude<RecurrenceFrequency, 'NONE'>, string> = {
  DAILY: 'day',
  WEEKLY: 'week',
  MONTHLY: 'month',
};

export interface RecurrenceEditorProps {
  value: RecurrenceValue;
  onChange: (value: RecurrenceValue) => void;
  /** First-session date (yyyy-MM-dd or ISO) used to seed the monthly day-of-month. */
  startDate?: string;
  /** When false, hides the "Does not repeat" option (e.g. for a recurrence-pattern editor). */
  allowNone?: boolean;
  /** When false, hides the "Ends" section (e.g. when a separate end date already bounds the series). */
  showEnd?: boolean;
  /** When true, offers a "different time per day" option in Weekly mode. */
  allowPerDayTimes?: boolean;
  /** HH:mm defaults used to prefill per-day time inputs. */
  defaultStartTime?: string;
  defaultEndTime?: string;
  className?: string;
  /** Unique prefix so multiple editors on one page keep distinct input ids. */
  idPrefix?: string;
}

/**
 * Google Calendar–style custom recurrence editor. Controlled: owns no state, edits are emitted
 * through {@link RecurrenceEditorProps.onChange}. Maps 1:1 to the {@link RecurrenceValue} model.
 */
export function RecurrenceEditor({
  value,
  onChange,
  startDate,
  allowNone = true,
  showEnd = true,
  allowPerDayTimes = false,
  defaultStartTime = '',
  defaultEndTime = '',
  className,
  idPrefix = 'recurrence',
}: RecurrenceEditorProps) {
  const setDayTime = (day: RecurrenceDay, patch: { start?: string; end?: string }) => {
    const existing = value.dayTimes?.[day] ?? {
      start: defaultStartTime,
      end: defaultEndTime,
    };
    onChange({
      ...value,
      dayTimes: { ...value.dayTimes, [day]: { ...existing, ...patch } },
    });
  };
  const frequencyOptions = allowNone
    ? FREQUENCY_OPTIONS
    : FREQUENCY_OPTIONS.filter(option => option.value !== 'NONE');
  const set = (patch: Partial<RecurrenceValue>) => onChange({ ...value, ...patch });
  const setEnd = (patch: Partial<RecurrenceValue['end']>) =>
    onChange({ ...value, end: { ...value.end, ...patch } });

  const isRepeating = value.frequency !== 'NONE';
  const unit = value.frequency === 'NONE' ? 'week' : UNIT_LABEL[value.frequency];

  const toggleDay = (day: RecurrenceDay) => {
    const active = value.daysOfWeek.includes(day);
    set({
      daysOfWeek: active
        ? value.daysOfWeek.filter(d => d !== day)
        : [...value.daysOfWeek, day],
    });
  };

  const seededDayOfMonth =
    value.dayOfMonth ?? (startDate ? new Date(startDate).getDate() || undefined : undefined);

  return (
    <div className={cn('space-y-4', className)}>
      <div className='space-y-2'>
        <Label>Repeat</Label>
        <Select
          value={value.frequency}
          onValueChange={frequency => set({ frequency: frequency as RecurrenceFrequency })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {frequencyOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isRepeating ? (
        <div className='space-y-4 rounded-md border border-border/60 bg-muted/20 p-4'>
          <div className='flex items-center gap-2'>
            <Label htmlFor={`${idPrefix}-interval`} className='shrink-0'>
              Repeat every
            </Label>
            <Input
              id={`${idPrefix}-interval`}
              type='number'
              min={1}
              className='w-20'
              value={value.interval}
              onChange={event => set({ interval: Math.max(1, Number(event.target.value) || 1) })}
            />
            <span className='text-sm text-muted-foreground'>
              {unit}
              {value.interval > 1 ? 's' : ''}
            </span>
          </div>

          {value.frequency === 'WEEKLY' ? (
            <div className='space-y-2'>
              <Label>Repeat on</Label>
              <div className='flex flex-wrap gap-2'>
                {RECURRENCE_WEEK_DAYS.map(day => {
                  const active = value.daysOfWeek.includes(day);
                  return (
                    <Button
                      key={day}
                      type='button'
                      size='sm'
                      variant={active ? 'default' : 'outline'}
                      onClick={() => toggleDay(day)}
                    >
                      {RECURRENCE_DAY_SHORT[day]}
                    </Button>
                  );
                })}
              </div>

              {allowPerDayTimes ? (
                <div className='space-y-2 pt-1'>
                  <label className='flex cursor-pointer items-center gap-2 text-sm'>
                    <Checkbox
                      checked={Boolean(value.perDayTimes)}
                      onCheckedChange={checked =>
                        onChange({ ...value, perDayTimes: checked === true })
                      }
                    />
                    Different time for each day
                  </label>

                  {value.perDayTimes && value.daysOfWeek.length > 0 ? (
                    <div className='space-y-2'>
                      {RECURRENCE_WEEK_DAYS.filter(day => value.daysOfWeek.includes(day)).map(day => {
                        const times = value.dayTimes?.[day];
                        return (
                          <div key={day} className='flex items-center gap-2'>
                            <span className='w-10 shrink-0 text-sm text-muted-foreground'>
                              {RECURRENCE_DAY_SHORT[day]}
                            </span>
                            <Input
                              type='time'
                              className='w-32'
                              value={times?.start ?? defaultStartTime}
                              onChange={event => setDayTime(day, { start: event.target.value })}
                            />
                            <span className='text-sm text-muted-foreground'>to</span>
                            <Input
                              type='time'
                              className='w-32'
                              value={times?.end ?? defaultEndTime}
                              onChange={event => setDayTime(day, { end: event.target.value })}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {value.frequency === 'MONTHLY' ? (
            <div className='flex items-center gap-2'>
              <Label htmlFor={`${idPrefix}-day-of-month`} className='shrink-0'>
                On day
              </Label>
              <Input
                id={`${idPrefix}-day-of-month`}
                type='number'
                min={1}
                max={31}
                className='w-20'
                value={seededDayOfMonth ?? ''}
                onChange={event => {
                  const parsed = Number(event.target.value);
                  set({
                    dayOfMonth: Number.isNaN(parsed)
                      ? undefined
                      : Math.min(31, Math.max(1, parsed)),
                  });
                }}
              />
              <span className='text-sm text-muted-foreground'>of the month</span>
            </div>
          ) : null}

          {showEnd ? (
          <div className='space-y-2'>
            <Label>Ends</Label>
            <RadioGroup
              value={value.end.mode}
              onValueChange={mode => setEnd({ mode: mode as RecurrenceEndMode })}
              className='gap-3'
            >
              <div className='flex items-center gap-2'>
                <RadioGroupItem value='never' id={`${idPrefix}-ends-never`} />
                <Label htmlFor={`${idPrefix}-ends-never`} className='font-normal'>
                  Never
                </Label>
              </div>

              <div className='flex items-center gap-2'>
                <RadioGroupItem value='on' id={`${idPrefix}-ends-on`} />
                <Label htmlFor={`${idPrefix}-ends-on`} className='font-normal'>
                  On
                </Label>
                <Input
                  type='date'
                  className='w-44'
                  disabled={value.end.mode !== 'on'}
                  value={value.end.date ?? ''}
                  onChange={event => setEnd({ mode: 'on', date: event.target.value })}
                />
              </div>

              <div className='flex items-center gap-2'>
                <RadioGroupItem value='after' id={`${idPrefix}-ends-after`} />
                <Label htmlFor={`${idPrefix}-ends-after`} className='font-normal'>
                  After
                </Label>
                <Input
                  type='number'
                  min={1}
                  className='w-20'
                  disabled={value.end.mode !== 'after'}
                  value={value.end.count ?? ''}
                  onChange={event =>
                    setEnd({ mode: 'after', count: Math.max(1, Number(event.target.value) || 1) })
                  }
                />
                <span className='text-sm text-muted-foreground'>occurrences</span>
              </div>
            </RadioGroup>
          </div>
          ) : null}
        </div>
      ) : null}

      <p className='text-sm text-muted-foreground'>{summarizeRecurrence(value)}</p>
    </div>
  );
}
