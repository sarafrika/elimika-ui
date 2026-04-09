import type { ReactNode } from 'react';
import { PublicSiteShell } from '@/src/components/layout/PublicSiteShell';

export function MarketingSiteShell({ children }: { children: ReactNode }) {
  return <PublicSiteShell>{children}</PublicSiteShell>;
}
