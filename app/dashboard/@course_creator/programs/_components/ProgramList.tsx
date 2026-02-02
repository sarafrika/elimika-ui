'use client';

import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { useState } from 'react';

import { Button } from '../../../../../components/ui/button';
import {
    deleteTrainingProgramMutation,
    getAllTrainingProgramsOptions,
    getAllTrainingProgramsQueryKey,
} from '../../../../../services/client/@tanstack/react-query.gen';

const ProgramsList = ({ onEdit, onPreview }: any) => {
    const qc = useQueryClient();

    const [deleteConfirm, setDeleteConfirm] =
        useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] =
        useState('ALL');

    const { data: programsData, isLoading } = useQuery(
        getAllTrainingProgramsOptions({
            query: { pageable: {} },
        })
    );

    const deleteProgramMut = useMutation({
        ...deleteTrainingProgramMutation(),
        onSuccess: () => {
            qc.invalidateQueries({
                queryKey:
                    getAllTrainingProgramsQueryKey({
                        query: { pageable: {} },
                    }),
            });
            setDeleteConfirm(null);
        },
    });

    const programs = programsData?.data?.content || [];

    const filteredPrograms = programs.filter(
        (program) => {
            const matchesSearch =
                program.title
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                program.description
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase());

            const matchesStatus =
                statusFilter === 'ALL' ||
                program.status === statusFilter;

            return matchesSearch && matchesStatus;
        }
    );

    const handleDelete = (uuid: string) => {
        deleteProgramMut.mutate({ path: { uuid } });
    };

    const getStatusClasses = (status: string) => {
        switch (status) {
            case 'PUBLISHED':
                return 'bg-primary/10 text-primary';
            case 'DRAFT':
                return 'bg-muted text-foreground';
            case 'ARCHIVED':
                return 'bg-secondary text-secondary-foreground';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    if (isLoading) {
        return (
            <div className='flex h-64 items-center justify-center'>
                <div className='text-muted-foreground'>
                    Loading programs...
                </div>
            </div>
        );
    }

    return (
        <div className='p-6'>
            {/* Filters */}
            <div className='mb-6 flex flex-wrap gap-4'>
                <div className='min-w-[300px] flex-1'>
                    <input
                        type='text'
                        placeholder='Search programs by title or description...'
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(e.target.value)
                        }
                        className='w-full rounded-lg border border-border px-4 py-2 focus:border-primary focus:outline-none'
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(e.target.value)
                    }
                    className='rounded-lg border border-border px-4 py-2 focus:border-primary focus:outline-none'
                >
                    <option value='ALL'>All Status</option>
                    <option value='published'>Published</option>
                    <option value='draft'>Draft</option>
                    {/* <option value='archived'>Archived</option> */}
                </select>
            </div>

            {/* Programs */}
            {filteredPrograms.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <div className='mb-4 text-6xl'>📚</div>
                    <h3 className='mb-2 text-lg font-semibold text-foreground'>
                        No programs found
                    </h3>
                    <p className='text-muted-foreground'>
                        {searchTerm || statusFilter !== 'ALL'
                            ? 'Try adjusting your filters'
                            : 'Create your first training program to get started'}
                    </p>
                </div>
            ) : (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    {filteredPrograms.map((program) => (
                        <div
                            key={program.uuid}
                            className='rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md'
                        >
                            {/* Header */}
                            <div className='mb-3 flex items-start justify-between'>
                                <div className='flex-1'>
                                    <h3 className='mb-1 line-clamp-2 font-semibold text-foreground'>
                                        {program.title}
                                    </h3>
                                    <span
                                        className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusClasses(
                                            program.status
                                        )}`}
                                    >
                                        {program.status}
                                    </span>
                                </div>
                            </div>

                            {/* Details */}
                            <div className='mb-4 space-y-2 text-sm text-muted-foreground'>
                                <p className='line-clamp-2'>
                                    {program.description}
                                </p>
                                <div className='flex items-center gap-4'>
                                    <span>
                                        👥 {program.class_limit} spots
                                    </span>
                                    <span>💰 ${program.price}</span>
                                </div>
                                {program.program_type && (
                                    <div className='text-xs text-muted-foreground'>
                                        {program.program_type}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className='flex gap-2 border-t border-border pt-4'>
                                <button
                                    onClick={() =>
                                        onPreview(program.uuid)
                                    }
                                    className='flex-1 rounded bg-muted px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/80'
                                >
                                    View Details
                                </button>
                                <button
                                    onClick={() => onEdit(program)}
                                    className='rounded bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20'
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() =>
                                        setDeleteConfirm(program.uuid)
                                    }
                                    className='rounded bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/20'
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Modal */}
            {deleteConfirm && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
                    <div className='w-full max-w-md rounded-lg bg-card p-6 shadow-xl'>
                        <h3 className='mb-2 text-lg font-semibold text-foreground'>
                            Delete Program?
                        </h3>
                        <p className='mb-6 text-muted-foreground'>
                            This action cannot be undone. All
                            program data will be permanently
                            removed.
                        </p>

                        <div className='flex justify-end gap-3'>
                            <Button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={deleteProgramMut.isPending}
                                variant={"ghost"}
                                className='rounded-lg border border-border px-4 py-2 font-medium text-foreground hover:bg-muted'
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() =>
                                    handleDelete(deleteConfirm)
                                }
                                disabled={deleteProgramMut.isPending}
                                className='rounded-lg bg-destructive px-4 py-2 font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50'
                            >
                                {deleteProgramMut.isPending
                                    ? 'Deleting...'
                                    : 'Delete Program'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgramsList;
