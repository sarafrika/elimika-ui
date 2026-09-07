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
 * breadcrumbs, the back link, the instructor guard, and the two things a trainer
 * actually *does* from this screen. The record view is read-only by design, so
 * those sit beside it.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { useUserProfile } from '@/context/profile-context';
import { CourseRecordPage } from '@/src/features/course-record';
import { absoluteUrl, publicCourseUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { CalendarPlus, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

const MY_COURSES_HREF = '/dashboard/instructor/my-courses';

/**
 * The class builder, with no `id`.
 *
 * `?id=` on that route is a **class** uuid and puts the form into edit mode; the
 * page this replaced passed the *course* uuid into it, which hydrated the
 * builder from a class that does not exist. The builder has no course-preselect
 * parameter, so the honest link is the plain create route.
 */
const NEW_CLASS_HREF = '/dashboard/instructor/classes/new';

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

  const shareCourse = async () => {
    try {
      await navigator.clipboard.writeText(absoluteUrl(publicCourseUrl(courseUuid)));
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy link');
    }
  };

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
    <div className='mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-5 lg:px-6'>
      <div className='mb-4 flex flex-wrap items-center justify-end gap-2'>
        <Button variant='outline' size='sm' className='h-8 rounded-[10px]' onClick={shareCourse}>
          <Share2 className='size-4' />
          Share
        </Button>
        <Button asChild size='sm' className='h-8 rounded-[10px]'>
          <Link href={NEW_CLASS_HREF}>
            <CalendarPlus className='size-4' />
            Create a class
          </Link>
        </Button>
      </div>

      <CourseRecordPage courseUuid={courseUuid} backHref={MY_COURSES_HREF} />
    </div>
  );
}
