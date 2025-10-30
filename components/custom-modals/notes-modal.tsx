'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Spinner from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

interface NotesModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  placeholder: string;
  onSave: (notes: string) => void;
  isLoading?: boolean;
  saveText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'primary' | 'secondary';
  saveButtonProps?: React.ComponentProps<typeof Button>;
  cancelButtonProps?: React.ComponentProps<typeof Button>;
}

export default function NotesModal({
  open,
  setOpen,
  title = 'Add Notes',
  description = 'Enter your notes below:',
  placeholder = 'Type your notes here...',
  onSave,
  isLoading = false,
  saveText = 'Save',
  cancelText = 'Cancel',
  variant = 'default',
  saveButtonProps,
  cancelButtonProps,
}: NotesModalProps) {
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    onSave(notes);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription className='my-2'>{description}</DialogDescription>}

          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className='mt-2'
            placeholder={placeholder}
            rows={10}
            cols={10}
          />
        </DialogHeader>

        <div className='mt-4 flex justify-end gap-2'>
          <Button
            variant='outline'
            onClick={() => {
              setOpen(false);
              setNotes('');
            }}
            disabled={isLoading}
            {...cancelButtonProps}
          >
            {cancelText}
          </Button>
          <Button
            className='min-w-[100px]'
            onClick={handleSave}
            disabled={isLoading || notes.trim() === ''}
            {...saveButtonProps}
          >
            {isLoading ? <Spinner /> : saveText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
