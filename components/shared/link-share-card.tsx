'use client';

import * as React from 'react';
import { Check, Copy, Share2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type LinkShareCardSharePayload = {
  description?: string;
  title: string;
  url: string;
};

export type LinkShareCardProps = {
  children?: React.ReactNode;
  className?: string;
  copyLabel?: string;
  description?: string;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  onShare?: (payload: LinkShareCardSharePayload) => void | Promise<void>;
  preview?: React.ReactNode;
  shareLabel?: string;
  showActions?: boolean;
  title: string;
  copiedLabel?: string;
  url: string;
};

function writeTextFallback(text: string) {
  const input = document.createElement('input');
  input.value = text;
  input.setAttribute('readonly', 'true');
  input.style.position = 'absolute';
  input.style.left = '-9999px';
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
}

export const LinkShareCard = React.memo(function LinkShareCard({
  children,
  className,
  copyLabel = 'Copy link',
  copiedLabel = 'Copied!',
  description,
  footer,
  header,
  onShare,
  preview,
  shareLabel = 'Share',
  showActions = true,
  title,
  url,
}: LinkShareCardProps) {
  const [isCopied, setIsCopied] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);
  const copyTimerRef = React.useRef<number | null>(null);

  const normalizedUrl = url.trim();
  const canShareNatively =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const isShareable = normalizedUrl.length > 0;

  React.useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const resetCopiedState = React.useCallback(() => {
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }

    setIsCopied(true);
    copyTimerRef.current = window.setTimeout(() => {
      setIsCopied(false);
      copyTimerRef.current = null;
    }, 2000);
  }, []);

  const handleCopy = React.useCallback(async () => {
    if (!isShareable) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(normalizedUrl);
      } else {
        writeTextFallback(normalizedUrl);
      }

      resetCopiedState();
    } catch {
      // Intentionally silent: clipboard permissions can fail in some browsers.
    }
  }, [isShareable, normalizedUrl, resetCopiedState]);

  const handleShare = React.useCallback(async () => {
    if (!isShareable) return;

    if (onShare) {
      setIsSharing(true);
      try {
        await onShare({ title, url: normalizedUrl, description });
      } finally {
        setIsSharing(false);
      }
      return;
    }

    if (canShareNatively) {
      setIsSharing(true);
      try {
        await navigator.share({
          title,
          text: description ?? title,
          url: normalizedUrl,
        });
      } catch {
        // User cancelled the native share sheet or the browser rejected it.
      } finally {
        setIsSharing(false);
      }
      return;
    }

    await handleCopy();
  }, [canShareNatively, description, handleCopy, isShareable, normalizedUrl, onShare, title]);

  const defaultPreview = (
    <a
      aria-label={isShareable ? `Open ${title} link` : `${title} link is not available yet`}
      className={cn(
        'focus-visible:ring-ring block rounded-md text-sm leading-6 break-all transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        isShareable ? 'text-primary hover:underline' : 'text-muted-foreground'
      )}
      href={isShareable ? normalizedUrl : undefined}
      rel={isShareable ? 'noreferrer noopener' : undefined}
      target={isShareable ? '_blank' : undefined}
    >
      {isShareable ? normalizedUrl : 'Link will appear after the page finishes loading.'}
    </a>
  );

  const actionLabel = isSharing ? 'Sharing...' : isCopied ? copiedLabel : copyLabel;

  return (
    <Card className={cn('gap-0', className)}>
      {header ?? (
        <CardHeader className='space-y-4'>
          <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
            <div className='space-y-1'>
              <CardTitle className='text-xl'>{title}</CardTitle>
              {description ? <CardDescription>{description}</CardDescription> : null}
            </div>

            {showActions ? (
              <div className='flex flex-wrap gap-2'>
                <Button
                  aria-label={`Copy link for ${title}`}
                  className='gap-2'
                  disabled={!isShareable}
                  onClick={handleCopy}
                  variant='outline'
                >
                  {isCopied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
                  <span className='min-w-0'>{actionLabel}</span>
                </Button>

                <Button
                  aria-label={`Share ${title}`}
                  className='gap-2'
                  disabled={!isShareable}
                  onClick={handleShare}
                  variant='outline'
                >
                  <Share2 className='h-4 w-4' />
                  <span className='min-w-0'>{shareLabel}</span>
                </Button>
              </div>
            ) : null}
          </div>
        </CardHeader>
      )}

      <CardContent className='space-y-4'>
        <div className='border-border bg-muted/40 rounded-lg border px-4 py-3'>
          {preview ?? defaultPreview}
        </div>

        {children}
      </CardContent>

      {footer ? (
        <CardFooter className='flex-col items-stretch gap-3 border-t'>{footer}</CardFooter>
      ) : null}
    </Card>
  );
});
