// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { CheckCircle, Clock, Coins, Download, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity, extractList } from '@/lib/api-helpers';
import type { SkillsFundSource, SkillsFundSummary, SkillsFundTransaction } from '@/services/client';
import {
  addSourceMutation,
  addTransactionMutation,
  deleteSourceMutation,
  getSummaryOptions,
  getSummaryQueryKey,
  listSourcesOptions,
  listSourcesQueryKey,
  listTransactionsOptions,
  listTransactionsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';

const money = (v?: number | string | null) => {
  const n = Number(v ?? 0);
  return `KSh ${n.toLocaleString()}`;
};

/**
 * The API now returns a constrained upper-case enum (`PENDING`, `ALLOCATED`, `APPROVED`,
 * `DISBURSED`) where it used to return whatever free-form string had been stored. Keyed on the enum,
 * with the legacy spellings kept so rows already sitting in a persisted query cache still render
 * rather than falling through to the grey default.
 */
const STATUS_STYLE: Record<string, string> = {
  DISBURSED: 'bg-success/10 text-success',
  APPROVED: 'bg-info/10 text-info',
  ALLOCATED: 'bg-primary/10 text-primary',
  PENDING: 'bg-warning/10 text-warning',
  Completed: 'bg-success/10 text-success',
  Approved: 'bg-info/10 text-info',
  Allocated: 'bg-primary/10 text-primary',
  Pending: 'bg-warning/10 text-warning',
};

/** `DISBURSED` reads as shouting in a table cell — the enum is the contract, this is the label. */
const STATUS_LABEL: Record<string, string> = {
  DISBURSED: 'Disbursed',
  APPROVED: 'Approved',
  ALLOCATED: 'Allocated',
  PENDING: 'Pending',
};

const isDisbursed = (status?: string) => status === 'DISBURSED' || status === 'Completed';
const isPending = (status?: string) => status === 'PENDING' || status === 'Pending';

function AddSourceDialog({ organisationUuid }: { organisationUuid: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const add = useMutation(addSourceMutation());
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm'>
          <Plus className='mr-2 h-4 w-4' /> Add funding source
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Add funding source</DialogTitle>
          <DialogDescription>Record a contribution to your skills fund.</DialogDescription>
        </DialogHeader>
        <form
          className='space-y-4'
          onSubmit={e => {
            e.preventDefault();
            const f = e.currentTarget;
            const name = (f.elements.namedItem('s-name') as HTMLInputElement)?.value.trim();
            const sourceType = (f.elements.namedItem('s-type') as HTMLInputElement)?.value.trim();
            const amount = (f.elements.namedItem('s-amount') as HTMLInputElement)?.value;
            if (!name) return toast.error('Source name is required.');
            add.mutate(
              {
                path: { organisationUuid },
                body: {
                  name,
                  source_type: sourceType || undefined,
                  amount: amount ? Number(amount) : 0,
                },
              },
              {
                onSuccess: async () => {
                  setOpen(false);
                  toast.success('Funding source added', { description: name });
                  await qc.invalidateQueries({
                    queryKey: listSourcesQueryKey({ path: { organisationUuid } }),
                  });
                  await qc.invalidateQueries({
                    queryKey: getSummaryQueryKey({ path: { organisationUuid } }),
                  });
                },
                onError: () => toast.error('Could not add source.'),
              }
            );
          }}
        >
          <div className='space-y-2'>
            <Label htmlFor='s-name'>Name</Label>
            <Input id='s-name' name='s-name' placeholder='e.g. Government Grant' required />
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='s-type'>Type</Label>
              <Input id='s-type' name='s-type' placeholder='e.g. Grant, Sponsor' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='s-amount'>Amount (KSh)</Label>
              <Input id='s-amount' name='s-amount' type='number' min={0} placeholder='0' />
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={add.isPending}>
              {add.isPending ? 'Adding…' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddTransactionDialog({ organisationUuid }: { organisationUuid: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const add = useMutation(addTransactionMutation());
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm' variant='outline'>
          <Plus className='mr-2 h-4 w-4' /> Record transaction
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Record fund transaction</DialogTitle>
          <DialogDescription>Log an allocation, disbursement or adjustment.</DialogDescription>
        </DialogHeader>
        <form
          className='space-y-4'
          onSubmit={e => {
            e.preventDefault();
            const f = e.currentTarget;
            const description = (f.elements.namedItem('t-desc') as HTMLInputElement)?.value.trim();
            const target = (f.elements.namedItem('t-target') as HTMLInputElement)?.value.trim();
            const amount = (f.elements.namedItem('t-amount') as HTMLInputElement)?.value;
            const type = (f.elements.namedItem('t-type') as HTMLSelectElement)?.value;
            const status = (f.elements.namedItem('t-status') as HTMLSelectElement)?.value;
            add.mutate(
              {
                path: { organisationUuid },
                body: {
                  description: description || undefined,
                  target_name: target || undefined,
                  amount: amount ? Number(amount) : 0,
                  transaction_type: type,
                  status,
                },
              },
              {
                onSuccess: async () => {
                  setOpen(false);
                  toast.success('Transaction recorded');
                  await qc.invalidateQueries({
                    queryKey: listTransactionsQueryKey({ path: { organisationUuid } }),
                  });
                  await qc.invalidateQueries({
                    queryKey: getSummaryQueryKey({ path: { organisationUuid } }),
                  });
                },
                onError: () => toast.error('Could not record transaction.'),
              }
            );
          }}
        >
          <div className='space-y-2'>
            <Label htmlFor='t-desc'>Description</Label>
            <Input id='t-desc' name='t-desc' placeholder='e.g. Disbursement - Basic Coding' />
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='t-target'>Recipient / target</Label>
              <Input id='t-target' name='t-target' placeholder='e.g. John Doe' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='t-amount'>Amount (KSh)</Label>
              <Input id='t-amount' name='t-amount' type='number' min={0} placeholder='0' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='t-type'>Type</Label>
              <select
                id='t-type'
                name='t-type'
                defaultValue='Allocation'
                className='border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1'
              >
                {['Allocation', 'Disbursement', 'Adjustment'].map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='t-status'>Status</Label>
              <select
                id='t-status'
                name='t-status'
                defaultValue='PENDING'
                className='border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1'
              >
                {/* Values are the API enum; labels are what a person should read. Sending
                    "Completed" would still be accepted and folded to DISBURSED, but the round-trip
                    would then display something the user never chose. */}
                {(['PENDING', 'ALLOCATED', 'APPROVED', 'DISBURSED'] as const).map(s => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={add.isPending}>
              {add.isPending ? 'Saving…' : 'Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SkillsFundPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const qc = useQueryClient();

  const summaryQuery = useQuery({
    ...getSummaryOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const summary = extractEntity<SkillsFundSummary>(summaryQuery.data);

  const sourcesQuery = useQuery({
    ...listSourcesOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const sources = extractList<SkillsFundSource>(sourcesQuery.data);

  const transactionsQuery = useQuery({
    ...listTransactionsOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const transactions = extractList<SkillsFundTransaction>(transactionsQuery.data);

  const removeSource = useMutation(deleteSourceMutation());

  const sourcesTotal = sources.reduce((a, s) => a + Number(s.amount ?? 0), 0);

  const kpis = [
    { label: 'Total Fund Balance', value: summary?.total_balance, border: 'border-l-primary' },
    { label: 'Allocated', value: summary?.allocated, border: 'border-l-success' },
    { label: 'Disbursed', value: summary?.disbursed, border: 'border-l-teal-500' },
    { label: 'Pending Requests', value: summary?.pending, border: 'border-l-warning' },
    { label: 'Remaining', value: summary?.remaining, border: 'border-l-teal-400' },
  ];

  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
      <PageHeader
        title='Skills Fund'
        description='Financial overview, funding sources, and recent transactions.'
        action={
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => toast.info('Export', { description: 'Preparing fund report.' })}
            >
              <Download className='mr-2 h-4 w-4' /> Export
            </Button>
            <Button asChild variant='outline' size='sm'>
              <Link href='/dashboard/organisation/skills-wallet'>
                <Coins className='mr-2 h-4 w-4' /> Allocate to students
              </Link>
            </Button>
            <AddSourceDialog organisationUuid={organisationUuid} />
          </div>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
        {kpis.map(k => (
          <Card key={k.label} className={`border-l-4 ${k.border}`}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-muted-foreground text-xs font-medium'>{k.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-xl font-bold'>{money(k.value)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid gap-4 lg:grid-cols-3'>
        {/* Funding sources */}
        <Card className='lg:col-span-1'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Funding sources</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {sourcesQuery.isLoading ? (
              <div className='space-y-2'>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className='bg-muted h-8 w-full animate-pulse rounded' />
                ))}
              </div>
            ) : sources.length === 0 ? (
              <p className='text-muted-foreground py-6 text-center text-sm'>
                No funding sources yet.
              </p>
            ) : (
              sources.map(s => {
                const pct =
                  sourcesTotal > 0 ? Math.round((Number(s.amount ?? 0) / sourcesTotal) * 100) : 0;
                return (
                  <div key={s.uuid} className='space-y-1'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='min-w-0 truncate font-medium'>
                        {s.name}
                        {s.source_type && (
                          <span className='text-muted-foreground ml-1 text-xs'>
                            · {s.source_type}
                          </span>
                        )}
                      </span>
                      <span className='flex shrink-0 items-center gap-2'>
                        <span className='font-mono text-xs'>{money(s.amount)}</span>
                        <button
                          type='button'
                          className='text-muted-foreground hover:text-destructive'
                          aria-label='Remove source'
                          onClick={() =>
                            removeSource.mutate(
                              { path: { sourceUuid: s.uuid } },
                              {
                                onSuccess: async () => {
                                  toast.success('Source removed', { description: s.name });
                                  await qc.invalidateQueries({
                                    queryKey: listSourcesQueryKey({ path: { organisationUuid } }),
                                  });
                                  await qc.invalidateQueries({
                                    queryKey: getSummaryQueryKey({ path: { organisationUuid } }),
                                  });
                                },
                                // The API refuses removal with a 409 when the surviving sources
                                // could no longer cover what has already been disbursed. That
                                // explanation is the whole value of the error — don't swallow it.
                                onError: (error: unknown) =>
                                  toast.error(
                                    (error as { message?: string })?.message ??
                                      'Could not remove source.'
                                  ),
                              }
                            )
                          }
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </button>
                      </span>
                    </div>
                    <div className='bg-muted h-2 overflow-hidden rounded-full'>
                      <div className='bg-primary h-full' style={{ width: `${pct}%` }} />
                    </div>
                    <div className='text-muted-foreground text-right text-[10px]'>{pct}%</div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className='lg:col-span-2'>
          <CardHeader className='flex flex-row items-center justify-between pb-3'>
            <CardTitle className='text-base'>Recent transactions</CardTitle>
            <AddTransactionDialog organisationUuid={organisationUuid} />
          </CardHeader>
          <CardContent className='p-0'>
            {transactionsQuery.isLoading ? (
              <div className='space-y-2 p-4'>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className='bg-muted h-10 w-full animate-pulse rounded' />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className='p-4'>
                <EmptyState
                  icon={Coins}
                  title='No transactions yet'
                  description='Fund allocations and disbursements will appear here.'
                />
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <Table className='min-w-[640px]'>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='whitespace-nowrap'>Date</TableHead>
                      <TableHead className='whitespace-nowrap'>Description</TableHead>
                      <TableHead className='whitespace-nowrap'>Target</TableHead>
                      <TableHead className='text-right whitespace-nowrap'>Amount</TableHead>
                      <TableHead className='whitespace-nowrap'>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map(t => (
                      <TableRow key={t.uuid}>
                        <TableCell className='text-muted-foreground whitespace-nowrap'>
                          {t.transaction_date
                            ? dayjs(t.transaction_date).format('DD MMM YYYY')
                            : '—'}
                        </TableCell>
                        <TableCell className='whitespace-nowrap'>{t.description ?? '—'}</TableCell>
                        <TableCell className='text-muted-foreground whitespace-nowrap'>
                          {t.target_name ?? '—'}
                        </TableCell>
                        <TableCell className='text-right font-mono whitespace-nowrap'>
                          {money(t.amount)}
                        </TableCell>
                        <TableCell className='whitespace-nowrap'>
                          <Badge
                            className={STATUS_STYLE[t.status] ?? 'bg-muted text-foreground'}
                            variant='secondary'
                          >
                            {isDisbursed(t.status) && <CheckCircle className='mr-1 h-3 w-3' />}
                            {isPending(t.status) && <Clock className='mr-1 h-3 w-3' />}
                            {STATUS_LABEL[t.status] ?? t.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
