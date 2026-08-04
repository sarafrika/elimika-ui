'use client';

import { Briefcase, CalendarClock, Globe, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className='flex items-start gap-2'>
      <span className='text-muted-foreground mt-0.5 shrink-0'>{icon}</span>
      <div className='min-w-0'>
        <p className='text-muted-foreground text-[10px] tracking-wide uppercase'>{label}</p>
        <p className='text-sm font-medium break-words'>{value}</p>
      </div>
    </div>
  );
}

export interface ProfileSidebarProps {
  headline?: string;
  website?: string;
  location?: string;
  bio?: string;
  memberSince?: string;
  /** Domain-supplied cards rendered under the summary. */
  children?: ReactNode;
}

export function ProfileSidebar({
  headline,
  website,
  location,
  bio,
  memberSince,
  children,
}: ProfileSidebarProps) {
  const hasSummary = Boolean(headline || website || location || bio || memberSince);

  if (!hasSummary && !children) return null;

  return (
    <aside className='space-y-6 lg:sticky lg:top-6 lg:self-start'>
      {hasSummary && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Profile details</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <DetailRow
              icon={<Briefcase className='h-4 w-4' />}
              label='Headline'
              value={headline}
            />
            <DetailRow icon={<MapPin className='h-4 w-4' />} label='Location' value={location} />
            <DetailRow icon={<Globe className='h-4 w-4' />} label='Website' value={website} />
            <DetailRow
              icon={<CalendarClock className='h-4 w-4' />}
              label='Member since'
              value={memberSince}
            />
            {bio ? (
              <div>
                <p className='text-muted-foreground text-[10px] tracking-wide uppercase'>About</p>
                <p className='text-muted-foreground mt-1 line-clamp-6 text-sm leading-relaxed'>
                  {bio}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {children}
    </aside>
  );
}
