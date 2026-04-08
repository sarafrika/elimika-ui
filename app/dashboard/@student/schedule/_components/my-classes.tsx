'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { cx, getCardClasses, getEmptyStateClasses, getStatCardClasses } from '@/lib/design-system';
import { isAfter, isBefore } from 'date-fns';
import { BookOpen, CalendarDays, Filter, GraduationCap, Search, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CustomLoadingState } from '../../../@course_creator/_components/loading-state';
import EnrolledClassCard from './enrolled-class-card';
import { getClassData, type StudentClassRecord } from './schedule-data';

type Props = {
  classDefinitions: StudentClassRecord[];
  loading?: boolean;
  isError?: boolean;
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in-progress', label: 'Active' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
] as const;

export default function MyClassesPage({ classDefinitions, isError, loading }: Props) {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'schedule',
        title: 'Schedule',
        url: '/dashboard/schedule',
      },
    ]);
  }, [replaceBreadcrumbs]);

  const getClassStatus = (classDetails: StudentClassRecord['classDetails']) => {
    const classData = getClassData({ classDetails });
    const startDate = classData?.default_start_time ? new Date(classData.default_start_time) : null;
    const endDate = classData?.default_end_time ? new Date(classData.default_end_time) : null;
    const now = new Date();

    if (!startDate || !endDate) return 'upcoming';
    if (isBefore(now, startDate)) return 'upcoming';
    if (isAfter(now, endDate)) return 'completed';
    return 'in-progress';
  };

  const counts = useMemo(
    () => ({
      all: classDefinitions.length,
      inProgress: classDefinitions.filter(
        item => getClassStatus(item.classDetails) === 'in-progress'
      ).length,
      upcoming: classDefinitions.filter(item => getClassStatus(item.classDetails) === 'upcoming')
        .length,
      completed: classDefinitions.filter(item => getClassStatus(item.classDetails) === 'completed')
        .length,
      sessions: classDefinitions.reduce((total, item) => total + (item.schedules?.length ?? 0), 0),
    }),
    [classDefinitions]
  );

  const filteredClasses = useMemo(() => {
    return classDefinitions.filter(item => {
      const classData = getClassData(item);
      const courseName = item.course?.name ?? '';
      const title = classData?.title ?? '';
      const subtitle = classData?.subtitle ?? '';

      const matchesSearch =
        searchQuery.trim() === '' ||
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        courseName.toLowerCase().includes(searchQuery.toLowerCase());

      const status = getClassStatus(item.classDetails);
      const matchesFilter = selectedFilter === 'all' || selectedFilter === status;

      return matchesSearch && matchesFilter;
    });
  }, [classDefinitions, searchQuery, selectedFilter]);

  if (loading) {
    return <CustomLoadingState subHeading='Fetching your classes...' />;
  }

  if (isError) {
    return (
      <div className='flex min-h-[320px] items-center justify-center'>
        <Card className={cx(getCardClasses(), 'p-8 text-center')}>
          <p className='text-destructive'>Failed to load classes. Please try again.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <section className='grid gap-4 xl:grid-cols-[1.2fr_0.8fr]'>
        <Card className={cx(getCardClasses(), 'p-5 sm:p-6')}>
          <CardContent className='space-y-5 p-0'>
            <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
              <div className='space-y-2'>
                <div className='border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold'>
                  <Sparkles className='h-3.5 w-3.5' />
                  Enrolled classes
                </div>
                <div>
                  <h2 className='text-foreground text-2xl font-semibold'>Your learning lineup</h2>
                  <p className='text-muted-foreground mt-1 max-w-2xl text-sm'>
                    Review class progress, upcoming sessions, and jump back into any class detail
                    page without losing the existing flow.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => router.push('/dashboard/all-courses')}
                className='w-full sm:w-auto'
              >
                <GraduationCap className='mr-2 h-4 w-4' />
                Browse more classes
              </Button>
            </div>

            <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
              {[
                {
                  label: 'Total classes',
                  value: counts.all,
                  helper: 'All enrollments',
                  icon: BookOpen,
                },
                {
                  label: 'Active now',
                  value: counts.inProgress,
                  helper: 'Classes currently running',
                  icon: GraduationCap,
                },
                {
                  label: 'Upcoming',
                  value: counts.upcoming,
                  helper: 'Classes that have not started',
                  icon: CalendarDays,
                },
                {
                  label: 'Sessions',
                  value: counts.sessions,
                  helper: 'Schedule instances across classes',
                  icon: Filter,
                },
              ].map(metric => (
                <Card key={metric.label} className={getStatCardClasses()}>
                  <CardContent className='p-0'>
                    <div className='flex items-start gap-4'>
                      <div className='bg-primary/10 text-primary rounded-2xl p-3'>
                        <metric.icon className='h-5 w-5' />
                      </div>
                      <div>
                        <p className='text-muted-foreground text-sm'>{metric.label}</p>
                        <p className='text-foreground text-2xl font-semibold'>{metric.value}</p>
                        <p className='text-muted-foreground text-xs'>{metric.helper}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={cx(getCardClasses(), 'p-5 sm:p-6')}>
          <CardContent className='space-y-4 p-0'>
            <div>
              <h3 className='text-foreground text-lg font-semibold'>Search and filter</h3>
              <p className='text-muted-foreground mt-1 text-sm'>
                Narrow the class list by title, course, or current status.
              </p>
            </div>

            <div className='relative'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                placeholder='Search classes or courses'
                className='pl-10'
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
              />
            </div>

            <div className='flex flex-wrap gap-2'>
              {FILTERS.map(filter => {
                const countValue =
                  filter.id === 'all'
                    ? counts.all
                    : filter.id === 'in-progress'
                      ? counts.inProgress
                      : filter.id === 'upcoming'
                        ? counts.upcoming
                        : counts.completed;

                return (
                  <Button
                    key={filter.id}
                    type='button'
                    variant={selectedFilter === filter.id ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setSelectedFilter(filter.id)}
                    className='rounded-full'
                  >
                    {filter.label}
                    <Badge variant='secondary' className='ml-2'>
                      {countValue}
                    </Badge>
                  </Button>
                );
              })}
            </div>

            <div className='border-border/60 bg-muted/30 flex items-center justify-between gap-3 rounded-2xl border p-3 text-sm'>
              <p className='text-muted-foreground'>
                {filteredClasses.length} class{filteredClasses.length === 1 ? '' : 'es'} match the
                current view.
              </p>
              {searchQuery && (
                <Button variant='ghost' size='sm' onClick={() => setSearchQuery('')}>
                  Clear search
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {filteredClasses.length > 0 ? (
        <section className='grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3'>
          {filteredClasses.map(item => (
            <EnrolledClassCard
              key={item.uuid}
              classRecord={item}
              href={`/dashboard/schedule/classes/${item.uuid}`}
            />
          ))}
        </section>
      ) : (
        <section className={getEmptyStateClasses()}>
          <BookOpen className='text-primary/70 mb-2 h-12 w-12' />
          <h3 className='text-foreground text-lg font-semibold'>
            {searchQuery ? 'No classes found' : 'No classes yet'}
          </h3>
          <p className='text-muted-foreground max-w-md text-sm'>
            {searchQuery
              ? 'Try a different course name or clear the active filter.'
              : 'Start your learning journey by enrolling in a class.'}
          </p>
          <div className='flex flex-col gap-3 sm:flex-row'>
            {searchQuery && (
              <Button
                variant='outline'
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFilter('all');
                }}
              >
                Clear filters
              </Button>
            )}
            <Button onClick={() => router.push('/dashboard/all-courses')}>Browse classes</Button>
          </div>
        </section>
      )}
    </div>
  );
}
