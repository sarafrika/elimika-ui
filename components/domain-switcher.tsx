'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUserProfile } from '@/context/profile-context';
import { UserDomain } from '@/lib/types';
import {
  GraduationCap,
  Users,
  BookOpen,
  Shield,
  ChevronDown,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const domainConfig = {
  student: {
    icon: BookOpen,
    title: 'Student Dashboard',
    color: 'text-primary',
  },
  instructor: {
    icon: GraduationCap,
    title: 'Instructor Dashboard',
    color: 'text-success',
  },
  course_creator: {
    icon: Sparkles,
    title: 'Course Creator Dashboard',
    color: 'text-primary',
  },
  organisation_user: {
    icon: Users,
    title: 'Organization Dashboard',
    color: 'text-primary',
  },
  organisation: {
    icon: Users,
    title: 'Organization Dashboard',
    color: 'text-primary',
  },
  admin: {
    icon: Shield,
    title: 'Admin Dashboard',
    color: 'text-destructive',
  },
} as const;

interface DomainSwitcherProps {
  className?: string;
}

export function DomainSwitcher({ className }: DomainSwitcherProps) {
  const profile = useUserProfile();
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);

  // Don't show if user has only one domain or is loading
  if (!profile || profile.isLoading || !profile.hasMultipleDomains || !profile.user_domain) {
    return null;
  }

  const activeDomain = profile.activeDomain;
  const availableDomains = profile.user_domain as UserDomain[];

  const currentDomainConfig = activeDomain ? domainConfig[activeDomain] : null;
  const CurrentIcon = currentDomainConfig?.icon || Users;

  const handleDomainSwitch = async (domain: UserDomain) => {
    if (domain === activeDomain) return; // Already on this domain

    setIsSwitching(true);
    toast.loading('Switching dashboard...', { id: 'domain-switch' });

    try {
      if (profile.setActiveDomain) {
        profile.setActiveDomain(domain);

        // Small delay to allow context to update
        await new Promise(resolve => setTimeout(resolve, 300));

        // Navigate to overview page of new domain
        router.push('/dashboard/overview');
        router.refresh(); // Force a refresh to load new domain data

        toast.success(`Switched to ${domainConfig[domain].title}`, { id: 'domain-switch' });
      }
    } catch (error) {
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
          const config = domainConfig[domain];
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
              {isActive && <div className='ml-auto h-2 w-2 rounded-full bg-primary' />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
