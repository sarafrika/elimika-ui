'use client';

import { isAuthenticatedMediaUrl, toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { BadgeCheck, BarChart3, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useUserDomain } from '../../../../../context/user-domain-context';
import type { TrainingHubManagedCourse } from './training-hub-data';

const accentClasses: Record<TrainingHubManagedCourse['accent'], string> = {
  blue: 'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_16%,white),white)]',
  indigo: 'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_10%,white),white)]',
  orange: 'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--warning)_18%,white),white)]',
  yellow: 'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--warning)_12%,white),white)]',
};

const badgeClasses: Record<TrainingHubManagedCourse['accent'], string> = {
  blue: 'bg-primary text-primary-foreground',
  indigo: 'bg-[color-mix(in_srgb,var(--primary)_88%,white)] text-primary-foreground',
  orange: 'bg-[color-mix(in_srgb,var(--warning)_90%,black_6%)] text-white',
  yellow: 'bg-[color-mix(in_srgb,var(--warning)_70%,white)] text-[color-mix(in_srgb,var(--warning)_92%,black)]',
};

type ManageCourseCardProps = {
  course: TrainingHubManagedCourse;
};

export function ManageCourseCard({ course }: ManageCourseCardProps) {
  const imageUrl = toAuthenticatedMediaUrl(course.imageUrl);
  const { activeDomain } = useUserDomain();

  return (
    <article className='w-full max-w-full min-w-0 overflow-hidden rounded-[12px] border border-border/60 bg-card p-2.5 shadow-sm sm:p-3'>
      <div className='flex w-full min-w-0 gap-3'>
        <div className='min-w-0 flex-1 basis-0'>

          <Link
            href={`/dashboard/workspace/${activeDomain}/courses/${course.id}`}
            className='block min-w-0'
          >
            <div className='min-w-0'>
              <h3 className='block w-full min-w-0 truncate overflow-hidden text-[0.98rem] font-semibold text-foreground group-hover:text-primary sm:text-[1rem]'>
                {course?.title}
              </h3>
            </div>

            {/* META */}
            <div className='mt-1 flex w-full min-w-0 gap-x-2 text-[0.77rem] text-muted-foreground sm:text-[0.8rem]'>
              <span className='min-w-0 truncate text-primary font-medium'>
                {course.provider}
              </span>

              <span className='shrink-0'>|</span>

              <span className='min-w-0 truncate'>
                {course.level}
              </span>
            </div>

            {/* STATUS */}
            <div className='mt-1 flex min-w-0 items-center gap-1 text-[0.74rem] text-success'>
              <BadgeCheck className='size-3.5 shrink-0' />
              <span className='min-w-0 truncate'>
                Admin verified • Approved to train
              </span>
            </div>

          </Link>

          {/* STATS */}
          <div className='mt-3 flex min-w-0 gap-4 text-[0.77rem] text-muted-foreground sm:text-[0.8rem]'>
            <span className='inline-flex min-w-0 items-center gap-1.5'>
              <Users className='size-3.5 shrink-0' />
              <span className='truncate'>{course.students}</span>
            </span>

            <span className='inline-flex min-w-0 items-center gap-1.5'>
              <BarChart3 className='size-3.5 shrink-0' />
              <span className='truncate'>{course.classes}</span>
            </span>
          </div>

        </div>

        {/* IMAGE */}
        <div
          aria-hidden='true'
          className={`relative hidden h-[74px] w-[86px] shrink-0 overflow-hidden rounded-[10px] border border-border/60 sm:block ${accentClasses[course.accent]}`}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={course.title}
              fill
              className='object-cover'
              unoptimized={isAuthenticatedMediaUrl(imageUrl)}
            />
          ) : null}
        </div>

      </div>

      {/* ACTION */}
      <div className='mt-2 flex justify-end'>
        <Link
          className='inline-flex h-9 items-center justify-center rounded-[8px] bg-primary px-4 text-[0.8rem] font-medium text-primary-foreground transition hover:bg-primary/90'
          href={course.ctaHref}
        >
          {course.ctaLabel}
        </Link>
      </div>

    </article>
  );
}
