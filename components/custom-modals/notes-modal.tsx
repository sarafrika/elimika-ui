'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
    rate_per_hour_per_head: number;
    rate_currency: string;
  }) => void;
  isLoading?: boolean;
  saveText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'primary' | 'secondary';
  saveButtonProps?: React.ComponentProps<typeof Button>;
  cancelButtonProps?: React.ComponentProps<typeof Button>;
  userType?: 'course_creator' | 'instructor'
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
  userType = "instructor"
}: NotesModalProps) {
  const [notes, setNotes] = useState('');
  const [ratePerHour, setRatePerHour] = useState<number | ''>(50);
  const [currency, setCurrency] = useState('KES');

  const handleSave = () => {
    onSave({
      notes,
      rate_per_hour_per_head: Number(ratePerHour),
      rate_currency: currency,
    });
    setNotes('');
    setRatePerHour(50);
    setCurrency('KES');
  };

  const handleClose = () => {
    setOpen(false);
    setNotes('');
    setRatePerHour(50);
    setCurrency('KES');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md space-y-2">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription className="my-2 text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Notes Field */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={placeholder}
            rows={6}
          />
        </div>

        {userType === "instructor" && <>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Rate per Hour (per Head)
            </label>
            <Input
              type="number"
              min={0}
              value={ratePerHour}
              onChange={(e) => setRatePerHour(e.target.value ? Number(e.target.value) : '')}
              placeholder="Enter rate, e.g. 50"
            />
          </div>

          {/* Currency */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Currency</label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KES">KES (Kenyan Shilling)</SelectItem>
                <SelectItem value="USD">USD (US Dollar)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                <SelectItem value="GBP">GBP (Pound Sterling)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>}


        {/* Footer buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            {...cancelButtonProps}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleSave}
            className="min-w-[100px]"
            disabled={
              isLoading ||
              !notes.trim() ||
              !ratePerHour ||
              ratePerHour <= 0 ||
              !currency
            }
            {...saveButtonProps}
          >
            {isLoading ? <Spinner /> : saveText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
