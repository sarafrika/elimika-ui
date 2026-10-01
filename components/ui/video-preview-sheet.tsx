'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './sheet';
import { VideoPreviewPlayer } from './video-preview-modal';

type VideoPreviewSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  videoUrl?: string | null;
};

/** The video preview player in a right-side sheet, for flows that keep overlays as sheets. */
export function VideoPreviewSheet({
  open,
  onOpenChange,
  title,
  description,
  videoUrl,
}: VideoPreviewSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full gap-0 overflow-y-auto sm:max-w-2xl'>
        <SheetHeader className='border-b px-6 py-4 pr-12'>
          <SheetTitle className='text-lg'>{title || 'Video preview'}</SheetTitle>
          <SheetDescription>
            {description || 'Watch this video without leaving the current page.'}
          </SheetDescription>
        </SheetHeader>
        <div className='bg-muted/20'>
          <VideoPreviewPlayer active={open} title={title} videoUrl={videoUrl} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
