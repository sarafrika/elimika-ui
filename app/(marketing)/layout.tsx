import type { ReactNode } from 'react';
import { MarketingSiteShell } from '@/src/features/marketing/shells/MarketingSiteShell';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <MarketingSiteShell>{children}</MarketingSiteShell>;
}
