'use client';

import { ExternalLink, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from '@/components/data-display';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import {
  WALLET_SECTIONS,
  type WalletSectionKey,
} from '@/src/features/onboarding/lib/registration-steps';
import {
  type PersonWalletEntry,
  usePersonSkillsWallet,
  type WalletDetail,
} from '../hooks/use-person-skills-wallet';
import type { WalletModerationSection } from '../hooks/use-wallet-item-moderation';
import { SectionBoundary } from './section-boundary';
import { WalletItemModeration } from './wallet-item-moderation';

const MODERATION_SECTIONS: Partial<Record<WalletSectionKey, WalletModerationSection>> = {
  skills: 'skills',
  credentials: 'certifications',
  competencies: 'competencies',
};

const isWalletTab = (value: string): value is WalletSectionKey =>
  value === 'verification' || WALLET_SECTIONS.some(section => section.key === value);

export function SkillsWalletTab({
  userUuid,
  personName,
}: {
  userUuid: string;
  personName: string;
}) {
  if (!userUuid) return <EmptyState title='No applicant selected' />;
  return <ApplicantSkillsWallet key={userUuid} userUuid={userUuid} personName={personName} />;
}

function ApplicantSkillsWallet({ userUuid, personName }: { userUuid: string; personName: string }) {
  const [tab, setTab] = useState<WalletSectionKey>('skills');
  const queries = usePersonSkillsWallet(userUuid, tab);
  return (
    <Card>
      <CardHeader>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <CardTitle>Skills wallet</CardTitle>
          <span className='text-muted-foreground inline-flex items-center gap-1.5 text-xs'>
            <ShieldCheck className='size-3.5' aria-hidden /> Item review
          </span>
        </div>
      </CardHeader>
      <CardContent className='space-y-5'>
        <p className='text-muted-foreground text-sm leading-6'>
          Review {personName || 'this applicant'}&apos;s saved skills wallet information for their
          instructor or course creator application. Approve or reject individual skills, credentials
          and competencies after checking the evidence.
        </p>
        <Tabs
          value={tab}
          onValueChange={value => {
            if (isWalletTab(value)) setTab(value);
          }}
        >
          <TabsList
            aria-label='Skills wallet sections'
            className='flex h-auto w-full flex-wrap justify-start gap-1'
          >
            {WALLET_SECTIONS.map((section, index) => (
              <TabsTrigger key={section.key} value={section.key} className='gap-1.5 text-xs'>
                {section.label}
                {queries[index]?.data?.length ? (
                  <span className='bg-primary/15 text-primary rounded-full px-1.5 text-xs'>
                    {queries[index]?.data?.length}
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
            <TabsTrigger value='verification' className='text-xs'>
              Verification
            </TabsTrigger>
          </TabsList>
          {WALLET_SECTIONS.map((section, index) => {
            const query = queries[index];
            if (!query) return null;
            return (
              <TabsContent key={section.key} value={section.key} className='mt-5 space-y-4'>
                <p className='text-muted-foreground text-sm'>{section.summary}</p>
                <SectionBoundary
                  label={section.label.toLowerCase()}
                  loading={query.isPending && !query.data}
                  error={query.error}
                  onRetry={() => void query.refetch()}
                  skeleton={<Skeleton className='h-32 w-full' />}
                >
                  <WalletEntries
                    entries={query.data ?? []}
                    userUuid={userUuid}
                    personName={personName}
                    section={section.key}
                  />
                </SectionBoundary>
              </TabsContent>
            );
          })}
          <TabsContent value='verification' className='mt-5 space-y-5'>
            <p className='text-muted-foreground text-sm'>
              Verification status and supporting evidence for the applicant&apos;s skills,
              credentials and competencies.
            </p>
            {[0, 2, 3].map(index => {
              const query = queries[index];
              const section = WALLET_SECTIONS[index];
              if (!query || !section) return null;
              return (
                <section key={section.key} className='space-y-3' aria-label={section.label}>
                  <h3 className='text-foreground text-sm font-semibold'>{section.label}</h3>
                  <SectionBoundary
                    label={section.label.toLowerCase()}
                    loading={query.isPending && !query.data}
                    error={query.error}
                    onRetry={() => void query.refetch()}
                    skeleton={<Skeleton className='h-24 w-full' />}
                  >
                    <WalletEntries
                      entries={query.data ?? []}
                      userUuid={userUuid}
                      personName={personName}
                      section={section.key}
                    />
                  </SectionBoundary>
                </section>
              );
            })}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function WalletEntries({
  entries,
  userUuid,
  personName,
  section,
}: {
  entries: PersonWalletEntry[];
  userUuid: string;
  personName: string;
  section: WalletSectionKey;
}) {
  const moderationSection = MODERATION_SECTIONS[section];
  if (!entries.length)
    return <EmptyState variant='compact' title='Nothing uploaded in this section.' />;
  return (
    <div className='space-y-3'>
      {!moderationSection && (
        <p className='text-muted-foreground text-sm'>
          Review these records as supporting evidence when deciding on the overall application in
          Verification.
        </p>
      )}
      {entries.map((entry, index) => (
        <Card
          key={entry.uuid ?? `${entry.title}-${index}`}
          className='gap-0 rounded-md py-0 shadow-none'
        >
          <CardContent className='space-y-4 p-4'>
            <div className='flex flex-wrap items-start justify-between gap-2'>
              <h4 className='text-foreground min-w-0 text-sm font-semibold break-words'>
                {entry.title}
              </h4>
              {entry.status ? <StatusBadge status={entry.status} /> : null}
            </div>
            <dl className='grid gap-4 sm:grid-cols-2'>
              {entry.fields
                .filter(field => field.value?.trim())
                .map(field => (
                  <div key={field.label} className='min-w-0 space-y-1'>
                    <dt className='text-muted-foreground text-xs'>{field.label}</dt>
                    <dd className='text-foreground text-sm break-words whitespace-pre-wrap'>
                      <DetailValue field={field} />
                    </dd>
                  </div>
                ))}
            </dl>
            {moderationSection && (
              <WalletItemModeration
                key={`${entry.uuid}-${entry.status}-${entry.notes}`}
                userUuid={userUuid}
                personName={personName}
                section={moderationSection}
                entry={entry}
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DetailValue({ field }: { field: WalletDetail }) {
  if (field.link && field.value) {
    try {
      const url = new URL(field.value);
      if (url.protocol === 'https:' || url.protocol === 'http:') {
        const href = toAuthenticatedMediaUrl(url.toString());
        if (href)
          return (
            <a
              href={href}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary inline-flex max-w-full min-w-0 items-start gap-1 underline underline-offset-4'
            >
              <span className='min-w-0 break-all'>{field.value}</span>
              <ExternalLink className='mt-0.5 size-3.5 shrink-0' aria-hidden />
              <span className='sr-only'> (opens in a new tab)</span>
            </a>
          );
      }
    } catch {
      /* Evidence may be a written description instead of a link. */
    }
  }
  return field.value;
}
