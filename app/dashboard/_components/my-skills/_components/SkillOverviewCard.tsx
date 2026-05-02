import { CalendarDays, Globe, Mail, MapPin, Phone } from 'lucide-react';
import type React from 'react';

import { Badge } from '@/components/ui/badge';

import type { SharedMySkillsProfile, SharedSkill } from '../types';
import { ProfileShareDialog } from './ProfileShareDialog';

type SkillOverviewCardProps = {
  profile: SharedMySkillsProfile;
  skills: SharedSkill[];
  averageScore: number;
  levelLabel: string;
  shareUrl: string;
};

export function SkillOverviewCard({
  profile,
  skills,
  averageScore,
  levelLabel,
  shareUrl
}: SkillOverviewCardProps) {
  const overviewSkills = skills.slice(0, 4);
  const levelNumber = Number(levelLabel.replace(/\D/g, '')) || 1;

  return (
    <article className='border-border/60 bg-card self-start rounded-lg border p-3 shadow-sm'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <h2 className='text-foreground text-sm font-semibold sm:text-base'>Skills Overview</h2>
        <Badge variant='outline' className='rounded-md text-[10px]'>
          {levelLabel.replace('Level ', 'LV.')}
        </Badge>
      </div>

      {/* Level illustration */}
      <div className='from-primary/5 to-primary/0 relative flex flex-col items-center justify-center overflow-hidden rounded-md bg-gradient-to-b py-5'>
        {/* Decorative rings */}
        <div className='border-primary/10 absolute h-24 w-24 rounded-full border' />
        <div className='border-primary/15 absolute h-16 w-16 rounded-full border' />

        {/* Level badge */}
        <div className='border-primary/40 bg-background shadow-primary/10 relative flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 shadow-md'>
          <span className='text-muted-foreground text-[9px] leading-none font-bold tracking-widest uppercase'>
            LV.
          </span>
          <span className='text-primary text-xl leading-none font-black'>{levelNumber}</span>
        </div>

        {/* Label + score */}
        <p className='text-foreground mt-2 text-[11px] font-semibold'>{levelLabel}</p>
        <p className='text-muted-foreground text-[10px]'>Avg. Score: {averageScore.toFixed(1)}</p>

        {/* Progress pips */}
        <div className='mt-2.5 flex items-center gap-1'>
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i < levelNumber ? 'bg-primary w-4' : 'bg-primary/20 w-1.5'
                }`}
            />
          ))}
        </div>
      </div>

      <div className='border-border/60 bg-background mt-4 mb-3 rounded-md border p-3'>
        {/* Avatar + name */}
        <div className='mb-3 flex items-start gap-3'>
          <div className='bg-primary/10 text-primary grid size-14 shrink-0 place-items-center overflow-hidden rounded-md'>
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt='' className='h-full w-full object-cover' />
            ) : (
              <span className='text-base font-semibold'>{getInitials(profile.name)}</span>
            )}
          </div>
          <div className='min-w-0'>
            <p className='text-foreground truncate text-base font-semibold sm:text-lg'>
              {profile.name}
            </p>
            <p className='text-muted-foreground truncate text-sm'>{profile.title}</p>
            {profile.location ? (
              <p className='text-muted-foreground mt-1 inline-flex max-w-full items-center gap-1 truncate text-sm'>
                <MapPin className='size-4 shrink-0' />
                <span className='truncate'>{profile.location}</span>
              </p>
            ) : null}
          </div>
        </div>

        {/* CTAs */}
        <div className='mb-3 grid grid-cols-2 gap-2'>
          <div className='flex items-center px-3 text-sm font-medium text-muted-foreground'>
            Contact Info
          </div>

          <ProfileShareDialog profileName={profile.name} shareUrl={shareUrl ?? ''} triggerLabel='Share' />
        </div>

        {/* Profile facts */}
        <div className='space-y-2'>
          {profile.website ? (
            <ProfileFact icon={<Globe className='size-4' />} value={profile.website} />
          ) : null}
          {profile.email ? (
            <ProfileFact icon={<Mail className='size-4' />} value={profile.email} />
          ) : null}
          {profile.phone ? (
            <ProfileFact icon={<Phone className='size-4' />} value={profile.phone} />
          ) : null}
          {profile.joinedLabel ? (
            <ProfileFact icon={<CalendarDays className='size-4' />} value={profile.joinedLabel} />
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ProfileFact({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <p className='text-muted-foreground flex min-w-0 items-center gap-2 text-sm'>
      <span className='text-primary shrink-0'>{icon}</span>
      <span className='truncate'>{value}</span>
    </p>
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