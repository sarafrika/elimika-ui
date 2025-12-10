'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAllOptions,
  createCurrencyMutation,
  updateCurrencyMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type { Currency, CurrencyCreateRequest, CurrencyUpdateRequest } from '@/services/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  DollarSign,
  CheckCircle2,
  XCircle,
  Star,
  Loader2,
} from 'lucide-react';

type CurrencyFormData = {
  code: string;
  name: string;
  symbol: string;
  numericCode: string;
  decimalPlaces: string;
  active: boolean;
};

export default function CurrenciesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [formData, setFormData] = useState<CurrencyFormData>({
    code: '',
    name: '',
    symbol: '',
    numericCode: '',
    decimalPlaces: '2',
    active: true,
  });

  const { data, isLoading } = useQuery({
    ...listAllOptions(),
  });

  const currencies = (data?.data ?? []) as Currency[];
  const activeCurrencies = currencies.filter(c => c.active);
  const defaultCurrency = currencies.find(c => c.defaultCurrency);

  const createMutation = useMutation({
    ...createCurrencyMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listAll'] });
      toast.success('Currency created successfully');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create currency');
    },
  });

  const updateMutation = useMutation({
    ...updateCurrencyMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listAll'] });
      toast.success('Currency updated successfully');
      setEditingCurrency(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update currency');
    },
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      symbol: '',
      numericCode: '',
      decimalPlaces: '2',
      active: true,
    });
  };

  const handleCreate = () => {
    setEditingCurrency(null);
    resetForm();
    setIsCreateOpen(true);
  };

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency);
    setFormData({
      code: currency.code || '',
      name: currency.name || '',
      symbol: currency.symbol || '',
      numericCode: currency.numericCode?.toString() || '',
      decimalPlaces: currency.decimalPlaces?.toString() || '2',
      active: currency.active ?? true,
    });
    setIsCreateOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCurrency) {
      // Update existing currency
      const updateData: CurrencyUpdateRequest = {
        name: formData.name,
        symbol: formData.symbol,
        numeric_code: formData.numericCode ? parseInt(formData.numericCode, 10) : undefined,
        decimal_places: formData.decimalPlaces ? parseInt(formData.decimalPlaces, 10) : undefined,
        active: formData.active,
      };

      updateMutation.mutate({
        path: { code: editingCurrency.code || '' },
        body: updateData,
      });
    } else {
      // Create new currency
      const createData: CurrencyCreateRequest = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        symbol: formData.symbol,
        numeric_code: formData.numericCode ? parseInt(formData.numericCode, 10) : undefined,
        decimal_places: formData.decimalPlaces ? parseInt(formData.decimalPlaces, 10) : undefined,
        active: formData.active,
      };

      createMutation.mutate({
        body: createData,
      });
    }
  };

  const handleToggleActive = (currency: Currency) => {
    updateMutation.mutate({
      path: { code: currency.code || '' },
      body: {
        active: !currency.active,
      },
    });
  };

  return (
    <div className='flex min-h-screen flex-col gap-6 p-6'>
      <div className='flex items-start justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Currency Management</h1>
          <p className='mt-2 text-muted-foreground'>
            Manage platform currencies, set default currency, and configure currency properties
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className='mr-2 h-4 w-4' />
          Add Currency
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 sm:grid-cols-3'>
        <Card>
          <CardHeader className='pb-3'>
            <CardDescription>Total Currencies</CardDescription>
            <CardTitle className='text-3xl'>{currencies.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xs text-muted-foreground'>Registered on platform</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardDescription>Active Currencies</CardDescription>
            <CardTitle className='text-3xl text-success-foreground'>{activeCurrencies.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xs text-muted-foreground'>Available for use</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardDescription>Default Currency</CardDescription>
            <CardTitle className='text-2xl'>{defaultCurrency?.code || '—'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xs text-muted-foreground'>{defaultCurrency?.name || 'Not set'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Currencies Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Currencies</CardTitle>
          <CardDescription>View and manage all platform currencies</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-3'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : currencies.length === 0 ? (
            <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center'>
              <DollarSign className='mb-4 h-10 w-10 text-muted-foreground' />
              <p className='mb-2 text-sm font-medium'>No currencies configured</p>
              <p className='mb-4 text-xs text-muted-foreground'>
                Add your first currency to start managing platform currencies
              </p>
              <Button onClick={handleCreate}>
                <Plus className='mr-2 h-4 w-4' />
                Add Currency
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Numeric Code</TableHead>
                  <TableHead>Decimal Places</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currencies.map(currency => (
                  <TableRow key={currency.code}>
                    <TableCell className='font-mono font-semibold'>{currency.code}</TableCell>
                    <TableCell>{currency.name}</TableCell>
                    <TableCell className='text-lg'>{currency.symbol || '—'}</TableCell>
                    <TableCell>{currency.numericCode || '—'}</TableCell>
                    <TableCell>{currency.decimalPlaces ?? 2}</TableCell>
                    <TableCell>
                      {currency.active ? (
                        <Badge variant='default' className='gap-1'>
                          <CheckCircle2 className='h-3 w-3' />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant='outline' className='gap-1'>
                          <XCircle className='h-3 w-3' />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {currency.defaultCurrency && (
                        <Badge variant='secondary' className='gap-1'>
                          <Star className='h-3 w-3 fill-current' />
                          Default
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-2'>
                        <Button variant='ghost' size='sm' onClick={() => handleEdit(currency)}>
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant={currency.active ? 'outline' : 'default'}
                          size='sm'
                          onClick={() => handleToggleActive(currency)}
                          disabled={updateMutation.isPending}
                        >
                          {currency.active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCurrency ? 'Edit Currency' : 'Add New Currency'}</DialogTitle>
            <DialogDescription>
              {editingCurrency
                ? 'Update currency information below'
                : 'Enter the details for the new currency. Code cannot be changed later.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label htmlFor='code'>ISO Currency Code *</Label>
                <Input
                  id='code'
                  placeholder='USD, EUR, GBP'
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  disabled={!!editingCurrency}
                  required
                  maxLength={3}
                  className='font-mono uppercase'
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='name'>Currency Name *</Label>
                <Input
                  id='name'
                  placeholder='United States Dollar'
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='symbol'>Symbol</Label>
                <Input
                  id='symbol'
                  placeholder='$, €, £'
                  value={formData.symbol}
                  onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='numericCode'>Numeric Code</Label>
                  <Input
                    id='numericCode'
                    type='number'
                    placeholder='840'
                    value={formData.numericCode}
                    onChange={e => setFormData({ ...formData, numericCode: e.target.value })}
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='decimalPlaces'>Decimal Places</Label>
                  <Input
                    id='decimalPlaces'
                    type='number'
                    min='0'
                    max='4'
                    placeholder='2'
                    value={formData.decimalPlaces}
                    onChange={e => setFormData({ ...formData, decimalPlaces: e.target.value })}
                  />
                </div>
              </div>
              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <Label htmlFor='active'>Active Status</Label>
                  <p className='text-xs text-muted-foreground'>
                    Make this currency available for use
                  </p>
                </div>
                <Switch
                  id='active'
                  checked={formData.active}
                  onCheckedChange={active => setFormData({ ...formData, active })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsCreateOpen(false)}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                {editingCurrency ? 'Update' : 'Create'} Currency
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
