import type { ReactNode } from 'react';
import { ProfileProviders } from '@/context/profile-providers';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <ProfileProviders>{children}</ProfileProviders>;
}
