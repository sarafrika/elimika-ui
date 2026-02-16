'use client';

import { useQuery } from '@tanstack/react-query';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import { getAllCategoriesOptions } from '@/services/client/@tanstack/react-query.gen';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';
import { Textarea } from '../../../../../components/ui/textarea';
import { Switch } from '../../../../../components/ui/switch';

type ProgramFormData = {
  title: string;
  description: string;
  program_type?: string;
  objectives?: string;
  prerequisites?: string;
  class_limit: number;
  price: number;
  instructor_uuid?: string;
  categories: string[];
  category_uuid: string;
  active: boolean;
};

type FormErrors = Partial<Record<keyof ProgramFormData, string>>;

type Props = {
  initialData: ProgramFormData;
  onSubmit: (data: ProgramFormData) => void;
  onCancel: () => void;
  onContinue?: () => void;
  isLoading: boolean;
  isEditing: boolean;
};

const ProgramBasicInfo = ({
  initialData,
  onSubmit,
  onCancel,
  onContinue,
  isLoading,
  isEditing,
}: Props) => {
  const [formData, setFormData] = useState<ProgramFormData>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialData.categories ?? []
  );

  const { data: categoriesData } = useQuery(
    getAllCategoriesOptions({
      query: { pageable: { page: 0, size: 100 } },
    })
  );

  const categories = categoriesData?.data?.content ?? [];

  useEffect(() => {
    setFormData({ ...initialData, category_uuid: selectedCategories[0] });
    setSelectedCategories(initialData.categories ?? []);
  }, [initialData]);

  const handleChange = <K extends keyof ProgramFormData>(field: K, value: ProgramFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAddCategory = (uuid: string) => {
    if (!selectedCategories.includes(uuid)) {
      const updated = [...selectedCategories, uuid];
      setSelectedCategories(updated);
      handleChange('categories', updated);
    }
  };

  const handleRemoveCategory = (uuid: string) => {
    const updated = selectedCategories.filter(c => c !== uuid);
    setSelectedCategories(updated);
    handleChange('categories', updated);
  };

  const getCategoryName = (uuid: string) => categories.find(c => c.uuid === uuid)?.name ?? uuid;

  const hasChanges = useMemo(() => {
    const normalizeString = (str: string | undefined) => (str ?? '').trim();

    if (normalizeString(formData.title) !== normalizeString(initialData.title)) return true;
    if (normalizeString(formData.description) !== normalizeString(initialData.description))
      return true;
    if (normalizeString(formData.program_type) !== normalizeString(initialData.program_type))
      return true;
    if (normalizeString(formData.objectives) !== normalizeString(initialData.objectives))
      return true;
    if (normalizeString(formData.prerequisites) !== normalizeString(initialData.prerequisites))
      return true;
    if (formData.class_limit !== initialData.class_limit) return true;
    if (formData.price !== initialData.price) return true;
    if (formData.active !== initialData.active) return true;

    const initialCategories = initialData.categories ?? [];
    const currentCategories = formData.categories ?? [];

    if (initialCategories.length !== currentCategories.length) return true;

    const sortedInitial = [...initialCategories].sort();
    const sortedCurrent = [...currentCategories].sort();

    for (let i = 0; i < sortedInitial.length; i++) {
      if (sortedInitial[i] !== sortedCurrent[i]) return true;
    }

    return false;
  }, [formData, initialData]);

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!formData.title.trim()) nextErrors.title = 'Title is required';
    if (!formData.description.trim()) nextErrors.description = 'Description is required';
    if (formData.class_limit < 1) nextErrors.class_limit = 'Class limit must be at least 1';
    if (formData.price < 0) nextErrors.price = 'Price cannot be negative';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // If editing and no changes, just continue to next step
    if (isEditing && !hasChanges) {
      if (onContinue) {
        onContinue();
      }
      return; // Don't call onSubmit
    }

    // If there are changes or creating new, validate and submit
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4 md:space-y-6'>
      <div className='border-border rounded-lg border p-4 md:p-6'>
        <div className='mb-3 flex flex-col gap-2 md:mb-4 md:flex-row md:items-center md:justify-between'>
          <h3 className='text-md text-foreground font-semibold md:text-lg'>Program Information</h3>

          {isEditing && (
            <div className='flex items-center gap-2'>
              {hasChanges ? (
                <span className='bg-warning/10 text-warning flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium md:px-3 md:py-1 md:text-xs'>
                  <span className='bg-warning h-1.5 w-1.5 rounded-full' />
                  Unsaved changes
                </span>
              ) : (
                <span className='bg-success/10 text-success flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium md:px-3 md:py-1 md:text-xs'>
                  <span className='bg-success h-1.5 w-1.5 rounded-full' />
                  No changes
                </span>
              )}
            </div>
          )}
        </div>

        <div className='mb-6 space-y-4 md:mb-10 md:space-y-5'>
          {/* Title */}
          <div>
            <Label className='text-foreground mb-1.5 block text-xs font-medium md:mb-2 md:text-sm'>
              Program Title *
            </Label>
            <Input
              type='text'
              value={formData.title}
              onChange={e => handleChange('title', e.target.value)}
              className={`w-full rounded-lg border ${
                errors.title ? 'border-destructive' : 'border-border'
              } focus:border-primary md:text-md px-3 py-2 text-sm focus:outline-none md:px-4`}
            />
            {errors.title && (
              <p className='text-destructive mt-1 text-xs md:text-sm'>{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label className='text-foreground mb-1.5 block text-xs font-medium md:mb-2 md:text-sm'>
              Description *
            </Label>
            <Textarea
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              rows={4}
              className={`w-full rounded-lg border ${
                errors.description ? 'border-destructive' : 'border-border'
              } focus:border-primary md:text-md px-3 py-2 text-sm focus:outline-none md:px-4`}
            />
            {errors.description && (
              <p className='text-destructive mt-1 text-xs md:text-sm'>{errors.description}</p>
            )}
          </div>

          {/* Objectives */}
          <div>
            <Label className='text-foreground mb-1.5 block text-xs font-medium md:mb-2 md:text-sm'>
              Learning Objectives
            </Label>
            <Textarea
              value={formData.objectives ?? ''}
              onChange={e => handleChange('objectives', e.target.value)}
              rows={3}
              className='border-border focus:border-primary md:text-md w-full rounded-lg border px-3 py-2 text-sm focus:outline-none md:px-4'
            />
          </div>

          {/* Prerequisites */}
          <div>
            <Label className='text-foreground mb-1.5 block text-xs font-medium md:mb-2 md:text-sm'>
              Prerequisites
            </Label>
            <Textarea
              value={formData.prerequisites ?? ''}
              onChange={e => handleChange('prerequisites', e.target.value)}
              rows={3}
              className='border-border focus:border-primary md:text-md w-full rounded-lg border px-3 py-2 text-sm focus:outline-none md:px-4'
            />
          </div>

          {/* Currency & Price */}
          <div className='grid gap-3 md:grid-cols-2 md:gap-4'>
            <div>
              <Label className='text-foreground mb-1.5 block text-xs font-medium md:mb-2 md:text-sm'>
                Currency *
              </Label>
              <Input
                type='text'
                value={'KES'}
                disabled
                className='border-border bg-muted md:text-md w-full rounded-lg border px-3 py-2 text-sm md:px-4'
              />
            </div>

            <div>
              <Label className='text-foreground mb-1.5 block text-xs font-medium md:mb-2 md:text-sm'>
                Price *
              </Label>
              <Input
                type='number'
                min={0}
                step='0.01'
                value={formData.price}
                onChange={e => handleChange('price', Number(e.target.value))}
                className={`w-full rounded-lg border ${
                  errors.price ? 'border-destructive' : 'border-border'
                } md:text-md px-3 py-2 text-sm md:px-4`}
              />
              {errors.price && (
                <p className='text-destructive mt-1 text-xs md:text-sm'>{errors.price}</p>
              )}
            </div>
          </div>

          {/* Class Limit & Categories */}
          <div className='grid gap-3 md:grid-cols-2 md:gap-4'>
            <div>
              <Label className='text-foreground mb-1.5 block text-xs font-medium md:mb-2 md:text-sm'>
                Class Limit *
              </Label>
              <Input
                type='number'
                min={1}
                value={formData.class_limit}
                onChange={e => handleChange('class_limit', Number(e.target.value))}
                className={`w-full rounded-lg border ${
                  errors.class_limit ? 'border-destructive' : 'border-border'
                } md:text-md px-3 py-2 text-sm md:px-4`}
              />
              {errors.class_limit && (
                <p className='text-destructive mt-1 text-xs md:text-sm'>{errors.class_limit}</p>
              )}
            </div>

            <div className='w-full'>
              <Label className='text-foreground mb-1.5 block text-xs font-medium md:mb-2 md:text-sm'>
                Categories
              </Label>

              <Select value='' onValueChange={handleAddCategory}>
                <SelectTrigger className='md:text-md w-full text-sm'>
                  <SelectValue placeholder='Add category' />
                </SelectTrigger>

                <SelectContent className='w-full'>
                  {categories
                    .filter(c => !selectedCategories.includes(c.uuid))
                    .map(c => (
                      <SelectItem key={c.uuid} value={c.uuid} className='md:text-md text-sm'>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {selectedCategories.length > 0 && (
                <div className='mt-2 flex w-full flex-wrap gap-1.5 md:mt-3 md:gap-2'>
                  {selectedCategories.map(uuid => (
                    <div
                      key={uuid}
                      className='bg-primary/10 text-primary flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs md:gap-2 md:px-3 md:py-1 md:text-sm'
                    >
                      <span className='max-w-[120px] truncate md:max-w-none'>
                        {getCategoryName(uuid)}
                      </span>
                      <button
                        type='button'
                        onClick={() => handleRemoveCategory(uuid)}
                        className='text-primary hover:text-primary/80 flex-shrink-0'
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className='border-border flex items-center justify-between rounded-lg border p-3 md:p-4'>
            <div>
              <Label className='text-sm font-medium'>Program Status</Label>
              <p className='text-muted-foreground text-xs'>
                Inactive programs are hidden from users
              </p>
            </div>

            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground text-xs'>
                {formData.active ? 'Active' : 'Inactive'}
              </span>
              <Switch
                checked={formData.active}
                onCheckedChange={checked => handleChange('active', checked)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className='flex flex-col gap-2 md:flex-row md:justify-end md:gap-3'>
        <Button
          type='button'
          variant={'ghost'}
          onClick={onCancel}
          disabled={isLoading}
          className='border-border text-foreground md:text-md w-full rounded-lg border px-4 py-2 text-sm md:w-auto md:px-6'
        >
          Cancel
        </Button>

        <Button
          type='submit'
          disabled={isLoading}
          className='bg-primary text-primary-foreground hover:bg-primary/90 md:text-md w-full rounded-lg px-4 py-2 text-sm md:w-auto md:px-6'
        >
          {isLoading
            ? 'Saving...'
            : isEditing
              ? hasChanges
                ? 'Update & Continue'
                : 'Continue'
              : 'Create & Continue'}
        </Button>
      </div>
    </form>
  );
};

export default ProgramBasicInfo;
