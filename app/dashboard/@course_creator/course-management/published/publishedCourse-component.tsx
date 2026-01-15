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
  searchCoursesOptions,
  searchCoursesQueryKey,
  unpublishCourseMutation,
  unpublishCourseQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EyeIcon, FilePenIcon, MoreVertical, TrashIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function PublishedCoursesComponent({
  courseCreatorId,
}: {
  courseCreatorId?: string;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
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

  // GET PUBLISHED INSTRUCTOR'S COURSES
  const { data, isFetched } = useQuery({
    ...searchCoursesOptions({
      query: {
        searchParams: { status: 'published', course_creator_uuid_eq: courseCreatorId },
        pageable: { page, size },
      },
    }),
    enabled: !!courseCreatorId,
  });

  // UNPUBLISH COURSE MUTATION
  const unpublishCourse = useMutation(unpublishCourseMutation());
  const handleUnpublish = (uuid: string) => {
    if (!courseCreatorId) return;
    unpublishCourse.mutate(
      {
        path: { uuid: uuid },
      },
      {
        onSuccess(data) {
          if (!data?.success) {
            toast.error(
              typeof data?.error === 'string'
                ? data.error
                : 'An error occurred while unpublishing the course.'
            );
            return;
          }

          if (data?.success) {
            toast.success(data?.message);
            queryClient.invalidateQueries({
              queryKey: unpublishCourseQueryKey({ path: { uuid: data?.data?.uuid as string } }),
            });
            queryClient.invalidateQueries({
              queryKey: searchCoursesQueryKey({
                query: {
                  searchParams: { status: 'published', course_creator_uuid_eq: courseCreatorId },
                  pageable: { page, size },
                },
              }),
            });
            router.push('/dashboard/course-management/drafts');
          }
        },
      }
    );
  };

  const publishedCourses = data?.data?.content || [];
  const paginationMetadata = data?.data?.metadata || {};

  return (
    <div className='mx-auto w-full max-w-6xl space-y-6 px-4 py-10'>
      <div className='mb-6 flex items-end justify-between'>
        <div>
          <p className='text-muted-foreground mt-2 max-w-2xl text-sm'>
            You have {publishedCourses?.length} published course
            {publishedCourses?.length > 1 ? 's' : ''}.
          </p>
        </div>
      </div>

      {!isFetched && (
        <div className='flex flex-col gap-4 text-[12px] sm:text-[14px]'>
          <div className='bg-muted h-20 w-full animate-pulse rounded'></div>
          <div className='bg-muted h-16 w-full animate-pulse rounded'></div>
          <div className='bg-muted h-12 w-full animate-pulse rounded'></div>
        </div>
      )}

      {isFetched && publishedCourses?.length === 0 && (
        <div className='bg-muted/20 rounded-md  py-12 text-center'>
          <FilePenIcon className='text-muted-foreground mx-auto h-8 w-8' />
          <h3 className='mt-4 text-md font-medium'>No published courses</h3>
          <p className='text-muted-foreground mt-2 text-sm'>
            You don&apos;t have any published courses yet.
          </p>
        </div>
      )}


      <Card>
        <CardHeader className='border-border/50 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <CardTitle className='text-base font-semibold'>Published Courses</CardTitle>
            <CardDescription>
              {publishedCourses.length} draft course{publishedCourses.length === 1 ? '' : 's'} owned by this creator.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className='p-0' >

          {publishedCourses?.length >= 1 && (
            <div className='bg-card border-border/50 rounded-t-0 overflow-hidden rounded-t-lg '>
              <Table>
                {/* <TableCaption className='py-4'>A list of your published courses</TableCaption> */}
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

                <TableBody>
                  {publishedCourses?.map((course: any) => (
                    <TableRow key={course.uuid}  >
                      {/* <TableHead>
                    <Square size={20} strokeWidth={1} className='mx-auto flex self-center' />
                  </TableHead> */}

                      <TableCell className='py-1'>
                        <Image
                          src={course?.thumbnail_url as string}
                          alt='thumbnail'
                          width={48}
                          height={48}
                          className='min-h-12 min-w-12 rounded-md bg-muted-foreground/30'
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
                              <Badge key={name} className='rounded-full capitalize bg-muted/70 text-black dark:text-white'>
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
                              onClick={() => handleUnpublish(course.uuid)}
                            >
                              <TrashIcon className='mr-2 h-4 w-4' />
                              Unpublish
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
