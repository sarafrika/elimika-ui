'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, Filter, GraduationCap, Search, Users } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { InstructorStudentsData } from '../data';
import type { FilterOption, StudentFilterState } from '../types';
import { OverviewStats } from './OverviewStats';
import { Pagination } from './Pagination';
import { StudentRow } from './StudentRow';

const EMPTY_FILTERS: StudentFilterState = { class: 'all', status: 'all', level: 'all' };

function FilterDropdown({
  label,
  ariaLabel,
  value,
  onChange,
  options,
  fullWidth = false,
}: {
  label: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  fullWidth?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={`bg-card h-10 min-w-32 rounded-lg text-sm ${fullWidth ? 'w-full' : 'flex-1 sm:w-36 sm:flex-none'}`}
      >
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='all'>{label}</SelectItem>
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function StudentTable({ data }: { data: InstructorStudentsData }) {
  const { students, courseTabs, filterOptions, loading } = data;
  const [courseFilter, setCourseFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<StudentFilterState>(EMPTY_FILTERS);
  const [today, setToday] = useState('');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  useEffect(() => {
    setToday(
      new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date())
    );
  }, []);

  const stats = useMemo(
    () => [
      { value: students.length, label: 'Total students', icon: <Users className='size-5' /> },
      {
        value: students.filter(student => student.status === 'Enrolled').length,
        label: 'Currently enrolled',
        icon: <GraduationCap className='size-5' />,
      },
      {
        value: students.filter(student => student.status === 'Graduated').length,
        label: 'Graduated',
        icon: <CheckCircle className='size-5' />,
        tone: 'info' as const,
      },
    ],
    [students]
  );
  const courseOptions = useMemo(
    () =>
      courseTabs.filter(tab => tab.id !== 'all').map(tab => ({ value: tab.id, label: tab.label })),
    [courseTabs]
  );
  const filteredStudents = useMemo(
    () =>
      students.filter(student => {
        const matchesSearch = !deferredSearch || student.searchIndex.includes(deferredSearch);
        const matchesCourse =
          courseFilter === 'all' || student.courses.some(course => course.uuid === courseFilter);
        const matchesClass =
          filters.class === 'all' || student.classes.some(item => item.uuid === filters.class);
        const matchesStatus = filters.status === 'all' || student.status === filters.status;
        const matchesLevel = filters.level === 'all' || student.levels.includes(filters.level);
        return matchesSearch && matchesCourse && matchesClass && matchesStatus && matchesLevel;
      }),
    [students, deferredSearch, courseFilter, filters]
  );

  const totalItems = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  useEffect(() => {
    setCurrentPage(1);
  }, [courseFilter, filters, rowsPerPage, search]);
  useEffect(() => {
    setCurrentPage(page => Math.min(page, totalPages));
  }, [totalPages]);
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + rowsPerPage);
  const filterCount =
    Number(courseFilter !== 'all') + Object.values(filters).filter(value => value !== 'all').length;
  const resetFilters = () => {
    setCourseFilter('all');
    setFilters(EMPTY_FILTERS);
  };

  return (
    <section className='min-w-0 space-y-5' aria-label='Student enrollment'>
      <header className='flex flex-wrap items-end justify-between gap-4'>
        <div className='max-w-2xl space-y-1'>
          <p className='text-muted-foreground text-sm'>
            Students enrolled across your classes
            {courseOptions.length > 0 && (
              <>
                {' '}
                ·{' '}
                {courseOptions.slice(0, 2).map((course, index) => (
                  <span key={course.value}>
                    {index > 0 && ' and '}
                    <strong className='text-foreground font-semibold'>{course.label}</strong>
                  </span>
                ))}
                {courseOptions.length > 2 && ` and ${courseOptions.length - 2} more courses`}
              </>
            )}
          </p>
        </div>
        <p className='text-muted-foreground text-xs whitespace-nowrap'>{today}</p>
      </header>

      <Card className='gap-0 rounded-2xl p-1 shadow-none' aria-label='Student enrollment summary'>
        {loading ? (
          <div className='grid gap-3 p-4 md:grid-cols-3'>
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className='h-14 w-full' />
            ))}
          </div>
        ) : (
          <OverviewStats stats={stats} />
        )}
      </Card>

      <div className='flex flex-wrap items-center gap-2.5' aria-label='Student filters'>
        <div className='relative min-w-0 basis-full sm:min-w-56 sm:flex-1'>
          <Search
            className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2'
            aria-hidden='true'
          />
          <Input
            type='search'
            aria-label='Search students'
            placeholder='Search students…'
            autoComplete='off'
            value={search}
            onChange={event => setSearch(event.target.value)}
            className='bg-card h-10 w-full rounded-lg pl-9 text-sm'
          />
        </div>
        <FilterDropdown
          label='All status'
          ariaLabel='Filter by status'
          value={filters.status}
          onChange={value => setFilters(previous => ({ ...previous, status: value }))}
          options={filterOptions.statuses}
        />
        <FilterDropdown
          label='All classes'
          ariaLabel='Filter by class'
          value={filters.class}
          onChange={value => setFilters(previous => ({ ...previous, class: value }))}
          options={filterOptions.classes}
        />
        <FilterDropdown
          label='All levels'
          ariaLabel='Filter by level'
          value={filters.level}
          onChange={value => setFilters(previous => ({ ...previous, level: value }))}
          options={filterOptions.levels}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant='outline' className='bg-card ml-auto h-10 gap-2 rounded-lg px-3.5'>
              <Filter className='size-3.5' />
              Filters
              {filterCount > 0 && (
                <span className='bg-primary/10 text-primary rounded px-1.5 text-xs'>
                  {filterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align='end' className='space-y-4 rounded-xl'>
            <h3 className='text-sm font-semibold'>Filter students</h3>
            <div className='space-y-2'>
              <p className='text-muted-foreground text-xs'>Course</p>
              <FilterDropdown
                label='All courses'
                ariaLabel='Filter by course'
                value={courseFilter}
                onChange={setCourseFilter}
                options={courseOptions}
                fullWidth
              />
            </div>
            <Button
              variant='outline'
              size='sm'
              className='w-full'
              onClick={resetFilters}
              disabled={filterCount === 0}
            >
              Reset filters
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      <Card className='min-w-0 gap-0 overflow-hidden rounded-2xl py-0 shadow-none'>
        <div className='flex items-center justify-between gap-3 px-5 pt-4 pb-1'>
          <h3 className='text-sm font-semibold'>Students</h3>
          <span className='text-muted-foreground text-xs tabular-nums' aria-live='polite'>
            {loading
              ? 'Loading students…'
              : `${totalItems} ${totalItems === 1 ? 'student' : 'students'}`}
          </span>
        </div>
        <Table className='min-w-[760px]' aria-label='Enrolled students'>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              {['Student', 'Course / Class', 'Status', 'Progress', 'Joined'].map(label => (
                <TableHead
                  key={label}
                  scope='col'
                  className='text-muted-foreground h-auto px-5 pt-3 pb-2.5 text-xs font-semibold tracking-wide'
                >
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }, (_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 5 }, (_, cell) => (
                    <TableCell key={cell} className='px-5 py-3.5'>
                      <Skeleton className='h-9 w-full' />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedStudents.length > 0 ? (
              paginatedStudents.map(student => (
                <StudentRow key={student.student.uuid} student={student} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className='p-0'>
                  <EmptyState
                    variant='plain'
                    title='No students found'
                    description='No students match your search. Try another search or filter.'
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {!loading && (
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={totalItems}
            rowsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={setRowsPerPage}
          />
        )}
      </Card>
    </section>
  );
}
