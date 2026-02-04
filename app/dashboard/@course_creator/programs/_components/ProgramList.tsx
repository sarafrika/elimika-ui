'use client';

import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { format } from 'date-fns';
import { Filter, PlusCircle, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { toast } from 'sonner';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../../../../components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../../../../components/ui/dialog';
import { Input } from '../../../../../components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../../../components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../../../components/ui/table';
import {
    deleteTrainingProgramMutation,
    searchTrainingProgramsOptions,
    searchTrainingProgramsQueryKey
} from '../../../../../services/client/@tanstack/react-query.gen';

type ProgramStatusFilter = 'all' | 'published' | 'draft' | 'archived';

const STATUS_OPTIONS: { label: string; value: ProgramStatusFilter }[] = [
    { label: 'All statuses', value: 'all' },
    { label: 'Published', value: 'published' },
    { label: 'Draft', value: 'draft' },
    { label: 'Archived', value: 'archived' },
];

const STATUS_BADGE: Record<
    string,
    { label: string; variant: 'secondary' | 'default' | 'outline' | 'destructive' }
> = {
    PUBLISHED: { label: 'Published', variant: 'default' },
    DRAFT: { label: 'Draft', variant: 'secondary' },
    ARCHIVED: { label: 'Archived', variant: 'outline' },
};

interface Program {
    uuid: string;
    title: string;
    description?: string;
    status: string;
    class_limit: number;
    price: number;
    program_type?: string;
    created_date?: string;
    updated_date?: string;
}

interface ProgramsListProps {
    onEdit: (program: Program) => void;
    onPreview: (uuid: string) => void;
    onCreate?: () => void;
    creator: any
}

const ProgramsList = ({ onEdit, onPreview, onCreate, creator }: ProgramsListProps) => {
    const qc = useQueryClient();

    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ProgramStatusFilter>('all');

    const { data: programsData, isLoading } = useQuery(
        searchTrainingProgramsOptions({
            query: {
                pageable: {}, searchParams: { course_creator_uuid_eq: creator?.profile?.uuid }
            },
        })
    );

    const programs = programsData?.data?.content || [];
    const filteredPrograms = useMemo(() => {
        return programs.filter((program) => {
            const matchesSearch =
                program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                program.description?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || program.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [programs, searchTerm, statusFilter]);

    const deleteProgramMut = useMutation(deleteTrainingProgramMutation());
    const handleDelete = (uuid: string) => {
        deleteProgramMut.mutate({ path: { uuid } },
            {
                onSuccess: () => {
                    qc.invalidateQueries({
                        queryKey: searchTrainingProgramsQueryKey({
                            query: { pageable: {}, searchParams: { course_creator_uuid_eq: creator?.profile?.uuid } },
                        }),
                    });
                    setDeleteConfirm(null);
                    toast.success("Program Deleted Successfully")
                },
            }
        );
    };

    if (isLoading) {
        return (
            <div className='flex h-64 items-center justify-center'>
                <div className='text-muted-foreground'>Loading programs...</div>
            </div>
        );
    }

    return (
        <div className='mx-auto w-full max-w-7xl space-y-6 px-4 pt-4 pb-10'>
            {/* Header */}
            <header className='flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
                <div>
                    <p className='text-muted-foreground mt-2 max-w-2xl text-sm'>
                        Monitor each training program&apos;s status, capacity, pricing, and type at a glance.
                    </p>
                </div>

                {onCreate && (
                    <Button onClick={onCreate}>
                        <PlusCircle className='mr-2 h-4 w-4' />
                        Create program
                    </Button>
                )}
            </header>

            {/* Main Card */}
            <Card>
                <CardHeader className='border-border/50 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between'>
                    <div>
                        <CardTitle className='text-base font-semibold'>Training programs</CardTitle>
                        <CardDescription>
                            {programs.length} program{programs.length === 1 ? '' : 's'} available.
                        </CardDescription>
                    </div>

                    <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
                        {/* Search Input */}
                        <Input
                            type='text'
                            placeholder='Search programs...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='w-full sm:w-[250px]'
                        />

                        {/* Status Filter */}
                        <div className='flex items-center gap-2'>
                            <Filter className='text-muted-foreground hidden h-4 w-4 sm:block' />
                            <Select
                                value={statusFilter}
                                onValueChange={(value) => setStatusFilter(value as ProgramStatusFilter)}
                            >
                                <SelectTrigger className='w-full sm:w-[180px]'>
                                    <SelectValue placeholder='Filter by status' />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className='p-0'>
                    {filteredPrograms.length === 0 ? (
                        <div className='flex flex-col items-center justify-center space-y-4 py-16 text-center'>
                            <p className='text-lg font-medium'>
                                {searchTerm || statusFilter !== 'all'
                                    ? 'No programs match this filter.'
                                    : 'No programs found.'}
                            </p>
                            <p className='text-muted-foreground text-sm'>
                                {searchTerm || statusFilter !== 'all'
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'Create your first training program to get started.'}
                            </p>
                            {onCreate && (
                                <Button variant='outline' onClick={onCreate}>
                                    <PlusCircle className='mr-2 h-4 w-4' />
                                    Create program
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className='w-[35%]'>Program</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Capacity</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Last updated</TableHead>
                                    <TableHead className='text-right'>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPrograms.map((program) => (
                                    <ProgramRow
                                        key={program.uuid}
                                        program={program}
                                        onEdit={onEdit}
                                        onPreview={onPreview}
                                        onDelete={setDeleteConfirm}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Program?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. All program data will be permanently removed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant='ghost'
                            onClick={() => setDeleteConfirm(null)}
                            disabled={deleteProgramMut.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant='destructive'
                            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                            disabled={deleteProgramMut.isPending}
                        >
                            {deleteProgramMut.isPending ? 'Deleting...' : 'Delete Program'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

interface ProgramRowProps {
    program: Program;
    onEdit: (program: Program) => void;
    onPreview: (uuid: string) => void;
    onDelete: (uuid: string) => void;
}

function ProgramRow({ program, onEdit, onPreview, onDelete }: ProgramRowProps) {
    const statusMeta = STATUS_BADGE[program.status] ?? {
        label: program.status,
        variant: 'secondary' as const,
    };

    return (
        <TableRow className='cursor-pointer hover:bg-muted/50'>
            <TableCell onClick={() => onPreview(program.uuid)}>
                <div className='flex flex-col gap-1'>
                    <span className='font-semibold leading-tight'>{program.title}</span>
                    <div className='text-muted-foreground text-xs'>
                        {program.description ? truncate(program.description, 80) : 'No description added yet.'}
                    </div>
                </div>
            </TableCell>
            <TableCell onClick={() => onPreview(program.uuid)}>
                <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
            </TableCell>
            <TableCell onClick={() => onPreview(program.uuid)}>
                <span className='text-sm'>{program.program_type || '—'}</span>
            </TableCell>
            <TableCell onClick={() => onPreview(program.uuid)}>
                <span className='font-medium'>{program.class_limit} spots</span>
            </TableCell>
            <TableCell onClick={() => onPreview(program.uuid)}>
                <span className='font-medium'>{formatCurrency(program.price)}</span>
            </TableCell>
            <TableCell onClick={() => onPreview(program.uuid)}>
                <span className='text-muted-foreground text-sm'>
                    {program.updated_date ? format(new Date(program.updated_date), 'dd MMM yyyy') : '—'}
                </span>
            </TableCell>
            <TableCell className='text-right'>
                <div className='flex items-center justify-end gap-2'>
                    <Button
                        size='sm'
                        variant='ghost'
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(program);
                        }}
                    >
                        Edit
                    </Button>
                    <Button
                        size='sm'
                        variant='ghost'
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(program.uuid);
                        }}
                        className='text-destructive hover:text-destructive'
                    >
                        <Trash2 className='h-4 w-4' />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}

function truncate(value: string, length: number): string {
    if (value.length <= length) return value;
    return `${value.slice(0, length)}…`;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        maximumFractionDigits: 0,
    }).format(value);
}

export default ProgramsList;