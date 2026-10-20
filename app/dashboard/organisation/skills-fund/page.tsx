'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Coins, Landmark, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { SectionCard, StatusBadge } from '@/components/data-display';
import { SectionTabPanel, useSectionTab } from '@/components/data-display/section-tabs';
import type { StatusTone } from '@/components/data-display/tone';
import { formatMoney, formatMoneyDate } from '@/components/money/format';
import { MoneyPage } from '@/components/money/money-page';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity, extractList } from '@/lib/api-helpers';
import type { SkillsFundSource, SkillsFundSummary, SkillsFundTransaction, StatusEnum14 } from '@/services/client';
import {
  addSourceMutation,
  addTransactionMutation,
  deleteSourceMutation,
  getSummary2Options,
  getSummary2QueryKey,
  listSourcesOptions,
  listSourcesQueryKey,
  listTransactionsOptions,
  listTransactionsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';

const TABS = ['transactions', 'sources'] as const;
const STATUSES = ['PENDING', 'ALLOCATED', 'APPROVED', 'DISBURSED'] as const;
const TRANSACTION_TYPES = ['Allocation', 'Disbursement', 'Adjustment'];
const SELECT_CLASS =
  'border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1';

/** The API enum, with the legacy spellings still sitting in persisted query caches. */
const STATUS: Record<string, { label: string; tone: StatusTone }> = {
  DISBURSED: { label: 'Disbursed', tone: 'success' },
  APPROVED: { label: 'Approved', tone: 'info' },
  ALLOCATED: { label: 'Allocated', tone: 'info' },
  PENDING: { label: 'Pending', tone: 'warning' },
  Completed: { label: 'Disbursed', tone: 'success' },
  Approved: { label: 'Approved', tone: 'info' },
  Allocated: { label: 'Allocated', tone: 'info' },
  Pending: { label: 'Pending', tone: 'warning' },
};

const field = (form: HTMLFormElement, name: string) =>
  (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null)?.value.trim() ?? '';

/** Funder admin: where the skills fund's money comes from and where it has gone. */
export default function SkillsFundPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const qc = useQueryClient();
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(TABS, 'transactions');
  const [addingSource, setAddingSource] = useState(false);
  const [recording, setRecording] = useState(false);
  const path = { path: { organisationUuid } };

  const summaryQuery = useQuery({ ...getSummary2Options(path), enabled: Boolean(organisationUuid) });
  const summary = extractEntity<SkillsFundSummary>(summaryQuery.data);
  const sourcesQuery = useQuery({ ...listSourcesOptions(path), enabled: Boolean(organisationUuid) });
  const sources = extractList<SkillsFundSource>(sourcesQuery.data);
  const transactionsQuery = useQuery({ ...listTransactionsOptions(path), enabled: Boolean(organisationUuid) });
  const transactions = extractList<SkillsFundTransaction>(transactionsQuery.data);

  const currency = summary?.currency_code ?? 'KES';
  const sourcesTotal = sources.reduce((sum, s) => sum + Number(s.amount ?? 0), 0);
  const pendingCount = transactions.filter(t => STATUS[t.status ?? '']?.label === 'Pending').length;

  const refresh = (listKey: unknown[]) => {
    void qc.invalidateQueries({ queryKey: listKey });
    void qc.invalidateQueries({ queryKey: getSummary2QueryKey(path) });
  };

  const removeSource = useMutation(deleteSourceMutation());
  const remove = (source: SkillsFundSource) =>
    removeSource.mutate(
      { path: { sourceUuid: source.uuid ?? '' } },
      {
        onSuccess: () => {
          toast.success('Source removed', { description: source.name });
          refresh(listSourcesQueryKey(path));
        },
        // A 409 explains that the remaining sources could not cover what was already disbursed.
        onError: (error: unknown) =>
          toast.error((error as { message?: string })?.message ?? 'Could not remove source.'),
      }
    );

  return (
    <>
      <MoneyPage
        eyebrow='Finance'
        title='Skills Fund'
        description='Where your skills fund comes from, and what has been allocated and disbursed to learners.'
        actions={
          <>
            <Button asChild variant='outline' size='sm'>
              <Link href='/dashboard/organisation/skills-wallet'>
                <Coins className='size-4' /> Learner funding
              </Link>
            </Button>
            <Button variant='outline' size='sm' onClick={() => setRecording(true)} disabled={!organisationUuid}>
              <Plus className='size-4' /> Record transaction
            </Button>
            <Button size='sm' onClick={() => setAddingSource(true)} disabled={!organisationUuid}>
              <Plus className='size-4' /> Add funding source
            </Button>
          </>
        }
        loadingStats={summaryQuery.isLoading}
        stats={[
          {
            label: 'Remaining',
            value: formatMoney(summary?.remaining ?? 0, currency),
            hint: `Of ${formatMoney(summary?.total_balance ?? 0, currency)} raised`,
            icon: Landmark,
          },
          { label: 'Allocated', value: formatMoney(summary?.allocated ?? 0, currency), hint: 'Committed to learners' },
          { label: 'Disbursed', value: formatMoney(summary?.disbursed ?? 0, currency), hint: 'Paid out of the fund' },
          {
            label: 'Pending',
            value: formatMoney(summary?.pending ?? 0, currency),
            hint: `${pendingCount} ${pendingCount === 1 ? 'request' : 'requests'} awaiting a decision`,
          },
        ]}
        tabs={[
          { id: 'transactions', label: 'Transactions', count: transactions.length },
          { id: 'sources', label: 'Funding sources', count: sources.length },
        ]}
        tab={tab}
        onTabChange={setTab}
        hrefFor={hrefFor}
      >
        <SectionTabPanel value='transactions'>
          <SectionCard
            title='Transactions'
            description='Allocations, disbursements and adjustments, newest first.'
            bodyClassName='p-0'
          >
            {transactionsQuery.isLoading ? (
              <RowsSkeleton />
            ) : transactions.length === 0 ? (
              <EmptyState
                variant='plain'
                icon={Coins}
                title='No transactions yet'
                description='Fund allocations and disbursements appear here once you record them.'
              />
            ) : (
              <div className='overflow-x-auto'>
                <Table className='min-w-[640px]'>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='pl-5 whitespace-nowrap'>Date</TableHead>
                      <TableHead className='whitespace-nowrap'>Description</TableHead>
                      <TableHead className='whitespace-nowrap'>Recipient</TableHead>
                      <TableHead className='whitespace-nowrap'>Status</TableHead>
                      <TableHead className='pr-5 text-right whitespace-nowrap'>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map(t => {
                      const status = STATUS[t.status ?? ''];
                      return (
                        <TableRow key={t.uuid}>
                          <TableCell className='text-muted-foreground pl-5 whitespace-nowrap'>
                            {formatMoneyDate(t.transaction_date ?? t.created_date)}
                          </TableCell>
                          <TableCell className='whitespace-nowrap'>
                            <p className='font-medium'>{t.description || 'Fund transaction'}</p>
                            {t.transaction_type ? (
                              <p className='text-muted-foreground text-xs'>{t.transaction_type}</p>
                            ) : null}
                          </TableCell>
                          <TableCell className='text-muted-foreground whitespace-nowrap'>
                            {t.target_name || '—'}
                          </TableCell>
                          <TableCell className='whitespace-nowrap'>
                            <StatusBadge status={t.status} label={status?.label} tone={status?.tone} />
                          </TableCell>
                          <TableCell className='pr-5 text-right font-semibold whitespace-nowrap tabular-nums'>
                            {formatMoney(t.amount, t.currency_code ?? currency)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>
        </SectionTabPanel>

        <SectionTabPanel value='sources'>
          <SectionCard
            title='Funding sources'
            description='Grants, sponsors and other contributions that make up the fund.'
            bodyClassName='p-0'
          >
            {sourcesQuery.isLoading ? (
              <RowsSkeleton />
            ) : sources.length === 0 ? (
              <EmptyState
                variant='plain'
                icon={Landmark}
                title='No funding sources yet'
                description='Add a grant or sponsor contribution to start the fund.'
              />
            ) : (
              <div className='overflow-x-auto'>
                <Table className='min-w-[560px]'>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='pl-5 whitespace-nowrap'>Source</TableHead>
                      <TableHead className='w-48 whitespace-nowrap'>Share of fund</TableHead>
                      <TableHead className='text-right whitespace-nowrap'>Amount</TableHead>
                      <TableHead className='w-12 pr-5'>
                        <span className='sr-only'>Remove</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sources.map(s => {
                      const pct = sourcesTotal > 0 ? Math.round((Number(s.amount ?? 0) / sourcesTotal) * 100) : 0;
                      return (
                        <TableRow key={s.uuid}>
                          <TableCell className='pl-5 whitespace-nowrap'>
                            <p className='font-medium'>{s.name}</p>
                            {s.source_type ? <p className='text-muted-foreground text-xs'>{s.source_type}</p> : null}
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <div className='bg-muted h-2 flex-1 overflow-hidden rounded-full'>
                                <div className='bg-primary h-full' style={{ width: `${pct}%` }} />
                              </div>
                              <span className='text-muted-foreground w-10 text-right text-xs tabular-nums'>{pct}%</span>
                            </div>
                          </TableCell>
                          <TableCell className='text-right font-semibold whitespace-nowrap tabular-nums'>
                            {formatMoney(s.amount, s.currency_code ?? currency)}
                          </TableCell>
                          <TableCell className='pr-5 text-right'>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='text-muted-foreground hover:text-destructive size-8'
                              aria-label={`Remove ${s.name ?? 'source'}`}
                              disabled={removeSource.isPending}
                              onClick={() => remove(s)}
                            >
                              <Trash2 className='size-4' />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>
        </SectionTabPanel>
      </MoneyPage>

      <AddSourceSheet
        open={addingSource}
        onOpenChange={setAddingSource}
        organisationUuid={organisationUuid}
        onAdded={() => refresh(listSourcesQueryKey(path))}
      />
      <RecordTransactionSheet
        open={recording}
        onOpenChange={setRecording}
        organisationUuid={organisationUuid}
        onRecorded={() => refresh(listTransactionsQueryKey(path))}
      />
    </>
  );
}

function RowsSkeleton() {
  return (
    <div className='space-y-2 p-5'>
      {[0, 1, 2, 3].map(i => (
        <Skeleton key={i} className='h-10 w-full' />
      ))}
    </div>
  );
}

interface FundSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisationUuid: string;
}

function AddSourceSheet({ open, onOpenChange, organisationUuid, onAdded }: FundSheetProps & { onAdded: () => void }) {
  const add = useMutation(addSourceMutation());

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = field(form, 's-name');
    const amount = field(form, 's-amount');
    if (!name) {
      toast.error('Source name is required.');
      return;
    }
    add.mutate(
      {
        path: { organisationUuid },
        body: { name, source_type: field(form, 's-type') || undefined, amount: amount ? Number(amount) : 0 },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          toast.success('Funding source added', { description: name });
          onAdded();
        },
        onError: () => toast.error('Could not add source.'),
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full gap-6 sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>Add funding source</SheetTitle>
          <SheetDescription>Record a contribution to your skills fund.</SheetDescription>
        </SheetHeader>
        <form className='flex flex-1 flex-col gap-6' onSubmit={submit}>
          <div className='space-y-4 px-4'>
            <div className='space-y-2'>
              <Label htmlFor='s-name'>Name</Label>
              <Input id='s-name' name='s-name' placeholder='e.g. Government grant' required />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='s-type'>Type</Label>
              <Input id='s-type' name='s-type' placeholder='e.g. Grant, Sponsor' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='s-amount'>Amount (KES)</Label>
              <Input id='s-amount' name='s-amount' type='number' min={0} placeholder='0' />
            </div>
          </div>
          <SheetFooter className='mt-auto flex-row justify-end gap-2'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={!organisationUuid || add.isPending}>
              {add.isPending ? <Spinner className='size-4' /> : null}
              Add source
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function RecordTransactionSheet({
  open,
  onOpenChange,
  organisationUuid,
  onRecorded,
}: FundSheetProps & { onRecorded: () => void }) {
  const add = useMutation(addTransactionMutation());

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const amount = field(form, 't-amount');
    add.mutate(
      {
        path: { organisationUuid },
        body: {
          description: field(form, 't-desc') || undefined,
          target_name: field(form, 't-target') || undefined,
          amount: amount ? Number(amount) : 0,
          transaction_type: field(form, 't-type'),
          status: field(form, 't-status') as StatusEnum14,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          toast.success('Transaction recorded');
          onRecorded();
        },
        onError: () => toast.error('Could not record transaction.'),
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full gap-6 sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>Record fund transaction</SheetTitle>
          <SheetDescription>Log an allocation, disbursement or adjustment.</SheetDescription>
        </SheetHeader>
        <form className='flex flex-1 flex-col gap-6' onSubmit={submit}>
          <div className='space-y-4 px-4'>
            <div className='space-y-2'>
              <Label htmlFor='t-desc'>Description</Label>
              <Input id='t-desc' name='t-desc' placeholder='e.g. Disbursement · Basic coding' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='t-target'>Recipient</Label>
              <Input id='t-target' name='t-target' placeholder='e.g. John Doe' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='t-amount'>Amount (KES)</Label>
              <Input id='t-amount' name='t-amount' type='number' min={0} placeholder='0' />
            </div>
            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='t-type'>Type</Label>
                <select id='t-type' name='t-type' defaultValue='Allocation' className={SELECT_CLASS}>
                  {TRANSACTION_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='t-status'>Status</Label>
                <select id='t-status' name='t-status' defaultValue='PENDING' className={SELECT_CLASS}>
                  {/* Values are the API enum; labels are what a person reads. */}
                  {STATUSES.map(status => (
                    <option key={status} value={status}>
                      {STATUS[status]?.label ?? status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <SheetFooter className='mt-auto flex-row justify-end gap-2'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={!organisationUuid || add.isPending}>
              {add.isPending ? <Spinner className='size-4' /> : null}
              Record
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
