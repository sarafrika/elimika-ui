'use client';

import { Download, Share2, WalletCards } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { SharedMySkillsProfile } from '../types';
import { ProfileQrCode } from './ProfileQrCode';

type SkillsWalletHeaderProps = {
  profile: SharedMySkillsProfile;
  onPrimaryAction?: () => void;
  primaryActionLabel: string;
  qrTargetUrl?: string;
};

export function SkillsWalletHeader({
  profile,
  onPrimaryAction,
  primaryActionLabel,
  qrTargetUrl,
}: SkillsWalletHeaderProps) {
  const handleShare = async () => {
    if (onPrimaryAction) {
      onPrimaryAction();
      return;
    }

    if (typeof window === 'undefined') return;

    const shareUrl = qrTargetUrl || window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: `${profile.name} Skills Wallet`,
        text: `View ${profile.name}'s verified skills wallet.`,
        url: shareUrl,
      });
      return;
    }

    await navigator.clipboard?.writeText(shareUrl);
  };

  return (
    <section className='border-border/60 bg-card overflow-hidden rounded-lg border'>
      <div className='bg-muted/40 flex min-h-32 flex-col gap-4 p-3 sm:p-4 md:flex-row md:items-end md:justify-between'>
        <div className='flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end'>
          <div className='border-background bg-muted grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg border-4 sm:size-20'>
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt='' className='h-full w-full object-cover' />
            ) : (
              <WalletCards className='text-primary size-8' aria-hidden='true' />
            )}
          </div>

          <div className='min-w-0'>
            <h1 className='text-foreground truncate text-lg font-semibold sm:text-xl lg:text-2xl'>
              {profile.name}
            </h1>
            <p className='text-muted-foreground text-xs font-medium sm:text-sm'>{profile.title}</p>
            {profile.location ? (
              <p className='text-muted-foreground mt-1 text-xs'>{profile.location}</p>
            ) : null}
          </div>
        </div>

        <div className='flex items-start gap-2'>
          <div className='flex min-w-28 flex-col gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='h-8 justify-start rounded-md text-xs'
              aria-label='Download CV'
            >
              <Download className='size-3.5' />
              <span>Download CV</span>
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='h-8 justify-start rounded-md text-xs'
              onClick={handleShare}
            >
              <Share2 className='size-3.5' />
              {primaryActionLabel}
            </Button>
          </div>
          <ProfileQrCode targetUrl={qrTargetUrl} />
        </div>
      </div>
    </section>
  );
}
