'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { StatusBadge } from '@/components/data-display';
import { Skeleton } from '@/components/ui/skeleton';
import { extractEntity, extractList } from '@/lib/api-helpers';
import { formatDateOnly } from '@/lib/date';
import type {
  CourseCreatorDocumentDto,
  Instructor,
  InstructorDocument,
  User,
} from '@/services/client';
import {
  getCourseByUuidOptions,
  getCourseCreatorDocumentsOptions,
  getInstructorByUuidOptions,
  getInstructorDocumentsOptions,
  getUserByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { listQuery } from '../lib/admin-queries';
import { adminRoutes } from '../lib/admin-routes';
import type { InboxItem } from '../hooks/use-review-queue';
import { SectionBoundary } from './section-boundary';

interface RecordOnFile {
  id: string;
  title: string;
  status?: string | null;
  verified: boolean;
  uploadedOn?: string;
}

/**
 * The snapshot the inbox shows before you open a record: who it is, everything they
 * have on file, and one way in. No decision is taken here.
 */
export function InboxRecordPreview({ item }: { item: InboxItem }) {
  if (item.type === 'documents' || item.type === 'instructors') {
    return <PersonPreview item={item} />;
  }
  if (item.type === 'creators') {
    return <CreatorPreview item={item} />;
  }
  if (item.type === 'organisations') {
    return <OrganisationPreview item={item} />;
  }
  return <ContentPreview item={item} />;
}

function PersonPreview({ item }: { item: InboxItem }) {
  const instructorUuid = item.instructorUuid ?? '';

  // A document only carries the instructor profile id, so the person is one hop away.
  const instructorQuery = useQuery({
    ...getInstructorByUuidOptions({ path: { uuid: instructorUuid } }),
    ...listQuery,
    enabled: Boolean(instructorUuid),
  });

  const instructor = useMemo(
    () => extractEntity<Instructor>(instructorQuery.data),
    [instructorQuery.data]
  );
  const userUuid = instructor?.user_uuid ?? '';

  const userQuery = useQuery({
    ...getUserByUuidOptions({ path: { uuid: userUuid } }),
    ...listQuery,
    enabled: Boolean(userUuid),
  });

  const documentsQuery = useQuery({
    ...getInstructorDocumentsOptions({ path: { instructorUuid } }),
    ...listQuery,
    enabled: Boolean(instructorUuid),
  });

  const user = useMemo(() => extractEntity<User>(userQuery.data), [userQuery.data]);
  const records = useMemo<RecordOnFile[]>(
    () =>
      extractList<InstructorDocument>(documentsQuery.data).map(document => ({
        id: document.uuid ?? document.title,
        title: document.title || document.original_filename,
        status: document.status,
        verified: document.is_verified === true,
        uploadedOn: formatDateOnly(document.upload_date, ''),
      })),
    [documentsQuery.data]
  );

  const name = user?.full_name || instructor?.full_name || item.subject;

  return (
    <SectionBoundary
      label='this record'
      loading={instructorQuery.isLoading || documentsQuery.isLoading}
      error={instructorQuery.error ?? documentsQuery.error}
      onRetry={() => {
        void instructorQuery.refetch();
        void documentsQuery.refetch();
      }}
      skeleton={<PreviewSkeleton />}
    >
      <PreviewBody
        name={name}
        subtitle={user?.email ?? instructor?.professional_headline ?? ''}
        records={records}
        highlightId={item.documentUuid}
        href={
          userUuid
            ? adminRoutes.person(userUuid, 'verification', { queue: item.type, item: item.id })
            : null
        }
        hrefLabel={`Review in ${name}’s record`}
      />
    </SectionBoundary>
  );
}

function CreatorPreview({ item }: { item: InboxItem }) {
  const courseCreatorUuid = item.courseCreatorUuid ?? '';

  const documentsQuery = useQuery({
    ...getCourseCreatorDocumentsOptions({ path: { courseCreatorUuid } }),
    ...listQuery,
    enabled: Boolean(courseCreatorUuid),
  });

  const records = useMemo<RecordOnFile[]>(
    () =>
      extractList<CourseCreatorDocumentDto>(documentsQuery.data).map(document => ({
        id: document.uuid ?? document.title ?? '',
        title: document.title || 'Document',
        status: document.status,
        verified: document.is_verified === true,
        uploadedOn: formatDateOnly(document.upload_date, ''),
      })),
    [documentsQuery.data]
  );

  return (
    <SectionBoundary
      label='this record'
      loading={documentsQuery.isLoading}
      error={documentsQuery.error}
      onRetry={() => {
        void documentsQuery.refetch();
      }}
      skeleton={<PreviewSkeleton />}
    >
      <PreviewBody
        name={item.subject}
        subtitle={item.who}
        records={records}
        href={null}
        hrefLabel='Course creator records open with the People section'
      />
    </SectionBoundary>
  );
}

function OrganisationPreview({ item }: { item: InboxItem }) {
  const uuid = item.organisationUuid ?? '';

  return (
    <div className='space-y-4'>
      <PreviewHeading name={item.subject} subtitle={item.who} />
      <p className='text-muted-foreground text-sm'>
        Licence, location, branches and members are all on the organisation’s record, next to the
        decision.
      </p>
      <PreviewLink
        href={uuid ? adminRoutes.organisation(uuid, 'verification') : null}
        label={`Review in ${item.subject}’s record`}
      />
    </div>
  );
}

function ContentPreview({ item }: { item: InboxItem }) {
  const courseUuid = item.courseUuid ?? '';

  const courseQuery = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseUuid } }),
    ...listQuery,
    enabled: Boolean(courseUuid) && item.type === 'edits',
  });

  const courseName = useMemo(
    () => extractEntity<{ name?: string }>(courseQuery.data)?.name,
    [courseQuery.data]
  );

  const href = item.programUuid
    ? adminRoutes.program(item.programUuid)
    : courseUuid
      ? adminRoutes.course(courseUuid)
      : null;

  return (
    <div className='space-y-4'>
      <PreviewHeading name={courseName ?? item.subject} subtitle={item.who} />
      <p className='text-muted-foreground text-sm'>
        {item.type === 'edits'
          ? 'The proposed changes are compared field by field on the course record.'
          : 'Curriculum, pricing and moderation history are on the record.'}
      </p>
      <PreviewLink href={href} label='Open the record' />
    </div>
  );
}

function PreviewBody({
  name,
  subtitle,
  records,
  highlightId,
  href,
  hrefLabel,
}: {
  name: string;
  subtitle?: string;
  records: RecordOnFile[];
  highlightId?: string;
  href: string | null;
  hrefLabel: string;
}) {
  const verified = records.filter(record => record.verified).length;

  return (
    <div className='space-y-4'>
      <PreviewHeading name={name} subtitle={subtitle} />

      <div className='space-y-2'>
        <p className='text-muted-foreground flex items-center justify-between text-xs font-semibold tracking-wide uppercase'>
          <span>Records on file</span>
          {records.length ? (
            <span className='font-mono text-[11px] normal-case'>
              {verified} of {records.length} verified
            </span>
          ) : null}
        </p>

        {records.length ? (
          <ul className='divide-border/60 border-border/70 divide-y rounded-md border'>
            {records.map(record => (
              <li
                key={record.id}
                className={`flex items-center gap-3 px-3 py-2 ${
                  record.id === highlightId ? 'bg-primary/5' : ''
                }`}
              >
                <span className='min-w-0 flex-1'>
                  <span className='text-foreground block truncate text-sm font-medium'>
                    {record.title}
                  </span>
                  {record.uploadedOn ? (
                    <span className='text-muted-foreground text-xs'>
                      Uploaded {record.uploadedOn}
                    </span>
                  ) : null}
                </span>
                <StatusBadge status={record.status ?? (record.verified ? 'verified' : 'pending')} />
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-muted-foreground text-sm'>Nothing else on file yet.</p>
        )}
      </div>

      <PreviewLink href={href} label={hrefLabel} />
    </div>
  );
}

function PreviewHeading({ name, subtitle }: { name: string; subtitle?: string }) {
  return (
    <div className='space-y-1'>
      <h3 className='text-foreground text-lg font-semibold'>{name}</h3>
      {subtitle ? <p className='text-muted-foreground text-sm'>{subtitle}</p> : null}
    </div>
  );
}

function PreviewLink({ href, label }: { href: string | null; label: string }) {
  if (!href) {
    return (
      <p className='border-border/70 text-muted-foreground rounded-md border border-dashed px-3 py-2 text-sm'>
        {label}
      </p>
    );
  }

  return (
    <div className='space-y-2'>
      <Link
        href={href}
        className='bg-primary text-primary-foreground hover:bg-primary/90 flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold'
      >
        {label}
        <ArrowRight className='size-4' />
      </Link>
      <p className='text-muted-foreground text-xs'>
        Decisions are taken with the whole record open, never from this list.
      </p>
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div className='space-y-3'>
      <Skeleton className='h-5 w-40' />
      <Skeleton className='h-3 w-56' />
      <Skeleton className='h-24 w-full' />
      <Skeleton className='h-10 w-full' />
    </div>
  );
}
