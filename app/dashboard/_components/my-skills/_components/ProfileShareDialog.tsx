'use client';

import { Check, Copy, Facebook, Linkedin, Mail, MessageCircle, Share2, Twitter } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { buildSocialShareUrl, openShareWindow, type SharePlatform } from '@/lib/share';
import { cn } from '@/lib/utils';

import { LinkShareCard } from '@/components/shared/link-share-card';

type ProfileShareDialogProps = {
  profileName: string;
  shareUrl: string;
  triggerLabel?: string;
  className?: string;
};

const SHARE_PLATFORMS: Array<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  platform: SharePlatform;
}> = [
    { icon: MessageCircle, label: 'WhatsApp', platform: 'whatsapp' },
    { icon: Twitter, label: 'X / Twitter', platform: 'twitter' },
    { icon: Facebook, label: 'Facebook', platform: 'facebook' },
    { icon: Linkedin, label: 'LinkedIn', platform: 'linkedin' },
    { icon: Mail, label: 'Email', platform: 'email' },
  ];

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

export function ProfileShareDialog({
  profileName,
  shareUrl,
  triggerLabel = 'Share Profile',
  className,
}: ProfileShareDialogProps) {
  const [message, setMessage] = React.useState('');
  const [isCopied, setIsCopied] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const copyTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const normalizedUrl = shareUrl.trim();
  const resolvedMessage = message.trim() || `Check out ${profileName}'s profile.`;
  const shareTitle = `${profileName} Profile`;

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
    if (!normalizedUrl) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(normalizedUrl);
      } else {
        writeTextFallback(normalizedUrl);
      }

      resetCopiedState();
    } catch {
      // Ignore clipboard permission failures.
    }
  }, [normalizedUrl, resetCopiedState]);

  const handlePlatformShare = React.useCallback(
    (platform: SharePlatform) => {
      if (!normalizedUrl) return;

      openShareWindow(
        buildSocialShareUrl(platform, {
          title: shareTitle,
          url: normalizedUrl,
          description: resolvedMessage,
        })
      );
    },
    [normalizedUrl, resolvedMessage, shareTitle]
  );

  const handleNativeShare = React.useCallback(async () => {
    if (!normalizedUrl || typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
      await handleCopy();
      return;
    }

    try {
      await navigator.share({
        title: shareTitle,
        text: resolvedMessage,
        url: normalizedUrl,
      });
    } catch {
      // User dismissed the share sheet.
    }
  }, [handleCopy, normalizedUrl, resolvedMessage, shareTitle]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type='button' variant='outline' className={cn('gap-2', className)}>
          <Share2 className='h-4 w-4' />
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Share profile</DialogTitle>
          <DialogDescription>
            Add a short message, copy the link, or share this profile through your preferred channel.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <LinkShareCard
            title={shareTitle}
            description='Public profile link'
            url={normalizedUrl}
            showActions={false}
            className='shadow-none'
          />

          <div className='space-y-2'>
            <label className='text-foreground text-sm font-medium' htmlFor='profile-share-message'>
              Short message
            </label>
            <Textarea
              id='profile-share-message'
              value={message}
              onChange={event => setMessage(event.target.value)}
              placeholder={`Write a short message to accompany ${profileName}'s profile...`}
              className='min-h-[110px]'
            />
          </div>

          <div className='flex justify-end flex-wrap gap-2'>
            <Button type='button' variant='outline' onClick={handleCopy} disabled={!normalizedUrl}>
              {isCopied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
              {isCopied ? 'Copied' : 'Copy link'}
            </Button>
            <Button type='button' onClick={handleNativeShare} disabled={!normalizedUrl}>
              <Share2 className='h-4 w-4' />
              Share
            </Button>
          </div>

          <div className='grid gap-2 sm:grid-cols-2'>
            {SHARE_PLATFORMS.map(({ icon: Icon, label, platform }) => (
              <Button
                key={label}
                type='button'
                variant='outline'
                className='justify-start gap-2'
                onClick={() => handlePlatformShare(platform)}
                disabled={!normalizedUrl}
              >
                <Icon className='h-4 w-4' />
                {label}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
