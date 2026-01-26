'use client';

import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { NotificationSettings } from './page';

export const NotificationSection = ({
  data,
  onChange,
}: {
  data: NotificationSettings;
  onChange: (updates: Partial<NotificationSettings>) => void;
}) => {
  return (
    <Card className='overflow-hidden border shadow-sm'>
      <div className='bg-muted/50 border-b px-6 py-4'>
        <h3 className='text-foreground text-lg font-semibold'>Notification</h3>
      </div>

      <Table>
        <TableBody>
          <TableRow className='border-b hover:bg-transparent'>
            <TableCell className='bg-muted/30 w-1/3 py-4 font-semibold'>Reminder</TableCell>
            <TableCell className='bg-card py-4'>
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
            </TableCell>
          </TableRow>

          <TableRow className='hover:bg-transparent'>
            <TableCell className='bg-muted/30 py-4 font-semibold'>Class Colour</TableCell>
            <TableCell className='bg-card py-4'>
              <div className='flex items-center gap-3'>
                <input
                  type='color'
                  value={data.classColour || ''}
                  onChange={e => onChange({ classColour: e.target.value })}
                  className='h-10 w-12 cursor-pointer rounded'
                />
                <span className='text-muted-foreground text-sm'>{data.classColour || ''}</span>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  );
};
