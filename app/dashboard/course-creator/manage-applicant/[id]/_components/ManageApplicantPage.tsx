'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useCourseCreator } from '@/context/course-creator-context';
import { useCoursesByIds, useProgramsByIds } from '@/hooks/use-batched-lookups';
import { extractPage } from '@/lib/api-helpers';
import type {
  Course,
  CourseTrainingApplication,
  Instructor,
  InstructorDocument,
  InstructorEducation,
  InstructorReview,
  InstructorSkill,
  Organisation,
  ProgramTrainingApplication,
  TrainingProgram,
} from '@/services/client';
import {
  decideOnProgramTrainingApplicationMutation,
  decideOnTrainingApplicationMutation,
  getInstructorByUuidOptions,
  getInstructorDocumentsOptions,
  getInstructorEducationOptions,
  getInstructorReviewsOptions,
  getInstructorSkillsOptions,
  getOrganisationByUuidOptions,
  getUserByUuidOptions,
  searchProgramTrainingApplicationsOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Award,
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  GraduationCap,
  LinkIcon,
  MapPin,
  Star,
  ThumbsDown,
  ThumbsUp,
  Users,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { stripHtml } from '../../../../../../src/features/dashboard/courses/shared/_components/courses-data';
import { adminTheme, DetailGrid, SectionCard, StatusBadge } from '../../../../admin/_components/ui';

type ApplicantType = 'instructor' | 'organisation';
type TrainingApplication = CourseTrainingApplication | ProgramTrainingApplication;

function formatDate(value?: string | Date | null): string {
  if (!value) return '—';
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
}

function formatDateTime(value?: string | Date | null): string {
  if (!value) return '—';
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return typeof error.message === 'string' ? error.message : undefined;
  }
  return undefined;
}

const isCourseApplication = (application: TrainingApplication): application is CourseTrainingApplication =>
  'course_uuid' in application;

const isProgramApplication = (
  application: TrainingApplication
): application is ProgramTrainingApplication => 'program_uuid' in application;

function ApplicantTypePill({ type }: { type: ApplicantType }) {
  return type === 'instructor' ? (
    <span className='bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold'>
      <GraduationCap className='size-3' />
      Instructor
    </span>
  ) : (
    <span className='bg-accent/10 text-accent-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold'>
      <Building2 className='size-3' />
      Organisation
    </span>
  );
}

function ReviewDialog({
  open,
  onOpenChange,
  application,
  action,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: TrainingApplication | null;
  action: 'approve' | 'reject' | 'revoke';
  onSubmit: (reviewNotes: string) => void;
  isLoading: boolean;
}) {
  const [reviewNotes, setReviewNotes] = useState('');

  const config = {
    approve: {
      title: 'Approve application',
      description: 'Approve this application so the applicant can train this course or program.',
      icon: ThumbsUp,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
    },
    reject: {
      title: 'Reject application',
      description: 'Reject this application. Please provide a reason.',
      icon: ThumbsDown,
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
    },
    revoke: {
      title: 'Revoke approval',
      description: 'Revoke the earlier approval and explain why.',
      icon: XCircle,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
    },
  }[action];

  const Icon = config.icon;

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? 'block' : 'hidden'}`}
      aria-hidden={!open}
      role='presentation'
      onClick={() => onOpenChange(false)}
      onKeyDown={() => undefined}
    >
      <div className='bg-background/80 absolute inset-0 backdrop-blur-sm' />
      <div
        className='absolute inset-x-0 top-10 mx-auto w-[min(100%-1.5rem,42rem)] rounded-md border border-border/70 bg-card p-5 shadow-xl'
        onClick={event => event.stopPropagation()}
      >
        <div className='flex items-start gap-3'>
          <div className={`rounded-xl p-2.5 ${config.iconBg}`}>
            <Icon className={`size-5 ${config.iconColor}`} />
          </div>
          <div>
            <h3 className='text-foreground text-lg font-semibold'>{config.title}</h3>
            <p className='text-muted-foreground mt-1 text-sm'>{config.description}</p>
          </div>
        </div>

        {application ? (
          <div className='mt-4 space-y-3'>
            <div className='border-border/60 bg-muted/20 rounded-md border p-4'>
              <div className='flex items-center gap-2'>
                <ApplicantTypePill type={(application.applicant_type as ApplicantType) ?? 'instructor'} />
                <StatusBadge status={application.status} />
              </div>
              {application.application_notes ? (
                <p className='text-muted-foreground mt-2 text-sm'>
                  &quot;{application.application_notes}&quot;
                </p>
              ) : null}
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                Review notes {action === 'reject' ? <span className='text-destructive'>*</span> : null}
              </label>
              <Textarea
                value={reviewNotes}
                onChange={event => setReviewNotes(event.target.value)}
                placeholder={`Add your ${action} notes...`}
                rows={4}
              />
            </div>
          </div>
        ) : null}

        <div className='mt-5 flex justify-end gap-2'>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSubmit(reviewNotes);
              setReviewNotes('');
            }}
            disabled={isLoading || (action === 'reject' && !reviewNotes.trim())}
          >
            {action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Revoke'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ApplicationCard({
  application,
  title,
  onApprove,
  onReject,
  onRevoke,
}: {
  application: TrainingApplication;
  title: string;
  onApprove: () => void;
  onReject: () => void;
  onRevoke: () => void;
}) {
  const isPending = application.status?.toLowerCase() === 'pending';
  const isApproved = application.status?.toLowerCase() === 'approved';

  return (
    <div className='border-border/60 bg-muted/20 rounded-md border p-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='text-foreground truncate text-sm font-semibold'>{title}</p>
            <StatusBadge status={application.status} />
          </div>
          <p className='text-muted-foreground mt-1 text-xs'>
            Submitted {formatDate(application.created_date)}
          </p>
        </div>
        <div className='flex shrink-0 flex-wrap gap-2'>
          {isPending ? (
            <>
              <Button size='sm' onClick={onApprove}>
                Approve
              </Button>
              <Button variant='outline' size='sm' onClick={onReject}>
                Reject
              </Button>
            </>
          ) : isApproved ? (
            <Button variant='outline' size='sm' onClick={onRevoke}>
              Revoke
            </Button>
          ) : (
            <span className='text-muted-foreground text-xs'>Finalised</span>
          )}
        </div>
      </div>

      <DetailGrid
        columns={2}
        className='mt-4'
        items={[
          {
            label: 'Notes',
            value: application.application_notes || '-',
          },
          {
            label: 'Review notes',
            value: application.review_notes || '-',
          },
        ]}
      />
    </div>
  );
}

function ProfileCard({
  uuid,
  type,
  instructor,
  organisation,
  instructorUser,
  skills,
  education,
  documents,
  reviews,
}: {
  uuid: string;
  type: ApplicantType;
  instructor?: Instructor;
  organisation?: Organisation;
  instructorUser?: Instructor;
  skills: InstructorSkill[];
  education: InstructorEducation[];
  documents: InstructorDocument[];
  reviews: InstructorReview[];
}) {
  if (type === 'organisation' && organisation) {
    return (
      <div className='space-y-4'>
        <SectionCard title='Organisation overview' description='Core details for this applicant.'>
          <div className='space-y-4'>
            <DetailGrid
              columns={3}
              items={[
                { label: 'Name', value: organisation.name || '-' },
                { label: 'Location', value: organisation.location || '-' },
                { label: 'Country', value: organisation.country || '-' },
                { label: 'Licence', value: organisation.licence_no || '-' },
                { label: 'Website', value: organisation.website || '-' },
                { label: 'Created', value: formatDate(organisation.created_date) },
              ]}
            />
            <div>
              <p className={adminTheme.sectionLabel}>Description</p>
              <p className='text-foreground mt-2 text-sm leading-6'>
                {organisation.description || 'No description provided.'}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title='Application summary' description='Where this organisation is in the queue.'>
          <DetailGrid
            columns={2}
            items={[
              { label: 'Applicant UUID', value: <span className='font-mono text-xs'>{uuid}</span> },
              {
                label: 'Verification',
                value: organisation.admin_verified ? 'Verified' : 'Pending',
              },
            ]}
          />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <SectionCard title='User profile' description='Identity and contact details for this applicant.'>
        <div className='space-y-4'>
          <DetailGrid
            columns={3}
            items={[
              { label: 'Full name', value: instructor?.full_name || '-' },
              { label: 'Email', value: instructorUser?.email || '-' },
              { label: 'Phone', value: instructorUser?.phone_number || '-' },
              {
                label: 'Location',
                value: instructor?.formatted_location || instructor?.location || '-',
              },
              { label: 'Organisation', value: instructor?.organisation || '-' },
              { label: 'Created', value: formatDate(instructor?.created_date) },
            ]}
          />

          <div className='flex flex-wrap gap-2'>
            <StatusBadge
              status={instructor?.admin_verified ? 'approved' : 'pending'}
              label={instructor?.admin_verified ? 'Verified' : 'Pending'}
            />
            <StatusBadge
              status={instructor?.is_profile_complete ? 'approved' : 'pending'}
              label={instructor?.is_profile_complete ? 'Profile complete' : 'Profile incomplete'}
            />
          </div>

          <div>
            <p className={adminTheme.sectionLabel}>Professional headline</p>
            <p className='text-foreground mt-2 text-sm'>
              {instructor?.professional_headline || 'No headline provided.'}
            </p>
          </div>

          <div>
            <p className={adminTheme.sectionLabel}>Bio</p>
            <p className='text-foreground mt-2 text-sm leading-6'>
              {stripHtml(instructor?.bio) || 'No bio provided.'}
            </p>
          </div>
        </div>
      </SectionCard>

      <div className='grid gap-4 lg:grid-cols-2'>
        <SectionCard title='Education' description='Education history and qualifications.'>
          {education.length ? (
            <div className='space-y-3'>
              {education.map(item => (
                <div key={item.uuid} className='border-border/60 bg-muted/20 rounded-md border p-3'>
                  <p className='text-foreground text-sm font-semibold'>
                    {item.qualification || 'Qualification not specified'}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {item.school_name || 'Institution not specified'}
                  </p>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    {item.year_completed ? `Completed ${item.year_completed}` : 'Year not specified'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={GraduationCap} title='No education records' variant='compact' />
          )}
        </SectionCard>

        <SectionCard title='Skills' description='Declared teaching and professional skills.'>
          {skills.length ? (
            <div className='flex flex-wrap gap-2'>
              {skills.map(skill => (
                <Badge key={skill.uuid} variant='secondary'>
                  {skill.skill_name} ({skill.proficiency_level})
                </Badge>
              ))}
            </div>
          ) : (
            <EmptyState icon={Award} title='No skills listed' variant='compact' />
          )}
        </SectionCard>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <SectionCard title='Documents' description='Uploaded supporting documents.'>
          {documents.length ? (
            <div className='space-y-3'>
              {documents.map(document => (
                <div key={document.uuid} className='border-border/60 bg-muted/20 rounded-md border p-3'>
                  <p className='text-foreground text-sm font-medium'>
                    {document.title || document.original_filename}
                  </p>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    {document.verification_status || document.status || 'Document'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={FileText} title='No documents uploaded' variant='compact' />
          )}
        </SectionCard>

        <SectionCard title='Reviews' description='Public reviews and ratings for this applicant.'>
          {reviews.length ? (
            <div className='space-y-3'>
              {reviews.map(review => (
                <div key={review.uuid} className='border-border/60 bg-muted/20 rounded-md border p-3'>
                  <div className='flex items-center justify-between gap-3'>
                    <p className='text-foreground text-sm font-semibold'>{review.headline}</p>
                    <div className='flex items-center gap-1'>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={
                            index < (review.rating ?? 0)
                              ? 'text-warning size-3.5 fill-warning'
                              : 'text-muted-foreground size-3.5'
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p className='text-muted-foreground mt-1 text-sm'>{review.comments}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Star} title='No reviews yet' variant='compact' />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function ApplicationsSection({
  title,
  description,
  applications,
  courseMap,
  programMap,
  onApprove,
  onReject,
  onRevoke,
}: {
  title: string;
  description: string;
  applications: TrainingApplication[];
  courseMap: Record<string, Course>;
  programMap: Record<string, TrainingProgram>;
  onApprove: (application: TrainingApplication) => void;
  onReject: (application: TrainingApplication) => void;
  onRevoke: (application: TrainingApplication) => void;
}) {
  return (
    <SectionCard title={title} description={description}>
      {applications.length ? (
        <div className='space-y-3'>
          {applications.map(application => {
            const entityTitle = isCourseApplication(application)
              ? courseMap[application?.course_uuid]?.name ?? application.course_uuid
              : programMap[application?.program_uuid]?.title ?? application.program_uuid;

            return (
              <ApplicationCard
                key={application.uuid}
                application={application}
                title={entityTitle}
                onApprove={() => onApprove(application)}
                onReject={() => onReject(application)}
                onRevoke={() => onRevoke(application)}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title='No applications yet'
          description='This applicant has not submitted any applications for this category.'
          variant='compact'
        />
      )}
    </SectionCard>
  );
}

export default function ManageApplicantPage({ uuid }: { uuid: string }) {
  const queryClient = useQueryClient();
  const { profile: courseCreator } = useCourseCreator();
  const [tab, setTab] = useState<'profile' | 'course' | 'program'>('profile');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'revoke'>('approve');
  const [selectedApplication, setSelectedApplication] = useState<TrainingApplication | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const { data: instructorData, isLoading: isInstructorLoading } = useQuery({
    ...getInstructorByUuidOptions({ path: { uuid } }),
    enabled: !!uuid,
    retry: false,
    staleTime: 30_000,
  });
  const { data: organisationData, isLoading: isOrganisationLoading } = useQuery({
    ...getOrganisationByUuidOptions({ path: { uuid } }),
    enabled: !!uuid,
    retry: false,
    staleTime: 30_000,
  });

  const instructor = instructorData?.data as Instructor | undefined;
  const organisation = organisationData?.data as Organisation | undefined;
  const applicantType: ApplicantType | null = instructor
    ? 'instructor'
    : organisation
      ? 'organisation'
      : null;
  const displayApplicantType: ApplicantType = applicantType ?? 'instructor';

  const { data: instructorUserData } = useQuery({
    ...getUserByUuidOptions({ path: { uuid: instructor?.user_uuid as string } }),
    enabled: !!instructor?.user_uuid,
    staleTime: 30_000,
  });

  const courseApplicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        searchParams: {
          applicant_uuid_eq: uuid,
          course_creator_uuid: courseCreator?.uuid ?? '',
        },
        pageable: { page: 0, size: 100 },
      },
    }),
    enabled: !!courseCreator?.uuid && !!uuid,
    staleTime: 30_000,
  });
  const programApplicationsQuery = useQuery({
    ...searchProgramTrainingApplicationsOptions({
      query: {
        searchParams: {
          applicant_uuid_eq: uuid,
          course_creator_uuid: courseCreator?.uuid ?? '',
        },
        pageable: { page: 0, size: 100 },
      },
    }),
    enabled: !!courseCreator?.uuid && !!uuid,
    staleTime: 30_000,
  });

  const courseApplications = extractPage<CourseTrainingApplication>(courseApplicationsQuery.data).items;
  const programApplications = extractPage<ProgramTrainingApplication>(programApplicationsQuery.data).items;

  const courseIds = useMemo(
    () => courseApplications.map(application => application.course_uuid).filter(Boolean),
    [courseApplications]
  );
  const programIds = useMemo(
    () => programApplications.map(application => application.program_uuid).filter(Boolean),
    [programApplications]
  );

  const { courseMap, isLoading: coursesLoading } = useCoursesByIds(courseIds as string[]);
  const { programMap, isLoading: programsLoading } = useProgramsByIds(programIds as string[]);

  const skillsQuery = useQuery({
    ...getInstructorSkillsOptions({
      path: { instructorUuid: uuid },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: applicantType === 'instructor' && !!uuid,
    staleTime: 30_000,
  });
  const educationQuery = useQuery({
    ...getInstructorEducationOptions({ path: { instructorUuid: uuid } }),
    enabled: applicantType === 'instructor' && !!uuid,
    staleTime: 30_000,
  });
  const documentsQuery = useQuery({
    ...getInstructorDocumentsOptions({ path: { instructorUuid: uuid } }),
    enabled: applicantType === 'instructor' && !!uuid,
    staleTime: 30_000,
  });
  const reviewsQuery = useQuery({
    ...getInstructorReviewsOptions({ path: { instructorUuid: uuid } }),
    enabled: applicantType === 'instructor' && !!uuid,
    staleTime: 30_000,
  });

  const skills: InstructorSkill[] = skillsQuery.data?.data?.content ?? [];
  const education: InstructorEducation[] = educationQuery.data?.data ?? [];
  const documents: InstructorDocument[] = documentsQuery.data?.data ?? [];
  const reviews: InstructorReview[] = reviewsQuery.data?.data ?? [];

  const courseMutation = useMutation(decideOnTrainingApplicationMutation());
  const programMutation = useMutation(decideOnProgramTrainingApplicationMutation());

  const openReview = (application: TrainingApplication, action: 'approve' | 'reject' | 'revoke') => {
    setSelectedApplication(application);
    setReviewAction(action);
    setReviewOpen(true);
  };

  const submitReview = async (reviewNotes: string) => {
    try {
      if (!selectedApplication) return;
      if (isCourseApplication(selectedApplication)) {
        await courseMutation.mutateAsync({
          path: {
            courseUuid: selectedApplication?.course_uuid!,
            applicationUuid: selectedApplication?.uuid!,
          },
          query: { action: reviewAction },
          body: { review_notes: reviewNotes },
        });
      } else if (isProgramApplication(selectedApplication)) {
        await programMutation.mutateAsync({
          path: {
            programUuid: selectedApplication?.program_uuid!,
            applicationUuid: selectedApplication?.uuid!,
          },
          query: { action: reviewAction },
          body: { review_notes: reviewNotes },
        });
      }

      toast.success(`Application ${reviewAction}d successfully`);
      setReviewOpen(false);
      setSelectedApplication(null);
      queryClient.invalidateQueries({
        predicate: query => {
          const id = (query.queryKey?.[0] as { _id?: string } | undefined)?._id;
          return !!id && ['searchTrainingApplications', 'searchProgramTrainingApplications'].includes(id);
        },
      });
    } catch (error) {
      toast.error(getErrorMessage(error) || `Failed to ${reviewAction} application`);
    }
  };

  const applicantName = applicantType === 'instructor' ? instructor?.full_name : organisation?.name;
  const applicantHeadline =
    applicantType === 'instructor'
      ? instructor?.professional_headline || 'Instructor applicant'
      : organisation?.description || 'Organisation applicant';
  const applicantLocation =
    applicantType === 'instructor'
      ? instructor?.formatted_location || instructor?.location || 'Location not listed'
      : [organisation?.location, organisation?.country].filter(Boolean).join(', ') || 'Location not listed';
  const applicantAvatar = applicantType === 'instructor' ? instructor?.profile_picture_url : undefined;
  const applicantInitials = (applicantName || 'AP')
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const stats = useMemo(
    () => ({
      course: courseApplications.length,
      program: programApplications.length,
      pending:
        [...courseApplications, ...programApplications].filter(
          application => application.status?.toLowerCase() === 'pending'
        ).length,
    }),
    [courseApplications, programApplications]
  );

  const loading =
    isInstructorLoading ||
    isOrganisationLoading ||
    courseApplicationsQuery.isLoading ||
    programApplicationsQuery.isLoading ||
    coursesLoading ||
    programsLoading;

  if (!loading && !applicantType) {
    return (
      <main className={adminTheme.page}>
        <div className='flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center'>
          <Building2 className='text-muted-foreground size-10' />
          <p className='text-lg font-semibold'>Applicant not found</p>
          <Button variant='outline' asChild>
            <Link href='/dashboard/course-creator/pending-approvals'>Back to approvals</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <Button variant='ghost' size='sm' asChild className='text-muted-foreground -ml-2 self-start'>
          <Link href='/dashboard/course-creator/pending-approvals'>
            <ArrowLeft className='size-4' />
            Back to approvals
          </Link>
        </Button>

        <section className='border-border/70 bg-card overflow-hidden rounded-md border shadow-sm'>
          <div className='from-primary/15 via-muted/60 to-muted/30 relative flex h-40 items-start justify-end bg-gradient-to-r p-4'>
            <div className='grid grid-cols-3 gap-3 sm:gap-4'>
              <div className='text-right'>
                <p className='text-muted-foreground text-xs font-medium uppercase'>Course apps</p>
                <p className='text-foreground mt-1 text-2xl font-semibold tabular-nums'>
                  {stats.course}
                </p>
              </div>
              <div className='text-right'>
                <p className='text-muted-foreground text-xs font-medium uppercase'>Program apps</p>
                <p className='text-foreground mt-1 text-2xl font-semibold tabular-nums'>
                  {stats.program}
                </p>
              </div>
              <div className='text-right'>
                <p className='text-muted-foreground text-xs font-medium uppercase'>Pending reviews</p>
                <p className='text-foreground mt-1 text-2xl font-semibold tabular-nums'>
                  {stats.pending}
                </p>
              </div>
            </div>
          </div>

          <div className='relative -mt-12 px-5 pb-5'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-end'>
              <Avatar className='border-border/70 bg-background size-28 border shadow-md'>
                <AvatarImage src={toAuthenticatedMediaUrl(applicantAvatar) || applicantAvatar} />
                <AvatarFallback className='bg-primary/10 text-primary text-2xl'>
                  {applicantInitials}
                </AvatarFallback>
              </Avatar>

              <div className='min-w-0 flex-1 space-y-2'>
                <div className='flex flex-wrap items-center gap-2'>
                  <StatusBadge status='pending' label='Applicant dossier' />
                  <ApplicantTypePill type={displayApplicantType} />
                </div>
                <h1 className='text-foreground text-2xl font-semibold tracking-tight sm:text-3xl'>
                  {applicantName ?? 'Applicant'}
                </h1>
                <div className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm'>
                  <span className='inline-flex items-center gap-1.5'>
                    <MapPin className='size-4' />
                    {applicantLocation}
                  </span>
                  <span className='inline-flex items-center gap-1.5'>
                    <Calendar className='size-4' />
                    Created {formatDate(instructor?.created_date || organisation?.created_date)}
                  </span>
                </div>
                <p className='text-muted-foreground max-w-3xl text-sm'>{applicantHeadline}</p>

                <div className='flex items-center gap-1'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='text-muted-foreground hover:text-primary hover:bg-primary/10 size-9'
                    asChild
                    title='Open public profile'
                  >
                    <Link
                      href={`/profile-user/${instructor?.user_uuid}?domain=instructor`}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <LinkIcon className='size-5 rotate-45' />
                      <span className='sr-only'>Open public profile</span>
                    </Link>
                  </Button>

                  <Button
                    variant='ghost'
                    size='icon'
                    className='text-muted-foreground hover:text-primary hover:bg-primary/10 size-9'
                    title='Copy profile link'
                    onClick={() => {
                      const url = `${window.location.origin}/profile-user/${instructor?.user_uuid}?domain=instructor`;

                      navigator.clipboard.writeText(url);
                      toast.success('Profile link copied');
                    }}
                  >
                    <ClipboardList className='size-5' />
                    <span className='sr-only'>Copy profile link</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className=''>
          <div className='min-w-0 space-y-4'>
            <SectionCard title='Applicant dossier' description='Profile details and application history.'>
              <Tabs value={tab} onValueChange={value => setTab(value as typeof tab)} className='gap-4'>
                <TabsList className='bg-muted/60 h-auto w-full justify-start gap-1 rounded-2xl p-1'>
                  <TabsTrigger value='profile' className='rounded-xl px-4 py-2.5'>
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value='course' className='rounded-xl px-4 py-2.5'>
                    Course applications
                  </TabsTrigger>
                  <TabsTrigger value='program' className='rounded-xl px-4 py-2.5'>
                    Program applications
                  </TabsTrigger>
                </TabsList>

                {/* // manage applicant page
                // we need to 
                
                
                
                
                */}

                <TabsContent value='profile' className='mt-0'>
                  <ProfileCard
                    uuid={uuid}
                    type={displayApplicantType}
                    instructor={instructor}
                    organisation={organisation}
                    instructorUser={instructorUserData?.data as Instructor | undefined}
                    skills={skills}
                    education={education}
                    documents={documents}
                    reviews={reviews}
                  />
                </TabsContent>

                <TabsContent value='course' className='mt-0'>
                  <ApplicationsSection
                    title='Course applications'
                    description='Training applications submitted for courses owned by this course creator.'
                    applications={courseApplications}
                    courseMap={courseMap}
                    programMap={{}}
                    onApprove={(application) => openReview(application, 'approve')}
                    onReject={(application) => openReview(application, 'reject')}
                    onRevoke={(application) => openReview(application, 'revoke')}
                  />
                </TabsContent>

                <TabsContent value='program' className='mt-0'>
                  <ApplicationsSection
                    title='Program applications'
                    description='Training applications submitted for programs owned by this course creator.'
                    applications={programApplications}
                    courseMap={{}}
                    programMap={programMap}
                    onApprove={(application) => openReview(application, 'approve')}
                    onReject={(application) => openReview(application, 'reject')}
                    onRevoke={(application) => openReview(application, 'revoke')}
                  />
                </TabsContent>
              </Tabs>
            </SectionCard>

            {loading ? (
              <div className='border-border/60 bg-muted/20 rounded-md border p-4 text-sm text-muted-foreground'>
                Loading applicant records...
              </div>
            ) : null}
          </div>
          {/* 
          <aside className='space-y-4 lg:sticky lg:top-6'>
            <SectionCard title='Review notes' description='Use this panel to understand the current queue status.'>
              <div className='space-y-3 text-sm'>
                <div className='flex items-center justify-between gap-3'>
                  <span className='text-muted-foreground'>Applicant UUID</span>
                  <span className='font-mono text-xs break-all'>{uuid}</span>
                </div>
                <div className='flex items-center justify-between gap-3'>
                  <span className='text-muted-foreground'>Status</span>
                  <StatusBadge status={stats.pending > 0 ? 'pending' : 'approved'} />
                </div>
                <div className='flex items-center justify-between gap-3'>
                  <span className='text-muted-foreground'>Last updated</span>
                  <span>{formatDateTime(instructor?.updated_date || organisation?.updated_date)}</span>
                </div>
              </div>
            </SectionCard>

            {displayApplicantType === 'instructor' && instructor?.user_uuid ? (
              <SectionCard
                title='Profile link'
                description='View or copy this applicant’s public profile.'
              >
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    className='flex-1 gap-2'
                    asChild
                  >
                    <Link
                      href={`/profile-user/${instructor.user_uuid}?domain=instructor`}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <LinkIcon className='size-6 rotate-45' />
                    </Link>
                  </Button>

                  <Button
                    variant='outline'
                    className='flex-1 gap-2'
                    title='Copy profile link'
                    onClick={() => {
                      const url = `${window.location.origin}/profile-user/${instructor.user_uuid}?domain=instructor`;

                      navigator.clipboard.writeText(url);
                      toast.success('Profile link copied');
                    }}
                  >
                    <ClipboardList className='size-6' />
                  </Button>
                </div>
              </SectionCard>
            ) : null}
          </aside> */}
        </div>
      </div>

      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        application={selectedApplication}
        action={reviewAction}
        onSubmit={submitReview}
        isLoading={courseMutation.isPending || programMutation.isPending}
      />
    </main>
  );
}
