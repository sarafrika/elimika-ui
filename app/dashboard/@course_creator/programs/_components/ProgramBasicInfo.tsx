'use client';

import { useQuery } from '@tanstack/react-query';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import {
    getAllCategoriesOptions
} from '@/services/client/@tanstack/react-query.gen';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select';
import { Textarea } from '../../../../../components/ui/textarea';

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
        setFormData(initialData);
        setSelectedCategories(initialData.categories ?? []);
    }, [initialData]);

    const handleChange = <K extends keyof ProgramFormData>(
        field: K,
        value: ProgramFormData[K]
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
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
        const updated = selectedCategories.filter((c) => c !== uuid);
        setSelectedCategories(updated);
        handleChange('categories', updated);
    };

    const getCategoryName = (uuid: string) =>
        categories.find((c) => c.uuid === uuid)?.name ?? uuid;

    const hasChanges = useMemo(() => {
        const normalizeString = (str: string | undefined) => (str ?? '').trim();

        if (normalizeString(formData.title) !== normalizeString(initialData.title)) return true;
        if (normalizeString(formData.description) !== normalizeString(initialData.description)) return true;
        if (normalizeString(formData.program_type) !== normalizeString(initialData.program_type)) return true;
        if (normalizeString(formData.objectives) !== normalizeString(initialData.objectives)) return true;
        if (normalizeString(formData.prerequisites) !== normalizeString(initialData.prerequisites)) return true;
        if (formData.class_limit !== initialData.class_limit) return true;
        if (formData.price !== initialData.price) return true;

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
        if (!formData.description.trim())
            nextErrors.description = 'Description is required';
        if (formData.class_limit < 1)
            nextErrors.class_limit = 'Class limit must be at least 1';
        if (formData.price < 0)
            nextErrors.price = 'Price cannot be negative';

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isEditing && !hasChanges && onContinue) {
            onContinue();
            return;
        }

        if (validate()) {
            onSubmit(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='rounded-lg border border-border p-6'>
                <div className='mb-4 flex items-center justify-between'>
                    <h3 className='text-lg font-semibold text-foreground'>
                        Program Information
                    </h3>

                    {isEditing && (
                        <div className="flex items-center gap-2">
                            {hasChanges ? (
                                <span className="flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
                                    <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                                    Unsaved changes
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                                    No changes
                                </span>
                            )}
                        </div>
                    )}

                </div>

                <div className='mb-10 space-y-5'>
                    {/* Title */}
                    <div>
                        <Label className='mb-2 block text-sm font-medium text-foreground'>
                            Program Title *
                        </Label>
                        <Input
                            type='text'
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            className={`w-full rounded-lg border ${errors.title ? 'border-destructive' : 'border-border'
                                } px-4 py-2 focus:border-primary focus:outline-none`}
                        />
                        {errors.title && (
                            <p className='mt-1 text-sm text-destructive'>{errors.title}</p>
                        )}
                    </div>

                    {/* Program Type */}
                    <div>
                        <Label className='mb-2 block text-sm font-medium text-foreground'>
                            Program Type
                        </Label>
                        <Input
                            type='text'
                            value={formData.program_type ?? ''}
                            onChange={(e) => handleChange('program_type', e.target.value)}
                            className='w-full rounded-lg border border-border px-4 py-2 focus:border-primary focus:outline-none'
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <Label className='mb-2 block text-sm font-medium text-foreground'>
                            Description *
                        </Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={4}
                            className={`w-full rounded-lg border ${errors.description ? 'border-destructive' : 'border-border'
                                } px-4 py-2 focus:border-primary focus:outline-none`}
                        />
                        {errors.description && (
                            <p className='mt-1 text-sm text-destructive'>{errors.description}</p>
                        )}
                    </div>

                    {/* Objectives */}
                    <div>
                        <Label className='mb-2 block text-sm font-medium text-foreground'>
                            Learning Objectives
                        </Label>
                        <Textarea
                            value={formData.objectives ?? ''}
                            onChange={(e) => handleChange('objectives', e.target.value)}
                            rows={3}
                            className='w-full rounded-lg border border-border px-4 py-2 focus:border-primary focus:outline-none'
                        />
                    </div>

                    {/* Prerequisites */}
                    <div>
                        <Label className='mb-2 block text-sm font-medium text-foreground'>
                            Prerequisites
                        </Label>
                        <Textarea
                            value={formData.prerequisites ?? ''}
                            onChange={(e) => handleChange('prerequisites', e.target.value)}
                            rows={3}
                            className='w-full rounded-lg border border-border px-4 py-2 focus:border-primary focus:outline-none'
                        />
                    </div>

                    {/* Currency & Price */}
                    <div className='grid gap-4 md:grid-cols-2'>
                        <div>
                            <Label className='mb-2 block text-sm font-medium text-foreground'>
                                Currency *
                            </Label>
                            <Input
                                type='text'
                                value={'KES'}
                                disabled
                                className='w-full rounded-lg border border-border bg-muted px-4 py-2'
                            />
                        </div>

                        <div>
                            <Label className='mb-2 block text-sm font-medium text-foreground'>
                                Price *
                            </Label>
                            <Input
                                type='number'
                                min={0}
                                step='0.01'
                                value={formData.price}
                                onChange={(e) => handleChange('price', Number(e.target.value))}
                                className={`w-full rounded-lg border ${errors.price ? 'border-destructive' : 'border-border'
                                    } px-4 py-2`}
                            />
                            {errors.price && (
                                <p className='mt-1 text-sm text-destructive'>{errors.price}</p>
                            )}
                        </div>
                    </div>

                    {/* Class Limit & Categories */}
                    <div className='grid gap-4 md:grid-cols-2'>
                        <div>
                            <Label className='mb-2 block text-sm font-medium text-foreground'>
                                Class Limit *
                            </Label>
                            <Input
                                type='number'
                                min={1}
                                value={formData.class_limit}
                                onChange={(e) => handleChange('class_limit', Number(e.target.value))}
                                className={`w-full rounded-lg border ${errors.class_limit ? 'border-destructive' : 'border-border'
                                    } px-4 py-2`}
                            />
                            {errors.class_limit && (
                                <p className='mt-1 text-sm text-destructive'>{errors.class_limit}</p>
                            )}
                        </div>

                        <div className='w-full'>
                            <Label className='mb-2 block text-sm font-medium text-foreground'>
                                Categories
                            </Label>

                            <Select value='' onValueChange={handleAddCategory}>
                                <SelectTrigger className='w-full'>
                                    <SelectValue placeholder='Add category' />
                                </SelectTrigger>

                                <SelectContent className='w-full'>
                                    {categories
                                        .filter((c) => !selectedCategories.includes(c.uuid))
                                        .map((c) => (
                                            <SelectItem key={c.uuid} value={c.uuid}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>

                            {selectedCategories.length > 0 && (
                                <div className='mt-3 flex w-full flex-wrap gap-2'>
                                    {selectedCategories.map((uuid) => (
                                        <div
                                            key={uuid}
                                            className='flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary'
                                        >
                                            {getCategoryName(uuid)}
                                            <button
                                                type='button'
                                                onClick={() => handleRemoveCategory(uuid)}
                                                className='text-primary hover:text-primary/80'
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className='flex justify-end gap-3'>
                <Button
                    type='button'
                    variant={'ghost'}
                    onClick={onCancel}
                    disabled={isLoading}
                    className='rounded-lg border border-border px-6 py-2 text-foreground'
                >
                    Cancel
                </Button>

                <Button
                    type='submit'
                    disabled={isLoading}
                    className='rounded-lg bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90'
                >
                    {isLoading ? (
                        'Saving...'
                    ) : isEditing ? (
                        hasChanges ? 'Update & Continue' : 'Continue'
                    ) : (
                        'Create & Continue'
                    )}
                </Button>
            </div>
        </form>
    );
};

export default ProgramBasicInfo;