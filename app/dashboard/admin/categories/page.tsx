'use client';

import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { STALE_TIMES } from '@/lib/query-client';
import type { Category } from '@/services/client';
import {
  createCategoryMutation,
  deleteCategoryMutation,
  getAllCategoriesOptions,
  getAllCategoriesQueryKey,
  getCategoryByUuidOptions,
  updateCategoryMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { adminTheme } from '../_components/ui/admin-theme';
import { AdminPageHeader } from '../_components/ui/AdminPageHeader';
import { AdminTable } from '../_components/ui/AdminTable';
import { StatusBadge } from '../_components/ui/StatusBadge';
import { canBeParent, categoryPath } from './category-hierarchy';

interface CategoryForm {
  name: string;
  description: string;
  is_active: boolean;
  is_root_category: boolean;
  parent_uuid: string;
}

const EMPTY_FORM: CategoryForm = {
  name: '',
  description: '',
  is_active: true,
  is_root_category: true,
  parent_uuid: '',
};

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const listOptions = getAllCategoriesOptions({ query: { pageable: { page: 0, size: 200 } } });
  const { data, isLoading } = useQuery({ ...listOptions, staleTime: STALE_TIMES.reference });
  const categories = useMemo(() => data?.data?.content ?? [], [data?.data?.content]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);

  // An existing parent can be outside the loaded list page.
  const missingParentUuid =
    open &&
      editing?.parent_uuid &&
      !categories.some(category => category.uuid === editing.parent_uuid)
      ? editing.parent_uuid
      : undefined;
  const { data: parentData } = useQuery({
    ...(missingParentUuid
      ? getCategoryByUuidOptions({ path: { uuid: missingParentUuid } })
      : { queryKey: [], queryFn: skipToken }),
    enabled: Boolean(missingParentUuid),
    staleTime: STALE_TIMES.reference,
  });
  const categoriesById = useMemo(() => {
    const map = new Map<string, Category>();
    for (const category of categories) {
      if (category.uuid) map.set(category.uuid, category);
    }
    const parent = parentData?.data;
    if (parent?.uuid) map.set(parent.uuid, parent);
    return map;
  }, [categories, parentData]);
  const parentOptions = useMemo(
    () =>
      [...categoriesById.values()].filter(category =>
        canBeParent(category, editing?.uuid, categoriesById)
      ),
    [categoriesById, editing?.uuid]
  );
  const selectedParent = parentOptions.find(category => category.uuid === form.parent_uuid);
  const pathPreview = form.is_root_category
    ? form.name.trim()
    : selectedParent
      ? `${categoryPath(selectedParent, categoriesById)} > ${form.name.trim() || 'Category name'}`
      : '';

  const create = useMutation(createCategoryMutation());
  const update = useMutation(updateCategoryMutation());
  const remove = useMutation(deleteCategoryMutation());
  const isPending = create.isPending || update.isPending;

  const refresh = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: getAllCategoriesQueryKey({}),
      }),
    [queryClient]
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = useCallback((category: Category) => {
    setEditing(category);
    setForm({
      name: category.name ?? '',
      description: category.description ?? '',
      is_active: category.is_active ?? true,
      is_root_category: !category.parent_uuid,
      parent_uuid: category.parent_uuid ?? '',
    });
    setOpen(true);
  }, []);

  const submit = async () => {
    if (isPending || !form.name.trim()) return;
    if (!form.is_root_category && !selectedParent) {
      toast.error('Select a parent category for this subcategory');
      return;
    }
    try {
      const body: Category = {
        name: form.name.trim(),
        description: form.description.trim(),
        is_active: form.is_active,
        // The API derives is_root_category and category_path from this relationship.
        parent_uuid: form.is_root_category ? null : form.parent_uuid,
      };
      if (editing?.uuid) {
        await update.mutateAsync({ path: { uuid: editing.uuid }, body });
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

  const handleDelete = useCallback(
    async (category: Category) => {
      if (!category.uuid) return;
      try {
        await remove.mutateAsync({ path: { uuid: category.uuid } });
        toast.success('Category deleted');
        refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to delete category');
      }
    },
    [remove, refresh]
  );

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        id: 'name',
        accessorFn: row => row.name ?? '',
        header: 'Category',
        meta: { label: 'Category' },
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <span className='border-border/60 bg-muted/40 flex size-9 items-center justify-center rounded-md border'>
              <FolderTree className='text-muted-foreground size-4' />
            </span>
            <div className='min-w-0'>
              <p className='text-foreground truncate text-sm font-medium'>{row.original.name}</p>
              <p className='text-muted-foreground truncate text-xs'>
                {row.original.description || '—'}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'type',
        accessorFn: row => (row.parent_uuid ? 'Subcategory' : 'Root category'),
        header: 'Type',
        meta: { label: 'Type' },
        cell: ({ row }) => (
          <Badge variant='secondary'>
            {row.original.parent_uuid ? 'Subcategory' : 'Root category'}
          </Badge>
        ),
      },
      {
        id: 'category_path',
        accessorFn: row => categoryPath(row, categoriesById),
        header: 'Category path',
        meta: { label: 'Category path' },
        cell: ({ row }) => (
          <span className='text-muted-foreground'>
            {categoryPath(row.original, categoriesById)}
          </span>
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
              className='text-destructive size-8'
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
    [remove.isPending, categoriesById, openEdit, handleDelete]
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
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-md'>
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
            <div className='border-border/70 bg-muted/30 flex items-center justify-between gap-4 rounded-md border px-4 py-3'>
              <div className='space-y-1'>
                <Label htmlFor='is_root_category'>Root category</Label>
                <p className='text-muted-foreground text-xs'>
                  A top-level category with no parent. Turn off to create a subcategory.
                </p>
              </div>
              <Switch
                id='is_root_category'
                checked={form.is_root_category}
                onCheckedChange={checked =>
                  setForm(f => ({
                    ...f,
                    is_root_category: checked,
                    parent_uuid: checked ? '' : f.parent_uuid,
                  }))
                }
              />
            </div>
            {!form.is_root_category && (
              <div className='space-y-1.5'>
                <Label htmlFor='parent_uuid'>Parent category (required)</Label>
                <Select
                  value={form.parent_uuid}
                  onValueChange={value => setForm(f => ({ ...f, parent_uuid: value }))}
                >
                  <SelectTrigger id='parent_uuid' className='w-full'>
                    <SelectValue placeholder='Select a parent category' />
                  </SelectTrigger>
                  <SelectContent>
                    {parentOptions.map(category => (
                      <SelectItem key={category.uuid} value={category.uuid!}>
                        {categoryPath(category, categoriesById)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!parentOptions.length && (
                  <p className='text-muted-foreground text-xs'>
                    No parent categories available. Create a root category first.
                  </p>
                )}
              </div>
            )}
            <div className='space-y-1.5'>
              <Label htmlFor='category_path'>Category path</Label>
              <Input
                id='category_path'
                value={pathPreview}
                readOnly
                placeholder={
                  form.is_root_category ? 'Enter a category name' : 'Select a parent category'
                }
              />
              <p className='text-muted-foreground text-xs'>
                Generated from the parent category and category name.
              </p>
            </div>
            <div className='border-border/70 bg-muted/30 flex items-center justify-between rounded-md border px-4 py-3'>
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
            <Button
              onClick={submit}
              disabled={
                isPending || !form.name.trim() || (!form.is_root_category && !selectedParent)
              }
            >
              {isPending && <Spinner />}
              {isPending ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
