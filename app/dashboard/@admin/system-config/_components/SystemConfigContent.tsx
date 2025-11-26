'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSystemRules } from '@/services/admin/system-config';
import type { SystemRule } from '@/services/admin/system-config';
import { SystemRulesSummary } from './SystemRulesSummary';
import { SystemRulesTable } from './SystemRulesTable';
import { RuleDetailSheet } from './RuleDetailSheet';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

export function SystemConfigContent() {
  const router = useRouter();
  const [category, setCategory] = useState<'all' | string>('all');
  const [status, setStatus] = useState<'all' | string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedRule, setSelectedRule] = useState<SystemRule | null>(null);

  const { data, isLoading, refetch } = useSystemRules({
    category,
    status,
    search,
    page,
    size: 10,
  });

  const navigateToCreate = () => router.push('/dashboard/system-config/rules/new');
  const navigateToEdit = (rule: SystemRule) => router.push(`/dashboard/system-config/rules/${rule.uuid}`);

  const handleSelectRule = (rule: SystemRule) => {
    setSelectedRule(rule);
  };

  const resetFilters = () => {
    setCategory('all');
    setStatus('all');
    setSearch('');
    setPage(0);
  };

  const summaryRules = useMemo(() => (data?.items ?? []).slice(0, 100), [data?.items]);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>System configuration</h1>
          <p className='text-muted-foreground text-sm'>
            Feature flags, enrollment safety, and fee rules powered by the platform API.
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' className='gap-2' onClick={() => refetch()}>
            <RefreshCcw className='h-4 w-4' />
            Refresh
          </Button>
          <Button size='sm' onClick={navigateToCreate}>
            Create Rule
          </Button>
        </div>
      </div>

      <SystemRulesSummary rules={summaryRules} isLoading={isLoading} />

      <SystemRulesTable
        data={data}
        isLoading={isLoading}
        category={category}
        status={status}
        search={search}
        onCategoryChange={value => {
          setCategory(value);
          setPage(0);
        }}
        onStatusChange={value => {
          setStatus(value);
          setPage(0);
        }}
        onSearchChange={value => {
          setSearch(value);
          setPage(0);
        }}
        onSelectRule={handleSelectRule}
        onEditRule={navigateToEdit}
        onCreateRule={navigateToCreate}
        onPageChange={next => setPage(next)}
      />

      <RuleDetailSheet
        rule={selectedRule}
        open={Boolean(selectedRule)}
        onOpenChange={open => {
          if (!open) {
            setSelectedRule(null);
          }
        }}
        onEdit={navigateToEdit}
      />

      <div className='flex justify-end'>
        <Button variant='ghost' size='sm' onClick={resetFilters}>
          Reset filters
        </Button>
      </div>
    </div>
  );
}
