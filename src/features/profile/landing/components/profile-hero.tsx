'use client';

import { Globe, Mail, MapPin, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

function MetaItem({ icon, value }: { icon: ReactNode; value?: string }) {
  if (!value) return null;
  return (
    <span className='inline-flex min-w-0 items-center gap-1.5'>
      {icon}
      <span className='truncate'>{value}</span>
    </span>
  );
}

export interface ProfileHeroProps {
  name: string;
  initials: string;
  avatarUrl?: string;
  headline?: string;
  isOnline?: boolean;
  badge?: ReactNode;
  location?: string;
  email?: string;
  phone?: string;
  website?: string;
  userNo?: string;
  /** Overlay rendered on top of the avatar (e.g. the change-photo trigger). */
  avatarOverlay?: ReactNode;
  /** Controls rendered under the avatar (e.g. upload / cancel buttons). */
  avatarActions?: ReactNode;
  /** Primary actions rendered in the right-hand block (e.g. "Edit details"). */
  actions?: ReactNode;
}

export function ProfileHero({
  name,
  initials,
  avatarUrl,
  headline,
  isOnline,
  badge,
  location,
  email,
  phone,
  website,
  userNo,
  avatarOverlay,
  avatarActions,
  actions,
}: ProfileHeroProps) {
  const hasSideBlock = Boolean(userNo) || Boolean(actions);

  return (
    <Card className='from-primary via-primary to-primary/80 text-primary-foreground relative overflow-hidden border-none bg-gradient-to-br shadow-xl'>
      <CardContent className='relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8'>
        <div className='w-28 shrink-0 self-center sm:self-auto'>
          <div className='group relative h-24 w-24'>
            <Avatar className='ring-primary-foreground/30 h-24 w-24 rounded-2xl shadow-2xl ring-4'>
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className='bg-primary/60 text-primary-foreground rounded-2xl text-2xl font-semibold'>
                {initials}
              </AvatarFallback>
            </Avatar>

            {avatarOverlay}

            {isOnline && (
              <span className='bg-success border-primary absolute -top-1 -right-1 h-5 w-5 rounded-full border-2' />
            )}
          </div>

          {avatarActions}
        </div>

        <div className='min-w-0 flex-1'>
          {badge ? <div className='flex flex-wrap items-center gap-2'>{badge}</div> : null}

          <h1 className='mt-2 text-3xl font-bold tracking-tight sm:text-4xl'>{name}</h1>

          {headline ? (
            <p className='text-primary-foreground/85 mt-1 text-sm sm:text-base'>{headline}</p>
          ) : null}

          <div className='text-primary-foreground/80 mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs'>
            <MetaItem icon={<MapPin className='h-3.5 w-3.5 shrink-0' />} value={location} />
            <MetaItem icon={<Mail className='h-3.5 w-3.5 shrink-0' />} value={email} />
            <MetaItem icon={<Phone className='h-3.5 w-3.5 shrink-0' />} value={phone} />
            <MetaItem icon={<Globe className='h-3.5 w-3.5 shrink-0' />} value={website} />
          </div>
        </div>

        {hasSideBlock && (
          <div className='bg-primary-foreground/10 shrink-0 rounded-2xl p-4 text-center backdrop-blur'>
            {userNo ? (
              <>
                <p className='text-primary-foreground/70 text-[10px] tracking-widest uppercase'>
                  User no
                </p>
                <p className='mt-1 font-mono text-lg leading-none font-semibold tracking-wider'>
                  {userNo}
                </p>
              </>
            ) : null}
            {actions ? <div className='mt-3 flex justify-center'>{actions}</div> : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
