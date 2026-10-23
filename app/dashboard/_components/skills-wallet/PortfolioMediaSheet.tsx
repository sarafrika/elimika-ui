'use client';

import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { isAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { PortfolioMediaPreview, type PortfolioMedia } from './PortfolioMediaPreview';
import { portfolioMediaType } from './portfolio';

export function PortfolioMediaSheet({
  media,
  onClose,
}: {
  media: PortfolioMedia;
  onClose: () => void;
}) {
  const type = portfolioMediaType(media.url, media.name, media.mime);
  const attachment =
    !!media.name || isAuthenticatedMediaUrl(media.url) || media.url.startsWith('blob:');
  return (
    <Sheet
      open
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <SheetContent side='right' className='w-full sm:max-w-3xl'>
        <SheetHeader className='pr-12'>
          <SheetTitle className='break-words'>{media.title}</SheetTitle>
          <SheetDescription>Project and media preview</SheetDescription>
        </SheetHeader>
        <div className='min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-6'>
          {type !== 'other' ? (
            <PortfolioMediaPreview {...media} />
          ) : attachment ? (
            <div className='space-y-4'>
              <PortfolioMediaPreview {...media} />
              <Button variant='outline' asChild>
                <a href={media.url} download={media.name || true}>
                  <Download className='size-4' /> Download attachment
                </a>
              </Button>
            </div>
          ) : (
            <>
              <p className='text-muted-foreground text-sm'>
                Some websites block embedded previews. You can copy the link if the project does not
                appear.
              </p>
              <iframe
                src={media.url}
                title={media.title}
                loading='lazy'
                referrerPolicy='no-referrer'
                sandbox='allow-scripts allow-forms'
                className='border-border h-[70dvh] w-full rounded-md border'
              />
            </>
          )}
          {!media.url.startsWith('blob:') && (
            <Button
              type='button'
              variant='outline'
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    new URL(media.url, window.location.origin).href
                  );
                  toast.success('Project link copied.');
                } catch {
                  toast.error('Unable to copy the project link.');
                }
              }}
            >
              <Copy className='size-4' /> Copy link
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
