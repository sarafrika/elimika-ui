'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import type { Category } from '@/services/client';
import {
  createCategoryMutation,
  deleteCategoryMutation,
  getAllCategoriesOptions,
  updateCategoryMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { AdminTable } from '../_components/ui/AdminTable';
import { StatusBadge } from '../_components/ui/StatusBadge';

interface CategoryForm {
  name: string;
  description: string;
  is_active: boolean;
}

const EMPTY_FORM: CategoryForm = { name: '', description: '', is_active: true };

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const listOptions = getAllCategoriesOptions({ query: { pageable: { page: 0, size: 200 } } });
  const { data, isLoading } = useQuery(listOptions);
  const categories = useMemo(() => (data?.data?.content ?? []) as Category[], [data?.data?.content]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);

  const create = useMutation(createCategoryMutation());
  const update = useMutation(updateCategoryMutation());
  const remove = useMutation(deleteCategoryMutation());
  const isPending = create.isPending || update.isPending;

  const refresh = () =>
    queryClient.invalidateQueries({
      predicate: query => String(query.queryKey[0]) === String(listOptions.queryKey[0]),
    });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name ?? '',
      description: category.description ?? '',
      is_active: category.is_active ?? true,
    });
    setOpen(true);
  };

  const submit = async () => {
    try {
      const body: Category = { name: form.name, description: form.description || undefined, is_active: form.is_active };
      if (editing?.uuid) {
        await update.mutateAsync({ path: { uuid: editing.uuid }, body: { ...editing, ...body } });
        toast.success('Category updated');
      } else {
        await create.mutateAsync({ body });
        toast.success('Category created');
      }
      setOpen(false);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save category');
    }
  };

  const handleDelete = async (category: Category) => {
    if (!category.uuid) return;
    try {
      await remove.mutateAsync({ path: { uuid: category.uuid } });
      toast.success('Category deleted');
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete category');
    }
  };

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        id: 'name',
        accessorFn: row => row.name ?? '',
        header: 'Category',
        meta: { label: 'Category' },
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <span className='flex size-9 items-center justify-center rounded-md border border-border/60 bg-muted/40'>
              <FolderTree className='size-4 text-muted-foreground' />
            </span>
            <div className='min-w-0'>
              <p className='truncate text-sm font-medium text-foreground'>{row.original.name}</p>
              <p className='truncate text-xs text-muted-foreground'>
                {row.original.description || '—'}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'status',
        accessorFn: row => (row.is_active ? 'active' : 'inactive'),
        header: 'Status',
        meta: { label: 'Status' },
        filterFn: (row, id, value: string[]) =>
          !value?.length || value.includes(row.getValue(id) as string),
        cell: ({ row }) => <StatusBadge status={row.original.is_active ? 'active' : 'inactive'} />,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className='flex justify-end gap-1'>
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
            <Button
              variant='ghost'
              size='icon'
              className='size-8 text-destructive'
              disabled={remove.isPending}
              onClick={e => {
                e.stopPropagation();
                handleDelete(row.original);
              }}
            >
              <Trash2 className='size-4' />
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [remove.isPending]
  );

  return (
    <main className={adminTheme.page}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title='Course categories'
          description='Organise the catalogue with categories used to classify courses.'
          actions={
            <Button onClick={openCreate}>
              <Plus className='size-4' />
              New category
            </Button>
          }
        />

        <AdminTable
          columns={columns}
          data={categories}
          isLoading={isLoading}
          searchPlaceholder='Search categories…'
          getRowId={(category, index) => category.uuid ?? String(index)}
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
          emptyTitle='No categories yet'
          emptyDescription='Create a category to start classifying courses.'
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit category' : 'New category'}</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='name'>Name</Label>
              <Input
                id='name'
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder='e.g. Music theory'
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder='Optional description'
                className='min-h-20'
              />
            </div>
            <div className='flex items-center justify-between rounded-md border border-border/70 bg-muted/30 px-4 py-3'>
              <Label htmlFor='is_active'>Active</Label>
              <Switch
                id='is_active'
                checked={form.is_active}
                onCheckedChange={checked => setForm(f => ({ ...f, is_active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={isPending || !form.name}>
              {isPending ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
