'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  MapPin,
  MessageCircleMore,
  Star,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { searchTrainingApplicationsOptions } from '@/services/client/@tanstack/react-query.gen';
import type { SearchInstructor } from '@/src/features/dashboard/courses/types';

type Props = {
  instructor: SearchInstructor;
  courseId: string | null;
  selected: boolean;
  onSelect: () => void;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

function getInstructorType(instructor: SearchInstructor) {
  const userDomain = instructor.user_domain;

  const domainList = Array.isArray(userDomain) ? userDomain : userDomain ? [userDomain] : [];
  return domainList.some(value => String(value).toLowerCase().includes('organization'))
    ? 'organization'
    : 'individual';
}

function getLocation(instructor: SearchInstructor) {
  return instructor.formatted_location || instructor.location?.city || 'Nairobi, Kenya';
}

function getSkillNames(instructor: SearchInstructor) {
  return instructor.specializations
    .map(skill => skill.skill_name)
    .filter((skill, index, array) => skill && array.indexOf(skill) === index)
    .slice(0, 3);
}

export function SearchInstructorCard({ instructor, courseId, selected, onSelect }: Props) {
  const { data: appliedCourses } = useQuery({
    ...searchTrainingApplicationsOptions({
      query: { pageable: {}, searchParams: { applicant_uuid_eq: instructor.uuid as string } },
    }),
    enabled: !!instructor.uuid,
  });

  const matchedCourse = appliedCourses?.data?.content?.find(course => course.course_uuid === courseId);
  const rateCard = matchedCourse?.rate_card;
  const rates = rateCard ? Object.values(rateCard).filter(value => typeof value === 'number') : [];
  const minRate = rates.length ? Math.min(...rates) : null;

  const matchScore = useMemo(() => {
    const ratingScore = Math.min(20, Math.round((instructor.rating ?? 4.4) * 4));
    const experienceScore = Math.min(10, Math.round((instructor.total_experience_years ?? 0) * 1.2));
    const verifiedScore = instructor.admin_verified ? 7 : 0;
    const profileScore = instructor.is_profile_complete ? 5 : 0;

    return Math.min(99, 60 + ratingScore + experienceScore + verifiedScore + profileScore);
  }, [instructor.admin_verified, instructor.is_profile_complete, instructor.rating, instructor.total_experience_years]);

  const matchLabel =
    matchScore >= 92 ? 'Excellent match' : matchScore >= 82 ? 'Great match' : 'Good match';

  const instructorType = getInstructorType(instructor);
  const location = getLocation(instructor);
  const skills = getSkillNames(instructor);
  const rating = instructor.rating ?? 0;
  const isVerified = Boolean(instructor.admin_verified);

  return (
    <Card
      className={[
        'group h-full rounded-xl border bg-card p-4 shadow-none transition-colors hover:border-primary/50 hover:shadow-sm',
        selected ? 'border-primary bg-primary/5' : 'border-border/70',
      ].join(' ')}
    >
      <div
        role='button'
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect();
          }
        }}
        className='flex h-full w-full flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      >
        <div className='flex items-start justify-between gap-3'>
          <div className='flex min-w-0 items-start gap-3'>
            <div className='relative'>
              <Avatar className='size-14 border border-border/60'>
                <AvatarImage src={instructor.profile_image_url ?? undefined} alt={instructor.full_name} />
                <AvatarFallback className='text-sm font-semibold'>
                  {instructor.full_name?.charAt(0) || 'I'}
                </AvatarFallback>
              </Avatar>
              <div className='bg-background absolute right-0 bottom-0 flex size-5 items-center justify-center rounded-full border shadow-sm'>
                <div className='bg-primary size-3 rounded-full' />
              </div>
            </div>

            <div className='min-w-0 space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='bg-success/10 text-success inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold'>
                  Available
                </span>
                {isVerified ? <CheckCircle2 className='text-primary size-4' /> : null}
              </div>
              <div className='min-w-0'>
                <h3 className='truncate text-[0.98rem] font-semibold sm:text-[1.04rem]'>
                  {instructor.full_name}
                </h3>
                <p className='text-muted-foreground line-clamp-1 text-xs sm:text-sm'>
                  {instructor.professional_headline || 'Certified Instructor'}
                </p>
              </div>
            </div>
          </div>

          <Badge variant='outlineSuccess' className='rounded-full px-2.5 py-1 text-[11px]'>
            {matchScore}% Match
          </Badge>
        </div>

        <div className='mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm'>
          <span className='text-muted-foreground inline-flex items-center gap-1.5'>
            <MapPin className='size-3.5' />
            <span className='truncate'>{location}</span>
          </span>
          <span className='text-muted-foreground inline-flex items-center gap-1.5'>
            <span className='bg-muted-foreground size-1.5 rounded-full' />
            <span>{instructorType === 'organization' ? 'Organization' : 'Individual'}</span>
          </span>
          <span className='text-muted-foreground inline-flex items-center gap-1.5'>
            <span className='bg-muted-foreground size-1.5 rounded-full' />
            <span>{instructor.total_experience_years || 0}+ years</span>
          </span>
        </div>

        <div className='mt-3 flex flex-wrap items-center gap-2'>
          <span className='text-warning inline-flex items-center gap-1 text-sm font-semibold'>
            <Star className='size-4 fill-current' />
            {rating.toFixed(1)}
          </span>
          <span className='text-muted-foreground text-xs sm:text-sm'>
            {Math.max(18, Math.round((rating || 4.8) * 25))} reviews
          </span>
          <span className='bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[11px]'>
            {matchLabel}
          </span>
        </div>

        <div className='mt-3 flex flex-wrap gap-2'>
          {skills.map(skill => (
            <Badge key={skill} variant='outline' className='rounded-full px-2.5 py-1 text-[11px]'>
              {skill}
            </Badge>
          ))}
          {instructor.specializations.length > skills.length ? (
            <Badge variant='outline' className='rounded-full px-2.5 py-1 text-[11px]'>
              +{instructor.specializations.length - skills.length} more
            </Badge>
          ) : null}
        </div>

        <div className='mt-auto pt-4'>
          <div className='flex flex-col gap-3 border-t pt-4'>
            <div className='flex items-end justify-between gap-3'>
              <div className='min-w-0'>
                <p className='text-muted-foreground text-xs sm:text-sm'>Starting from</p>
                <p className='text-base font-semibold sm:text-[1.05rem]'>
                  {matchedCourse && minRate !== null ? (
                    <>
                      KSh {currencyFormatter.format(minRate)}
                      <span className='text-muted-foreground text-xs font-normal sm:text-sm'>
                        {' '}
                        / session
                      </span>
                    </>
                  ) : (
                    <span className='text-muted-foreground text-sm font-normal'>
                      Rate not available
                    </span>
                  )}
                </p>
              </div>

              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='size-9 rounded-full'
                aria-label='Save instructor'
              >
                <Heart className='size-4' />
              </Button>
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              <Button type='button' variant='outline' className='h-9 rounded-xl px-3 text-xs sm:text-sm'>
                View Profile
              </Button>
              <Button type='button' variant='outline' className='h-9 rounded-xl px-3 text-xs sm:text-sm'>
                <MessageCircleMore className='size-4' />
                Message
              </Button>
              <Button
                type='button'
                variant='success'
                className='ml-auto h-9 rounded-xl px-4 text-xs sm:text-sm'
              >
                Hire Now
                <ArrowRight className='size-4' />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
