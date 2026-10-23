'use client';

import { AddAchievementDialog } from '@/app/dashboard/_components/skills-wallet/AddAchievementDialog';
import { SkillsWalletEducationTab } from '@/app/dashboard/_components/skills-wallet/SkillsWalletEducationTab';
import { canAddWalletAchievement } from '@/app/dashboard/_components/skills-wallet/achievement-access';
import { useWalletTab } from '@/app/dashboard/_components/skills-wallet/use-wallet-tab';
import { SectionTabPanel, SectionTabs, surfaceTheme } from '@/components/data-display';
import { useUserProfile } from '@/context/profile-context';
import { useStudent } from '@/context/student-context';
import { LearnerSkillGoalsCard } from '@/src/features/skills/learner-skill-goals-card';
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
import { useState } from 'react';

import { PageHeader } from '../../../../components/page-header';
import { SkillsWalletAchievementsTab } from './_components/SkillsWalletAchievementsTab';
import { SkillsWalletCompetenciesTab } from './_components/SkillsWalletCompetenciesTab';
import { SkillsWalletCredentialsVaultTab } from './_components/SkillsWalletCredentialsVaultTab';
import { SkillsWalletExperienceTab } from './_components/SkillsWalletExperienceTab';
import { SkillsWalletMySkillsTab } from './_components/SkillsWalletMySkillsTab';
import { SkillsWalletOverviewTab } from './_components/SkillsWalletOverviewTab';
import { SkillsWalletPortfolioTab } from './_components/SkillsWalletPortfolioTab';
import { WalletIdCard, type AchievementRecord } from './_components/SkillsWalletShared';
import { SkillsWalletVerficationTab } from './_components/SkillsWalletVerficationTab';
import { useStudentSkillsWalletData } from './_components/useStudentSkillsWalletData';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'skills', label: 'My Skills', icon: Sparkles },
  { id: 'education', label: 'Education', icon: GraduationCap },
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
  const data = useStudentSkillsWalletData(tab === 'overview' || tab === 'achievements');
  const student = useStudent();
  const profile = useUserProfile();
  const canAddAchievement = canAddWalletAchievement(profile, 'student');
  const [achievementOpen, setAchievementOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<AchievementRecord | null>(null);

  return (
    <div className={`${surfaceTheme.pageWide} py-4`}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='SKILLS WALLET'
          title='Skills Wallet'
          description='Your verified record of skills, competencies, achievements and credentials.'
          actions={
            <div className='flex flex-wrap gap-2'>
              <WalletIdCard />
            </div>
          }
        />

        <div className='min-w-0'>
          <SectionTabs
            tabs={TABS}
            value={tab}
            onValueChange={setTab}
            hrefFor={hrefFor}
            label='Wallet sections'
            variant='training-hub'
            scrollButtons
            sticky
          >
            <SectionTabPanel value='overview'>
              {tab === 'overview' ? (
                <SkillsWalletOverviewTab
                  data={data}
                  isLoading={data.isLoading}
                  achievementsFailed={data.achievementsQuery.isError}
                  onRetryAchievements={() => void data.achievementsQuery.refetch()}
                  onNavigateToTab={value => setTab(value as TabId)}
                />
              ) : null}
            </SectionTabPanel>
            <SectionTabPanel value='skills'>
              {tab === 'skills' ? (
                <div className='space-y-6'>
                  <LearnerSkillGoalsCard studentUuid={student?.uuid} />
                  <SkillsWalletMySkillsTab data={data} />
                </div>
              ) : null}
            </SectionTabPanel>
            <SectionTabPanel value='education'>
              {tab === 'education' ? <SkillsWalletEducationTab /> : null}
            </SectionTabPanel>
            <SectionTabPanel value='portfolio'>
              {tab === 'portfolio' ? <SkillsWalletPortfolioTab /> : null}
            </SectionTabPanel>
            <SectionTabPanel value='credentials'>
              {tab === 'credentials' ? <SkillsWalletCredentialsVaultTab data={data} /> : null}
            </SectionTabPanel>
            <SectionTabPanel value='competencies'>
              {tab === 'competencies' ? <SkillsWalletCompetenciesTab data={data} /> : null}
            </SectionTabPanel>
            <SectionTabPanel value='experience'>
              {tab === 'experience' ? (
                <SkillsWalletExperienceTab experiences={data.experiences} />
              ) : null}
            </SectionTabPanel>
            <SectionTabPanel value='achievements'>
              {tab === 'achievements' ? (
                <SkillsWalletAchievementsTab
                  canAddAchievement={canAddAchievement}
                  onAddAchievement={() => {
                    setEditingAchievement(null);
                    setAchievementOpen(true);
                  }}
                  onEditAchievement={achievement => {
                    setEditingAchievement(achievement);
                    setAchievementOpen(true);
                  }}
                  achievements={data.achievements}
                  isLoading={data.achievementsQuery.isLoading}
                  failed={data.achievementsQuery.isError}
                  onRetry={() => void data.achievementsQuery.refetch()}
                />
              ) : null}
            </SectionTabPanel>
            <SectionTabPanel value='verification'>
              {tab === 'verification' ? (
                <SkillsWalletVerficationTab events={data.verificationEvents} />
              ) : null}
            </SectionTabPanel>
          </SectionTabs>
        </div>
      </div>

      {achievementOpen && canAddAchievement && (
        <AddAchievementDialog
          open={achievementOpen}
          onOpenChange={setAchievementOpen}
          canAddAchievement={canAddAchievement}
          achievement={editingAchievement}
        />
      )}
    </div>
  );
}
