'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { getErrorMessage } from '@/lib/error-utils';
import {
  createCategoryMutation,
  getAllCategoriesQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import type { Category } from '@/services/client/types.gen';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import type { ProgramFormValues } from '../program-schema';

export function ProgramCategories({ categories }: { categories: Category[] }) {
  const { control, getValues, setValue } = useFormContext<ProgramFormValues>();
  const selected = useWatch({ control, name: 'categoryUuids' });
  const queryClient = useQueryClient();
  const id = useId();
  const [parentUuid, setParentUuid] = useState<string>();
  const [open, setOpen] = useState(false);
  const [newParentUuid, setNewParentUuid] = useState('');
  const [name, setName] = useState('');
  const [created, setCreated] = useState<Category[]>([]);
  const available = useMemo(
    () => [...categories, ...created.filter(row => !categories.some(cat => cat.uuid === row.uuid))],
    [categories, created]
  );
  const roots = useMemo(() => available.filter(cat => cat.uuid && !cat.parent_uuid), [available]);
  const primary = available.find(cat => cat.uuid === selected[0]);
  const activeParent = parentUuid ?? primary?.parent_uuid ?? primary?.uuid ?? '';
  const children = useMemo(
    () => available.filter(cat => cat.uuid && cat.parent_uuid === activeParent),
    [available, activeParent]
  );
  const append = (...uuids: string[]) => {
    setValue('categoryUuids', [...new Set([...getValues('categoryUuids'), ...uuids])], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };
  const create = useMutation({
    ...createCategoryMutation(),
    onSuccess: (response, variables) => {
      if (response.error || response.success === false) {
        toast.error(response.message || 'Unable to add subcategory');
        return;
      }
      const category = response.data;
      if (!category?.uuid) {
        toast.error('The subcategory response was incomplete. Please try again.');
        return;
      }
      setCreated(current => [...current, category]);
      const parent = variables.body.parent_uuid;
      if (parent) {
        setParentUuid(parent);
        append(parent, category.uuid);
      }
      setOpen(false);
      setName('');
      toast.success('Subcategory added');
      void queryClient.invalidateQueries({ queryKey: getAllCategoriesQueryKey({}) });
    },
    onError: error => toast.error(getErrorMessage(error, 'Unable to add subcategory')),
  });

  return (
    <>
      <FormField
        control={control}
        name='categoryUuids'
        render={({ field }) => (
          <FormItem>
            <div className='grid items-start gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <FormLabel>Category</FormLabel>
                <Select
                  value={activeParent}
                  onValueChange={uuid => {
                    setParentUuid(uuid);
                    append(uuid);
                  }}
                  disabled={!roots.length}
                >
                  <FormControl>
                    <SelectTrigger ref={field.ref} onBlur={field.onBlur} className='w-full'>
                      <SelectValue placeholder='Select category' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roots.map(cat => (
                      <SelectItem key={cat.uuid} value={cat.uuid!}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor={`${id}-subcategory`}>Subcategory</Label>
                <div className='flex items-center gap-2'>
                  <Select
                    value=''
                    onValueChange={uuid => append(activeParent, uuid)}
                    disabled={!activeParent}
                  >
                    <SelectTrigger id={`${id}-subcategory`} className='min-w-0 flex-1'>
                      <SelectValue
                        placeholder={
                          activeParent ? 'Select subcategory' : 'Select a category first'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {children
                        .filter(cat => !selected.includes(cat.uuid!))
                        .map(cat => (
                          <SelectItem key={cat.uuid} value={cat.uuid!}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      {!children.some(cat => !selected.includes(cat.uuid!)) && (
                        <p className='text-muted-foreground px-2 py-2 text-sm'>
                          No more subcategories available. Add a new one.
                        </p>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    className='shrink-0'
                    aria-label='Add subcategory'
                    title='Add subcategory'
                    disabled={!roots.length}
                    onClick={() => {
                      setNewParentUuid(activeParent);
                      setName('');
                      setOpen(true);
                    }}
                  >
                    <Plus className='size-4' />
                  </Button>
                </div>
              </div>
            </div>
            {field.value.length > 0 && (
              <div
                className='flex flex-wrap gap-2'
                aria-label='Selected categories and subcategories'
              >
                {field.value.map((uuid, index) => {
                  const label = available.find(cat => cat.uuid === uuid)?.name ?? uuid;
                  return (
                    <Badge key={uuid} variant='secondary' className='gap-1'>
                      {label}
                      {index === 0 && ' (Primary)'}
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='h-6 w-6'
                        aria-label={`Remove ${label}`}
                        onClick={() => field.onChange(field.value.filter(value => value !== uuid))}
                      >
                        <X className='size-3' />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            )}
            <FormDescription>
              Select one or more. The first selection is the program’s primary category.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <Dialog open={open} onOpenChange={next => !create.isPending && setOpen(next)}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Add subcategory</DialogTitle>
            <DialogDescription>Create a subcategory under an existing category.</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-2'>
            <div className='space-y-2'>
              <Label htmlFor={`${id}-parent`}>Parent category</Label>
              <Select
                value={newParentUuid}
                onValueChange={setNewParentUuid}
                disabled={create.isPending}
              >
                <SelectTrigger id={`${id}-parent`} className='w-full'>
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
                  {roots.map(cat => (
                    <SelectItem key={cat.uuid} value={cat.uuid!}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor={`${id}-name`}>Subcategory name</Label>
              <Input
                id={`${id}-name`}
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder='e.g. Web Design'
                disabled={create.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              disabled={create.isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type='button'
              disabled={create.isPending || !newParentUuid || !name.trim()}
              onClick={() =>
                create.mutate({ body: { name: name.trim(), parent_uuid: newParentUuid } })
              }
            >
              {create.isPending && <Spinner />}Add subcategory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
