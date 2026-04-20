'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import {
  getProgramCoursesOptions,
  getTrainingProgramByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, CalendarDays, Layers3, Target, Users } from 'lucide-react';
import { useEffect } from 'react';
import { EnrollmentLoadingState } from '../components/EnrollmentLoadingState';

type ProgramDetailsPageProps = {
  programId: string;
};

export default function ProgramDetailsPage({ programId }: ProgramDetailsPageProps) {
  const { activeDomain } = useUserDomain();
  const { replaceBreadcrumbs } = useBreadcrumb();

  const { data: programResponse, isLoading: programLoading } = useQuery({
    ...getTrainingProgramByUuidOptions({ path: { uuid: programId } }),
    enabled: Boolean(programId),
  });

  const { data: programCoursesResponse, isLoading: coursesLoading } = useQuery({
    ...getProgramCoursesOptions({ path: { programUuid: programId } }),
    enabled: Boolean(programId),
  });

  const program = programResponse?.data;
  const programCourses = programCoursesResponse?.data ?? [];

  useEffect(() => {
    if (!programId) return;

    replaceBreadcrumbs([
      {
        id: 'dashboard',
        title: 'Dashboard',
        url: buildWorkspaceAliasPath(activeDomain, '/dashboard/overview'),
      },
      {
        id: 'courses',
        title: 'Browse Courses',
        url: buildWorkspaceAliasPath(activeDomain, '/dashboard/courses'),
      },
      {
        id: 'program-details',
        title: program?.title || 'Program details',
        url: buildWorkspaceAliasPath(activeDomain, `/dashboard/courses/programs/${programId}`),
      },
    ]);
  }, [activeDomain, program?.title, programId, replaceBreadcrumbs]);

  if (programLoading || coursesLoading) {
    return (
      <EnrollmentLoadingState
        title='Loading your program details'
        description='We are gathering the program overview, included courses, and enrollment information so everything is ready when the page opens.'
      />
    );
  }

  if (!program) {
    return (
      <Card className='mx-auto max-w-3xl rounded-[24px] border-dashed p-8 text-center shadow-none'>
        <CardContent className='space-y-3 p-0'>
          <Layers3 className='text-muted-foreground mx-auto h-10 w-10' />
          <h1 className='text-xl font-semibold'>Program not found</h1>
          <p className='text-muted-foreground text-sm'>
            The program you are trying to open could not be found.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='mx-auto mb-24 min-h-screen w-full max-w-[1680px] space-y-6'>
      <section className='border-border bg-card relative overflow-hidden rounded-[24px] border px-5 py-6 sm:px-6 lg:px-8'>
        <div className='from-primary/10 via-background absolute inset-0 bg-gradient-to-br to-transparent' />
        <div className='relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]'>
          <div className='space-y-6'>
            <div className='flex flex-wrap items-center gap-2'>
              {program.program_type ? <Badge variant='outline'>{program.program_type}</Badge> : null}
              {program.status ? <Badge>{program.status}</Badge> : null}
              <Badge variant='secondary'>{programCourses.length} course{programCourses.length === 1 ? '' : 's'}</Badge>
            </div>

            <div className='space-y-3'>
              <h1 className='text-foreground text-[clamp(2rem,3vw,3.2rem)] font-semibold tracking-[-0.04em]'>
                {program.title}
              </h1>
              <div className='text-muted-foreground max-w-4xl text-sm leading-7 sm:text-base'>
                <RichTextRenderer htmlString={program.description ?? ''} />
              </div>
            </div>

            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              <Card className='rounded-2xl border shadow-none'>
                <CardContent className='flex items-start gap-4 p-5'>
                  <span className='bg-primary/10 text-primary inline-flex size-11 items-center justify-center rounded-2xl'>
                    <BookOpen className='size-5' />
                  </span>
                  <div>
                    <p className='text-muted-foreground text-sm'>Included courses</p>
                    <p className='text-foreground text-2xl font-semibold'>{programCourses.length}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className='rounded-2xl border shadow-none'>
                <CardContent className='flex items-start gap-4 p-5'>
                  <span className='bg-success/10 text-success inline-flex size-11 items-center justify-center rounded-2xl'>
                    <Users className='size-5' />
                  </span>
                  <div>
                    <p className='text-muted-foreground text-sm'>Class limit</p>
                    <p className='text-foreground text-2xl font-semibold'>
                      {program.class_limit ?? 'Open'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className='rounded-2xl border shadow-none'>
                <CardContent className='flex items-start gap-4 p-5'>
                  <span className='bg-warning/15 text-warning inline-flex size-11 items-center justify-center rounded-2xl'>
                    <CalendarDays className='size-5' />
                  </span>
                  <div>
                    <p className='text-muted-foreground text-sm'>Program price</p>
                    <p className='text-foreground text-2xl font-semibold'>
                      {typeof program.price === 'number' ? `KES ${program.price}` : 'Flexible'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className='rounded-[24px] border shadow-none'>
            <CardContent className='space-y-5 p-6'>
              <div className='space-y-2'>
                <p className='text-muted-foreground text-xs font-medium uppercase tracking-[0.14em]'>
                  Next step
                </p>
                <h2 className='text-xl font-semibold'>Review available cohorts</h2>
                <p className='text-muted-foreground text-sm leading-6'>
                  Check open sessions for this program, compare schedules, and continue into enrollment when you are ready.
                </p>
              </div>

              <Button
                className='w-full rounded-xl'
                size='lg'
                onClick={() => {
                  window.location.assign(
                    buildWorkspaceAliasPath(
                      activeDomain,
                      `/dashboard/courses/available-programs/${programId}`
                    )
                  );
                }}
              >
                View Available Sessions
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className='grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]'>
        <Card className='rounded-[24px] border shadow-none'>
          <CardContent className='space-y-5 p-6'>
            <div className='flex items-center gap-3'>
              <span className='bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-2xl'>
                <Target className='size-5' />
              </span>
              <div>
                <h2 className='text-lg font-semibold'>Objectives</h2>
                <p className='text-muted-foreground text-sm'>
                  What learners should expect to achieve in this program.
                </p>
              </div>
            </div>

            <div className='text-muted-foreground text-sm leading-7'>
              {program.objectives ? (
                <RichTextRenderer htmlString={program.objectives} />
              ) : (
                <p>No objectives have been added for this program yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-[24px] border shadow-none'>
          <CardContent className='space-y-5 p-6'>
            <div className='flex items-center gap-3'>
              <span className='bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-2xl'>
                <Layers3 className='size-5' />
              </span>
              <div>
                <h2 className='text-lg font-semibold'>Prerequisites</h2>
                <p className='text-muted-foreground text-sm'>
                  Helpful context before joining the program.
                </p>
              </div>
            </div>

            <div className='text-muted-foreground text-sm leading-7'>
              {program.prerequisites ? (
                <RichTextRenderer htmlString={program.prerequisites} />
              ) : (
                <p>No prerequisites have been listed for this program yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className='space-y-4'>
        <div>
          <h2 className='text-foreground text-xl font-semibold'>Courses in this program</h2>
          <p className='text-muted-foreground text-sm'>
            The learning path below shows the bundled courses included in this program.
          </p>
        </div>

        {programCourses.length === 0 ? (
          <Card className='rounded-[24px] border border-dashed shadow-none'>
            <CardContent className='p-8 text-center'>
              <BookOpen className='text-muted-foreground mx-auto h-10 w-10' />
              <h3 className='mt-3 text-lg font-semibold'>No courses added yet</h3>
              <p className='text-muted-foreground text-sm'>
                This program does not have any bundled courses listed yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4 md:grid-cols-2'>
            {programCourses.map((course, index) => (
              <Card key={course.uuid ?? `${course.name}-${index}`} className='rounded-[22px] border shadow-none'>
                <CardContent className='space-y-3 p-5'>
                  <div className='flex items-start gap-4'>
                    <span className='bg-primary/10 text-primary inline-flex size-10 shrink-0 items-center justify-center rounded-2xl font-semibold'>
                      {index + 1}
                    </span>
                    <div className='space-y-2'>
                      <h3 className='font-semibold'>{course.name || 'Untitled course'}</h3>
                      <div className='text-muted-foreground text-sm leading-6'>
                        {course.description ? (
                          <RichTextRenderer htmlString={course.description} />
                        ) : (
                          'No course description available.'
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
