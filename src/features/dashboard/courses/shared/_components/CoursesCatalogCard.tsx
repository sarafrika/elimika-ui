'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CoursesCatalogCardData } from '@/src/features/dashboard/courses/shared/_components/courses-data';
import { Award, BookOpen, Calendar, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CourseCatalogCardLayout } from './CourseCatalogCardLayout';

type CoursesCatalogCardProps = {
  card: CoursesCatalogCardData;
  type: string;
  onPrimaryAction?: (card: CoursesCatalogCardData) => void;
};

const ctaToneClasses: Record<NonNullable<CoursesCatalogCardData['ctaTone']>, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  pending:
    'border border-[color:var(--warning)] bg-[color:var(--warning)] text-[color:var(--warning-foreground)] hover:brightness-95 disabled:opacity-100',
  approved:
    'border border-[color:var(--success)] bg-[color:var(--success)] text-[color:var(--success-foreground)] hover:brightness-95 disabled:opacity-100',
  revoked:
    'border border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-100',
};

export function CoursesCatalogCard({ card, type }: CoursesCatalogCardProps) {
  const router = useRouter();

  return (
    <CourseCatalogCardLayout
      card={card}
      stats={
        <>
          {typeof card.lessons === 'number' && (
            <span className='flex items-center gap-1.5'>
              <BookOpen className='h-3.5 w-3.5 shrink-0' />
              {card.lessons} {card.lessons === 1 ? 'Lesson' : 'Lessons'}
            </span>
          )}
          {typeof card.units === 'number' && (
            <span className='flex items-center gap-1.5'>
              <BookOpen className='h-3.5 w-3.5 shrink-0' />
              {card.units} units
            </span>
          )}
          <span className='flex items-center gap-1.5'>
            <Users className='h-3.5 w-3.5 shrink-0' />
            {card.enrollmentCount ?? 0} {type === 'general' ? 'students' : 'classes'}
          </span>
        </>
      }
    >
      {/* Instructor CTA */}
      {card.showInstructorCta !== false && (
        <Button asChild variant='outline' className='h-9 w-full rounded-lg text-sm shadow-none'>
          <Link href={card.instructorHref}>
            <Search className='size-4' />
            Search Instructor
          </Link>
        </Button>
      )}

      {/* Primary CTA */}
      {card.ctaKind === 'apply-course' || card.ctaKind === 'apply-program' ? (
        <Button
          type='button'
          className={cn(
            'h-9 w-full rounded-lg text-sm shadow-none',
            ctaToneClasses[card.ctaTone ?? 'default']
          )}
          disabled={card.ctaDisabled}
          onClick={() => router.push(card.enrollHref)}
        >
          <BookOpen className='size-4' />
          {card.ctaLabel}
        </Button>
      ) : card.ctaLabel === 'View Certificate' ? (
        <Button
          asChild
          className='h-9 w-full rounded-lg text-sm shadow-none'
          disabled={card.ctaDisabled}
        >
          <Link href={card.certificateHref}>
            <Award className='size-4' />
            {card.ctaLabel}
          </Link>
        </Button>
      ) : (
        <Button
          asChild
          className='h-9 w-full rounded-lg text-sm shadow-none'
          disabled={card.ctaDisabled}
        >
          <Link href={card.enrollHref}>
            <Calendar className='size-4' />
            {card.ctaLabel}
          </Link>
        </Button>
      )}
    </CourseCatalogCardLayout>
  );
}
