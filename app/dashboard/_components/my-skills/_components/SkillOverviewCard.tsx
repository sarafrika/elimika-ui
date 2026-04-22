import type React from 'react';
import { BriefcaseBusiness, CalendarDays, Check, Layers, Mail, MapPin, Phone } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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

  return (
    <article className='border-border/60 bg-card rounded-lg border p-3 shadow-sm'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <h2 className='text-foreground text-sm font-semibold sm:text-base'>Skills Overview</h2>
        <Badge variant='outline' className='rounded-md text-[10px]'>
          {levelLabel}
        </Badge>
      </div>

      <div className='mb-4 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3'>
        <div className='bg-primary/10 text-primary grid size-12 place-items-center rounded-md'>
          <Layers className='size-6' aria-hidden='true' />
        </div>
        <div className='min-w-0'>
          <div className='mb-1 flex items-center justify-between gap-3'>
            <p className='text-foreground truncate text-sm font-semibold'>Verified Skill Set</p>
            <span className='text-primary text-xs font-semibold'>{averageScore}%</span>
          </div>
          <Progress value={averageScore} className='h-1.5 rounded-sm' />
        </div>
      </div>

      <div className='border-border/60 bg-background mb-3 rounded-md border p-2.5'>
        <div className='mb-2 flex items-start gap-2'>
          <div className='bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-md'>
            <BriefcaseBusiness className='size-4' aria-hidden='true' />
          </div>
          <div className='min-w-0'>
            <p className='text-foreground truncate text-xs font-semibold sm:text-sm'>
              {profile.name}
            </p>
            <p className='text-muted-foreground truncate text-[10px] sm:text-xs'>{profile.title}</p>
            {profile.location ? (
              <p className='text-muted-foreground mt-1 inline-flex max-w-full items-center gap-1 truncate text-[10px]'>
                <MapPin className='size-3 shrink-0' />
                <span className='truncate'>{profile.location}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className='space-y-1.5'>
          {profile.email ? (
            <ProfileFact icon={<Mail className='size-3' />} value={profile.email} />
          ) : null}
          {profile.phone ? (
            <ProfileFact icon={<Phone className='size-3' />} value={profile.phone} />
          ) : null}
          {profile.joinedLabel ? (
            <ProfileFact icon={<CalendarDays className='size-3' />} value={profile.joinedLabel} />
          ) : null}
        </div>
      </div>

      <div className='space-y-2'>
        {overviewSkills.length > 0 ? (
          overviewSkills.map(skill => (
            <div
              key={skill.id}
              className='border-border/60 bg-background grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border px-2.5 py-2'
            >
              <div className='min-w-0'>
                <p className='text-foreground truncate text-xs font-medium sm:text-sm'>
                  {skill.name}
                </p>
                <div className='text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-xs'>
                  <span className='inline-flex items-center gap-1'>
                    <MapPin className='size-3' />
                    {skill.category ?? 'General'}
                  </span>
                  <span className='inline-flex items-center gap-1'>
                    <BriefcaseBusiness className='size-3' />
                    {skill.level}
                  </span>
                </div>
              </div>
              {skill.verified ? (
                <span className='bg-primary/10 text-primary grid size-6 place-items-center rounded-md'>
                  <Check className='size-3.5' />
                </span>
              ) : null}
            </div>
          ))
        ) : (
          <div className='border-border/60 bg-background rounded-md border border-dashed px-3 py-5 text-center'>
            <p className='text-muted-foreground text-xs sm:text-sm'>No verified skills yet.</p>
          </div>
        )}
      </div>
    </article>
  );
}

function ProfileFact({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <p className='text-muted-foreground flex min-w-0 items-center gap-1.5 text-[10px]'>
      <span className='text-primary shrink-0'>{icon}</span>
      <span className='truncate'>{value}</span>
    </p>
  );
}
