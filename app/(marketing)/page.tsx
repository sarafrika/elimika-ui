import type { Metadata } from 'next';
import { MarketingHomePage } from '@/src/features/marketing/pages/MarketingHomePage';
import { createPageMetadata } from '@/src/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Skills Wallet, Courses, and Learning Journeys',
  description:
    'Explore Elimika to discover courses, manage your skills wallet, and connect learners, instructors, and organisations in one learning platform.',
  path: '/',
  keywords: ['Elimika', 'skills wallet', 'online courses', 'learning platform', 'training'],
});

export default function Home() {
  return <MarketingHomePage />;
}
