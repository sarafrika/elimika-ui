'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import Spinner from '@/components/ui/spinner';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PenIcon, Square, TrashIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { deleteAssessmentRubricMutation, searchAssessmentRubricsQueryKey } from '../../../../../services/client/@tanstack/react-query.gen';
import { AddRubricForm, RubricFormValues, Visibility } from '../../_components/rubric-management-form';
import { useRubricsWithCriteriaAndScoring } from './rubric-chaining';

export default function RubricsCreationPage() {
    const searchParams = useSearchParams();
    const courseId = searchParams.get('id');

    const instructor = useInstructor();
    const queryClient = useQueryClient();
    const { replaceBreadcrumbs } = useBreadcrumb();

    useEffect(() => {
        if (!courseId) return;

        replaceBreadcrumbs([
            { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
            {
                id: 'course-management',
                title: 'Course Management',
                url: '/dashboard/course-management/drafts',
            },
            {
                id: 'rubrics',
                title: 'Rubrics',
                url: `/dashboard/course-management/add-rubrics?id=${courseId}`,
                isLast: true,
            },
        ]);
    }, [courseId, replaceBreadcrumbs]);


    const { rubricsWithDetails, isLoading: rubricDataIsLoading, isError } = useRubricsWithCriteriaAndScoring(instructor?.uuid);

    console.log('rubricsWithDetails', rubricsWithDetails);


    const [rubrics, setRubrics] = useState(rubricsWithDetails || []);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRubric, setEditingRubric] = useState<RubricFormValues | null>(null);
    const [editingRubricId, setEditingRubricId] = useState<string | null>(null);

    const openAddModal = () => {
        setEditingRubric(null);
        setEditingRubricId(null);
        setModalOpen(true);
    };

    const openEditModal = (rubricId: string) => {
        const rubricItem = rubricsWithDetails.find((r) => r.rubric.uuid === rubricId);
        if (!rubricItem) return;

        const rubric = rubricItem.rubric;
        const criteria = rubricItem.criteria ?? [];

        setEditingRubric({
            title: rubric.title,
            description: rubric.description,
            type: rubric.rubric_type,
            visibility: rubric.is_public ? Visibility.Public : Visibility.Private,
            components: criteria.map((c) => ({
                name: c.component_name,
                grading: c.scoring.map((s: any) => ({
                    name: s.performance_expectation,
                    description: s.description,
                    points: parseInt(s.score_range),
                })),
            })),
        });

        setEditingRubricId(rubricId);
        setModalOpen(true);
    };

    const deleteAssessment = useMutation(deleteAssessmentRubricMutation());

    const [rubricToDelete, setRubricToDelete] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const handleAskDeleteRubric = (rubricId: string) => {
        setRubricToDelete(rubricId);
        setDeleteModalOpen(true);
    };

    const confirmDeleteRubric = () => {
        if (!rubricToDelete) return;
        // Optimistic UI update
        setRubrics((prev) => prev.filter((r) => r.rubric.uuid !== rubricToDelete));

        deleteAssessment.mutate(
            { path: { uuid: rubricToDelete } },
            {
                onSuccess: () => {
                    toast.success('Rubric deleted successfully.');
                    queryClient.invalidateQueries({
                        queryKey: searchAssessmentRubricsQueryKey({
                            query: {
                                searchParams: { instructor_uuid_eq: instructor?.uuid as string }, pageable: {}
                            }
                        })
                    });
                },
                onError: () => {
                    toast.error('Failed to delete rubric.');
                },
                onSettled: () => {
                    setDeleteModalOpen(false);
                    setRubricToDelete(null);
                },
            }
        );
    };

    const handleFormSubmit = (values: RubricFormValues) => {
        if (editingRubricId) {
            setRubrics((prev: any) =>
                prev.map((r: any) =>
                    r.uuid === editingRubricId
                        ? { ...r, ...values }
                        : r
                )
            );
            toast.success('Rubric updated');
        } else {
            setRubrics((prev: any) => [
                ...prev,
                {
                    uuid: (prev.length + 1).toString(),
                    ...values,
                },
            ]);
            toast.success('Rubric created');
        }
        setModalOpen(false);
    };

    const isLoading = false

    return (
        <div className="space-y-6">
            <div className="mb-6 flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Your Rubrics</h1>
                    <p className="text-muted-foreground mt-1 text-base">
                        You have {rubrics.length} rubric{rubrics.length !== 1 ? 's' : ''} created.
                    </p>
                </div>
                {/* <Button type="button" onClick={openAddModal} className="px-4 py-2 text-sm cursor-pointer">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    New Rubric
                </Button> */}
            </div>

            {rubricsWithDetails.length === 0 ? (
                <div className="bg-muted/20 rounded-md border py-12 text-center">
                    <p className="text-muted-foreground mt-2">No rubrics created yet.</p>
                    <Button className="mt-4" onClick={openAddModal}>
                        Create Your First Rubric
                    </Button>
                </div>
            ) : (
                <div className="rounded-t-lg border border-gray-200 overflow-hidden">
                    <Table>
                        <TableCaption className="py-4">A list of your rubrics</TableCaption>

                        <TableHeader className="bg-muted">
                            <TableRow>
                                <TableHead className="w-4 text-center">
                                    <Square
                                        size={20}
                                        strokeWidth={1}
                                        className="mx-auto text-muted-foreground"
                                    />
                                </TableHead>
                                <TableHead className="w-[300px]">Title</TableHead>
                                <TableHead className="w-[200px]">Component</TableHead>
                                <TableHead>Grading</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="py-6">
                                        <div className="flex w-full items-center justify-center">
                                            <Spinner />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {rubricsWithDetails.map((rubricItem: any) => {
                                        const rubric = rubricItem.rubric;
                                        const criteriaList = rubricItem.criteria ?? [];

                                        return (
                                            <React.Fragment key={rubric.uuid}>
                                                <TableRow>
                                                    {/* Checkbox */}
                                                    <TableCell rowSpan={criteriaList.length} className="w-4 text-center align-top">
                                                        <Square size={20} strokeWidth={1} className="mx-auto text-muted-foreground" />
                                                    </TableCell>

                                                    {/* Title */}
                                                    <TableCell rowSpan={criteriaList.length} className="font-medium align-top">
                                                        <div className="flex flex-col gap-1">
                                                            <div>{rubric.title}</div>
                                                            <div className="text-sm text-muted-foreground">{rubric.description}</div>
                                                        </div>
                                                    </TableCell>

                                                    {/* First criteria/component */}
                                                    <TableCell className="align-top">
                                                        {criteriaList[0]?.component_name}
                                                    </TableCell>

                                                    {/* First criteria's scoring */}
                                                    <TableCell className="align-top">
                                                        <div className="space-y-2">
                                                            {criteriaList[0]?.scoring?.map((score: any, i: number) => (
                                                                <div key={i} className="border-b pb-2 last:border-none last:pb-0">
                                                                    <div className="text-sm font-medium">
                                                                        {score.performance_expectation}: {score.score_range}
                                                                    </div>
                                                                    {score.description && (
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {score.description}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </TableCell>

                                                    {/* Actions */}
                                                    <TableCell rowSpan={criteriaList.length} className="text-center align-top">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" aria-label="Actions">
                                                                    <svg
                                                                        width="15"
                                                                        height="15"
                                                                        viewBox="0 0 15 15"
                                                                        fill="none"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        className="h-4 w-4"
                                                                    >
                                                                        <path
                                                                            d="M8.625 2.5C8.625 3.12132 8.12132 3.625 7.5 3.625C6.87868 3.625 6.375 3.12132 6.375 2.5C6.375 1.87868 6.87868 1.375 7.5 1.375C8.12132 1.375 8.625 1.87868 8.625 2.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM7.5 13.625C8.12132 13.625 8.625 13.1213 8.625 12.5C8.625 11.8787 8.12132 11.375 7.5 11.375C6.87868 11.375 6.375 11.8787 6.375 12.5C6.375 13.1213 6.87868 13.625 7.5 13.625Z"
                                                                            fill="currentColor"
                                                                            fillRule="evenodd"
                                                                            clipRule="evenodd"
                                                                        ></path>
                                                                    </svg>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => openEditModal(rubric.uuid)}>
                                                                    <PenIcon className="mr-2 h-4 w-4" />
                                                                    Edit Rubric
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    variant="destructive"
                                                                    onClick={() => handleAskDeleteRubric(rubric.uuid)}
                                                                >
                                                                    <TrashIcon className="mr-2 h-4 w-4" />
                                                                    Delete Rubric
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>

                                                {/* Remaining Criteria Rows */}
                                                {criteriaList.slice(1).map((criteria: any, idx: number) => (
                                                    <TableRow key={`${rubric.uuid}-criteria-${idx}`}>
                                                        <TableCell className="align-top">
                                                            {criteria.component_name}
                                                        </TableCell>
                                                        <TableCell className="align-top">
                                                            <div className="space-y-2">
                                                                {criteria.scoring?.map((score: any, i: number) => (
                                                                    <div key={i} className="border-b pb-2 last:border-none last:pb-0">
                                                                        <div className="text-sm font-medium">
                                                                            {score.performance_expectation}: {score.score_range}
                                                                        </div>
                                                                        {score.description && (
                                                                            <div className="text-sm text-muted-foreground">
                                                                                {score.description}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}

                                </>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="flex max-w-6xl flex-col p-0">
                    <DialogHeader className="border-b px-6 py-4">
                        <DialogTitle className="text-xl">
                            {editingRubricId ? 'Edit Rubric' : 'Add New Rubric'}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm">
                            Create a new rubric by providing its title, description, and grading criteria
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[calc(90vh-8rem)]">
                        <AddRubricForm
                            onCancel={() => setModalOpen(false)}
                            // onSubmitSuccess={handleFormSubmit}
                            defaultValues={editingRubric || undefined}
                            className="px-6 pb-6"
                            courseId={courseId as string}
                            rubricId={editingRubricId as string}
                        />
                    </ScrollArea>
                </DialogContent>
            </Dialog>


            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Rubric</DialogTitle>
                        <DialogDescription className='my-2' >
                            Are you sure you want to delete this rubric? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" className='min-w-[100px]' onClick={confirmDeleteRubric}>
                            {deleteAssessment.isPending ? <Spinner /> : "Delete"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
