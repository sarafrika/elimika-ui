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
    private_individual_rate: number;
    private_group_rate: number;
    public_individual_rate: number;
    public_group_rate: number;
    rate_currency: string;
  }) => void;
  isLoading?: boolean;
  saveText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'primary' | 'secondary';
  saveButtonProps?: React.ComponentProps<typeof Button>;
  cancelButtonProps?: React.ComponentProps<typeof Button>;
  userType?: 'course_creator' | 'instructor';
  minimum_rate: any
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
  userType = "instructor",
  minimum_rate
}: NotesModalProps) {
  const [notes, setNotes] = useState('');
  const [privateIndividualRate, setPrivateIndividualRate] = useState<number | ''>(0);
  const [privateGroupRate, setPrivateGroupRate] = useState<number | ''>(0);
  const [publicIndividualRate, setPublicIndividualRate] = useState<number | ''>(0);
  const [publicGroupRate, setPublicGroupRate] = useState<number | ''>(0);
  const [currency, setCurrency] = useState('KES');

  const handleSave = () => {
    onSave({
      notes,
      private_individual_rate: Number(privateIndividualRate),
      private_group_rate: Number(privateGroupRate),
      public_individual_rate: Number(publicIndividualRate),
      public_group_rate: Number(publicGroupRate),
      rate_currency: currency,
    });

    setNotes('');
    setPrivateIndividualRate(0);
    setPrivateGroupRate(0);
    setPublicIndividualRate(0);
    setPublicGroupRate(0);
    setCurrency('KES');
  };


  const handleClose = () => {
    setOpen(false);
    setNotes('');
    // setRatePerHour(50);
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
          <label className="text-sm font-medium text-muted-foreground">Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={placeholder}
            rows={6}
          />
        </div>

        {userType === "instructor" && (
          <>
            {/* Currency */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Currency</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KES">KES</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Minimum rate note */}
            <p className="text-sm text-muted-foreground">
              Minimum rate set by course creator: <span className="font-semibold">{minimum_rate} {currency}</span> per hour per head.
            </p>

            {/* PRIVATE SECTION */}
            <div className="border rounded-md p-3 mt-3">
              <h3 className="font-semibold text-sm mb-2">Private Training Rates (Per Hour Per Head)</h3>

              <div className="flex gap-4">
                {/* Private Individual */}
                <div className="flex-1 space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Individual</label>
                  <Input
                    type="number"
                    min={minimum_rate}
                    value={privateIndividualRate}
                    onChange={(e) =>
                      setPrivateIndividualRate(e.target.value ? Number(e.target.value) : '')
                    }
                  />
                </div>

                {/* Private Group */}
                <div className="flex-1 space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Group</label>
                  <Input
                    type="number"
                    min={minimum_rate}
                    value={privateGroupRate}
                    onChange={(e) =>
                      setPrivateGroupRate(e.target.value ? Number(e.target.value) : '')
                    }
                  />
                </div>
              </div>
            </div>

            {/* PUBLIC SECTION */}
            <div className="border rounded-md p-3 mt-4">
              <h3 className="font-semibold text-sm mb-2">Public Training Rates (Per Hour Per Head)</h3>

              <div className="flex gap-4">
                {/* Public Individual */}
                <div className="flex-1 space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Individual</label>
                  <Input
                    type="number"
                    min={minimum_rate}
                    value={publicIndividualRate}
                    onChange={(e) =>
                      setPublicIndividualRate(e.target.value ? Number(e.target.value) : '')
                    }
                  />
                </div>

                {/* Public Group */}
                <div className="flex-1 space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Group</label>
                  <Input
                    type="number"
                    min={minimum_rate}
                    value={publicGroupRate}
                    onChange={(e) =>
                      setPublicGroupRate(e.target.value ? Number(e.target.value) : '')
                    }
                  />
                </div>
              </div>
            </div>
          </>
        )}

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
              !notes.trim()
              // !privateIndividualRate ||
              // !privateGroupRate ||
              // !publicIndividualRate ||
              // !publicGroupRate ||
              // !currency
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
