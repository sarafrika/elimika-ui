'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@radix-ui/react-avatar';
import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Download, QrCode, Sparkles, Wallet } from 'lucide-react';
import { AvatarImage } from '../../../../../../components/ui/avatar';
import { Badge } from '../../../../../../components/ui/badge';
import { Button } from '../../../../../../components/ui/button';
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
  data: StudentOverviewData
}

function ProgressRing({ value, size = 132, stroke = 12 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ring-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="ring-gradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--success))" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-3xl font-semibold tracking-tight">{value}%</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Skill Level</div>
        </div>
      </div>
    </div>
  );
}

export function StudentOverviewHeroCard({
  profile,
  data
}: StudentOverviewHeroCardProps) {

  const initials = profile?.full_name
    ?.split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const walletOptions = profile?.uuid ? getWalletOptions({ path: { userUuid: profile.uuid } }) : null;

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

  const walletBalance = formatBalance(walletData?.data?.balance_amount, walletData?.data?.currency_code);

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2 overflow-hidden border-0 bg-gradient-to-br from-primary to-success text-primary-foreground">

        <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-start">
          <Avatar className="h-16 w-16 rounded-full ring-4 ring-primary-foreground/20">
            <AvatarImage
              src={toAuthenticatedMediaUrl(profile?.profile_image_url) ?? undefined}
              alt={profile?.full_name ?? "Profile image"}
              className='rounded-full'
            />
            <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>


          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider opacity-80">Welcome back</p>
            <h1 className="text-2xl font-semibold mt-1">{profile?.full_name}</h1>
            <p className="text-sm opacity-90">{profile?.username ?? "Web Design & Data Analytics"} · {profile?.student?.demographic_tag ?? "Nairobi, Kenya"}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="bg-primary-foreground/15 hover:bg-primary-foreground/20 text-primary-foreground border-0">Level 4 · Advanced</Badge>
              <Badge className="bg-primary-foreground/15 hover:bg-primary-foreground/20 text-primary-foreground border-0">{data?.verifiedSkills} Portfolio Entries</Badge>
              <Badge className="bg-warning hover:bg-warning/90 text-warning-foreground border-0">
                <Sparkles className="h-3 w-3 mr-1" /> AI recommendations ready
              </Badge>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button size="sm" className="bg-background text-primary hover:bg-background/90">
                <Download className="h-4 w-4 mr-2" /> Download CV
              </Button>
              <Button size="sm" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <QrCode className="h-4 w-4 mr-2" /> Share Profile
              </Button>
            </div>
          </div>
          <div className="hidden sm:block">
            <ProgressRing value={data?.skillsProgress} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" /> Skills Wallet
            </CardTitle>
            <Badge variant="outline" className="text-success border-success/20 bg-success/10">Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-3xl font-semibold tracking-tight">{walletBalance}</div>
            <p className="text-xs text-muted-foreground">Available balance</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="font-semibold text-warning">KES 0</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Disbursed</p>
              <p className="font-semibold text-success">KES 0</p>
            </div>
          </div>
          <Button className="w-full bg-warning text-warning-foreground hover:bg-warning/90">
            Apply for Funding <ArrowUpRight className="h-4 w-4 ml-1" />
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
