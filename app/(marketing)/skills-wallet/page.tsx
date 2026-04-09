import type { Metadata } from 'next';
import { MarketingSkillsWalletPage } from '@/src/features/marketing/pages/MarketingSkillsWalletPage';
import { createPageMetadata } from '@/src/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Skills Wallet',
  description:
    'Learn how Elimika Skills Wallet helps students, professionals, employers, and institutions store verified skills and unlock funding opportunities.',
  path: '/skills-wallet',
  keywords: ['skills wallet', 'verified skills', 'learning credits', 'student funding'],
});

export default function SkillsWalletPage() {
  return <MarketingSkillsWalletPage />;
}
