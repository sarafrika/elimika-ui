'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCourseCreator } from '@/context/course-creator-context';
import { extractPage } from '@/lib/api-helpers';
import { elimikaDesignSystem } from '@/lib/design-system';
import {
  CourseTrainingApplication,
  getInstructorByUuid,
  Instructor,
  InstructorDocument,
  InstructorEducation,
  InstructorReview,
  InstructorSkill,
  Organisation,
  ProgramTrainingApplication,
} from '@/services/client';
import {
  decideOnProgramTrainingApplicationMutation,
  decideOnTrainingApplicationMutation,
  getCourseByUuidOptions,
  getInstructorByUuidQueryKey,
  getInstructorDocumentsOptions,
  getInstructorEducationOptions,
  getInstructorReviewsOptions,
  getInstructorSkillsOptions,
  getOrganisationByUuidOptions,
  getTrainingProgramByUuidOptions,
  getUserByUuidOptions,
  searchProgramTrainingApplicationsOptions,
  searchProgramTrainingApplicationsQueryKey,
  searchTrainingApplicationsOptions,
  searchTrainingApplicationsQueryKey
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertCircle,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  FileText,
  Filter,
  GraduationCap,
  Loader2,
  MapPin,
  Menu,
  Search,
  Send,
  SortAsc,
  SortDesc,
  Star,
  ThumbsDown,
  ThumbsUp,
  User,
  Users,
  X,
  XCircle
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../../components/ui/dialog';
import { Textarea } from '../../../../../components/ui/textarea';

type TrainingApplication = CourseTrainingApplication | ProgramTrainingApplication;
type ApplicantType = 'instructor' | 'organisation';
type ApplicantListTypeFilter = 'all' | 'instructor' | 'organisation';

type ApplicantRecord = {
  uuid: string;
  type: ApplicantType;
  data: InstructorProfile | Organisation | undefined;
  isLoading: boolean;
  isError: boolean;
};

type InstructorListItem = {
  uuid: string;
  data: InstructorProfile;
  isLoading: boolean;
  isError: boolean;
};

type InstructorProfile = Instructor & {
  email?: string;
  location?: string;
  organization?: string;
  phone?: string;
  profile_picture_url?: string;
  status?: string;
};

type InstructorTab = 'profile' | 'course-application' | 'program-application';

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return typeof error.message === 'string' ? error.message : undefined;
  }
  return undefined;
};

const formatDisplayDate = (value: unknown) => {
  if (!value) return 'Not specified';
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return format(date, 'MMM dd, yyyy');
};

const isCourseApplication = (
  application: TrainingApplication | null
): application is CourseTrainingApplication =>
  application !== null && 'course_uuid' in application;

const isProgramApplication = (
  application: TrainingApplication | null
): application is ProgramTrainingApplication =>
  application !== null && 'program_uuid' in application;

const statusOptions = [
  { value: 'All statuses', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'revoked', label: 'Revoked' },
];

const applicantTypeOptions = [
  { label: 'All types', value: 'all' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'organisation', label: 'Organisation' },
];

function getStatusBadgeVariant(status?: string) {
  switch (status?.toLowerCase()) {
    case 'approved': return 'default';
    case 'pending': return 'secondary';
    case 'rejected':
    case 'revoked': return 'destructive';
    default: return 'secondary';
  }
}

function getStatusIcon(status?: string) {
  switch (status?.toLowerCase()) {
    case 'approved': return <CheckCircle2 className='h-3.5 w-3.5' />;
    case 'rejected':
    case 'revoked': return <XCircle className='h-3.5 w-3.5' />;
    default: return <Clock className='h-3.5 w-3.5' />;
  }
}

function ApplicantTypePill({ type }: { type: ApplicantType }) {
  if (type === 'instructor') {
    return (
      <span className='inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary'>
        <GraduationCap className='h-3 w-3' />
        Instructor
      </span>
    );
  }
  return (
    <span className='inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground'>
      <Building2 className='h-3 w-3' />
      Organisation
    </span>
  );
}

function EmptyStateCard({ message }: { title?: string; message: string; icon?: React.ReactNode }) {
  return <p className='text-muted-foreground text-sm'>{message}</p>;
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className='border-border bg-card rounded-xl border p-3'>
      <div className='flex items-center gap-3'>
        <div className={`rounded-lg p-2 ${accent ? 'bg-warning/10' : 'bg-muted'}`}>
          <Icon className={`h-4 w-4 ${accent ? 'text-warning' : 'text-primary'}`} />
        </div>
        <div>
          <p className='text-muted-foreground text-[10px] uppercase tracking-wide'>{label}</p>
          <p className='text-foreground text-lg font-bold'>{value}</p>
        </div>
      </div>
    </div>
  );
}

function ApplicationCard({
  application,
  onApprove,
  onReject,
  onRevoke,
  type = 'course',
}: {
  application: TrainingApplication;
  onApprove: () => void;
  onReject: () => void;
  onRevoke: () => void;
  type: 'course' | 'program';
}) {
  const isPending = application.status?.toLowerCase() === 'pending';
  const isApproved = application.status?.toLowerCase() === 'approved';
  const applicantUuid = application.applicant_uuid;
  const applicationType = application.applicant_type;

  const isCourse = type === 'course';
  const courseUuid = isCourse && isCourseApplication(application) ? application.course_uuid : undefined;
  const programUuid = !isCourse && isProgramApplication(application) ? application.program_uuid : undefined;

  const { data: courseData } = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseUuid as string } }),
    enabled: !!courseUuid,
  });

  const { data: programData } = useQuery({
    ...getTrainingProgramByUuidOptions({ path: { uuid: programUuid as string } }),
    enabled: !!programUuid,
  });

  const name = isCourse ? courseData?.data?.name : programData?.data?.title;

  return (
    <div className='bg-card border-border rounded-2xl border p-4 shadow-sm'>
      <div className='mb-2 flex items-start justify-between gap-2'>
        <p className='text-foreground truncate text-sm font-semibold'>{name || 'Loading...'}</p>
        <Badge variant={getStatusBadgeVariant(application.status)} className='flex shrink-0 items-center gap-1'>
          {getStatusIcon(application.status)}
          {application.status}
        </Badge>
      </div>

      <div className='mb-1 flex items-center gap-2'>
        <ApplicantTypePill type={(applicationType as ApplicantType) ?? 'instructor'} />
      </div>

      <Separator className='my-3' />

      <div className='space-y-3'>
        {application.created_date && (
          <div className='text-muted-foreground flex items-center gap-2 text-xs'>
            <Calendar className='h-3 w-3 shrink-0' />
            <span>Applied {format(new Date(application.created_date), 'MMM dd, yyyy')}</span>
          </div>
        )}

        {application.rate_card && (
          <div className='bg-muted/40 space-y-2 rounded-xl p-3'>
            <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium'>
              <DollarSign className='h-3 w-3' />
              Rate card
            </div>
            <div className='grid grid-cols-2 gap-2 text-xs'>
              <div>
                <span className='text-muted-foreground'>Private online:</span>
                <p className='text-foreground font-medium'>
                  {application.rate_card.currency || 'KES'} {application.rate_card.private_online_rate || 0}
                </p>
              </div>
              <div>
                <span className='text-muted-foreground'>Group online:</span>
                <p className='text-foreground font-medium'>
                  {application.rate_card.currency || 'KES'} {application.rate_card.group_online_rate || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {application.application_notes && (
          <div>
            <p className='text-muted-foreground mb-1 text-xs font-medium'>Application notes</p>
            <p className='text-muted-foreground line-clamp-2 text-xs italic'>
              &quot;{application.application_notes}&quot;
            </p>
          </div>
        )}

        {application.review_notes && (
          <div className='border-primary/20 bg-primary/5 rounded-xl border p-2'>
            <p className='text-foreground mb-1 text-xs font-medium'>Review notes</p>
            <p className='text-muted-foreground line-clamp-2 text-xs'>{application.review_notes}</p>
          </div>
        )}
      </div>

      <div className='mt-4 flex items-center gap-2'>
        {isPending && (
          <>
            <Button size='sm' variant='default' className='flex-1' onClick={onApprove}>
              <ThumbsUp className='mr-2 h-3.5 w-3.5' />
              Approve
            </Button>
            <Button size='sm' variant='outline' onClick={onReject}>
              <ThumbsDown className='text-destructive h-3.5 w-3.5' />
            </Button>
          </>
        )}
        {isApproved && (
          <Button size='sm' variant='outline' className='flex-1' onClick={onRevoke}>
            <XCircle className='mr-2 h-3.5 w-3.5' />
            Revoke
          </Button>
        )}
        {!isPending && !isApproved && (
          <p className='text-muted-foreground flex-1 text-center text-xs'>
            {application.status === 'rejected' ? 'Application was rejected' : 'Approval was revoked'}
          </p>
        )}
      </div>
    </div>
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

  const actionConfig = {
    approve: {
      title: 'Approve application',
      description: 'Approve this training application to allow the applicant to train this course.',
      icon: ThumbsUp,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
    },
    reject: {
      title: 'Reject application',
      description: 'Reject this training application. Please provide a reason for rejection.',
      icon: ThumbsDown,
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
    },
    revoke: {
      title: 'Revoke approval',
      description: 'Revoke the previously approved application. Please provide a reason.',
      icon: AlertCircle,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
    },
  };

  const config = actionConfig[action];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className='flex items-center gap-3'>
            <div className={`rounded-xl p-2.5 ${config.iconBg}`}>
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            <div>
              <DialogTitle>{config.title}</DialogTitle>
              <DialogDescription className='mt-1'>{config.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {application && (
          <div className='space-y-4 py-2'>
            <div className='border-border bg-muted/30 space-y-2 rounded-xl border p-4'>
              <div className='flex items-center gap-2'>
                <Users className='text-muted-foreground h-4 w-4' />
                <Badge variant='outline' className='text-xs'>
                  {application.applicant_type}
                </Badge>
              </div>
              {application.application_notes && (
                <p className='text-muted-foreground text-sm'>
                  &quot;{application.application_notes}&quot;
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label>
                Review notes{' '}
                {action === 'reject' && <span className='text-destructive'>*</span>}
              </Label>
              <Textarea
                placeholder={`Add your ${action} notes...`}
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                rows={4}
                className='rounded-xl'
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => { onSubmit(reviewNotes); setReviewNotes(''); }}
            disabled={isLoading || (action === 'reject' && !reviewNotes.trim())}
          >
            {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Revoke'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApplicationsTabContent({
  type,
  stats,
  closedCount,
  isLoading,
  applications,
  statusFilter,
  setStatusFilter,
  applicantTypeFilter,
  setApplicantTypeFilter,
  searchValue,
  setSearchValue,
  page,
  setPage,
  totalPages,
  reviewDialogOpen,
  setReviewDialogOpen,
  selectedApplication,
  reviewAction,
  handleReview,
  onSubmit,
  isMutationPending,
}: {
  type: 'course' | 'program';
  stats: { total: number; pending: number; approved: number };
  closedCount: number;
  isLoading: boolean;
  applications: TrainingApplication[];
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  applicantTypeFilter: string;
  setApplicantTypeFilter: (v: string) => void;
  searchValue: string;
  setSearchValue: (v: string) => void;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  reviewDialogOpen: boolean;
  setReviewDialogOpen: (v: boolean) => void;
  selectedApplication: TrainingApplication | null;
  reviewAction: 'approve' | 'reject' | 'revoke';
  handleReview: (app: TrainingApplication, action: 'approve' | 'reject' | 'revoke') => void;
  onSubmit: (notes: string) => void;
  isMutationPending: boolean;
}) {
  const label = type === 'course' ? 'Courses' : 'Programs';

  return (
    <div className='space-y-5'>
      <h3 className='text-foreground font-bold'>
        Instructor&apos;s application to train {label.toLowerCase()}
      </h3>

      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <StatCard icon={FileText} label='Total' value={stats.total} />
        <StatCard icon={Clock} label='Pending' value={stats.pending} />
        <StatCard icon={CheckCircle2} label='Approved' value={stats.approved} />
        <StatCard icon={AlertCircle} label='Rejected / Revoked' value={closedCount} accent />
      </div>

      {/* Filters */}
      <div className='flex flex-col gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <Filter className='text-muted-foreground h-4 w-4' />

          <Select
            value={statusFilter}
            onValueChange={v => {
              setStatusFilter(v);
              setPage(0);
            }}
          >
            <SelectTrigger className='h-9 w-auto min-w-[136px] rounded-xl text-sm'>
              <SelectValue placeholder='All statuses' />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={applicantTypeFilter}
            onValueChange={v => {
              setApplicantTypeFilter(v);
              setPage(0);
            }}
          >
            <SelectTrigger className='h-9 w-auto min-w-[120px] rounded-xl text-sm'>
              <SelectValue placeholder='All types' />
            </SelectTrigger>
            <SelectContent>
              {applicantTypeOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(statusFilter !== 'all' || applicantTypeFilter !== 'all') && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                setStatusFilter('all');
                setApplicantTypeFilter('all');
                setPage(0);
              }}
            >
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>

        <div className='relative'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />

          <Input
            placeholder='Search by applicant name or notes...'
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            className='pl-10'
          />

          {searchValue && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setSearchValue('')}
              className='absolute top-1/2 right-1 -translate-y-1/2'
            >
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className='grid gap-4 md:grid-cols-2'>
          {[...Array(4)].map((_, i) => <Skeleton key={i} className='h-56 rounded-2xl' />)}
        </div>
      ) : applications.length === 0 ? (
        <div className={elimikaDesignSystem.components.emptyState.container}>
          <FileText className={elimikaDesignSystem.components.emptyState.icon} />
          <h3 className={elimikaDesignSystem.components.emptyState.title}>
            {searchValue || statusFilter || applicantTypeFilter ? 'No applications found' : `No ${label.toLowerCase()} applications yet`}
          </h3>
          <p className={elimikaDesignSystem.components.emptyState.description}>
            {searchValue || statusFilter || applicantTypeFilter
              ? 'Try adjusting your search or filters.'
              : `Applications will appear here when instructors or organisations apply to train your ${label.toLowerCase()}.`}
          </p>
        </div>
      ) : (
        <>
          <div className='grid gap-4 md:grid-cols-2'>
            {applications.map(app => (
              <ApplicationCard
                key={app.uuid}
                type={type}
                application={app}
                onApprove={() => handleReview(app, 'approve')}
                onReject={() => handleReview(app, 'reject')}
                onRevoke={() => handleReview(app, 'revoke')}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className='flex items-center justify-center gap-2 pt-2'>
              <Button variant='outline' size='sm' onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                Previous
              </Button>
              <span className='text-muted-foreground text-sm'>Page {page + 1} of {totalPages}</span>
              <Button variant='outline' size='sm' onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <ReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        application={selectedApplication}
        action={reviewAction}
        onSubmit={onSubmit}
        isLoading={isMutationPending}
      />
    </div>
  );
}

function ProfileTabContent({
  selectedApplicantType,
  instructor,
  organisation,
  skills,
  education,
  documents,
  reviews,
  instructorUserData,
  selectedApplicantName,
  selectedApplicantHeadline,
  selectedApplicantLocation,
  selectedApplicantInitials,
  selectedApplicantId,
  selectedApplicantStatusBadge,
}: {
  selectedApplicantType: ApplicantType | null;
  instructor: InstructorProfile | undefined;
  organisation: Organisation | undefined;
  skills: InstructorSkill[];
  education: InstructorEducation[];
  documents: InstructorDocument[];
  reviews: InstructorReview[];
  instructorUserData: Instructor[];
  selectedApplicantName: string | undefined;
  selectedApplicantHeadline: string;
  selectedApplicantLocation: string;
  selectedApplicantInitials: string;
  selectedApplicantId: string;
  selectedApplicantStatusBadge: string;
}) {
  const instructorData = instructor?.data

  return (
    <div className='space-y-5'>
      {/* Header card */}
      <Card className='rounded-[28px] border-border/70 p-6 shadow-sm'>
        {/* Links row */}
        <div className='mb-5 flex flex-wrap items-center gap-4 text-sm'>
          {selectedApplicantType === 'instructor' && instructorData?.user_uuid ? (
            <>
              <a
                href={`/profile-user/${instructorData.user_uuid}?domain=instructor`}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary inline-flex items-center gap-1.5 hover:underline'
              >
                <Send size={14} />
                View full profile
              </a>
              <button
                type='button'
                onClick={() => {
                  const url = `${window.location.origin}/profile-user/${instructorData.user_uuid}?domain=instructor`;
                  navigator.clipboard.writeText(url);
                  toast.success('Profile link copied');
                }}
                className='text-primary inline-flex items-center gap-1.5 hover:underline'
              >
                <Copy size={14} />
                Copy profile link
              </button>
            </>
          ) : (
            <Badge variant='secondary' className='gap-1.5'>
              <Building2 className='h-3.5 w-3.5' />
              Organisation applicant
            </Badge>
          )}
        </div>

        <div className='flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between'>
          <div className='flex items-start gap-4'>
            <Avatar className='h-16 w-16 border'>
              <AvatarImage src={selectedApplicantType === 'instructor' ? instructorData?.profile_picture_url : undefined} />
              <AvatarFallback className={`text-lg ${selectedApplicantType === 'organisation' ? 'bg-accent/20 text-accent-foreground' : 'bg-primary/10 text-primary'}`}>
                {selectedApplicantInitials}
              </AvatarFallback>
            </Avatar>
            <div className='space-y-1.5'>
              <div className='flex items-center gap-2'>
                {selectedApplicantType === "instructor" ? <h3 className='text-foreground text-2xl font-bold tracking-tight'>
                  {instructorData?.full_name}
                </h3> : <h3 className='text-foreground text-2xl font-bold tracking-tight'>
                  {organisation?.name}
                </h3>}

                <ApplicantTypePill type={selectedApplicantType ?? 'instructor'} />
              </div>

              {selectedApplicantType === "instructor" ? <p className='text-muted-foreground'>{instructorData?.professional_headline}</p>
                : <p className='text-muted-foreground'>{organisation?.licence_no}</p>
              }

              <p className='text-muted-foreground flex items-center gap-1.5 text-sm'>
                <MapPin className='h-4 w-4 shrink-0' />
                {selectedApplicantLocation}
              </p>
            </div>
          </div>

          <div className='grid gap-4 text-left sm:grid-cols-2 xl:min-w-[200px] xl:text-right'>
            <div>
              <p className='text-muted-foreground text-sm font-medium'>
                {selectedApplicantType === 'organisation' ? 'Organisation ID' : 'Instructor ID'}
              </p>
              <p className='text-foreground font-semibold'>{selectedApplicantType === "instructor" ? instructorData?.uuid : selectedApplicantId}    </p>
            </div>
            <div>
              <p className='text-muted-foreground text-sm font-medium'>Status</p>
              <Badge variant={selectedApplicantStatusBadge === 'Verified' ? 'success' : 'secondary'} className='mt-1'>
                {selectedApplicantStatusBadge}
              </Badge>
            </div>
          </div>
        </div>

        <Separator className='my-5' />

        <div className='grid gap-5 md:grid-cols-3'>
          <div>
            <p className='text-muted-foreground text-sm font-medium'>Phone</p>
            <p className='text-foreground mt-1 text-sm'>
              {instructorUserData?.data?.phone_number || instructorData?.phone || 'Not specified'}
            </p>
          </div>
          <div>
            <p className='text-muted-foreground text-sm font-medium'>Email</p>
            <p className='text-foreground mt-1 text-sm'>
              {instructorUserData?.data?.email || instructorData?.email || 'Not specified'}
            </p>
          </div>
          <div>
            <p className='text-muted-foreground text-sm font-medium'>
              {selectedApplicantType === 'organisation' ? 'Country' : 'Organisation'}
            </p>
            <p className='text-foreground mt-1 text-sm'>
              {selectedApplicantType === 'organisation'
                ? organisation?.country || 'Not specified'
                : instructorData?.organization || 'Not specified'}
            </p>
          </div>
        </div>
      </Card>

      {/* Organisation-specific overview */}
      {selectedApplicantType === 'organisation' && organisation && (
        <Card className='rounded-[28px] border-border/70 p-6 shadow-sm'>
          <div className='mb-4 flex items-center gap-2'>
            <Building2 className='text-primary h-5 w-5' />
            <h3 className='text-foreground text-xl font-semibold'>Organisation overview</h3>
          </div>
          <div className='grid gap-4 md:grid-cols-2'>
            <div>
              <p className='text-muted-foreground text-sm font-medium'>Description</p>
              <p className='text-foreground mt-1 text-sm leading-6'>{organisation.description || 'No description provided.'}</p>
            </div>
            <div className='space-y-3'>
              {organisation.location && (
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>Location</p>
                  <p className='text-foreground mt-1 flex items-center gap-1.5 text-sm'>
                    <MapPin className='h-4 w-4 text-primary' />
                    {organisation.location}
                  </p>
                </div>
              )}
              {organisation.country && (
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>Country</p>
                  <p className='text-foreground mt-1 text-sm'>{organisation.country}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Instructor-specific sections */}
      {selectedApplicantType === 'instructor' && (
        <>
          <div className='grid gap-5 xl:grid-cols-2'>
            {/* Personal info */}
            <Card className='rounded-[28px] border-border/70 p-6 shadow-sm'>
              <div className='mb-4 flex items-center gap-2'>
                <User className='text-primary h-5 w-5' />
                <h3 className='text-foreground text-xl font-semibold'>Personal information</h3>
              </div>
              <div className='space-y-4'>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div>
                    <p className='text-muted-foreground text-sm font-medium'>Gender</p>
                    <p className='text-foreground mt-1 text-sm'>
                      {instructorUserData?.data?.gender ||
                        (instructor as InstructorProfile & { gender?: string })?.gender ||
                        'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className='text-muted-foreground text-sm font-medium'>Date of birth</p>
                    <p className='text-foreground mt-1 text-sm'>
                      {formatDisplayDate(
                        (instructorUserData?.data as { dob?: unknown } | undefined)?.dob ||
                        (instructor as InstructorProfile & { date_of_birth?: unknown })?.date_of_birth
                      )}
                    </p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>Address</p>
                  <p className='text-foreground mt-1 text-sm'>
                    {instructor?.formatted_location || instructor?.location || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>Profile complete</p>
                  <p className='text-foreground mt-1 text-sm'>{instructor?.is_profile_complete ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm font-medium'>About</p>
                  {instructor?.bio ? (
                    <div
                      className='text-muted-foreground mt-1 text-sm leading-6'
                      dangerouslySetInnerHTML={{ __html: instructor.bio }}
                    />
                  ) : (
                    <p className='text-muted-foreground mt-1 text-sm'>No bio provided.</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Education */}
            <Card className='rounded-[28px] border-border/70 p-6 shadow-sm'>
              <div className='mb-4 flex items-center gap-2'>
                <GraduationCap className='text-primary h-5 w-5' />
                <h3 className='text-foreground text-xl font-semibold'>Education</h3>
              </div>
              {education.length === 0 ? (
                <EmptyStateCard message='No education information available.' />
              ) : (
                <div className='space-y-4'>
                  {education.map(edu => (
                    <div key={edu.uuid} className='space-y-1'>
                      <p className='text-foreground text-sm font-semibold'>{edu.qualification || 'Qualification not specified'}</p>
                      <p className='text-muted-foreground text-sm'>{edu.school_name || 'Institution not specified'}</p>
                      <p className='text-muted-foreground text-xs'>
                        {edu.year_completed ? `Completed ${edu.year_completed}` : 'Year not specified'}
                      </p>
                      {edu.education_level && <p className='text-muted-foreground text-xs'>{edu.education_level}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className='grid gap-5 xl:grid-cols-[1.1fr_0.9fr]'>
            {/* Skills */}
            <Card className='rounded-[28px] border-border/70 p-6 shadow-sm'>
              <div className='mb-4 flex items-center gap-2'>
                <Award className='text-primary h-5 w-5' />
                <h3 className='text-foreground text-xl font-semibold'>Skills</h3>
              </div>
              {skills.length === 0 ? (
                <EmptyStateCard message='No skills listed.' />
              ) : (
                <div className='flex flex-wrap gap-2'>
                  {skills.map(skill => (
                    <Badge key={skill.uuid} variant='secondary' className='px-3 py-1'>
                      {skill.skill_name} ({skill.proficiency_level})
                    </Badge>
                  ))}
                </div>
              )}
            </Card>

            {/* Documents */}
            <Card className='rounded-[28px] border-border/70 p-6 shadow-sm'>
              <div className='mb-4 flex items-center gap-2'>
                <FileText className='text-primary h-5 w-5' />
                <h3 className='text-foreground text-xl font-semibold'>Documents</h3>
              </div>
              {documents.length === 0 ? (
                <EmptyStateCard message='No documents uploaded.' />
              ) : (
                <div className='space-y-3'>
                  {documents.map(doc => (
                    <div key={doc.uuid} className='border-border/60 rounded-xl border p-3'>
                      <p className='text-foreground text-sm font-medium'>{doc.title || doc.original_filename}</p>
                      <p className='text-muted-foreground mt-0.5 text-xs'>{doc.verification_status || doc.status || 'Document'}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Reviews */}
          <Card className='rounded-[28px] border-border/70 p-6 shadow-sm'>
            <div className='mb-4 flex items-center gap-2'>
              <Star className='text-primary h-5 w-5' />
              <h3 className='text-foreground text-xl font-semibold'>Reviews</h3>
            </div>
            {reviews.length === 0 ? (
              <EmptyStateCard message='No reviews yet.' />
            ) : (
              <div className='space-y-4'>
                {reviews.map(review => (
                  <div key={review.uuid} className='border-b pb-4 last:border-0 last:pb-0'>
                    <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
                      <div className='flex-1'>
                        <p className='text-foreground font-semibold'>{review.headline}</p>
                        <p className='text-muted-foreground mt-1 text-sm'>{review.comments}</p>
                      </div>
                      <div className='flex shrink-0'>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < (review.rating || 0)
                              ? 'fill-warning text-warning'
                              : 'text-muted'
                              }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

const InstructorsApplicationPage = () => {
  const [tabs, setTabs] = useState<InstructorTab>('profile');
  const qc = useQueryClient();
  const { profile: courseCreator } = useCourseCreator();

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);
  const [isMobileTabsOpen, setIsMobileTabsOpen] = useState(false);

  // Left sidebar filters
  const [applicantListTypeFilter, setApplicantListTypeFilter] = useState<ApplicantListTypeFilter>('all');
  const [instructorSearchQuery, setInstructorSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'approved' | 'pending'>('all');

  // Application filters
  const [statusFilter, setStatusFilter] = useState('');
  const [applicantTypeFilter, setApplicantTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 12;
  const [searchValue, setSearchValue] = useState('');

  // Selected applicant
  const [selectedApplicantUuid, setSelectedApplicantUuid] = useState<string | null>(null);

  // Review dialog
  const [selectedApplication, setSelectedApplication] = useState<TrainingApplication | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'revoke'>('approve');

  // ── Data fetching ──────────────────────────────────────────────────────────

  const applicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        searchParams: { course_creator_uuid: courseCreator?.uuid as string },
        pageable: { page, size: pageSize },
      },
    }),
  });
  const applicationsPage = extractPage<CourseTrainingApplication>(applicationsQuery.data);
  const allApplications = applicationsPage.items;

  const programApplicationsQuery = useQuery({
    ...searchProgramTrainingApplicationsOptions({
      query: { searchParams: {}, pageable: { page, size: pageSize } },
    }),
  });
  const programApplicationsPage = extractPage<ProgramTrainingApplication>(programApplicationsQuery.data);
  const allProgramApplications = programApplicationsPage.items;

  const instructorUuids = useMemo(() => {
    const combined = [...(allApplications ?? []), ...(allProgramApplications ?? [])];
    return Array.from(new Set(
      combined
        .filter(app => app.applicant_type === 'instructor')
        .map(app => app.applicant_uuid)
        .filter(Boolean)
    )) as string[];
  }, [allApplications, allProgramApplications]);

  const organisationUuids = useMemo(() => {
    const combined = [...(allApplications ?? []), ...(allProgramApplications ?? [])];
    return Array.from(new Set(
      combined
        .filter(app => app.applicant_type === 'organisation')
        .map(app => app.applicant_uuid)
        .filter(Boolean)
    )) as string[];
  }, [allApplications, allProgramApplications]);

  const instructorQueries = useQueries({
    queries: instructorUuids.map(uuid => ({
      queryKey: getInstructorByUuidQueryKey({ path: { uuid } }),
      queryFn: () => getInstructorByUuid({ path: { uuid } }),
      enabled: !!uuid,
    })),
  });

  const organisationQueries = useQueries({
    queries: organisationUuids.map(uuid => ({
      ...getOrganisationByUuidOptions({ path: { uuid } }),
      enabled: !!uuid,
    })),
  });

  const instructors = useMemo(() => {
    return instructorQueries
      .map((query, index) => ({
        uuid: instructorUuids[index] as string,
        data: query.data?.data as InstructorProfile | undefined,
        isLoading: query.isLoading,
        isError: query.isError,
      }))
      .filter((item): item is InstructorListItem => Boolean(item.data));
  }, [instructorQueries, instructorUuids]);

  const organisations = useMemo(() => {
    return organisationQueries
      .map((query, index) => ({
        uuid: organisationUuids[index] as string,
        type: 'organisation' as const,
        data: query.data?.data as Organisation | undefined,
        isLoading: query.isLoading,
        isError: query.isError,
      }))
      .filter((item): item is ApplicantRecord => Boolean(item.data));
  }, [organisationQueries, organisationUuids]);

  const applicants = useMemo<ApplicantRecord[]>(() => {
    const instructorApplicants: ApplicantRecord[] = instructors.map(item => ({
      uuid: item.uuid,
      type: 'instructor',
      data: item.data,
      isLoading: item.isLoading,
      isError: item.isError,
    }));

    return [...instructorApplicants, ...organisations].sort((a, b) => {
      const dateA = new Date(a.data?.created_date || '').getTime();
      const dateB = new Date(b.data?.created_date || '').getTime();
      if (Number.isNaN(dateA) || Number.isNaN(dateB)) {
        const nameA = (a.data as InstructorProfile)?.full_name || (a.data as Organisation)?.name || '';
        const nameB = (b.data as InstructorProfile)?.full_name || (b.data as Organisation)?.name || '';
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [instructors, organisations, sortOrder]);

  const isLoadingApplicants =
    instructorQueries.some(q => q.isLoading) ||
    organisationQueries.some(q => q.isLoading);

  // Auto-select first applicant
  useEffect(() => {
    if (applicants.length > 0 && !selectedApplicantUuid) {
      setSelectedApplicantUuid(applicants[0].uuid);
    }
  }, [applicants, selectedApplicantUuid]);

  // ── Sidebar filtered list ──────────────────────────────────────────────────

  const filteredApplicants = useMemo(() => {
    let filtered = applicants;

    // Type filter
    if (applicantListTypeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === applicantListTypeFilter);
    }

    // Verification filter
    if (verificationFilter !== 'all') {
      filtered = filtered.filter(item => {
        const verified = item.data?.admin_verified ?? false;
        return verificationFilter === 'approved' ? verified : !verified;
      });
    }

    // Search
    if (instructorSearchQuery) {
      const q = instructorSearchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const name = item.type === 'instructor'
          ? (item.data as InstructorProfile)?.full_name || ''
          : (item.data as Organisation)?.name || '';
        const secondary = item.type === 'instructor'
          ? [(item.data as InstructorProfile)?.professional_headline, (item.data as InstructorProfile)?.email, (item.data as InstructorProfile)?.bio]
          : [(item.data as Organisation)?.description, (item.data as Organisation)?.location];
        return [name, ...secondary].filter(Boolean).some(v => v!.toLowerCase().includes(q));
      });
    }

    return filtered;
  }, [applicants, applicantListTypeFilter, verificationFilter, instructorSearchQuery]);

  // ── Selected applicant derived values ─────────────────────────────────────

  const selectedApplicant = useMemo(
    () => applicants.find(a => a.uuid === selectedApplicantUuid) ?? null,
    [applicants, selectedApplicantUuid]
  );
  const selectedApplicantType = selectedApplicant?.type ?? null;

  const organisation =
    selectedApplicantType === 'organisation'
      ? (selectedApplicant?.data as Organisation)
      : undefined;

  const instructor =
    selectedApplicantType === 'instructor'
      ? (selectedApplicant?.data as InstructorProfile)
      : selectedApplicantType === 'organisation'
        ? ({
          uuid: organisation?.uuid,
          full_name: organisation?.name,
          professional_headline: organisation?.description,
          formatted_location: organisation?.location || organisation?.country,
          location: organisation?.location || organisation?.country,
          admin_verified: organisation?.admin_verified,
          bio: organisation?.description,
        } as InstructorProfile)
        : undefined;

  const selectedApplicantName =
    selectedApplicantType === 'organisation' ? organisation?.name : instructor?.full_name;
  const selectedApplicantHeadline =
    selectedApplicantType === 'organisation'
      ? organisation?.description || 'Organisation applicant'
      : instructor?.professional_headline || 'Professional';
  const selectedApplicantLocation =
    selectedApplicantType === 'organisation'
      ? organisation?.location || organisation?.country || 'Location not specified'
      : instructor?.formatted_location || instructor?.location || 'Location not specified';
  const selectedApplicantInitials =
    (selectedApplicantName || 'IN').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  const selectedApplicantId =
    (selectedApplicantType === 'organisation' ? organisation?.uuid : instructor?.uuid)?.slice(0, 8) || 'N/A';
  const selectedApplicantStatusBadge =
    (selectedApplicantType === 'organisation' ? organisation?.admin_verified : instructor?.admin_verified)
      ? 'Verified' : 'Pending';

  // ── Secondary queries for selected instructor ──────────────────────────────

  const { data: skillsData } = useQuery({
    ...getInstructorSkillsOptions({
      path: { instructorUuid: selectedApplicantUuid as string },
      query: { pageable: {} },
    }),
    enabled: selectedApplicantType === 'instructor' && !!selectedApplicantUuid,
  });
  const { data: educationData } = useQuery({
    ...getInstructorEducationOptions({ path: { instructorUuid: selectedApplicantUuid as string } }),
    enabled: selectedApplicantType === 'instructor' && !!selectedApplicantUuid,
  });
  const { data: documentsData } = useQuery({
    ...getInstructorDocumentsOptions({ path: { instructorUuid: selectedApplicantUuid as string } }),
    enabled: selectedApplicantType === 'instructor' && !!selectedApplicantUuid,
  });
  const { data: reviewsData } = useQuery({
    ...getInstructorReviewsOptions({ path: { instructorUuid: selectedApplicantUuid as string } }),
    enabled: selectedApplicantType === 'instructor' && !!selectedApplicantUuid,
  });
  const { data: instructorUserData } = useQuery({
    ...getUserByUuidOptions({ path: { uuid: instructor?.user_uuid as string } }),
    enabled: !!instructor?.user_uuid,
  });

  const skills: InstructorSkill[] = skillsData?.data?.content ?? [];
  const education: InstructorEducation[] = educationData?.data ?? [];
  const documents: InstructorDocument[] = documentsData?.data ?? [];
  const reviews: InstructorReview[] = reviewsData?.data ?? [];

  // ── Application name map ───────────────────────────────────────────────────

  const applicantNameMap = useMemo(() => {
    const map = new Map<string, string>();
    instructorQueries.forEach(q => {
      const d = q.data?.data;
      if (d?.uuid) map.set(d.uuid, d.full_name ?? '');
    });
    organisationQueries.forEach(q => {
      const d = q.data?.data;
      if (d?.uuid) map.set(d.uuid, d.name ?? '');
    });
    return map;
  }, [instructorQueries, organisationQueries]);

  // ── Application filtering ──────────────────────────────────────────────────

  const filteredApplications = useMemo(() => {
    let items = allApplications;
    if (selectedApplicantUuid) items = items.filter(app => app.applicant_uuid === selectedApplicantUuid);
    if (statusFilter) items = items.filter(app => app.status?.toLowerCase() === statusFilter.toLowerCase());
    if (applicantTypeFilter) items = items.filter(app => app.applicant_type?.toLowerCase() === applicantTypeFilter.toLowerCase());
    if (searchValue) {
      const term = searchValue.toLowerCase();
      items = items.filter(app => {
        const name = applicantNameMap.get(app.applicant_uuid ?? '')?.toLowerCase() ?? '';
        return name.includes(term) || app.course_uuid?.toLowerCase().includes(term) || app.application_notes?.toLowerCase().includes(term);
      });
    }
    return items;
  }, [allApplications, selectedApplicantUuid, statusFilter, applicantTypeFilter, searchValue, applicantNameMap]);

  const filteredProgramApplications = useMemo(() => {
    let items = allProgramApplications;
    if (selectedApplicantUuid) items = items.filter(app => app.applicant_uuid === selectedApplicantUuid);
    if (statusFilter) items = items.filter(app => app.status?.toLowerCase() === statusFilter.toLowerCase());
    if (applicantTypeFilter) items = items.filter(app => app.applicant_type?.toLowerCase() === applicantTypeFilter.toLowerCase());
    if (searchValue) {
      const term = searchValue.toLowerCase();
      items = items.filter(app => {
        const name = applicantNameMap.get(app.applicant_uuid ?? '')?.toLowerCase() ?? '';
        return name.includes(term) || app.program_uuid?.toLowerCase().includes(term) || app.application_notes?.toLowerCase().includes(term);
      });
    }
    return items;
  }, [allProgramApplications, selectedApplicantUuid, statusFilter, applicantTypeFilter, searchValue, applicantNameMap]);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total: filteredApplications.length,
    pending: filteredApplications.filter(a => a.status?.toLowerCase() === 'pending').length,
    approved: filteredApplications.filter(a => a.status?.toLowerCase() === 'approved').length,
    revoked: filteredApplications.filter(a => a.status?.toLowerCase() === 'revoked').length,
    rejected: filteredApplications.filter(a => a.status?.toLowerCase() === 'rejected').length,
  }), [filteredApplications]);

  const programStats = useMemo(() => ({
    total: filteredProgramApplications.length,
    pending: filteredProgramApplications.filter(a => a.status?.toLowerCase() === 'pending').length,
    approved: filteredProgramApplications.filter(a => a.status?.toLowerCase() === 'approved').length,
    revoked: filteredProgramApplications.filter(a => a.status?.toLowerCase() === 'revoked').length,
    rejected: filteredProgramApplications.filter(a => a.status?.toLowerCase() === 'rejected').length,
  }), [filteredProgramApplications]);

  const totalPages = Math.max(Math.ceil(filteredApplications.length / pageSize), 1);
  const programTotalPages = Math.max(Math.ceil(filteredProgramApplications.length / pageSize), 1);

  const tabOptions: Array<{ value: InstructorTab; label: string }> = [
    { value: 'profile', label: 'Profile' },
    { value: 'course-application', label: `Courses (${stats.pending})` },
    { value: 'program-application', label: `Programs (${programStats.pending})` },
  ];
  const activeTabLabel = tabOptions.find(o => o.value === tabs)?.label ?? 'Profile';

  // ── Mutations ──────────────────────────────────────────────────────────────

  const handleReview = (application: TrainingApplication, action: 'approve' | 'reject' | 'revoke') => {
    setSelectedApplication(application);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const decideMutation = useMutation(decideOnTrainingApplicationMutation());
  const handleSubmitReview = (reviewNotes: string) => {
    if (!selectedApplication?.uuid || !isCourseApplication(selectedApplication) || !selectedApplication.course_uuid) {
      toast.error('Missing application details');
      return;
    }
    decideMutation.mutate(
      {
        path: { courseUuid: selectedApplication.course_uuid, applicationUuid: selectedApplication.uuid },
        query: { action: reviewAction },
        body: { review_notes: reviewNotes },
      },
      {
        onSuccess: () => {
          toast.success(`Application ${reviewAction}d successfully`);
          qc.invalidateQueries({ queryKey: searchTrainingApplicationsQueryKey({ query: { searchParams: { course_creator_uuid: courseCreator?.uuid as string }, pageable: { page, size: pageSize } } }) });
          setReviewDialogOpen(false);
          setSelectedApplication(null);
        },
        onError: (error: unknown) => toast.error(getErrorMessage(error) || `Failed to ${reviewAction} application`),
      }
    );
  };

  const decideProgramMutation = useMutation(decideOnProgramTrainingApplicationMutation());
  const handleSubmitProgramReview = (reviewNotes: string) => {
    if (!selectedApplication?.uuid || !isProgramApplication(selectedApplication) || !selectedApplication.program_uuid) {
      toast.error('Missing application details');
      return;
    }
    decideProgramMutation.mutate(
      {
        path: { programUuid: selectedApplication.program_uuid, applicationUuid: selectedApplication.uuid },
        query: { action: reviewAction },
        body: { review_notes: reviewNotes },
      },
      {
        onSuccess: () => {
          toast.success(`Application ${reviewAction}d successfully`);
          qc.invalidateQueries({ queryKey: searchProgramTrainingApplicationsQueryKey({ query: { searchParams: {}, pageable: { page, size: pageSize } } }) });
          setReviewDialogOpen(false);
          setSelectedApplication(null);
        },
        onError: (error: unknown) => toast.error(getErrorMessage(error) || `Failed to ${reviewAction} application`, { duration: 8000 }),
      }
    );
  };

  // ── Shared profile props ───────────────────────────────────────────────────

  const profileProps = {
    selectedApplicantType,
    instructor,
    organisation,
    skills,
    education,
    documents,
    reviews,
    instructorUserData,
    selectedApplicantName,
    selectedApplicantHeadline,
    selectedApplicantLocation,
    selectedApplicantInitials,
    selectedApplicantId,
    selectedApplicantStatusBadge,
  };

  const courseAppProps = {
    type: 'course' as const,
    stats: { total: stats.total, pending: stats.pending, approved: stats.approved },
    closedCount: stats.revoked + stats.rejected,
    isLoading: applicationsQuery.isLoading,
    applications: filteredApplications,
    statusFilter, setStatusFilter,
    applicantTypeFilter, setApplicantTypeFilter,
    searchValue, setSearchValue,
    page, setPage,
    totalPages,
    reviewDialogOpen, setReviewDialogOpen,
    selectedApplication,
    reviewAction,
    handleReview,
    onSubmit: handleSubmitReview,
    isMutationPending: decideMutation.isPending,
  };

  const programAppProps = {
    type: 'program' as const,
    stats: { total: programStats.total, pending: programStats.pending, approved: programStats.approved },
    closedCount: programStats.revoked + programStats.rejected,
    isLoading: programApplicationsQuery.isLoading,
    applications: filteredProgramApplications,
    statusFilter, setStatusFilter,
    applicantTypeFilter, setApplicantTypeFilter,
    searchValue, setSearchValue,
    page, setPage,
    totalPages: programTotalPages,
    reviewDialogOpen, setReviewDialogOpen,
    selectedApplication,
    reviewAction,
    handleReview,
    onSubmit: handleSubmitProgramReview,
    isMutationPending: decideProgramMutation.isPending,
  };

  // ── Sidebar applicant card ─────────────────────────────────────────────────
  type NormalizedApplicant = {
    uuid: string;
    type: 'instructor' | 'organisation';
    fullName: string;
    subtitle: string;
    avatarUrl?: string;
    verified: boolean;
    createdDate?: string;
  };

  function normalizeApplicant(applicant: ApplicantRecord): NormalizedApplicant {
    if (applicant.type === 'instructor') {
      const data = applicant.data?.data as InstructorProfile | undefined;

      return {
        uuid: applicant.uuid,
        type: 'instructor',
        fullName: data?.full_name ?? 'Unknown instructor',
        subtitle: data?.professional_headline ?? 'Instructor',
        avatarUrl: data?.profile_picture_url,
        verified: !!data?.admin_verified,
        createdDate: data?.created_date,
      };
    }

    // organisation
    const data = applicant.data as Organisation | undefined;

    return {
      uuid: applicant.uuid,
      type: 'organisation',
      fullName: data?.name ?? 'Unknown organisation',
      subtitle: data?.description ?? 'Organisation',
      verified: !!data?.admin_verified,
      createdDate: data?.created_date,
    };
  }

  const renderApplicantCard = (applicantItem: ApplicantRecord) => {
    const applicant = normalizeApplicant(applicantItem);

    const initials =
      applicant.fullName
        .split(' ')
        .map(p => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'AP';

    const isSelected = selectedApplicantUuid === applicant.uuid;

    return (
      <button
        key={applicant.uuid}
        onClick={() => {
          setSelectedApplicantUuid(applicant.uuid);
          if (window.innerWidth < 1024) setIsMobileDetailsOpen(true);
        }}
        className={`relative w-full rounded-2xl border p-4 text-left transition-colors ${isSelected
          ? 'border-primary bg-primary/5 ring-primary/30 shadow-sm ring-1'
          : 'border-border/60 bg-card hover:bg-muted/40'
          }`}
      >
        <div className='flex items-start gap-3'>
          <Avatar className='h-11 w-11 shrink-0'>
            <AvatarImage src={applicant.avatarUrl} />
            <AvatarFallback
              className={
                applicant.type === 'instructor'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-accent/10 text-accent-foreground'
              }
            >
              {applicant.type === 'instructor'
                ? initials
                : <Building2 className='h-5 w-5' />}
            </AvatarFallback>
          </Avatar>

          <div className='min-w-0 flex-1'>
            <p className='text-foreground truncate text-sm font-semibold'>
              {applicant.fullName}
            </p>

            <p className='text-muted-foreground mt-0.5 truncate text-xs'>
              {applicant.subtitle}
            </p>

            <div className='mt-2.5 flex items-center justify-between gap-2'>
              <ApplicantTypePill type={applicant.type} />

              <div className='flex items-center gap-1.5'>
                <Badge
                  variant={applicant.verified ? 'success' : 'secondary'}
                  className='text-[10px]'
                >
                  {applicant.verified ? 'Verified' : 'Pending'}
                </Badge>

                {applicant.createdDate && (
                  <span className='text-muted-foreground text-[10px]'>
                    {format(new Date(applicant.createdDate), 'dd/MM/yy')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className={elimikaDesignSystem.components.pageContainer}>
      <section className='mb-5'>
        <h1 className='text-foreground text-xl font-bold md:text-2xl'>Applicants</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Review and manage applications from instructors and organisations
        </p>
      </section>

      <Card className='overflow-hidden p-0'>
        <div className='flex flex-col min-[1450px]:h-[calc(100vh-190px)] min-[1450px]:flex-row'>

          {/* ── Left sidebar ──────────────────────────────────────────────── */}
          <div className='bg-background flex w-full flex-col border-b min-[1450px]:w-[22rem] min-[1450px]:border-r min-[1450px]:border-b-0'>
            <div className='space-y-3 border-b p-4'>
              {/* Mobile: menu + search row */}
              <div className='flex items-center gap-2 lg:hidden'>
                <Button variant='outline' size='icon' className='shrink-0' onClick={() => setIsMobileFiltersOpen(true)}>
                  <Menu size={18} />
                </Button>
                <div className='relative flex-1'>
                  <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                  <Input
                    placeholder='Search applicants'
                    value={instructorSearchQuery}
                    onChange={e => setInstructorSearchQuery(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>

              {/* Desktop: search */}
              <div className='relative hidden lg:block'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  placeholder='Search applicants'
                  value={instructorSearchQuery}
                  onChange={e => setInstructorSearchQuery(e.target.value)}
                  className='pl-10'
                />
              </div>

              {/* Type toggle: All / Instructors / Organisations */}
              <div className='flex gap-1 rounded-xl bg-muted/50 p-1'>
                {(['all', 'instructor', 'organisation'] as ApplicantListTypeFilter[]).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setApplicantListTypeFilter(filter)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${applicantListTypeFilter === filter
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {filter === 'all' && <Users className='h-3.5 w-3.5' />}
                    {filter === 'instructor' && <GraduationCap className='h-3.5 w-3.5' />}
                    {filter === 'organisation' && <Building2 className='h-3.5 w-3.5' />}
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    {filter !== 'all' && (
                      <span className='text-muted-foreground text-[10px]'>
                        ({applicants.filter(a => a.type === filter).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Desktop: filters row */}
              <div className='hidden gap-2 lg:flex'>
                <Select value={verificationFilter} onValueChange={v => setVerificationFilter(v as typeof verificationFilter)}>
                  <SelectTrigger className='h-9 flex-1 text-sm'>
                    <Filter className='mr-1.5 h-3.5 w-3.5' />
                    <SelectValue placeholder='All statuses' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All statuses</SelectItem>
                    <SelectItem value='approved'>Verified</SelectItem>
                    <SelectItem value='pending'>Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-9 shrink-0'
                  onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <SortAsc className='h-4 w-4' /> : <SortDesc className='h-4 w-4' />}
                  <span className='ml-1'>Date</span>
                </Button>
              </div>

              {/* Counts */}
              <p className='text-muted-foreground text-xs'>
                {filteredApplicants.length} of {applicants.length} applicants
              </p>
            </div>

            <div className='flex-1 space-y-2 overflow-y-auto p-3'>
              {isLoadingApplicants ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className='h-20 rounded-2xl' />)
              ) : filteredApplicants.length === 0 ? (
                <div className='text-muted-foreground py-10 text-center text-sm'>No applicants found</div>
              ) : (
                filteredApplicants.map(renderApplicantCard)
              )}
            </div>
          </div>

          {/* ── Desktop detail panel ──────────────────────────────────────── */}
          <div className='hidden flex-1 flex-col lg:flex'>
            {!selectedApplicantUuid ? (
              <div className='flex flex-1 items-center justify-center p-8'>
                <div className='text-muted-foreground text-center'>
                  <User className='mx-auto mb-4 h-12 w-12' />
                  <p>Select an applicant to view details</p>
                </div>
              </div>
            ) : (
              <div className='flex h-full flex-col'>
                <div className='border-b px-6 py-5'>
                  <h2 className='text-foreground text-2xl font-semibold'>Applicant details</h2>
                </div>
                <div className='flex-1 overflow-y-auto p-6'>
                  <Tabs value={tabs} onValueChange={v => setTabs(v as InstructorTab)} className='gap-6'>
                    <TabsList className='h-auto w-full justify-start gap-1 rounded-2xl bg-muted/60 p-1'>
                      {tabOptions.map(o => (
                        <TabsTrigger key={o.value} value={o.value} className='rounded-xl px-4 py-2.5'>
                          {o.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {tabs === 'profile' && <ProfileTabContent {...profileProps} />}
                    {tabs === 'course-application' && <ApplicationsTabContent {...courseAppProps} />}
                    {tabs === 'program-application' && <ApplicationsTabContent {...programAppProps} />}
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile: filters sheet ────────────────────────────────────────── */}
        <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
          <SheetContent side='left' className='w-80'>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className='mt-6 space-y-5 px-4'>
              <div className='space-y-1'>
                {(['all', 'approved', 'pending'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => { setVerificationFilter(v); setIsMobileFiltersOpen(false); }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm ${verificationFilter === v ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                      }`}
                  >
                    {v === 'all' && <Filter size={15} />}
                    {v === 'approved' && <CheckCircle2 className='text-success' size={15} />}
                    {v === 'pending' && <Clock className='text-warning' size={15} />}
                    {v === 'all' ? 'All statuses' : v === 'approved' ? 'Verified' : 'Pending'}
                  </button>
                ))}
              </div>
              <Separator />
              <Button
                variant='outline'
                size='sm'
                onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                className='w-full justify-start'
              >
                {sortOrder === 'asc' ? <SortAsc className='mr-2 h-4 w-4' /> : <SortDesc className='mr-2 h-4 w-4' />}
                Sort by date ({sortOrder})
              </Button>
              <Separator />
              <div className='space-y-2 text-sm'>
                <p className='text-muted-foreground text-xs font-semibold uppercase tracking-wide'>Summary</p>
                <div className='flex justify-between'><span className='text-muted-foreground'>Total</span><span className='text-foreground font-semibold'>{applicants.length}</span></div>
                <div className='flex justify-between'><span className='text-muted-foreground'>Instructors</span><span className='text-foreground font-semibold'>{applicants.filter(a => a.type === 'instructor').length}</span></div>
                <div className='flex justify-between'><span className='text-muted-foreground'>Organisations</span><span className='text-foreground font-semibold'>{applicants.filter(a => a.type === 'organisation').length}</span></div>
                <div className='flex justify-between'><span className='text-muted-foreground'>Showing</span><span className='text-foreground font-semibold'>{filteredApplicants.length}</span></div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* ── Mobile: details sheet ─────────────────────────────────────────── */}
        <Sheet open={isMobileDetailsOpen} onOpenChange={setIsMobileDetailsOpen}>
          <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-2xl'>
            <SheetHeader>
              <SheetTitle>Applicant details</SheetTitle>
            </SheetHeader>
            <div className='mt-4 space-y-4 px-4 pb-8'>
              {selectedApplicantUuid && (
                <>
                  {/* Mobile tab picker */}
                  <Button
                    variant='outline'
                    className='w-full justify-between rounded-xl'
                    onClick={() => setIsMobileTabsOpen(true)}
                  >
                    <span>{activeTabLabel}</span>
                    <Menu size={16} />
                  </Button>

                  <Sheet open={isMobileTabsOpen} onOpenChange={setIsMobileTabsOpen}>
                    <SheetContent side='bottom' className='max-h-[60vh] rounded-t-3xl px-0'>
                      <SheetHeader className='px-4 pb-2'>
                        <SheetTitle>Choose a section</SheetTitle>
                      </SheetHeader>
                      <div className='space-y-2 px-4 pb-6'>
                        {tabOptions.map(o => (
                          <button
                            key={o.value}
                            onClick={() => { setTabs(o.value); setIsMobileTabsOpen(false); }}
                            className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium ${tabs === o.value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-foreground hover:bg-muted'
                              }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </SheetContent>
                  </Sheet>

                  {tabs === 'profile' && <ProfileTabContent {...profileProps} />}
                  {tabs === 'course-application' && <ApplicationsTabContent {...courseAppProps} />}
                  {tabs === 'program-application' && <ApplicationsTabContent {...programAppProps} />}
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </Card>
    </div>
  );
};

export default InstructorsApplicationPage;