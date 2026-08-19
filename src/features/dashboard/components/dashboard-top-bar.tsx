'use client';

import { buildWalletAccounts } from '@/app/dashboard/student/wallet/page';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { UserDomain } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { ApiResponseWallet } from '@/services/client';
import { getWalletOptions } from '@/services/client/@tanstack/react-query.gen';
import { useLogout } from '@/src/features/auth/logout';
import { CreateAction, dashboardDomainDisplayConfig, useCreateMenuActions } from '@/src/features/dashboard/config/domain-display';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import {
  buildDashboardSwitchPath,
  buildWorkspaceAliasPath,
} from '@/src/features/dashboard/lib/active-domain-storage';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Laptop2,
  LayoutDashboard,
  MoonStar,
  Search,
  Send,
  Sparkles,
  SunMedium,
  Upload,
  Wallet
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Label } from '../../../../components/ui/label';
import { DashboardNotifications } from './dashboard-notifications';

const dashboardLabelByDomain = (domain?: string | null) => {
  if (!domain) return 'Dashboard';
  return (
    dashboardDomainDisplayConfig[domain as keyof typeof dashboardDomainDisplayConfig]?.title ??
    'Dashboard'
  );
};

const currencyLabel = (currencyCode?: string | null) =>
  currencyCode?.toUpperCase() === 'KES' ? 'KES' : (currencyCode?.toUpperCase() ?? '');

export const formatBalance = (balance?: number | null, currencyCode?: string | null) => {
  if (balance === undefined || balance === null) {
    return (
      <div className='flex items-center'>
        <div className='border-border border-t-primary h-4 w-4 animate-spin rounded-full border-2' />
      </div>
    );
  }

  const prefix = currencyLabel(currencyCode);

  const amount = new Intl.NumberFormat('en-KE', {
    maximumFractionDigits: 0,
  }).format(balance);

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
  const profile = useUserProfile();
  const domain = useUserDomain();
  const logout = useLogout();

  const activeDomain = domain.activeDomain ?? null;
  const createActions = useCreateMenuActions(activeDomain);

  const activeDomainConfig = activeDomain
    ? dashboardDomainDisplayConfig[activeDomain as keyof typeof dashboardDomainDisplayConfig]
    : null;
  const isCourseCreator = activeDomain === 'course_creator';
  const isInstructor = activeDomain === 'instructor';
  const isOrganisation = activeDomain === 'organisation';
  const isStudent = activeDomain === 'student';

  const profileName = getProfileName(profile);
  const profileInitials = getInitials(profileName);
  const [walletBalanceVisible, setWalletBalanceVisible] = useState(true);
  const [isDepositSheetOpen, setIsDepositSheetOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('dashboard-wallet-balance-visible');
    if (stored === null) return;
    setWalletBalanceVisible(stored === 'true');
  }, []);

  const setWalletBalanceVisiblePersisted = (nextVisible: boolean) => {
    setWalletBalanceVisible(nextVisible);
    window.localStorage.setItem('dashboard-wallet-balance-visible', String(nextVisible));
  };

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
    // Balance changes rarely; don't refetch it on every page navigation.
    staleTime: 5 * 60 * 1000,
  });
  const walletData = walletQuery.data;

  const walletBalance = formatBalance(
    walletData?.data?.balance_amount,
    walletData?.data?.currency_code
  );
  const balance = walletData?.data?.balance_amount
  const walletBalanceDisplay = walletBalanceVisible ? walletBalance : '••••••';
  const walletAccounts = useMemo(() => buildWalletAccounts(walletData?.data ?? undefined), [walletData?.data]);

  const activeDomainLabel = activeDomainConfig?.title ?? dashboardLabelByDomain(activeDomain);
  const roleLabel = activeDomainLabel.replace(' Dashboard', '');

  const handleDashboardSwitch = (nextDomain: UserDomain) => {
    if (!nextDomain || nextDomain === activeDomain) {
      return;
    }

    domain.setActiveDomain(nextDomain);
    router.push(buildDashboardSwitchPath(nextDomain, '/dashboard/overview'));
  };

  const notificationHref = buildWorkspaceAliasPath(activeDomain, '/dashboard/notifications');
  const createCourseHref = buildWorkspaceAliasPath(
    activeDomain,
    '/dashboard/course-management/create-new-course'
  );
  const createClassHref = buildWorkspaceAliasPath(activeDomain, '/dashboard/classes/new');
  const walletHref = buildWorkspaceAliasPath(activeDomain, '/dashboard/wallet');
  const withdrawHref = `${walletHref}/withdraw`;

  return (
    <header className='bg-background/90 sticky top-0 z-50 backdrop-blur-md'>
      <div className='flex flex-col'>
        <div className='flex items-center gap-3 px-1 py-3 sm:px-3 lg:px-4'>
          <div className='hidden min-w-0 flex-1 xl:block'>
            <Label className='relative block max-w-2xl 2xl:max-w-3xl'>
              <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2' />

              <Input
                type='search'
                placeholder='Search courses, students, and more...'
                className='border-input bg-background hover:border-primary/40 h-10 rounded-full border pr-16 pl-11 text-xs shadow-sm transition-colors'
              />
              <kbd className='border-border bg-muted text-muted-foreground pointer-events-none absolute top-1/2 right-4 hidden -translate-y-1/2 rounded border px-1.5 py-0.5 text-[10px] font-medium 2xl:inline-block'>
                ⌘K
              </kbd>
            </Label>
          </div>

          <div className='ml-auto flex items-center gap-2 sm:gap-3'>
            {isCourseCreator && (
              <Button
                asChild
                size='sm'
                className='h-9 rounded-md px-4 font-semibold md:inline-flex'
              >
                <Link href={createCourseHref}>
                  <Sparkles className='h-4 w-4' />
                  Create Course
                  <ChevronDown className='h-4 w-4 hidden sm:flex' />
                </Link>
              </Button>
            )}

            {(isInstructor || isOrganisation) && (
              <Button
                asChild
                size='sm'
                className='h-9 rounded-md px-4 font-semibold md:inline-flex'
              >
                <Link href={createClassHref} className='flex flex-row items-center'>
                  <Sparkles className='h-4 w-4' />
                  Create Class

                  <ChevronDown className='h-4 w-4 hidden sm:flex' />
                </Link>
              </Button>
            )}

            {isStudent && (
              <Button
                asChild
                size='sm'
                className='h-9 rounded-md px-4 text-sm font-semibold md:inline-flex'
              >
                <Link className='flex flex-row items-center' href='/dashboard/student/courses'>
                  <Sparkles className='h-3 w-3 hidden sm:flex' />
                  Enroll Course
                  <ChevronDown className='h-3 w-3 hidden sm:flex' />
                </Link>
              </Button>
            )}

            {/* <CreateMenu actions={createActions} compact /> */}

            <DashboardNotifications
              notificationHref={notificationHref}
              activeDomain={activeDomain}
            />

            <DashboardWalletMenu
              walletBalance={walletBalanceDisplay as string}
              balance={balance as number}
              walletCurrency={walletData?.data?.currency_code}
              accounts={walletAccounts}
              walletHref={walletHref}
              withdrawHref={withdrawHref}
              onToggleBalance={() => setWalletBalanceVisiblePersisted(!walletBalanceVisible)}
              onDeposit={() => setIsDepositSheetOpen(true)}
              onTransfer={() => router.push(`${withdrawHref}?section=transfer`)}
              onWithdraw={() => router.push(`${withdrawHref}?section=withdraw`)}
            />

            <DashboardProfileMenu
              profileName={profileName}
              profileInitials={profileInitials}
              profileEmail={profile?.email}
              activeDomainLabel={activeDomainLabel}
              roleLabel={roleLabel}
              userImage={toAuthenticatedMediaUrl(profile?.profile_image_url) ?? ''}
              availableDomains={domain.domains}
              activeDomain={activeDomain}
              onSwitch={handleDashboardSwitch}
              onAddProfile={() => router.push('/dashboard/add-profile')}
              onLogout={async () => {
                await logout({
                  clearDomain: domain.clearDomain,
                  clearProfile: profile?.clearProfile,
                });
              }}
            />
          </div>
        </div>

        <div className='border-border/70 border-t px-3 pt-2 sm:px-5 lg:px-6 xl:hidden'>
          <label className='relative block'>
            <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2' />
            <Input
              type='search'
              placeholder='Search courses, students, and more...'
              className='border-border/70 bg-card/80 h-11 rounded-md pr-14 pl-11 text-sm shadow-sm'
            />
            {/* <span className='text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 text-xs font-medium'>
              Ctrl K
            </span> */}
          </label>
        </div>
      </div>

      <DepositMethodSheet
        open={isDepositSheetOpen}
        onOpenChange={setIsDepositSheetOpen}
        walletHref={`${walletHref}?tab=top-up`}
      />
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
  const { theme, setTheme, systemTheme } = useTheme();
  const selectedTheme = theme ?? 'system';
  const resolvedTheme = selectedTheme === 'system' ? (systemTheme ?? 'light') : selectedTheme;

  const themeOptions = [
    { value: 'light', label: 'Light', Icon: SunMedium },
    { value: 'dark', label: 'Dark', Icon: MoonStar },
    { value: 'system', label: 'System', Icon: Laptop2 },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 rounded-md border-0 bg-transparent p-0 shadow-none hover:bg-transparent sm:border sm:border-border/70 sm:bg-card/80 sm:px-3 sm:shadow-sm sm:hover:border-primary/40 sm:hover:bg-primary/15"
        >
          <Avatar className="border-border/60 h-8 w-8 border">
            <AvatarImage src={userImage} alt={profileName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {profileInitials}
            </AvatarFallback>
          </Avatar>

          <span className="hidden min-w-0 flex-col items-start leading-tight md:flex">
            <span className="text-foreground truncate text-sm font-semibold">
              {profileName}
            </span>
            <span className="text-muted-foreground truncate text-xs">
              {roleLabel}
            </span>
          </span>

          <ChevronDown className="text-muted-foreground hidden h-4 w-4 sm:flex" />
        </Button>
      </DropdownMenuTrigger>


      <DropdownMenuContent align='end' className='border-border/70 w-80 rounded-md p-3 shadow-lg'>
        <div className='bg-muted/40 flex items-center gap-3 rounded-md p-3'>
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
              <Badge variant='secondary' className='rounded-md px-2 py-0 text-[10px]'>
                {activeDomainLabel}
              </Badge>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className='my-3' />

        <DropdownMenuLabel className='px-2 text-[11px] tracking-wide uppercase'>
          Appearance
        </DropdownMenuLabel>

        <div className='space-y-1'>
          {themeOptions.map(({ value, label, Icon }) => (
            <DropdownMenuItem
              key={value}
              className={cn(
                'flex items-center justify-between gap-2 text-sm',
                selectedTheme === value && 'text-primary'
              )}
              onSelect={() => setTheme(value)}
            >
              <span className='flex min-w-0 items-center gap-2'>
                <Icon className='h-4 w-4 shrink-0' />
                <span className='truncate'>{label}</span>
                {value === 'system' && (
                  <span className='text-muted-foreground text-xs'>
                    ({resolvedTheme === 'dark' ? 'Dark' : 'Light'})
                  </span>
                )}
              </span>
              <Check
                className={cn(
                  'text-primary h-4 w-4 shrink-0 transition-opacity',
                  selectedTheme === value ? 'opacity-100' : 'opacity-0'
                )}
              />
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator className='my-3' />

        <DropdownMenuLabel className='px-2 text-[11px] tracking-wide uppercase'>
          Switch profile
        </DropdownMenuLabel>

        <div className='space-y-1'>
          {availableDomains.map(domain => {
            const config =
              dashboardDomainDisplayConfig[domain as keyof typeof dashboardDomainDisplayConfig];

            if (!config) return null;

            const Icon = config.icon;
            const isActive = domain === activeDomain;

            return (
              <DropdownMenuItem
                key={domain}
                className={cn(
                  'hover:bg-primary/25 focus:bg-primary/25 flex h-10 cursor-pointer items-center gap-3 rounded-md px-3',
                  isActive && 'bg-primary/10'
                )}
                onClick={() => onSwitch(domain)}
              >
                <div
                  className={cn(
                    'hover:bg-primary/15 flex size-8 items-center justify-center rounded-full',
                    config.bgColor
                  )}
                >
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
            className='hover:bg-primary/15 focus:bg-primary/15 h-10 cursor-pointer rounded-md px-3'
            onClick={onAddProfile}
          >
            Add another profile
          </DropdownMenuItem>

          <DropdownMenuItem
            className='text-destructive hover:bg-primary/15 focus:bg-primary/15 h-10 cursor-pointer rounded-md px-3'
            onClick={() => void onLogout()}
          >
            Sign out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DashboardWalletMenu({
  compact = false,
  walletBalance,
  balance,
  walletCurrency,
  accounts,
  walletHref,
  withdrawHref,
  onToggleBalance,
  onDeposit,
  onTransfer,
  onWithdraw,
}: {
  compact?: boolean;
  walletBalance: string;
  balance: number | string;
  walletCurrency?: string | null;
  accounts: ReturnType<typeof buildWalletAccounts>;
  walletHref: string;
  withdrawHref: string;
  onToggleBalance: () => void;
  onDeposit: () => void;
  onTransfer: () => void;
  onWithdraw: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'border-border/70 bg-card/80 hover:border-primary/40 hover:bg-primary/15 h-10 rounded-md px-3 shadow-sm transition',
            compact && 'h-9 px-2.5'
          )}
        >
          {/* Mobile: balance */}
          <span className="text-foreground text-xs font-semibold sm:hidden">
            {walletBalance}
          </span>

          {/* Desktop/tablet: wallet icon */}
          <div className="bg-success/10 text-success hidden h-8 w-8 items-center justify-center rounded-full sm:flex">
            <Wallet className="h-4 w-4" />
          </div>

          {!compact && (
            <span className="hidden min-w-0 flex-col items-start leading-tight md:flex">
              <span className="text-foreground truncate text-sm font-semibold">
                {walletBalance}
              </span>
            </span>
          )}

          {compact && (
            <span className="text-foreground hidden text-xs font-semibold sm:flex sm:text-sm">
              {walletBalance}
            </span>
          )}

          <ChevronDown className="text-muted-foreground hidden h-4 w-4 sm:flex" />
        </Button>
      </DropdownMenuTrigger>


      <DropdownMenuContent align='end' className='border-border/70 w-96 rounded-md p-3 shadow-lg'>
        <div className='bg-muted/60 flex items-start justify-between gap-3 rounded-md p-3'>
          <div className='min-w-0'>
            <div className='flex flex-row items-center gap-4'>
              <p className='text-muted-foreground text-xs tracking-wide'>Wallet Overview</p>
              <button
                type='button'
                className='text-muted-foreground hover:text-foreground rounded-full p-2 transition'
                onClick={onToggleBalance}
              >
                {walletBalance === '••••••' ? <Eye className='h-4 w-4' /> : <EyeOff className='h-4 w-4' />}
              </button>
            </div>

            <div className='flex flex-row items-end gap-2' >
              <p className='text-foreground truncate text-3xl font-bold'>{balance}</p>
              <p className='text-foreground truncate text-lg font-semibold'>{walletCurrency}</p>
            </div>

            <p className='text-muted-foreground mt-1 text-xs'>
              {walletCurrency?.toUpperCase() ?? 'KES'} available across your accounts
            </p>
          </div>
        </div>

        <p className='text-muted-foreground mt-2 px-1 text-[11px]'>
          * Data may be delayed.
        </p>

        <div className='mt-3 grid grid-cols-3 gap-2'>
          <button
            type='button'
            className='border-border bg-background hover:border-primary/40 hover:bg-primary/10 flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition'
            onClick={onDeposit}
          >
            <Upload className='h-4 w-4 text-warning' />
            Deposit
          </button>
          <button
            type='button'
            className='border-border bg-background hover:border-primary/40 hover:bg-primary/10 flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition'
            onClick={onWithdraw}
          >
            <Download className='h-4 w-4 text-warning' />
            Withdraw
          </button>
          <button
            type='button'
            className='border-border bg-background hover:border-primary/40 hover:bg-primary/10 flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition'
            onClick={onTransfer}
          >
            <ArrowLeftRight className='h-4 w-4 text-warning' />
            Transfer
          </button>
        </div>

        <DropdownMenuSeparator className='my-3' />

        <DropdownMenuLabel className='px-2 text-[11px] uppercase tracking-wide'>
          Accounts
        </DropdownMenuLabel>

        <div className='mt-2 space-y-1'>
          {accounts.slice(0, 4).map(account => (
            <div
              key={account.id}
              className='flex items-center justify-between rounded-md px-2 py-2 text-sm transition hover:bg-muted/60'
            >
              <div className='min-w-0'>
                <p className='truncate font-medium text-foreground'>{account.label}</p>
                <p className='truncate text-[11px] text-muted-foreground'>
                  {account.bucket.replace(/_/g, ' ')}
                </p>
              </div>
              <div className='shrink-0 text-right'>
                <p className='font-medium text-foreground'>
                  {new Intl.NumberFormat('en-KE', {
                    maximumFractionDigits: 0,
                  }).format(account.balance_kes)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <DropdownMenuSeparator className='my-3' />

        <button
          type='button'
          className='hover:bg-muted/60 flex w-full items-center justify-between rounded-md px-2 py-2 text-sm transition'
          onClick={() => window.location.assign(walletHref)}
        >
          <span>Open wallet</span>
          <ExternalLink className='h-4 w-4' />
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DepositMethodSheet({
  open,
  onOpenChange,
  walletHref,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletHref: string;
}) {
  const router = useRouter();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-auto max-w-xl'>
        <SheetHeader>
          <SheetTitle>Choose payment method</SheetTitle>
          <SheetDescription>
            M-Pesa is the only available deposit option right now.
          </SheetDescription>
        </SheetHeader>

        <div className='mt-6 space-y-3 px-4'>
          <button
            type='button'
            className='border-border bg-card hover:border-primary/40 hover:bg-primary/10 flex w-full items-center justify-between rounded-2xl border p-4 text-left transition'
            onClick={() => {
              onOpenChange(false);
              router.push(walletHref);
            }}
          >
            <div>
              <p className='text-sm font-semibold text-foreground'>Pay with M-Pesa</p>
              <p className='text-muted-foreground mt-1 text-xs'>Continue to the wallet top-up tab.</p>
            </div>
            <Send className='text-primary h-4 w-4' />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CreateMenu({ actions, compact = false }: { actions: CreateAction[]; compact?: boolean }) {
  if (actions.length === 0) return null;

  // Single action, no need for a dropdown at all
  if (actions.length === 1) {
    const [only] = actions;
    return (
      <Button
        size='sm'
        className='h-9 gap-2 rounded-md px-4 font-semibold'
        onClick={only?.onSelect}
      >
        <only.icon className='h-4 w-4' />
        <span className={compact ? 'hidden sm:inline' : ''}>{only?.label}</span>
        {!compact && <ChevronDown className='h-4 w-4' />}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size='sm' className='h-9 gap-2 rounded-md px-3 font-semibold'>
          <Sparkles className='h-4 w-4' />
          <span className={compact ? 'hidden sm:inline' : ''}>Create</span>
          <ChevronDown className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64'>
        <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map(a => (
          <DropdownMenuItem
            key={a.label}
            onSelect={e => {
              e.preventDefault();
              a.onSelect();
            }}
            className='flex items-start gap-3 py-2'
          >
            <span className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary'>
              <a.icon className='h-4 w-4' />
            </span>
            <span className='flex flex-col'>
              <span className='text-sm leading-tight font-medium'>{a.label}</span>
              <span className='text-muted-foreground text-xs'>{a.description}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
