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
import { SectionTabPanel, SectionTabs, surfaceTheme } from '@/components/data-display';
import { useStudent } from '@/context/student-context';
import { cn } from '@/lib/utils';
import { LearnerSkillGoalsCard } from '@/src/features/skills/learner-skill-goals-card';

import { SkillsWalletAchievementsTab } from './_components/SkillsWalletAchievementsTab';
import { SkillsWalletCompetenciesTab } from './_components/SkillsWalletCompetenciesTab';
import { SkillsWalletCredentialsVaultTab } from './_components/SkillsWalletCredentialsVaultTab';
import { SkillsWalletExperienceTab } from './_components/SkillsWalletExperienceTab';
import { SkillsWalletMySkillsTab } from './_components/SkillsWalletMySkillsTab';
import { SkillsWalletOverviewTab } from './_components/SkillsWalletOverviewTab';
import { SkillsWalletPortfolioTab } from './_components/SkillsWalletPortfolioTab';
import { WalletIdCard } from './_components/SkillsWalletShared';
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

const TAB_IDS: readonly TabId[] = TABS.map(item => item.id);

export default function SkillsWallet() {
  const { value: tab, setValue: setTab, hrefFor } = useWalletTab(TAB_IDS, 'overview');
  const data = useStudentSkillsWalletData();
  const student = useStudent();

  return (
    <div className='min-h-screen'>
      <div className='border-b'>
        <div className={cn(surfaceTheme.pageWide, 'py-5')}>
          <div className='flex flex-row items-center justify-between'>
            <div>
              <h1 className='text-foreground text-2xl font-bold'>Skills Wallet</h1>
              <p className='text-muted-foreground text-sm'>
                Your verified record of skills, competencies, achievements and credentials.
              </p>
            </div>
            <WalletIdCard />
          </div>
        </div>
      </div>

      <div className={cn(surfaceTheme.pageWide, 'py-6')}>
        <SectionTabs
          tabs={TABS}
          value={tab}
          onValueChange={setTab}
          hrefFor={hrefFor}
          label='Wallet sections'
          variant='pill'
          sticky
        >
          <SectionTabPanel value='overview' className='print:block'>
            {tab === 'overview' ? (
              <SkillsWalletOverviewTab
                data={data}
                isLoading={data.isLoading}
                onNavigateToTab={value => setTab(value as TabId)}
              />
            ) : null}
          </SectionTabPanel>
          <SectionTabPanel value='skills' className='print:block'>
            {tab === 'skills' ? (
              <div className='space-y-6'>
                <LearnerSkillGoalsCard studentUuid={student?.uuid} />
                <SkillsWalletMySkillsTab data={data} />
              </div>
            ) : null}
          </SectionTabPanel>
          <SectionTabPanel value='portfolio' className='print:block'>
            {tab === 'portfolio' ? <SkillsWalletPortfolioTab data={data} /> : null}
          </SectionTabPanel>
          <SectionTabPanel value='credentials' className='print:block'>
            {tab === 'credentials' ? <SkillsWalletCredentialsVaultTab data={data} /> : null}
          </SectionTabPanel>
          <SectionTabPanel value='competencies' className='print:block'>
            {tab === 'competencies' ? <SkillsWalletCompetenciesTab data={data} /> : null}
          </SectionTabPanel>
          <SectionTabPanel value='experience' className='print:block'>
            {tab === 'experience' ? (
              <SkillsWalletExperienceTab experiences={data.experiences} />
            ) : null}
          </SectionTabPanel>
          <SectionTabPanel value='achievements' className='print:block'>
            {tab === 'achievements' ? (
              <SkillsWalletAchievementsTab achievements={data.achievements} />
            ) : null}
          </SectionTabPanel>
          <SectionTabPanel value='verification' className='print:block'>
            {tab === 'verification' ? (
              <SkillsWalletVerficationTab events={data.verificationEvents} />
            ) : null}
          </SectionTabPanel>
        </SectionTabs>
      </div>
    </div>
  );
}
