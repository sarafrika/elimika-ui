import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';

interface DateTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (start: Date, end: Date) => void;
  pending: boolean;
}

export const toDateTimeInputValue = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes())
  );
};

const DateTimeModal: React.FC<DateTimeModalProps> = ({ isOpen, onClose, onSave, pending }) => {
  const [startDateTime, setStartDateTime] = useState<Date | null>(null);
  const [endDateTime, setEndDateTime] = useState<Date | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!startDateTime || !endDateTime) return;
    onSave(startDateTime, endDateTime);
    onClose();
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
      <div className='bg-card w-full max-w-md space-y-4 rounded-lg p-6 shadow-lg'>
        <h2 className='text-lg font-semibold'>Select Date & Time</h2>

        <div className='flex flex-col space-y-2'>
          <label className='text-sm font-medium'>Start Date & Time</label>
          <Input
            type='datetime-local'
            value={startDateTime ? toDateTimeInputValue(startDateTime) : ''}
            onChange={e => setStartDateTime(new Date(e.target.value))}
          />
        </div>

        <div className='flex flex-col space-y-2'>
          <label className='text-sm font-medium'>End Date & Time</label>
          <Input
            type='datetime-local'
            value={endDateTime ? toDateTimeInputValue(endDateTime) : ''}
            onChange={e => setEndDateTime(new Date(e.target.value))}
          />
        </div>

        <div className='flex justify-end gap-3 pt-4'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? <Spinner /> : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DateTimeModal;
