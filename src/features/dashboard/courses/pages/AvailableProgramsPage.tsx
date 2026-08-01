'use client';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useStudent } from '@/context/student-context';
import useProgramBundledClassInfo from '@/hooks/use-program-classes';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import AvailabilityClassCard, {
  mockRecommendedClasses,
  RecommendedClassCard,
} from '@/src/features/dashboard/courses/components/availability-listing-layout';
import { useDateRangeFilter } from '@/src/features/dashboard/courses/hooks/use-date-range-filter';
import { format } from 'date-fns';
import { ArrowLeft, BookOpen, CalendarRange, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Calendar } from 'react-multi-date-picker';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../../components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../../../../components/ui/sheet';
import { Skeleton } from '../../../../../components/ui/skeleton';
import { buildWorkspaceAliasPath } from '../../lib/active-domain-storage';
import { CourseDetailsSheet } from '../shared/_components/CourseDetailsSheet';
import type { BundledClass } from '../types';
import { CompareTable } from './AvailableClassesPage';

export default function AvailableProgramsPage({
  programId,
  instructorView,
}: {
  programId: string;
  instructorView?: boolean;
}) {
  const { activeDomain } = useUserDomain();
  const { replaceBreadcrumbs } = useBreadcrumb();
  const student = useStudent();

  const [selected, setSelected] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [courseDetailsOpen, setCourseDetailsOpen] = useState(false);
  const [classDetailsOpen, setClassDetailsOpen] = useState(false);

  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    to: new Date(new Date().setMonth(new Date().getMonth() + 12)),
  });

  const {
    startDateInput,
    endDateInput,
    setStartDateInput,
    setEndDateInput,
    appliedStart,
    appliedEnd,
    dateError,
    applyDates,
    clearDates,
  } = useDateRangeFilter();

  const { classes = [], loading } = useProgramBundledClassInfo(
    programId,
    appliedStart ?? undefined,
    appliedEnd ?? undefined,
    student
  );

  function toggle(id: string) {
    setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
  }

  const cardClasses: BundledClass[] = classes.map(cls => ({
    ...cls,
    course: cls.course?.[0] ?? null,
  }));

  return (
    <div className='space-y-4 p-4'>
      <Link
        href='/dashboard/student/courses'
        className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm'
      >
        <ArrowLeft className='h-4 w-4' /> Back to Start Course
      </Link>

      <div className='mt-3 flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-semibold'>Available Classes</h2>
          <p className='text-muted-foreground text-sm'>{classes[0]?.program?.title ?? null}</p>
        </div>

        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={() => setCourseDetailsOpen(true)}>
            <BookOpen className='mr-1 h-4 w-4' /> Course Details
          </Button>

          <Sheet open={compareOpen} onOpenChange={setCompareOpen}>
            <SheetTrigger asChild>
              <Button variant='outline' size='sm' disabled={selected.length < 2}>
                Compare ({selected.length})
              </Button>
            </SheetTrigger>

            <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-4xl'>
              <SheetHeader>
                <SheetTitle>Compare Classes</SheetTitle>
                <p className='text-muted-foreground text-xs'>
                  Differences are highlighted in amber.
                </p>
              </SheetHeader>
              {cardClasses.length >= 2 && (
                <CompareTable classes={cardClasses} onRemove={(id: string) => toggle(id)} />
              )}
            </SheetContent>
          </Sheet>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant='outline' size='sm' className='gap-2'>
                <CalendarRange className='h-4 w-4' />

                {range?.from && range?.to
                  ? `${format(range.from, 'dd MMM')} - ${format(range.to, 'dd MMM')}`
                  : 'Select dates'}
              </Button>
            </PopoverTrigger>

            <PopoverContent className='w-auto p-0' align='end'>
              <Calendar
                mode='range'
                numberOfMonths={12}
                selected={range}
                defaultMonth={range?.from}
                onSelect={value => {
                  setRange(value);

                  if (value?.from) {
                    setStartDateInput(format(value.from, 'yyyy-MM-dd'));
                  }

                  if (value?.to) {
                    setEndDateInput(format(value.to, 'yyyy-MM-dd'));
                    applyDates();
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <section className='space-y-3'>
        <div className='flex items-center gap-2'>
          <Sparkles className='text-primary h-4 w-4' />

          <h2 className='text-lg font-semibold'>Recommended Classes for You</h2>

          <Badge variant='secondary'>AI matched</Badge>
        </div>

        <div className='grid gap-4 md:grid-cols-2 2xl:grid-cols-3'>
          {mockRecommendedClasses.map(item => (
            <RecommendedClassCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <div className='space-y-4'>
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className='space-y-3 rounded-xl border p-4'>
                <Skeleton className='h-6 w-2/3' />
                <Skeleton className='h-4 w-1/2' />
                <Skeleton className='h-4 w-full' />
                <div className='flex items-center justify-between pt-2'>
                  <Skeleton className='h-8 w-24' />
                  <Skeleton className='h-8 w-20' />
                </div>
              </div>
            ))
          : cardClasses.map(item => (
              <AvailabilityClassCard
                key={item.uuid}
                cls={item}
                // onEnroll={() => toast.message("Enroll")}
                onViewCourse={() => setCourseDetailsOpen(true)}
                onViewClass={() => setClassDetailsOpen(true)}
                onEnroll={selectedClass => {
                  window.location.href = buildWorkspaceAliasPath(
                    activeDomain,
                    `/dashboard/courses/available-classes/${item.uuid}/enroll?id=${selectedClass.uuid}`
                  );
                }}
              />
            ))}
      </div>

      <CourseDetailsSheet
        key={programId}
        itemId={programId}
        type={'program'}
        open={courseDetailsOpen}
        onOpenChange={value => {
          setCourseDetailsOpen(value);

          if (!value) {
            setTimeout(() => setDetailId(null), 200);
          }
        }}
      />
    </div>
  );
}
