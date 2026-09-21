'use client';

import { Coins, MoreHorizontal, Pause, Play, Star } from 'lucide-react';
import { useState } from 'react';

import { DataTable, StatusBadge, surfaceTheme } from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Currency } from '@/services/client';
import { ConfirmDialog } from '../components/confirm-dialog';
import { FormSheet } from '../components/form-sheet';
import { SectionBoundary } from '../components/section-boundary';
import {
  type CurrencyFormValues,
  useCreateCurrency,
  useCurrencies,
  useMakeDefaultCurrency,
  useSetCurrencyActive,
  useUpdateCurrency,
} from '../hooks/use-currencies';

type PendingAction =
  | { kind: 'create'; values: CurrencyFormValues }
  | { kind: 'update'; currency: Currency; values: CurrencyFormValues }
  | { kind: 'activate'; currency: Currency }
  | { kind: 'deactivate'; currency: Currency }
  | { kind: 'default'; currency: Currency };

const emptyForm: CurrencyFormValues = {
  code: '',
  name: '',
  symbol: '',
  numeric_code: undefined,
  decimal_places: 2,
  default_currency: false,
};

export function CurrenciesPage() {
  const { currencies, query } = useCurrencies();
  const create = useCreateCurrency();
  const update = useUpdateCurrency();
  const setActive = useSetCurrencyActive();
  const makeDefault = useMakeDefaultCurrency();

  const [editing, setEditing] = useState<Currency | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<CurrencyFormValues>(emptyForm);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSheetOpen(true);
  };

  const openEdit = (currency: Currency) => {
    setEditing(currency);
    setForm({
      code: currency.code ?? '',
      name: currency.name ?? '',
      symbol: currency.symbol ?? '',
      numeric_code: currency.numericCode,
      decimal_places: currency.decimalPlaces ?? 2,
      default_currency: Boolean(currency.defaultCurrency),
    });
    setSheetOpen(true);
  };

  const codeValid = /^[A-Za-z]{3}$/.test(form.code.trim());
  const nameValid = form.name.trim().length > 0 && form.name.trim().length <= 128;
  const decimalsValid = form.decimal_places >= 0 && form.decimal_places <= 6;
  const formValid = (editing ? true : codeValid) && nameValid && decimalsValid;
  const isPending = create.isPending || update.isPending || setActive.isPending || makeDefault.isPending;

  const runPending = () => {
    if (!pending) return;
    const done = { onSuccess: () => setPending(null) };

    if (pending.kind === 'create') {
      create.mutate(pending.values, {
        onSuccess: () => {
          setPending(null);
          setSheetOpen(false);
        },
      });
      return;
    }
    if (pending.kind === 'update') {
      update.mutate(
        { code: pending.currency.code ?? '', values: pending.values },
        {
          onSuccess: () => {
            setPending(null);
            setSheetOpen(false);
          },
        }
      );
      return;
    }
    if (pending.kind === 'default') {
      makeDefault.mutate(pending.currency.code ?? '', done);
      return;
    }
    setActive.mutate(
      { code: pending.currency.code ?? '', active: pending.kind === 'activate' },
      done
    );
  };

  const confirmAction =
    pending?.kind === 'create'
      ? 'addCurrency'
      : pending?.kind === 'update'
        ? 'updateCurrency'
        : pending?.kind === 'activate'
          ? 'activateCurrency'
          : pending?.kind === 'deactivate'
            ? 'deactivateCurrency'
            : 'makeDefaultCurrency';

  const confirmName =
    pending?.kind === 'create'
      ? `${pending.values.code.toUpperCase()} · ${pending.values.name}`
      : pending && 'currency' in pending
        ? `${pending.currency.code} · ${pending.currency.name}`
        : '';

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Finance'
          title='Currencies'
          description='What the platform can price in, and which currency it falls back to.'
          actions={
            <Button className='rounded-md' onClick={openCreate}>
              <Coins className='mr-2 size-4' />
              Add currency
            </Button>
          }
        />

        <SectionBoundary
          label='the currencies'
          loading={query.isLoading && currencies.length === 0}
          error={query.error}
          empty={!query.isLoading && currencies.length === 0}
          onRetry={query.refetch}
          emptyTitle='No currencies yet'
          emptyDescription='Add one to start pricing courses and classes.'
        >
          <DataTable
            hideToolbar
            data={currencies}
            isLoading={query.isLoading}
            getRowId={row => row.code ?? ''}
            columns={[
              {
                id: 'code',
                header: 'Code',
                cell: ({ row }) => (
                  <div className='flex items-center gap-2'>
                    <span className='font-mono text-sm font-semibold'>{row.original.code}</span>
                    {row.original.defaultCurrency ? (
                      <StatusBadge tone='info' label='Default' />
                    ) : null}
                  </div>
                ),
              },
              { id: 'name', header: 'Name', cell: ({ row }) => <span className='text-sm'>{row.original.name}</span> },
              {
                id: 'symbol',
                header: 'Symbol',
                cell: ({ row }) => <span className='font-mono text-sm'>{row.original.symbol || '—'}</span>,
              },
              {
                id: 'numeric',
                header: 'Numeric',
                cell: ({ row }) => (
                  <span className='text-muted-foreground font-mono text-xs'>
                    {row.original.numericCode ?? '—'}
                  </span>
                ),
              },
              {
                id: 'decimals',
                header: 'Decimals',
                cell: ({ row }) => (
                  <span className='font-mono text-sm'>{row.original.decimalPlaces ?? '—'}</span>
                ),
              },
              {
                id: 'status',
                header: 'Status',
                cell: ({ row }) => (
                  <StatusBadge status={row.original.active ? 'active' : 'inactive'} />
                ),
              },
              {
                id: 'actions',
                header: '',
                cell: ({ row }) => {
                  const currency = row.original;
                  const isDefault = Boolean(currency.defaultCurrency);
                  return (
                    <div className='flex justify-end'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='size-8 rounded-md'
                            aria-label={`Actions for ${currency.code}`}
                          >
                            <MoreHorizontal className='size-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-56'>
                          <DropdownMenuItem onClick={() => openEdit(currency)}>Edit</DropdownMenuItem>
                          {currency.active ? (
                            <DropdownMenuItem
                              disabled={isDefault}
                              onClick={() => setPending({ kind: 'deactivate', currency })}
                            >
                              <Pause className='mr-2 size-4' />
                              {isDefault ? 'Deactivate (set a new default first)' : 'Deactivate'}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => setPending({ kind: 'activate', currency })}>
                              <Play className='mr-2 size-4' />
                              Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            disabled={isDefault}
                            onClick={() => setPending({ kind: 'default', currency })}
                          >
                            <Star className='mr-2 size-4' />
                            Make default
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                },
              },
            ]}
          />
        </SectionBoundary>

        <p className='text-muted-foreground text-xs'>
          A new currency starts inactive unless you make it the default — the create endpoint
          ignores the active flag. The default currency cannot be deactivated; assign a new
          default first.
        </p>
      </div>

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? `Edit ${editing.code}` : 'Add a currency'}
        description={
          editing
            ? 'Details only. Activation has its own action.'
            : 'ISO code, name and how many decimal places it uses.'
        }
        isDirty={form.code.length > 0 || form.name.length > 0}
        isPending={isPending}
        submitLabel={editing ? 'Save currency' : 'Create currency'}
        onSubmit={() => {
          if (!formValid) return;
          setPending(
            editing ? { kind: 'update', currency: editing, values: form } : { kind: 'create', values: form }
          );
        }}
      >
        <div className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='currency-code' className='text-sm font-semibold'>
              Code <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='currency-code'
              value={form.code}
              disabled={Boolean(editing)}
              maxLength={3}
              onChange={event => setForm({ ...form, code: event.target.value.toUpperCase() })}
              className='rounded-md font-mono uppercase'
              placeholder='UGX'
            />
            {!editing && form.code.length > 0 && !codeValid ? (
              <p className='text-destructive text-xs'>Use the three-letter ISO code.</p>
            ) : (
              <p className='text-muted-foreground text-xs'>
                {editing ? 'The code cannot change once a currency exists.' : 'Three letters, e.g. KES.'}
              </p>
            )}
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='currency-name' className='text-sm font-semibold'>
              Name <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='currency-name'
              value={form.name}
              maxLength={128}
              onChange={event => setForm({ ...form, name: event.target.value })}
              className='rounded-md'
              placeholder='Ugandan Shilling'
            />
          </div>

          <div className='grid gap-4 sm:grid-cols-3'>
            <div className='space-y-1.5'>
              <Label htmlFor='currency-symbol' className='text-sm font-semibold'>
                Symbol
              </Label>
              <Input
                id='currency-symbol'
                value={form.symbol ?? ''}
                maxLength={16}
                onChange={event => setForm({ ...form, symbol: event.target.value })}
                className='rounded-md'
                placeholder='USh'
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='currency-numeric' className='text-sm font-semibold'>
                Numeric code
              </Label>
              <Input
                id='currency-numeric'
                value={form.numeric_code ?? ''}
                inputMode='numeric'
                onChange={event =>
                  setForm({
                    ...form,
                    numeric_code: event.target.value ? Number(event.target.value) : undefined,
                  })
                }
                className='rounded-md font-mono'
                placeholder='800'
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='currency-decimals' className='text-sm font-semibold'>
                Decimal places <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='currency-decimals'
                value={form.decimal_places}
                inputMode='numeric'
                onChange={event =>
                  setForm({ ...form, decimal_places: Number(event.target.value || 0) })
                }
                className='rounded-md font-mono'
              />
              {!decimalsValid ? (
                <p className='text-destructive text-xs'>Between 0 and 6.</p>
              ) : null}
            </div>
          </div>

          {editing ? null : (
            <div className='border-border/60 flex flex-col gap-3 rounded-md border p-3'>
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <Label htmlFor='currency-default' className='text-sm font-semibold'>
                    Make it the default
                  </Label>
                  <p className='text-muted-foreground text-xs'>
                    The default is used wherever no currency is given.
                  </p>
                </div>
                <Switch
                  id='currency-default'
                  checked={form.default_currency}
                  onCheckedChange={checked => setForm({ ...form, default_currency: checked })}
                />
              </div>
              <div className='flex items-center justify-between gap-3 opacity-60'>
                <div>
                  <Label htmlFor='currency-active' className='text-sm font-semibold'>
                    Active
                  </Label>
                  <p className='text-muted-foreground text-xs'>
                    New currencies start inactive unless they are the default — the API ignores
                    this on create. Activate it from the row afterwards.
                  </p>
                </div>
                <Switch id='currency-active' disabled checked={form.default_currency} />
              </div>
            </div>
          )}
        </div>
      </FormSheet>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={open => {
          if (!open) setPending(null);
        }}
        action={confirmAction}
        subject={{ name: confirmName }}
        isPending={isPending}
        onConfirm={runPending}
      />
    </div>
  );
}
