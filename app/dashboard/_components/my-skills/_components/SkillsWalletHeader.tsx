'use client';

import { MapPin, Share2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { SharedMySkillsProfile } from '../types';
import { ProfileQrCode } from './ProfileQrCode';

type SkillsWalletHeaderProps = {
  profile: SharedMySkillsProfile;
  onPrimaryAction?: () => void;
  primaryActionLabel: string;
  qrTargetUrl?: string;
  levelLabel: string;
};

export function SkillsWalletHeader({
  profile,
  onPrimaryAction,
  primaryActionLabel,
  qrTargetUrl,
  levelLabel,
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
      <div className='bg-muted/40 flex min-h-28 flex-col gap-3 p-3 sm:p-4 md:flex-row md:items-end md:justify-between'>
        <div className='flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end'>
          <div className='border-background bg-muted grid size-16 shrink-0 self-start place-items-start overflow-hidden rounded-lg border-4 sm:size-[4.75rem]'>
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt='' className='h-full w-full object-cover' />
            ) : (
              <span className='text-primary text-lg font-semibold'>
                {getInitials(profile.name)}
              </span>
            )}
          </div>

          <div className='min-w-0'>
            <h1 className='text-foreground truncate text-lg font-semibold sm:text-xl'>
              {profile.name}
            </h1>
            <p className='text-foreground/80 truncate text-xs font-medium sm:text-sm'>
              {profile.title}
            </p>
            {profile.location ? (
              <p className='text-muted-foreground mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs'>
                <MapPin className='size-3 shrink-0' />
                <span className='truncate'>{profile.location}</span>
              </p>
            ) : null}
            <div className='mt-2 flex flex-wrap items-center gap-2'>
              <span className='bg-primary/10 text-primary rounded-md px-2 py-1 text-[10px] font-medium'>
                {levelLabel}
              </span>
              <span className='bg-warning/15 text-warning rounded-md px-2 py-1 text-[10px] font-medium'>
                Wallet Advanced
              </span>
            </div>
          </div>
        </div>

        <div className='flex items-start gap-2'>
          <div className='flex min-w-28 flex-col gap-2'>
            {/* <Button
              type='button'
              variant='outline'
              size='sm'
              className='h-8 justify-start rounded-md text-xs'
              aria-label='Download CV'
            >
              <Download className='size-3.5' />
              <span>Download CV</span>
            </Button> */}
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

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
}
