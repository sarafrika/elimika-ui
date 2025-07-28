'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { CustomPagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Spinner from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { formatCourseDate } from '@/lib/format-course-date';
import { searchCourses, unpublishCourse } from '@/services/client';
import {
  getCourseByUuidQueryKey,
  getCoursesByInstructorQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EyeIcon, FilePenIcon, TrashIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function PublishedCoursesPage() {
  const queryClient = useQueryClient();
  const instructor = useInstructor();
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'course-management',
        title: 'Course-management',
        url: '/dashboard/course-management/published',
      },
      {
        id: 'published',
        title: 'Published',
        url: '/dashboard/course-management/published',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const size = 20;
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [getCoursesByInstructorQueryKey, instructor?.uuid, page, size],
    queryFn: () =>
      searchCourses({
        query: {
          page,
          size,
          // @ts-ignore
          status: 'published',
          instructor_uuid_eq: instructor?.uuid as string,
        },
      }).then(res => res.data),
  });

  const { mutate: unpublishCourseMutation, isPending } = useMutation({
    mutationKey: [getCourseByUuidQueryKey],
    mutationFn: ({ uuid }: { uuid: string }) => unpublishCourse({ path: { uuid } }),
    onSettled(data) {
      const errorObj = data?.error
      const dataObj = data?.data

      if (errorObj) {
        // @ts-ignore
        toast.error(errorObj?.message, errorObj?.error)
        return
      }

      if (dataObj) {
        toast.success(dataObj?.message)
      }
    },

  });

  const publishedCourses = data?.data?.content || [];
  const paginationMetadata = data?.data?.metadata || {};

  return (
    <div className='space-y-6'>
      <div className='mb-6 flex items-end justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Your Published Courses</h1>
          <p className='text-muted-foreground mt-1 text-base'>
            You have {publishedCourses?.length} published course
            {publishedCourses?.length > 1 ? 's' : ''}.
          </p>
        </div>
      </div>

      {!isFetching && !isLoading && publishedCourses?.length === 0 ? (
        <div className='bg-muted/20 rounded-md border py-12 text-center'>
          <FilePenIcon className='text-muted-foreground mx-auto h-12 w-12' />
          <h3 className='mt-4 text-lg font-medium'>No published courses</h3>
          <p className='text-muted-foreground mt-2'>
            You don&apos;t have any published courses yet.
          </p>
        </div>
      ) : (
        <Table>
          <TableCaption>A list of your published courses</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead className='w-[300px]'>Course Name</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Class Limit</TableHead>
              <TableHead>Published Date</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching || isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className='py-6'>
                  <div className='flex w-full items-center justify-center'>
                    <Spinner />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {publishedCourses?.map((course: any) => (
                  <TableRow key={course.uuid}>
                    <TableCell>
                      <Image src={course?.thumbnail_url as string} alt="thumbnail" width={48} height={48} className='rounded-md bg-stone-300 min-h-12 min-w-12' />
                    </TableCell>
                    <TableCell className='font-medium'>
                      <div>
                        <div className='max-w-[270px] truncate'>{course.name}</div>
                        <RichTextRenderer htmlString={course?.description} maxChars={42} />{' '}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex max-w-[250px] flex-wrap gap-1'>
                        {course.category_names.map((i: any) => (
                          <Badge key={i} variant='default' className='capitalize'>
                            {i}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{course.class_limit}</TableCell>
                    <TableCell>{formatCourseDate(course.created_date)}</TableCell>
                    <TableCell className='text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon'>
                            <span className='sr-only'>Open menu</span>
                            <svg
                              width='15'
                              height='15'
                              viewBox='0 0 15 15'
                              fill='none'
                              xmlns='http://www.w3.org/2000/svg'
                              className='h-4 w-4'
                            >
                              <path
                                d='M8.625 2.5C8.625 3.12132 8.12132 3.625 7.5 3.625C6.87868 3.625 6.375 3.12132 6.375 2.5C6.375 1.87868 6.87868 1.375 7.5 1.375C8.12132 1.375 8.625 1.87868 8.625 2.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM7.5 13.625C8.12132 13.625 8.625 13.1213 8.625 12.5C8.625 11.8787 8.12132 11.375 7.5 11.375C6.87868 11.375 6.375 11.8787 6.375 12.5C6.375 13.1213 6.87868 13.625 7.5 13.625Z'
                                fill='currentColor'
                                fillRule='evenodd'
                                clipRule='evenodd'
                              ></path>
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem>
                            <Link
                              href={`/dashboard/course-management/preview/${course.uuid}`}
                              className='flex w-full items-center'
                            >
                              <EyeIcon className='focus:text-primary-foreground mr-2 h-4 w-4' />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant='destructive'
                            onClick={() => unpublishCourseMutation({ uuid: course.uuid })}
                          >
                            <TrashIcon className='mr-2 h-4 w-4' />
                            Unpublish
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      )}

      {/*  @ts-ignore */}
      {paginationMetadata?.totalPages >= 1 && (
        <CustomPagination
          totalPages={paginationMetadata?.totalPages as number}
          onPageChange={page => {
            setPage(page - 1);
          }}
        />
      )}
    </div>
  );
}
