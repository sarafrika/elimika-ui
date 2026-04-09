import type { ReactNode } from 'react';
import { PublicSiteShell } from '@/src/components/layout/PublicSiteShell';

export default function CatalogueLayout({ children }: { children: ReactNode }) {
  return <PublicSiteShell>{children}</PublicSiteShell>;
}
