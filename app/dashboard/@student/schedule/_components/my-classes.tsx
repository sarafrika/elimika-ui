'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useStudent } from '@/context/student-context';
import useStudentClassDefinitions from '@/hooks/use-student-class-definition';
import { isAfter, isBefore } from 'date-fns';
import { BookOpen, Filter, GraduationCap, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CustomLoadingState } from '../../../@course_creator/_components/loading-state';
import EnrolledClassCard from './enrolled-class-card';

export default function MyClassesPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const student = useStudent();

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

  const { classDefinitions, isError, loading } = useStudentClassDefinitions(student);
  const classes = classDefinitions || [];

  // Filter by status
  const getClassStatus = (classDetails: any) => {
    const startDate = classDetails?.default_start_time
      ? new Date(classDetails.default_start_time)
      : null;
    const endDate = classDetails?.default_end_time ? new Date(classDetails.default_end_time) : null;
    const now = new Date();

    if (!startDate || !endDate) return 'upcoming';

    if (isBefore(now, startDate)) {
      return 'upcoming';
    } else if (isAfter(now, endDate)) {
      return 'completed';
    } else {
      return 'in-progress';
    }
  };

  // Filter classes
  const filteredClasses = classes.filter((item: any) => {
    const title = item.classDetails?.title ?? '';
    const subtitle = item.classDetails?.subtitle ?? '';
    const courseName = item.course?.name ?? '';

    const matchesSearch =
      searchQuery === '' ||
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      courseName.toLowerCase().includes(searchQuery.toLowerCase());

    const status = getClassStatus(item.classDetails);
    const matchesTab =
      selectedTab === 'all' ||
      (selectedTab === 'in-progress' && status === 'in-progress') ||
      (selectedTab === 'upcoming' && status === 'upcoming') ||
      (selectedTab === 'completed' && status === 'completed');

    return matchesSearch && matchesTab;
  });

  // Count classes by status
  const counts = {
    all: classes.length,
    inProgress: classes.filter((c: any) => getClassStatus(c.classDetails) === 'in-progress').length,
    upcoming: classes.filter((c: any) => getClassStatus(c.classDetails) === 'upcoming').length,
    completed: classes.filter((c: any) => getClassStatus(c.classDetails) === 'completed').length,
  };

  if (loading) {
    return <CustomLoadingState subHeading='Fetching your classes...' />;
  }

  if (isError) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <Card className='p-6 text-center'>
          <p className='text-destructive'>Failed to load classes. Please try again.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen space-y-6'>
      {/* Header */}
      <div className='flex max-w-fit items-end justify-end gap-4 self-end'>
        <Button onClick={() => router.push('/dashboard/browse-courses')}>
          <GraduationCap className='mr-2 h-4 w-4' />
          Browse More Classes
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {/* Total Classes */}
        <Card className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-muted-foreground text-sm'>Total Classes</p>
              <p className='text-foreground text-2xl font-bold'>{counts.all}</p>
            </div>
            <div className='bg-primary/10 rounded-full p-3'>
              <BookOpen className='text-primary h-5 w-5' />
            </div>
          </div>
        </Card>

        {/* In Progress */}
        <Card className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-muted-foreground text-sm'>In Progress</p>
              <p className='text-foreground text-2xl font-bold'>{counts.inProgress}</p>
            </div>
            <div className='bg-info/10 rounded-full p-3'>
              <GraduationCap className='text-info h-5 w-5' />
            </div>
          </div>
        </Card>

        {/* Upcoming */}
        <Card className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-muted-foreground text-sm'>Upcoming</p>
              <p className='text-foreground text-2xl font-bold'>{counts.upcoming}</p>
            </div>
            <div className='bg-warning/10 rounded-full p-3'>
              <BookOpen className='text-warning h-5 w-5' />
            </div>
          </div>
        </Card>

        {/* Completed */}
        <Card className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-muted-foreground text-sm'>Completed</p>
              <p className='text-foreground text-2xl font-bold'>{counts.completed}</p>
            </div>
            <div className='bg-success/10 rounded-full p-3'>
              <BookOpen className='text-success h-5 w-5' />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Tabs */}
      <Card className='p-4'>
        <div className='space-y-4'>
          {/* Search and Filter Controls */}
          <div className='flex flex-col gap-3 sm:flex-row'>
            <div className='relative flex-1'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                placeholder='Search classes by name or course...'
                className='pl-10'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={selectedTab} onValueChange={setSelectedTab}>
              <SelectTrigger className='w-full sm:w-[220px]'>
                <SelectValue placeholder='Filter classes' />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value='all'>All ({counts.all})</SelectItem>
                <SelectItem value='in-progress'>Active ({counts.inProgress})</SelectItem>
                <SelectItem value='upcoming'>Upcoming ({counts.upcoming})</SelectItem>
                <SelectItem value='completed'>Completed ({counts.completed})</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant='outline'
              onClick={() => setShowFilters(!showFilters)}
              className='hidden sm:flex'
            >
              <Filter className='mr-2 h-4 w-4' />
              Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Count */}
      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-sm'>
          {filteredClasses.length} class{filteredClasses.length !== 1 ? 'es' : ''} found
        </p>
        {searchQuery && (
          <Button variant='ghost' size='sm' onClick={() => setSearchQuery('')}>
            Clear search
          </Button>
        )}
      </div>

      {/* Course Grid */}
      {filteredClasses.length > 0 ? (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'>
          {filteredClasses.map((item: any) => (
            <EnrolledClassCard
              key={item.uuid}
              classDefinition={item.classDetails}
              enrollment={item.enrollments}
              course={item.course}
              href={`/dashboard/schedule/classes/${item.uuid}`}
            />
          ))}
        </div>
      ) : (
        <div className='py-16 text-center'>
          <BookOpen className='text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-50' />
          <h3 className='text-foreground mb-2 text-lg font-semibold'>
            {searchQuery ? 'No classes found' : 'No classes yet'}
          </h3>
          <p className='text-muted-foreground mb-4'>
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Start your learning journey by enrolling in a class'}
          </p>
          <div className='flex flex-col justify-center gap-3 sm:flex-row'>
            {searchQuery && (
              <Button
                variant='outline'
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTab('all');
                }}
              >
                Clear filters
              </Button>
            )}
            <Button onClick={() => router.push('/dashboard/browse-courses')}>
              <GraduationCap className='mr-2 h-4 w-4' />
              Browse Classes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
