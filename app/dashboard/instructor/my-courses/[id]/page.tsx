'use client';

/**
 * An approved trainer's record for a course they deliver.
 *
 * The record itself is `CourseRecordPage`: it fetches its own data, asks the API
 * what this viewer may see, and composes the hero, KPI band, tabs and rail from
 * the capability row that answer selects. Nothing here tells it who is looking —
 * the route is the instructor route, but the server is still the only party that
 * knows whether this instructor's training application is approved *today*.
 *
 * What stays with the route is the route's own business: the uuid, the
 * breadcrumbs, the back link and the instructor guard. The record's own header
 * carries "Create class", so the route adds no second copy of it.
 */

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { surfaceTheme } from '@/components/data-display/page-shell';
import { Card, CardContent } from '@/components/ui/card';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { useUserProfile } from '@/context/profile-context';
import { cn } from '@/lib/utils';
import { CourseRecordPage } from '@/src/features/course-record';

const MY_COURSES_HREF = '/dashboard/instructor/my-courses';

export default function InstructorMyCourseDetailsPage() {
  const params = useParams();
  const courseUuid = typeof params?.id === 'string' ? params.id : (params?.id?.[0] ?? '');

  const instructor = useInstructor();
  const profile = useUserProfile();
  const profileLoading = profile?.isLoading ?? true;

  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/instructor/overview' },
      { id: 'my-courses', title: 'My Courses', url: MY_COURSES_HREF },
      {
        id: 'course',
        title: 'Course',
        url: `${MY_COURSES_HREF}/${courseUuid}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, courseUuid]);

  // Don't gate the record on the profile query — every region resolves itself.
  // Only a resolved "no instructor profile" is a reason not to render.
  if (!instructor && !profileLoading) {
    return (
      <div className='mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-5 lg:px-6'>
        <Card>
          <CardContent className='space-y-2 p-6'>
            <p className='text-sm font-medium'>No instructor profile</p>
            <p className='text-muted-foreground text-sm'>
              Courses you are approved to deliver appear here once your instructor profile is set
              up.
            </p>
            <Link href={MY_COURSES_HREF} className='text-primary text-sm underline'>
              Back to my courses
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(surfaceTheme.pageWide, 'flex flex-col gap-4 py-4 pb-10')}>
      <CourseRecordPage courseUuid={courseUuid} backHref={MY_COURSES_HREF} />
    </div>
  );
}
