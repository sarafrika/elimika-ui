'use client';

import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { DataTable, SectionCard, StatusBadge, surfaceTheme } from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/date';
import type { SchemaEnum, SchemaEnum2, ScopeEnum, ValueTypeEnum } from '@/services/client';
import { ConfirmDialog } from '../components/confirm-dialog';
import { FilterBar } from '../components/filter-bar';
import { FormSheet } from '../components/form-sheet';
import { SectionBoundary } from '../components/section-boundary';
import {
  pickWinningRule,
  readFeePayload,
  type RuleFormValues,
  useSaveRule,
  useSystemRule,
  useSystemRules,
} from '../hooks/use-system-rules';
import { numberParam, stringParam } from '../state/search-state';
import { useSearchState } from '../state/use-search-state';
import { SecurityBanner } from './categories-page';

const searchParam = stringParam();
const categoryParam = stringParam('any');
const statusParam = stringParam('any');
const ruleParam = stringParam();
const pageParam = numberParam(0);

const CATEGORIES: SchemaEnum[] = ['PLATFORM_FEE', 'AGE_GATE', 'ENROLLMENT_GUARD', 'CUSTOM'];
const SCOPES: ScopeEnum[] = ['GLOBAL', 'TENANT', 'REGION', 'DEMOGRAPHIC', 'SEGMENT'];
const STATUSES: SchemaEnum2[] = ['DRAFT', 'ACTIVE', 'INACTIVE'];
const VALUE_TYPES: ValueTypeEnum[] = ['JSON', 'DECIMAL', 'INTEGER', 'BOOLEAN', 'STRING'];

const blankRule: RuleFormValues = {
  category: 'PLATFORM_FEE',
  key: '',
  scope: 'GLOBAL',
  scopeReference: '',
  priority: 0,
  status: 'DRAFT',
  valueType: 'JSON',
  valuePayload: '{\n  "mode": "PERCENTAGE",\n  "amount": 10\n}',
  conditions: '',
  effectiveFrom: '',
  effectiveTo: '',
};

/** How a rule is written: a second rule that starts later, or this one replaced outright. */
type SaveMode = 'schedule' | 'replace';

export function RulesPage() {
  const [q] = useSearchState('q', searchParam);
  const [category] = useSearchState('category', categoryParam);
  const [status] = useSearchState('status', statusParam);
  const [page, setPage] = useSearchState('page', pageParam);
  const [openRule, setOpenRule] = useSearchState('rule', ruleParam);

  const { rules, loadedCount, totalRows, pageCount, query } = useSystemRules({
    q,
    category,
    status,
    page,
  });
  const { rule, query: ruleQuery } = useSystemRule(openRule || undefined);
  const saveRule = useSaveRule();

  const [form, setForm] = useState<RuleFormValues>(blankRule);
  const [saveMode, setSaveMode] = useState<SaveMode>('schedule');
  const [confirmOpen, setConfirmOpen] = useState(false);

  // The editor mirrors whichever rule the URL points at; "new" starts from a blank fee rule.
  useEffect(() => {
    if (!openRule) return;
    if (openRule === 'new') {
      setForm(blankRule);
      setSaveMode('replace');
      return;
    }
    if (!rule) return;
    setForm({
      category: rule.category ?? 'CUSTOM',
      key: rule.key ?? '',
      scope: rule.scope ?? 'GLOBAL',
      scopeReference: rule.scopeReference ?? '',
      priority: rule.priority ?? 0,
      status: rule.status ?? 'DRAFT',
      valueType: rule.valueType ?? 'JSON',
      valuePayload: JSON.stringify(rule.valuePayload ?? {}, null, 2),
      conditions: rule.conditions ? JSON.stringify(rule.conditions, null, 2) : '',
      effectiveFrom: toLocalInput(rule.effectiveFrom),
      effectiveTo: toLocalInput(rule.effectiveTo),
    });
    setSaveMode('schedule');
  }, [openRule, rule]);

  const payloadError = useMemo(() => {
    try {
      JSON.parse(form.valuePayload);
      return undefined;
    } catch {
      return 'This is not valid JSON. The API does not check it, so it would be stored broken.';
    }
  }, [form.valuePayload]);

  const conditionsError = useMemo(() => {
    if (!form.conditions?.trim()) return undefined;
    try {
      JSON.parse(form.conditions);
      return undefined;
    } catch {
      return 'This is not valid JSON.';
    }
  }, [form.conditions]);

  const windowError =
    form.effectiveFrom && form.effectiveTo && new Date(form.effectiveFrom) >= new Date(form.effectiveTo)
      ? 'The end has to come after the start.'
      : undefined;

  const scopeReferenceError =
    form.scope !== 'GLOBAL' && !form.scopeReference?.trim()
      ? 'A scope other than global needs the reference it applies to.'
      : undefined;

  const keyError = !form.key.trim()
    ? 'A rule needs a key.'
    : form.key.trim().length > 128
      ? 'Keep the key to 128 characters.'
      : undefined;

  const blocked = Boolean(
    payloadError || conditionsError || windowError || scopeReferenceError || keyError
  );

  const winning = useMemo(
    () => (form.key ? pickWinningRule(rules, form.key.trim()) : null),
    [rules, form.key]
  );

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Platform'
          title='System rules'
          description='Platform fees, age gates and enrolment guards, and when each one applies.'
          actions={
            <Button className='rounded-md' onClick={() => setOpenRule('new')}>
              <Plus className='mr-2 size-4' />
              New rule
            </Button>
          }
        />

        <SecurityBanner />

        <FilterBar
          values={{ q, category, status }}
          searchPlaceholder='Filter the loaded page by key…'
          filters={[
            {
              key: 'category',
              label: 'Category',
              options: CATEGORIES.map(value => ({ value, label: value.replace(/_/g, ' ') })),
            },
            {
              key: 'status',
              label: 'Status',
              options: STATUSES.map(value => ({ value, label: value })),
            },
          ]}
        />

        <p className='text-muted-foreground text-xs'>
          The key search filters the {loadedCount} rule(s) already loaded — the endpoint has no
          search or scope filter of its own.
        </p>

        <SectionBoundary
          label='the system rules'
          loading={query.isLoading && rules.length === 0}
          error={query.error}
          onRetry={query.refetch}
          empty={!query.isLoading && rules.length === 0}
          emptyTitle={q ? 'Nothing matches that key' : 'No rules yet'}
          emptyDescription={
            q ? 'Clear the filter to see the whole page.' : 'Add the first platform rule.'
          }
        >
          <DataTable
            hideToolbar
            data={rules}
            isLoading={query.isLoading}
            getRowId={row => row.uuid ?? `${row.category}-${row.key}`}
            onRowClick={row => setOpenRule(row.uuid ?? '')}
            serverPagination={{ page, pageCount, totalRows, onPageChange: setPage }}
            columns={[
              {
                id: 'rule',
                header: 'Rule',
                cell: ({ row }) => (
                  <div className='min-w-0'>
                    <p className='text-foreground truncate font-mono text-xs'>{row.original.key}</p>
                    <p className='text-muted-foreground text-xs'>
                      {(row.original.category ?? '').replace(/_/g, ' ')}
                    </p>
                  </div>
                ),
              },
              {
                id: 'scope',
                header: 'Scope',
                cell: ({ row }) => (
                  <div className='text-sm'>
                    {row.original.scope ?? 'GLOBAL'}
                    {row.original.scopeReference ? (
                      <span className='text-muted-foreground block font-mono text-xs'>
                        {row.original.scopeReference}
                      </span>
                    ) : null}
                  </div>
                ),
              },
              {
                id: 'status',
                header: 'Status',
                cell: ({ row }) => <StatusBadge status={row.original.status} />,
              },
              {
                id: 'priority',
                header: 'Priority',
                cell: ({ row }) => (
                  <span className='font-mono text-xs'>{row.original.priority ?? 0}</span>
                ),
              },
              {
                id: 'window',
                header: 'Effective',
                cell: ({ row }) => (
                  <span className='text-muted-foreground text-xs'>
                    {formatDate(row.original.effectiveFrom) || 'now'} →{' '}
                    {formatDate(row.original.effectiveTo) || 'no end'}
                  </span>
                ),
              },
              {
                id: 'updated',
                header: 'Updated by',
                cell: ({ row }) => (
                  <div className='text-xs'>
                    <p className='text-foreground truncate'>{row.original.updatedBy ?? '—'}</p>
                    <p className='text-muted-foreground font-mono'>
                      {formatDate(row.original.updatedDate) || '—'}
                    </p>
                  </div>
                ),
              },
            ]}
          />
        </SectionBoundary>

        <SectionCard title='How a rule is chosen' description='The order the platform applies'>
          <ol className='text-muted-foreground list-decimal space-y-1 pl-5 text-sm'>
            <li>Only rules that are ACTIVE and inside their effective window count.</li>
            <li>Highest priority wins.</li>
            <li>Then the most specific scope: tenant, segment, demographic, region, global.</li>
            <li>Then the latest start date.</li>
          </ol>
          <p className='text-muted-foreground mt-3 text-xs'>
            Fees are looked up without a key, tenant or region today, so only GLOBAL fee rules are
            ever consulted — and a payload that fails to parse yields no fee at all rather than
            falling back to the next rule. There is no delete: set a rule INACTIVE instead.
          </p>
        </SectionCard>
      </div>

      <FormSheet
        open={Boolean(openRule)}
        onOpenChange={open => {
          if (!open) setOpenRule('');
        }}
        width='wide'
        title={openRule === 'new' ? 'New system rule' : `Edit ${form.key || 'rule'}`}
        description={
          ruleQuery.isLoading ? 'Loading the rule…' : 'The request body for rules is camelCase.'
        }
        isDirty={form.key.trim().length > 0}
        isPending={saveRule.isPending}
        submitLabel={saveMode === 'schedule' ? 'Schedule rule' : 'Save rule'}
        onSubmit={() => {
          if (blocked) return;
          setConfirmOpen(true);
        }}
      >
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-1.5'>
            <Label className='text-sm font-semibold'>Category</Label>
            <Select
              value={form.category}
              onValueChange={value =>
                setForm(current => ({ ...current, category: value as SchemaEnum }))
              }
            >
              <SelectTrigger className='rounded-md'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(value => (
                  <SelectItem key={value} value={value}>
                    {value.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='rule-key' className='text-sm font-semibold'>
              Key <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='rule-key'
              value={form.key}
              maxLength={128}
              className='rounded-md font-mono'
              onChange={event => setForm(current => ({ ...current, key: event.target.value }))}
            />
            {keyError ? <p className='text-destructive text-xs'>{keyError}</p> : null}
          </div>

          <div className='space-y-1.5'>
            <Label className='text-sm font-semibold'>Scope</Label>
            <Select
              value={form.scope}
              onValueChange={value => setForm(current => ({ ...current, scope: value as ScopeEnum }))}
            >
              <SelectTrigger className='rounded-md'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCOPES.map(value => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='rule-scope-ref' className='text-sm font-semibold'>
              Scope reference
            </Label>
            <Input
              id='rule-scope-ref'
              value={form.scopeReference ?? ''}
              maxLength={128}
              disabled={form.scope === 'GLOBAL'}
              className='rounded-md font-mono'
              onChange={event =>
                setForm(current => ({ ...current, scopeReference: event.target.value }))
              }
            />
            {scopeReferenceError ? (
              <p className='text-destructive text-xs'>{scopeReferenceError}</p>
            ) : (
              <p className='text-muted-foreground text-xs'>
                {form.scope === 'GLOBAL' ? 'Not needed for a global rule.' : 'Tenant, region or segment id.'}
              </p>
            )}
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='rule-priority' className='text-sm font-semibold'>
              Priority
            </Label>
            <Input
              id='rule-priority'
              type='number'
              value={form.priority}
              className='rounded-md'
              onChange={event =>
                setForm(current => ({ ...current, priority: Number(event.target.value) || 0 }))
              }
            />
            <p className='text-muted-foreground text-xs'>Higher numbers win.</p>
          </div>

          <div className='space-y-1.5'>
            <Label className='text-sm font-semibold'>Status</Label>
            <Select
              value={form.status}
              onValueChange={value =>
                setForm(current => ({ ...current, status: value as SchemaEnum2 }))
              }
            >
              <SelectTrigger className='rounded-md'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map(value => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='rule-from' className='text-sm font-semibold'>
              Effective from
            </Label>
            <Input
              id='rule-from'
              type='datetime-local'
              value={form.effectiveFrom ?? ''}
              className='rounded-md'
              onChange={event =>
                setForm(current => ({ ...current, effectiveFrom: event.target.value }))
              }
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='rule-to' className='text-sm font-semibold'>
              Effective to
            </Label>
            <Input
              id='rule-to'
              type='datetime-local'
              value={form.effectiveTo ?? ''}
              className='rounded-md'
              onChange={event =>
                setForm(current => ({ ...current, effectiveTo: event.target.value }))
              }
            />
            {windowError ? <p className='text-destructive text-xs'>{windowError}</p> : null}
          </div>
        </div>

        {form.category === 'PLATFORM_FEE' ? (
          <FeeEditor
            payload={form.valuePayload}
            onChange={value => setForm(current => ({ ...current, valuePayload: value }))}
          />
        ) : null}

        <div className='space-y-1.5'>
          <Label htmlFor='rule-payload' className='text-sm font-semibold'>
            Value payload <span className='text-destructive'>*</span>
          </Label>
          <div className='flex items-center gap-2'>
            <Select
              value={form.valueType}
              onValueChange={value =>
                setForm(current => ({ ...current, valueType: value as ValueTypeEnum }))
              }
            >
              <SelectTrigger className='h-8 w-[130px] rounded-md'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VALUE_TYPES.map(value => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              disabled={Boolean(payloadError)}
              onClick={() =>
                setForm(current => ({
                  ...current,
                  valuePayload: JSON.stringify(JSON.parse(current.valuePayload), null, 2),
                }))
              }
            >
              Tidy JSON
            </Button>
          </div>
          <Textarea
            id='rule-payload'
            rows={8}
            value={form.valuePayload}
            className='rounded-md font-mono text-xs'
            onChange={event =>
              setForm(current => ({ ...current, valuePayload: event.target.value }))
            }
          />
          {payloadError ? <p className='text-destructive text-xs'>{payloadError}</p> : null}
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='rule-conditions' className='text-sm font-semibold'>
            Conditions
          </Label>
          <Textarea
            id='rule-conditions'
            rows={4}
            value={form.conditions ?? ''}
            placeholder='{}'
            className='rounded-md font-mono text-xs'
            onChange={event => setForm(current => ({ ...current, conditions: event.target.value }))}
          />
          {conditionsError ? (
            <p className='text-destructive text-xs'>{conditionsError}</p>
          ) : (
            <p className='text-muted-foreground text-xs'>
              Stored, but never evaluated — the platform ignores conditions today.
            </p>
          )}
        </div>

        <ImpactPreview form={form} winningKey={winning?.uuid} winningLabel={describeRule(winning)} />

        {openRule !== 'new' ? (
          <div className='space-y-2'>
            <Label className='text-sm font-semibold'>How to save this</Label>
            <RadioGroup value={saveMode} onValueChange={value => setSaveMode(value as SaveMode)}>
              <label className='flex items-start gap-2 text-sm'>
                <RadioGroupItem value='schedule' className='mt-0.5' />
                <span>
                  <span className='font-medium'>Schedule a new rule</span>
                  <span className='text-muted-foreground block text-xs'>
                    Keeps the current value readable after the change, because rules have no history.
                  </span>
                </span>
              </label>
              <label className='flex items-start gap-2 text-sm'>
                <RadioGroupItem value='replace' className='mt-0.5' />
                <span>
                  <span className='font-medium'>Replace this rule</span>
                  <span className='text-muted-foreground block text-xs'>
                    Overwrites it. The previous value is gone.
                  </span>
                </span>
              </label>
            </RadioGroup>
          </div>
        ) : null}
      </FormSheet>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        action={saveMode === 'schedule' && openRule !== 'new' ? 'scheduleRule' : 'saveRule'}
        subject={{
          name: form.key.trim(),
          detail: form.effectiveFrom ? formatDate(form.effectiveFrom) : 'now',
        }}
        isPending={saveRule.isPending}
        onConfirm={() =>
          saveRule.mutate(
            {
              uuid: saveMode === 'replace' && openRule !== 'new' ? openRule : undefined,
              values: form,
            },
            {
              onSuccess: () => {
                setConfirmOpen(false);
                setOpenRule('');
              },
            }
          )
        }
      />
    </div>
  );
}

/** Guided fields for the platform-fee shape, kept in step with the raw JSON below it. */
function FeeEditor({ payload, onChange }: { payload: string; onChange: (value: string) => void }) {
  const fee = useMemo(() => {
    try {
      return readFeePayload(JSON.parse(payload));
    } catch {
      return null;
    }
  }, [payload]);

  if (!fee) {
    return (
      <p className='text-muted-foreground text-xs'>
        The payload does not match the fee shape ({'{ mode, amount, currency?, waiver?, discount? }'}
        ), so the guided fields are hidden. Edit the JSON directly.
      </p>
    );
  }

  const update = (next: Partial<typeof fee>) => {
    const merged = { ...JSON.parse(payload), ...next };
    onChange(JSON.stringify(merged, null, 2));
  };

  return (
    <div className='border-border/70 grid gap-4 rounded-md border p-4 sm:grid-cols-3'>
      <div className='space-y-1.5'>
        <Label className='text-sm font-semibold'>Fee mode</Label>
        <Select value={fee.mode} onValueChange={value => update({ mode: value as 'PERCENTAGE' | 'FLAT' })}>
          <SelectTrigger className='rounded-md'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='PERCENTAGE'>Percentage</SelectItem>
            <SelectItem value='FLAT'>Flat amount</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className='space-y-1.5'>
        <Label htmlFor='fee-amount' className='text-sm font-semibold'>
          {fee.mode === 'PERCENTAGE' ? 'Percent' : 'Amount'}
        </Label>
        <Input
          id='fee-amount'
          type='number'
          step='0.01'
          value={fee.amount}
          className='rounded-md'
          onChange={event => update({ amount: Number(event.target.value) || 0 })}
        />
      </div>
      <div className='space-y-1.5'>
        <Label htmlFor='fee-currency' className='text-sm font-semibold'>
          Currency
        </Label>
        <Input
          id='fee-currency'
          value={fee.currency ?? ''}
          placeholder='Any'
          className='rounded-md font-mono'
          onChange={event => update({ currency: event.target.value || undefined })}
        />
      </div>
    </div>
  );
}

function ImpactPreview({
  form,
  winningKey,
  winningLabel,
}: {
  form: RuleFormValues;
  winningKey?: string;
  winningLabel: string;
}) {
  const fee = useMemo(() => {
    try {
      return readFeePayload(JSON.parse(form.valuePayload));
    } catch {
      return null;
    }
  }, [form.valuePayload]);

  const sample = 4500;
  const applied = fee
    ? fee.mode === 'PERCENTAGE'
      ? (sample * fee.amount) / 100
      : fee.amount
    : null;

  return (
    <div className='bg-muted/40 space-y-2 rounded-md p-4'>
      <p className='text-foreground text-sm font-semibold'>What this would do</p>
      {form.status !== 'ACTIVE' ? (
        <p className='text-muted-foreground text-sm'>
          Nothing yet — only ACTIVE rules inside their window are ever applied.
        </p>
      ) : applied !== null ? (
        <p className='text-muted-foreground text-sm'>
          On a KES {sample.toLocaleString()} order the platform fee would be{' '}
          <span className='text-foreground font-medium'>KES {applied.toLocaleString()}</span>
          {form.effectiveFrom ? ` from ${formatDate(form.effectiveFrom)}` : ' immediately'}.
        </p>
      ) : (
        <p className='text-muted-foreground text-sm'>
          This payload is not a fee shape, so no amount can be previewed.
        </p>
      )}
      <p className='text-muted-foreground text-xs'>
        In force for this key right now: {winningKey ? winningLabel : 'nothing on the loaded page'}.
        Only GLOBAL fee rules are consulted today.
      </p>
    </div>
  );
}

function describeRule(rule: { key?: string; priority?: number; scope?: string } | null) {
  if (!rule) return 'nothing';
  return `${rule.key} (${rule.scope ?? 'GLOBAL'}, priority ${rule.priority ?? 0})`;
}

/** datetime-local needs `YYYY-MM-DDTHH:mm` in local time. */
function toLocalInput(value?: Date | string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
