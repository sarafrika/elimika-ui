'use client';

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
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Currency, CurrencyCreateRequest, CurrencyUpdateRequest } from '@/services/client';
import {
  createCurrencyMutation,
  listAllOptions,
  updateCurrencyMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  DollarSign,
  Edit,
  Loader2,
  Plus,
  Star,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type CurrencyFormData = {
  code: string;
  name: string;
  symbol: string;
  numericCode: string;
  decimalPlaces: string;
  active: boolean;
};

type SortField =
  | 'code'
  | 'name'
  | 'symbol'
  | 'numericCode'
  | 'decimalPlaces'
  | 'active'
  | 'defaultCurrency';
type SortDirection = 'asc' | 'desc';

export default function CurrenciesPage() {
  const queryClient = useQueryClient();
  const PAGE_SIZE = 20;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
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
  const toggleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDirection('asc');
  };

  const getComparableValue = (currency: Currency, field: SortField) => {
    switch (field) {
      case 'code':
        return (currency.code || '').toUpperCase();
      case 'name':
        return (currency.name || '').toUpperCase();
      case 'symbol':
        return (currency.symbol || '').toUpperCase();
      case 'numericCode':
        return currency.numericCode ?? Number.NEGATIVE_INFINITY;
      case 'decimalPlaces':
        return currency.decimalPlaces ?? Number.NEGATIVE_INFINITY;
      case 'active':
        return currency.active ? 1 : 0;
      case 'defaultCurrency':
        return currency.defaultCurrency ? 1 : 0;
      default:
        return '';
    }
  };

  const sortedCurrencies = [...currencies].sort((a, b) => {
    const aValue = getComparableValue(a, sortField);
    const bValue = getComparableValue(b, sortField);

    let comparison = 0;
    if (typeof aValue === 'string' || typeof bValue === 'string') {
      comparison = String(aValue).localeCompare(String(bValue));
    } else {
      comparison = Number(aValue) - Number(bValue);
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCurrencies = normalizedSearch
    ? sortedCurrencies.filter(currency =>
        (currency.code || '').toLowerCase().includes(normalizedSearch)
      )
    : sortedCurrencies;

  const totalPages = Math.max(1, Math.ceil(filteredCurrencies.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedCurrencies = filteredCurrencies.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [normalizedSearch, currencies.length]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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
          <Badge
            variant='outline'
            className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
          >
            Currency Management
          </Badge>
          <div className='bg-card relative mt-4 overflow-hidden rounded-3xl'>
            <div className='flex flex-col'>
              <p className='text-muted-foreground max-w-3xl text-sm leading-relaxed'>
                Manage platform currencies, set default currency, and configure currency properties
              </p>{' '}
            </div>
          </div>
        </div>

        <Button onClick={handleCreate}>
          <Plus className='mr-2 h-4 w-4' />
          Add Currency
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 sm:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardDescription>Total Currencies</CardDescription>
            <CardTitle className='text-3xl'>{currencies.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground text-xs'>Registered on platform</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active Currencies</CardDescription>
            <CardTitle className='text-success-foreground text-3xl'>
              {activeCurrencies.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground text-xs'>Available for use</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Default Currency</CardDescription>
            <CardTitle className='text-2xl'>{defaultCurrency?.code || '—'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground text-xs'>{defaultCurrency?.name || 'Not set'}</p>
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
              <DollarSign className='text-muted-foreground mb-4 h-10 w-10' />
              <p className='mb-2 text-sm font-medium'>No currencies configured</p>
              <p className='text-muted-foreground mb-4 text-xs'>
                Add your first currency to start managing platform currencies
              </p>
              <Button onClick={handleCreate}>
                <Plus className='mr-2 h-4 w-4' />
                Add Currency
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='align-top'>
                      <div className='space-y-2'>
                        <button
                          type='button'
                          onClick={() => toggleSort('code')}
                          className='flex items-center gap-2 font-semibold'
                        >
                          <span>Code</span>
                          {sortField === 'code' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className='h-4 w-4' />
                            ) : (
                              <ArrowDown className='h-4 w-4' />
                            )
                          ) : (
                            <ArrowUpDown className='text-muted-foreground h-4 w-4' />
                          )}
                        </button>
                        <Input
                          placeholder='Search code'
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className='h-9 w-full'
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <button
                        type='button'
                        onClick={() => toggleSort('name')}
                        className='flex items-center gap-2 font-semibold'
                      >
                        <span>Name</span>
                        {sortField === 'name' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className='h-4 w-4' />
                          ) : (
                            <ArrowDown className='h-4 w-4' />
                          )
                        ) : (
                          <ArrowUpDown className='text-muted-foreground h-4 w-4' />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type='button'
                        onClick={() => toggleSort('symbol')}
                        className='flex items-center gap-2 font-semibold'
                      >
                        <span>Symbol</span>
                        {sortField === 'symbol' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className='h-4 w-4' />
                          ) : (
                            <ArrowDown className='h-4 w-4' />
                          )
                        ) : (
                          <ArrowUpDown className='text-muted-foreground h-4 w-4' />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type='button'
                        onClick={() => toggleSort('numericCode')}
                        className='flex items-center gap-2 font-semibold'
                      >
                        <span>Numeric Code</span>
                        {sortField === 'numericCode' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className='h-4 w-4' />
                          ) : (
                            <ArrowDown className='h-4 w-4' />
                          )
                        ) : (
                          <ArrowUpDown className='text-muted-foreground h-4 w-4' />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type='button'
                        onClick={() => toggleSort('decimalPlaces')}
                        className='flex items-center gap-2 font-semibold'
                      >
                        <span>Decimal Places</span>
                        {sortField === 'decimalPlaces' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className='h-4 w-4' />
                          ) : (
                            <ArrowDown className='h-4 w-4' />
                          )
                        ) : (
                          <ArrowUpDown className='text-muted-foreground h-4 w-4' />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type='button'
                        onClick={() => toggleSort('active')}
                        className='flex items-center gap-2 font-semibold'
                      >
                        <span>Status</span>
                        {sortField === 'active' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className='h-4 w-4' />
                          ) : (
                            <ArrowDown className='h-4 w-4' />
                          )
                        ) : (
                          <ArrowUpDown className='text-muted-foreground h-4 w-4' />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type='button'
                        onClick={() => toggleSort('defaultCurrency')}
                        className='flex items-center gap-2 font-semibold'
                      >
                        <span>Default</span>
                        {sortField === 'defaultCurrency' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className='h-4 w-4' />
                          ) : (
                            <ArrowDown className='h-4 w-4' />
                          )
                        ) : (
                          <ArrowUpDown className='text-muted-foreground h-4 w-4' />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCurrencies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className='text-muted-foreground text-center text-sm'>
                        No currencies match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCurrencies.map(currency => (
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
                    ))
                  )}
                </TableBody>
              </Table>
              <div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
                <div className='text-muted-foreground text-sm'>
                  {filteredCurrencies.length === 0
                    ? 'Showing 0 of 0 currencies'
                    : `Showing ${
                        (currentPage - 1) * PAGE_SIZE + 1
                      }-${Math.min(currentPage * PAGE_SIZE, filteredCurrencies.length)} of ${
                        filteredCurrencies.length
                      } currencies`}
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className='text-muted-foreground text-sm'>
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || filteredCurrencies.length === 0}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
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
                  <p className='text-muted-foreground text-xs'>
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
