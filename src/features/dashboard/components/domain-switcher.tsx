'use client';

import { ChevronDown, Loader2, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { UserDomain } from '@/lib/types';
import { dashboardDomainDisplayConfig } from '@/src/features/dashboard/config/domain-display';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { buildDashboardSwitchPath } from '@/src/features/dashboard/lib/active-domain-storage';

interface DomainSwitcherProps {
  className?: string;
}

export function DomainSwitcher({ className }: DomainSwitcherProps) {
  const userDomain = useUserDomain();
  const router = useRouter();
  const pathname = usePathname();
  const [isSwitching, setIsSwitching] = useState(false);

  // Don't show if user has only one domain or is loading
  if (userDomain.isLoading || !userDomain.hasMultipleDomains || !userDomain.activeDomain) {
    return null;
  }

  const activeDomain = userDomain.activeDomain;
  const availableDomains = userDomain.domains as UserDomain[];

  const currentDomainConfig = activeDomain ? dashboardDomainDisplayConfig[activeDomain] : null;
  const CurrentIcon = currentDomainConfig?.icon || Users;

  const handleDomainSwitch = async (nextDomain: UserDomain) => {
    if (nextDomain === activeDomain) return; // Already on this domain

    setIsSwitching(true);
    toast.loading('Switching dashboard...', { id: 'domain-switch' });

    try {
      userDomain.setActiveDomain(nextDomain);
      router.push(buildDashboardSwitchPath(nextDomain, pathname || '/dashboard/overview'));

      toast.success(`Switched to ${dashboardDomainDisplayConfig[nextDomain].title}`, {
        id: 'domain-switch',
      });
    } catch (_error) {
      toast.error('Failed to switch dashboard', { id: 'domain-switch' });
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          className={`${className || ''} flex items-center gap-2`}
          disabled={isSwitching}
        >
          {isSwitching ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <CurrentIcon className='h-4 w-4' />
          )}
          <span className='hidden sm:inline'>
            {isSwitching ? 'Switching...' : currentDomainConfig?.title || 'Dashboard'}
          </span>
          <ChevronDown className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        {availableDomains.map(domain => {
          const config = dashboardDomainDisplayConfig[domain];
          if (!config) return null;

          const Icon = config.icon;
          const isActive = domain === activeDomain;

          return (
            <DropdownMenuItem
              key={domain}
              onClick={() => handleDomainSwitch(domain)}
              disabled={isSwitching || isActive}
              className={`flex cursor-pointer items-center gap-2 ${isActive ? 'bg-accent' : ''}`}
            >
              <Icon className={`h-4 w-4 ${config.color}`} />
              <span>{config.title}</span>
              {isActive && <div className='bg-primary ml-auto h-2 w-2 rounded-full' />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
