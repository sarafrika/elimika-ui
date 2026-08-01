'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { REMINDER_MINUTES, type ReminderState } from './class-form-shared';

export function ReminderOptions({
  value,
  onChange,
}: {
  value: ReminderState;
  onChange: (patch: Partial<ReminderState>) => void;
}) {
  return (
    <div className='space-y-3 rounded-lg border p-4'>
      <div className='text-sm font-semibold'>Reminder Options</div>
      <div className='grid gap-3 sm:grid-cols-[160px_1fr]'>
        <div className='space-y-1'>
          <Label className='text-xs'>Reminder</Label>
          <Select value={value.window} onValueChange={v => onChange({ window: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(REMINDER_MINUTES).map(r => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='space-y-2'>
            <div className='text-muted-foreground text-xs font-medium'>Send To</div>
            <label className='flex items-center gap-2 text-sm'>
              <Checkbox
                checked={value.sendStudents}
                onCheckedChange={v => onChange({ sendStudents: v === true })}
              />{' '}
              Students
            </label>
            <label className='flex items-center gap-2 text-sm'>
              <Checkbox
                checked={value.sendInstructor}
                onCheckedChange={v => onChange({ sendInstructor: v === true })}
              />{' '}
              Instructor
            </label>
          </div>
          <div className='space-y-2'>
            <div className='text-muted-foreground text-xs font-medium'>Send Via</div>
            <label className='flex items-center gap-2 text-sm'>
              <Checkbox
                checked={value.email}
                onCheckedChange={v => onChange({ email: v === true })}
              />{' '}
              Email
            </label>
            <label className='flex items-center gap-2 text-sm'>
              <Checkbox checked={value.sms} onCheckedChange={v => onChange({ sms: v === true })} />{' '}
              SMS
            </label>
            <label className='flex items-center gap-2 text-sm'>
              <Checkbox
                checked={value.push}
                onCheckedChange={v => onChange({ push: v === true })}
              />{' '}
              Push Notification
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
