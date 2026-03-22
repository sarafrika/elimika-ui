import type { ReactNode } from 'react';
import { ProfileProviders } from '@/context/profile-providers';

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <ProfileProviders>{children}</ProfileProviders>;
}
