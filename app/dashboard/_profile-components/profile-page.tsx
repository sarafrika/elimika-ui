'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Briefcase, Globe, Mail, MapPin, Phone } from 'lucide-react';
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import type { ProfilePageProps } from './types';

function ProfileHeaderSkeleton() {
  return (
    <div className='bg-card border-border rounded-2xl border p-7'>
      <div className='mb-6 flex items-start gap-6'>
        <Skeleton className='h-[90px] w-[90px] shrink-0 rounded-xl' />
        <div className='flex-1 space-y-3'>
          <Skeleton className='h-7 w-48' />
          <div className='flex gap-4'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-4 w-40' />
          </div>
          <div className='grid grid-cols-3 gap-3'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
          </div>
          <Skeleton className='h-6 w-44' />
        </div>
      </div>
      <div className='border-border flex gap-2 border-t pt-4'>
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className='h-9 w-24 rounded-lg' />
        ))}
      </div>
    </div>
  );
}

function MetaItem({ icon, value }: { icon: React.ReactNode; value?: string }) {
  if (!value) return null;
  return (
    <span className='text-muted-foreground flex items-center gap-1.5 text-sm'>
      {icon}
      <span>{value}</span>
    </span>
  );
}

export function ProfilePage({
  tabs,
  profile,
  isLoading = false,
  headerBadge,
  defaultTab,
}: ProfilePageProps) {
  const [activeTabId, setActiveTabId] = useState(defaultTab ?? tabs[0]?.id ?? '');

  const activeTab = tabs.find(t => t.id === activeTabId) ?? tabs[0];
  const TabContent = activeTab?.component;

  if (isLoading) {
    return (
      <div className='space-y-0 p-6'>
        <ProfileHeaderSkeleton />
      </div>
    );
  }

  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className='space-y-0 p-6 font-sans'>
      <div className='bg-card border-border rounded-2xl border p-7'>
        {/* Avatar + Info Row */}
        <div className='mb-6 flex items-start gap-6'>
          {/* Avatar */}
          <div className='relative shrink-0'>
            <Avatar className='h-[90px] w-[90px] rounded-xl'>
              <AvatarImage
                src={profile?.profile_image_url || profile?.avatar_url}
                alt={profile?.full_name}
                className='object-cover'
              />
              <AvatarFallback className='bg-primary/10 text-primary rounded-xl text-lg font-semibold'>
                {initials}
              </AvatarFallback>
            </Avatar>

            {profile.is_online && (
              <span className='bg-success/50 border-card absolute top-0.5 right-1.5 h-4 w-4 rounded-full border-2' />
            )}
          </div>

          {/* Name + Meta */}
          <div className='min-w-0 flex-1'>
            {/* Name row */}
            <div className='mb-2 flex items-center justify-between gap-3'>
              <h1 className='text-foreground truncate text-2xl font-bold tracking-tight'>
                {profile.full_name}
              </h1>
              {headerBadge && <div className='shrink-0'>{headerBadge}</div>}
            </div>

            {/* Secondary meta */}
            <div className='mb-3 flex flex-wrap gap-x-5 gap-y-1'>
              <MetaItem
                icon={<Briefcase className='text-muted-foreground h-4 w-4' />}
                value={profile.professional_headline}
              />
              <MetaItem
                icon={<MapPin className='text-muted-foreground h-4 w-4' />}
                value={profile.address}
              />
            </div>

            <div className='mb-3 flex flex-col space-y-3'>
              <MetaItem
                icon={<Phone className='text-muted-foreground h-4 w-4' />}
                value={profile.phone}
              />
              <MetaItem
                icon={<Mail className='text-muted-foreground h-4 w-4' />}
                value={profile.email}
              />
              <MetaItem
                icon={<Globe className='text-muted-foreground h-4 w-4' />}
                value={profile.website}
              />
            </div>

            {/* ID badge */}
            <span className='bg-muted text-muted-foreground inline-block rounded-md px-3 py-1 text-xs font-bold tracking-wider'>
              ID {profile.uuid}
            </span>
          </div>
        </div>

        <div className='border-border flex flex-wrap gap-1 border-t pt-4'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={cn(
                'cursor-pointer rounded-lg px-4.5 py-1.5 text-sm font-medium transition-all duration-150',
                activeTabId === tab.id
                  ? 'bg-primary/80 text-primary-foreground rounded-full font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground rounded-full'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {TabContent && (
        <div key={activeTabId} className='animate-in fade-in-0 duration-200'>
          <TabContent userUuid={profile.user_uuid} domain={'student'} sharedProfile={profile} />
        </div>
      )}
    </div>
  );
}
