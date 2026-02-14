'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import {
  useSystemRules,
  type SystemRule,
  type SystemRuleCategory,
  type SystemRuleStatus,
} from '@/services/admin/system-config';
import { getUserByUuidOptions } from '@/services/client/@tanstack/react-query.gen';
import { useQueries } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Eye,
  Filter,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { RuleDrawer } from './RuleDrawer';
import { RulePreview } from './RulePreview';

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
    page,
    size: pageSize,
  });

  // Client-side filtering since API only supports pagination
  const rules = useMemo(() => {
    const allRules = data?.items ?? [];
    return allRules.filter(rule => {
      if (category !== 'all' && rule.category !== category) return false;
      if (status !== 'all' && rule.status !== status) return false;
      return true;
    });
  }, [data?.items, category, status]);

  const activeFilters = [
    category !== 'all'
      ? { label: `Category: ${category}`, onClear: () => setCategory('all') }
      : null,
    status !== 'all' ? { label: `Status: ${status}`, onClear: () => setStatus('all') } : null,
  ].filter(Boolean) as { label: string; onClear: () => void }[];

  const auditUserIds = useMemo(() => {
    const ids = new Set<string>();
    rules.forEach(rule => {
      if (typeof rule.updatedBy === 'string') ids.add(rule.updatedBy);
      if (typeof rule.createdBy === 'string') ids.add(rule.createdBy);
    });
    return Array.from(ids).filter(id => id && id !== 'System');
  }, [rules]);

  const userQueries = useQueries({
    queries: auditUserIds.map(id => ({
      ...getUserByUuidOptions({ path: { uuid: id } }),
      queryKey: ['user-by-uuid', id],
      enabled: Boolean(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const userNameMap = useMemo(() => {
    const map = new Map<string, string>();
    userQueries.forEach((query, index) => {
      const data: any = (query.data as any)?.data ?? (query.data as any);
      const id = auditUserIds[index];
      if (!id || !data) return;
      const name =
        data.full_name ||
        data.displayName ||
        [data.first_name, data.last_name].filter(Boolean).join(' ') ||
        data.email ||
        id;
      map.set(id, name);
    });
    return map;
  }, [auditUserIds, userQueries]);

  const resolveUserName = (id?: string | null) => {
    if (!id || id === 'System') return 'System';
    return userNameMap.get(id) ?? id;
  };

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
    <div className='space-y-8'>
      {/* Page Header */}
      <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div className='space-y-2'>
          <div className='flex items-center gap-3'>
            <h1 className='text-foreground text-2xl font-semibold tracking-tight lg:text-3xl'>
              System Rules
            </h1>
            <Badge variant='outline' className='rounded-full text-xs'>
              Configuration
            </Badge>
          </div>
          <p className='text-muted-foreground max-w-2xl text-sm leading-relaxed lg:text-base'>
            Govern platform policies with scoped, prioritized rules. Manage lifecycle, payloads, and
            audit trail.
          </p>

        </div>
        <div className='flex flex-col gap-1'>
          <div className='flex flex-wrap gap-2'>
            <Button variant='outline' size='default' onClick={() => refetch()} className='gap-2'>
              <RefreshCcw className='h-4 w-4' />
              Refresh
            </Button>
            <Button size='default' className='gap-2 shadow-sm' onClick={openCreate}>
              <Plus className='h-4 w-4' />
              New rule
            </Button>
          </div>
          {lastUpdated ? (
            <p className='text-muted-foreground text-end text-xs'>Last change {lastUpdated}</p>
          ) : null}
        </div>
      </div>

      <Card className='shadow-md pb-6 pt-0'>
        <CardHeader className='bg-muted/30 space-y-2 border-b py-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <SlidersHorizontal className='text-primary h-5 w-5' />
              <h2 className='text-foreground text-lg font-semibold'>Filters & List</h2>
            </div>
            <div className='grid items-center gap-3 md:grid-cols-2 lg:grid-cols-3'>
              <Select
                value={category}
                onValueChange={value => {
                  setCategory(value as SystemRuleCategory | 'all');
                  setPage(0);
                }}
              >
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

              <Select
                value={status}
                onValueChange={value => {
                  setStatus(value as SystemRuleStatus | 'all');
                  setPage(0);
                }}
              >
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

              <div className='text-muted-foreground text-xs'>
                {rules.length} {rules.length === 1 ? 'rule' : 'rules'} shown
              </div>
            </div>
          </div>


          <div className='flex flex-wrap items-center gap-2'>
            {activeFilters.length === 0 ? (
              <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                <Filter className='h-3.5 w-3.5' />
                <span>No active filters</span>
              </div>
            ) : (
              <>
                <span className='text-muted-foreground text-xs font-medium'>Active filters:</span>
                {activeFilters.map(filter => (
                  <Badge key={filter.label} variant='secondary' className='gap-1.5 rounded-full'>
                    {filter.label}
                    <button
                      type='button'
                      onClick={filter.onClear}
                      aria-label={`Clear ${filter.label}`}
                      className='hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors'
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </Badge>
                ))}
                <Button variant='ghost' size='sm' className='h-7 text-xs' onClick={resetFilters}>
                  Reset all
                </Button>
              </>
            )}
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
            <div className='overflow-hidden rounded-xl border shadow-sm'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-muted/50'>
                    <TableHead className='font-semibold'>Key</TableHead>
                    <TableHead className='font-semibold'>Category</TableHead>
                    <TableHead className='font-semibold'>Scope</TableHead>
                    <TableHead className='font-semibold'>Status</TableHead>
                    <TableHead className='font-semibold'>Priority</TableHead>
                    <TableHead className='font-semibold'>Effective window</TableHead>
                    <TableHead className='font-semibold'>Last updated</TableHead>
                    <TableHead className='w-[64px] text-right font-semibold'>Actions</TableHead>
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
                        <div className='flex flex-col items-center gap-4 py-16 text-center'>
                          <div className='bg-muted/50 rounded-full p-4'>
                            <Filter className='text-muted-foreground h-8 w-8' />
                          </div>
                          <div className='space-y-1'>
                            <p className='text-foreground text-base font-medium'>No rules found</p>
                            <p className='text-muted-foreground text-sm'>
                              {activeFilters.length > 0
                                ? 'Try adjusting your filters or create a new rule.'
                                : 'Get started by creating your first system rule.'}
                            </p>
                          </div>
                          <Button size='default' className='mt-2' onClick={openCreate}>
                            <Plus className='mr-2 h-4 w-4' />
                            Create first rule
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rules.map(rule => (
                      <TableRow
                        key={rule.uuid}
                        className='hover:bg-muted/30 cursor-pointer transition-colors'
                        onClick={() => openEdit(rule)}
                      >
                        <TableCell className='text-foreground font-semibold'>{rule.key}</TableCell>
                        <TableCell>
                          <Badge variant='outline' className='rounded-full'>
                            {rule.category ?? '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-sm'>{formatScope(rule)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={statusBadgeVariant[rule.status ?? ''] ?? 'outline'}
                            className='rounded-full'
                          >
                            {rule.status ?? '—'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className='bg-muted inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium'>
                            {rule.priority ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell className='text-muted-foreground text-sm'>
                          {formatWindow(rule)}
                        </TableCell>
                        <TableCell className='text-sm'>
                          <div className='flex flex-col gap-1'>
                            <span>{resolveUserName(rule.updatedBy)}</span>
                            <span className='text-muted-foreground text-xs'>
                              {rule.updatedDate
                                ? formatDistanceToNow(new Date(rule.updatedDate), {
                                  addSuffix: true,
                                })
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
                              <DropdownMenuItem
                                onClick={event => {
                                  event.stopPropagation();
                                  openEdit(rule);
                                }}
                              >
                                <Pencil className='mr-2 h-4 w-4' />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={event => {
                                  event.stopPropagation();
                                  handleViewDetails(rule);
                                }}
                              >
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
                <Card key={`mobile-skel-${index}`} className='mb-3 shadow-sm'>
                  <CardContent className='space-y-3 p-5'>
                    <Skeleton className='h-5 w-36' />
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='h-4 w-full' />
                  </CardContent>
                </Card>
              ))
              : rules.map(rule => (
                <Card
                  key={rule.uuid}
                  className='mb-3 cursor-pointer shadow-sm transition-all hover:shadow-md'
                  onClick={() => openEdit(rule)}
                >
                  <CardContent className='space-y-4 p-5'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='space-y-1.5'>
                        <p className='text-foreground text-base font-semibold'>{rule.key}</p>
                        <Badge variant='outline' className='rounded-full text-xs'>
                          {rule.category}
                        </Badge>
                      </div>
                      <Badge
                        variant={statusBadgeVariant[rule.status ?? ''] ?? 'outline'}
                        className='rounded-full'
                      >
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
                      <div className='text-muted-foreground flex items-center justify-between text-xs'>
                        <span>{formatWindow(rule)}</span>
                      </div>
                      <div className='text-muted-foreground flex items-center justify-between text-xs'>
                        <span>Updated by</span>
                        <span className='text-foreground'>{resolveUserName(rule.updatedBy)}</span>
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

          <Separator className='mt-6' />

          <div className='flex flex-wrap items-center justify-between gap-4 pt-2 text-sm'>
            <div className='text-muted-foreground flex items-center gap-2'>
              <span className='font-medium'>Page {data ? data.page + 1 : page + 1}</span>
              <span>of</span>
              <span className='font-medium'>{data?.totalPages ?? 1}</span>
              <span className='hidden sm:inline'>·</span>
              <span className='hidden sm:inline'>{data?.totalItems ?? 0} total</span>
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='default'
                disabled={data ? !data.hasPrevious : page === 0}
                onClick={() => setPage(prev => Math.max(prev - 1, 0))}
              >
                Previous
              </Button>
              <Button
                variant='outline'
                size='default'
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
        initialRule={
          drawerMode === 'edit' ? rules.find(rule => rule.uuid === selectedRuleId) : null
        }
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
