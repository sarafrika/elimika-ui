'use client';

import { LinkShareCard } from '@/components/shared/link-share-card';
import { MapPin } from 'lucide-react';

import type { SharedMySkillsProfile } from '../types';
import { ProfileQrCode } from './ProfileQrCode';

type SkillsWalletHeaderProps = {
  profile: SharedMySkillsProfile;
  shareUrl?: string;
  levelLabel: string;
};

export function SkillsWalletHeader({
  profile,
  shareUrl,
  levelLabel,
}: SkillsWalletHeaderProps) {
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

        <div className='flex flex-wrap items-start gap-2'>
          <LinkShareCard
            className='w-full max-w-[18rem]'
            title='Share Profile'
            description='Copy or share this public profile page.'
            url={shareUrl ?? ''}
            copyLabel='Copy profile link'
            copiedLabel='Link copied'
            shareLabel='Share profile'
          />
          <ProfileQrCode targetUrl={shareUrl} />
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
