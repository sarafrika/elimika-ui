'use client';

import { useQuery } from '@tanstack/react-query';
import { BriefcaseBusiness, FileText, GraduationCap, Star } from 'lucide-react';
import Link from 'next/link';

import { adminTheme, StatusBadge } from '@/app/dashboard/@admin/_components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/format-currency';
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
    <div className={adminTheme.cardPadded}>
      <h3 className={cn(adminTheme.sectionLabel, 'flex items-center gap-2')}>
        <Icon className='size-4 text-primary' />
        {title}
      </h3>
      <div className='mt-3 space-y-2'>
        {isLoading ? (
          <Skeleton className='h-16 rounded-md' />
        ) : isEmpty ? (
          <p className='text-sm text-muted-foreground'>{emptyLabel}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export function ApplicantProfileSheet({
  instructorUuid,
  instructor,
  open,
  onOpenChange,
  approvedRate,
  jobFee,
}: {
  instructorUuid: string | null;
  instructor?: Instructor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  approvedRate?: number | null;
  jobFee?: number | null;
}) {
  const enabled = open && Boolean(instructorUuid);
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

  const profile = instructor ?? instructorQuery.data ?? null;
  const rating = ratingQuery.data?.data;
  const skills = skillsQuery.data?.data?.content ?? [];
  const education = educationQuery.data?.data ?? [];
  const experience = experienceQuery.data?.data?.content ?? [];
  const documents = documentsQuery.data?.data ?? [];
  const reviews = reviewsQuery.data?.data ?? [];

  const displayName = profile?.full_name || 'Instructor';
  const initials =
    displayName
      .split(/\s+/)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className='flex w-[min(98vw,600px)] max-w-none flex-col overflow-y-auto sm:max-w-none'
      >
        <div className='space-y-4 p-3 sm:p-6'>
          <SheetHeader className='space-y-3 pr-10 text-left'>
            <div className='flex items-start gap-3'>
              <div className='flex size-12 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-lg font-semibold text-primary'>
                {initials}
              </div>
              <div className='min-w-0'>
                <SheetTitle className='flex flex-wrap items-center gap-2 text-xl tracking-tight'>
                  {displayName}
                  {profile?.admin_verified ? (
                    <StatusBadge status='verified' label='Verified' />
                  ) : profile?.admin_verified === false ? (
                    <StatusBadge status='pending' label='Unverified' />
                  ) : null}
                </SheetTitle>
                <SheetDescription>
                  {profile?.professional_headline || 'Instructor applicant profile'}
                </SheetDescription>
              </div>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              {typeof rating?.average_rating === 'number' ? (
                <Badge variant='outline' className='rounded-md'>
                  <Star className='mr-1 size-3.5 fill-amber-400 text-amber-400' />
                  {rating.average_rating.toFixed(1)} ({String(rating.review_count ?? 0)} reviews)
                </Badge>
              ) : null}
              {typeof approvedRate === 'number' ? (
                <Badge variant='outline' className='rounded-md'>
                  Approved rate: {formatCurrency(approvedRate)} / session
                </Badge>
              ) : null}
              {typeof jobFee === 'number' ? (
                <Badge variant='outline' className='rounded-md'>
                  Job fee: {formatCurrency(jobFee)} / session
                </Badge>
              ) : null}
              {profile?.user_uuid ? (
                <Button asChild variant='outline' size='sm'>
                  <Link href={`/profile-user/${profile.user_uuid}?domain=instructor`}>
                    View full profile
                  </Link>
                </Button>
              ) : null}
            </div>
          </SheetHeader>

          {profile?.bio ? (
            <p className='whitespace-pre-line text-sm leading-6 text-muted-foreground'>
              {profile.bio}
            </p>
          ) : null}

          <ProfileSection
            title='Skills'
            icon={Star}
            isLoading={skillsQuery.isLoading}
            isEmpty={skills.length === 0}
            emptyLabel='No skills listed.'
          >
            <div className='flex flex-wrap gap-2'>
              {skills.map(skill => (
                <Badge key={skill.uuid ?? skill.skill_name} variant='outline' className='rounded-md'>
                  {skill.skill_name}
                  {skill.proficiency_level
                    ? ` · ${formatEnumLabel(skill.proficiency_level)}`
                    : ''}
                </Badge>
              ))}
            </div>
          </ProfileSection>

          <ProfileSection
            title='Experience'
            icon={BriefcaseBusiness}
            isLoading={experienceQuery.isLoading}
            isEmpty={experience.length === 0}
            emptyLabel='No work experience listed.'
          >
            {experience.map(item => (
              <div key={item.uuid ?? `${item.position}-${item.organisation_name}`} className='text-sm'>
                <p className='font-medium text-foreground'>
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

          <ProfileSection
            title='Education'
            icon={GraduationCap}
            isLoading={educationQuery.isLoading}
            isEmpty={education.length === 0}
            emptyLabel='No education records listed.'
          >
            {education.map(item => (
              <div key={item.uuid ?? `${item.qualification}-${item.school_name}`} className='text-sm'>
                <p className='font-medium text-foreground'>{item.qualification}</p>
                <p className='text-muted-foreground'>
                  {item.school_name}
                  {item.year_completed ? ` · ${item.year_completed}` : ''}
                </p>
              </div>
            ))}
          </ProfileSection>

          <ProfileSection
            title='Documents'
            icon={FileText}
            isLoading={documentsQuery.isLoading}
            isEmpty={documents.length === 0}
            emptyLabel='No documents uploaded.'
          >
            {documents.map(document => (
              <div key={document.uuid ?? document.original_filename} className='text-sm'>
                <p className='font-medium text-foreground'>{document.title || document.original_filename}</p>
              </div>
            ))}
          </ProfileSection>

          <ProfileSection
            title='Reviews'
            icon={Star}
            isLoading={reviewsQuery.isLoading}
            isEmpty={reviews.length === 0}
            emptyLabel='No student reviews yet.'
          >
            {reviews.slice(0, 5).map(review => (
              <div key={review.uuid} className='rounded-md border border-border/60 bg-muted/20 p-3 text-sm'>
                <div className='flex items-center gap-2'>
                  <Star className='size-3.5 fill-amber-400 text-amber-400' />
                  <span className='font-medium'>{review.rating}/5</span>
                  {review.headline ? <span className='text-foreground'>{review.headline}</span> : null}
                </div>
                {review.comments ? (
                  <p className='mt-1 text-muted-foreground'>{review.comments}</p>
                ) : null}
              </div>
            ))}
          </ProfileSection>
        </div>
      </SheetContent>
    </Sheet>
  );
}
