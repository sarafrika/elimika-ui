'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { SystemRule, SystemRuleListResult } from '@/services/admin/system-config';
import { formatDistanceToNow } from 'date-fns';
import { CalendarClock, Filter, Pencil } from 'lucide-react';

interface SystemRulesTableProps {
  data?: SystemRuleListResult;
  isLoading: boolean;
  category: string;
  status: string;
  search: string;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSelectRule: (rule: SystemRule) => void;
  onEditRule: (rule: SystemRule) => void;
  onCreateRule: () => void;
  onPageChange: (page: number) => void;
}

const categoryOptions = [
  { label: 'All categories', value: 'all' },
  { label: 'Platform fee', value: 'PLATFORM_FEE' },
  { label: 'Age gate', value: 'AGE_GATE' },
  { label: 'Notifications', value: 'NOTIFICATIONS' },
];

const statusOptions = [
  { label: 'All status', value: 'all' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Disabled', value: 'DISABLED' },
];

const badgeVariants: Record<string, 'success' | 'secondary' | 'outline' | 'destructive'> = {
  ACTIVE: 'success',
  DRAFT: 'secondary',
  DISABLED: 'outline',
};

const formatCategory = (category?: string) => {
  const match = categoryOptions.find(option => option.value === category);
  return match?.label ?? category ?? '—';
};

const formatScope = (rule: SystemRule) => {
  if (!rule.scope_type && !rule.scope_reference) {
    return 'Platform default';
  }

  return [rule.scope_type, rule.scope_reference].filter(Boolean).join(' · ');
};

const formatWindow = (rule: SystemRule) => {
  if (!rule.effective_from && !rule.effective_to) {
    return 'Always on';
  }

  if (rule.effective_from && rule.effective_to) {
    return `${rule.effective_from} → ${rule.effective_to}`;
  }

  if (rule.effective_from) {
    return `From ${rule.effective_from}`;
  }

  return `Until ${rule.effective_to}`;
};

export function SystemRulesTable({
  data,
  isLoading,
  category,
  status,
  search,
  onCategoryChange,
  onStatusChange,
  onSearchChange,
  onSelectRule,
  onEditRule,
  onCreateRule,
  onPageChange,
}: SystemRulesTableProps) {
  const hasData = (data?.items.length ?? 0) > 0;

  const renderRows = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={`loading-${index}`}>
          {Array.from({ length: 7 }).map((__, cellIndex) => (
            <TableCell key={cellIndex}>
              <Skeleton className='h-4 w-full' />
            </TableCell>
          ))}
        </TableRow>
      ));
    }

    if (!hasData) {
      return (
        <TableRow>
          <TableCell colSpan={7}>
            <div className='text-muted-foreground flex flex-col items-center gap-2 py-10 text-sm'>
              <Filter className='h-5 w-5' />
              No rules match the current filters.
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return data?.items.map(rule => (
      <TableRow
        key={rule.uuid}
        className='cursor-pointer'
        onClick={() => onSelectRule(rule)}
      >
        <TableCell className='font-medium'>{rule.key}</TableCell>
        <TableCell>{formatCategory(rule.category)}</TableCell>
        <TableCell>{formatScope(rule)}</TableCell>
        <TableCell>{rule.priority ?? '—'}</TableCell>
        <TableCell>
          <Badge variant={badgeVariants[rule.status] ?? 'outline'}>{rule.status}</Badge>
        </TableCell>
        <TableCell className='text-sm'>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <CalendarClock className='h-4 w-4' />
            {formatWindow(rule)}
          </div>
        </TableCell>
        <TableCell className='text-sm'>
          <div className='flex flex-col gap-0.5'>
            <span>{rule.updated_by ?? '—'}</span>
            <span className='text-muted-foreground text-xs'>
              {rule.updated_at
                ? formatDistanceToNow(new Date(rule.updated_at), { addSuffix: true })
                : 'Never'}
            </span>
          </div>
        </TableCell>
        <TableCell className='text-right'>
          <Button
            variant='ghost'
            size='sm'
            className='gap-1'
            onClick={event => {
              event.stopPropagation();
              onEditRule(rule);
            }}
          >
            <Pencil className='h-4 w-4' />
            Edit
          </Button>
        </TableCell>
      </TableRow>
    ));
  };

  const page = data?.page ?? 0;
  const totalPages = data?.totalPages ?? 0;

  return (
    <Card>
      <CardHeader className='gap-4'>
        <div className='flex flex-col gap-1'>
          <CardTitle className='text-base font-semibold'>System rules</CardTitle>
          <CardDescription>Filters, overrides, and feature gate controls.</CardDescription>
        </div>
        <div className='flex flex-col gap-3 md:flex-row md:items-center'>
          <div className='flex flex-1 flex-wrap gap-2'>
            <Select value={category} onValueChange={value => onCategoryChange(value)}>
              <SelectTrigger className='w-full min-w-[160px] md:w-auto'>
                <SelectValue placeholder='Category' />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={value => onStatusChange(value)}>
              <SelectTrigger className='w-full min-w-[160px] md:w-auto'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder='Search by key…'
              value={search}
              onChange={event => onSearchChange(event.target.value)}
              className='flex-1'
            />
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => onSearchChange('')}>
              Reset
            </Button>
            <Button onClick={onCreateRule}>Create Rule</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Effective window</TableHead>
                <TableHead>Updated by</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>{renderRows()}</TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className='mt-4 flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>
              Page {page + 1} of {totalPages}
            </span>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={page === 0}
                onClick={() => onPageChange(Math.max(page - 1, 0))}
              >
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={page + 1 >= totalPages}
                onClick={() => onPageChange(Math.min(page + 1, totalPages - 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
