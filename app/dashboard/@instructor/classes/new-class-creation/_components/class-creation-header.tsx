'use client';

import { Button } from '@/components/ui/button';

export function ClassCreationHeader({
  isSubmitting,
  onPublish,
  onSaveDraft,
}: {
  isSubmitting: boolean;
  onPublish: () => void;
  onSaveDraft: () => void;
}) {
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
        <Button
          type='button'
          variant='outline'
          className='h-10 rounded-md px-5 text-sm font-medium sm:w-auto'
          onClick={onSaveDraft}
          disabled={isSubmitting}
        >
          Save as Draft
        </Button>
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
