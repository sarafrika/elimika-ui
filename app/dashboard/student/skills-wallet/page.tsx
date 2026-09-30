'use client';

import {
  BadgeCheck,
  Briefcase,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { useWalletTab } from '@/app/dashboard/_components/skills-wallet/use-wallet-tab';
import { useStudent } from '@/context/student-context';
import { LearnerSkillGoalsCard } from '@/src/features/skills/learner-skill-goals-card';

import { SkillsWalletAchievementsTab } from './_components/SkillsWalletAchievementsTab';
import { SkillsWalletCompetenciesTab } from './_components/SkillsWalletCompetenciesTab';
import { SkillsWalletCredentialsVaultTab } from './_components/SkillsWalletCredentialsVaultTab';
import { SkillsWalletExperienceTab } from './_components/SkillsWalletExperienceTab';
import { SkillsWalletMySkillsTab } from './_components/SkillsWalletMySkillsTab';
import { SkillsWalletOverviewTab } from './_components/SkillsWalletOverviewTab';
import { SkillsWalletPortfolioTab } from './_components/SkillsWalletPortfolioTab';
import { WalletIdCard } from './_components/SkillsWalletShared';
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
  const [tab, setTab] = useWalletTab(TABS);
  const data = useStudentSkillsWalletData();
  const student = useStudent();

  return (
    <div className='min-h-screen'>
      <div className='border-b'>
        <div className='mx-auto px-4 py-5'>
          <div className='flex flex-row items-center justify-between'>
            <div>
              <h1 className='text-foreground text-2xl font-bold'>Skills Wallet</h1>
              <p className='text-muted-foreground text-sm'>
                Your verified record of skills, competencies, achievements and credentials.
              </p>
            </div>
            <WalletIdCard />
          </div>

          <SkillsWalletTabs
            tabs={TABS}
            activeTab={tab}
            onTabChange={value => setTab(value as TabId)}
          />
        </div>
      </div>

      <div className='mx-auto px-4 py-6'>
        {tab === 'overview' ? (
          <SkillsWalletOverviewTab
            data={data}
            isLoading={data.isLoading}
            onNavigateToTab={value => setTab(value as TabId)}
          />
        ) : null}
        {tab === 'skills' ? (
          <div className='space-y-6'>
            <LearnerSkillGoalsCard studentUuid={student?.uuid} />
            <SkillsWalletMySkillsTab data={data} />
          </div>
        ) : null}
        {tab === 'portfolio' ? <SkillsWalletPortfolioTab data={data} /> : null}
        {tab === 'credentials' ? <SkillsWalletCredentialsVaultTab data={data} /> : null}
        {tab === 'competencies' ? <SkillsWalletCompetenciesTab data={data} /> : null}
        {tab === 'experience' ? <SkillsWalletExperienceTab experiences={data.experiences} /> : null}
        {tab === 'achievements' ? (
          <SkillsWalletAchievementsTab achievements={data.achievements} />
        ) : null}
        {tab === 'verification' ? (
          <SkillsWalletVerficationTab events={data.verificationEvents} />
        ) : null}
      </div>
    </div>
  );
}
