'use client';

import { Globe, Mail, Phone } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { UserProfileType } from '@/lib/types';

type ProfileOverviewCardProps = {
  profile?: UserProfileType;
};

export function ProfileOverviewCard({ profile }: ProfileOverviewCardProps) {
  const displayName =
    profile?.full_name ??
    profile?.display_name ??
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ??
    'Profile';
  const avatarUrl = profile?.profile_image_url;
  const title =
    profile?.instructor?.professional_headline ??
    profile?.courseCreator?.professional_headline ??
    profile?.student?.bio ??
    'Profile';
  const website = profile?.instructor?.website ?? profile?.courseCreator?.website ?? 'Website not set';
  const entriesLabel = profile?.instructor
    ? `${profile?.instructor?.educations?.length} Education Entries`
    : profile?.courseCreator
      ? `${profile?.courseCreator?.uuid ? 1 : 0} Creator Entries`
      : profile?.student
        ? 'Student Profile'
        : 'Profile';
  const levelLabel = profile?.instructor?.admin_verified
    ? 'Verified Instructor'
    : profile?.courseCreator?.admin_verified
      ? 'Verified Creator'
      : profile?.student
        ? 'Learner Profile'
        : 'Profile';

  return (
    <Card className='gap-0 overflow-hidden rounded-[18px] border-white/60 bg-card/95 py-0 shadow-sm'>
      <div className='bg-[color-mix(in_srgb,var(--el-accent-azure)_45%,white_55%)] dark:bg-[color-mix(in_srgb,var(--el-accent-azure)_60%,black_40%)] px-3 py-4'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
          <Avatar className='size-16 border-2 border-white/70 shadow-md'>
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
            <AvatarFallback className='bg-[linear-gradient(135deg,var(--el-accent-azure),color-mix(in_srgb,var(--el-accent-amber)_55%,white))] text-lg font-semibold text-white'>
              {displayName
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map(part => part[0]?.toUpperCase() ?? '')
                .join('')}
            </AvatarFallback>
          </Avatar>

          <div className='min-w-0 space-y-1'>
            <h2 className='text-foreground text-2xl font-semibold tracking-tight'>{displayName}</h2>
            <p className='text-muted-foreground text-sm'>{title}</p>
          </div>
        </div>

        <Badge
          variant='outline'
          className='mt-5 rounded-full border-white/70 bg-background/80 px-4 py-1.5 text-sm font-semibold text-primary shadow-sm'
        >
          {levelLabel}
        </Badge>
      </div>

      <CardContent className='space-y-4 px-3 py-4'>
        <div className='space-y-3'>
          <div className='text-foreground flex items-center gap-3 text-lg font-medium'>
            Base Info
          </div>
          <div className='text-muted-foreground space-y-2 text-base'>
            {website && <div className='flex items-center gap-3'>
              <Globe className='size-4' />
              <span>{website}</span>
            </div>}
            {profile?.email ? (
              <div className='flex items-center gap-3'>
                <Mail className='size-4' />
                <span>{profile?.email}</span>
              </div>
            ) : null}
            {profile?.phone_number ? (
              <div className='flex items-center gap-3'>
                <Phone className='size-4' />
                <span>{profile.phone_number}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className='text-muted-foreground border-t pt-4 text-sm'>
          Joined | {profile?.created_date ? new Date(profile.created_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Recently'} | {entriesLabel}
        </div>
      </CardContent>
    </Card>
  );
}
