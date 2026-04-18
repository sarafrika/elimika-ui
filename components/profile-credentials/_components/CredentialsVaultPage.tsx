'use client';

import { Tabs, TabsContent } from '@/components/ui/tabs';

import type { CredentialsRole, CredentialsTabId } from '../data';
import { getCredentialsContent } from '../data';
import { CredentialCertificateCard } from './CredentialCertificateCard';
import { CredentialsHeader } from './CredentialsHeader';
import { CredentialsTabs } from './CredentialsTabs';
import { GrowthTimelineSection } from './GrowthTimelineSection';
import { ProfileOverviewCard } from './ProfileOverviewCard';
import { VaultHighlights } from './VaultHighlights';

type CredentialsVaultPageProps = {
  role: CredentialsRole;
};

export function CredentialsVaultPage({ role }: CredentialsVaultPageProps) {
  const content = getCredentialsContent(role);

  return (
    <main className='min-h-screen bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_96%,var(--el-accent-azure)_4%),color-mix(in_srgb,var(--background)_94%,white_6%))] px-3 py-4 sm:px-5 lg:px-7'>
      <div className='mx-auto flex w-full max-w-[1520px] flex-col gap-4'>
        <CredentialsHeader
          title={content.pageTitle}
          description={content.pageDescription}
          searchPlaceholder={content.searchPlaceholder}
          addLabel={content.addLabel}
        />

        <Tabs defaultValue='badges' className='gap-4'>
          <CredentialsTabs tabs={content.tabs} />

          {content.tabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className='mt-0 space-y-4'>
              <CredentialsPanel
                profileName={content.profile.name}
                profile={content.profile}
                badges={content.summary.badges}
                blockchain={content.summary.blockchain}
                shares={content.summary.shares}
                items={content.credentialsByTab[tab.id as CredentialsTabId]}
                timeline={content.timeline}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </main>
  );
}

type CredentialsPanelProps = {
  profileName: string;
  profile: ReturnType<typeof getCredentialsContent>['profile'];
  badges: string;
  blockchain: string;
  shares: string;
  items: ReturnType<typeof getCredentialsContent>['credentialsByTab'][CredentialsTabId];
  timeline: ReturnType<typeof getCredentialsContent>['timeline'];
};

function CredentialsPanel({
  profileName,
  profile,
  badges,
  blockchain,
  shares,
  items,
  timeline,
}: CredentialsPanelProps) {
  return (
    <>
      <section className='grid gap-4 2xl:grid-cols-[320px_minmax(0,1fr)]'>
        <ProfileOverviewCard profile={profile} />

        <div className='space-y-4'>
          <VaultHighlights badges={badges} blockchain={blockchain} shares={shares} />
          <div className='grid gap-4 xl:grid-cols-2'>
            {items.map(item => (
              <CredentialCertificateCard
                key={item.id}
                item={item}
                ownerName={profileName}
              />
            ))}
          </div>
        </div>
      </section>

      <GrowthTimelineSection items={timeline} />
    </>
  );
}
