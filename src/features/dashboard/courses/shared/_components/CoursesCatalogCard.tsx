'use client';

import { Button } from '@/components/ui/button';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import type { CoursesCatalogCardData } from '@/src/features/dashboard/courses/shared/_components/courses-data';
import { Award, BookOpen, Calendar, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StudentCourseAction } from '../../components/StudentCourseAction';
import { CourseCatalogCardLayout } from './CourseCatalogCardLayout';
import { getEnrollHref } from './courses-data';

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
  const { activeDomain } = useUserDomain();
  const isTrainingApplication = card.ctaKind === 'apply-course' || card.ctaKind === 'apply-program';
  const classesPath = getEnrollHref('student', card.contentKind, card.id);

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
          {typeof card.enrollmentCount === 'number' && (
            <span className='flex items-center gap-1.5'>
              <Users className='h-3.5 w-3.5 shrink-0' />
              {card.enrollmentCount} {type === 'general' ? 'students' : 'classes'}
            </span>
          )}
        </>
      }
    >
      <StudentCourseAction
        href={card.instructorHref}
        variant='outline'
        className='h-9 w-full rounded-lg text-sm shadow-none'
      >
        <Search className='size-4' />
        Search Instructor
      </StudentCourseAction>

      <StudentCourseAction href={classesPath} className='h-9 w-full rounded-lg text-sm shadow-none'>
        <Calendar className='size-4' />
        Join Class
      </StudentCourseAction>

      {/* {activeDomain === 'instructor' && isTrainingApplication && (
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
      )} */}

      {!isTrainingApplication &&
        type !== 'general' &&
        (card.ctaLabel === 'View Certificate' ? (
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
        ))}
    </CourseCatalogCardLayout>
  );
}
