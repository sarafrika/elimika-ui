'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import HTMLTextPreview from '@/components/editors/html-text-preview';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Course, CoursePendingEdit } from '@/services/client';
import {
  getCourseByUuidOptions,
  getCourseCreatorByUuidOptions,
  getPendingEditOptions,
  moderateCourseMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { adminTheme } from '../../../_components/ui/admin-theme';
import { SectionCard, SectionCardSkeleton } from '../../../_components/ui/SectionCard';
import { AssessmentsSection } from './AssessmentsSection';
import { CurriculumSection } from './CurriculumSection';
import { ModerationHistorySection } from './ModerationHistorySection';
import { ModerationSheet, type ModerationSheetAction } from './ModerationSheet';
import { PendingEditSection } from './PendingEditSection';
import { RequirementsSection } from './RequirementsSection';
import { ReviewHero } from './ReviewHero';
import { ReviewSidebar } from './ReviewSidebar';
import { RubricsSection } from './RubricsSection';

/** Query ids refreshed after a moderation decision. */
const MODERATION_QUERY_IDS = new Set([
  'getCourseByUuid',
  'getAllCourses',
  'listPendingCourses',
  'listPendingCourseEdits',
  'getCourseEditDiff',
  'getCourseModerationHistory',
  'getCourseApprovalStatus',
  'searchCourses',
]);

/** The API takes `approved` / `rejected` / `revoked`; the UI speaks in verbs. */
const MODERATION_ACTIONS = {
  approve: 'approved',
  reject: 'rejected',
  revoke: 'revoked',
} as const;

export function CourseReviewPage({ uuid }: { uuid: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(getCourseByUuidOptions({ path: { uuid } }));
  const course = data?.data as Course | undefined;

  const { data: creatorData } = useQuery({
    ...getCourseCreatorByUuidOptions({ path: { uuid: course?.course_creator_uuid as string } }),
    enabled: !!course?.course_creator_uuid,
  });
  const creatorName = creatorData?.full_name;

  // A published course can have an edit awaiting review. When it does, a decision applies to
  // that edit rather than to the course's own approval, so the wording has to change with it.
  const { data: pendingEditData } = useQuery({
    ...getPendingEditOptions({ path: { uuid } }),
    enabled: !!course,
  });
  const pendingEdit = pendingEditData?.data as CoursePendingEdit | undefined;
  const hasPendingEdit = !!pendingEdit;

  const moderate = useMutation(moderateCourseMutation());
  const [sheetAction, setSheetAction] = useState<ModerationSheetAction>('reject');
  const [sheetOpen, setSheetOpen] = useState(false);

  const runModerate = async (action: 'approve' | 'reject' | 'revoke', reason?: string) => {
    try {
      await moderate.mutateAsync({
        path: { uuid },
        body: { action: MODERATION_ACTIONS[action], reason },
      });
      toast.success(
        action === 'approve'
          ? hasPendingEdit
            ? 'Edit approved and published'
            : 'Course approved'
          : action === 'reject'
            ? hasPendingEdit
              ? 'Edit rejected. The live course is unchanged.'
              : 'Course rejected'
            : 'Approval revoked'
      );
      setSheetOpen(false);
      queryClient.invalidateQueries({
        predicate: query => {
          const id = (query.queryKey?.[0] as { _id?: string } | undefined)?._id;
          return !!id && MODERATION_QUERY_IDS.has(id);
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Moderation failed');
    }
  };

  const openSheet = (action: ModerationSheetAction) => {
    setSheetAction(action);
    setSheetOpen(true);
  };

  if (isLoading) {
    return (
      <main className={adminTheme.page}>
        <div className={adminTheme.pageStack}>
          <Skeleton className='h-56 w-full rounded-md' />
          <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]'>
            <div className='space-y-4'>
              <SectionCardSkeleton rows={5} />
              <SectionCardSkeleton rows={4} />
            </div>
            <SectionCardSkeleton rows={6} withHeader={false} />
          </div>
        </div>
      </main>
    );
  }

  if (!course) {
    return (
      <main className={adminTheme.page}>
        <div className='flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center'>
          <BookOpen className='size-10 text-muted-foreground' />
          <p className='text-lg font-semibold'>Course not found</p>
          <Button variant='outline' asChild>
            <Link href='/dashboard/manage-courses'>Back to courses</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <Button variant='ghost' size='sm' asChild className='-ml-2 self-start text-muted-foreground'>
          <Link href='/dashboard/manage-courses'>
            <ArrowLeft className='size-4' />
            Back to courses
          </Link>
        </Button>

        <ReviewHero course={course} creatorName={creatorName} />

        <div className='grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]'>
          {/* Main review column */}
          <div className='min-w-0 space-y-4'>
            {pendingEdit && <PendingEditSection courseUuid={uuid} pendingEdit={pendingEdit} />}

            <SectionCard title='About this course' description='What the course promises learners.'>
              <div className='space-y-5'>
                <div>
                  <p className={adminTheme.sectionLabel}>Description</p>
                  <div className='mt-1.5 text-sm leading-relaxed'>
                    <HTMLTextPreview htmlContent={course.description ?? 'No description provided.'} />
                  </div>
                </div>
                <div>
                  <p className={adminTheme.sectionLabel}>Learning objectives</p>
                  <div className='mt-1.5 text-sm leading-relaxed'>
                    <HTMLTextPreview htmlContent={course.objectives ?? 'No objectives provided.'} />
                  </div>
                </div>
                <div>
                  <p className={adminTheme.sectionLabel}>Prerequisites</p>
                  <div className='mt-1.5 text-sm leading-relaxed'>
                    <HTMLTextPreview htmlContent={course.prerequisites ?? 'No prerequisites listed.'} />
                  </div>
                </div>
              </div>
            </SectionCard>

            <CurriculumSection courseUuid={uuid} />
            <AssessmentsSection courseUuid={uuid} />
            <RubricsSection courseUuid={uuid} />
            <RequirementsSection course={course} />
            <ModerationHistorySection courseUuid={uuid} />
          </div>

          {/* Sticky decision sidebar */}
          <div className='lg:sticky lg:top-6'>
            <ReviewSidebar
              course={course}
              isPending={moderate.isPending}
              hasPendingEdit={hasPendingEdit}
              onApprove={() => runModerate('approve')}
              onReject={() => openSheet('reject')}
              onRevoke={() => openSheet('revoke')}
            />
          </div>
        </div>
      </div>

      <ModerationSheet
        action={sheetAction}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onConfirm={reason => runModerate(sheetAction, reason)}
        isPending={moderate.isPending}
        isEditReview={hasPendingEdit}
      />
    </main>
  );
}
