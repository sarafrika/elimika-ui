'use client';

import { useQuery } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import {
    getAllCategoriesOptions,
    getAllInstructorsOptions,
} from '@/services/client/@tanstack/react-query.gen';


type Category = {
    uuid: string;
    name: string;
};

type Instructor = {
    uuid: string;
    first_name: string;
    last_name: string;
};

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
    isLoading: boolean;
    isEditing: boolean;
};

const ProgramBasicInfo = ({
    initialData,
    onSubmit,
    onCancel,
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

    const { data: instructorsData } = useQuery(
        getAllInstructorsOptions({
            query: { pageable: { page: 0, size: 100 } },
        })
    );

    const categories = categoriesData?.data?.content ?? [];
    const instructors = instructorsData?.data?.content ?? [];

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

    const getInstructorName = (uuid: string) => {
        const inst = instructors.find((i) => i.uuid === uuid);
        return inst ? `${inst.full_name}` : uuid;
    };

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
        if (validate()) onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='rounded-lg border border-border p-6'>
                <h3 className='mb-4 text-lg font-semibold text-foreground'>
                    Program Information
                </h3>

                <div className='space-y-5'>
                    {/* Title */}
                    <div>
                        <label className='mb-2 block text-sm font-medium text-foreground'>
                            Program Title *
                        </label>
                        <input
                            type='text'
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            className={`w-full rounded-lg border ${errors.title ? 'border-destructive' : 'border-border'
                                } px-4 py-2 focus:border-primary focus:outline-none`}
                        />
                        {errors.title && (
                            <p className='mt-1 text-sm text-destructive'>
                                {errors.title}
                            </p>
                        )}
                    </div>

                    {/* Program Type */}
                    <div>
                        <label className='mb-2 block text-sm font-medium text-foreground'>
                            Program Type
                        </label>
                        <input
                            type='text'
                            value={formData.program_type ?? ''}
                            onChange={(e) =>
                                handleChange('program_type', e.target.value)
                            }
                            className='w-full rounded-lg border border-border px-4 py-2 focus:border-primary focus:outline-none'
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className='mb-2 block text-sm font-medium text-foreground'>
                            Description *
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                handleChange('description', e.target.value)
                            }
                            rows={4}
                            className={`w-full rounded-lg border ${errors.description
                                ? 'border-destructive'
                                : 'border-border'
                                } px-4 py-2 focus:border-primary focus:outline-none`}
                        />
                        {errors.description && (
                            <p className='mt-1 text-sm text-destructive'>
                                {errors.description}
                            </p>
                        )}
                    </div>

                    {/* Objectives */}
                    <div>
                        <label className='mb-2 block text-sm font-medium text-foreground'>
                            Learning Objectives
                        </label>
                        <textarea
                            value={formData.objectives ?? ''}
                            onChange={(e) =>
                                handleChange('objectives', e.target.value)
                            }
                            rows={3}
                            className='w-full rounded-lg border border-border px-4 py-2 focus:border-primary focus:outline-none'
                        />
                    </div>

                    {/* Prerequisites */}
                    <div>
                        <label className='mb-2 block text-sm font-medium text-foreground'>
                            Prerequisites
                        </label>
                        <textarea
                            value={formData.prerequisites ?? ''}
                            onChange={(e) =>
                                handleChange('prerequisites', e.target.value)
                            }
                            rows={3}
                            className='w-full rounded-lg border border-border px-4 py-2 focus:border-primary focus:outline-none'
                        />
                    </div>

                    {/* Class Limit & Price */}
                    <div className='grid gap-4 md:grid-cols-2'>
                        <div>
                            <label className='mb-2 block text-sm font-medium text-foreground'>
                                Class Limit *
                            </label>
                            <input
                                type='number'
                                min={1}
                                value={formData.class_limit}
                                onChange={(e) =>
                                    handleChange('class_limit', Number(e.target.value))
                                }
                                className={`w-full rounded-lg border ${errors.class_limit
                                    ? 'border-destructive'
                                    : 'border-border'
                                    } px-4 py-2`}
                            />
                        </div>

                        <div>
                            <label className='mb-2 block text-sm font-medium text-foreground'>
                                Price ($) *
                            </label>
                            <input
                                type='number'
                                min={0}
                                step='0.01'
                                value={formData.price}
                                onChange={(e) =>
                                    handleChange('price', Number(e.target.value))
                                }
                                className={`w-full rounded-lg border ${errors.price
                                    ? 'border-destructive'
                                    : 'border-border'
                                    } px-4 py-2`}
                            />
                        </div>
                    </div>

                    {/* Instructor & Categories */}
                    <div className='grid gap-4 md:grid-cols-2'>
                        <div>
                            <label className='mb-2 block text-sm font-medium text-foreground'>
                                Instructor *
                            </label>
                            <Select
                                value={formData.instructor_uuid ?? ''}
                                onValueChange={(v) =>
                                    handleChange('instructor_uuid', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder='Select instructor' />
                                </SelectTrigger>
                                <SelectContent>
                                    {instructors.map((i) => (
                                        <SelectItem key={i.uuid} value={i.uuid}>
                                            {i.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {formData.instructor_uuid && (
                                <p className='mt-1 text-xs text-muted-foreground'>
                                    Selected:{' '}
                                    {getInstructorName(formData.instructor_uuid)}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className='mb-2 block text-sm font-medium text-foreground'>
                                Categories
                            </label>
                            <Select value='' onValueChange={handleAddCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder='Add category' />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories
                                        .filter(
                                            (c) => !selectedCategories.includes(c.uuid)
                                        )
                                        .map((c) => (
                                            <SelectItem key={c.uuid} value={c.uuid}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>

                            {selectedCategories.length > 0 && (
                                <div className='mt-3 flex flex-wrap gap-2'>
                                    {selectedCategories.map((uuid) => (
                                        <div
                                            key={uuid}
                                            className='flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary'
                                        >
                                            {getCategoryName(uuid)}
                                            <button
                                                type='button'
                                                onClick={() =>
                                                    handleRemoveCategory(uuid)
                                                }
                                                className='text-primary'
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
                <button
                    type='button'
                    onClick={onCancel}
                    disabled={isLoading}
                    className='rounded-lg border border-border px-6 py-2 text-foreground'
                >
                    Cancel
                </button>
                <button
                    type='submit'
                    disabled={isLoading}
                    className='rounded-lg bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90'
                >
                    {isLoading
                        ? 'Saving...'
                        : isEditing
                            ? 'Update & Continue'
                            : 'Create & Continue'}
                </button>
            </div>
        </form>
    );
};

export default ProgramBasicInfo;
