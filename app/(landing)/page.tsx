import { Employers } from '@/src/features/marketing/product-page/sections/Employers';
import { Features } from '@/src/features/marketing/product-page/sections/Features';
import { FinalCta } from '@/src/features/marketing/product-page/sections/FinalCta';
import { GrowthStages } from '@/src/features/marketing/product-page/sections/GrowthStages';
import { Hero } from '@/src/features/marketing/product-page/sections/Hero';
import { SkillsFund } from '@/src/features/marketing/product-page/sections/SkillsFund';
import { Stats } from '@/src/features/marketing/product-page/sections/Stats';
import { TalentMap } from '@/src/features/marketing/product-page/sections/TalentMap';
import { WhatIsIt } from '@/src/features/marketing/product-page/sections/WhatIsIt';
import { createPageMetadata } from '@/src/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = createPageMetadata({
  title: 'Elimika Skills Wallet — Your Skills. Your Future. Your Wallet.',
  description:
    'Store, showcase and share your skills securely with the Elimika Skills Wallet — a digital passport for education, training and work opportunities.',
  path: '/',
  keywords: [
    'Elimika',
    'skills wallet',
    'verified skills',
    'skills fund',
    'talent map',
    'online courses',
    'learning platform',
    'training',
  ],
});

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <WhatIsIt />
      <Features />
      <SkillsFund />
      <Employers />
      <GrowthStages />
      <TalentMap />
      <FinalCta />
    </>
  );
}
