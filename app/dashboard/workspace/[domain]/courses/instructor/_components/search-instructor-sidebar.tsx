'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { SearchInstructor } from '@/src/features/dashboard/courses/types';
import { Info, Play, Sparkles, Video } from 'lucide-react';
import { useMemo, useState } from 'react';

type Props = {
  selectedInstructor: SearchInstructor | null;
  shortlist: SearchInstructor[];
  onSelectShortlist: (uuid: string) => void;
  onQuickHire: () => void;
  instructorIntroVideo: string
};

function getMatchScore(instructor: SearchInstructor | null) {
  if (!instructor) return 0;

  const base = Math.round((instructor.rating ?? 4.4) * 18);
  const experience = Math.min(12, Math.round((instructor.total_experience_years ?? 0) * 1.1));
  const verified = instructor.admin_verified ? 8 : 0;

  return Math.min(99, 52 + base + experience + verified);
}

function getMatchLabel(score: number) {
  if (score >= 92) return 'Excellent match';
  if (score >= 82) return 'Great match';
  return 'Good match';
}

function MatchRing({ score }: { score: number }) {
  return (
    <div
      className='relative grid size-20 place-items-center rounded-full'
      style={{
        background: `conic-gradient(hsl(var(--primary)) ${score}%, hsl(var(--border)) 0)`,
      }}
    >
      <div className='bg-card text-foreground grid size-14 place-items-center rounded-full'>
        <span className='text-lg font-semibold'>{score}%</span>
      </div>
    </div>
  );
}

export function SearchInstructorSidebar({
  selectedInstructor,
  shortlist,
  instructorIntroVideo,
  onSelectShortlist,
  onQuickHire,
}: Props) {
  const [skillsFundEnabled, setSkillsFundEnabled] = useState(true);
  const score = useMemo(() => getMatchScore(selectedInstructor), [selectedInstructor]);
  const matchLabel = getMatchLabel(score);
  // const primaryShortlist = shortlist.slice(0, 3);
  const primaryShortlist = [] as SearchInstructor[]

  return (
    <div className='space-y-4'>
      <Card className='rounded-md -space-y-2 border bg-card p-4 shadow-none'>
        <div className='flex items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <h3 className='text-sm font-semibold sm:text-base'>AI Match for You</h3>
            <Info className='text-muted-foreground size-4' />
          </div>
        </div>

        <div className='flex items-center gap-4'>
          <div className="grid size-[72px] place-items-center rounded-full"
            style={{
              background: `conic-gradient(
      color-mix(in srgb, var(--success) 85%, var(--background)) 0 ${score}%,
      color-mix(in srgb, var(--border) 60%, var(--background)) ${score}% 100%
    )`,
            }}
          >
            <div className="grid size-[58px] place-items-center rounded-full bg-card text-center">
              <div>
                <div className="text-[0.95rem] font-semibold leading-none text-foreground">
                  {score}%
                </div>
                <div className="mt-0.5 text-[0.55rem] uppercase tracking-wide text-muted-foreground">
                  match
                </div>
              </div>
            </div>
          </div>

          <div className='min-w-0 space-y-1'>
            <p className='text-foreground text-sm font-semibold sm:text-base'>{matchLabel}</p>
            <p className='text-muted-foreground text-xs sm:text-sm'>
              Great match for your needs!
            </p>
            <p className='text-primary text-xs font-medium'>Why this match?</p>
          </div>
        </div>
      </Card>

      <Card className='rounded-md -space-y-4 border bg-card p-4 shadow-none'>
        <div className='space-y-2'>
          <h3 className='text-sm font-semibold sm:text-base'>Quick Hire (1-Click Booking)</h3>
          <p className='text-muted-foreground text-xs sm:text-sm'>Book instantly with one click.</p>
        </div>

        <Button
          type='button'
          variant='success'
          className='h-11 w-full rounded-md'
          onClick={onQuickHire}
        >
          <Sparkles className='size-4' />
          Quick Hire Now
        </Button>

        <div className='text-muted-foreground flex flex-wrap items-center justify-center gap-2 text-xs'>
          <span>Instant confirmation</span>
          <span className='bg-border size-1 rounded-full' />
          <span>Secure booking</span>
        </div>
      </Card>

      <Card className='rounded-md -space-y-4 border bg-card p-4 shadow-none'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <h3 className='text-sm font-semibold sm:text-base'>Pay using Skills Fund</h3>
            <p className='text-muted-foreground text-xs sm:text-sm'>Balance: KSh 20,000</p>
          </div>
          <Switch checked={skillsFundEnabled} onCheckedChange={setSkillsFundEnabled} />
        </div>

        <div className='bg-background p-3'>
          <div className='flex items-center justify-between gap-3'>
            <p className='text-base font-semibold sm:text-lg'>KSh 1,500</p>
            <p className='text-muted-foreground text-xs sm:text-sm'>This booking</p>
          </div>
          <Separator className='my-3' />
          <ul className='space-y-2 text-xs sm:text-sm'>
            <li className='text-success flex items-center gap-2'>
              <span className='bg-success size-1.5 rounded-full' />
              Secure payment
            </li>
            <li className='text-success flex items-center gap-2'>
              <span className='bg-success size-1.5 rounded-full' />
              Instant confirmation
            </li>
            <li className='text-success flex items-center gap-2'>
              <span className='bg-success size-1.5 rounded-full' />
              No hidden fees
            </li>
          </ul>
        </div>
      </Card>

      <Card className='rounded-md -space-y-4 border bg-card p-4 shadow-none'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <h3 className='text-sm font-semibold sm:text-base'>Instructor Video Preview</h3>
          </div>
          <Video className='text-muted-foreground size-4' />
        </div>

        {instructorIntroVideo ? (
          <div className='relative overflow-hidden rounded-xl border bg-muted/40'>
            <div className='from-primary/25 via-background/80 to-card h-40 bg-gradient-to-br' />
            <div className='absolute inset-0 flex items-center justify-center'>
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='bg-background/90 text-foreground size-12 rounded-full shadow-md hover:bg-background'
              >
                <Play className='ms-0.5 size-5 fill-current' />
              </Button>
            </div>
            <Badge className='bg-background/90 text-foreground absolute right-2 bottom-2 rounded-full px-2 py-1 text-[11px]'>
              1:24
            </Badge>
          </div>
        ) : (
          <div className='flex h-40 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 text-center'>
            <p className='text-sm font-medium'>No intro video</p>
            <p className='text-muted-foreground text-xs'>
              This instructor hasn’t uploaded a video yet
            </p>
          </div>
        )}

        <div className=' flex items-center gap-3'>
          <Avatar className='size-11 border border-border/60'>
            <AvatarImage src={selectedInstructor?.profile_image_url ?? undefined} alt={selectedInstructor?.full_name} />
            <AvatarFallback className='text-xs font-semibold'>
              {selectedInstructor?.full_name?.charAt(0) ?? 'I'}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0'>
            <p className='truncate text-sm font-semibold'>{selectedInstructor?.full_name ?? 'John Mwangi'}</p>
            <p className='text-muted-foreground text-xs sm:text-sm'>
              {selectedInstructor?.professional_headline ?? 'Certified Piano Instructor'}
            </p>
          </div>
        </div>
      </Card>

      <Card className='rounded-md border bg-card p-4 shadow-none'>
        <div className='mb-3 flex items-center justify-between gap-3'>
          <div>
            <h3 className='text-sm font-semibold sm:text-base'>Your Shortlist ({primaryShortlist.length})</h3>
          </div>
          <Button type='button' variant='link' className='h-auto p-0 text-xs sm:text-sm'>
            View all
          </Button>
        </div>

        <div className='space-y-3'>
          {primaryShortlist.length === 0 ? (
            <div className='flex flex-col items-center justify-center rounded-md border border-dashed py-8 text-center'>
              <p className='text-sm font-medium'>No instructors shortlisted</p>
              <p className='text-muted-foreground text-xs'>
                Select instructors to add them here
              </p>
            </div>
          ) : (
            primaryShortlist.map(instructor => (
              <button
                key={instructor.uuid}
                type='button'
                onClick={() => onSelectShortlist(instructor.uuid as string)}
                className='flex w-full items-center gap-3 rounded-md border bg-background px-3 py-2 text-left transition-colors hover:bg-accent'
              >
                <Avatar className='size-10 border border-border/60'>
                  <AvatarImage
                    src={instructor.profile_image_url ?? undefined}
                    alt={instructor.full_name}
                  />
                  <AvatarFallback className='text-xs font-semibold'>
                    {instructor.full_name?.charAt(0) ?? 'I'}
                  </AvatarFallback>
                </Avatar>

                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>
                    {instructor.full_name}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {((instructor.rating ?? 0).toFixed(1) || '4.8')} • KSh 1,500 / session
                  </p>
                </div>

                <span className='text-muted-foreground text-xs'>×</span>
              </button>
            ))
          )}
        </div>

        {primaryShortlist.length > 0 && <Button type='button' variant='outline' className='mt-4 h-11 w-full rounded-md'>
          Compare Instructors ({primaryShortlist.length})
        </Button>}

      </Card>
    </div>
  );
}
