'use client';

import { BadgeCheck, ChevronRight, Sparkles } from 'lucide-react';

import { AsyncSection } from '@/components/data/async-section';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { CredentailSummaryPanel } from './_components/CredentialSummaryPanel';
import { SkillOverviewCard } from './_components/SkillOverviewCard';
import { SkillsWalletHeader } from './_components/SkillsWalletHeader';
import { TopSkillsPanel } from './_components/TopSkillsPanel';
import type {
  SharedCredentialSummary,
  SharedMySkillsProfile,
  SharedOpportunity,
  SharedTimelineItem,
} from './types';
import type { VerifiedSkillsContent } from './verified-skills/types';

type SharedMySkillsPageProps = {
  profile: SharedMySkillsProfile;
  content: VerifiedSkillsContent;
  opportunities: SharedOpportunity[];
  isLoading?: boolean;
  shareUrl?: string;
};

export function SharedMySkillsPage({
  profile,
  content,
  opportunities: _opportunities,
  isLoading,
  shareUrl,
}: SharedMySkillsPageProps) {
  const { skills, summary, timeline } = content;

  const orderedTimeline = [...timeline].sort(
    (left, right) => (left.timestamp ?? 0) - (right.timestamp ?? 0)
  );
  const careerTimeline = buildCareerTimeline(content.credentialsContent.timeline);
  const displaySummary = hasSummaryData(summary)
    ? summary
    : {
      badgesEarned: skills.length,
      certificatesEarned: 0,
      shares: 0,
    };

  const sortedSkills = [...skills].sort((a, b) => b.score - a.score);
  const averageScore =
    sortedSkills.length > 0
      ? Math.round(
        sortedSkills.reduce((total, skill) => total + skill.score, 0) / sortedSkills.length
      )
      : 0;
  const levelLabel = getLevelLabel(averageScore);

  const loading = Boolean(isLoading);

  return (
    <main className='bg-background px-3 py-3 sm:px-4 lg:px-5 mb-20'>
      <div className='flex w-full flex-col gap-4'>
        {/* Non-data shell renders immediately; each region degrades locally. */}
        <SkillsWalletHeader
          profile={profile}
          shareUrl={shareUrl}
          levelLabel={levelLabel}
        />

        <AsyncSection loading={loading} skeleton={<SkillsOverviewSkeleton />}>
          <section className='grid items-start gap-3 xl:grid-cols-[minmax(230px,0.88fr)_minmax(300px,1.05fr)_minmax(280px,0.95fr)]'>
            <SkillOverviewCard
              profile={profile}
              skills={sortedSkills}
              averageScore={averageScore}
              levelLabel={levelLabel}
              shareUrl={shareUrl as string}
            />
            <TopSkillsPanel skills={sortedSkills} />
            <CredentailSummaryPanel summary={displaySummary} timeline={orderedTimeline} />
          </section>
        </AsyncSection>

        <AsyncSection loading={loading} skeleton={<TimelineSectionSkeleton />}>
          <GrowthTimeline items={orderedTimeline} />
        </AsyncSection>

        <AsyncSection loading={loading} skeleton={<TimelineSectionSkeleton />}>
          <CareerTimeline items={orderedTimeline} />
        </AsyncSection>
      </div>
    </main>
  );
}

function GrowthTimeline({ items }: { items: SharedTimelineItem[] }) {
  return (
    <section className='border-border/60 bg-card rounded-lg border p-3 shadow-sm sm:p-4'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
        <h2 className='text-foreground text-base font-semibold'>Growth Timeline</h2>
        <Button type='button' variant='ghost' size='sm' className='h-8 rounded-md text-xs'>
          View Full Timeline
          <ChevronRight className='size-3.5' />
        </Button>
      </div>

      {items.length > 0 ? (
        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
          {items.map(item => (
            <article
              key={item.id}
              className='border-border/60 bg-background rounded-md border p-3 transition-shadow hover:shadow-sm'
            >
              <div className='mb-3 flex items-start gap-3'>
                <span className='bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-md'>
                  {item.icon ?? <BadgeCheck className='size-5' />}
                </span>
                <div className='min-w-0 flex-1'>
                  <p className='text-foreground truncate text-sm font-semibold'>{item.title}</p>
                  <p className='text-muted-foreground truncate text-xs'>{item.provider}</p>
                </div>
                {item.metric ? (
                  <span className='bg-muted text-muted-foreground rounded-md px-2 py-1 text-[10px]'>
                    {item.metric}
                  </span>
                ) : null}
              </div>
              <p className='text-muted-foreground line-clamp-2 text-xs'>{item.description}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className='border-border/60 bg-background rounded-md border border-dashed px-6 py-10 text-center'>
          <Sparkles className='text-primary mx-auto mb-3 size-8' />
          <p className='text-foreground text-sm font-semibold'>No growth activity yet</p>
          <p className='text-muted-foreground mt-1 text-xs'>
            Verified skills and credentials will appear here as the wallet grows.
          </p>
        </div>
      )}
    </section>
  );
}

function CareerTimeline({ items }: { items: SharedTimelineItem[] }) {
  return (
    <section className='border-border/60 bg-card rounded-lg border p-3 shadow-sm sm:p-4'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='text-foreground text-base font-semibold sm:text-base'>Career Timeline</h2>
          <p className='text-muted-foreground text-xs sm:text-sm'>
            Verified education, membership, and experience records from your profile.
          </p>
        </div>
        <Button type='button' variant='ghost' size='sm' className='h-8 rounded-md text-xs'>
          View Career Pathways
          <ChevronRight className='size-3.5' />
        </Button>
      </div>

      {items.length > 0 ? (
        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
          {items.map(item => (
            <article
              key={item.id}
              className='border-border/60 bg-background rounded-md border p-3 transition-shadow hover:shadow-sm'
            >
              <div className='mb-3 flex items-start gap-3'>
                <span className='bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-md'>
                  {item.icon ?? <BadgeCheck className='size-5' />}
                </span>
                <div className='min-w-0 flex-1'>
                  <p className='text-foreground truncate text-sm font-semibold'>{item.title}</p>
                  <p className='text-muted-foreground truncate text-xs'>{item.provider}</p>
                </div>
                {item.metric ? (
                  <span className='bg-muted text-muted-foreground rounded-md px-2 py-1 text-[10px]'>
                    {item.metric}
                  </span>
                ) : null}
              </div>
              <p className='text-muted-foreground line-clamp-2 text-xs'>{item.description}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className='border-border/60 bg-background rounded-md border border-dashed px-6 py-10 text-center'>
          <Sparkles className='text-primary mx-auto mb-3 size-8' />
          <p className='text-foreground text-sm font-semibold'>No career records yet</p>
          <p className='text-muted-foreground mt-1 text-xs'>
            Verified instructor and course creator documents will appear here once they are uploaded and approved.
          </p>
        </div>
      )}
    </section>
  );
}

function getLevelLabel(score: number) {
  if (score >= 75) return 'Level 4 Advanced';
  if (score >= 50) return 'Level 3 Skilled';
  if (score >= 25) return 'Level 2 Developing';
  return 'Level 1 Prep';
}

function buildCareerTimeline(items: SharedTimelineItem[]) {
  return items
    .filter(item => item.recordKind === 'experience' || item.recordKind === 'education' || item.recordKind === 'membership')
    .slice()
    .sort((left, right) => (left.timestamp ?? 0) - (right.timestamp ?? 0))
    .slice(0, 6);
}

function hasSummaryData(summary: SharedCredentialSummary) {
  return summary.badgesEarned > 0 || summary.certificatesEarned > 0 || summary.shares > 0;
}

function SkillsOverviewSkeleton() {
  return (
    <section className='grid items-start gap-3 xl:grid-cols-[minmax(230px,0.88fr)_minmax(300px,1.05fr)_minmax(280px,0.95fr)]'>
      <Skeleton className='h-72 rounded-lg' />
      <Skeleton className='h-72 rounded-lg' />
      <Skeleton className='h-72 rounded-lg' />
    </section>
  );
}

function TimelineSectionSkeleton() {
  return (
    <section className='border-border/60 bg-card rounded-lg border p-3 shadow-sm sm:p-4'>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <Skeleton className='h-5 w-40 rounded-md' />
        <Skeleton className='h-8 w-32 rounded-md' />
      </div>
      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className='h-24 rounded-md' />
        ))}
      </div>
    </section>
  );
}
