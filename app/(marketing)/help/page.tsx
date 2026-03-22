import type { Metadata } from 'next';
import { MarketingHelpPage } from '@/src/features/marketing/pages/MarketingHelpPage';
import { createPageMetadata } from '@/src/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Help and Support',
  description:
    'Get support for Elimika accounts, skills wallets, funding journeys, and course access from the Elimika help team.',
  path: '/help',
  keywords: ['Elimika help', 'support', 'skills wallet help', 'course support'],
});

export default function HelpPage() {
  return <MarketingHelpPage />;
}
