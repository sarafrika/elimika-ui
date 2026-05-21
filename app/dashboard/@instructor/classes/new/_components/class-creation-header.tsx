'use client';

import { Button } from '@/components/ui/button';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function ClassCreationHeader({
  isSubmitting,
  hasDraft,
  onPublish,
  onSaveDraft,
  onClearDraft,
  draftSavedTick,
}: {
  isSubmitting: boolean;
  hasDraft: boolean;
  onPublish: () => void;
  onSaveDraft: () => void;
  onClearDraft: () => void;
  draftSavedTick: number;
}) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!draftSavedTick) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      toast.success('Draft saved');
    }, 5000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [draftSavedTick]);

  return (
    <header className='flex flex-col gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-start sm:justify-between'>
      <div className='space-y-0.5'>
        <h1 className='text-foreground text-xl font-semibold tracking-tight sm:text-2xl lg:text-[1.7rem]'>
          Create New Class
        </h1>
        <p className='text-muted-foreground text-xs sm:text-sm'>
          Set up your class details and schedule
        </p>
      </div>

      <div className='flex w-full flex-col gap-3 sm:w-auto sm:flex-row'>
        {hasDraft ? (
          <Button
            type='button'
            variant='outline'
            className='h-10 rounded-md px-5 text-sm font-medium sm:w-auto'
            onClick={onClearDraft}
            disabled={isSubmitting}
          >
            Clear
          </Button>
        ) : (
          <Button
            type='button'
            variant='outline'
            className='h-10 rounded-md px-5 text-sm font-medium sm:w-auto'
            onClick={onSaveDraft}
            disabled={isSubmitting}
          >
            Save as Draft
          </Button>
        )}

        <Button
          type='button'
          className='h-10 rounded-md bg-primary px-5 text-sm font-medium shadow-sm sm:w-auto'
          onClick={onPublish}
          disabled={isSubmitting}
        >
          Publish Class
        </Button>
      </div>
    </header>
  );
}