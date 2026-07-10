'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Award,
  BriefcaseBusiness,
  CalendarClock,
  FileClock,
  History,
  Landmark,
  ListChecks,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { AsyncSection, SectionError } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import {
  type CredentialDocument,
  type CredentialRecord,
  type DomainVerification,
  fetchUserVerification,
} from '@/services/admin/credential-review';
import {
  getInstructorBookingsOptions,
  getUserActivityOptions,
  getWalletOptions,
  listInstructorApplicationsOptions,
  listTransactionsOptions,
  searchProgramTrainingApplicationsOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { adminTheme } from '../../_components/ui/admin-theme';
import {
  CredentialDocumentCard,
  CredentialReviewDialog,
} from '../../_components/ui/credential-review';
import { DetailGrid } from '../../_components/ui/DetailPanel';
import { SectionCard, SectionCardSkeleton } from '../../_components/ui/SectionCard';
import { StatusBadge } from '../../_components/ui/StatusBadge';
import { ContentApprovalsTab } from './ContentApprovalsTab';
import { DomainVerificationSection } from './DomainVerificationSection';
import { ReviewsRatingsTab } from './ReviewsRatingsTab';

const PAGEABLE = { page: 0, size: 20 };

function formatDate(value?: Date | string | null): string {
  if (!value) return '-';
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime())
    ? '-'
    : parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(value?: Date | string | null): string {
  if (!value) return '-';
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime())
    ? '-'
    : parsed.toLocaleString(undefined, {
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        year: 'numeric',
      });
}

function humanize(value?: string | null): string {
  if (!value) return '-';
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function money(amount?: number, currency = 'KES'): string {
  if (amount == null || !Number.isFinite(amount)) return '-';
  return new Intl.NumberFormat(undefined, {
    currency,
    maximumFractionDigits: 2,
    style: 'currency',
  }).format(amount);
}

export function CredentialsAsyncTab({
  active,
  userUuid,
  verifierIdentity,
}: {
  active: boolean;
  userUuid: string;
  verifierIdentity: string;
}) {
  const verificationQuery = useQuery({
    enabled: active,
    queryFn: () => fetchUserVerification(userUuid),
    queryKey: ['user-verification', userUuid],
    staleTime: STALE_TIMES.entity,
  });

  const domains = verificationQuery.data ?? [];

  return (
    <AsyncSection
      loading={verificationQuery.isLoading && !verificationQuery.data}
      error={verificationQuery.isError ? verificationQuery.error : undefined}
      empty={!domains.length}
      onRetry={verificationQuery.refetch}
      errorTitle='Unable to load credential records.'
      skeleton={<SectionCardSkeleton rows={6} />}
      emptyState={
        <SectionCard
          title='Credentials'
          description='Verification records and supporting documents.'
        >
          <EmptyState
            icon={ShieldCheck}
            title='No verifiable credentials'
            description='This user has no instructor or course creator profile credentials yet.'
            variant='compact'
          />
        </SectionCard>
      }
    >
      <div className='flex flex-col gap-4'>
        {domains.map(domain => (
          <DomainVerificationSection
            key={domain.role}
            domain={domain}
            verifierIdentity={verifierIdentity}
            onChanged={() => verificationQuery.refetch()}
          />
        ))}
      </div>
    </AsyncSection>
  );
}

function RecordCollection({
  title,
  records,
  emptyTitle,
  onReviewDocument,
}: {
  title: string;
  records: CredentialRecord[];
  emptyTitle: string;
  onReviewDocument: (document: CredentialDocument) => void;
}) {
  return (
    <SectionCard
      title={title}
      description={`${records.length} record${records.length === 1 ? '' : 's'}`}
    >
      {records.length ? (
        <div className='space-y-3'>
          {records.map(record => (
            <div key={record.id} className='border-border/60 bg-muted/20 rounded-md border p-3'>
              <div className='mb-3'>
                <p className='text-foreground text-sm font-medium'>{record.title}</p>
                {record.subtitle ? (
                  <p className='text-muted-foreground text-xs'>{record.subtitle}</p>
                ) : null}
              </div>
              <DetailGrid items={record.details} columns={3} />
              {record.documents?.length ? (
                <div className='border-border/60 mt-3 space-y-2 border-t pt-3'>
                  <p className={adminTheme.sectionLabel}>Supporting certificates</p>
                  <div className='grid gap-3 md:grid-cols-2'>
                    {record.documents.map(document => (
                      <CredentialDocumentCard
                        key={document.id}
                        document={document}
                        onReview={() => onReviewDocument(document)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileClock}
          title={emptyTitle}
          description='Nothing has been submitted in this section yet.'
          variant='compact'
        />
      )}
    </SectionCard>
  );
}

function ProfessionalDomainProfile({
  domain,
  onReviewDocument,
}: {
  domain: DomainVerification;
  onReviewDocument: (document: CredentialDocument) => void;
}) {
  const verifiedDocuments = [
    ...domain.documents,
    ...domain.education.flatMap(record => record.documents ?? []),
  ].filter(document => document.isVerified).length;
  const totalDocuments =
    domain.documents.length +
    domain.education.reduce((sum, record) => sum + (record.documents?.length ?? 0), 0);

  return (
    <div className='space-y-4'>
      <SectionCard
        title={`${domain.roleLabel} profile`}
        description={domain.headline || domain.fullName}
        actions={
          <StatusBadge
            status={domain.adminVerified ? 'verified' : 'pending'}
            label={domain.adminVerified ? 'Verified' : 'Pending verification'}
          />
        }
      >
        <div className='space-y-4'>
          <DetailGrid
            columns={3}
            items={[
              {
                label: 'Profile UUID',
                value: <span className='font-mono text-xs break-all'>{domain.profileUuid}</span>,
              },
              { label: 'Location', value: domain.location || '-' },
              { label: 'Documents', value: `${verifiedDocuments}/${totalDocuments} verified` },
              {
                label: 'Content',
                value: `${domain.contentItems.length} item${domain.contentItems.length === 1 ? '' : 's'}`,
              },
            ]}
          />

          <div className='space-y-2'>
            <p className={adminTheme.sectionLabel}>Skills</p>
            {domain.skills.length ? (
              <div className='flex flex-wrap gap-1.5'>
                {domain.skills.map(skill => (
                  <Badge key={skill} variant='secondary' className='font-normal capitalize'>
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>No skills submitted.</p>
            )}
          </div>
        </div>
      </SectionCard>

      <div className='grid gap-4 xl:grid-cols-2'>
        <RecordCollection
          title='Education and certificates'
          records={domain.education}
          emptyTitle='No education records'
          onReviewDocument={onReviewDocument}
        />
        <RecordCollection
          title='Training experience'
          records={domain.experience}
          emptyTitle='No experience records'
          onReviewDocument={onReviewDocument}
        />
        <RecordCollection
          title='Professional memberships'
          records={domain.memberships}
          emptyTitle='No memberships'
          onReviewDocument={onReviewDocument}
        />
        <RecordCollection
          title='Certifications'
          records={domain.certifications}
          emptyTitle='No certifications'
          onReviewDocument={onReviewDocument}
        />
      </div>

      <SectionCard
        title='General documents'
        description='Documents not attached to a specific education record.'
      >
        {domain.documents.length ? (
          <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
            {domain.documents.map(document => (
              <CredentialDocumentCard
                key={document.id}
                document={document}
                onReview={() => onReviewDocument(document)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title='No general documents'
            description='Education certificates appear inside their matching education records.'
            variant='compact'
          />
        )}
      </SectionCard>
    </div>
  );
}

export function ProfessionalProfileAsyncTab({
  active,
  userUuid,
  verifierIdentity,
}: {
  active: boolean;
  userUuid: string;
  verifierIdentity: string;
}) {
  const [activeDocument, setActiveDocument] = useState<CredentialDocument | null>(null);
  const verificationQuery = useQuery({
    enabled: active,
    queryFn: () => fetchUserVerification(userUuid),
    queryKey: ['user-verification', userUuid],
    staleTime: STALE_TIMES.entity,
  });

  const domains = verificationQuery.data ?? [];

  return (
    <AsyncSection
      loading={verificationQuery.isLoading && !verificationQuery.data}
      error={verificationQuery.isError ? verificationQuery.error : undefined}
      empty={!domains.length}
      onRetry={verificationQuery.refetch}
      errorTitle='Unable to load professional profile.'
      skeleton={<SectionCardSkeleton rows={6} />}
      emptyState={
        <SectionCard
          title='Professional profile'
          description='Instructor and course creator profile details.'
        >
          <EmptyState
            icon={Award}
            title='No professional profile'
            description='Education, certificates, training experience, and skills appear when the user has an instructor or course creator profile.'
            variant='compact'
          />
        </SectionCard>
      }
    >
      <div className='space-y-5'>
        {domains.map(domain => (
          <ProfessionalDomainProfile
            key={domain.role}
            domain={domain}
            onReviewDocument={setActiveDocument}
          />
        ))}

        <CredentialReviewDialog
          document={activeDocument}
          verifierIdentity={verifierIdentity}
          onClose={() => setActiveDocument(null)}
          onVerified={() => verificationQuery.refetch()}
        />
      </div>
    </AsyncSection>
  );
}

export function ContentAsyncTab({ active, userUuid }: { active: boolean; userUuid: string }) {
  const verificationQuery = useQuery({
    enabled: active,
    queryFn: () => fetchUserVerification(userUuid),
    queryKey: ['user-verification', userUuid],
    staleTime: STALE_TIMES.entity,
  });

  const domains = verificationQuery.data ?? [];
  const contentItems = domains.flatMap(domain => domain.contentItems);
  const pendingCount = domains.reduce((sum, domain) => sum + domain.pendingCount, 0);

  return (
    <ContentApprovalsTab
      items={contentItems}
      pendingCount={pendingCount}
      isLoading={verificationQuery.isLoading}
      onModerated={() => verificationQuery.refetch()}
    />
  );
}

export function ReviewsAsyncTab({
  active,
  userUuid,
  instructorUuid,
}: {
  active: boolean;
  userUuid: string;
  instructorUuid?: string;
}) {
  const verificationQuery = useQuery({
    enabled: active,
    queryFn: () => fetchUserVerification(userUuid),
    queryKey: ['user-verification', userUuid],
    staleTime: STALE_TIMES.entity,
  });

  if (verificationQuery.isLoading && !verificationQuery.data)
    return <SectionCardSkeleton rows={5} />;
  if (verificationQuery.isError)
    return (
      <SectionError
        title='Unable to load review context.'
        error={verificationQuery.error}
        onRetry={verificationQuery.refetch}
      />
    );

  const domains = verificationQuery.data ?? [];
  const instructorDomain = domains.find(domain => domain.role === 'instructor');
  const courses = domains
    .flatMap(domain => domain.contentItems)
    .filter(item => item.type === 'course');

  return (
    <ReviewsRatingsTab
      instructorDomain={instructorDomain}
      courses={courses}
      instructorUuid={instructorUuid}
      active={active}
    />
  );
}

function ApplicationRow({
  title,
  subtitle,
  status,
  createdBy,
  updatedBy,
  createdAt,
  reviewedBy,
  reviewedAt,
}: {
  title: string;
  subtitle?: string;
  status?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: Date | string | null;
  reviewedBy?: string | null;
  reviewedAt?: Date | string | null;
}) {
  return (
    <div className='border-border/60 bg-muted/20 rounded-md border p-3'>
      <div className='mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0'>
          <p className='text-foreground truncate text-sm font-medium'>{title}</p>
          {subtitle ? <p className='text-muted-foreground truncate text-xs'>{subtitle}</p> : null}
        </div>
        <StatusBadge status={status} />
      </div>
      <DetailGrid
        columns={3}
        items={[
          { label: 'Submitted', value: formatDate(createdAt) },
          { label: 'Created by', value: createdBy || '-' },
          { label: 'Updated by', value: updatedBy || '-' },
          { label: 'Reviewed by', value: reviewedBy || '-' },
          { label: 'Reviewed at', value: formatDate(reviewedAt) },
          { label: 'State', value: humanize(status) },
        ]}
      />
    </div>
  );
}

function TrainingApplications({
  active,
  instructorUuid,
}: {
  active: boolean;
  instructorUuid: string;
}) {
  const courseApplicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        pageable: PAGEABLE,
        searchParams: { applicant_uuid_eq: instructorUuid },
      },
    }),
    enabled: active,
    staleTime: STALE_TIMES.entity,
  });

  const programApplicationsQuery = useQuery({
    ...searchProgramTrainingApplicationsOptions({
      query: {
        pageable: PAGEABLE,
        searchParams: { applicant_uuid_eq: instructorUuid },
      },
    }),
    enabled: active,
    staleTime: STALE_TIMES.entity,
  });

  const marketplaceApplicationsQuery = useQuery({
    ...listInstructorApplicationsOptions({
      path: { instructorUuid },
      query: { pageable: PAGEABLE },
    }),
    enabled: active,
    staleTime: STALE_TIMES.entity,
  });

  const courseApplications = courseApplicationsQuery.data?.data?.content ?? [];
  const programApplications = programApplicationsQuery.data?.data?.content ?? [];
  const marketplaceApplications = marketplaceApplicationsQuery.data?.data?.content ?? [];
  const isLoading =
    (courseApplicationsQuery.isLoading && !courseApplicationsQuery.data) ||
    (programApplicationsQuery.isLoading && !programApplicationsQuery.data) ||
    (marketplaceApplicationsQuery.isLoading && !marketplaceApplicationsQuery.data);
  const isError =
    courseApplicationsQuery.isError ||
    programApplicationsQuery.isError ||
    marketplaceApplicationsQuery.isError;
  const totalApplications =
    courseApplications.length + programApplications.length + marketplaceApplications.length;
  const refetchAll = () => {
    courseApplicationsQuery.refetch();
    programApplicationsQuery.refetch();
    marketplaceApplicationsQuery.refetch();
  };

  return (
    <SectionCard
      title='Training approvals'
      description='Course, program, and class marketplace applications tied to this instructor.'
    >
      <AsyncSection
        loading={isLoading}
        error={
          isError
            ? (courseApplicationsQuery.error ??
              programApplicationsQuery.error ??
              marketplaceApplicationsQuery.error)
            : undefined
        }
        empty={totalApplications === 0}
        onRetry={refetchAll}
        skeleton={
          <div className='space-y-3'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-24 w-full rounded-md' />
            ))}
          </div>
        }
        emptyState={
          <EmptyState
            icon={ListChecks}
            title='No training applications'
            description='No course, program, or marketplace class applications were found for this instructor.'
            variant='compact'
          />
        }
      >
        <div className='space-y-3'>
        {courseApplications.map(application => (
          <ApplicationRow
            key={application.uuid}
            title={`Course application ${application.course_uuid ?? ''}`}
            subtitle={humanize(application.applicant_type)}
            status={String(application.status ?? '')}
            createdBy={application.created_by}
            updatedBy={application.updated_by}
            createdAt={application.created_date}
            reviewedBy={application.reviewed_by}
            reviewedAt={application.reviewed_at}
          />
        ))}
        {programApplications.map(application => (
          <ApplicationRow
            key={application.uuid}
            title={`Program application ${application.program_uuid ?? ''}`}
            subtitle={humanize(application.applicant_type)}
            status={String(application.status ?? '')}
            createdBy={application.created_by}
            updatedBy={application.updated_by}
            createdAt={application.created_date}
            reviewedBy={application.reviewed_by}
            reviewedAt={application.reviewed_at}
          />
        ))}
        {marketplaceApplications.map(application => (
          <ApplicationRow
            key={application.uuid}
            title={`Marketplace job ${application.job_uuid ?? ''}`}
            subtitle={application.application_note}
            status={String(application.status ?? '')}
            createdBy={application.created_by}
            updatedBy={application.updated_by}
            createdAt={application.created_date}
            reviewedBy={application.reviewed_by}
            reviewedAt={application.reviewed_at}
          />
        ))}
        </div>
      </AsyncSection>
    </SectionCard>
  );
}

export function TrainingAsyncTab({
  active,
  instructorUuid,
}: {
  active: boolean;
  instructorUuid?: string;
}) {
  if (!instructorUuid) {
    return (
      <SectionCard
        title='Training network'
        description='Classes, bookings, and training approvals.'
      >
        <EmptyState
          icon={BriefcaseBusiness}
          title='No instructor profile'
          description='Training associations appear when this user has an instructor profile.'
          variant='compact'
        />
      </SectionCard>
    );
  }

  return (
    <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.75fr)]'>
      <TrainingApplications active={active} instructorUuid={instructorUuid} />
      <InstructorBookings active={active} instructorUuid={instructorUuid} />
    </div>
  );
}

function InstructorBookings({
  active,
  instructorUuid,
}: {
  active: boolean;
  instructorUuid: string;
}) {
  const bookingsQuery = useQuery({
    ...getInstructorBookingsOptions({
      path: { instructorUuid },
      query: { pageable: PAGEABLE },
    }),
    enabled: active,
    staleTime: STALE_TIMES.live,
  });

  const bookings = bookingsQuery.data?.data?.content ?? [];

  return (
    <SectionCard title='Bookings' description='Instructor bookings and payment state.'>
      <AsyncSection
        loading={bookingsQuery.isLoading && !bookingsQuery.data}
        error={bookingsQuery.isError ? bookingsQuery.error : undefined}
        empty={bookings.length === 0}
        onRetry={bookingsQuery.refetch}
        skeleton={
          <div className='space-y-3'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-24 w-full rounded-md' />
            ))}
          </div>
        }
        emptyState={
          <EmptyState
            icon={CalendarClock}
            title='No bookings'
            description='No instructor bookings were found for this user.'
            variant='compact'
          />
        }
      >
        <div className='space-y-3'>
          {bookings.map(booking => (
            <div key={booking.uuid} className='border-border/60 bg-muted/20 rounded-md border p-3'>
              <div className='mb-2 flex items-center justify-between gap-3'>
                <div className='flex min-w-0 items-center gap-2'>
                  <CalendarClock className='text-muted-foreground size-4 shrink-0' />
                  <p className='text-foreground truncate text-sm font-medium'>
                    {formatDateTime(booking.start_time)}
                  </p>
                </div>
                <StatusBadge status={String(booking.status ?? '')} />
              </div>
              <DetailGrid
                columns={2}
                items={[
                  { label: 'Course', value: booking.course_uuid },
                  { label: 'Student', value: booking.student_uuid },
                  { label: 'Amount', value: money(booking.price_amount, booking.currency) },
                  { label: 'Payment ref', value: booking.payment_reference || '-' },
                ]}
              />
            </div>
          ))}
        </div>
      </AsyncSection>
    </SectionCard>
  );
}

export function CommerceAsyncTab({ active, userUuid }: { active: boolean; userUuid: string }) {
  const walletQuery = useQuery({
    ...getWalletOptions({ path: { userUuid } }),
    enabled: active,
    staleTime: STALE_TIMES.live,
  });
  const transactionsQuery = useQuery({
    ...listTransactionsOptions({
      path: { userUuid },
      query: { pageable: PAGEABLE },
    }),
    enabled: active,
    staleTime: STALE_TIMES.live,
  });

  const wallet = walletQuery.data?.data;
  const transactions = transactionsQuery.data?.data?.content ?? [];

  return (
    <div className='grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]'>
      <SectionCard title='Wallet' description='User wallet balance and currency.'>
        <AsyncSection
          loading={walletQuery.isLoading && !walletQuery.data}
          error={walletQuery.isError ? walletQuery.error : undefined}
          empty={!wallet}
          onRetry={walletQuery.refetch}
          skeleton={<SectionCardSkeleton rows={3} withHeader={false} />}
          emptyState={
            <EmptyState
              icon={Landmark}
              title='No wallet'
              description='No wallet record was returned for this user.'
              variant='compact'
            />
          }
        >
          {wallet ? (
            <DetailGrid
              columns={1}
              items={[
                { label: 'Balance', value: money(wallet.balance_amount, wallet.currency_code) },
                { label: 'Currency', value: wallet.currency_code ?? '-' },
                { label: 'Updated', value: formatDateTime(wallet.updated_date) },
              ]}
            />
          ) : null}
        </AsyncSection>
      </SectionCard>

      <SectionCard title='Transactions' description='Recent wallet transactions.'>
        <AsyncSection
          loading={transactionsQuery.isLoading && !transactionsQuery.data}
          error={transactionsQuery.isError ? transactionsQuery.error : undefined}
          empty={transactions.length === 0}
          onRetry={transactionsQuery.refetch}
          skeleton={<SectionCardSkeleton rows={5} withHeader={false} />}
          emptyState={
            <EmptyState
              icon={ReceiptText}
              title='No transactions'
              description='No wallet transactions were returned for this user.'
              variant='compact'
            />
          }
        >
          <div className='space-y-3'>
            {transactions.map(transaction => (
              <div
                key={transaction.uuid}
                className='border-border/60 bg-muted/20 grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_auto]'
              >
                <div className='min-w-0'>
                  <p className='text-foreground truncate text-sm font-medium'>
                    {humanize(String(transaction.transaction_type ?? 'transaction'))}
                  </p>
                  <p className='text-muted-foreground truncate text-xs'>
                    {transaction.description || transaction.reference || 'No description'}
                  </p>
                </div>
                <div className='text-left sm:text-right'>
                  <p className='text-foreground text-sm font-semibold tabular-nums'>
                    {money(transaction.amount, transaction.currency_code)}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {formatDateTime(transaction.created_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </AsyncSection>
      </SectionCard>
    </div>
  );
}

export function AuditTrailAsyncTab({
  active,
  userUuid,
  targetUuids,
}: {
  active: boolean;
  userUuid: string;
  targetUuids: string[];
}) {
  const activityQuery = useQuery({
    ...getUserActivityOptions({
      path: { uuid: userUuid },
      query: {
        pageable: PAGEABLE,
        scope: 'all',
        target_uuids: targetUuids.join(',') || undefined,
      },
    }),
    enabled: active,
    staleTime: STALE_TIMES.live,
  });

  const events = activityQuery.data?.data?.content ?? [];

  return (
    <SectionCard
      title='Audit trail'
      description='Actions performed by this user and admin/system requests targeting this dossier.'
    >
      <AsyncSection
        loading={activityQuery.isLoading && !activityQuery.data}
        error={activityQuery.isError ? activityQuery.error : undefined}
        empty={events.length === 0}
        onRetry={activityQuery.refetch}
        errorTitle='Unable to load audit trail.'
        skeleton={
          <div className='space-y-3'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className='h-20 w-full rounded-md' />
            ))}
          </div>
        }
        emptyState={
          <EmptyState
            icon={History}
            title='No audit events'
            description='No matching actor or target request audit events were found for this user.'
            variant='compact'
          />
        }
      >
        <div className='space-y-3'>
          {events.map(event => (
            <div
              key={event.event_uuid}
              className={cn(
                'border-border/60 bg-muted/20 grid gap-3 rounded-md border p-3',
                'lg:grid-cols-[minmax(0,1fr)_220px]'
              )}
            >
              <div className='min-w-0'>
                <div className='mb-1 flex flex-wrap items-center gap-2'>
                  <StatusBadge status={event.scope} label={humanize(event.scope)} />
                  <StatusBadge status={event.category} label={humanize(event.category)} />
                  {event.response_status ? (
                    <StatusBadge status={String(event.response_status)} />
                  ) : null}
                </div>
                <p className='text-foreground truncate text-sm font-medium'>{event.summary}</p>
                <p className='text-muted-foreground truncate text-xs'>
                  {event.http_method} {event.endpoint}
                  {event.query ? `?${event.query}` : ''}
                </p>
              </div>
              <div className='text-left lg:text-right'>
                <p className='text-foreground text-sm font-medium'>
                  {formatDateTime(event.occurred_at)}
                </p>
                <p className='text-muted-foreground truncate text-xs'>
                  {event.actor_name || event.actor_email || event.actor_uuid || 'Unknown actor'}
                </p>
                <p className='text-muted-foreground truncate font-mono text-xs'>
                  {event.request_id || '-'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </AsyncSection>
    </SectionCard>
  );
}

export function PendingApprovalsAsyncTab({
  active,
  userUuid,
  instructorUuid,
}: {
  active: boolean;
  userUuid: string;
  instructorUuid?: string;
}) {
  const verificationQuery = useQuery({
    enabled: active,
    queryFn: () => fetchUserVerification(userUuid),
    queryKey: ['user-verification', userUuid],
    staleTime: STALE_TIMES.entity,
  });

  const domains = verificationQuery.data ?? [];
  const pendingDocuments = domains.flatMap(domain =>
    domain.documents
      .filter(document => !document.isVerified)
      .map(document => ({
        id: document.id,
        status: document.statusLabel,
        subtitle: `${domain.roleLabel} document`,
        title: document.title,
      }))
  );
  const pendingContent = domains.flatMap(domain =>
    domain.contentItems
      .filter(item => item.pending)
      .map(item => ({
        id: `${item.type}-${item.uuid}`,
        status: item.status,
        subtitle: humanize(item.type),
        title: item.title,
      }))
  );
  const pendingDomains = domains
    .filter(domain => !domain.adminVerified)
    .map(domain => ({
      id: domain.profileUuid,
      status: 'pending',
      subtitle: 'Domain verification',
      title: domain.roleLabel,
    }));
  const rows = [...pendingDomains, ...pendingDocuments, ...pendingContent];

  return (
    <SectionCard
      title='Pending approvals'
      description='Open verification, document, content, and domain approval items for this dossier.'
      actions={
        instructorUuid ? (
          <span className={adminTheme.sectionLabel}>Instructor profile linked</span>
        ) : null
      }
    >
      <AsyncSection
        loading={verificationQuery.isLoading && !verificationQuery.data}
        error={verificationQuery.isError ? verificationQuery.error : undefined}
        empty={rows.length === 0}
        onRetry={verificationQuery.refetch}
        skeleton={
          <div className='space-y-3'>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className='h-14 w-full rounded-md' />
            ))}
          </div>
        }
        emptyState={
          <EmptyState
            icon={FileClock}
            title='No pending approvals'
            description='All visible dossier approval queues are currently clear.'
            variant='compact'
          />
        }
      >
        <div className='space-y-3'>
          {rows.map(row => (
            <div
              key={row.id}
              className='border-border/60 bg-muted/20 flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between'
            >
              <div className='min-w-0'>
                <p className='text-foreground truncate text-sm font-medium'>{row.title}</p>
                <p className='text-muted-foreground truncate text-xs'>{row.subtitle}</p>
              </div>
              <StatusBadge status={row.status} />
            </div>
          ))}
        </div>
      </AsyncSection>
    </SectionCard>
  );
}
