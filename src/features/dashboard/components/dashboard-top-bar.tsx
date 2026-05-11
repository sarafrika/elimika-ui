'use client';

import { ThemeSwitcher } from '@/components/theme-switcher';
import { AppBreadcrumb } from '@/components/ui/app-breadcrumb';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { UserDomain } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { ApiResponseWallet } from '@/services/client';
import { getWalletOptions } from '@/services/client/@tanstack/react-query.gen';
import { dashboardDomainDisplayConfig } from '@/src/features/dashboard/config/domain-display';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import {
  buildDashboardSwitchPath,
  buildWorkspaceAliasPath,
} from '@/src/features/dashboard/lib/active-domain-storage';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  Search,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const dashboardLabelByDomain = (domain?: string | null) => {
  if (!domain) return 'Dashboard';
  return dashboardDomainDisplayConfig[domain as keyof typeof dashboardDomainDisplayConfig]?.title ?? 'Dashboard';
};

const currencyLabel = (currencyCode?: string | null) =>
  currencyCode?.toUpperCase() === 'KES' ? 'Ksh' : currencyCode?.toUpperCase() ?? '';

const formatBalance = (balance?: number | null, currencyCode?: string | null) => {
  if (balance === undefined || balance === null) {
    return 'Loading...';
  }

  const prefix = currencyLabel(currencyCode);
  const amount = new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(balance);
  return prefix ? `${prefix} ${amount}` : amount;
};

const getProfileName = (profile: ReturnType<typeof useUserProfile>) => {
  const fullName =
    profile?.full_name?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();

  return fullName || profile?.email || 'Account';
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');

export default function DashboardTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const profile = useUserProfile();
  const domain = useUserDomain();

  const activeDomain = domain.activeDomain ?? domain.domains[0] ?? null;
  const activeDomainConfig = activeDomain
    ? dashboardDomainDisplayConfig[activeDomain as keyof typeof dashboardDomainDisplayConfig]
    : null;
  const isCourseCreator = activeDomain === 'course_creator';
  const profileName = getProfileName(profile);
  const profileInitials = getInitials(profileName);

  const walletOptions = profile?.uuid ? getWalletOptions({ path: { userUuid: profile.uuid } }) : null;

  const walletQueryOptions = (walletOptions ?? {
    queryKey: ['dashboard-wallet', 'disabled'],
    queryFn: async () => ({}),
    enabled: false,
    retry: 1,
  }) as UseQueryOptions<ApiResponseWallet>;

  const walletQuery = useQuery(walletQueryOptions);
  const walletData = walletQuery.data;

  const walletBalance = formatBalance(walletData?.data?.balance_amount, walletData?.data?.currency_code);

  const activeDomainLabel = activeDomainConfig?.title ?? dashboardLabelByDomain(activeDomain);
  const roleLabel = activeDomainLabel.replace(' Dashboard', '');

  const handleDashboardSwitch = (nextDomain: UserDomain) => {
    if (!nextDomain || nextDomain === activeDomain) {
      return;
    }

    domain.setActiveDomain(nextDomain);
    router.push(buildDashboardSwitchPath(nextDomain, pathname || '/dashboard/overview'));
  };

  const notificationHref = buildWorkspaceAliasPath(activeDomain, '/dashboard/notifications');
  const createCourseHref = buildWorkspaceAliasPath(
    activeDomain,
    '/dashboard/course-management/create-new-course'
  );

  return (
    <header className='border-border/70 bg-background/90 sticky top-0 z-50 border-b backdrop-blur-md'>
      <div className='flex flex-col'>
        <div className='flex items-center gap-3 px-3 py-3 sm:px-5 lg:px-6'>
          <div className='flex min-w-0 items-center gap-3'>
            <SidebarTrigger className='-ml-1 shrink-0' />
            <Separator orientation='vertical' className='bg-border/70 hidden h-8 sm:block' />
            {/* <Link
              href={buildWorkspaceAliasPath(activeDomain, '/dashboard/overview')}
              className='flex min-w-0 items-center gap-3 transition hover:opacity-90'
              prefetch
            >
              <div className='bg-sidebar-primary flex size-10 items-center justify-center overflow-hidden rounded-2xl shadow-sm'>
                <Image
                  alt='Elimika logo in white'
                  src='/logos/elimika/Artboard 12.svg'
                  width={40}
                  height={40}
                  className='h-10 w-10 drop-shadow-sm'
                  priority
                />
              </div>
              <div className='hidden min-w-0 flex-col leading-tight sm:flex'>
                <span className='text-foreground truncate text-sm font-semibold'>
                  {activeDomainLabel}
                </span>
                <span className='text-muted-foreground truncate text-xs'>
                  {profile?.courseCreator?.professional_headline ?? profile?.email ?? 'Workspace dashboard'}
                </span>
              </div>
            </Link> */}
          </div>

          <div className='hidden min-w-0 flex-1 xl:block'>
            <label className='relative block max-w-2xl'>
              <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2' />
              <Input
                type='search'
                placeholder='Search courses, students, and more...'
                className='border-border/70 bg-card/80 h-12 rounded-full pl-11 pr-16 shadow-sm'
              />
              {/* <span className='text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 text-xs font-medium'>
                Ctrl K
              </span> */}
            </label>
          </div>

          <div className='ml-auto flex items-center gap-2 sm:gap-3'>
            {isCourseCreator && (
              <Button asChild size='sm' className='hidden rounded-full px-4 font-semibold md:inline-flex'>
                <Link href={createCourseHref}>
                  <Sparkles className='h-7 w-4' />
                  Create Course
                  <ChevronDown className='h-4 w-4' />
                </Link>
              </Button>
            )}

            <Button
              variant='outline'
              size='icon'
              asChild
              className='border-border/70 bg-card/80 hidden rounded-full shadow-sm sm:inline-flex'
            >
              <Link href={notificationHref} aria-label='Notifications'>
                <Bell className='h-4 w-4' />
              </Link>
            </Button>

            <ThemeSwitcher size='icon' />

            {(
              <div className='border-border/70 bg-card/80 hidden items-center gap-2 rounded-md border px-3 py-2 shadow-sm xl:flex'>
                <div className='bg-success/10 text-success flex size-8 items-center justify-center rounded-full'>
                  <Wallet className='h-4 w-4' />
                </div>
                <div className='min-w-0 leading-tight'>
                  <p className='text-muted-foreground text-[11px] font-medium uppercase tracking-wide'>
                    Skills Wallet
                  </p>
                  <p className='text-foreground truncate text-sm font-semibold'>
                    {walletBalance}
                  </p>
                </div>
              </div>
            )}

            <DashboardProfileMenu
              profileName={profileName}
              profileInitials={profileInitials}
              profileEmail={profile?.email}
              activeDomainLabel={activeDomainLabel}
              roleLabel={roleLabel}
              userImage={profile?.profile_image_url ?? ''}
              availableDomains={domain.domains}
              activeDomain={activeDomain}
              onSwitch={handleDashboardSwitch}
              onAddProfile={() => router.push(buildWorkspaceAliasPath(activeDomain, '/dashboard/add-profile'))}
              onLogout={async () => {
                await signOut();
                domain.clearDomain();
                profile?.clearProfile();
              }}
            />
          </div>
        </div>

        <div className='border-border/70 border-t px-3 pb-3 sm:px-5 lg:px-6 xl:hidden'>
          <label className='relative block'>
            <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2' />
            <Input
              type='search'
              placeholder='Search courses, students, and more...'
              className='border-border/70 bg-card/80 h-11 rounded-full pl-11 pr-14 shadow-sm'
            />
            {/* <span className='text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 text-xs font-medium'>
              Ctrl K
            </span> */}
          </label>

          <div className='mt-3 flex flex-wrap items-center gap-2'>
            {isCourseCreator && (
              <Button asChild size='sm' className='rounded-full px-4 font-semibold'>
                <Link href={createCourseHref}>
                  <Sparkles className='h-4 w-4' />
                  Create Course
                </Link>
              </Button>
            )}

            {isCourseCreator && (
              <div className='border-border/70 bg-card/80 flex items-center gap-2 rounded-full border px-3 py-2 shadow-sm sm:hidden'>
                <div className='bg-success/10 text-success flex size-7 items-center justify-center rounded-full'>
                  <Wallet className='h-3.5 w-3.5' />
                </div>
                <div className='min-w-0 leading-tight'>
                  <p className='text-muted-foreground text-[10px] uppercase tracking-wide'>
                    Skills Wallet
                  </p>
                  <p className='text-foreground truncate text-xs font-semibold'>{walletBalance}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='border-border/70 hidden border-t px-3 py-1 sm:px-5 lg:px-6 xl:block'>
          <AppBreadcrumb className='text-muted-foreground text-sm' />
        </div>
      </div>
    </header>
  );
}

type DashboardProfileMenuProps = {
  profileName: string;
  profileInitials: string;
  profileEmail?: string;
  activeDomainLabel: string;
  roleLabel: string;
  userImage?: string;
  availableDomains: UserDomain[];
  activeDomain: UserDomain | null;
  onSwitch: (domain: UserDomain) => void;
  onAddProfile: () => void;
  onLogout: () => Promise<void>;
};

function DashboardProfileMenu({
  profileName,
  profileInitials,
  profileEmail,
  activeDomainLabel,
  roleLabel,
  userImage,
  availableDomains,
  activeDomain,
  onSwitch,
  onAddProfile,
  onLogout,
}: DashboardProfileMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          className='border-border/70 bg-card/80 h-12 rounded-md px-3 shadow-sm transition hover:border-primary/40'
        >
          <Avatar className='border-border/60 h-8 w-8 border'>
            <AvatarImage src={userImage} alt={profileName} />
            <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
              {profileInitials}
            </AvatarFallback>
          </Avatar>
          <span className='hidden min-w-0 flex-col items-start leading-tight md:flex'>
            <span className='text-foreground truncate text-sm font-semibold'>{profileName}</span>
            <span className='text-muted-foreground truncate text-xs'>{roleLabel}</span>
          </span>
          <ChevronDown className='text-muted-foreground h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='border-border/70 w-80 rounded-2xl p-3 shadow-lg'>
        <div className='flex items-center gap-3 rounded-md bg-muted/40 p-3'>
          <Avatar className='h-10 w-10'>
            <AvatarImage src={userImage} alt={profileName} />
            <AvatarFallback className='bg-primary/10 text-primary text-sm font-semibold'>
              {profileInitials}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0'>
            <p className='text-foreground truncate text-sm font-semibold'>{profileName}</p>
            <p className='text-muted-foreground truncate text-xs'>{profileEmail ?? 'No email'}</p>
            <div className='mt-2 flex flex-wrap gap-2'>
              <Badge variant='outline' className='rounded-full px-2 py-0 text-[10px] uppercase'>
                {roleLabel}
              </Badge>
              <Badge variant='secondary' className='rounded-full px-2 py-0 text-[10px]'>
                {activeDomainLabel}
              </Badge>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className='my-3' />

        <DropdownMenuLabel className='px-2 text-[11px] uppercase tracking-wide'>
          Switch profile
        </DropdownMenuLabel>
        <div className='space-y-1'>
          {availableDomains.map(domain => {
            const config = dashboardDomainDisplayConfig[domain as keyof typeof dashboardDomainDisplayConfig];
            if (!config) return null;

            const Icon = config.icon;
            const isActive = domain === activeDomain;

            return (
              <DropdownMenuItem
                key={domain}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5',
                  isActive && 'bg-accent'
                )}
                onClick={() => onSwitch(domain)}
              >
                <div className={cn('flex size-8 items-center justify-center rounded-full', config.bgColor)}>
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-foreground truncate text-sm font-medium'>{config.title}</p>
                  <p className='text-muted-foreground truncate text-xs'>{config.description}</p>
                </div>
                {isActive && <LayoutDashboard className='text-primary h-4 w-4' />}
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator className='my-3' />

        <div className='grid gap-1'>
          <DropdownMenuItem
            className='cursor-pointer rounded-md px-3 py-2.5'
            onClick={onAddProfile}
          >
            Add another profile
          </DropdownMenuItem>
          <DropdownMenuItem
            className='text-destructive cursor-pointer rounded-md px-3 py-2.5'
            onClick={() => void onLogout()}
          >
            Sign out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
