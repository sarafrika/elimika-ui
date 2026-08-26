'use client';

import { ALL_CATEGORIES, CategoryTabs, filterByCategoryTabs } from '@/components/category-tabs';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useInstructor } from '@/context/instructor-context';
import { extractEntity } from '@/lib/api-helpers';
import { ApplicantTypeEnum } from '@/services/client';
import { getCourseByUuidOptions, searchTrainingApplicationsOptions } from '@/services/client/@tanstack/react-query.gen';
import type { Course, CourseTrainingApplication } from '@/services/client/types.gen';
import { formatDurationFromParts } from '@/src/features/dashboard/courses/shared/_components/courses-data';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { useQueries, useQuery } from '@tanstack/react-query';
import { BookOpen, Eye, MoreHorizontal, PlusSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

const currency = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
});

type ApprovedCourseRow = {
  rowKey: string;
  courseUuid: string;
  category: string;
  subject: string;
  programType: string | null;
  displayName: string;
  subjectLabel: string;
  durationLabel: string;
  rateLabel: string;
  image: string | null;
  status: string;
};

function CourseImage({ src, alt }: { src?: string | null; alt: string }) {
  if (src) {
    return <img src={src} alt={alt} className='h-12 w-16 shrink-0 rounded-md object-cover' />;
  }

  return (
    <div className='from-primary/15 to-primary/5 flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-gradient-to-br'>
      <BookOpen className='text-primary/70 h-5 w-5' />
    </div>
  );
}

function CourseActions({
  onView,
  onCreateClass,
}: {
  onView: () => void;
  onCreateClass: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='h-8 w-8' onClick={event => event.stopPropagation()}>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' onClick={event => event.stopPropagation()}>
        <DropdownMenuItem onClick={onView}>
          <Eye className='mr-2 h-4 w-4' />
          View details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreateClass}>
          <PlusSquare className='mr-2 h-4 w-4' />
          Create class
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getCourseRate(course: Course) {
  const rate = course.minimum_training_fee ?? course.price;
  return typeof rate === 'number' ? rate : undefined;
}

function getCourseCategory(course: Course) {
  return course.category_names?.[0] ?? 'General';
}

export default function InstructorApprovedCoursesPage() {
  const router = useRouter();
  const instructor = useInstructor();
  const instructorUuid = instructor?.uuid ?? '';
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const [subjectByCategory, setSubjectByCategory] = useState<Record<string, string>>({});

  const applicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        pageable: { page: 0, size: 100 },
        searchParams: {
          applicant_uuid_eq: instructorUuid,
          applicant_type_eq: ApplicantTypeEnum.INSTRUCTOR,
        },
      },
    }),
    enabled: Boolean(instructorUuid),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const approvedApplications = useMemo(() => {
    const content = (applicationsQuery.data?.data?.content ?? []) as CourseTrainingApplication[];
    return content.filter(application => application.status === 'approved' && application.course_uuid);
  }, [applicationsQuery.data]);

  const distinctCourseUuids = useMemo(
    () =>
      Array.from(
        new Set(approvedApplications.map(application => application.course_uuid).filter(Boolean) as string[])
      ),
    [approvedApplications]
  );

  const courseQueries = useQueries({
    queries: distinctCourseUuids.map(uuid => ({
      ...getCourseByUuidOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const courseByUuid = useMemo(() => {
    const map = new Map<string, Course>();
    courseQueries.forEach((query, index) => {
      const course = extractEntity<Course>(query.data);
      const courseUuid = distinctCourseUuids[index];
      if (course && courseUuid) {
        map.set(courseUuid, course);
      }
    });
    return map;
  }, [courseQueries, distinctCourseUuids]);

  const rows = useMemo<ApprovedCourseRow[]>(() => {
    return distinctCourseUuids
      .map(courseUuid => {
        const course = courseByUuid.get(courseUuid);

        if (!course) return null;

        // Only include published + admin-approved courses
        if (!course.is_published || !course.admin_approved) {
          return null;
        }

        const category = getCourseCategory(course);
        const subject =
          course.category_names?.[1] ??
          course.category_names?.[0] ??
          '';

        const image =
          toAuthenticatedMediaUrl(
            course.banner_url ?? course.thumbnail_url
          ) ?? null;

        console.log(course, "COURSE")

        const rate = getCourseRate(course); // this rate should come from the ratecard of application to train

        return {
          rowKey: courseUuid,
          courseUuid,
          category,
          subject, // list of category_names from course - string array
          programType: null,
          displayName: course.name ?? 'Course',
          classLimit: course?.class_limit, // add class limit to table
          subjectLabel: subject || '—',
          durationLabel:
            formatDurationFromParts(
              course.duration_hours,
              course.duration_minutes,
              course.total_duration_display
            ) || 'Duration unavailable',
          rateLabel: rate === undefined ? '—' : currency.format(rate),
          image,
          status: 'Approved',
        };
      })
      .filter((row): row is ApprovedCourseRow => Boolean(row))
      .sort((left, right) =>
        left.displayName.localeCompare(right.displayName)
      );
  }, [courseByUuid, distinctCourseUuids]);

  console.log(rows, "ROWS")

  const filteredRows = useMemo(
    () => filterByCategoryTabs(rows, activeCategory, subjectByCategory),
    [activeCategory, rows, subjectByCategory]
  );


  const loading = applicationsQuery.isLoading || courseQueries.some(query => query.isLoading);

  const goToCourse = (courseUuid: string) => {
    router.push(`/dashboard/instructor/my-courses/${courseUuid}`);
  };

  const createClass = (courseUuid: string) => {
    router.push(`/dashboard/instructor/classes/new?id=${courseUuid}`);
  };

  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <PageHeader
        title='My Courses'
        description='Courses you have been approved to train.'
      />

      {loading ? (
        <div className='space-y-2'>
          {[...Array(6)].map((_, index) => (
            <Skeleton key={index} className='h-14 w-full' />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title='No approved courses yet'
          description='Once your training application is approved, the course will appear here.'
        />
      ) : (
        <>
          <CategoryTabs
            items={rows}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            subjectByCategory={subjectByCategory}
            onSubjectChange={setSubjectByCategory}
          />

          <div className='space-y-4'>
            <div className='sm:hidden'>
              {filteredRows.length === 0 ? (
                <div className='text-muted-foreground py-12 text-center'>No courses available.</div>
              ) : (
                <div className='divide-border divide-y rounded-lg border'>
                  {filteredRows.map(row => (
                    <div
                      key={row.rowKey}
                      role='button'
                      tabIndex={0}
                      onClick={() => goToCourse(row.courseUuid)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          goToCourse(row.courseUuid);
                        }
                      }}
                      className='hover:bg-muted/40 flex cursor-pointer items-start gap-3 p-3'
                    >
                      <CourseImage src={row.image} alt={row.displayName} />
                      <div className='min-w-0 flex-1 space-y-1.5'>
                        <div className='flex items-start justify-between gap-2'>
                          <span className='truncate font-medium'>{row.displayName}</span>
                          <Badge className='shrink-0'>{row.status}</Badge>
                        </div>
                        <p className='text-muted-foreground text-xs'>{row.subjectLabel}</p>
                        <div className='flex flex-wrap items-center gap-2'>
                          <Badge variant='outline' className='text-xs'>
                            {row.durationLabel}
                          </Badge>
                          <Badge variant='outline' className='text-xs'>
                            {row.rateLabel}
                          </Badge>
                        </div>
                        <div className='flex items-center justify-end'>
                          <CourseActions
                            onView={() => goToCourse(row.courseUuid)}
                            onCreateClass={() => createClass(row.courseUuid)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className='hidden overflow-x-auto rounded-lg border sm:block'>
              <Table className='min-w-[820px]'>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-24 whitespace-nowrap'>Image</TableHead>
                    <TableHead className='whitespace-nowrap'>Course</TableHead>
                    <TableHead className='min-w-[120px] whitespace-nowrap'>Subject</TableHead>
                    <TableHead className='whitespace-nowrap'>Duration</TableHead>
                    <TableHead className='text-right whitespace-nowrap'>Rate</TableHead>
                    <TableHead className='whitespace-nowrap'>Status</TableHead>
                    <TableHead className='text-right whitespace-nowrap'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className='text-muted-foreground h-24 text-center'>
                        No courses available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map(row => (
                      <TableRow
                        key={row.rowKey}
                        onClick={() => goToCourse(row.courseUuid)}
                        className='hover:bg-muted/50 cursor-pointer'
                      >
                        <TableCell className='whitespace-nowrap'>
                          <CourseImage src={row.image} alt={row.displayName} />
                        </TableCell>
                        <TableCell className='font-medium whitespace-nowrap'>
                          {row.displayName}
                        </TableCell>
                        <TableCell className='min-w-[120px] whitespace-nowrap'>
                          {row.subjectLabel}
                        </TableCell>
                        <TableCell className='whitespace-nowrap'>{row.durationLabel}</TableCell>
                        <TableCell className='text-right font-mono whitespace-nowrap'>
                          {row.rateLabel}
                        </TableCell>
                        <TableCell className='whitespace-nowrap'>
                          <Badge>{row.status}</Badge>
                        </TableCell>
                        <TableCell className='text-right whitespace-nowrap'>
                          <CourseActions
                            onView={() => goToCourse(row.courseUuid)}
                            onCreateClass={() => createClass(row.courseUuid)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
