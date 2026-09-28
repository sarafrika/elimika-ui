'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useCoursesByIds, useProgramsByIds } from '@/hooks/use-batched-lookups';
import type { Instructor, Organisation } from '@/services/client';
import { stripHtml } from '@/src/features/dashboard/courses/shared/_components/courses-data';
import {
  RequirementAnswersTable,
  formatApplicationDate,
} from '@/src/features/rate-card/components/application-sections';
import { useTrainingApplication } from '@/src/features/rate-card/hooks/use-training-application';
import type { TrainingApplicationEntry } from '@/src/features/rate-card/hooks/use-training-application-list';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { CheckCheck, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ApplicationRequirementsReview } from './ApplicationRequirementsReview';
import { applicationKey, pendingForApplicant, type ReviewApplication } from './approval-queue';
import type { ApplicantSummary } from './PendingApprovalsPage';

type Props = {
  applicant: ApplicantSummary;
  instructor?: Instructor;
  organisation?: Organisation;
  applications: ReviewApplication[];
  creatorUuid: string;
  onClose: () => void;
  onDecided: (entry: ReviewApplication, status: 'approved' | 'rejected' | 'revoked') => void;
};

export function ApplicantReviewSheet(props: Props) {
  const { applicant, applications, onClose } = props;
  const [busy, setBusy] = useState(false);
  const pending = useMemo(
    () => pendingForApplicant(applications, applicant.uuid, applicant.type),
    [applications, applicant.uuid, applicant.type]
  );
  const first = pending[0];

  return (
    <Sheet
      open
      onOpenChange={open => {
        if (!open && !busy) onClose();
      }}
    >
      <SheetContent className='w-full gap-0 sm:max-w-6xl'>
        <SheetHeader className='shrink-0 border-b px-5 py-5 pr-12'>
          <SheetTitle>Review {applicant.type} applications</SheetTitle>
          <SheetDescription>
            {applicant.name} ·{' '}
            <span aria-live='polite'>
              {pending.length} pending {pending.length === 1 ? 'application' : 'applications'}
            </span>
          </SheetDescription>
        </SheetHeader>
        <div className='min-h-0 flex-1 overflow-y-auto p-4 sm:p-6'>
          {first ? (
            first.parentUuid && first.application.uuid ? (
              <ApplicationReview
                key={applicationKey(first)}
                {...props}
                entry={first}
                parentUuid={first.parentUuid}
                uuid={first.application.uuid}
                remaining={pending.length}
                onPendingChange={setBusy}
              />
            ) : (
              <EmptyState
                title='Application details unavailable'
                description='This application is missing its course or application reference. Reload the queue to try again.'
              />
            )
          ) : (
            <EmptyState
              icon={CheckCheck}
              title='No pending applications'
              description={`All pending applications for ${applicant.name} have been reviewed.`}
              action={<Button onClick={onClose}>Back to approval queue</Button>}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ApplicationReview({
  applicant,
  instructor,
  organisation,
  creatorUuid,
  entry,
  parentUuid,
  uuid,
  remaining,
  onDecided,
  onPendingChange,
}: Props & {
  entry: ReviewApplication;
  parentUuid: string;
  uuid: string;
  remaining: number;
  onPendingChange: (pending: boolean) => void;
}) {
  const { application, query } = useTrainingApplication(entry.kind, parentUuid, uuid);
  const courseIds = useMemo(
    () => (entry.kind === 'course' ? [parentUuid] : []),
    [entry.kind, parentUuid]
  );
  const programIds = useMemo(
    () => (entry.kind === 'program' ? [parentUuid] : []),
    [entry.kind, parentUuid]
  );
  const { courseMap, isLoading: courseLoading } = useCoursesByIds(courseIds);
  const { programMap, isLoading: programLoading } = useProgramsByIds(programIds);
  const course = courseMap[parentUuid];
  const program = programMap[parentUuid];
  const title =
    course?.name ??
    program?.title ??
    (entry.kind === 'course' ? 'Course application' : 'Program application');
  const owner = course?.course_creator_uuid ?? program?.course_creator_uuid;
  const canDecide = owner ? owner === creatorUuid : Boolean(application?.rate_floor_flags);
  const minimum =
    course?.minimum_training_fee ?? application?.rate_floor_flags?.minimum_training_fee ?? null;

  if (
    query.isError ||
    query.data?.error ||
    query.data?.success === false ||
    (query.isSuccess && !application)
  ) {
    return (
      <EmptyState
        title='Could not load application'
        description='Your place in the queue has been kept.'
        action={
          <Button variant='outline' onClick={() => void query.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }
  if (!application || courseLoading || programLoading) return <Skeleton className='h-80 w-full' />;
  if (application.status !== 'pending')
    return (
      <EmptyState
        title='Application already reviewed'
        description='This application no longer needs a decision.'
        action={
          <Button
            onClick={() => {
              if (
                application.status === 'approved' ||
                application.status === 'rejected' ||
                application.status === 'revoked'
              )
                onDecided(entry, application.status);
            }}
          >
            Continue
          </Button>
        }
      />
    );

  const reviewEntry: TrainingApplicationEntry = {
    kind: entry.kind,
    uuid,
    parentUuid,
    application,
    course,
    program,
    title,
    creatorUuid: owner,
    minimum,
  };

  return (
    <div className='space-y-5'>
      <div className='flex items-start gap-3'>
        <Avatar className='size-12'>
          <AvatarImage
            src={toAuthenticatedMediaUrl(applicant.avatarUrl) || undefined}
            alt={applicant.name}
          />
          <AvatarFallback>{applicant.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className='min-w-0'>
          <h2 className='text-lg font-semibold'>{applicant.name}</h2>
          <p className='text-muted-foreground text-sm'>{stripHtml(applicant.headline)}</p>
          <p className='text-muted-foreground mt-1 flex items-center gap-1 text-xs'>
            <MapPin className='size-3' />
            {applicant.location}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className='space-y-2 p-4'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <Badge variant='secondary'>{entry.kind === 'course' ? 'Course' : 'Program'}</Badge>
            <span className='text-muted-foreground text-xs'>First of {remaining} pending</span>
          </div>
          <h3 className='font-semibold'>{title}</h3>
          {application.application_notes && (
            <div className='space-y-1 text-sm'>
              <div className='flex flex-row flex-wrap gap-4 items-center'>
                <p className='font-medium mb-1'>Applicant’s note</p>
                <p className='text-muted-foreground text-xs'>
                  Submitted {formatApplicationDate(application.created_date)}
                </p>
              </div>
              <p className='text-muted-foreground whitespace-pre-wrap'>
                {application.application_notes}
              </p>
            </div>
          )}

          {remaining > 1 && (
            <p className='text-muted-foreground text-sm'>
              The next application opens automatically after your decision.
            </p>
          )}
        </CardContent>
      </Card>

      {application.requirement_answers?.length ? (
        <Card>
          <CardContent className='space-y-3 p-4'>
            <h3 className='font-semibold'>Training requirements</h3>
            <div className='overflow-x-auto rounded-md border'>
              <RequirementAnswersTable answers={application.requirement_answers} />
            </div>
          </CardContent>
        </Card>
      ) : null}
      <ApplicationRequirementsReview
        key={String(application.updated_date ?? application.created_date ?? uuid)}
        entry={reviewEntry}
        creatorUuid={creatorUuid}
        applicantUuid={applicant.uuid}
        applicantType={applicant.type}
        canDecide={canDecide}
        onPendingChange={onPendingChange}
        onDecided={status => onDecided(entry, status)}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className='text-muted-foreground text-xs'>{label}</dt>
      <dd className='mt-1 font-medium break-words'>{value || 'Not provided'}</dd>
    </div>
  );
}
