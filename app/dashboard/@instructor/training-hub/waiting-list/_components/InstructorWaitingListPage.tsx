'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { WaitingListItem } from '../../_components/WaitingListItem';
import { useInstructorTrainingHubData } from '../../_components/useInstructorTrainingHubData';

export function InstructorWaitingListPage() {
  const { replaceBreadcrumbs } = useBreadcrumb();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<'all' | string>('all');
  const { classes, waitingList, isLoading } = useInstructorTrainingHubData();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      { id: 'training-hub', title: 'Training Hub', url: '/dashboard/training-hub' },
      {
        id: 'waiting-list',
        title: 'Waiting List',
        url: '/dashboard/training-hub/waiting-list',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const classOptions = useMemo(
    () =>
      classes.map(classItem => ({
        value: classItem.uuid ?? '',
        label: classItem.title,
      })),
    [classes]
  );

  const activeClassCount = useMemo(
    () => new Set(waitingList.map(student => student.classId).filter(Boolean)).size,
    [waitingList]
  );

  const filteredWaitingList = useMemo(
    () =>
      waitingList.filter(student => {
        const matchesSearch = [student.name, student.email, student.classTitle, student.scheduleLabel]
          .some(value => value.toLowerCase().includes(normalizedSearch));
        const matchesClass =
          selectedClass === 'all' || !student.classId ? true : student.classId === selectedClass;

        return matchesSearch && matchesClass;
      }),
    [normalizedSearch, selectedClass, waitingList]
  );

  return (
    <main className='mx-auto flex w-full max-w-[1280px] flex-col gap-5 bg-white px-3 py-4 sm:px-4 lg:px-5'>
      <section className='flex flex-col gap-4 rounded-[14px] border border-border/50 bg-white p-4 shadow-[0_12px_30px_rgba(31,79,183,0.06)] sm:flex-row sm:items-end sm:justify-between sm:p-5'>
        <div className='space-y-1'>
          <h1 className='text-[1.6rem] font-semibold tracking-[-0.03em] text-foreground sm:text-[1.85rem]'>
            Class Waiting List
          </h1>
          <p className='text-sm text-muted-foreground sm:text-[0.95rem]'>
            Students who enrolled after a class reached capacity appear here until a seat opens up.
          </p>
        </div>

        <Link
          href='/dashboard/training-hub'
          className='inline-flex h-10 items-center justify-center rounded-[10px] border border-border px-4 text-sm font-medium text-foreground transition hover:border-primary/30 hover:text-primary'
        >
          Back to Training Hub
        </Link>
      </section>

      <section className='rounded-[14px] border border-border/50 bg-white p-3 shadow-[0_12px_30px_rgba(31,79,183,0.06)] sm:p-4'>
        <div className='grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]'>
          <label className='flex h-11 items-center gap-2 rounded-[10px] border border-border/60 px-3'>
            <Search className='size-4 text-muted-foreground' />
            <Input
              aria-label='Search waiting list'
              className='h-auto border-0 p-0 shadow-none focus-visible:ring-0'
              onChange={event => setSearchTerm(event.target.value)}
              placeholder='Search by student, email, or class'
              value={searchTerm}
            />
          </label>

          <Select onValueChange={value => setSelectedClass(value)} value={selectedClass}>
            <SelectTrigger className='h-11 rounded-[10px] border-border/60'>
              <SelectValue placeholder='Filter by class' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All classes</SelectItem>
              {classOptions.map(classOption => (
                <SelectItem key={classOption.value} value={classOption.value}>
                  {classOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className='space-y-3'>
        {isLoading ? (
          <Card className='border-border/60'>
            <CardContent className='flex min-h-[280px] flex-col items-center justify-center gap-3 text-center'>
              <Users className='size-8 text-muted-foreground' />
              <div className='space-y-1'>
                <h2 className='text-base font-semibold text-foreground'>Loading waiting list</h2>
                <p className='text-sm text-muted-foreground'>
                  Fetching waitlisted students across {activeClassCount || classes.length} classes.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : filteredWaitingList.length === 0 ? (
          <Card className='border-border/60'>
            <CardContent className='flex min-h-[280px] flex-col items-center justify-center gap-3 text-center'>
              <Users className='size-8 text-muted-foreground' />
              <div className='space-y-1'>
                <h2 className='text-base font-semibold text-foreground'>No waitlisted students</h2>
                <p className='text-sm text-muted-foreground'>
                  {selectedClass === 'all'
                    ? 'Once a class reaches capacity, new enrollments with waitlist status will appear here.'
                    : 'This class does not have any waitlisted students right now.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {filteredWaitingList.map(student => (
          <WaitingListItem key={student.id} student={student} />
        ))}
      </section>
    </main>
  );
}
