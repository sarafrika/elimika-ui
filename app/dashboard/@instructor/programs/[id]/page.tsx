'use client';

import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '../../../../../components/ui/skeleton';
import { useBreadcrumb } from '../../../../../context/breadcrumb-provider';
import {
  getProgramCoursesOptions,
  getProgramEnrollmentsOptions,
  getTrainingProgramByUuidOptions,
} from '../../../../../services/client/@tanstack/react-query.gen';

export default function CourseDetailsPage() {
  const params = useParams();
  const programUuid = params?.id as string;
  const { replaceBreadcrumbs } = useBreadcrumb();

  const { data, isLoading: programLoading } = useQuery({
    ...getTrainingProgramByUuidOptions({ path: { uuid: programUuid } }),
    enabled: !!programUuid,
  });
  const program = data?.data;

  useEffect(() => {
    replaceBreadcrumbs([
      {
        id: 'dashboard',
        title: 'Dashboard',
        url: '/dashboard/overview',
      },
      {
        id: 'courses',
        title: 'Courses',
        url: '/dashboard/courses',
      },
      {
        id: 'program-details',
        title: program?.title,
        url: `/dashboard/programs/${program?.uuid}`,
      },
    ]);
  }, [replaceBreadcrumbs, programUuid, program]);

  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'enrollments'>('overview');

  const { data: programCourses, isLoading: coursesLoading } = useQuery({
    ...getProgramCoursesOptions({ path: { programUuid } }),
    enabled: !!programUuid,
  });

  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    ...getProgramEnrollmentsOptions({
      path: { programUuid },
      query: { pageable: {} },
    }),
    enabled: !!programUuid,
  });

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
    <div className='p-6'>
      {/* Header */}
      <div className='mb-6'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='mb-2 flex items-center gap-3'>
              <h1 className='text-foreground text-2xl font-bold'>{program?.title}</h1>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusClasses(
                  program?.status
                )}`}
              >
                {program?.status}
              </span>
            </div>

            {program?.program_type && (
              <p className='text-muted-foreground mb-2 text-sm'>{program?.program_type}</p>
            )}

            <p className='text-muted-foreground'>{program?.description}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className='mb-6 grid gap-4 md:grid-cols-4'>
        {[
          { label: 'Total Courses', value: courses.length },
          { label: 'Enrolled Students', value: enrollments.length },
          {
            label: 'Available Spots',
            value: program?.class_limit - enrollments.length,
          },
          { label: 'Price', value: `KES ${program?.price}` },
        ].map(stat => (
          <div key={stat.label} className='border-border bg-card rounded-lg border p-4'>
            <div className='text-muted-foreground text-sm'>{stat.label}</div>
            <div className='text-foreground text-2xl font-bold'>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className='border-border mb-6 border-b'>
        <div className='flex gap-6'>
          {(['overview', 'courses', 'enrollments'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-1 py-3 font-medium ${
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
        <div className='space-y-6'>
          {[
            { title: 'Learning Objectives', value: program?.objectives },
            { title: 'Prerequisites', value: program?.prerequisites },
          ].map(section => (
            <div key={section.title} className='border-border bg-card rounded-lg border p-6'>
              <h3 className='text-foreground mb-4 text-lg font-semibold'>{section.title}</h3>
              <p className='text-muted-foreground whitespace-pre-wrap'>
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
            <div className='text-muted-foreground text-center'>Loading courses…</div>
          ) : courses.length === 0 ? (
            <div className='border-border rounded-lg border-2 border-dashed py-12 text-center'>
              <div className='mb-2 text-4xl'>📖</div>
              <p className='text-muted-foreground'>No courses added to this program yet</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {courses.map((course, index) => (
                <div key={course.uuid} className='border-border bg-card rounded-lg border p-5'>
                  <div className='flex gap-4'>
                    <div className='bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg font-semibold'>
                      {index + 1}
                    </div>
                    <div className='flex-1'>
                      <h4 className='text-foreground mb-1 font-semibold'>
                        {course.name || 'Untitled Course'}
                      </h4>
                      <div className='flex flex-wrap gap-2 text-sm'>
                        {course.is_required && (
                          <span className='bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-xs font-medium'>
                            Required
                          </span>
                        )}

                        <span
                          className='text-muted-foreground line-clamp-3'
                          dangerouslySetInnerHTML={{ __html: course.description }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Enrollments */}
      {activeTab === 'enrollments' && (
        <div>
          {enrollmentsLoading ? (
            <div className='text-muted-foreground text-center'>Loading enrollments…</div>
          ) : enrollments.length === 0 ? (
            <div className='border-border rounded-lg border-2 border-dashed py-12 text-center'>
              <div className='mb-2 flex items-center justify-center self-center text-4xl'>
                <Users />
              </div>
              <p className='text-muted-foreground'>No students enrolled yet</p>
            </div>
          ) : (
            <div className='border-border bg-card rounded-lg border'>
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
                  {enrollments.map((e: any) => (
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
                        {e.enrollment_date || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
