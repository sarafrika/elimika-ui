'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUserProfile } from '@/context/profile-context';
import { UserDomain } from '@/lib/types';
import { GraduationCap, Users, BookOpen, Shield, ChevronDown } from 'lucide-react';

const domainConfig = {
  student: {
    icon: BookOpen,
    title: 'Student Dashboard',
    color: 'text-blue-600',
  },
  instructor: {
    icon: GraduationCap,
    title: 'Instructor Dashboard',
    color: 'text-emerald-600',
  },
  organisation_user: {
    icon: Users,
    title: 'Organization Dashboard',
    color: 'text-purple-600',
  },
  organisation: {
    icon: Users,
    title: 'Organization Dashboard',
    color: 'text-purple-600',
  },
  admin: {
    icon: Shield,
    title: 'Admin Dashboard',
    color: 'text-red-600',
  }
} as const;

interface DomainSwitcherProps {
  className?: string;
}

export function DomainSwitcher({ className }: DomainSwitcherProps) {
  const profile = useUserProfile();

  // Don't show if user has only one domain or is loading
  if (!profile || profile.isLoading || !profile.hasMultipleDomains || !profile.user_domain) {
    return null;
  }

  const activeDomain = profile.activeDomain;
  const availableDomains = profile.user_domain as UserDomain[];

  const currentDomainConfig = activeDomain ? domainConfig[activeDomain] : null;
  const CurrentIcon = currentDomainConfig?.icon || Users;

  const handleDomainSwitch = (domain: UserDomain) => {
    if (profile.setActiveDomain) {
      profile.setActiveDomain(domain);
      // Force a page reload to ensure all components refresh with the new domain
      window.location.reload();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`${className || ''} flex items-center gap-2`}>
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentDomainConfig?.title || 'Dashboard'}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {availableDomains.map((domain) => {
          const config = domainConfig[domain];
          if (!config) return null;
          
          const Icon = config.icon;
          const isActive = domain === activeDomain;

          return (
            <DropdownMenuItem
              key={domain}
              onClick={() => handleDomainSwitch(domain)}
              className={`flex items-center gap-2 cursor-pointer ${
                isActive ? 'bg-accent' : ''
              }`}
            >
              <Icon className={`h-4 w-4 ${config.color}`} />
              <span>{config.title}</span>
              {isActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-blue-600" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}