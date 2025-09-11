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

interface DeleteModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  description: any;
  onConfirm: () => void;
  isLoading?: boolean;
  confirmText?: string;
}

export default function DeleteModal({
  open,
  setOpen,
  title,
  description,
  onConfirm,
  isLoading = false,
  confirmText = 'Delete',
}: DeleteModalProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className='my-2'>{description}</DialogDescription>
        </DialogHeader>

        <div className='mt-4 flex justify-end gap-2'>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant='destructive'
            className='min-w-[100px]'
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? <Spinner /> : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
