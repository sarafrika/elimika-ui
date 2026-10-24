'use client';

import { formatMoney, formatMoneyDate } from '@/components/money/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, Download, History, ReceiptText } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { auditEventLabel, monthLabel, monthRange, transactionTypeLabel } from './wallet-labels';
import {
  downloadWalletCsv,
  useWalletAudit,
  useWalletStatements,
  useWalletTransactions,
  type WalletScope,
} from './wallet-scope';
import { WalletTxnRow } from './wallet-txn-row';

const ALL = 'all';

function RowsSkeleton() {
  return (
    <div className='space-y-3 py-2'>
      {[0, 1, 2, 3].map(i => (
        <Skeleton key={i} className='h-14 w-full' />
      ))}
    </div>
  );
}

function LoadMore({ show, loading, onClick }: { show: boolean; loading: boolean; onClick: () => void }) {
  if (!show) return null;
  return (
    <div className='flex justify-center pt-3'>
      <Button variant='outline' size='sm' onClick={onClick} disabled={loading}>
        {loading && <Spinner />}Load more
      </Button>
    </div>
  );
}

function ExportButton({ onExport, label = 'Export CSV' }: { onExport: () => Promise<boolean>; label?: string }) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    const ok = await onExport();
    setBusy(false);
    if (!ok) toast.error('Could not prepare the download. Please try again.');
  };
  return (
    <Button variant='outline' size='sm' onClick={() => void run()} disabled={busy}>
      {busy ? <Spinner /> : <Download aria-hidden className='size-4' />}
      {label}
    </Button>
  );
}

/** The ledger: every row, newest first, filtered and exported by the server. */
export function TransactionsPanel({
  scope,
  active,
  types,
  title = 'Transactions',
  description,
  filterTypes,
  emptyTitle = 'No transactions found',
  emptyDescription = 'There are no wallet transactions matching the selected filter.',
  exportName = 'wallet-transactions.csv',
}: {
  scope: WalletScope;
  active: boolean;
  /** Fixed types this panel shows, e.g. only reversals; omit for all. */
  types?: string[];
  title?: string;
  description?: string;
  /** Types offered in the filter; omit to hide the filter. */
  filterTypes?: string[];
  emptyTitle?: string;
  emptyDescription?: string;
  exportName?: string;
}) {
  const [type, setType] = useState(ALL);
  const selected = types ?? (type === ALL ? undefined : [type]);
  const query = useWalletTransactions(scope, selected, active);

  return (
    <Card>
      <CardHeader className='gap-3'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='space-y-1'>
            <CardTitle className='text-base'>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          <ExportButton onExport={() => downloadWalletCsv(scope, { types: selected }, exportName)} />
        </div>
        {filterTypes?.length ? (
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className='w-56' aria-label='Transaction type'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All transaction types</SelectItem>
              {filterTypes.map(code => (
                <SelectItem key={code} value={code}>
                  {transactionTypeLabel(code)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <RowsSkeleton />
        ) : query.isError ? (
          <EmptyState
            variant='compact'
            icon={ArrowLeftRight}
            title='Could not load transactions'
            description='Please try again.'
            action={
              <Button variant='outline' size='sm' onClick={query.refetch}>
                Retry
              </Button>
            }
          />
        ) : query.rows.length === 0 ? (
          <EmptyState variant='compact' icon={ArrowLeftRight} title={emptyTitle} description={emptyDescription} />
        ) : (
          <ul className='divide-y'>
            {query.rows.map(txn => (
              <WalletTxnRow key={txn.uuid} txn={txn} />
            ))}
          </ul>
        )}
        <LoadMore show={query.hasNextPage} loading={query.isFetchingNextPage} onClick={query.fetchNextPage} />
      </CardContent>
    </Card>
  );
}

/** One card per month: opening, in, out, closing, and its rows as CSV. */
export function StatementsPanel({ scope, active }: { scope: WalletScope; active: boolean }) {
  const { statements, isLoading, isError, refetch } = useWalletStatements(scope, active);

  if (isLoading) return <RowsSkeleton />;
  if (isError)
    return (
      <EmptyState
        icon={ReceiptText}
        title='Could not load statements'
        description='Please try again.'
        action={
          <Button variant='outline' onClick={() => void refetch()}>
            Retry
          </Button>
        }
      />
    );
  if (statements.length === 0)
    return (
      <EmptyState
        variant='card'
        icon={ReceiptText}
        title='No statements to display'
        description='A statement appears for each month once your wallet has activity.'
      />
    );

  return (
    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
      {statements.map(st => {
        const currency = st.currency_code ?? 'KES';
        const month = st.month ?? '';
        const lines: [string, ReactNode][] = [
          ['Opening balance', formatMoney(st.opening_balance ?? 0, currency)],
          ['Money in', <span key='in' className='text-success'>{formatMoney(st.money_in ?? 0, currency)}</span>],
          ['Money out', <span key='out' className='text-warning'>{formatMoney(st.money_out ?? 0, currency)}</span>],
          ['Closing balance', formatMoney(st.closing_balance ?? 0, currency)],
        ];
        const count = Number(st.transaction_count ?? 0);
        return (
          <Card key={month}>
            <CardHeader className='pb-0'>
              <CardDescription>Monthly statement</CardDescription>
              <CardTitle className='text-base'>{monthLabel(month)}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <dl className='divide-border/60 divide-y text-sm'>
                {lines.map(([label, value]) => (
                  <div key={label} className='flex justify-between gap-4 py-2'>
                    <dt className='text-muted-foreground'>{label}</dt>
                    <dd className='font-semibold tabular-nums'>{value}</dd>
                  </div>
                ))}
              </dl>
              <p className='text-muted-foreground text-xs'>
                {count} {count === 1 ? 'transaction' : 'transactions'}
              </p>
              <ExportButton
                label='Download CSV'
                onExport={() => downloadWalletCsv(scope, monthRange(month), `wallet-statement-${month}.csv`)}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/** The append-only audit trail: what happened, who did it, the balance before and after. */
export function AuditPanel({ scope, active, selfUuid }: { scope: WalletScope; active: boolean; selfUuid?: string }) {
  const query = useWalletAudit(scope, active);
  const actorLabel = (kind?: string, actor?: string) =>
    kind === 'SYSTEM' || !actor ? 'System' : actor === selfUuid ? 'You' : 'Another account';

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Financial audit trail</CardTitle>
        <CardDescription>Append-only log of every wallet event. Entries can never be edited or removed.</CardDescription>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <RowsSkeleton />
        ) : query.isError ? (
          <EmptyState
            variant='compact'
            icon={History}
            title='Could not load the audit trail'
            description='Please try again.'
            action={
              <Button variant='outline' size='sm' onClick={query.refetch}>
                Retry
              </Button>
            }
          />
        ) : query.events.length === 0 ? (
          <EmptyState
            variant='compact'
            icon={History}
            title='No audit activity yet'
            description='Every change to your wallet will be recorded here.'
          />
        ) : (
          <div className='divide-y'>
            {query.events.map(event => {
              const currency = event.currency_code ?? 'KES';
              const before = (event.previous_values as Record<string, unknown> | undefined)?.balance_amount;
              const after = (event.updated_values as Record<string, unknown> | undefined)?.balance_amount;
              return (
                <div key={event.uuid} className='space-y-1 py-3'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <p className='text-sm font-medium'>{auditEventLabel(event.event_type)}</p>
                    <span className='text-muted-foreground text-xs'>{formatMoneyDate(event.created_date)}</span>
                  </div>
                  {event.reason ? <p className='text-muted-foreground text-xs'>{event.reason}</p> : null}
                  <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-[11px]'>
                    <Badge variant='outline' className='text-[10px]'>
                      {actorLabel(event.actor_kind, event.actor_user_uuid)}
                    </Badge>
                    {before !== undefined && after !== undefined ? (
                      <span className='tabular-nums'>
                        Balance {formatMoney(Number(before), currency)} → {formatMoney(Number(after), currency)}
                      </span>
                    ) : null}
                    {event.reference ? <span>· {event.reference}</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <LoadMore show={query.hasNextPage} loading={query.isFetchingNextPage} onClick={query.fetchNextPage} />
      </CardContent>
    </Card>
  );
}

/** The newest few rows, with a way to the full ledger. */
export function RecentTransactions({
  scope,
  active,
  onViewAll,
  limit = 6,
}: {
  scope: WalletScope;
  active: boolean;
  onViewAll: () => void;
  limit?: number;
}) {
  const query = useWalletTransactions(scope, undefined, active);
  const rows = query.rows.slice(0, limit);
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0'>
        <CardTitle className='text-base'>Recent transactions</CardTitle>
        <Button variant='link' size='sm' className='h-auto p-0 text-xs' onClick={onViewAll}>
          View all
        </Button>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <RowsSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            variant='compact'
            icon={ReceiptText}
            title='No transactions recorded'
            description='Wallet activity will appear here once money moves.'
          />
        ) : (
          <ul className='divide-y'>
            {rows.map(txn => (
              <WalletTxnRow key={txn.uuid} txn={txn} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export interface WalletFigureCard {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'success' | 'warning' | 'default';
}

/** The Accounts tab's cards; anything else for the tab goes below as children. */
export function AccountCards({ cards, loading }: { cards: WalletFigureCard[]; loading?: boolean }) {
  return (
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
      {cards.map(card => (
        <Card key={card.label}>
          <CardHeader className='-mb-2'>
            <CardDescription>{card.label}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-1'>
            {loading ? (
              <Skeleton className='h-8 w-32' />
            ) : (
              <p
                className={cn(
                  'text-2xl font-semibold tabular-nums',
                  card.tone === 'success' && 'text-success',
                  card.tone === 'warning' && 'text-warning'
                )}
              >
                {card.value}
              </p>
            )}
            {card.hint ? <p className='text-muted-foreground text-xs'>{card.hint}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Refunds from the ledger only: nothing here is requested or recorded in the browser. */
export function RefundsPanel({
  scope,
  active,
  types,
  description,
  emptyDescription,
}: {
  scope: WalletScope;
  active: boolean;
  types: string[];
  description: string;
  emptyDescription: string;
}) {
  return (
    <TransactionsPanel
      scope={scope}
      active={active}
      types={types}
      title='Refunds'
      description={description}
      emptyTitle='No refunds'
      emptyDescription={emptyDescription}
      exportName='wallet-refunds.csv'
    />
  );
}

