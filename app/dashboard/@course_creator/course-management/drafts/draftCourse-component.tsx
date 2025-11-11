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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { formatCourseDate } from '@/lib/format-course-date';
import {
  deleteCourseMutation,
  searchCoursesOptions,
  searchCoursesQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EyeIcon,
  MoreVertical,
  PenIcon,
  PlusIcon,
  Square,
  TrashIcon
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CustomEmptyState } from '../../_components/loading-state';

export default function DraftCoursesComponent({ courseCreatorId }: { courseCreatorId?: string }) {
  const queryClient = useQueryClient();
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'course-management',
        title: 'Course-management',
        url: '/dashboard/course-management/drafts',
      },
      {
        id: 'drafts',
        title: 'Drafts',
        url: '/dashboard/course-management/drafts',
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const size = 20;
  const [page, setPage] = useState(0);

  // GET PUBLISHED INSTRUCTOR'S COURSES
  const { data, isFetched } = useQuery({
    ...searchCoursesOptions({
      query: {
        searchParams: { status: 'draft', course_creator_uuid_eq: courseCreatorId },
        pageable: { page, size },
      },
    }),
    enabled: !!courseCreatorId,
  });

  // DELETE COURSE MUTATION
  const DeleteCourse = useMutation(deleteCourseMutation());
  const handleDeleteCourse = async (courseId: string) => {
    if (!courseId || !courseCreatorId) return;

    try {
      await DeleteCourse.mutateAsync(
        {
          path: { uuid: courseId },
        },
        {
          onSuccess: () => {
            toast.success('Course deleted succcessfully');
            queryClient.invalidateQueries({
              queryKey: searchCoursesQueryKey({
                query: {
                  searchParams: { status: 'draft', course_creator_uuid_eq: courseCreatorId },
                  pageable: { page, size },
                },
              }),
            });
          },
        }
      );
    } catch (err) { }
  };

  const draftCourses = data?.data?.content || [];
  const paginationMetadata = data?.data?.metadata;

  return (
    <div className='space-y-6'>
      <div className='mb-6 flex items-end justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Your Draft Courses</h1>
          <p className='text-muted-foreground mt-1 text-base'>
            You have {draftCourses?.length} course
            {draftCourses?.length > 1 ? 's' : ''} waiting to be published.
          </p>
        </div>
        <Button type='button' className='cursor-pointer px-4 py-2 text-sm' asChild>
          <Link href='/dashboard/course-management/create-new-course'>
            <PlusIcon className='h-4 w-4' />
            New Course
          </Link>
        </Button>
      </div>

      {!isFetched && (
        <div className='flex flex-col gap-4 text-[12px] sm:text-[14px]'>
          <div className='h-20 w-full animate-pulse rounded bg-gray-200'></div>
          <div className='h-16 w-full animate-pulse rounded bg-gray-200'></div>
          <div className='h-12 w-full animate-pulse rounded bg-gray-200'></div>
        </div>
      )}

      {isFetched && draftCourses?.length === 0 && (
        <>
          <CustomEmptyState
            headline='No draft courses'
            subHeading=' You don&apos;t have any draft courses. Start by creating a new course to get started.'
          />
          {/* <Button className='mt-4' asChild>
            <Link href='/dashboard/course-management/create-new-course'>
              Create Your First Course
            </Link>
          </Button> */}
        </>
      )}

      {draftCourses?.length >= 1 && (
        <div className='overflow-hidden rounded-t-lg border border-gray-200'>
          <Table>
            {/* <TableCaption className='py-4'>A list of your course drafts</TableCaption> */}
            <TableHeader className='bg-stone-50'>
              <TableRow>
                <TableHead>
                  <Square size={20} strokeWidth={1} className='mx-auto flex self-center' />
                </TableHead>
                <TableHead></TableHead>
                <TableHead>Course Name</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Class Limit</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className='mx-auto text-center'>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              <>
                {draftCourses?.map((course: any) => (
                  <TableRow key={course.uuid} className='bg-white'>
                    <TableHead>
                      <Square size={20} strokeWidth={1} className='mx-auto flex self-center' />
                    </TableHead>

                    <TableCell className='py-2'>
                      <Image
                        src={(course?.thumbnail_url as string) || '/illustration.png'}
                        alt='thumbnail'
                        width={48}
                        height={48}
                        className='min-h-12 min-w-12 rounded-md bg-stone-300'
                      />
                    </TableCell>

                    <TableCell className='font-medium'>
                      <div>
                        <div className='max-w-[270px] truncate'>{course.name}</div>
                        <RichTextRenderer htmlString={course?.description} maxChars={42} />{' '}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex max-w-[250px] flex-wrap gap-1'>
                        {Array.isArray(course.category_names) &&
                          course.category_names.map((name: string) => (
                            <Badge key={name} variant='default' className='capitalize rounded-full'>
                              {name}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell>{course.class_limit || 'Unlimited'}</TableCell>
                    <TableCell>{formatCourseDate(course.updated_date)}</TableCell>
                    <TableCell className='text-center'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon'>
                            <span className='sr-only'>Open menu</span>
                            <MoreVertical className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem>
                            <Link
                              href={`/dashboard/course-management/create-new-course?id=${course.uuid}`}
                              className='flex w-full items-center'
                            >
                              <PenIcon className='focus:text-primary-foreground mr-2 h-4 w-4' />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link
                              href={`/dashboard/course-management/preview/${course.uuid}`}
                              className='flex w-full items-center'
                            >
                              <EyeIcon className='focus:text-primary-foreground mr-2 h-4 w-4' />
                              Preview
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant='destructive'
                            onClick={() => handleDeleteCourse(course?.uuid)}
                          >
                            <TrashIcon className='mr-2 h-4 w-4' />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            </TableBody>
          </Table>
        </div>
      )}

      {/* @ts-ignore */}
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
