'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { RuleDrawer } from './RuleDrawer';
import { RulePreview } from './RulePreview';
import {
  useSystemRules,
  type SystemRule,
  type SystemRuleCategory,
  type SystemRuleStatus,
} from '@/services/admin/system-config';
import {
  Filter,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCcw,
  SlidersHorizontal,
  X,
  Eye,
} from 'lucide-react';

const categoryFilters: { value: SystemRuleCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All categories' },
  { value: 'PLATFORM_FEE', label: 'Platform fee' },
  { value: 'AGE_GATE', label: 'Age gate' },
  { value: 'ENROLLMENT_GUARD', label: 'Enrollment guard' },
  { value: 'CUSTOM', label: 'Custom' },
];

const statusFilters: { value: SystemRuleStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const pageSizeOptions = [10, 20, 50];

const statusBadgeVariant: Record<string, 'success' | 'secondary' | 'outline' | 'warning'> = {
  ACTIVE: 'success',
  DRAFT: 'secondary',
  INACTIVE: 'outline',
};

const formatDateTime = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return format(parsed, 'MMM d, yyyy HH:mm');
};

const formatWindow = (rule: SystemRule) => {
  const start = formatDateTime(rule.effectiveFrom);
  const end = formatDateTime(rule.effectiveTo);

  if (!start && !end) return 'Always on';
  if (start && end) return `${start} → ${end}`;
  if (start) return `From ${start}`;
  return `Until ${end}`;
};

const formatScope = (rule: SystemRule) => {
  if (rule.scope === 'GLOBAL') return 'Global';
  return [rule.scope, rule.scopeReference].filter(Boolean).join(' · ') || 'Scope not set';
};

export function SystemConfigContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replaceBreadcrumbs } = useBreadcrumb();

  const [category, setCategory] = useState<SystemRuleCategory | 'all'>('all');
  const [status, setStatus] = useState<SystemRuleStatus | 'all'>('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [previewRule, setPreviewRule] = useState<SystemRule | null>(null);

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard' },
      { id: 'system-rules', title: 'System rules', url: '/dashboard/system-config', isLast: true },
    ]);
  }, [replaceBreadcrumbs]);

  const { data, isLoading, refetch } = useSystemRules({
    category,
    status,
    page,
    size: pageSize,
  });

  const rules = data?.items ?? [];

  const activeFilters = [
    category !== 'all' ? { label: `Category: ${category}`, onClear: () => setCategory('all') } : null,
    status !== 'all' ? { label: `Status: ${status}`, onClear: () => setStatus('all') } : null,
  ].filter(Boolean) as { label: string; onClear: () => void }[];

  useEffect(() => {
    const ruleParam = searchParams?.get('rule');
    if (ruleParam === 'new') {
      setDrawerMode('create');
      setSelectedRuleId(null);
      setDrawerOpen(true);
    } else if (ruleParam) {
      setDrawerMode('edit');
      setSelectedRuleId(ruleParam);
      setDrawerOpen(true);
    }
  }, [searchParams]);

  const updateRuleParam = (value?: string | null) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (value) params.set('rule', value);
    else params.delete('rule');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const openCreate = () => {
    setDrawerMode('create');
    setSelectedRuleId(null);
    setDrawerOpen(true);
    updateRuleParam('new');
  };

  const openEdit = (rule: SystemRule) => {
    if (!rule.uuid) return;
    setDrawerMode('edit');
    setSelectedRuleId(rule.uuid);
    setDrawerOpen(true);
    updateRuleParam(rule.uuid);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedRuleId(null);
    updateRuleParam(null);
  };

  const handleSaved = () => {
    closeDrawer();
    refetch();
  };

  const handleViewDetails = (rule: SystemRule) => {
    setPreviewRule(rule);
  };

  const resetFilters = () => {
    setCategory('all');
    setStatus('all');
    setPage(0);
  };

  const lastUpdated = useMemo(() => {
    const timestamps = rules
      .map(rule => rule.updatedDate ?? rule.createdDate)
      .filter((value): value is string => Boolean(value))
      .map(value => new Date(value))
      .filter(date => Number.isFinite(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());

    const latest = timestamps[0];
    if (!latest) return null;
    const parsed = new Date(latest);
    if (Number.isNaN(parsed.getTime())) return null;
    return formatDistanceToNow(parsed, { addSuffix: true });
  }, [rules]);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>System rules</h1>
          <p className='text-muted-foreground text-sm'>
            Govern platform policies with scoped, prioritized rules. Manage lifecycle, payloads, and audit trail.
          </p>
          {lastUpdated ? (
            <p className='text-muted-foreground text-xs'>Last change {lastUpdated}</p>
          ) : null}
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' size='sm' onClick={() => refetch()} className='gap-2'>
            <RefreshCcw className='h-4 w-4' />
            Refresh
          </Button>
          <Button size='sm' className='gap-2' onClick={openCreate}>
            <Plus className='h-4 w-4' />
            New rule
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className='space-y-4'>
          <div className='flex items-center gap-2 text-sm font-semibold'>
            <SlidersHorizontal className='h-4 w-4 text-muted-foreground' />
            Rule list
          </div>
          <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-4'>
            <Select value={category} onValueChange={value => { setCategory(value as SystemRuleCategory | 'all'); setPage(0); }}>
              <SelectTrigger>
                <SelectValue placeholder='Category' />
              </SelectTrigger>
              <SelectContent>
                {categoryFilters.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={value => { setStatus(value as SystemRuleStatus | 'all'); setPage(0); }}>
              <SelectTrigger>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            {activeFilters.length === 0 ? (
              <p className='text-muted-foreground text-xs'>Listing all rules.</p>
            ) : (
              activeFilters.map(filter => (
                <Badge key={filter.label} variant='outline' className='gap-1'>
                  {filter.label}
                  <button
                    type='button'
                    onClick={filter.onClear}
                    aria-label={`Clear ${filter.label}`}
                    className='rounded-full p-0.5 hover:bg-muted'
                  >
                    <X className='h-3 w-3' />
                  </button>
                </Badge>
              ))
            )}
            <Button variant='link' size='sm' className='text-xs' onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </CardHeader>

        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between text-sm'>
            <div className='text-muted-foreground flex items-center gap-2'>
              <Filter className='h-4 w-4' />
              Showing {rules.length} of {data?.totalItems ?? rules.length} rules
            </div>
            <Select
              value={pageSize.toString()}
              onValueChange={value => {
                setPageSize(Number(value));
                setPage(0);
              }}
            >
              <SelectTrigger className='w-32'>
                <SelectValue placeholder='Rows per page' />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map(option => (
                  <SelectItem key={option} value={option.toString()}>
                    {option} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='hidden md:block'>
            <div className='overflow-x-auto rounded-xl border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Effective window</TableHead>
                    <TableHead>Last updated</TableHead>
                    <TableHead className='w-[64px] text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`loading-${index}`}>
                        {Array.from({ length: 8 }).map((__, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <Skeleton className='h-4 w-full' />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : rules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <div className='flex flex-col items-center gap-2 py-10 text-center'>
                          <Filter className='h-5 w-5 text-muted-foreground' />
                          <p className='text-sm text-muted-foreground'>No rules available yet.</p>
                          <Button variant='outline' size='sm' onClick={openCreate}>
                            Create first rule
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rules.map(rule => (
                      <TableRow key={rule.uuid} className='cursor-pointer' onClick={() => openEdit(rule)}>
                        <TableCell className='font-semibold'>{rule.key}</TableCell>
                        <TableCell>{rule.category ?? '—'}</TableCell>
                        <TableCell>{formatScope(rule)}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant[rule.status ?? ''] ?? 'outline'}>
                            {rule.status ?? '—'}
                          </Badge>
                        </TableCell>
                        <TableCell>{rule.priority ?? '—'}</TableCell>
                        <TableCell className='text-sm text-muted-foreground'>{formatWindow(rule)}</TableCell>
                        <TableCell className='text-sm'>
                          <div className='flex flex-col gap-1'>
                            <span>{rule.updatedBy ?? 'System'}</span>
                            <span className='text-muted-foreground text-xs'>
                              {rule.updatedDate
                                ? formatDistanceToNow(new Date(rule.updatedDate), { addSuffix: true })
                                : 'Never'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='text-right'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='icon' className='h-8 w-8'>
                                <MoreVertical className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem onClick={event => { event.stopPropagation(); openEdit(rule); }}>
                                <Pencil className='mr-2 h-4 w-4' />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={event => { event.stopPropagation(); handleViewDetails(rule); }}>
                                <Eye className='mr-2 h-4 w-4' />
                                View details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className='md:hidden'>
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <Card key={`mobile-skel-${index}`} className='mb-3'>
                    <CardContent className='space-y-3 p-4'>
                      <Skeleton className='h-4 w-32' />
                      <Skeleton className='h-4 w-20' />
                      <Skeleton className='h-4 w-full' />
                    </CardContent>
                  </Card>
                ))
              : rules.map(rule => (
                  <Card
                    key={rule.uuid}
                    className='mb-3 cursor-pointer'
                    onClick={() => openEdit(rule)}
                  >
                    <CardContent className='space-y-3 p-4'>
                      <div className='flex items-center justify-between gap-2'>
                        <div className='space-y-1'>
                          <p className='text-sm font-semibold'>{rule.key}</p>
                          <p className='text-muted-foreground text-xs'>{rule.category}</p>
                        </div>
                        <Badge variant={statusBadgeVariant[rule.status ?? ''] ?? 'outline'}>
                          {rule.status ?? '—'}
                        </Badge>
                      </div>
                      <div className='space-y-2 text-sm'>
                        <div className='flex items-center justify-between'>
                          <span className='text-muted-foreground text-xs'>Scope</span>
                          <span>{formatScope(rule)}</span>
                        </div>
                        <div className='flex items-center justify-between'>
                          <span className='text-muted-foreground text-xs'>Priority</span>
                          <span>{rule.priority ?? '—'}</span>
                        </div>
                        <div className='flex items-center justify-between text-xs text-muted-foreground'>
                          <span>{formatWindow(rule)}</span>
                        </div>
                      </div>
                      <div className='flex justify-end gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={event => {
                            event.stopPropagation();
                            handleViewDetails(rule);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant='secondary'
                          size='sm'
                          onClick={event => {
                            event.stopPropagation();
                            openEdit(rule);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>

          <Separator />

          <div className='flex flex-wrap items-center justify-between gap-3 text-sm'>
            <div className='text-muted-foreground'>
              Page {data ? data.page + 1 : page + 1} of {data?.totalPages ?? 1}
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={data ? !data.hasPrevious : page === 0}
                onClick={() => setPage(prev => Math.max(prev - 1, 0))}
              >
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={data ? !data.hasNext : false}
                onClick={() => setPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <RuleDrawer
        open={drawerOpen}
        mode={drawerMode}
        ruleId={selectedRuleId}
        initialRule={drawerMode === 'edit' ? rules.find(rule => rule.uuid === selectedRuleId) : null}
        onClose={closeDrawer}
        onSaved={handleSaved}
      />

      <RulePreview
        rule={previewRule}
        open={Boolean(previewRule)}
        onOpenChange={open => {
          if (!open) setPreviewRule(null);
        }}
        onEdit={openEdit}
      />
    </div>
  );
}
