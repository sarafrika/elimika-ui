'use client';

import {
  Award,
  BadgeCheck,
  BookOpenCheck,
  ChevronRight,
  GraduationCap,
  Medal,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { CredentialSummaryPanel } from './_components/CredentialSummaryPanel';
import { SkillOverviewCard } from './_components/SkillOverviewCard';
import { SkillsWalletHeader } from './_components/SkillsWalletHeader';
import { TopSkillsPanel } from './_components/TopSkillsPanel';
import type {
  SharedCredentialSummary,
  SharedMySkillsProfile,
  SharedOpportunity,
  SharedSkill,
  SharedTimelineItem,
} from './types';

type SharedMySkillsPageProps = {
  profile: SharedMySkillsProfile;
  skills: SharedSkill[];
  summary: SharedCredentialSummary;
  timeline: SharedTimelineItem[];
  opportunities: SharedOpportunity[];
  isLoading?: boolean;
  actionLabel: string;
  onAction?: () => void;
  qrTargetUrl?: string;
};

export function SharedMySkillsPage({
  profile,
  skills,
  summary,
  timeline,
  opportunities,
  isLoading,
  actionLabel,
  onAction,
  qrTargetUrl,
}: SharedMySkillsPageProps) {
  const displaySkills = skills.length > 0 ? skills : mockSkills;
  const displayTimeline = timeline.length > 0 ? timeline : mockTimeline;
  const displayOpportunities = opportunities.length > 0 ? opportunities : mockOpportunities;
  const displaySummary = hasSummaryData(summary)
    ? summary
    : {
        badgesEarned: displaySkills.length,
        certificatesEarned: Math.max(3, Math.round(displaySkills.length * 0.7)),
        shares: 8,
      };

  const sortedSkills = [...displaySkills].sort((a, b) => b.score - a.score);
  const averageScore =
    sortedSkills.length > 0
      ? Math.round(
          sortedSkills.reduce((total, skill) => total + skill.score, 0) / sortedSkills.length
        )
      : 0;
  const levelLabel = getLevelLabel(averageScore);
  const bottomTimeline =
    displayTimeline.length > 0
      ? displayTimeline
      : displayOpportunities.slice(0, 3).map(opportunity => ({
          id: opportunity.id,
          title: opportunity.title,
          provider: opportunity.provider,
          description: `${opportunity.match}% match - ${opportunity.mode}`,
          metric: opportunity.status,
        }));

  if (isLoading) {
    return <SharedMySkillsSkeleton />;
  }

  return (
    <main className='bg-background min-h-screen px-3 py-3 sm:px-4 lg:px-5'>
      <div className='mx-auto flex w-full max-w-[1180px] flex-col gap-4'>
        <SkillsWalletHeader
          profile={profile}
          primaryActionLabel={actionLabel}
          onPrimaryAction={onAction}
          qrTargetUrl={qrTargetUrl}
          levelLabel={levelLabel}
        />

        <section className='grid items-start gap-3 xl:grid-cols-[minmax(230px,0.88fr)_minmax(300px,1.05fr)_minmax(280px,0.95fr)]'>
          <SkillOverviewCard
            profile={profile}
            skills={sortedSkills}
            averageScore={averageScore}
            levelLabel={levelLabel}
          />
          <TopSkillsPanel skills={sortedSkills} />
          <CredentialSummaryPanel summary={displaySummary} timeline={displayTimeline} />
        </section>

        <FullWidthGrowthTimeline items={bottomTimeline} />
      </div>
    </main>
  );
}

function FullWidthGrowthTimeline({ items }: { items: SharedTimelineItem[] }) {
  return (
    <section className='border-border/60 bg-card rounded-lg border p-3 shadow-sm sm:p-4'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
        <h2 className='text-foreground text-base font-semibold sm:text-lg'>Growth Timeline</h2>
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

function getLevelLabel(score: number) {
  if (score >= 75) return 'Level 4 Advanced';
  if (score >= 50) return 'Level 3 Skilled';
  if (score >= 25) return 'Level 2 Developing';
  return 'Level 1 Prep';
}

function hasSummaryData(summary: SharedCredentialSummary) {
  return summary.badgesEarned > 0 || summary.certificatesEarned > 0 || summary.shares > 0;
}

const mockSkills: SharedSkill[] = [
  {
    id: 'mock-data-analysis',
    name: 'Data Analysis',
    level: 'Advanced',
    score: 92,
    category: 'Analytics',
    verified: true,
    version: 'v4.2',
  },
  {
    id: 'mock-python',
    name: 'Python Programming',
    level: 'Advanced',
    score: 88,
    category: 'Software',
    verified: true,
    version: 'v4.0',
  },
  {
    id: 'mock-web-design',
    name: 'Web Design',
    level: 'Intermediate',
    score: 76,
    category: 'Design',
    verified: true,
    version: 'v3.4',
  },
  {
    id: 'mock-marketing',
    name: 'Digital Marketing',
    level: 'Intermediate',
    score: 71,
    category: 'Marketing',
    verified: true,
    version: 'v3.1',
  },
  {
    id: 'mock-sql',
    name: 'SQL',
    level: 'Beginner',
    score: 64,
    category: 'Database',
    verified: true,
    version: 'v2.8',
  },
];

const mockTimeline: SharedTimelineItem[] = [
  {
    id: 'mock-google-certificate',
    title: 'Google Data Analytics',
    provider: 'Google',
    description: 'Completed a verified analytics credential and added it to the skills wallet.',
    metric: '92%',
    icon: <Award className='size-4' />,
  },
  {
    id: 'mock-meta-certificate',
    title: 'Meta Digital Marketing',
    provider: 'Meta',
    description: 'Earned a marketing credential covering campaign strategy and reporting.',
    metric: '88%',
    icon: <Medal className='size-4' />,
  },
  {
    id: 'mock-coursera-certificate',
    title: 'UI / UX Design Certificate',
    provider: 'Coursera',
    description: 'Verified design training was added to the learner growth timeline.',
    metric: '75%',
    icon: <GraduationCap className='size-4' />,
  },
  {
    id: 'mock-sql-course',
    title: 'SQL for Data Workflows',
    provider: 'Elimika',
    description: 'Skill evidence was updated after completing a practical database module.',
    metric: '64%',
    icon: <BookOpenCheck className='size-4' />,
  },
];

const mockOpportunities: SharedOpportunity[] = [
  {
    id: 'mock-junior-web-dev',
    title: 'Junior Web Developer',
    provider: 'BrightWave Marketing',
    mode: 'Hybrid',
    match: 82,
    status: 'Apply',
  },
  {
    id: 'mock-graphic-design',
    title: 'Earned Graphic Design Basics',
    provider: 'In-Office',
    mode: 'Nairobi',
    match: 89,
    status: 'Pending',
  },
  {
    id: 'mock-ux-certificate',
    title: 'UI / UX Design Certificate',
    provider: 'Internship',
    mode: 'Remote',
    match: 75,
    status: 'Matched',
  },
  {
    id: 'mock-analytics-intern',
    title: 'Data Analytics Intern',
    provider: 'Future Skills Lab',
    mode: 'Part-Time',
    match: 91,
    status: 'Recommended',
  },
  {
    id: 'mock-training-assistant',
    title: 'Training Assistant',
    provider: 'Elimika Partner Network',
    mode: 'On-site',
    match: 78,
    status: 'Open',
  },
  {
    id: 'mock-content-creator',
    title: 'Learning Content Creator',
    provider: 'Course Studio',
    mode: 'Contract',
    match: 84,
    status: 'Apply',
  },
];

function SharedMySkillsSkeleton() {
  return (
    <main className='bg-background min-h-screen px-3 py-3 sm:px-4 lg:px-5'>
      <div className='mx-auto flex w-full max-w-[1180px] flex-col gap-4'>
        <Skeleton className='h-32 w-full rounded-lg' />
        <div className='flex gap-2'>
          <Skeleton className='h-8 w-20 rounded-md' />
          <Skeleton className='h-8 w-24 rounded-md' />
          <Skeleton className='h-8 w-28 rounded-md' />
        </div>
        <div className='grid gap-4 xl:grid-cols-3'>
          <Skeleton className='h-72 rounded-lg' />
          <Skeleton className='h-72 rounded-lg' />
          <Skeleton className='h-72 rounded-lg' />
        </div>
        <Skeleton className='h-44 rounded-lg' />
      </div>
    </main>
  );
}
