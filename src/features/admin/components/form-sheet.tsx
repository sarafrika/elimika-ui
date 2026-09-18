'use client';
// admin-boundary: foundation

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** True while the form holds edits the admin has not saved. */
  isDirty?: boolean;
  isPending?: boolean;
  submitLabel: string;
  onSubmit: () => void;
  children: ReactNode;
  width?: 'default' | 'wide';
}

/**
 * The side sheet every admin form opens in. Closing it with unsaved edits asks first,
 * so a half-typed reason is never lost to a stray click on the backdrop.
 */
export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  isDirty,
  isPending,
  submitLabel,
  onSubmit,
  children,
  width = 'default',
}: FormSheetProps) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const requestClose = (nextOpen: boolean) => {
    if (!nextOpen && isDirty && !isPending) {
      setConfirmDiscard(true);
      return;
    }
    onOpenChange(nextOpen);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={requestClose}>
        <SheetContent
          className={width === 'wide' ? 'w-full sm:max-w-[640px]' : 'w-full sm:max-w-[520px]'}
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {description ? <SheetDescription>{description}</SheetDescription> : null}
          </SheetHeader>

          <div className='flex-1 space-y-4 overflow-y-auto px-4'>{children}</div>

          <SheetFooter>
            <Button
              variant='outline'
              className='rounded-md'
              onClick={() => requestClose(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button className='rounded-md' onClick={onSubmit} disabled={isPending}>
              {isPending ? 'Saving…' : submitLabel}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent className='rounded-md'>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard your changes?</AlertDialogTitle>
            <AlertDialogDescription>
              What you typed in “{title}” has not been saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='rounded-md'>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              className='rounded-md'
              onClick={() => {
                setConfirmDiscard(false);
                onOpenChange(false);
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
