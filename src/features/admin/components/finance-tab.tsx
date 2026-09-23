'use client';

import { Ban, Receipt } from 'lucide-react';
import { useState } from 'react';

import { DataTable, DetailGrid, SectionCard, StatusBadge } from '@/components/data-display';
import { useInstructorsByIds } from '@/hooks/use-batched-lookups';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/date';
import { toNumber } from '@/lib/metrics';
import type { InstructorObligation, Organisation, SkillsFundSummary } from '@/services/client';
import { ConfirmDialog } from './confirm-dialog';
import { FormSheet } from './form-sheet';
import { NoteField, noteToPlainText } from './note-field';
import { SectionBoundary } from './section-boundary';
import { useCancelObligation, useSettleObligation } from '../hooks/use-organisation-admin-actions';

export interface MonthlySettlement {
  month?: string;
  amount?: number;
  currency_code?: string;
}

export interface InstructorPayable {
  instructor_uuid?: string;
  amount_owed?: number;
  amount_settled?: number;
  class_count?: number;
  outstanding_session_count?: number;
  currency_code?: string;
}

interface FinanceTabProps {
  organisation: Organisation;
  obligations: InstructorObligation[];
  settlements: MonthlySettlement[];
  payables: InstructorPayable[];
  skillsFund: SkillsFundSummary | null;
  status: string;
  onStatusChange: (status: string) => void;
  obligationsQuery: { isLoading: boolean; error: unknown; refetch: () => void };
  settlementsQuery: { isLoading: boolean; error: unknown; refetch: () => void };
  payablesQuery: { isLoading: boolean; error: unknown; refetch: () => void };
  skillsFundQuery: { isLoading: boolean; error: unknown; refetch: () => void };
}

const STATUSES = [
  { value: 'any', label: 'Any status' },
  { value: 'ACCRUED', label: 'Accrued' },
  { value: 'SETTLED', label: 'Settled' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'DISPUTED', label: 'Disputed' },
];

const money = (amount?: number, currency?: string) =>
  amount === undefined || amount === null
    ? '—'
    : `${currency ?? ''} ${Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`.trim();

/** What the organisation owes its instructors, and what it has recorded as paid. */
export function FinanceTab({
  organisation,
  obligations,
  settlements,
  payables,
  skillsFund,
  status,
  onStatusChange,
  obligationsQuery,
  settlementsQuery,
  payablesQuery,
  skillsFundQuery,
}: FinanceTabProps) {
  const organisationUuid = organisation.uuid ?? '';
  const [settling, setSettling] = useState<InstructorObligation | null>(null);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [confirmSettle, setConfirmSettle] = useState(false);
  const [cancelling, setCancelling] = useState<InstructorObligation | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const settle = useSettleObligation();
  const cancel = useCancelObligation();

  const instructorIds = Array.from(
    new Set(
      [...obligations, ...payables]
        .map(entry => entry.instructor_uuid)
        .filter((id): id is string => Boolean(id))
    )
  );
  const { instructorMap } = useInstructorsByIds(instructorIds);
  const nameOf = (uuid?: string) => (uuid ? (instructorMap[uuid]?.full_name ?? 'Instructor') : '—');

  const referenceValid = reference.trim().length > 0 && reference.trim().length <= 128;
  const cancelReasonValid = noteToPlainText(cancelReason).length >= 10;

  return (
    <div className='flex flex-col gap-4'>
      <SectionCard
        title='Instructor obligations'
        description='Each completed session accrues what the organisation owes.'
        actions={
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className='border-border/70 h-9 w-[160px] rounded-md'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        <SectionBoundary
          label='the obligations'
          loading={obligationsQuery.isLoading}
          error={obligationsQuery.error}
          empty={obligations.length === 0}
          onRetry={obligationsQuery.refetch}
          emptyTitle='Nothing outstanding'
          emptyDescription='No obligations match this status.'
        >
          <DataTable
            hideToolbar
            data={obligations}
            getRowId={row => row.uuid ?? ''}
            emptyTitle='Nothing outstanding'
            columns={[
              {
                id: 'instructor',
                header: 'Instructor',
                cell: ({ row }) => (
                  <span className='text-sm font-medium'>{nameOf(row.original.instructor_uuid)}</span>
                ),
              },
              {
                id: 'amount',
                header: 'Amount',
                cell: ({ row }) => (
                  <span className='font-mono text-sm'>
                    {money(row.original.rate_amount, row.original.currency_code)}
                  </span>
                ),
              },
              {
                id: 'accrued',
                header: 'Accrued',
                cell: ({ row }) => (
                  <span className='text-muted-foreground font-mono text-xs'>
                    {formatDate(row.original.accrued_at) || '—'}
                  </span>
                ),
              },
              {
                id: 'status',
                header: 'Status',
                cell: ({ row }) => <StatusBadge status={row.original.status} />,
              },
              {
                id: 'reference',
                header: 'Reference',
                cell: ({ row }) => (
                  <span className='text-muted-foreground font-mono text-xs'>
                    {row.original.settlement_reference || '—'}
                  </span>
                ),
              },
              {
                id: 'actions',
                header: '',
                cell: ({ row }) =>
                  row.original.status === 'ACCRUED' || row.original.status === 'DISPUTED' ? (
                    <div className='flex justify-end gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        className='rounded-md'
                        onClick={() => {
                          setSettling(row.original);
                          setReference('');
                          setNote('');
                        }}
                      >
                        <Receipt className='mr-1.5 size-3.5' />
                        Settle
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        className='border-destructive/40 text-destructive rounded-md'
                        onClick={() => {
                          setCancelling(row.original);
                          setCancelReason('');
                        }}
                      >
                        <Ban className='mr-1.5 size-3.5' />
                        Cancel
                      </Button>
                    </div>
                  ) : null,
              },
            ]}
          />
        </SectionBoundary>
      </SectionCard>

      <div className='grid gap-4 lg:grid-cols-2'>
        <SectionCard title='Settled by month' description='What the organisation recorded as paid.'>
          <SectionBoundary
            label='the settlement history'
            loading={settlementsQuery.isLoading}
            error={settlementsQuery.error}
            empty={settlements.length === 0}
            onRetry={settlementsQuery.refetch}
            emptyTitle='Nothing settled yet'
            emptyDescription='No payments have been recorded.'
          >
            <ul className='flex flex-col gap-2'>
              {settlements.map(entry => (
                <li key={entry.month} className='flex items-center justify-between gap-3 text-sm'>
                  <span className='text-muted-foreground font-mono text-xs'>{entry.month}</span>
                  <span className='font-mono'>{money(entry.amount, entry.currency_code)}</span>
                </li>
              ))}
            </ul>
          </SectionBoundary>
        </SectionCard>

        <SectionCard title='Payables by instructor' description='Outstanding against settled.'>
          <SectionBoundary
            label='the payables'
            loading={payablesQuery.isLoading}
            error={payablesQuery.error}
            empty={payables.length === 0}
            onRetry={payablesQuery.refetch}
            emptyTitle='Nothing owed'
            emptyDescription='No instructor is owed anything right now.'
          >
            <ul className='flex flex-col gap-2'>
              {payables.map(payable => (
                <li
                  key={payable.instructor_uuid}
                  className='border-border/60 flex flex-wrap items-center gap-3 rounded-md border px-3 py-2'
                >
                  <span className='min-w-0 flex-1 truncate text-sm font-medium'>
                    {nameOf(payable.instructor_uuid)}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {toNumber(payable.outstanding_session_count)} session(s)
                  </span>
                  <span className='font-mono text-sm'>
                    {money(payable.amount_owed, payable.currency_code)}
                  </span>
                </li>
              ))}
            </ul>
          </SectionBoundary>
        </SectionCard>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <SectionCard title='Skills fund' description='Money set aside for learners here.'>
          <SectionBoundary
            label='the skills fund'
            loading={skillsFundQuery.isLoading}
            error={skillsFundQuery.error}
            empty={!skillsFund}
            onRetry={skillsFundQuery.refetch}
            emptyTitle='No fund set up'
            emptyDescription='This organisation has no skills fund.'
          >
            <DetailGrid
              columns={2}
              items={[
                { label: 'Total balance', value: money(skillsFund?.total_balance, skillsFund?.currency_code) },
                { label: 'Allocated', value: money(skillsFund?.allocated, skillsFund?.currency_code) },
                { label: 'Disbursed', value: money(skillsFund?.disbursed, skillsFund?.currency_code) },
                { label: 'Remaining', value: money(skillsFund?.remaining, skillsFund?.currency_code) },
              ]}
            />
          </SectionBoundary>
        </SectionCard>

        <SectionCard title='Revenue' description='Sales this organisation made.'>
          <div className='border-warning/40 bg-warning/5 rounded-md border p-4'>
            <p className='text-foreground text-sm font-medium'>Not available for one organisation</p>
            <p className='text-muted-foreground mt-1 text-xs'>
              Revenue analytics resolve from the caller&apos;s own affiliations, so a platform admin
              cannot ask for this organisation&apos;s figures. Showing a number here would mean
              adding up one sales query per class — a backend change is the honest fix.
            </p>
          </div>
        </SectionCard>
      </div>

      <FormSheet
        open={settling !== null}
        onOpenChange={open => {
          if (!open) setSettling(null);
        }}
        title='Record a settlement'
        description='This records a payment made outside Elimika.'
        isDirty={reference.length > 0 || note.length > 0}
        isPending={settle.isPending}
        submitLabel='Record settlement'
        onSubmit={() => {
          if (referenceValid) setConfirmSettle(true);
        }}
      >
        <div className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='settlement-reference' className='text-sm font-semibold'>
              Payment reference <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='settlement-reference'
              value={reference}
              onChange={event => setReference(event.target.value)}
              className='rounded-md font-mono'
              placeholder='Bank reference, mobile money code or payroll run id'
              maxLength={128}
            />
            {!referenceValid && reference.length > 0 ? (
              <p className='text-destructive text-xs'>Keep the reference under 128 characters.</p>
            ) : null}
          </div>
          <NoteField
            id='settlement-note'
            label='Note'
            value={note}
            onChange={setNote}
            helper='Anything the organisation should see alongside the payment.'
          />
        </div>
      </FormSheet>

      <ConfirmDialog
        open={confirmSettle}
        onOpenChange={setConfirmSettle}
        action='settleObligation'
        subject={{
          name: nameOf(settling?.instructor_uuid),
          detail: money(settling?.rate_amount, settling?.currency_code),
        }}
        note={noteToPlainText(note) || undefined}
        isPending={settle.isPending}
        onConfirm={() => {
          if (!settling?.uuid) return;
          settle.mutate(
            {
              organisationUuid,
              obligationUuid: settling.uuid,
              settlementReference: reference.trim(),
              note: note || undefined,
              instructorName: nameOf(settling.instructor_uuid),
            },
            {
              onSuccess: () => {
                setConfirmSettle(false);
                setSettling(null);
                setReference('');
                setNote('');
              },
            }
          );
        }}
      />

      <FormSheet
        open={cancelling !== null}
        onOpenChange={open => {
          if (!open) setCancelling(null);
        }}
        title='Cancel this obligation'
        description='Use this when the session should never have accrued.'
        isDirty={cancelReason.length > 0}
        isPending={cancel.isPending}
        submitLabel='Cancel obligation'
        onSubmit={() => {
          if (cancelReasonValid) setConfirmCancel(true);
        }}
      >
        <NoteField
          id='cancel-reason'
          label='Reason'
          required
          value={cancelReason}
          onChange={setCancelReason}
          helper='Travels with the request and shows on the obligation.'
          error={
            cancelReason.length > 0 && !cancelReasonValid
              ? 'Say why in at least 10 characters.'
              : undefined
          }
        />
      </FormSheet>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        action='cancelObligation'
        subject={{ name: nameOf(cancelling?.instructor_uuid) }}
        note={noteToPlainText(cancelReason) || undefined}
        isPending={cancel.isPending}
        onConfirm={() => {
          if (!cancelling?.uuid) return;
          cancel.mutate(
            {
              organisationUuid,
              obligationUuid: cancelling.uuid,
              reason: cancelReason,
              instructorName: nameOf(cancelling.instructor_uuid),
            },
            {
              onSuccess: () => {
                setConfirmCancel(false);
                setCancelling(null);
                setCancelReason('');
              },
            }
          );
        }}
      />
    </div>
  );
}
