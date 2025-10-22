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

interface ConfirmModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  onConfirm: () => void;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'primary' | 'secondary';
  confirmButtonProps?: React.ComponentProps<typeof Button>;
  cancelButtonProps?: React.ComponentProps<typeof Button>;
  // Optional: to allow additional children below the description
  children?: React.ReactNode;
}

export default function ConfirmModal({
  open,
  setOpen,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed?',
  onConfirm,
  isLoading = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  confirmButtonProps,
  cancelButtonProps,
  children,
}: ConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription className='my-2'>{description}</DialogDescription>}
          {children}
        </DialogHeader>

        <div className='mt-4 flex justify-end gap-2'>
          <Button
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={isLoading}
            {...cancelButtonProps}
          >
            {cancelText}
          </Button>
          <Button
            // variant={variant}
            className='min-w-[100px]'
            onClick={onConfirm}
            disabled={isLoading}
            {...confirmButtonProps}
          >
            {isLoading ? <Spinner /> : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
