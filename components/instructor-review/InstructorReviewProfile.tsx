'use client';

import { useQuery } from '@tanstack/react-query';
import { BriefcaseBusiness, FileText, GraduationCap, Star } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  getInstructorByUuidOptions,
  getInstructorDocumentsOptions,
  getInstructorEducationOptions,
  getInstructorExperienceOptions,
  getInstructorRatingSummaryOptions,
  getInstructorReviewsOptions,
  getInstructorSkillsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { Instructor } from '@/services/client/types.gen';
import { StatusBadge, surfaceTheme } from '@/components/data-display';
import {
  type SectionTab,
  SectionTabPanel,
  SectionTabs,
  useSectionTab,
} from '@/components/data-display/section-tabs';

const PROFILE_TABS = ['skills', 'experience', 'education', 'documents', 'reviews'] as const;
type ProfileTab = (typeof PROFILE_TABS)[number];

function formatEnumLabel(value?: string | null) {
  if (!value) return '';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, letter => letter.toUpperCase());
}

function ProfileSection({
  title,
  icon: Icon,
  isLoading,
  isEmpty,
  emptyLabel,
  children,
}: {
  title: string;
  icon: typeof Star;
  isLoading: boolean;
  isEmpty: boolean;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className={surfaceTheme.cardPadded}>
      <h3 className={cn(surfaceTheme.sectionLabel, 'flex items-center gap-2')}>
        <Icon className='text-primary size-4' />
        {title}
      </h3>
      <div className='mt-3 space-y-2'>
        {isLoading ? (
          <Skeleton className='h-16 rounded-md' />
        ) : isEmpty ? (
          <p className='text-muted-foreground text-sm'>{emptyLabel}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export function InstructorReviewProfile({
  instructorUuid,
  instructor,
  extraBadges,
}: {
  instructorUuid: string | null;
  instructor?: Instructor | null;
  extraBadges?: React.ReactNode;
}) {
  const enabled = Boolean(instructorUuid);
  const pathOptions = { path: { instructorUuid: instructorUuid ?? '' } };

  const instructorQuery = useQuery({
    ...getInstructorByUuidOptions({ path: { uuid: instructorUuid ?? '' } }),
    enabled: enabled && !instructor,
  });
  const ratingQuery = useQuery({ ...getInstructorRatingSummaryOptions(pathOptions), enabled });
  const skillsQuery = useQuery({
    ...getInstructorSkillsOptions({
      ...pathOptions,
      query: { pageable: { page: 0, size: 50 } },
    }),
    enabled,
  });
  const educationQuery = useQuery({ ...getInstructorEducationOptions(pathOptions), enabled });
  const experienceQuery = useQuery({
    ...getInstructorExperienceOptions({
      ...pathOptions,
      query: { pageable: { page: 0, size: 50 } },
    }),
    enabled,
  });
  const documentsQuery = useQuery({ ...getInstructorDocumentsOptions(pathOptions), enabled });
  const reviewsQuery = useQuery({ ...getInstructorReviewsOptions(pathOptions), enabled });

  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(PROFILE_TABS, 'skills');

  const profile = instructor ?? instructorQuery.data ?? null;
  const rating = ratingQuery.data?.data;
  const skills = skillsQuery.data?.data?.content ?? [];
  const education = educationQuery.data?.data ?? [];
  const experience = experienceQuery.data?.data?.content ?? [];
  const documents = documentsQuery.data?.data ?? [];
  const reviews = reviewsQuery.data?.data ?? [];

  const countOf = (loading: boolean, items: readonly unknown[]) => (loading ? null : items.length);
  const tabs: SectionTab<ProfileTab>[] = [
    { id: 'skills', label: 'Skills', count: countOf(skillsQuery.isLoading, skills) },
    {
      id: 'experience',
      label: 'Experience',
      count: countOf(experienceQuery.isLoading, experience),
    },
    { id: 'education', label: 'Education', count: countOf(educationQuery.isLoading, education) },
    { id: 'documents', label: 'Documents', count: countOf(documentsQuery.isLoading, documents) },
    { id: 'reviews', label: 'Reviews', count: countOf(reviewsQuery.isLoading, reviews) },
  ];

  const displayName = profile?.full_name || 'Instructor';
  const initials =
    displayName
      .split(/\s+/)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';

  return (
    <div className='space-y-4'>
      <div className={surfaceTheme.cardPadded}>
        <div className='flex items-start gap-3'>
          <div className='border-primary/30 bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-md border text-lg font-semibold'>
            {initials}
          </div>
          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <h2 className='text-foreground text-xl font-semibold tracking-tight'>
                {displayName}
              </h2>
              {profile?.admin_verified ? (
                <StatusBadge status='verified' label='Verified' />
              ) : profile?.admin_verified === false ? (
                <StatusBadge status='pending' label='Unverified' />
              ) : null}
            </div>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              {profile?.professional_headline || 'Instructor applicant profile'}
            </p>
          </div>
        </div>

        <div className='mt-3 flex flex-wrap items-center gap-2'>
          {typeof rating?.average_rating === 'number' ? (
            <Badge variant='outline' className='rounded-md'>
              <Star className='fill-warning text-warning mr-1 size-3.5' />
              {rating.average_rating.toFixed(1)} ({String(rating.review_count ?? 0)} reviews)
            </Badge>
          ) : null}
          {extraBadges}
          {profile?.user_uuid ? (
            <Button asChild variant='outline' size='sm'>
              <Link href={`/profile-user/${profile.user_uuid}?domain=instructor`}>
                View public profile
              </Link>
            </Button>
          ) : null}
        </div>

        {profile?.bio ? (
          <p className='text-muted-foreground mt-3 max-w-prose text-sm leading-6 whitespace-pre-line'>
            {profile.bio}
          </p>
        ) : null}
      </div>

      <SectionTabs
        tabs={tabs}
        value={tab}
        onValueChange={setTab}
        hrefFor={hrefFor}
        label='Applicant profile sections'
        sticky
      >
        <SectionTabPanel value='skills'>
          <ProfileSection
            title='Skills'
            icon={Star}
            isLoading={skillsQuery.isLoading}
            isEmpty={skills.length === 0}
            emptyLabel='No skills listed.'
          >
            <div className='flex flex-wrap gap-2'>
              {skills.map(skill => (
                <Badge
                  key={skill.uuid ?? skill.skill_name}
                  variant='outline'
                  className='rounded-md'
                >
                  {skill.skill_name}
                  {skill.proficiency_level ? ` · ${formatEnumLabel(skill.proficiency_level)}` : ''}
                </Badge>
              ))}
            </div>
          </ProfileSection>
        </SectionTabPanel>

        <SectionTabPanel value='experience'>
          <ProfileSection
            title='Experience'
            icon={BriefcaseBusiness}
            isLoading={experienceQuery.isLoading}
            isEmpty={experience.length === 0}
            emptyLabel='No work experience listed.'
          >
            {experience.map(item => (
              <div
                key={item.uuid ?? `${item.position}-${item.organisation_name}`}
                className='text-sm'
              >
                <p className='text-foreground font-medium'>
                  {item.position} · {item.organisation_name}
                </p>
                <p className='text-muted-foreground'>
                  {typeof item.years_of_experience === 'number'
                    ? `${item.years_of_experience} year${item.years_of_experience === 1 ? '' : 's'}`
                    : 'Duration not provided'}
                </p>
              </div>
            ))}
          </ProfileSection>
        </SectionTabPanel>

        <SectionTabPanel value='education'>
          <ProfileSection
            title='Education'
            icon={GraduationCap}
            isLoading={educationQuery.isLoading}
            isEmpty={education.length === 0}
            emptyLabel='No education records listed.'
          >
            {education.map(item => (
              <div
                key={item.uuid ?? `${item.qualification}-${item.school_name}`}
                className='text-sm'
              >
                <p className='text-foreground font-medium'>{item.qualification}</p>
                <p className='text-muted-foreground'>
                  {item.school_name}
                  {item.year_completed ? ` · ${item.year_completed}` : ''}
                </p>
              </div>
            ))}
          </ProfileSection>
        </SectionTabPanel>

        <SectionTabPanel value='documents'>
          <ProfileSection
            title='Documents'
            icon={FileText}
            isLoading={documentsQuery.isLoading}
            isEmpty={documents.length === 0}
            emptyLabel='No documents uploaded.'
          >
            {documents.map(document => (
              <div key={document.uuid ?? document.original_filename} className='text-sm'>
                <p className='text-foreground font-medium'>
                  {document.title || document.original_filename}
                </p>
              </div>
            ))}
          </ProfileSection>
        </SectionTabPanel>

        <SectionTabPanel value='reviews'>
          <ProfileSection
            title='Reviews'
            icon={Star}
            isLoading={reviewsQuery.isLoading}
            isEmpty={reviews.length === 0}
            emptyLabel='No student reviews yet.'
          >
            {reviews.slice(0, 5).map(review => (
              <div
                key={review.uuid}
                className='border-border/60 bg-muted/20 rounded-md border p-3 text-sm'
              >
                <div className='flex items-center gap-2'>
                  <Star className='fill-warning text-warning size-3.5' />
                  <span className='font-medium'>{review.rating}/5</span>
                  {review.headline ? (
                    <span className='text-foreground'>{review.headline}</span>
                  ) : null}
                </div>
                {review.comments ? (
                  <p className='text-muted-foreground mt-1'>{review.comments}</p>
                ) : null}
              </div>
            ))}
          </ProfileSection>
        </SectionTabPanel>
      </SectionTabs>
    </div>
  );
}
