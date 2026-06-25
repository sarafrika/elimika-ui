'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { DollarSign, Pencil, Plus, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Currency } from '@/services/client';
import {
  createCurrencyMutation,
  listAllOptions,
  listAllQueryKey,
  updateCurrencyMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { AdminTable } from '../_components/ui/AdminTable';
import { StatusBadge } from '../_components/ui/StatusBadge';

interface CurrencyForm {
  code: string;
  name: string;
  symbol: string;
  numeric_code: string;
  decimal_places: string;
  active: boolean;
  default_currency: boolean;
}

const EMPTY_FORM: CurrencyForm = {
  code: '',
  name: '',
  symbol: '',
  numeric_code: '',
  decimal_places: '2',
  active: true,
  default_currency: false,
};

export default function CurrenciesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(listAllOptions());
  const currencies = useMemo(() => (data?.data ?? []) as Currency[], [data?.data]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Currency | null>(null);
  const [form, setForm] = useState<CurrencyForm>(EMPTY_FORM);

  const create = useMutation(createCurrencyMutation());
  const update = useMutation(updateCurrencyMutation());
  const isPending = create.isPending || update.isPending;

  const refresh = () => queryClient.invalidateQueries({ queryKey: listAllQueryKey() });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (currency: Currency) => {
    setEditing(currency);
    setForm({
      code: currency.code ?? '',
      name: currency.name ?? '',
      symbol: currency.symbol ?? '',
      numeric_code: currency.numericCode != null ? String(currency.numericCode) : '',
      decimal_places: currency.decimalPlaces != null ? String(currency.decimalPlaces) : '2',
      active: currency.active ?? true,
      default_currency: currency.defaultCurrency ?? false,
    });
    setOpen(true);
  };

  const submit = async () => {
    const numeric = form.numeric_code ? Number(form.numeric_code) : undefined;
    const decimals = Number(form.decimal_places || '2');
    try {
      if (editing?.code) {
        await update.mutateAsync({
          path: { code: editing.code },
          body: {
            name: form.name,
            symbol: form.symbol || undefined,
            numeric_code: numeric,
            decimal_places: decimals,
            active: form.active,
          },
        });
        toast.success('Currency updated');
      } else {
        await create.mutateAsync({
          body: {
            code: form.code.toUpperCase(),
            name: form.name,
            symbol: form.symbol || undefined,
            numeric_code: numeric,
            decimal_places: decimals,
            active: form.active,
            default_currency: form.default_currency,
          },
        });
        toast.success('Currency created');
      }
      setOpen(false);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save currency');
    }
  };

  const columns = useMemo<ColumnDef<Currency>[]>(
    () => [
      {
        id: 'code',
        accessorFn: row => row.code ?? '',
        header: 'Code',
        meta: { label: 'Code' },
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <span className='font-mono text-sm font-medium text-foreground'>{row.original.code}</span>
            {row.original.defaultCurrency ? (
              <Star className='size-3.5 fill-warning text-warning' />
            ) : null}
          </div>
        ),
      },
      {
        id: 'name',
        accessorFn: row => row.name ?? '',
        header: 'Name',
        meta: { label: 'Name' },
        cell: ({ row }) => <span className='text-sm'>{row.original.name}</span>,
      },
      {
        id: 'symbol',
        accessorFn: row => row.symbol ?? '',
        header: 'Symbol',
        meta: { label: 'Symbol' },
        cell: ({ row }) => <span className='text-sm text-muted-foreground'>{row.original.symbol || '—'}</span>,
      },
      {
        id: 'status',
        accessorFn: row => (row.active ? 'active' : 'inactive'),
        header: 'Status',
        meta: { label: 'Status' },
        filterFn: (row, id, value: string[]) =>
          !value?.length || value.includes(row.getValue(id) as string),
        cell: ({ row }) => <StatusBadge status={row.original.active ? 'active' : 'inactive'} />,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className='flex justify-end'>
            <Button
              variant='ghost'
              size='icon'
              className='size-8'
              onClick={e => {
                e.stopPropagation();
                openEdit(row.original);
              }}
            >
              <Pencil className='size-4' />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Currencies'
          description='Manage the currencies available for pricing and payments.'
          actions={
            <Button onClick={openCreate}>
              <Plus className='size-4' />
              New currency
            </Button>
          }
        />

        <AdminTable
          columns={columns}
          data={currencies}
          isLoading={isLoading}
          searchPlaceholder='Search currencies…'
          getRowId={(currency, index) => currency.code ?? String(index)}
          facetedFilters={[
            {
              columnId: 'status',
              title: 'Status',
              options: [
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ],
            },
          ]}
          emptyTitle='No currencies yet'
          emptyDescription='Add a currency to enable pricing in that denomination.'
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <DollarSign className='size-5' />
              {editing ? 'Edit currency' : 'New currency'}
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label htmlFor='code'>Code</Label>
                <Input
                  id='code'
                  value={form.code}
                  disabled={Boolean(editing)}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  placeholder='USD'
                  maxLength={3}
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='symbol'>Symbol</Label>
                <Input
                  id='symbol'
                  value={form.symbol}
                  onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
                  placeholder='$'
                />
              </div>
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='name'>Name</Label>
              <Input
                id='name'
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder='US Dollar'
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label htmlFor='numeric_code'>Numeric code</Label>
                <Input
                  id='numeric_code'
                  value={form.numeric_code}
                  onChange={e => setForm(f => ({ ...f, numeric_code: e.target.value }))}
                  placeholder='840'
                  inputMode='numeric'
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='decimal_places'>Decimal places</Label>
                <Input
                  id='decimal_places'
                  value={form.decimal_places}
                  onChange={e => setForm(f => ({ ...f, decimal_places: e.target.value }))}
                  inputMode='numeric'
                />
              </div>
            </div>
            <div className='flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 px-4 py-3'>
              <Label htmlFor='active'>Active</Label>
              <Switch
                id='active'
                checked={form.active}
                onCheckedChange={checked => setForm(f => ({ ...f, active: checked }))}
              />
            </div>
            {!editing ? (
              <div className='flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 px-4 py-3'>
                <Label htmlFor='default_currency'>Set as default</Label>
                <Switch
                  id='default_currency'
                  checked={form.default_currency}
                  onCheckedChange={checked => setForm(f => ({ ...f, default_currency: checked }))}
                />
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={isPending || !form.code || !form.name}>
              {isPending ? 'Saving…' : editing ? 'Save changes' : 'Create currency'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
