import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    FormControl,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { createCategoryMutation, getAllCategoriesOptions, getAllCategoriesQueryKey } from '../services/client/@tanstack/react-query.gen';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import Spinner from './ui/spinner';

interface AddCategoryFormItemProps {
    field: {
        value: string;
        onChange: (value: string) => void;
    };
}

export const AddCategoryFormItem: React.FC<AddCategoryFormItemProps> = ({ field }) => {
    const [categoryInput, setCategoryInput] = useState('');
    const dialogCloseRef = useRef<HTMLButtonElement>(null);
    const queryClient = useQueryClient();

    // Fetch categories
    const { data: categories } = useQuery(
        getAllCategoriesOptions({
            query: { pageable: { page: 0, size: 100 } },
        })
    );

    const createCategory = useMutation(createCategoryMutation())

    const selectedCategory = categories?.data?.content?.find((c: any) => c.uuid === field.value);

    return (
        <FormItem>
            <FormLabel>Category</FormLabel>

            <div className="mb-1 flex items-center gap-2">
                <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl className="w-full">
                        <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <div className="max-h-[250px] overflow-auto">
                            {categories?.data?.content?.map((cat: any) => (
                                <SelectItem key={cat.uuid} value={cat.uuid}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </div>
                    </SelectContent>
                </Select>

                {/* Dialog to add new category */}
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="hidden sm:flex">
                            Add new
                        </Button>
                    </DialogTrigger>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="flex sm:hidden">
                            <Plus />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-full sm:max-w-[350px]">
                        <DialogHeader>
                            <DialogTitle>Add new category</DialogTitle>
                            <DialogDescription>Add a new category here.</DialogDescription>
                        </DialogHeader>
                        <div className="flex w-full items-center gap-2 py-2">
                            <div className="grid w-full gap-3">
                                <Label htmlFor="category-name">Category Name</Label>
                                <Input
                                    id="category-name"
                                    name="category"
                                    value={categoryInput}
                                    onChange={(e) => setCategoryInput(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <DialogFooter className="justify-end">
                            <Button
                                type="button"
                                className="min-w-[75px]"
                                onClick={() => {
                                    if (categoryInput.trim()) {
                                        createCategory.mutate({ body: { name: categoryInput.trim() } }, {
                                            onSuccess: (data: any) => {
                                                if (data?.error) {
                                                    if (data.error.error?.toLowerCase().includes('duplicate key')) {
                                                        toast.error('Category already exists');
                                                    } else {
                                                        toast.error('Failed to add category');
                                                    }
                                                } else {
                                                    toast.success(data?.message || 'Category added');
                                                }

                                                dialogCloseRef.current?.click();
                                                setCategoryInput('');
                                            },
                                            onSettled: () => {
                                                queryClient.invalidateQueries({
                                                    queryKey: getAllCategoriesQueryKey({ query: { pageable: {} } })
                                                });
                                            }
                                        });
                                    }
                                }}
                                disabled={createCategory.isPending}
                            >
                                {createCategory.isPending ? <Spinner /> : 'Add'}
                            </Button>
                            <DialogClose asChild>
                                <button ref={dialogCloseRef} style={{ display: 'none' }} />
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Display selected category */}
            {field.value && selectedCategory && (
                <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                        {selectedCategory.name}
                        <button
                            type="button"
                            className="ml-1 text-red-500 hover:text-red-700"
                            onClick={() => field.onChange('')}
                        >
                            ✕
                        </button>
                    </Badge>
                </div>
            )}
            <FormMessage />
        </FormItem>
    );
};
