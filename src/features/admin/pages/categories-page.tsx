'use client';

import { ChevronDown, ChevronRight, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  DetailGrid,
  SectionCard,
  SectionCardSkeleton,
  StatusBadge,
  surfaceTheme,
} from '@/components/data-display';
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
import { Switch } from '@/components/ui/switch';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { Category } from '@/services/client';
import { ConfirmDialog } from '../components/confirm-dialog';
import { FilterBar } from '../components/filter-bar';
import { FormSheet } from '../components/form-sheet';
import { NoteField, noteToPlainText } from '../components/note-field';
import { SectionBoundary } from '../components/section-boundary';
import {
  type CategoryFormValues,
  useCategoryCourseCount,
  useCategorySearch,
  useDeleteCategory,
  useRootCategories,
  useSaveCategory,
  useSubCategories,
} from '../hooks/use-categories';
import { stringParam } from '../state/search-state';
import { useSearchState } from '../state/use-search-state';

const searchParam = stringParam();
const activeParam = stringParam('any');

const emptyForm: CategoryFormValues = {
  name: '',
  description: '',
  parent_uuid: null,
  is_active: true,
};

export function CategoriesPage() {
  const [q] = useSearchState('q', searchParam);
  const [active] = useSearchState('active', activeParam);

  const [selected, setSelected] = useState<Category | null>(null);
  const [editing, setEditing] = useState<{ category?: Category; parent?: Category } | null>(null);
  const [form, setForm] = useState<CategoryFormValues>(emptyForm);
  const [confirmSave, setConfirmSave] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const roots = useRootCategories();
  const search = useCategorySearch(q, active);
  const saveCategory = useSaveCategory();
  const deleteCategory = useDeleteCategory();
  const courseCount = useCategoryCourseCount(selected?.name);

  const openCreate = (parent?: Category) => {
    setForm({ ...emptyForm, parent_uuid: parent?.uuid ?? null });
    setEditing({ parent });
  };

  const openEdit = (category: Category) => {
    setForm({
      name: category.name,
      description: category.description ?? '',
      parent_uuid: category.parent_uuid ?? null,
      is_active: category.is_active ?? true,
    });
    setEditing({ category });
  };

  const nameError =
    form.name.trim().length === 0
      ? 'A category needs a name.'
      : form.name.trim().length > 100
        ? 'Keep the name to 100 characters.'
        : undefined;

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <PageHeader
          eyebrow='Platform'
          title='Categories'
          description='The subject tree creators pick from when they tag a course.'
          actions={
            <Button className='rounded-md' onClick={() => openCreate()}>
              <Plus className='mr-2 size-4' />
              New category
            </Button>
          }
        />

        <SecurityBanner />

        <FilterBar
          values={{ q, active }}
          searchPlaceholder='Search categories…'
          filters={[
            {
              key: 'active',
              label: 'Status',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
            },
          ]}
        />

        <div className='grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]'>
          <SectionCard
            title={search.isSearching ? 'Matching categories' : 'Category tree'}
            description={
              search.isSearching
                ? `${search.totalRows} match the search`
                : 'Open a category to load its subcategories'
            }
          >
            {search.isSearching ? (
              <SectionBoundary
                label='the search results'
                loading={search.query.isLoading}
                error={search.query.error}
                onRetry={search.query.refetch}
                empty={!search.query.isLoading && search.categories.length === 0}
                emptyTitle='Nothing matches'
                emptyDescription='Try a different word, or clear the filters.'
                skeleton={<SectionCardSkeleton rows={5} withHeader={false} />}
              >
                <ul className='divide-border/60 divide-y'>
                  {search.categories.map(category => (
                    <li key={category.uuid}>
                      <CategoryRow
                        category={category}
                        depth={0}
                        isSelected={selected?.uuid === category.uuid}
                        onSelect={() => setSelected(category)}
                      />
                    </li>
                  ))}
                </ul>
              </SectionBoundary>
            ) : (
              <SectionBoundary
                label='the category tree'
                loading={roots.query.isLoading}
                error={roots.query.error}
                onRetry={roots.query.refetch}
                empty={!roots.query.isLoading && roots.categories.length === 0}
                emptyTitle='No categories yet'
                emptyDescription='Add the first subject creators can tag a course with.'
                skeleton={<SectionCardSkeleton rows={5} withHeader={false} />}
              >
                <ul className='divide-border/60 divide-y'>
                  {roots.categories.map(category => (
                    <CategoryBranch
                      key={category.uuid}
                      category={category}
                      depth={0}
                      selectedUuid={selected?.uuid}
                      onSelect={setSelected}
                    />
                  ))}
                </ul>
              </SectionBoundary>
            )}
          </SectionCard>

          <SectionCard
            title={selected ? selected.name : 'No category selected'}
            description={selected ? 'What this category is and where it is used' : undefined}
            actions={
              selected ? (
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='rounded-md'
                    onClick={() => openEdit(selected)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='text-destructive border-destructive/40 rounded-md'
                    onClick={() => setDeleting(selected)}
                  >
                    <Trash2 className='mr-1.5 size-3.5' />
                    Delete
                  </Button>
                </div>
              ) : null
            }
          >
            {selected ? (
              <div className='space-y-4'>
                <DetailGrid
                  columns={2}
                  items={[
                    { label: 'Name', value: selected.name },
                    {
                      label: 'Status',
                      value: <StatusBadge status={selected.is_active ? 'active' : 'inactive'} />,
                    },
                    { label: 'Parent', value: selected.parent_uuid ? 'Subcategory' : 'Top level' },
                    { label: 'Created', value: formatDate(selected.created_date) || '—' },
                    {
                      label: 'Courses using it',
                      value: courseCount.query.isLoading ? 'Counting…' : courseCount.count,
                    },
                    {
                      label: 'Category path',
                      value: (
                        <span className='font-mono text-xs'>
                          {selected.category_path || selected.name}
                        </span>
                      ),
                    },
                  ]}
                />
                <p className='text-muted-foreground text-xs'>
                  The category path is only the name today — the API does not build the full
                  ancestry.
                </p>
                {selected.description ? (
                  <div
                    className='prose prose-sm text-muted-foreground max-w-none text-sm'
                    // The description is written in the rich text editor and stored as markup.
                    dangerouslySetInnerHTML={{ __html: selected.description }}
                  />
                ) : (
                  <p className='text-muted-foreground text-sm'>No description.</p>
                )}
                <Button
                  variant='outline'
                  size='sm'
                  className='rounded-md'
                  onClick={() => openCreate(selected)}
                >
                  <Plus className='mr-1.5 size-3.5' />
                  Add a subcategory
                </Button>
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>
                Pick a category to see what it holds and how many courses use it.
              </p>
            )}
          </SectionCard>
        </div>
      </div>

      <FormSheet
        open={editing !== null}
        onOpenChange={open => {
          if (!open) setEditing(null);
        }}
        title={editing?.category ? `Edit ${editing.category.name}` : 'New category'}
        description={
          editing?.parent ? `Added under ${editing.parent.name}` : 'Added at the top level'
        }
        isDirty={form.name.trim().length > 0}
        isPending={saveCategory.isPending}
        submitLabel={editing?.category ? 'Save category' : 'Create category'}
        onSubmit={() => {
          if (nameError) return;
          setConfirmSave(true);
        }}
      >
        <div className='space-y-1.5'>
          <Label htmlFor='category-name' className='text-sm font-semibold'>
            Name <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='category-name'
            value={form.name}
            maxLength={100}
            onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
            className='rounded-md'
          />
          {nameError ? <p className='text-destructive text-xs'>{nameError}</p> : null}
        </div>

        <NoteField
          id='category-description'
          label='Description'
          value={form.description ?? ''}
          onChange={value => setForm(current => ({ ...current, description: value }))}
          helper='Shown to creators when they pick a subject.'
        />

        <ParentSelect
          value={form.parent_uuid ?? ''}
          currentUuid={editing?.category?.uuid}
          onChange={value => setForm(current => ({ ...current, parent_uuid: value || null }))}
        />

        <div className='flex items-center justify-between gap-4'>
          <div>
            <Label htmlFor='category-active' className='text-sm font-semibold'>
              Active
            </Label>
            <p className='text-muted-foreground text-xs'>
              Inactive categories stay on existing courses but cannot be picked.
            </p>
          </div>
          <Switch
            id='category-active'
            checked={form.is_active}
            onCheckedChange={checked => setForm(current => ({ ...current, is_active: checked }))}
          />
        </div>
      </FormSheet>

      <ConfirmDialog
        open={confirmSave}
        onOpenChange={setConfirmSave}
        action='saveCategory'
        subject={{ name: form.name.trim() || 'this category' }}
        note={form.description ? noteToPlainText(form.description) : undefined}
        isPending={saveCategory.isPending}
        onConfirm={() =>
          saveCategory.mutate(
            { uuid: editing?.category?.uuid, values: form },
            {
              onSuccess: () => {
                setConfirmSave(false);
                setEditing(null);
              },
            }
          )
        }
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={open => {
          if (!open) setDeleting(null);
        }}
        action='deleteCategory'
        subject={{
          name: deleting?.name ?? '',
          detail: courseCount.count ? `${courseCount.count} course(s)` : 'the courses that use it',
          confirmValue: deleting?.name ?? '',
        }}
        isPending={deleteCategory.isPending}
        onConfirm={() => {
          if (!deleting?.uuid) return;
          deleteCategory.mutate(
            { uuid: deleting.uuid, name: deleting.name },
            {
              onSuccess: () => {
                setDeleting(null);
                setSelected(null);
              },
            }
          );
        }}
      />
    </div>
  );
}

/** The same warning sits on every unguarded config screen. */
export function SecurityBanner() {
  return (
    <div className='border-warning/40 bg-warning/5 flex gap-3 rounded-md border p-4'>
      <ShieldAlert className='text-warning mt-0.5 size-4 shrink-0' />
      <div className='space-y-1'>
        <p className='text-foreground text-sm font-semibold'>
          These settings are not protected yet
        </p>
        <p className='text-muted-foreground text-sm'>
          The config endpoints behind this page have no authorization check, so any signed-in user
          can change them through the API. Locking them to platform admins is the first backend fix
          on the list.
        </p>
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  depth,
  isSelected,
  onSelect,
  expanded,
  onToggle,
  hasToggle,
}: {
  category: Category;
  depth: number;
  isSelected: boolean;
  onSelect: () => void;
  expanded?: boolean;
  onToggle?: () => void;
  hasToggle?: boolean;
}) {
  return (
    <div
      className={cn(
        'hover:bg-muted/40 flex items-center gap-2 px-3 py-2 transition-colors',
        isSelected && 'bg-primary/5'
      )}
      style={{ paddingLeft: 12 + depth * 20 }}
    >
      {hasToggle ? (
        <button
          type='button'
          aria-label={expanded ? `Collapse ${category.name}` : `Expand ${category.name}`}
          onClick={onToggle}
          className='text-muted-foreground hover:text-foreground'
        >
          {expanded ? <ChevronDown className='size-4' /> : <ChevronRight className='size-4' />}
        </button>
      ) : (
        <span className='size-4' />
      )}
      <button type='button' onClick={onSelect} className='flex flex-1 items-center gap-2 text-left'>
        <span className='text-foreground text-sm font-medium'>{category.name}</span>
        {category.is_active === false ? <StatusBadge status='inactive' /> : null}
      </button>
    </div>
  );
}

function CategoryBranch({
  category,
  depth,
  selectedUuid,
  onSelect,
}: {
  category: Category;
  depth: number;
  selectedUuid?: string;
  onSelect: (category: Category) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const children = useSubCategories(category.uuid, expanded);

  return (
    <li>
      <CategoryRow
        category={category}
        depth={depth}
        hasToggle
        expanded={expanded}
        onToggle={() => setExpanded(value => !value)}
        isSelected={selectedUuid === category.uuid}
        onSelect={() => onSelect(category)}
      />
      {expanded ? (
        <ul className='divide-border/60 divide-y'>
          {children.query.isLoading ? (
            <li className='text-muted-foreground px-3 py-2 text-xs' style={{ paddingLeft: 32 + depth * 20 }}>
              Loading subcategories…
            </li>
          ) : children.categories.length === 0 ? (
            <li className='text-muted-foreground px-3 py-2 text-xs' style={{ paddingLeft: 32 + depth * 20 }}>
              No subcategories.
            </li>
          ) : (
            children.categories.map(child => (
              <CategoryBranch
                key={child.uuid}
                category={child}
                depth={depth + 1}
                selectedUuid={selectedUuid}
                onSelect={onSelect}
              />
            ))
          )}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * Parent picker. The API has no cycle check, so a category can never be offered itself
 * or one of the roots it already sits under.
 */
function ParentSelect({
  value,
  currentUuid,
  onChange,
}: {
  value: string;
  currentUuid?: string;
  onChange: (value: string) => void;
}) {
  const { categories } = useRootCategories();

  const options = useMemo(
    () => categories.filter(category => category.uuid !== currentUuid),
    [categories, currentUuid]
  );

  return (
    <div className='space-y-1.5'>
      <Label htmlFor='category-parent' className='text-sm font-semibold'>
        Parent category
      </Label>
      <Select value={value || 'root'} onValueChange={next => onChange(next === 'root' ? '' : next)}>
        <SelectTrigger id='category-parent' className='rounded-md'>
          <SelectValue placeholder='Top level' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='root'>Top level</SelectItem>
          {options.map(option => (
            <SelectItem key={option.uuid} value={option.uuid ?? ''}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className='text-muted-foreground text-xs'>
        A parent cannot be cleared once it is set — the API skips a null parent on update.
      </p>
    </div>
  );
}
