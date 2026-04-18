'use client';

import { CheckSquare2, Globe, Mail, MapPin, Phone } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import type { CredentialsProfile } from '../data';

type ProfileOverviewCardProps = {
  profile: CredentialsProfile;
};

export function ProfileOverviewCard({ profile }: ProfileOverviewCardProps) {
  return (
    <Card className='gap-0 overflow-hidden rounded-[18px] border-white/60 bg-card/95 py-0 shadow-sm'>
      <div className='bg-[linear-gradient(135deg,color-mix(in_srgb,var(--background)_30%,var(--el-accent-azure)_70%),color-mix(in_srgb,var(--background)_88%,white_12%))] px-5 py-5'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
          <Avatar className='size-16 border-2 border-white/70 shadow-md'>
            <AvatarFallback className='bg-[linear-gradient(135deg,var(--el-accent-azure),color-mix(in_srgb,var(--el-accent-amber)_55%,white))] text-lg font-semibold text-white'>
              {profile.initials}
            </AvatarFallback>
          </Avatar>

          <div className='min-w-0 space-y-1'>
            <h2 className='text-foreground text-3xl font-semibold tracking-tight'>{profile.name}</h2>
            <p className='text-muted-foreground text-lg'>{profile.title}</p>
            <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-sm'>
              <MapPin className='size-4' />
              <span>{profile.location}</span>
              <CheckSquare2 className='text-primary size-4' />
            </div>
          </div>
        </div>

        <Badge
          variant='outline'
          className='mt-5 rounded-lg border-white/70 bg-background/80 px-4 py-2 text-sm font-semibold text-primary shadow-sm'
        >
          <CheckSquare2 className='size-4' />
          {profile.levelLabel}
        </Badge>
      </div>

      <CardContent className='space-y-4 px-5 py-5'>
        <div className='space-y-3'>
          <div className='text-foreground flex items-center gap-3 text-lg font-medium'>
            <MapPin className='text-primary size-4' />
            Base Into
          </div>
          <div className='text-muted-foreground space-y-2 text-base'>
            <div className='flex items-center gap-3'>
              <Globe className='size-4' />
              <span>{profile.website}</span>
            </div>
            <div className='flex items-center gap-3'>
              <Mail className='size-4' />
              <span>{profile.email}</span>
            </div>
            <div className='flex items-center gap-3'>
              <Phone className='size-4' />
              <span>{profile.phone}</span>
            </div>
          </div>
        </div>

        <div className='text-muted-foreground border-t pt-4 text-sm'>
          Joined | {profile.joined} | {profile.entriesLabel}
        </div>
      </CardContent>
    </Card>
  );
}
