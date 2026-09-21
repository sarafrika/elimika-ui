'use client';

import { Copy, EyeOff, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { DataTable, DetailGrid, SectionCard, StatusBadge, surfaceTheme } from '@/components/data-display';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { formatDate } from '@/lib/date';
import type { CommerceCatalogueItem } from '@/services/client';
import { ConfirmDialog } from '../components/confirm-dialog';
import { FormSheet } from '../components/form-sheet';
import { SectionBoundary } from '../components/section-boundary';
import {
  catalogueItemKind,
  catalogueItemName,
  useCatalogue,
  useSaveCatalogueItem,
} from '../hooks/use-catalogue';
import { numberParam, stringParam } from '../state/search-state';
import { useSearchState, useSearchStatePatch } from '../state/use-search-state';

const activeParam = stringParam('any');
const visibleParam = stringParam('any');
const pageParam = numberParam(0);

interface ItemForm {
  product_code: string;
  variant_code: string;
  scope: 'course' | 'class' | 'program';
  scope_uuid: string;
  currency_code: string;
  active: boolean;
  publicly_visible: boolean;
}

const emptyForm: ItemForm = {
  product_code: '',
  variant_code: '',
  scope: 'course',
  scope_uuid: '',
  currency_code: '',
  active: true,
  publicly_visible: true,
};

const toForm = (item: CommerceCatalogueItem): ItemForm => ({
  product_code: item.product_code ?? '',
  variant_code: item.variant_code ?? '',
  scope: item.class_definition_uuid ? 'class' : item.program_uuid ? 'program' : 'course',
  scope_uuid: item.class_definition_uuid ?? item.program_uuid ?? item.course_uuid ?? '',
  currency_code: item.currency_code ?? '',
  active: item.active !== false,
  publicly_visible: item.publicly_visible !== false,
});

const money = (amount?: number, currency?: string) =>
  amount === undefined || amount === null
    ? '—'
    : `${currency ?? ''} ${Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`.trim();

/** What the platform sells, and the two writes an admin has over an entry. */
export function CataloguePage() {
  const [active] = useSearchState('active', activeParam);
  const [visible] = useSearchState('visible', visibleParam);
  const [page, setPage] = useSearchState('page', pageParam);
  const patch = useSearchStatePatch();

  const [openItem, setOpenItem] = useState<CommerceCatalogueItem | null>(null);
  const [editing, setEditing] = useState<CommerceCatalogueItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [confirming, setConfirming] = useState<'create' | 'update' | 'hide' | null>(null);

  const { items, totalRows, pageCount, query } = useCatalogue({ active, visible, page });
  const save = useSaveCatalogueItem();

  useEffect(() => {
    if (editing) setForm(toForm(editing));
    else if (creating) setForm(emptyForm);
  }, [editing, creating]);

  const copyCode = async (code?: string) => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    toast.success('Code copied');
  };

  const buildBody = () => ({
    product_code: form.product_code.trim(),
    variant_code: form.variant_code.trim(),
    course_uuid: form.scope === 'course' ? form.scope_uuid.trim() || undefined : undefined,
    class_definition_uuid: form.scope === 'class' ? form.scope_uuid.trim() || undefined : undefined,
    program_uuid: form.scope === 'program' ? form.scope_uuid.trim() || undefined : undefined,
    currency_code: form.currency_code.trim() || undefined,
    active: form.active,
    publicly_visible: form.publicly_visible,
  });

  const formIsValid =
    form.product_code.trim().length > 0 &&
    form.variant_code.trim().length > 0 &&
    form.scope_uuid.trim().length > 0;

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Catalogue'
          title='Catalogue'
          description='Every course, class and program the storefront can sell.'
          actions={
            <Button className='rounded-md' onClick={() => setCreating(true)}>
              <Plus className='mr-2 size-4' />
              Add entry
            </Button>
          }
        />

        {/* No search box: the catalogue search filters by ids and flags, never by name. */}
        <div className='flex flex-wrap items-center gap-2'>
          <Select
            value={active}
            onValueChange={value => patch({ active: value === 'any' ? undefined : value })}
          >
            <SelectTrigger className='border-border/70 h-9 w-auto min-w-[150px] rounded-md'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='any'>Status: any</SelectItem>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='inactive'>Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={visible}
            onValueChange={value => patch({ visible: value === 'any' ? undefined : value })}
          >
            <SelectTrigger className='border-border/70 h-9 w-auto min-w-[170px] rounded-md'>
              <SelectValue placeholder='Visibility' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='any'>Visibility: any</SelectItem>
              <SelectItem value='public'>Public</SelectItem>
              <SelectItem value='private'>Signed-in only</SelectItem>
            </SelectContent>
          </Select>

          <span className='text-muted-foreground text-xs'>
            Filtering is by status, visibility and ids — the endpoint cannot search by name.
          </span>
        </div>

        <SectionBoundary
          label='the catalogue'
          loading={query.isLoading && items.length === 0}
          error={query.error}
          onRetry={query.refetch}
          empty={!query.isLoading && items.length === 0}
          emptyTitle='Nothing listed'
          emptyDescription='No course, class or program is on sale yet.'
        >
          <DataTable
            hideToolbar
            data={items}
            isLoading={query.isLoading}
            getRowId={row => row.uuid ?? `${row.product_code}-${row.variant_code}`}
            onRowClick={row => setOpenItem(row)}
            serverPagination={{ page, pageCount, totalRows, onPageChange: setPage }}
            columns={[
              {
                id: 'item',
                header: 'Item',
                cell: ({ row }) => (
                  <div className='min-w-0'>
                    <p className='text-foreground truncate text-sm font-medium'>
                      {catalogueItemName(row.original)}
                    </p>
                    <p className='text-muted-foreground truncate text-xs'>
                      {row.original.course?.creator_name || catalogueItemKind(row.original)}
                    </p>
                  </div>
                ),
              },
              {
                id: 'type',
                header: 'Type',
                cell: ({ row }) => (
                  <span className='text-muted-foreground text-xs'>
                    {catalogueItemKind(row.original)}
                  </span>
                ),
              },
              {
                id: 'codes',
                header: 'Codes',
                cell: ({ row }) => (
                  <div className='font-mono text-xs'>
                    <p className='truncate'>{row.original.product_code || '—'}</p>
                    <p className='text-muted-foreground truncate'>
                      {row.original.variant_code || '—'}
                    </p>
                  </div>
                ),
              },
              {
                id: 'price',
                header: 'Price',
                cell: ({ row }) => (
                  <span className='font-mono text-sm'>
                    {money(row.original.unit_amount, row.original.currency_code)}
                  </span>
                ),
              },
              {
                id: 'status',
                header: 'Status',
                cell: ({ row }) => (
                  <StatusBadge status={row.original.active === false ? 'inactive' : 'active'} />
                ),
              },
              {
                id: 'visibility',
                header: 'Visibility',
                cell: ({ row }) => (
                  <StatusBadge
                    label={row.original.publicly_visible === false ? 'Signed-in only' : 'Public'}
                    tone={row.original.publicly_visible === false ? 'neutral' : 'info'}
                  />
                ),
              },
              {
                id: 'updated',
                header: 'Updated',
                cell: ({ row }) => (
                  <span className='text-muted-foreground font-mono text-xs'>
                    {formatDate(row.original.updated_date) || '—'}
                  </span>
                ),
              },
            ]}
          />
        </SectionBoundary>

        <p className='text-muted-foreground text-xs'>
          Classes are listed automatically when they are created or updated, so most entries appear
          here without anyone adding them.
        </p>
      </div>

      <Sheet
        open={openItem !== null}
        onOpenChange={open => {
          if (!open) setOpenItem(null);
        }}
      >
        <SheetContent className='w-full gap-0 overflow-y-auto sm:max-w-[560px]'>
          <SheetHeader>
            <SheetTitle>{openItem ? catalogueItemName(openItem) : 'Catalogue entry'}</SheetTitle>
            <SheetDescription>
              {openItem ? catalogueItemKind(openItem) : ''} entry in the commerce catalogue.
            </SheetDescription>
          </SheetHeader>

          <div className='flex flex-col gap-4 px-4 pb-6'>
            <SectionCard title='Entry'>
              <DetailGrid
                items={[
                  {
                    label: 'Product code',
                    value: <span className='font-mono text-xs'>{openItem?.product_code || '—'}</span>,
                  },
                  {
                    label: 'Variant code',
                    value: <span className='font-mono text-xs'>{openItem?.variant_code || '—'}</span>,
                  },
                  {
                    label: 'Price',
                    value: money(openItem?.unit_amount, openItem?.currency_code),
                  },
                  {
                    label: 'Sells',
                    value: (
                      <span className='font-mono text-xs'>
                        {openItem?.course_uuid ??
                          openItem?.class_definition_uuid ??
                          openItem?.program_uuid ??
                          '—'}
                      </span>
                    ),
                  },
                ]}
              />
            </SectionCard>

            <div className='flex flex-wrap gap-2'>
              <Button
                variant='outline'
                className='rounded-md'
                onClick={() => copyCode(openItem?.variant_code)}
              >
                <Copy className='mr-2 size-4' />
                Copy variant code
              </Button>
              <Button
                variant='outline'
                className='rounded-md'
                onClick={() => {
                  setEditing(openItem);
                  setOpenItem(null);
                }}
              >
                Edit entry
              </Button>
              {openItem?.publicly_visible !== false ? (
                <Button
                  variant='outline'
                  className='text-destructive border-destructive/40 rounded-md'
                  onClick={() => {
                    if (!openItem) return;
                    setForm({ ...toForm(openItem), publicly_visible: false });
                    setConfirming('hide');
                  }}
                >
                  <EyeOff className='mr-2 size-4' />
                  Hide from public
                </Button>
              ) : null}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <FormSheet
        open={creating || editing !== null}
        onOpenChange={open => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
        title={editing ? 'Edit catalogue entry' : 'Add catalogue entry'}
        description='A save replaces every field on the entry. Price lives on the variant.'
        isDirty={formIsValid}
        isPending={save.isPending}
        submitLabel={editing ? 'Save entry' : 'Create entry'}
        onSubmit={() => setConfirming(editing ? 'update' : 'create')}
      >
        <div className='space-y-1.5'>
          <Label htmlFor='product-code'>Product code *</Label>
          <Input
            id='product-code'
            value={form.product_code}
            onChange={event => setForm({ ...form, product_code: event.target.value })}
            className='rounded-md font-mono'
          />
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='variant-code'>Variant code *</Label>
          <Input
            id='variant-code'
            value={form.variant_code}
            onChange={event => setForm({ ...form, variant_code: event.target.value })}
            className='rounded-md font-mono'
          />
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='scope'>Sells</Label>
          <Select
            value={form.scope}
            onValueChange={value => setForm({ ...form, scope: value as ItemForm['scope'] })}
          >
            <SelectTrigger id='scope' className='rounded-md'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='course'>A course</SelectItem>
              <SelectItem value='class'>A class</SelectItem>
              <SelectItem value='program'>A program</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='scope-uuid'>Id of what it sells *</Label>
          <Input
            id='scope-uuid'
            value={form.scope_uuid}
            onChange={event => setForm({ ...form, scope_uuid: event.target.value })}
            className='rounded-md font-mono'
          />
          <p className='text-muted-foreground text-xs'>
            Exactly one of course, class or program — the API refuses anything else.
          </p>
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='currency'>Currency</Label>
          <Input
            id='currency'
            value={form.currency_code}
            onChange={event => setForm({ ...form, currency_code: event.target.value.toUpperCase() })}
            placeholder='Leave empty to use the platform default'
            className='rounded-md font-mono'
          />
        </div>

        <div className='flex items-center justify-between gap-3'>
          <Label htmlFor='entry-active'>Active</Label>
          <Switch
            id='entry-active'
            checked={form.active}
            onCheckedChange={checked => setForm({ ...form, active: checked })}
          />
        </div>

        <div className='flex items-center justify-between gap-3'>
          <Label htmlFor='entry-visible'>Visible to the public</Label>
          <Switch
            id='entry-visible'
            checked={form.publicly_visible}
            onCheckedChange={checked => setForm({ ...form, publicly_visible: checked })}
          />
        </div>
      </FormSheet>

      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={open => {
          if (!open) setConfirming(null);
        }}
        action={
          confirming === 'create'
            ? 'createCatalogueItem'
            : confirming === 'hide'
              ? 'hideCatalogueItem'
              : 'updateCatalogueItem'
        }
        subject={{
          name: editing
            ? catalogueItemName(editing)
            : openItem
              ? catalogueItemName(openItem)
              : form.product_code || 'this entry',
        }}
        isPending={save.isPending}
        onConfirm={() => {
          const target = editing ?? openItem;
          save.mutate(
            {
              catalogUuid: confirming === 'create' ? undefined : target?.uuid,
              body: buildBody(),
              name: target ? catalogueItemName(target) : form.product_code,
            },
            {
              onSuccess: () => {
                setConfirming(null);
                setCreating(false);
                setEditing(null);
                setOpenItem(null);
              },
            }
          );
        }}
      />
    </div>
  );
}
