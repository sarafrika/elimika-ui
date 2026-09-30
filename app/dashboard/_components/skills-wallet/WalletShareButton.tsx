'use client';

import { Copy, Share2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function WalletShareButton({
  title = 'Skills Wallet',
  label = 'Share Wallet',
  getUrl,
  compact = false,
}: {
  title?: string;
  label?: string;
  getUrl?: () => string;
  compact?: boolean;
}) {
  const [url, setUrl] = useState('');
  const [sharing, setSharing] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Unable to copy automatically. Select and copy the link below.');
    }
  };
  const share = async () => {
    setSharing(true);
    try {
      await navigator.share({ title, url });
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        toast.error('Unable to share. You can copy the link instead.');
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <Button
        variant={compact ? 'ghost' : 'default'}
        size={compact ? 'sm' : 'default'}
        className={compact ? 'h-7 flex-1 text-xs' : undefined}
        aria-label={`Share ${title}`}
        onClick={() => setUrl(getUrl?.() ?? `${window.location.origin}${window.location.pathname}`)}
      >
        <Share2 className={compact ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'} /> {label}
      </Button>
      <Dialog
        open={Boolean(url)}
        onOpenChange={open => {
          if (!open) setUrl('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share {title}</DialogTitle>
            <DialogDescription>Copy the link or share it using your device.</DialogDescription>
          </DialogHeader>
          <Input
            aria-label='Share link'
            value={url}
            readOnly
            onFocus={event => event.target.select()}
          />
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => void copy()}>
              <Copy className='size-4' /> Copy link
            </Button>
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
              <Button onClick={() => void share()} disabled={sharing}>
                <Share2 className='size-4' /> {sharing ? 'Sharing…' : 'Share'}
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
