'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, BookOpen, CalendarRange, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Calendar } from 'react-multi-date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import useBundledClassInfo from '@/hooks/use-course-classes';
import { listCatalogItemsOptions } from '@/services/client/@tanstack/react-query.gen';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import AvailabilityClassCard, {
} from '@/src/features/dashboard/courses/components/availability-listing-layout';
import { useDateRangeFilter } from '@/src/features/dashboard/courses/hooks/use-date-range-filter';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../../../../components/ui/sheet';
import { Skeleton } from '../../../../../components/ui/skeleton';
import Spinner from '../../../../../components/ui/spinner';
import { useUserProfile } from '../../../profile/context/profile-context';
import { buildWorkspaceAliasPath } from '../../lib/active-domain-storage';
import { CourseDetailsSheet } from '../shared/_components/CourseDetailsSheet';
import { BundledClass } from '../types';

export default function AvailableClassesPage({
  courseId,
  instructorView = false,
}: {
  courseId: string;
  instructorView?: boolean;
}) {
  const { activeDomain } = useUserDomain();
  const user = useUserProfile();
  const student = user?.student;
  const instructor = user?.instructor;

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

  const { data: catalogues } = useQuery({
    ...listCatalogItemsOptions(),
    staleTime: 1000 * 60 * 10,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { classes = [], loading } = useBundledClassInfo(
    courseId,
    appliedStart ?? undefined,
    appliedEnd ?? undefined,
    student
  );

  const course = classes[0]?.course;

  const filteredClasses = classes.filter(cls =>
    catalogues?.data?.some(cat => cat.class_definition_uuid === cls.uuid)
  );

  const instructorFilteredClasses = filteredClasses.filter(
    cls => cls.default_instructor_uuid === instructor?.uuid
  );

  function toggle(id: string) {
    setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
  }

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

          {loading ? <Spinner className='mt-1 h-4 w-4' /> :
            <p className='text-muted-foreground text-sm'>{course?.name || ''}</p>
          }
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
              {filteredClasses.length >= 2 && (
                <CompareTable classes={filteredClasses} onRemove={(id: string) => toggle(id)} />
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
          : filteredClasses.map(item => (
            <AvailabilityClassCard
              key={item.uuid}
              cls={item}
              // onEnroll={() => toast.message("Enroll")}
              onViewCourse={() => setCourseDetailsOpen(true)}
              onViewClass={() => setClassDetailsOpen(true)}
              onEnroll={selectedClass => {
                window.location.href = buildWorkspaceAliasPath(
                  activeDomain,
                  `/dashboard/courses/available-classes/${courseId}/enroll?id=${selectedClass.uuid}`
                );
              }}
            />
          ))}
      </div>

      <CourseDetailsSheet
        key={courseId}
        itemId={courseId}
        type={'course'}
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

export function CompareTable({
  classes,
  onRemove,
}: {
  classes: BundledClass[];
  onRemove: (id: string) => void;
}) {
  const rows: { key: string; label: string; get: (c: BundledClass) => string }[] = [
    { key: 'institution_name', label: 'Institution', get: c => c.institution_name ?? '—' },
    { key: 'instructor', label: 'Instructor', get: c => c.instructor?.name ?? '—' },
    { key: 'delivery_mode', label: 'Delivery mode', get: c => c.delivery_mode ?? '—' },
    { key: 'class_type', label: 'Class type', get: c => c.class_type ?? '—' },
    { key: 'academic_period', label: 'Academic period', get: c => c.academic_period ?? '—' },
    { key: 'weekly_schedule', label: 'Weekly schedule', get: c => c.weekly_schedule ?? '—' },
    {
      key: 'capacity',
      label: 'Capacity',
      get: c => `${c.seats_available ?? 0} / ${c.capacity ?? 0} seats`,
    },
    {
      key: 'tuition_fee_kes',
      label: 'Tuition',
      get: c => `KES ${Number(c.tuition_fee_kes ?? 0).toLocaleString()}`,
    },
    {
      key: 'skills_fund_eligible',
      label: 'Skills Fund',
      get: c => (c.skills_fund_eligible ? 'Eligible' : 'Not eligible'),
    },
    { key: 'age_group', label: 'Age group', get: c => c.age_group ?? '—' },
    { key: 'prerequisite_level', label: 'Prerequisite', get: c => c.prerequisite_level ?? '—' },
    { key: 'rating', label: 'Rating', get: c => (c.rating != null ? `${c.rating} ★` : '—') },
  ];

  return (
    <div className='mt-4 overflow-x-auto'>
      <table className='w-full border-collapse text-sm'>
        <thead>
          <tr>
            <th className='bg-card text-muted-foreground sticky left-0 z-10 p-2 text-left text-xs font-medium'>
              Attribute
            </th>
            {classes.map(c => (
              <th key={c.uuid} className='min-w-[180px] border-b p-2 text-left align-top'>
                <div className='text-foreground font-semibold'>{c.title}</div>
                <button
                  className='text-destructive mt-1 text-xs hover:underline'
                  onClick={() => onRemove(c.uuid as string)}
                >
                  Remove
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const values = classes.map(c => row.get(c));
            const differs = new Set(values).size > 1;
            return (
              <tr key={row.key} className='border-b last:border-0'>
                <td className='bg-card text-muted-foreground sticky left-0 z-10 p-2 text-xs font-medium'>
                  {row.label}
                </td>
                {values.map((v, i) => (
                  <td
                    key={i}
                    className={`p-2 align-top ${differs ? 'bg-warning/10 text-warning' : 'text-foreground'}`}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
