'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

interface NotesModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  placeholder?: string;
  onSave: (data: {
    notes: string;
    private_online_rate: number;
    private_inperson_rate: number;
    group_online_rate: number;
    group_inperson_rate: number;
    rate_currency: string;
  }) => void;
  isLoading?: boolean;
  saveText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'primary' | 'secondary';
  saveButtonProps?: React.ComponentProps<typeof Button>;
  cancelButtonProps?: React.ComponentProps<typeof Button>;
  userType?: 'course_creator' | 'instructor';
  minimum_rate: number | string;
}

export default function NotesModal({
  open,
  setOpen,
  title = 'Add Training Details',
  description = 'Provide additional notes and specify the trainer rate details below:',
  placeholder = 'Type your notes here...',
  onSave,
  isLoading = false,
  saveText = 'Save',
  cancelText = 'Cancel',
  variant = 'default',
  saveButtonProps,
  cancelButtonProps,
  userType = 'instructor',
  minimum_rate,
}: NotesModalProps) {
  const [notes, setNotes] = useState('');
  const [privateOnlineRate, setPrivateOnlineRate] = useState<number | ''>(0);
  const [privateInpersonRate, setPrivateInpersonRate] = useState<number | ''>(0);
  const [groupOnlineRate, setGroupOnlineRate] = useState<number | ''>(0);
  const [groupInpersonRate, setGroupInpersonRate] = useState<number | ''>(0);
  const [currency, setCurrency] = useState('KES');

  const resetForm = () => {
    setNotes('');
    setPrivateOnlineRate(0);
    setPrivateInpersonRate(0);
    setGroupOnlineRate(0);
    setGroupInpersonRate(0);
    setCurrency('KES');
  };

  const handleSave = () => {
    onSave({
      notes,
      private_online_rate: Number(privateOnlineRate),
      private_inperson_rate: Number(privateInpersonRate),
      group_online_rate: Number(groupOnlineRate),
      group_inperson_rate: Number(groupInpersonRate),
      rate_currency: currency,
    });
    resetForm();
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  return (
    <Sheet
      open={open}
      onOpenChange={open => {
        setOpen(open);
        if (!open) resetForm();
      }}
    >
      <SheetContent className='flex w-full flex-col p-3 sm:max-w-[600px] sm:p-6'>
        <SheetHeader className='border-border border-b pb-4'>
          <SheetTitle>{title}</SheetTitle>
          {description && (
            <SheetDescription className='text-muted-foreground text-sm'>
              {description}
            </SheetDescription>
          )}
        </SheetHeader>

        {/* Scrollable body */}
        <div className='flex-1 space-y-4 overflow-y-auto py-4 pr-1'>
          {/* Notes */}
          <div className='space-y-1'>
            <label className='text-muted-foreground text-sm font-medium'>Notes</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={placeholder}
              rows={6}
            />
          </div>

          {userType === 'instructor' && (
            <>
              {/* Currency */}
              <div className='space-y-1'>
                <label className='text-muted-foreground text-sm font-medium'>Currency</label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select currency' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='KES'>KES</SelectItem>
                    <SelectItem value='USD'>USD</SelectItem>
                    <SelectItem value='EUR'>EUR</SelectItem>
                    <SelectItem value='GBP'>GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Minimum rate note */}
              <p className='text-muted-foreground text-sm'>
                Set the amount you want to charge students per hour per head. The minimum amount
                you can charge has already been preset by the course creator:{' '}
                <span className='font-semibold'>
                  {minimum_rate} {currency}
                </span>{' '}
                per hour per head.
              </p>

              {/* Private Training Rates */}
              <div className='rounded-md border p-3'>
                <h3 className='mb-3 text-sm font-semibold'>
                  Private Training Rates
                </h3>
                <p className='text-muted-foreground mb-3 text-xs'>
                  Enter the amount you will charge one student per hour per head for private
                  sessions.
                </p>
                <div className='flex gap-4'>
                  <div className='flex-1 space-y-1'>
                    <label className='text-muted-foreground text-sm font-medium'>Online</label>
                    <Input
                      type='number'
                      min={minimum_rate}
                      value={privateOnlineRate}
                      onChange={e =>
                        setPrivateOnlineRate(e.target.value ? Number(e.target.value) : '')
                      }
                    />
                  </div>
                  <div className='flex-1 space-y-1'>
                    <label className='text-muted-foreground text-sm font-medium'>In-Person</label>
                    <Input
                      type='number'
                      min={minimum_rate}
                      value={privateInpersonRate}
                      onChange={e =>
                        setPrivateInpersonRate(e.target.value ? Number(e.target.value) : '')
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Group Training Rates */}
              <div className='rounded-md border p-3'>
                <h3 className='mb-3 text-sm font-semibold'>
                  Group Training Rates
                </h3>
                <p className='text-muted-foreground mb-3 text-xs'>
                  Enter the amount you will charge each student per hour per head for group
                  sessions.
                </p>
                <div className='flex gap-4'>
                  <div className='flex-1 space-y-1'>
                    <label className='text-muted-foreground text-sm font-medium'>Online</label>
                    <Input
                      type='number'
                      min={minimum_rate}
                      value={groupOnlineRate}
                      onChange={e =>
                        setGroupOnlineRate(e.target.value ? Number(e.target.value) : '')
                      }
                    />
                  </div>
                  <div className='flex-1 space-y-1'>
                    <label className='text-muted-foreground text-sm font-medium'>In-Person</label>
                    <Input
                      type='number'
                      min={minimum_rate}
                      value={groupInpersonRate}
                      onChange={e =>
                        setGroupInpersonRate(e.target.value ? Number(e.target.value) : '')
                      }
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sticky footer */}
        <div className='border-border flex justify-end gap-2 border-t pt-4'>
          <Button
            variant='outline'
            onClick={handleClose}
            disabled={isLoading}
            {...cancelButtonProps}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleSave}
            className='min-w-[100px]'
            disabled={isLoading || !notes.trim()}
            {...saveButtonProps}
          >
            {isLoading ? <Spinner /> : saveText}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
