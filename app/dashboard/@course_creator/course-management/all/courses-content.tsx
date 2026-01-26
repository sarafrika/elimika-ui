'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCourseCreator } from '@/context/course-creator-context';
import type { Course } from '@/services/client';
import { format } from 'date-fns';
import { Filter, PlusCircle, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { CatalogueWorkspace } from '../../../_components/catalogue-workspace';

type CourseStatusFilter = 'all' | 'draft' | 'in_review' | 'published' | 'archived';

const STATUS_OPTIONS: { label: string; value: CourseStatusFilter }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'In review', value: 'in_review' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
];

const STATUS_BADGE: Record<
  string,
  { label: string; variant: 'secondary' | 'default' | 'outline' }
> = {
  draft: { label: 'Draft', variant: 'secondary' },
  in_review: { label: 'In review', variant: 'outline' },
  published: { label: 'Published', variant: 'default' },
  archived: { label: 'Archived', variant: 'secondary' },
};

export default function CourseCreatorCoursesContent() {
  const { courses, data } = useCourseCreator();
  const [statusFilter, setStatusFilter] = useState<CourseStatusFilter>('all');
  const [open, setOpen] = useState(false);

  const filteredCourses = useMemo(() => {
    if (statusFilter === 'all') return courses;
    return courses.filter(course => course.status === statusFilter);
  }, [courses, statusFilter]);

  return (
    <div className='mx-auto w-full max-w-6xl space-y-6 px-4 py-10'>
      <header className='flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <div>
          {/* <h1 className='text-3xl font-semibold tracking-tight'>Courses</h1> */}
          <p className='text-muted-foreground mt-2 max-w-2xl text-sm'>
            Monitor each course&apos;s publishing status, monetization settings, and delivery
            requirements at a glance.
          </p>
        </div>

        <div className='flex flex-row items-center gap-4'>
          <Button variant={'ghost'} onClick={() => setOpen(!open)}>
            View catalogues
          </Button>
          <Button asChild>
            <Link prefetch href='/dashboard/course-management/create-new-course'>
              <PlusCircle className='mr-2 h-4 w-4' />
              Create course
            </Link>
          </Button>
        </div>
      </header>

      <>
        {open ? (
          <div className='mt-8 flex flex-col gap-4'>
            {' '}
            <Button
              size={'sm'}
              onClick={() => setOpen(false)}
              className='w-fit self-end'
              variant={'outline'}
            >
              <X /> Close
            </Button>
            <CatalogueWorkspace scope='course_creator' />
          </div>
        ) : (
          <Card>
            <CardHeader className='border-border/50 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <CardTitle className='text-base font-semibold'>Course catalogue</CardTitle>
                <CardDescription>
                  {courses.length} course{courses.length === 1 ? '' : 's'} owned by this creator.
                </CardDescription>
              </div>
              <div className='flex items-center gap-2'>
                <Filter className='text-muted-foreground hidden h-4 w-4 sm:block' />
                <Select
                  value={statusFilter}
                  onValueChange={value => setStatusFilter(value as CourseStatusFilter)}
                >
                  <SelectTrigger className='w-[200px]'>
                    <SelectValue placeholder='Filter by status' />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className='p-0'>
              {filteredCourses.length === 0 ? (
                <div className='flex flex-col items-center justify-center space-y-4 py-16 text-center'>
                  <p className='text-lg font-medium'>No courses match this filter.</p>
                  <p className='text-muted-foreground text-sm'>
                    Adjust the status filter or create a new course to populate this view.
                  </p>
                  <Button variant='outline' asChild>
                    <Link prefetch href='/dashboard/course-management'>
                      Create course
                    </Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-[34%]'>Course</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <div className='flex flex-col gap-0.5'>
                          <p>Minimum training fee</p>
                          <p>(per person per head)</p>
                        </div>
                      </TableHead>
                      <TableHead>Revenue split</TableHead>
                      <TableHead>Requirements</TableHead>
                      <TableHead>Last updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map(course => (
                      <CourseRow key={course.uuid ?? course.name} course={course} />
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </>
    </div>
  );
}

function CourseRow({ course }: { course: Course }) {
  const router = useRouter();
  const statusMeta = STATUS_BADGE[course.status] ?? {
    label: course.status,
    variant: 'secondary',
  };
  const requirementsCount = course.training_requirements?.length ?? 0;

  return (
    <TableRow
      className='cursor-pointer'
      onClick={() => router.push(`/dashboard/course-management/preview/${course?.uuid}`)}
    >
      <TableCell>
        <div className='flex flex-col gap-1'>
          <span className='leading-tight font-semibold'>{course.name}</span>
          <div className='text-muted-foreground text-xs'>
            {course?.description ? (
              <RichTextRenderer htmlString={course?.description as string} maxChars={65} />
            ) : (
              'No description added yet.'
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
      </TableCell>
      <TableCell className='font-medium'>
        {typeof course.minimum_training_fee === 'number'
          ? formatCurrency(course.minimum_training_fee)
          : 'Not set'}
      </TableCell>
      <TableCell>
        {course.creator_share_percentage}% / {course.instructor_share_percentage}%
      </TableCell>
      <TableCell>{requirementsCount}</TableCell>
      <TableCell className='text-muted-foreground text-sm'>
        {course.updated_date ? format(new Date(course.updated_date), 'dd MMM yyyy') : '—'}
      </TableCell>
    </TableRow>
  );
}

function _truncate(value: string, length: number) {
  if (value.length <= length) return value;
  return `${value.slice(0, length)}…`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value);
}
