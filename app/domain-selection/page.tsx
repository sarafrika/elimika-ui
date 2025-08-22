'use client';

import { DomainSelection } from '@/components/domain-selection';
import { useUserProfile } from '@/context/profile-context';
import { UserDomain } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DomainSelectionPageProps {
  searchParams: { redirectTo?: string };
}

export default function DomainSelectionPage({ searchParams }: DomainSelectionPageProps) {
  const profile = useUserProfile();
  const router = useRouter();
  const redirectTo = searchParams.redirectTo || '/dashboard/overview';
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile && !profile.isLoading) {
      // If user has no domains or only one domain, redirect appropriately
      if (!profile.user_domain || profile.user_domain.length === 0) {
        router.replace('/onboarding');
        return;
      }
      
      if (profile.user_domain.length === 1) {
        // Single domain, no need for selection
        profile.setActiveDomain?.(profile.user_domain[0] as UserDomain);
        router.replace(redirectTo);
        return;
      }
      
      setIsLoading(false);
    }
  }, [profile, router, redirectTo]);

  const handleDomainSelect = (domain: UserDomain) => {
    if (profile?.setActiveDomain) {
      profile.setActiveDomain(domain);
      router.replace(redirectTo);
    }
  };

  if (isLoading || profile?.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!profile || !profile.user_domain || profile.user_domain.length <= 1) {
    return null; // Will redirect in useEffect
  }

  return (
    <DomainSelection
      domains={profile.user_domain as UserDomain[]}
      onDomainSelect={handleDomainSelect}
      userName={profile.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : undefined}
    />
  );
}