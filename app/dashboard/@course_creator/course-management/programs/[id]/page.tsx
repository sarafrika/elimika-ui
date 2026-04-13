'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { cn } from '@/lib/utils';
import {
  getProgramCoursesOptions,
  getProgramEnrollmentsOptions,
  getTrainingProgramByUuidOptions,
  publishProgramMutation,
} from '@/services/client/@tanstack/react-query.gen';
import Spinner from '../../../../../../components/ui/spinner';

type ProgramCourseItem = {
  uuid?: string;
  name?: string;
  description?: string;
  is_required?: boolean;
  category_names?: string[];
};

type ProgramEnrollmentItem = {
  uuid?: string;
  student_uuid: string;
  student_name?: string;
  status?: string;
  enrollment_date?: string | Date;
};

type ProgramPreviewProps = {
  onEdit?: () => void;
};

const ProgramPreview = ({ onEdit: _onEdit }: ProgramPreviewProps) => {
  const router = useRouter();
  const params = useParams();
  const programUuid = typeof params?.id === 'string' ? params.id : undefined;

  const { replaceBreadcrumbs } = useBreadcrumb();

  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'enrollments'>('overview');
  const [selectedCourseCategory, setSelectedCourseCategory] = useState('all');

  const { data, isLoading: programLoading } = useQuery({
    ...getTrainingProgramByUuidOptions({ path: { uuid: programUuid as string } }),
    enabled: !!programUuid,
  });
  const program = data?.data;

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'programs',
        title: 'Programs',
        url: '/dashboard/course-management/all?type=programs',
      },
      {
        id: 'program-details',
        title: `${program?.title}`,
        url: `/dashboard/course-management/programs/${program?.uuid}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs]);

  const { data: programCourses, isLoading: coursesLoading } = useQuery({
    ...getProgramCoursesOptions({ path: { programUuid: programUuid as string } }),
    enabled: !!programUuid,
  });

  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    ...getProgramEnrollmentsOptions({
      path: { programUuid: programUuid as string },
      query: { pageable: {} },
    }),
    enabled: !!programUuid,
  });

  const publishProgramMut = useMutation(publishProgramMutation());
  const handlePublishProgram = () => {
    publishProgramMut.mutate(
      { path: { uuid: programUuid as string } },
      {
        onSuccess: data => {
          toast.success(data?.message);
        },
      }
    );
  };

  if (programLoading) {
    return (
      <div className='flex h-96 items-center justify-center'>
        <div className='w-full max-w-lg space-y-4'>
          <Skeleton className='mx-auto h-6 w-2/3' />
          <Skeleton className='mx-auto h-4 w-1/2' />

          <div className='space-y-3 pt-4'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-11/12' />
            <Skeleton className='h-4 w-10/12' />
          </div>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className='flex h-96 items-center justify-center'>
        <div className='text-muted-foreground'>Program not found</div>
      </div>
    );
  }

  const enrollments = enrollmentsData?.data?.content || [];
  const courses = programCourses?.data || [];
  const availableCourseCategories = useMemo(() => {
    const categories = new Set<string>();

    (courses as ProgramCourseItem[]).forEach(course => {
      course.category_names?.forEach(category => {
        if (category) {
          categories.add(category);
        }
      });
    });

    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }, [courses]);
  const filteredCourses = useMemo(
    () =>
      (courses as ProgramCourseItem[]).filter(
        course =>
          selectedCourseCategory === 'all' ||
          course.category_names?.includes(selectedCourseCategory) === true
      ),
    [courses, selectedCourseCategory]
  );

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-primary/10 text-primary';
      case 'DRAFT':
        return 'bg-muted text-foreground';
      case 'ARCHIVED':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className=''>
      {/* Header */}
      <div className='mb-4 md:mb-6'>
        <button
          onClick={() => router.push('/dashboard/course-management/all?type=programs')}
          className='mb- text-primary flex items-center gap-2 py-4 text-sm hover:underline md:mb-4 md:text-base'
        >
          ← Back
        </button>

        <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4'>
          <div className='flex-1'>
            <div className='mb-2 flex flex-col gap-2 md:flex-row md:items-center md:gap-3'>
              <h1 className='text-foreground text-xl font-bold md:text-2xl'>{program?.title}</h1>
              <span
                className={`self-start rounded-full px-2.5 py-0.5 text-xs font-medium md:px-3 md:py-1 md:text-sm ${getStatusClasses(
                  program?.status
                )}`}
              >
                {program?.status}
              </span>
            </div>

            {program?.program_type && (
              <p className='text-muted-foreground mb-1.5 text-xs md:mb-2 md:text-sm'>
                {program?.program_type}
              </p>
            )}

            <p className='text-muted-foreground text-sm md:text-base'>{program?.description}</p>
          </div>

          {/* <Button
            onClick={() => onEdit(program)}
            className='bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-lg px-4 py-2 text-sm font-medium md:w-auto md:text-base'
          >
            <Pen /> Edit
          </Button> */}

          {!program.published && (
            <Button
              size={'sm'}
              variant={'ghost'}
              onClick={handlePublishProgram}
              className='border-border min-w-[120px] border'
            >
              {publishProgramMut.isPending ? <Spinner /> : 'Pubish'}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className='mb-4 grid grid-cols-2 gap-2 md:mb-6 md:grid-cols-4 md:gap-4'>
        {[
          { label: 'Total Courses', value: courses.length },
          { label: 'Enrolled Students', value: enrollments.length },
          {
            label: 'Available Spots',
            value: (program?.class_limit ?? 0) - enrollments.length,
          },
          { label: 'Price', value: `KES ${program?.price}` },
        ].map(stat => (
          <div key={stat.label} className='border-border bg-card rounded-lg border p-3 md:p-4'>
            <div className='text-muted-foreground text-xs md:text-sm'>{stat.label}</div>
            <div className='text-foreground text-lg font-bold md:text-2xl'>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className='border-border mb-4 border-b md:mb-6'>
        <div className='flex gap-3 overflow-x-auto md:gap-6'>
          {(['overview', 'courses', 'enrollments'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap md:py-3 md:text-base ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'courses' && ` (${courses.length})`}
              {tab === 'enrollments' && ` (${enrollments.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className='space-y-4 md:space-y-6'>
          {[
            { title: 'Learning Objectives', value: program?.objectives },
            { title: 'Prerequisites', value: program?.prerequisites },
          ].map(section => (
            <div key={section.title} className='border-border bg-card rounded-lg border p-4 md:p-6'>
              <h3 className='text-foreground mb-3 text-base font-semibold md:mb-4 md:text-lg'>
                {section.title}
              </h3>
              <p className='text-muted-foreground text-sm whitespace-pre-wrap md:text-base'>
                {section.value || `No ${section.title.toLowerCase()} specified`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Courses */}
      {activeTab === 'courses' && (
        <div>
          {coursesLoading ? (
            <div className='text-muted-foreground py-8 text-center text-sm md:text-base'>
              Loading courses…
            </div>
          ) : courses.length === 0 ? (
            <div className='border-border rounded-lg border-2 border-dashed py-8 text-center md:py-12'>
              <div className='mb-2 text-3xl md:text-4xl'>📖</div>
              <p className='text-muted-foreground text-sm md:text-base'>
                No courses added to this program yet
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='flex flex-wrap gap-2'>
                <Button
                  variant={selectedCourseCategory === 'all' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setSelectedCourseCategory('all')}
                >
                  All categories
                </Button>
                {availableCourseCategories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCourseCategory === category ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setSelectedCourseCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {filteredCourses.length === 0 ? (
                <div className='border-border rounded-lg border-2 border-dashed py-8 text-center md:py-12'>
                  <p className='text-muted-foreground text-sm md:text-base'>
                    No courses match this category filter
                  </p>
                </div>
              ) : (
                <div className='space-y-2 md:space-y-3'>
                  {filteredCourses.map((course, index) => (
                    <div
                      key={course.uuid}
                      className='border-border bg-card rounded-lg border p-3 md:p-5'
                    >
                      <div className='flex gap-3 md:gap-4'>
                        <div className='bg-primary/10 text-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-semibold md:h-10 md:w-10 md:text-base'>
                          {index + 1}
                        </div>
                        <div className='min-w-0 flex-1'>
                          <h4 className='text-foreground mb-1 text-sm font-semibold md:text-base'>
                            {course.name || 'Untitled Course'}
                          </h4>
                          <div className='mb-2 flex flex-wrap gap-1.5 md:gap-2'>
                            {course.is_required && (
                              <span className='bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-[10px] font-medium md:text-xs'>
                                Required
                              </span>
                            )}
                            {course.category_names?.map(category => (
                              <span
                                key={`${course.uuid}-${category}`}
                                className={cn(
                                  'bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium md:text-xs'
                                )}
                              >
                                {category}
                              </span>
                            ))}
                          </div>

                          <span
                            className='text-muted-foreground line-clamp-3 text-xs md:text-sm'
                            dangerouslySetInnerHTML={{ __html: course.description ?? '' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Enrollments */}
      {activeTab === 'enrollments' && (
        <div>
          {enrollmentsLoading ? (
            <div className='text-muted-foreground py-8 text-center text-sm md:text-base'>
              Loading enrollments…
            </div>
          ) : enrollments.length === 0 ? (
            <div className='border-border rounded-lg border-2 border-dashed py-8 text-center md:py-12'>
              <div className='mb-2 flex items-center justify-center self-center text-3xl md:text-4xl'>
                <Users />
              </div>
              <p className='text-muted-foreground text-sm md:text-base'>No students enrolled yet</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className='space-y-2 md:hidden'>
                {(enrollments as ProgramEnrollmentItem[]).map(e => (
                  <div key={e.uuid} className='border-border bg-card rounded-lg border p-3'>
                    <div className='mb-2 flex items-start justify-between gap-2'>
                      <div className='min-w-0 flex-1'>
                        <p className='text-foreground truncate text-sm font-semibold'>
                          {e.student_name || e.student_uuid}
                        </p>
                      </div>
                      <span className='bg-primary/10 text-primary flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium'>
                        {e.status || 'Active'}
                      </span>
                    </div>
                    <p className='text-muted-foreground text-xs'>
                      Enrolled: {e.enrollment_date ? String(e.enrollment_date) : 'N/A'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className='border-border bg-card hidden rounded-lg border md:block'>
                <table className='w-full'>
                  <thead className='border-border bg-muted border-b'>
                    <tr>
                      {['Student', 'Status', 'Enrolled Date'].map(h => (
                        <th
                          key={h}
                          className='text-muted-foreground px-6 py-3 text-left text-sm font-medium'
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className='divide-border divide-y'>
                    {(enrollments as ProgramEnrollmentItem[]).map(e => (
                      <tr key={e.uuid}>
                        <td className='text-foreground px-6 py-4 text-sm'>
                          {e.student_name || e.student_uuid}
                        </td>
                        <td className='px-6 py-4'>
                          <span className='bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium'>
                            {e.status || 'Active'}
                          </span>
                        </td>
                        <td className='text-muted-foreground px-6 py-4 text-sm'>
                          {e.enrollment_date ? String(e.enrollment_date) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgramPreview;
