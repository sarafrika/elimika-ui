'use client';

/**
 * Admin course record.
 *
 * Reached from the admin catalogue — `catalogue-workspace` and `catalogue-tableview`
 * both build this href, but only for a row carrying a `course_uuid`; a class row is
 * sent to `trainings/overview/<uuid>` instead. So `[id]` here is always a course uuid.
 *
 * The role gate is already server-side: `app/dashboard/admin/layout.tsx` runs
 * `assertRoleAccess('admin')` and redirects a non-admin to their own dashboard, so
 * there is nothing left for this page to guard. It does not follow that the view may
 * assume admin *content* access — `CourseRecordPage` still asks the API, because the
 * server is the only party that knows whether the content call actually returned the
 * lesson bodies.
 */

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { CourseRecordPage } from '@/src/features/course-record';

const CATALOGUE_HREF = '/dashboard/admin/catalogue';

export default function AdminCoursePreviewPage() {
  const params = useParams();
  const courseUuid = typeof params?.id === 'string' ? params.id : (params?.id?.[0] ?? '');
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/admin/overview' },
      { id: 'catalogue', title: 'Catalogue', url: CATALOGUE_HREF },
      {
        id: 'preview',
        title: 'Course',
        url: `/dashboard/admin/course-management/preview/${courseUuid}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, courseUuid]);

  return <CourseRecordPage courseUuid={courseUuid} backHref={CATALOGUE_HREF} />;
}
