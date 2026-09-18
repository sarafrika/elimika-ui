'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Check, FileText, MapPin, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { SectionCard, StatusBadge, surfaceTheme } from '@/components/data-display';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/date';
import { toNumber } from '@/lib/metrics';
import type {
  DocumentTypeOption,
  Organisation,
  OrganisationDashboardStats,
  OrganisationDocument,
  TrainingBranch,
} from '@/services/client';
import { ConfirmDialog } from './confirm-dialog';
import { SectionBoundary } from './section-boundary';
import {
  type OrganisationDecision,
  useModerateOrganisation,
} from '../hooks/use-organisation-actions';

const decisionSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, 'Say why in at least 10 characters — it travels with the request.'),
});

type DecisionValues = z.infer<typeof decisionSchema>;

interface OrganisationVerificationTabProps {
  organisation: Organisation;
  documents: OrganisationDocument[];
  documentTypes: DocumentTypeOption[];
  branches: TrainingBranch[];
  statistics: OrganisationDashboardStats | null;
  documentsQuery: { isLoading: boolean; error: unknown; refetch: () => void };
  branchesQuery: { isLoading: boolean; error: unknown; refetch: () => void };
}

/**
 * The decision is taken here, with the licence, the locations and the membership in
 * view — never from a queue row.
 */
export function OrganisationVerificationTab({
  organisation,
  documents,
  documentTypes,
  branches,
  statistics,
  documentsQuery,
  branchesQuery,
}: OrganisationVerificationTabProps) {
  const [pendingDecision, setPendingDecision] = useState<OrganisationDecision | null>(null);
  const moderate = useModerateOrganisation();

  const form = useForm<DecisionValues>({
    resolver: zodResolver(decisionSchema),
    defaultValues: { reason: '' },
    mode: 'onChange',
  });

  const organisationName = organisation.name;
  const uuid = organisation.uuid ?? '';
  const isVerified = Boolean(organisation.admin_verified);
  const hasPin = organisation.latitude !== null && organisation.longitude !== null;
  const branchesWithoutPin = branches.filter(
    branch => branch.latitude === null || branch.longitude === null
  );

  const askFor = async (action: OrganisationDecision) => {
    const valid = await form.trigger('reason');
    if (!valid) return;
    setPendingDecision(action);
  };

  const confirmAction =
    pendingDecision === 'approve'
      ? 'approveOrganisation'
      : pendingDecision === 'reject'
        ? 'rejectOrganisation'
        : 'revokeOrganisation';

  const requiredTypes = documentTypes.filter(type => type.is_required);
  const uploadedTypeUuids = new Set(documents.map(document => document.document_type_uuid));
  const missingTypes = requiredTypes.filter(type => !uploadedTypeUuids.has(type.uuid));

  return (
    <div className='grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]'>
      <div className='flex flex-col gap-4'>
        <SectionCard
          title='Evidence on file'
          description='What the organisation uploaded to support its registration.'
        >
          <SectionBoundary
            label='the uploaded evidence'
            loading={documentsQuery.isLoading}
            error={documentsQuery.error}
            empty={documents.length === 0}
            onRetry={documentsQuery.refetch}
            emptyTitle='Nothing uploaded yet'
            emptyDescription='This organisation has not uploaded any supporting documents.'
          >
            <ul className='flex flex-col gap-2'>
              {documents.map(document => (
                <li
                  key={document.uuid}
                  className='border-border/60 flex flex-wrap items-center gap-3 rounded-md border px-3 py-2.5'
                >
                  <FileText className='text-muted-foreground size-4 shrink-0' />
                  <div className='min-w-0 flex-1'>
                    <p className='text-foreground truncate text-sm font-medium'>
                      {document.title || document.original_filename || 'Untitled document'}
                    </p>
                    <p className='text-muted-foreground font-mono text-xs'>
                      {document.original_filename} · uploaded{' '}
                      {formatDate(document.upload_date) || '—'}
                      {document.expiry_date ? ` · expires ${formatDate(document.expiry_date)}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={document.status} />
                </li>
              ))}
            </ul>
          </SectionBoundary>

          <p className='text-muted-foreground mt-3 text-xs'>
            Evidence is listed but cannot be opened or marked verified here: the API has no admin
            route to read or decide on an organisation document yet. Check the originals with the
            organisation, then record your decision below.
          </p>

          {missingTypes.length ? (
            <div className='border-warning/40 bg-warning/5 mt-3 flex gap-2 rounded-md border p-3'>
              <AlertTriangle className='text-warning mt-0.5 size-4 shrink-0' />
              <p className='text-foreground text-xs'>
                Still missing: {missingTypes.map(type => type.name).join(', ')}
              </p>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          title='Check against the record'
          description='What Elimika already holds for this organisation.'
        >
          <ul className='flex flex-col gap-2 text-sm'>
            <CheckRow
              ok={Boolean(organisation.licence_no)}
              label='Licence number on file'
              value={organisation.licence_no || 'Not provided'}
            />
            <CheckRow
              ok={Boolean(organisation.location)}
              label='Location given'
              value={
                [organisation.location, organisation.country].filter(Boolean).join(', ') ||
                'Not provided'
              }
            />
            <CheckRow
              ok={hasPin}
              label='Map pin set'
              value={
                hasPin
                  ? `${organisation.latitude}, ${organisation.longitude}`
                  : 'No coordinates recorded'
              }
            />
            <SectionBoundary
              label='the branches'
              loading={branchesQuery.isLoading}
              error={branchesQuery.error}
              onRetry={branchesQuery.refetch}
            >
              <CheckRow
                ok={branches.length > 0 && branchesWithoutPin.length === 0}
                label={`Branches (${branches.length})`}
                value={
                  branches.length === 0
                    ? 'No branches registered'
                    : branchesWithoutPin.length === 0
                      ? branches.map(branch => branch.branch_name).join(', ')
                      : `${branchesWithoutPin.length} of ${branches.length} have no map pin`
                }
              />
            </SectionBoundary>
            <CheckRow
              ok={toNumber(statistics?.total_members) > 0}
              label='Members'
              value={
                statistics
                  ? `${toNumber(statistics.total_members)} total · ${toNumber(
                      statistics.total_admins
                    )} admins · ${toNumber(statistics.total_instructors)} instructors`
                  : 'Counts load on the Overview tab — that query is expensive, so it is not repeated here'
              }
            />
          </ul>
        </SectionCard>
      </div>

      <SectionCard
        title='Decision'
        description='Your reason travels with the request and shows in the activity log.'
        className='h-fit'
      >
        <Form {...form}>
          <form className='flex flex-col gap-4' onSubmit={event => event.preventDefault()}>
            <FormField
              control={form.control}
              name='reason'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Reason <span className='text-destructive'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      className='rounded-md'
                      placeholder='What you checked, and what you concluded.'
                    />
                  </FormControl>
                  <FormDescription>
                    The backend logs this with the request but does not yet store it on the record.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex flex-col gap-2'>
              {isVerified ? (
                <Button
                  type='button'
                  variant='outline'
                  className='border-destructive/40 text-destructive rounded-md'
                  onClick={() => askFor('revoke')}
                >
                  <X className='mr-2 size-4' />
                  Revoke verification
                </Button>
              ) : (
                <>
                  <Button type='button' className='rounded-md' onClick={() => askFor('approve')}>
                    <Check className='mr-2 size-4' />
                    Verify organisation
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    className='rounded-md'
                    onClick={() => askFor('reject')}
                  >
                    Reject registration
                  </Button>
                </>
              )}
            </div>

            <p className={surfaceTheme.sectionLabel}>
              {isVerified
                ? 'Verified organisations keep their members, classes and branches if you revoke.'
                : 'Members, classes and branches are unaffected by this decision.'}
            </p>
          </form>
        </Form>
      </SectionCard>

      <ConfirmDialog
        open={pendingDecision !== null}
        onOpenChange={open => {
          if (!open) setPendingDecision(null);
        }}
        action={confirmAction}
        subject={{ name: organisationName, confirmValue: organisationName }}
        note={form.getValues('reason')}
        isPending={moderate.isPending}
        onConfirm={() => {
          if (!pendingDecision) return;
          moderate.mutate(
            {
              uuid,
              action: pendingDecision,
              reason: form.getValues('reason'),
              organisationName,
            },
            {
              onSuccess: () => {
                setPendingDecision(null);
                form.reset({ reason: '' });
              },
            }
          );
        }}
      />
    </div>
  );
}

function CheckRow({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  return (
    <li className='border-border/60 flex items-start gap-3 rounded-md border px-3 py-2.5'>
      <span
        className={
          ok
            ? 'border-success/30 bg-success/10 text-success mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm border'
            : 'border-warning/30 bg-warning/10 text-warning mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm border'
        }
      >
        {ok ? <Check className='size-3' /> : <MapPin className='size-3' />}
      </span>
      <span className='min-w-0'>
        <span className='text-foreground block font-medium'>{label}</span>
        <span className='text-muted-foreground block text-xs'>{value}</span>
      </span>
    </li>
  );
}
