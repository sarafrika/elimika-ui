'use client';

import { useState } from 'react';
import {
  BadgeCheck,
  Briefcase,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Trophy,
  Target,
} from 'lucide-react';

import { SkillsWalletAchievementsTab } from './_components/SkillsWalletAchievementsTab';
import { SkillsWalletCompetenciesTab } from './_components/SkillsWalletCompetenciesTab';
import { SkillsWalletCredentialsVaultTab } from './_components/SkillsWalletCredentialsVaultTab';
import { SkillsWalletExperienceTab } from './_components/SkillsWalletExperienceTab';
import { SkillsWalletMySkillsTab } from './_components/SkillsWalletMySkillsTab';
import { SkillsWalletOverviewTab } from './_components/SkillsWalletOverviewTab';
import { SkillsWalletPortfolioTab } from './_components/SkillsWalletPortfolioTab';
import { SkillsWalletTabs } from './_components/SkillsWalletTabs';
import { SkillsWalletVerficationTab } from './_components/SkillsWalletVerficationTab';
import { useStudentSkillsWalletData } from './_components/useStudentSkillsWalletData';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'skills', label: 'My Skills', icon: Sparkles },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'credentials', label: 'Credentials Vault', icon: ShieldCheck },
  { id: 'competencies', label: 'Competencies', icon: Target },
  { id: 'experience', label: 'Experience', icon: GraduationCap },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
  { id: 'verification', label: 'Verification', icon: BadgeCheck },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function SkillsWallet() {
  const [tab, setTab] = useState<TabId>('overview');
  const data = useStudentSkillsWalletData();

  return (
    <div className='min-h-screen'>
      <div className='border-b'>
        <div className='mx-auto px-4 py-5'>
          <h1 className='text-foreground text-2xl font-bold'>Skills Wallet</h1>
          <p className='text-muted-foreground text-sm'>
            Your verified record of skills, competencies, achievements and credentials.
          </p>
          <SkillsWalletTabs tabs={TABS} activeTab={tab} onTabChange={value => setTab(value as TabId)} />
        </div>
      </div>

      <div className='mx-auto px-4 py-6'>
        {tab === 'overview' ? (
          <SkillsWalletOverviewTab data={data} onNavigateToTab={value => setTab(value as TabId)} />
        ) : null}
        {tab === 'skills' ? <SkillsWalletMySkillsTab data={data} /> : null}
        {tab === 'portfolio' ? <SkillsWalletPortfolioTab data={data} /> : null}
        {tab === 'credentials' ? <SkillsWalletCredentialsVaultTab data={data} /> : null}
        {tab === 'competencies' ? <SkillsWalletCompetenciesTab data={data} /> : null}
        {tab === 'experience' ? <SkillsWalletExperienceTab /> : null}
        {tab === 'achievements' ? <SkillsWalletAchievementsTab /> : null}
        {tab === 'verification' ? <SkillsWalletVerficationTab /> : null}
      </div>
    </div>
  );
}
