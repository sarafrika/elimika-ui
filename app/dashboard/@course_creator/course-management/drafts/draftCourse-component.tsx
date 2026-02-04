'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { CustomPagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  TableRow,
} from '@/components/ui/table';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { formatCourseDate } from '@/lib/format-course-date';
import {
  deleteCourseMutation,
  searchCoursesOptions,
  searchCoursesQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EyeIcon, MoreVertical, PenIcon, PlusCircle, TrashIcon } from 'lucide-react';
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
                  searchParams: { course_creator_uuid_eq: courseCreatorId },
                  pageable: { page, size },
                },
              }),
            });
          },
        }
      );
    } catch (_err) { }
  };

  const draftCourses = data?.data?.content || [];
  const paginationMetadata = data?.data?.metadata;

  return (
    <div className='mx-auto w-full max-w-6xl space-y-6 px-4 py-10'>
      <div className='mb-6 flex items-end justify-between'>
        <div>
          <p className='text-muted-foreground mt-2 max-w-2xl text-sm'>
            You have {draftCourses?.length} course
            {draftCourses?.length > 1 ? 's' : ''} waiting to be published.
          </p>
        </div>
        <Button asChild>
          <Link prefetch href='/dashboard/course-management/create-new-course'>
            <PlusCircle className='mr-2 h-4 w-4' />
            Create course
          </Link>
        </Button>
      </div>

      {!isFetched && (
        <Card>
          <CardHeader className='border-border/50 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='space-y-2'>
              <div className='bg-muted h-5 w-32 animate-pulse rounded'></div>
              <div className='bg-muted h-4 w-48 animate-pulse rounded'></div>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Class Limit</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className='mx-auto text-center'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell className='py-1'>
                      <div className='bg-muted h-12 w-12 animate-pulse rounded-md'></div>
                    </TableCell>
                    <TableCell>
                      <div className='space-y-2'>
                        <div className='bg-muted h-4 w-48 animate-pulse rounded'></div>
                        <div className='bg-muted h-3 w-32 animate-pulse rounded'></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-1'>
                        <div className='bg-muted h-5 w-16 animate-pulse rounded-full'></div>
                        <div className='bg-muted h-5 w-20 animate-pulse rounded-full'></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='bg-muted h-4 w-20 animate-pulse rounded'></div>
                    </TableCell>
                    <TableCell>
                      <div className='bg-muted h-4 w-24 animate-pulse rounded'></div>
                    </TableCell>
                    <TableCell className='text-center'>
                      <div className='bg-muted mx-auto h-8 w-8 animate-pulse rounded'></div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {isFetched && draftCourses?.length === 0 && (
        <>
          <CustomEmptyState
            headline='No draft courses'
            subHeading=" You don't have any draft courses. Start by creating a new course to get started."
          />
          {/* <Button className='mt-4' asChild>
            <Link href='/dashboard/course-management/create-new-course'>
              Create Your First Course
            </Link>
          </Button> */}
        </>
      )}

      <Card>
        <CardHeader className='border-border/50 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <CardTitle className='text-base font-semibold'>Draft Courses</CardTitle>
            <CardDescription>
              {draftCourses.length} draft course{draftCourses.length === 1 ? '' : 's'} owned by this
              creator.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className='p-0'>
          {draftCourses?.length >= 1 && (
            <div className='bg-card border-border/50 rounded-t-0 overflow-hidden rounded-t-lg'>
              <Table>
                {/* <TableCaption className='py-4'>A list of your course drafts</TableCaption> */}
                <TableHeader className=''>
                  <TableRow>
                    {/* <TableHead>
                  <Square size={20} strokeWidth={1} className='mx-auto flex self-center' />
                </TableHead> */}
                    <TableHead></TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Class Limit</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className='mx-auto text-center'>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className='pb-12'>
                  {draftCourses?.map((course: any) => (
                    <TableRow key={course.uuid}>
                      {/* <TableHead>
                    <Square size={20} strokeWidth={1} className='mx-auto flex self-center' />
                  </TableHead> */}

                      <TableCell className='py-1'>
                        <Image
                          src={(course?.thumbnail_url as string) || '/illustration.png'}
                          alt='thumbnail'
                          width={48}
                          height={48}
                          className='bg-muted-foreground/30 min-h-12 min-w-12 rounded-md'
                        />
                      </TableCell>

                      <TableCell className='font-medium'>
                        <div>
                          <h1 className='max-w-[270px] truncate'>{course.name}</h1>
                          <div className='text-muted-foreground text-xs'>
                            <RichTextRenderer htmlString={course?.description} maxChars={42} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex max-w-[250px] flex-wrap gap-1'>
                          {Array.isArray(course.category_names) &&
                            course.category_names.map((name: string) => (
                              <Badge
                                key={name}
                                className='bg-muted/70 rounded-full text-black capitalize dark:text-white'
                              >
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
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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