'use client';

/**
 * Course record, no role segment.
 *
 * This is not a duplicate of the admin route. It is the leftover of the parallel-slot
 * layout: `@admin` and `@course_creator` each had their own preview slot, and this
 * unscoped path was the `children` fallback every other domain fell through to
 * ("default preview for all domains except those with custom slots"). The
 * de-parallelize pass turned the slots into `admin/` and `course-creator/` segments
 * and left this one where it was.
 *
 * It is still live. `app/dashboard/layout.tsx` guards it with `resolveDashboardGuard`,
 * which admits any signed-in user who has a domain — no `assertRoleAccess` narrows it
 * further. And it is the only course-detail route an organisation, instructor, student
 * or parent can reach at all: `admin/` and `course-creator/` are the only role segments
 * with a preview route, and both redirect a viewer who lacks that role.
 *
 * Nothing links here any more. The three in-app links that did all lived inside the
 * legacy `CataloguePreviewSummary` this route used to render — its breadcrumb tail and
 * its "Linked records → Course" tile — and every catalogue list hardcodes the *admin*
 * href instead, even when `CatalogueWorkspace` is mounted on the instructor or
 * course-creator page. So the route survives on direct URLs and bookmarks while the
 * lists that ought to feed it point somewhere their own viewers cannot go.
 *
 * That makes it exactly the route the record view was designed for: access is the
 * API's answer, so one role-agnostic mount serves every viewer the guard lets in, each
 * seeing the capability row the server hands back. No back link — there is no list page
 * common to all these domains to return to — and the breadcrumb root is `/dashboard`,
 * which redirects each viewer to their own overview.
 */

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { CourseRecordPage } from '@/src/features/course-record';

export default function CourseManagementPreviewPage() {
  const params = useParams();
  const courseUuid = typeof params?.id === 'string' ? params.id : (params?.id?.[0] ?? '');
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard' },
      {
        id: 'preview',
        title: 'Course',
        url: `/dashboard/course-management/preview/${courseUuid}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, courseUuid]);

  return <CourseRecordPage courseUuid={courseUuid} />;
}
