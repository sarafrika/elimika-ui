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
import {
  createCategoryMutation,
  deleteCategoryMutation,
  getAllCategoriesOptions,
  getAllCategoriesQueryKey,
  updateCategoryMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Edit,
  FolderTree,
  Loader2,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Category = {
  uuid: string;
  name: string;
  description?: string;
  parent_uuid?: string;
  is_active: boolean;
  created_date?: string;
  created_by?: string;
  updated_date?: string;
  updated_by?: string;
  is_root_category?: boolean;
  category_path?: string;
};

type CategoryFormData = {
  name: string;
  description: string;
  parent_uuid: string;
  is_active: boolean;
  is_root_category: boolean;
};

type SortField = 'name' | 'description' | 'is_active' | 'is_root_category' | 'category_path';
type SortDirection = 'asc' | 'desc';

const PAGE_SIZE = 25;

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parent_uuid: '',
    is_active: true,
    is_root_category: false,
  });

  // List all categories with pagination
  const { data, isLoading } = useQuery(
    getAllCategoriesOptions({
      query: { pageable: { page: page - 1, size: PAGE_SIZE } },
    })
  );

  const categories: Category[] = (data?.data?.content ?? []) as Category[];
  const metadata = data?.data?.metadata;
  const totalPages = metadata?.totalPages ?? 1;
  const totalElements = metadata?.totalElements ?? 0;

  // Create mutation
  const createMutation = useMutation({
    ...createCategoryMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getAllCategoriesQueryKey({ query: { pageable: {} } }) });
      toast.success('Category created successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    ...updateCategoryMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getAllCategoriesQueryKey({ query: { pageable: {} } }) }); toast.success('Category updated successfully');
      setIsDialogOpen(false);
      setEditingCategory(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update category');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    ...deleteCategoryMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getAllCategoriesQueryKey({ query: { pageable: {} } }) });
      toast.success('Category deleted successfully');
      setDeletingCategory(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parent_uuid: '',
      is_active: true,
      is_root_category: false,
    });
  };

  const handleCreate = () => {
    setEditingCategory(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      parent_uuid: category.parent_uuid || '',
      is_active: category.is_active ?? true,
      is_root_category: category.is_root_category ?? false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const body = {
      name: formData.name,
      description: formData.description || undefined,
      parent_uuid: formData.parent_uuid || undefined,
      is_active: formData.is_active,
      is_root_category: formData.is_root_category,
    };

    if (editingCategory) {
      updateMutation.mutate({
        path: { uuid: editingCategory.uuid },
        body,
      });
    } else {
      createMutation.mutate({ body });
    }
  };

  const handleToggleActive = (category: Category) => {
    updateMutation.mutate({
      path: { uuid: category.uuid },
      body: { is_active: !category.is_active },
    });
  };

  const handleDeleteConfirm = () => {
    if (!deletingCategory) return;
    deleteMutation.mutate({ path: { uuid: deletingCategory.uuid } });
  };

  // Client-side sort for current page data
  const toggleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCategories = [...categories].sort((a, b) => {
    let aVal: string | number = '';
    let bVal: string | number = '';

    switch (sortField) {
      case 'name':
        aVal = (a.name || '').toLowerCase();
        bVal = (b.name || '').toLowerCase();
        break;
      case 'description':
        aVal = (a.description || '').toLowerCase();
        bVal = (b.description || '').toLowerCase();
        break;
      case 'category_path':
        aVal = (a.category_path || '').toLowerCase();
        bVal = (b.category_path || '').toLowerCase();
        break;
      case 'is_active':
        aVal = a.is_active ? 1 : 0;
        bVal = b.is_active ? 1 : 0;
        break;
      case 'is_root_category':
        aVal = a.is_root_category ? 1 : 0;
        bVal = b.is_root_category ? 1 : 0;
        break;
    }

    const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal as string) : aVal - (bVal as number);
    return sortDirection === 'asc' ? cmp : -cmp;
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCategories = normalizedSearch
    ? sortedCategories.filter(
      cat =>
        (cat.name || '').toLowerCase().includes(normalizedSearch) ||
        (cat.description || '').toLowerCase().includes(normalizedSearch) ||
        (cat.category_path || '').toLowerCase().includes(normalizedSearch)
    )
    : sortedCategories;

  // Reset to page 1 on search
  useEffect(() => {
    setPage(1);
  }, [normalizedSearch]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className='text-muted-foreground h-4 w-4' />;
    return sortDirection === 'asc' ? <ArrowUp className='h-4 w-4' /> : <ArrowDown className='h-4 w-4' />;
  };

  const activeCount = categories.filter(c => c.is_active).length;
  const rootCount = categories.filter(c => c.is_root_category).length;

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className='flex min-h-screen flex-col gap-6 p-6'>
      {/* Header */}
      <div className='flex items-start justify-between'>
        <div>
          <Badge
            variant='outline'
            className='border-primary/60 bg-primary/10 text-xs font-semibold tracking-wide uppercase'
          >
            Category Management
          </Badge>
          <div className='mt-4'>
            <p className='text-muted-foreground max-w-3xl text-sm leading-relaxed'>
              Manage content categories, organize hierarchies, and configure category properties.
            </p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className='mr-2 h-4 w-4' />
          Add Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 sm:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardDescription>Total Categories</CardDescription>
            <CardTitle className='text-3xl'>{totalElements}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground text-xs'>Registered on platform</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active Categories</CardDescription>
            <CardTitle className='text-3xl'>{activeCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground text-xs'>Currently available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Root Categories</CardDescription>
            <CardTitle className='text-3xl'>{rootCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground text-xs'>Top-level categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>View and manage all platform categories</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-3'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : totalElements === 0 && !normalizedSearch ? (
            <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center'>
              <FolderTree className='text-muted-foreground mb-4 h-10 w-10' />
              <p className='mb-2 text-sm font-medium'>No categories configured</p>
              <p className='text-muted-foreground mb-4 text-xs'>
                Add your first category to start organizing content
              </p>
              <Button onClick={handleCreate}>
                <Plus className='mr-2 h-4 w-4' />
                Add Category
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
                          onClick={() => toggleSort('name')}
                          className='flex items-center gap-2 font-semibold'
                        >
                          <span>Name</span>
                          <SortIcon field='name' />
                        </button>
                        <Input
                          placeholder='Search categories…'
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className='h-9 w-full'
                        />
                      </div>
                    </TableHead>
                    <TableHead>
                      <button
                        type='button'
                        onClick={() => toggleSort('description')}
                        className='flex items-center gap-2 font-semibold'
                      >
                        <span>Description</span>
                        <SortIcon field='description' />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type='button'
                        onClick={() => toggleSort('category_path')}
                        className='flex items-center gap-2 font-semibold'
                      >
                        <span>Path</span>
                        <SortIcon field='category_path' />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type='button'
                        onClick={() => toggleSort('is_root_category')}
                        className='flex items-center gap-2 font-semibold'
                      >
                        <span>Type</span>
                        <SortIcon field='is_root_category' />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type='button'
                        onClick={() => toggleSort('is_active')}
                        className='flex items-center gap-2 font-semibold'
                      >
                        <span>Status</span>
                        <SortIcon field='is_active' />
                      </button>
                    </TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className='text-muted-foreground text-center text-sm'>
                        No categories match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map(category => (
                      <TableRow key={category.uuid}>
                        <TableCell className='font-medium'>{category.name}</TableCell>
                        <TableCell className='text-muted-foreground max-w-xs truncate text-sm'>
                          {category.description || '—'}
                        </TableCell>
                        <TableCell className='text-muted-foreground font-mono text-xs'>
                          {category.category_path || '—'}
                        </TableCell>
                        <TableCell>
                          {category.is_root_category ? (
                            <Badge variant='secondary'>Root</Badge>
                          ) : (
                            <Badge variant='outline'>Child</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {category.is_active ? (
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
                        <TableCell className='text-right'>
                          <div className='flex justify-end gap-2'>
                            <Button variant='ghost' size='sm' onClick={() => handleEdit(category)}>
                              <Edit className='h-4 w-4' />
                            </Button>
                            <Button
                              variant={category.is_active ? 'outline' : 'default'}
                              size='sm'
                              onClick={() => handleToggleActive(category)}
                              disabled={updateMutation.isPending}
                            >
                              {category.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => setDeletingCategory(category)}
                              className='text-destructive hover:text-destructive'
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
                <div className='text-muted-foreground text-sm'>
                  Page {page} of {totalPages} · {totalElements} total categories
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1 || !metadata?.hasPrevious}
                  >
                    Previous
                  </Button>
                  <span className='text-muted-foreground text-sm'>
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={page >= totalPages || !metadata?.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={open => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingCategory(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update the category details below.'
                : 'Enter the details for the new category.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label htmlFor='name'>Name *</Label>
                <Input
                  id='name'
                  placeholder='e.g. Programming'
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='description'>Description</Label>
                <Input
                  id='description'
                  placeholder='e.g. Software development and programming courses'
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='parent_uuid'>Parent Category UUID (optional)</Label>
                <Input
                  id='parent_uuid'
                  placeholder='Leave empty for root category'
                  value={formData.parent_uuid}
                  onChange={e => setFormData({ ...formData, parent_uuid: e.target.value })}
                />
              </div>
              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <Label htmlFor='is_root_category'>Root Category</Label>
                  <p className='text-muted-foreground text-xs'>
                    Mark as a top-level root category
                  </p>
                </div>
                <Switch
                  id='is_root_category'
                  checked={formData.is_root_category}
                  onCheckedChange={val => setFormData({ ...formData, is_root_category: val })}
                />
              </div>
              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <Label htmlFor='is_active'>Active Status</Label>
                  <p className='text-muted-foreground text-xs'>
                    Make this category available for use
                  </p>
                </div>
                <Switch
                  id='is_active'
                  checked={formData.is_active}
                  onCheckedChange={val => setFormData({ ...formData, is_active: val })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isPending}>
                {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {editingCategory ? 'Update' : 'Create'} Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingCategory}
        onOpenChange={open => {
          if (!open) setDeletingCategory(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>{deletingCategory?.name}</span>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeletingCategory(null)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}