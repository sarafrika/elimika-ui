import {
  BriefcaseBusiness,
  CalendarDays,
  Globe,
  Mail,
  MapPin,
  Phone,
  Share2
} from 'lucide-react';
import type React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { SharedMySkillsProfile, SharedSkill } from '../types';

type SkillOverviewCardProps = {
  profile: SharedMySkillsProfile;
  skills: SharedSkill[];
  averageScore: number;
  levelLabel: string;
};

export function SkillOverviewCard({
  profile,
  skills,
  averageScore,
  levelLabel,
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
      <div className='relative flex flex-col items-center justify-center overflow-hidden rounded-md bg-gradient-to-b from-primary/10 to-primary/5 py-5'>
        {/* Decorative rings */}
        <div className='absolute h-24 w-24 rounded-full border border-primary/10' />
        <div className='absolute h-16 w-16 rounded-full border border-primary/15' />

        {/* Level badge */}
        <div className='relative flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 border-primary/40 bg-background shadow-md shadow-primary/10'>
          <span className='text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none'>
            LV.
          </span>
          <span className='text-xl font-black leading-none text-primary'>
            {levelNumber}
          </span>
        </div>

        {/* Label + score */}
        <p className='mt-2 text-[11px] font-semibold text-foreground'>{levelLabel}</p>
        <p className='text-[10px] text-muted-foreground'>Avg. Score: {averageScore.toFixed(1)}</p>

        {/* Progress pips */}
        <div className='mt-2.5 flex items-center gap-1'>
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i < levelNumber ? 'w-4 bg-primary' : 'w-1.5 bg-primary/20'
                }`}
            />
          ))}
        </div>
      </div>

      <div className='border-border/60 bg-background mb-3 rounded-md border p-2 mt-4'>
        <div className='mb-2 flex items-start gap-2'>
          <div className='bg-primary/10 text-primary grid size-10 shrink-0 place-items-center overflow-hidden rounded-md'>
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt='' className='h-full w-full object-cover' />
            ) : (
              <BriefcaseBusiness className='size-4' aria-hidden='true' />
            )}
          </div>
          <div className='min-w-0'>
            <p className='text-foreground truncate text-sm font-semibold sm:text-base'>
              {profile.name}
            </p>
            <p className='text-muted-foreground truncate text-xs sm:text-sm'>{profile.title}</p>
            {profile.location ? (
              <p className='text-muted-foreground mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs'>
                <MapPin className='size-3.5 shrink-0' />
                <span className='truncate'>{profile.location}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className='mb-2 grid grid-cols-2 gap-2'>
          <Button type='button' size='sm' className='h-7 rounded-md text-[10px]'>
            Contact Info
          </Button>
          <Button type='button' variant='outline' size='sm' className='h-7 rounded-md text-[10px]'>
            <Share2 className='size-3' />
            Share
          </Button>
        </div>

        <div className='space-y-1.5'>
          {profile.website ? (
            <ProfileFact icon={<Globe className='size-3.5' />} value={profile.website} />
          ) : null}
          {profile.email ? (
            <ProfileFact icon={<Mail className='size-3.5' />} value={profile.email} />
          ) : null}
          {profile.phone ? (
            <ProfileFact icon={<Phone className='size-3.5' />} value={profile.phone} />
          ) : null}
          {profile.joinedLabel ? (
            <ProfileFact icon={<CalendarDays className='size-3.5' />} value={profile.joinedLabel} />
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ProfileFact({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <p className='text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs'>
      <span className='text-primary shrink-0'>{icon}</span>
      <span className='truncate'>{value}</span>
    </p>
  );
}