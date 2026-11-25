import { Suspense, type ReactNode } from 'react';
import { ReturnToApplication } from '@/src/features/onboarding/components/ReturnToApplication';
import { ProfileProviders } from '@/context/profile-providers';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <ProfileProviders>
      <Suspense fallback={null}>
        <ReturnToApplication />
      </Suspense>
      {children}
    </ProfileProviders>
  );
}
