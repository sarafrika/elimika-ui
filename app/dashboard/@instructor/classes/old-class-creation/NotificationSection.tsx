'use client';

import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NotificationSettings } from './page';
import type { ReactNode } from 'react';

export const NotificationSection = ({
  data,
  onChange,
}: {
  data: NotificationSettings;
  onChange: (updates: Partial<NotificationSettings>) => void;
}) => {
  return (
    <Card className='overflow-hidden border pt-0 shadow-sm'>
      <div className='bg-muted/50 border-b px-4 py-4 sm:px-6'>
        <h3 className='text-foreground text-lg font-semibold'>Notification</h3>
      </div>

      <div className='divide-y'>
        <FieldRow label='Reminder'>
          <Select value={data.reminder} onValueChange={value => onChange({ reminder: value })}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select reminder time' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='5min'>5 minutes before</SelectItem>
              <SelectItem value='15min'>15 minutes before</SelectItem>
              <SelectItem value='30min'>30 minutes before</SelectItem>
              <SelectItem value='1hour'>1 hour before</SelectItem>
              <SelectItem value='1day'>1 day before</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>

        <FieldRow label='Class Colour'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
            <input
              type='color'
              value={data.classColour || ''}
              onChange={e => onChange({ classColour: e.target.value })}
              className='h-10 w-full cursor-pointer rounded-md border border-border bg-card p-1 sm:w-16 sm:shrink-0'
            />
            <span className='text-muted-foreground min-w-0 text-sm break-all'>
              {data.classColour || ''}
            </span>
          </div>
        </FieldRow>
      </div>
    </Card>
  );
};

const FieldRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => {
  return (
    <div className='grid gap-3 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(140px,0.75fr)_minmax(0,2.25fr)] lg:items-center lg:gap-4'>
      <div className='bg-muted/30 rounded-md px-3 py-2 text-sm font-semibold lg:bg-transparent lg:p-0'>
        {label}
      </div>
      <div className='min-w-0'>{children}</div>
    </div>
  );
};
