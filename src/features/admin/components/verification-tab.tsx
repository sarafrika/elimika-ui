'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Inbox, Lock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  DetailGrid,
  DocumentPreview,
  SectionCard,
  SectionCardSkeleton,
  StatusBadge,
} from '@/components/data-display';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { DocumentTypeOption, Instructor, InstructorDocument, User } from '@/services/client';
import { adminRoutes, type InboxType } from '../lib/admin-routes';
import { useInstructorEducation } from '../hooks/use-person-record';
import { useVerifyDocument, useVerifyInstructor } from '../hooks/use-verification-actions';
import { NoteField, noteToPlainText } from './note-field';
import { ConfirmDialog } from './confirm-dialog';
import { SectionBoundary } from './section-boundary';

const noteSchema = z.object({
  note: z
    .string()
    .refine(value => noteToPlainText(value).length >= 10, 'Say what you checked — at least a sentence.'),
});

const reasonSchema = z.object({
  reason: z
    .string()
    .refine(value => noteToPlainText(value).length >= 10, 'Say why this profile is being verified.'),
});

interface VerificationTabProps {
  person: User | null;
  instructor: Instructor | null;
  documents: InstructorDocument[];
  documentTypesByUuid: Map<string, DocumentTypeOption>;
  requiredTypeUuids: string[];
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  selectedDocumentUuid: string;
  onSelectDocument: (uuid: string) => void;
  reviewQueue: string;
}

/** A document counts as done when the API says it is verified or approved. */
const isDocumentVerified = (document: InstructorDocument) =>
  document.is_verified === true || document.status === 'APPROVED';

export function VerificationTab({
  person,
  instructor,
  documents,
  documentTypesByUuid,
  requiredTypeUuids,
  loading,
  error,
  onRetry,
  selectedDocumentUuid,
  onSelectDocument,
  reviewQueue,
}: VerificationTabProps) {
  const personName = person?.full_name ?? `${person?.first_name ?? ''} ${person?.last_name ?? ''}`.trim();

  const selected = useMemo(
    () => documents.find(document => document.uuid === selectedDocumentUuid) ?? documents[0] ?? null,
    [documents, selectedDocumentUuid]
  );

  const requiredVerified = useMemo(
    () =>
      requiredTypeUuids.filter(typeUuid =>
        documents.some(
          document => document.document_type_uuid === typeUuid && isDocumentVerified(document)
        )
      ).length,
    [documents, requiredTypeUuids]
  );

  const allRequiredVerified =
    requiredTypeUuids.length > 0 && requiredVerified === requiredTypeUuids.length;
  const profileVerified = instructor?.admin_verified === true;

  return (
    <div className='flex flex-col gap-4'>
      {reviewQueue ? <ReviewModeBar queue={reviewQueue} /> : null}

      <ProfileDecision
        personName={personName || 'This person'}
        instructorUuid={instructor?.uuid}
        profileVerified={profileVerified}
        requiredVerified={requiredVerified}
        requiredTotal={requiredTypeUuids.length}
        unlocked={allRequiredVerified}
      />

      <div className='grid gap-4 xl:grid-cols-[minmax(260px,300px)_minmax(0,1fr)_minmax(300px,360px)]'>
        <SectionBoundary
          label='the records on file'
          loading={loading}
          error={error}
          onRetry={onRetry}
          empty={!loading && documents.length === 0}
          skeleton={<SectionCardSkeleton rows={5} />}
          emptyTitle='No records uploaded'
          emptyDescription='This person has not uploaded any documents yet.'
        >
          <RecordsOnFile
            documents={documents}
            documentTypesByUuid={documentTypesByUuid}
            selectedUuid={selected?.uuid ?? ''}
            onSelect={onSelectDocument}
          />
        </SectionBoundary>

        <SectionBoundary
          label='the document'
          loading={loading}
          error={error}
          onRetry={onRetry}
          empty={!loading && !selected}
          skeleton={<SectionCardSkeleton rows={6} />}
          emptyTitle='Nothing selected'
          emptyDescription='Pick a record on the left to read it.'
        >
          {selected ? (
            <DocumentViewer
              document={selected}
              typeName={
                documentTypesByUuid.get(selected.document_type_uuid ?? '')?.name ?? 'Document'
              }
            />
          ) : null}
        </SectionBoundary>

        <div className='flex flex-col gap-4'>
          <CrossChecks instructorUuid={instructor?.uuid} personName={personName} />
          {selected ? (
            <DecisionPanel
              document={selected}
              instructorUuid={instructor?.uuid}
              personName={personName || 'this person'}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ReviewModeBar({ queue }: { queue: string }) {
  const inboxHref = adminRoutes.inbox(queue as InboxType);

  return (
    <div className='bg-primary flex flex-wrap items-center gap-3 rounded-md px-4 py-3'>
      <Inbox className='text-primary-foreground size-4' />
      <span className='text-primary-foreground text-sm font-semibold'>Review mode</span>
      <span className='text-primary-foreground/80 text-sm'>{queue} queue</span>
      <div className='ml-auto flex items-center gap-2'>
        <Button
          asChild
          size='sm'
          variant='secondary'
          className='rounded-md'
        >
          <Link href={inboxHref}>
            <ArrowLeft className='mr-1.5 size-3.5' />
            Back to inbox
          </Link>
        </Button>
        <Button asChild size='sm' variant='secondary' className='rounded-md'>
          <Link href={inboxHref}>
            Next record
            <ArrowRight className='ml-1.5 size-3.5' />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function RecordsOnFile({
  documents,
  documentTypesByUuid,
  selectedUuid,
  onSelect,
}: {
  documents: InstructorDocument[];
  documentTypesByUuid: Map<string, DocumentTypeOption>;
  selectedUuid: string;
  onSelect: (uuid: string) => void;
}) {
  const groups = useMemo(() => {
    const byType = new Map<string, InstructorDocument[]>();
    for (const document of documents) {
      const typeUuid = document.document_type_uuid ?? 'other';
      byType.set(typeUuid, [...(byType.get(typeUuid) ?? []), document]);
    }
    return Array.from(byType.entries()).map(([typeUuid, items]) => ({
      typeUuid,
      label: documentTypesByUuid.get(typeUuid)?.name ?? 'Other documents',
      required: documentTypesByUuid.get(typeUuid)?.is_required === true,
      items,
    }));
  }, [documents, documentTypesByUuid]);

  return (
    <SectionCard
      title='Records on file'
      description='Everything this person has submitted, grouped'
      bodyClassName='p-2'
    >
      <div className='flex flex-col gap-3'>
        {groups.map(group => (
          <div key={group.typeUuid} className='flex flex-col gap-1'>
            <p className='text-muted-foreground px-2 text-xs font-semibold tracking-wide uppercase'>
              {group.label}
              {group.required ? ' · required' : ''}
            </p>
            {group.items.map(document => {
              const verified = isDocumentVerified(document);
              const isSelected = document.uuid === selectedUuid;
              return (
                <button
                  key={document.uuid}
                  type='button'
                  aria-pressed={isSelected}
                  onClick={() => document.uuid && onSelect(document.uuid)}
                  className={cn(
                    'flex w-full flex-col gap-1 rounded-md border px-3 py-2 text-left transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/40 border-transparent'
                  )}
                >
                  <span className='flex items-center gap-2'>
                    <span className='text-foreground flex-1 text-sm font-semibold'>
                      {document.title}
                    </span>
                    <StatusBadge
                      status={verified ? 'verified' : (document.status ?? 'pending')}
                      label={verified ? 'Verified' : undefined}
                    />
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {document.upload_date
                      ? `Uploaded ${formatDate(document.upload_date)}`
                      : 'Upload date unknown'}
                    {document.is_expired ? ' · expired' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function DocumentViewer({
  document,
  typeName,
}: {
  document: InstructorDocument;
  typeName: string;
}) {
  const url = document.file_url ?? '';

  return (
    <SectionCard title={document.title} description={document.original_filename} bodyClassName='p-0'>
      {url ? (
        <DocumentPreview documentUrl={url} documentTitle={document.title} fullHeight />
      ) : (
        <p className='text-muted-foreground p-5 text-sm'>
          This record has no file attached, so there is nothing to preview.
        </p>
      )}
      <div className='p-5'>
        <DetailGrid
          columns={2}
          items={[
            { label: 'Record type', value: typeName },
            {
              label: 'Uploaded',
              value: document.upload_date ? formatDate(document.upload_date) : '—',
            },
            { label: 'File', value: document.file_size_formatted ?? '—' },
            {
              label: 'Expiry',
              value: document.expiry_date ? formatDate(document.expiry_date) : 'No expiry',
            },
          ]}
        />
      </div>
    </SectionCard>
  );
}

const BASE_CHECKS = [
  { id: 'name', label: 'Name matches the verified ID' },
  { id: 'dates', label: 'Dates are consistent with the record' },
  { id: 'issuer', label: 'Issuer and reference checked at source' },
];

function CrossChecks({
  instructorUuid,
  personName,
}: {
  instructorUuid?: string;
  personName: string;
}) {
  const { education, query } = useInstructorEducation(instructorUuid);

  return (
    <SectionBoundary
      label='the record checks'
      loading={query.isLoading && !query.data}
      error={query.error}
      onRetry={() => query.refetch()}
      skeleton={<SectionCardSkeleton rows={3} />}
    >
      <SectionCard
        title='Check against the record'
        description={`What ${personName || 'this person'}’s record already says`}
      >
        <ul className='flex flex-col gap-3'>
          {BASE_CHECKS.map(check => (
            <li key={check.id} className='text-sm'>
              <span className='text-foreground font-medium'>{check.label}</span>
            </li>
          ))}
          {education.length ? (
            <li className='text-muted-foreground border-border/60 border-t pt-3 text-xs'>
              Qualifications on file:{' '}
              {education
                .map(entry =>
                  [entry.qualification, entry.school_name, entry.year_completed]
                    .filter(Boolean)
                    .join(' · ')
                )
                .join(' | ')}
            </li>
          ) : (
            <li className='text-muted-foreground border-border/60 border-t pt-3 text-xs'>
              No qualifications are recorded on this profile.
            </li>
          )}
        </ul>
      </SectionCard>
    </SectionBoundary>
  );
}

function DecisionPanel({
  document,
  instructorUuid,
  personName,
}: {
  document: InstructorDocument;
  instructorUuid?: string;
  personName: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  /** Frozen when the form validates, so the modal quotes exactly what will be sent. */
  const [pendingNote, setPendingNote] = useState('');
  const { verify, isPending } = useVerifyDocument();
  const verified = isDocumentVerified(document);

  const form = useForm<z.infer<typeof noteSchema>>({
    resolver: zodResolver(noteSchema),
    defaultValues: { note: '' },
    mode: 'onSubmit',
  });

  const withChecks = (note: string) => {
    const ticked = BASE_CHECKS.filter(check => checked.includes(check.id)).map(check => check.label);
    return ticked.length ? `${note.trim()}\n\nChecked: ${ticked.join('; ')}.` : note.trim();
  };

  if (verified) {
    return (
      <SectionCard title='Decision on this record'>
        <div className='flex flex-col gap-2'>
          <p className='text-success flex items-center gap-2 text-sm font-semibold'>
            <ShieldCheck className='size-4' />
            Verified
            {document.verified_by ? ` by ${document.verified_by}` : ''}
            {document.verified_at ? ` on ${formatDate(document.verified_at)}` : ''}
          </p>
          {document.verification_notes ? (
            <p className='bg-muted/40 text-foreground rounded-md px-3 py-2 text-sm'>
              “{document.verification_notes}”
            </p>
          ) : null}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title='Decision on this record'>
      <form
        className='flex flex-col gap-4'
        onSubmit={form.handleSubmit(values => {
          setPendingNote(withChecks(values.note));
          setConfirmOpen(true);
        })}
      >
        <div className='flex flex-col gap-2'>
          {BASE_CHECKS.map(check => (
            <label key={check.id} className='flex items-start gap-2 text-sm'>
              <Checkbox
                checked={checked.includes(check.id)}
                onCheckedChange={value =>
                  setChecked(current =>
                    value ? [...current, check.id] : current.filter(id => id !== check.id)
                  )
                }
                className='mt-0.5'
              />
              <span>{check.label}</span>
            </label>
          ))}
          <p className='text-muted-foreground text-xs'>
            Ticked checks are added to the note you send.
          </p>
        </div>

        <div className='flex flex-col gap-1.5'>
          <Controller
            control={form.control}
            name='note'
            render={({ field }) => (
              <NoteField
                id='verification-note'
                label='Verification note'
                required
                value={field.value}
                onChange={field.onChange}
                error={form.formState.errors.note?.message}
                helper='Stored on the document and shown in the audit trail.'
              />
            )}
          />
        </div>

        <div className='flex flex-wrap gap-2'>
          <Button type='submit' className='rounded-md' disabled={isPending || !instructorUuid}>
            Verify record
          </Button>
          <Button type='button' variant='outline' className='rounded-md' disabled>
            Request re-upload
          </Button>
        </div>
        <p className='text-muted-foreground text-xs'>
          Requesting a re-upload needs a document reject endpoint, which the API does not have yet.
        </p>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        action='verifyDocument'
        subject={{ name: personName, detail: document.title }}
        note={pendingNote}
        isPending={isPending}
        onConfirm={() => {
          if (!instructorUuid || !document.uuid) return;
          verify(
            {
              instructorUuid,
              documentUuid: document.uuid,
              notes: pendingNote,
              documentTitle: document.title,
            },
            () => {
              setConfirmOpen(false);
              form.reset();
              setChecked([]);
            }
          );
        }}
      />
    </SectionCard>
  );
}

function ProfileDecision({
  personName,
  instructorUuid,
  profileVerified,
  requiredVerified,
  requiredTotal,
  unlocked,
}: {
  personName: string;
  instructorUuid?: string;
  profileVerified: boolean;
  requiredVerified: number;
  requiredTotal: number;
  unlocked: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  /** Frozen when the form validates, so the modal quotes what will be sent. */
  const [pendingReason, setPendingReason] = useState('');
  const { verify, isPending } = useVerifyInstructor();

  const form = useForm<z.infer<typeof reasonSchema>>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason: '' },
    mode: 'onSubmit',
  });

  if (profileVerified) {
    return (
      <div className='border-success/40 bg-success/5 flex flex-wrap items-center gap-3 rounded-md border px-4 py-3'>
        <ShieldCheck className='text-success size-4' />
        <p className='text-foreground text-sm'>
          <span className='font-semibold'>{personName} is a verified instructor.</span> Revoking is
          done from Manage access, with a reason.
        </p>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className='border-border/70 bg-muted/20 flex flex-wrap items-center gap-3 rounded-md border px-4 py-3'>
        <Lock className='text-muted-foreground size-4' />
        <div className='flex-1'>
          <p className='text-foreground text-sm font-semibold'>Instructor verification</p>
          <p className='text-muted-foreground text-sm'>
            Opens once every required record is verified.
          </p>
        </div>
        <p className='text-muted-foreground font-mono text-sm'>
          {requiredVerified} of {requiredTotal || '—'} required verified
        </p>
      </div>
    );
  }

  return (
    <div className='border-primary bg-primary/5 flex flex-col gap-3 rounded-md border px-4 py-3'>
      <div className='flex flex-wrap items-center gap-3'>
        <ShieldCheck className='text-primary size-4' />
        <div className='flex-1'>
          <p className='text-foreground text-sm font-semibold'>
            All {requiredTotal} required records verified
          </p>
          <p className='text-muted-foreground text-sm'>Verify {personName} as an instructor?</p>
        </div>
      </div>
      <form
        className='flex flex-wrap items-end gap-2'
        onSubmit={form.handleSubmit(values => {
          setPendingReason(values.reason.trim());
          setConfirmOpen(true);
        })}
      >
        <div className='flex min-w-[260px] flex-1 flex-col gap-1.5'>
          <Controller
            control={form.control}
            name='reason'
            render={({ field }) => (
              <NoteField
                id='verify-reason'
                label='Reason'
                required
                value={field.value}
                onChange={field.onChange}
                error={form.formState.errors.reason?.message}
              />
            )}
          />
        </div>
        <Button type='submit' className='rounded-md' disabled={isPending || !instructorUuid}>
          Verify instructor
        </Button>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        action='verifyInstructor'
        subject={{ name: personName }}
        note={pendingReason}
        isPending={isPending}
        onConfirm={() => {
          if (!instructorUuid) return;
          verify(
            { instructorUuid, reason: pendingReason, name: personName },
            () => {
              setConfirmOpen(false);
              form.reset();
            }
          );
        }}
      />
    </div>
  );
}
