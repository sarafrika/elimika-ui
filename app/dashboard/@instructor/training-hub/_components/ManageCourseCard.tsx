'use client';

import { isAuthenticatedMediaUrl, toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { BadgeCheck, BarChart3, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
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

  return (
    <article className='rounded-[12px] border border-border/60 bg-white p-2.5 shadow-[0_10px_24px_rgba(31,79,183,0.05)] sm:p-3'>
      <div className='flex gap-3'>
        <div className='min-w-0 flex-1'>
          <div className='flex items-start gap-2'>
            <div className='min-w-0'>
              <h3 className='truncate text-[0.98rem] font-semibold text-foreground sm:text-[1rem]'>
                {course.title}
              </h3>
              <div className='mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.77rem] text-muted-foreground sm:text-[0.8rem]'>
                <span className='font-medium text-primary'>{course.provider}</span>
                <span>|</span>
                <span>{course.level}</span>
              </div>
              <div className='mt-1 flex items-center gap-1 text-[0.74rem] text-green-600'>
                <BadgeCheck className='size-3.5' />
                <span>Admin verified  •  Approved to train</span>
              </div>
            </div>
          </div>

          <div className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.77rem] text-muted-foreground sm:text-[0.8rem]'>
            <span className='inline-flex items-center gap-1.5'>
              <Users className='size-3.5' />
              {course.students}
            </span>
            <span className='inline-flex items-center gap-1.5'>
              <BarChart3 className='size-3.5' />
              {course.classes}
            </span>
          </div>
        </div>

        <div
          aria-hidden='true'
          className={`relative hidden h-[74px] w-[86px] shrink-0 overflow-hidden rounded-[10px] border border-white/60 sm:block ${accentClasses[course.accent]}`}
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

      <div className='mt-2 flex justify-end'>
        <Link
          className='inline-flex h-9 items-center justify-center rounded-[8px] bg-primary px-4 text-[0.8rem] font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
          href={course.ctaHref}
        >
          {course.ctaLabel}
        </Link>
      </div>
    </article>
  );
}
