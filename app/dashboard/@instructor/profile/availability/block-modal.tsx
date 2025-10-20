import Spinner from '@/components/ui/spinner';
import React, { useState } from 'react';

interface DateTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (start: Date, end: Date) => void;
  pending: boolean;
}

// utils/date.ts (or inline if preferred)
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
      <div className='w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow-lg'>
        <h2 className='text-lg font-semibold'>Select Date & Time</h2>

        <div className='flex flex-col space-y-2'>
          <label className='text-sm font-medium'>Start Date & Time</label>
          <input
            type='datetime-local'
            value={startDateTime ? toDateTimeInputValue(startDateTime) : ''}
            onChange={e => setStartDateTime(new Date(e.target.value))}
            className='rounded-md border px-3 py-2'
          />
        </div>

        <div className='flex flex-col space-y-2'>
          <label className='text-sm font-medium'>End Date & Time</label>
          <input
            type='datetime-local'
            value={endDateTime ? toDateTimeInputValue(endDateTime) : ''}
            onChange={e => setEndDateTime(new Date(e.target.value))}
            className='rounded-md border px-3 py-2'
          />
        </div>

        <div className='flex justify-end gap-3 pt-4'>
          <button onClick={onClose} className='rounded bg-gray-200 px-4 py-2 hover:bg-gray-300'>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
          >
            {pending ? <Spinner /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateTimeModal;
