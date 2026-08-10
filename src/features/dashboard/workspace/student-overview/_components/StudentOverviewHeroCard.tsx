'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@radix-ui/react-avatar';
import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Download, QrCode, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useProfileShareUrl } from '../../../../../../app/dashboard/_components/skills-wallet/use-profile-share-url';
import { socialShareActions } from '../../../../../../app/dashboard/instructor/classes/overview/[id]/page';
import { LinkShareCard } from '../../../../../../components/shared/link-share-card';
import { AvatarImage } from '../../../../../../components/ui/avatar';
import { Badge } from '../../../../../../components/ui/badge';
import { Button } from '../../../../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../../../../components/ui/dialog';
import { buildSocialShareUrl, openShareWindow } from '../../../../../../lib/share';
import { UserProfileType } from '../../../../../../lib/types';
import { ApiResponseWallet } from '../../../../../../services/client';
import { getWalletOptions } from '../../../../../../services/client/@tanstack/react-query.gen';
import { toAuthenticatedMediaUrl } from '../../../../../lib/media-url';
import { formatBalance } from '../../../components/dashboard-top-bar';
import { StudentOverviewData } from '../useStudentOverviewData';

type ProfileType =
  | (Partial<UserProfileType> & {
    isLoading: boolean;
    invalidateQuery: () => void;
    clearProfile: () => void;
  })
  | null;

interface StudentOverviewHeroCardProps {
  profile: ProfileType;
  data: StudentOverviewData;
}

function ProgressRing({
  value,
  size = 132,
  stroke = 12,
}: {
  value: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className='relative' style={{ width: size, height: size }}>
      <svg width={size} height={size} className='-rotate-90'>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke='hsl(var(--muted))'
          strokeWidth={stroke}
          fill='none'
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke='url(#ring-gradient)'
          strokeWidth={stroke}
          strokeLinecap='round'
          fill='none'
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id='ring-gradient' x1='0' x2='1' y1='0' y2='1'>
            <stop offset='0%' stopColor='hsl(var(--primary))' />
            <stop offset='100%' stopColor='hsl(var(--success))' />
          </linearGradient>
        </defs>
      </svg>
      <div className='absolute inset-0 grid place-items-center'>
        <div className='text-center'>
          <div className='text-3xl font-semibold tracking-tight'>{value}%</div>
          <div className='text-muted-foreground text-[10px] tracking-wider uppercase'>
            Skill Level
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudentOverviewHeroCard({ profile, data }: StudentOverviewHeroCardProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const userName = profile?.full_name!
  const skillsWalletShareLink = useProfileShareUrl(profile?.uuid, 'student');

  const initials = profile?.full_name
    ?.split(' ')
    .map(name => name[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const walletOptions = profile?.uuid
    ? getWalletOptions({ path: { userUuid: profile.uuid } })
    : null;

  const walletQueryOptions = (walletOptions ?? {
    queryKey: ['getWallet', 'disabled'],
    queryFn: async () => ({}),
    enabled: false,
    retry: 1,
  }) as UseQueryOptions<ApiResponseWallet>;

  const walletQuery = useQuery({
    ...walletQueryOptions,
    staleTime: 5 * 60 * 1000,
  });
  const walletData = walletQuery.data;

  const walletBalance = formatBalance(
    walletData?.data?.balance_amount,
    walletData?.data?.currency_code
  );

  return (
    <section className='grid gap-4 lg:grid-cols-3'>
      <Card className='from-primary to-success text-primary-foreground overflow-hidden border-0 bg-gradient-to-br lg:col-span-2'>
        <CardContent className='flex flex-col items-start gap-6 p-6 sm:flex-row'>
          <Avatar className='ring-primary-foreground/20 h-16 w-16 rounded-full ring-4'>
            <AvatarImage
              src={toAuthenticatedMediaUrl(profile?.profile_image_url) ?? undefined}
              alt={profile?.full_name ?? 'Profile image'}
              className='rounded-full'
            />
            <AvatarFallback className='bg-primary text-primary-foreground flex h-full w-full items-center justify-center rounded-full text-lg font-bold'>
              {initials || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className='min-w-0 flex-1'>
            <p className='text-xs tracking-wider uppercase opacity-80'>Welcome back</p>
            <h1 className='mt-1 text-2xl font-semibold'>{profile?.full_name}</h1>
            <p className='text-sm opacity-90'>
              {profile?.username ?? 'Web Design & Data Analytics'} ·{' '}
              {profile?.student?.demographic_tag ?? 'Nairobi, Kenya'}
            </p>
            <div className='mt-4 flex flex-wrap gap-2'>
              <Badge className='bg-primary-foreground/15 hover:bg-primary-foreground/20 text-primary-foreground border-0'>
                Level 1 · Prep
              </Badge>
              <Badge className='bg-primary-foreground/15 hover:bg-primary-foreground/20 text-primary-foreground border-0'>
                {data?.verifiedSkills} Portfolio Entries
              </Badge>
            </div>
            <div className='mt-5 flex flex-wrap gap-2'>
              <Button size='sm' className='bg-background text-primary hover:bg-background/90'>
                <Download className='mr-2 h-4 w-4' /> Download CV
              </Button>
              <Button
                size='sm'
                variant='outline'
                className='text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10 hover:text-primary-foreground bg-transparent'
                onClick={() => {
                  setShareOpen(true);
                }}
              >
                <QrCode className='mr-2 h-4 w-4' /> Share Profile
              </Button>
            </div>
          </div>
          <div className='hidden sm:block'>
            <ProgressRing value={data?.skillsProgress} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='pb-2'>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Wallet className='text-primary h-4 w-4' /> Skills Wallet
            </CardTitle>
            <Badge variant='outline' className='text-success border-success/20 bg-success/10'>
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <div className='text-3xl font-semibold tracking-tight'>{walletBalance}</div>
            <p className='text-muted-foreground text-xs'>Available balance</p>
          </div>
          <div className='grid grid-cols-2 gap-3 text-sm'>
            <div className='bg-muted rounded-lg p-3'>
              <p className='text-muted-foreground text-xs'>Pending</p>
              <p className='text-warning font-semibold'>KES 0</p>
            </div>
            <div className='bg-muted rounded-lg p-3'>
              <p className='text-muted-foreground text-xs'>Disbursed</p>
              <p className='text-success font-semibold'>KES 0</p>
            </div>
          </div>
          <Button className='bg-warning text-warning-foreground hover:bg-warning/90 w-full'>
            Apply for Funding <ArrowUpRight className='ml-1 h-4 w-4' />
          </Button>
        </CardContent>
      </Card>


      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Share Profile</DialogTitle>
            <DialogDescription>
              Share your professional profile, skills, achievements, certifications,
              and learning progress with employers, instructors, or other learners.
            </DialogDescription>
          </DialogHeader>

          <LinkShareCard
            title='Profile Link'
            description='Copy or share your profile link.'
            url={skillsWalletShareLink}
            footer={
              <div className='space-y-3'>
                <h4 className='text-sm font-medium'>Share via</h4>

                <div className='flex flex-wrap gap-2'>
                  {socialShareActions.map(({ icon: Icon, label, platform }) => (
                    <Button
                      key={label}
                      size='sm'
                      variant='outline'
                      className='gap-2'
                      disabled={!skillsWalletShareLink}
                      onClick={() =>
                        openShareWindow(
                          buildSocialShareUrl(platform, {
                            title: `${userName}'s Skills Wallet`,
                            url: skillsWalletShareLink,
                            description: `Check out ${userName}'s profile.`,
                          })
                        )
                      }
                    >
                      <Icon className='h-4 w-4' />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            }
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}
