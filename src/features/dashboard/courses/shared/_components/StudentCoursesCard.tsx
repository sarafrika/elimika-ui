'use client';

import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Layers,
  PiggyBank,
  Search,
  UserCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CourseCatalogCardLayout } from './CourseCatalogCardLayout';
import type { CoursesCatalogCardData } from './courses-data';

type StudentCoursesCardProps = {
  card: CoursesCatalogCardData;
  type: string;
};

export function StudentCoursesCard({ card }: StudentCoursesCardProps) {
  return (
    <CourseCatalogCardLayout
      card={card}
      badges={
        (Boolean(card.categoryNames?.length) || card.skillsFundEligible) && (
          <div className='flex flex-wrap gap-1'>
            {card.categoryNames?.map(category => (
              <Badge key={category} variant='secondary' className='max-w-full'>
                <span className='truncate'>{category}</span>
              </Badge>
            ))}
            {card.skillsFundEligible && (
              <Badge className='bg-success text-success-foreground hover:bg-success/90'>
                <PiggyBank className='mr-1 h-3 w-3' />
                Skills Fund
              </Badge>
            )}
          </div>
        )
      }
      stats={
        <>
          {typeof card.lessons === 'number' && (
            <span className='flex items-center gap-1.5'>
              <BookOpen className='h-3.5 w-3.5 shrink-0' />
              {card.lessons} {card.lessons === 1 ? 'Lesson' : 'Lessons'}
            </span>
          )}
          {typeof card.minAge === 'number' && (
            <span className='flex items-center gap-1.5'>
              <GraduationCap className='h-3.5 w-3.5 shrink-0' />
              {card.minAge}+
            </span>
          )}
          {typeof card.units === 'number' && (
            <span className='flex items-center gap-1.5'>
              <Layers className='h-3.5 w-3.5 shrink-0' />
              {card.units} units
            </span>
          )}
          <span className='flex items-center gap-1.5'>
            <Users className='h-3.5 w-3.5 shrink-0' />
            {card.enrollmentCount ?? 0} learners
          </span>
          <span className='flex items-center gap-1.5'>
            <CalendarDays className='h-3.5 w-3.5 shrink-0' />
            {card.activeClasses ?? 0} classes
          </span>
          {typeof card.instructorCount === 'number' && (
            <span className='flex items-center gap-1.5'>
              <UserCheck className='h-3.5 w-3.5 shrink-0' />
              {card.instructorCount} instructors
            </span>
          )}
        </>
      }
    >
      <Button asChild size='sm' className='w-full rounded-lg'>
        <Link href={card.enrollHref}>
          <Users className='mr-1 h-3 w-3' />
          Join Class
        </Link>
      </Button>

      <Button asChild size='sm' className='w-full rounded-lg' variant='outline'>
        <Link href={card.instructorHref}>
          <Search className='h-3 w-3' />
          Search Instructor
        </Link>
      </Button>
    </CourseCatalogCardLayout>
  );
}
