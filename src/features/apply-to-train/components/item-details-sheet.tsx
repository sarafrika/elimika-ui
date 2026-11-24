'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { type ApplyItem, kindNoun } from '../types';
import { TrainingItemDetails } from './training-item-details';

/** Full-screen course or programme record, keeping application actions at the top. */
export function ItemDetailsSheet({
  item,
  selected,
  onOpenChange,
  onChoose,
}: {
  item: ApplyItem | null;
  selected: boolean;
  onOpenChange: (open: boolean) => void;
  onChoose: (item: ApplyItem) => void;
}) {
  return (
    <Sheet open={item !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className='h-dvh w-full gap-0 overflow-y-auto border-0 sm:max-w-none'
      >
        {item ? (
          <>
            <SheetHeader className='border-b px-4 py-4 pr-12 sm:px-6 sm:pr-12'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='mb-2 -ml-2 self-start'
                onClick={() => onOpenChange(false)}
              >
                <ArrowLeft className='size-4' aria-hidden />
                Back
              </Button>
              <SheetTitle>{item.title}</SheetTitle>
              <SheetDescription>
                Review the {kindNoun(item.kind)} details and manage your application to train.
              </SheetDescription>
            </SheetHeader>
            <div className='mx-auto w-full max-w-[1840px] p-4 sm:p-6'>
              <TrainingItemDetails
                key={`${item.kind}:${item.uuid}`}
                item={item}
                selected={selected}
                onChoose={onChoose}
                onContinue={() => onOpenChange(false)}
              />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
